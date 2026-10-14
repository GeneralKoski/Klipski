using System.Text;
using System.Text.Json;

namespace Klipski;

enum ClipKind { Text, Image }

sealed class ClipItem
{
    public Guid Id;
    public ClipKind Kind;
    public string? Text;
    public string? ImageFile;
    public long Hash;
    public DateTime CreatedAt;
    public bool? Concealed;
}

/// Cronologia come HistoryStore.swift: history.json con lo stesso schema del Mac, immagini PNG in images\.
sealed class HistoryStore
{
    public List<ClipItem> Items { get; private set; } = new();
    public int TextLimit { get; private set; }
    public int ImageLimit { get; private set; }

    public IEnumerable<ClipItem> TextItems => Items.Where(i => i.Kind == ClipKind.Text);
    public IEnumerable<ClipItem> ImageItems => Items.Where(i => i.Kind == ClipKind.Image);

    private static string FilePath => AppPaths.File("history.json");

    public HistoryStore(int textLimit, int imageLimit)
    {
        TextLimit = textLimit;
        ImageLimit = imageLimit;
        AppPaths.EnsureDirectory(AppPaths.SupportDirectory);
        AppPaths.EnsureDirectory(AppPaths.ImagesDirectory);
        Load();
    }

    // MARK: - Aggiunta

    public void AddText(string text, bool concealed = false)
    {
        if (text.Length == 0) return;
        var h = StableHash(Encoding.UTF8.GetBytes(text));
        Items.RemoveAll(i => i.Kind == ClipKind.Text && i.Hash == h && i.Text == text);
        Items.Insert(0, new ClipItem { Id = Guid.NewGuid(), Kind = ClipKind.Text, Text = text, Hash = h, CreatedAt = DateTime.Now, Concealed = concealed });
        Trim();
        Save();
    }

    public void AddImage(byte[] png)
    {
        var h = StableHash(png);
        var existing = Items.FirstOrDefault(i => i.Kind == ClipKind.Image && i.Hash == h);
        if (existing != null)
        {
            // già presente: spostalo in cima aggiornando il timestamp
            Items.Remove(existing);
            Items.Insert(0, new ClipItem { Id = existing.Id, Kind = ClipKind.Image, ImageFile = existing.ImageFile, Hash = existing.Hash, CreatedAt = DateTime.Now });
            Save();
            return;
        }
        var filename = $"{Guid.NewGuid().ToString().ToUpperInvariant()}.png";
        try
        {
            File.WriteAllBytes(Path.Combine(AppPaths.ImagesDirectory, filename), png);
        }
        catch (IOException)
        {
            return;
        }
        Items.Insert(0, new ClipItem { Id = Guid.NewGuid(), Kind = ClipKind.Image, ImageFile = filename, Hash = h, CreatedAt = DateTime.Now });
        Trim();
        Save();
    }

    // MARK: - Accesso

    public void UpdateLimits(int textLimit, int imageLimit)
    {
        TextLimit = Math.Max(textLimit, 1);
        ImageLimit = Math.Max(imageLimit, 1);
        Trim();
        Save();
    }

    public string? ImagePath(ClipItem item) =>
        item.ImageFile == null ? null : Path.Combine(AppPaths.ImagesDirectory, item.ImageFile);

    public void Clear()
    {
        foreach (var item in Items.Where(i => i.Kind == ClipKind.Image)) DeleteImage(item);
        Items.Clear();
        Save();
    }

    // MARK: - Privato

    private void Trim()
    {
        int texts = 0, images = 0;
        var kept = new List<ClipItem>();
        foreach (var item in Items)
        {
            if (item.Kind == ClipKind.Text)
            {
                if (texts++ < TextLimit) kept.Add(item);
            }
            else if (images++ < ImageLimit) kept.Add(item);
            else DeleteImage(item);
        }
        Items = kept;
    }

    private void DeleteImage(ClipItem item)
    {
        if (ImagePath(item) is { } path)
        {
            try { File.Delete(path); } catch (IOException) { }
        }
    }

    // Date come JSONEncoder di Swift: secondi dal 1° gennaio 2001 (UTC).
    private static readonly DateTime ReferenceDate = new(2001, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private void Load()
    {
        if (!File.Exists(FilePath)) return;
        try
        {
            using var doc = JsonDocument.Parse(File.ReadAllBytes(FilePath));
            Items = doc.RootElement.EnumerateArray().Select(e => new ClipItem
            {
                Id = Guid.Parse(e.GetProperty("id").GetString()!),
                Kind = e.GetProperty("kind").GetString() == "image" ? ClipKind.Image : ClipKind.Text,
                Text = e.TryGetProperty("text", out var t) && t.ValueKind == JsonValueKind.String ? t.GetString() : null,
                ImageFile = e.TryGetProperty("imageFile", out var f) && f.ValueKind == JsonValueKind.String ? f.GetString() : null,
                Hash = e.GetProperty("hash").GetInt64(),
                CreatedAt = ReferenceDate.AddSeconds(e.GetProperty("createdAt").GetDouble()).ToLocalTime(),
                Concealed = e.TryGetProperty("concealed", out var c) && c.ValueKind is JsonValueKind.True or JsonValueKind.False ? c.GetBoolean() : null
            }).ToList();
        }
        catch (Exception e) when (e is JsonException or FormatException or InvalidOperationException or KeyNotFoundException)
        {
            Items = new List<ClipItem>();
        }
    }

    private void Save()
    {
        using var stream = new MemoryStream();
        using (var w = new Utf8JsonWriter(stream, new JsonWriterOptions { Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping }))
        {
            w.WriteStartArray();
            foreach (var item in Items)
            {
                w.WriteStartObject();
                w.WriteString("id", item.Id.ToString().ToUpperInvariant());
                w.WriteString("kind", item.Kind == ClipKind.Image ? "image" : "text");
                if (item.Text != null) w.WriteString("text", item.Text);
                if (item.ImageFile != null) w.WriteString("imageFile", item.ImageFile);
                w.WriteNumber("hash", item.Hash);
                w.WriteNumber("createdAt", (item.CreatedAt.ToUniversalTime() - ReferenceDate).TotalSeconds);
                if (item.Concealed is { } concealed) w.WriteBoolean("concealed", concealed);
                w.WriteEndObject();
            }
            w.WriteEndArray();
        }
        try
        {
            AppPaths.WriteAtomic(FilePath, stream.ToArray());
        }
        catch (IOException) { }
    }

    /// Stesso hash djb2 (variante xor) del Mac, con overflow a 64 bit.
    public static long StableHash(IEnumerable<byte> bytes)
    {
        long h = 5381;
        foreach (var b in bytes) h = unchecked(h * 33) ^ b;
        return h;
    }
}
