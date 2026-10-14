using System.Text;
using System.Text.Json;

namespace Klipski;

/// Combinazione globale: modificatori MOD_* di Windows e virtual key.
readonly record struct HotKeyCombo(uint Modifiers, uint Vk)
{
    public static readonly HotKeyCombo Default = new(Native.MOD_CONTROL | Native.MOD_SHIFT, 0x56); // Ctrl+Shift+V

    public override string ToString()
    {
        var parts = new List<string>();
        if ((Modifiers & Native.MOD_CONTROL) != 0) parts.Add("Ctrl");
        if ((Modifiers & Native.MOD_ALT) != 0) parts.Add("Alt");
        if ((Modifiers & Native.MOD_SHIFT) != 0) parts.Add("Shift");
        if ((Modifiers & Native.MOD_WIN) != 0) parts.Add("Win");
        parts.Add(KeyName(Vk));
        return string.Join("+", parts);
    }

    private static string KeyName(uint vk)
    {
        if (vk is >= 0x30 and <= 0x39 or >= 0x41 and <= 0x5A) return ((char)vk).ToString();
        var scan = Native.MapVirtualKey(vk, 0);
        // Frecce, Ins, Canc, Home, Fine, Pag: tasti estesi.
        if (vk is >= 0x21 and <= 0x2E) scan |= 0x100;
        var buffer = new StringBuilder(64);
        return Native.GetKeyNameText((int)(scan << 16), buffer, buffer.Capacity) > 0 ? buffer.ToString() : $"#{vk}";
    }
}

/// Preferenze (l'equivalente di UserDefaults su Mac), in settings.json. Default come in AppDelegate.init.
sealed class Settings
{
    public int TextLimit { get; set; } = 50;
    public int ImageLimit { get; set; } = 10;
    public bool AutoPaste { get; set; } = true;
    public uint HotKeyModifiers { get; set; } = HotKeyCombo.Default.Modifiers;
    public uint HotKeyVk { get; set; } = HotKeyCombo.Default.Vk;
    public string? Language { get; set; }

    [System.Text.Json.Serialization.JsonIgnore]
    public HotKeyCombo HotKey
    {
        get => new(HotKeyModifiers, HotKeyVk);
        set
        {
            HotKeyModifiers = value.Modifiers;
            HotKeyVk = value.Vk;
        }
    }

    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true,
        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    private static string FilePath => AppPaths.File("settings.json");

    public static Settings Load()
    {
        Settings settings;
        try
        {
            settings = System.IO.File.Exists(FilePath)
                ? JsonSerializer.Deserialize<Settings>(System.IO.File.ReadAllBytes(FilePath), Options) ?? new Settings()
                : new Settings();
        }
        catch (JsonException)
        {
            settings = new Settings();
        }
        settings.TextLimit = Math.Max(settings.TextLimit, 1);
        settings.ImageLimit = Math.Max(settings.ImageLimit, 1);
        return settings;
    }

    public void Save()
    {
        AppPaths.EnsureDirectory(AppPaths.SupportDirectory);
        AppPaths.WriteAtomic(FilePath, JsonSerializer.SerializeToUtf8Bytes(this, Options));
    }
}
