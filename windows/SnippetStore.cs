using System.Text.Json;
using System.Text.Json.Serialization;

namespace Klipski;

sealed class Snippet
{
    [JsonPropertyName("title")] public string Title { get; set; } = "";
    [JsonPropertyName("content")] public string Content { get; set; } = "";
}

sealed class SnippetFolder
{
    [JsonPropertyName("name")] public string Name { get; set; } = "";
    [JsonPropertyName("snippets")] public List<Snippet> Snippets { get; set; } = new();
}

/// Cartelle di snippet in snippets.json, stesso formato di SnippetStore.swift.
sealed class SnippetStore
{
    public List<SnippetFolder> Folders { get; private set; } = new();

    private static string FilePath => AppPaths.File("snippets.json");
    private static readonly JsonSerializerOptions Options = new() { WriteIndented = true, Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping };

    public SnippetStore()
    {
        AppPaths.EnsureDirectory(AppPaths.SupportDirectory);
        Load();
    }

    public void ReplaceAll(List<SnippetFolder> folders)
    {
        Folders = folders;
        Save();
    }

    /// Restituisce false se il file esiste ma non è decodificabile (JSON malformato).
    private bool Load()
    {
        if (File.Exists(FilePath))
        {
            byte[] data;
            try { data = File.ReadAllBytes(FilePath); } catch (IOException) { return false; }
            try
            {
                if (JsonSerializer.Deserialize<List<SnippetFolder>>(data) is { } folders && IsFolderList(data))
                {
                    Folders = folders;
                    return true;
                }
                // Migrazione dal vecchio formato (lista piatta di snippet).
                if (JsonSerializer.Deserialize<List<Snippet>>(data) is { } flat)
                {
                    Folders = new List<SnippetFolder> { new() { Name = Loc.L("Generale"), Snippets = flat } };
                    Save();
                    return true;
                }
            }
            catch (JsonException) { }
            return false;
        }
        // Primo avvio: cartella di esempio.
        Folders = new List<SnippetFolder>
        {
            new()
            {
                Name = Loc.L("Esempi"),
                Snippets =
                {
                    new Snippet { Title = Loc.L("Email"), Content = "martin.trajkovski@dieffe.tech" },
                    new Snippet { Title = Loc.L("Saluto"), Content = Loc.L("Buongiorno,\n\ngrazie per il messaggio.") },
                    new Snippet { Title = Loc.L("Lorem"), Content = "Lorem ipsum dolor sit amet, consectetur adipiscing elit." }
                }
            }
        };
        Save();
        return true;
    }

    // Come JSONDecoder: una cartella deve avere "name" e "snippets", altrimenti è il formato vecchio.
    private static bool IsFolderList(byte[] data)
    {
        using var doc = JsonDocument.Parse(data);
        return doc.RootElement.EnumerateArray().All(e => e.TryGetProperty("name", out _) && e.TryGetProperty("snippets", out _));
    }

    public void Save()
    {
        try
        {
            AppPaths.WriteAtomic(FilePath, JsonSerializer.SerializeToUtf8Bytes(Folders, Options));
        }
        catch (IOException) { }
    }
}
