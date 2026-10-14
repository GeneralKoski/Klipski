using System.Text.Json;
using System.Text.Json.Serialization;

namespace Klipski;

/// Klipski-backup.json, stesso schema di KlipskiBackup in AppDelegate.swift, così i backup passano tra Mac e Windows.
/// La scorciatoia è salvata come sul Mac (key code e modificatori Carbon): Ctrl ↔ ⌘, Alt ↔ ⌥, Shift ↔ ⇧, Win ↔ ⌃.
sealed class KlipskiBackup
{
    [JsonPropertyName("snippets")] public List<SnippetFolder> Snippets { get; set; } = new();
    [JsonPropertyName("textLimit")] public int TextLimit { get; set; }
    [JsonPropertyName("imageLimit")] public int ImageLimit { get; set; }
    [JsonPropertyName("autoPaste")] public bool AutoPaste { get; set; }
    [JsonPropertyName("hotKeyCode")] public int HotKeyCode { get; set; }
    [JsonPropertyName("hotKeyModifiers")] public int HotKeyModifiers { get; set; }

    private static readonly string[] Required = { "snippets", "textLimit", "imageLimit", "autoPaste", "hotKeyCode", "hotKeyModifiers" };
    private static readonly JsonSerializerOptions Options = new()
    {
        WriteIndented = true,
        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    private const int CmdKey = 256, ShiftKey = 512, OptionKey = 2048, ControlKey = 4096;
    private const int MacDefaultCode = 9, MacDefaultModifiers = CmdKey | ShiftKey; // ⌘⇧V

    public static KlipskiBackup From(List<SnippetFolder> snippets, Settings settings)
    {
        var (code, modifiers) = ToMac(settings.HotKey) ?? (MacDefaultCode, MacDefaultModifiers);
        return new KlipskiBackup
        {
            Snippets = snippets,
            TextLimit = settings.TextLimit,
            ImageLimit = settings.ImageLimit,
            AutoPaste = settings.AutoPaste,
            HotKeyCode = code,
            HotKeyModifiers = modifiers
        };
    }

    public byte[] Serialize() => JsonSerializer.SerializeToUtf8Bytes(this, Options);

    /// Come JSONDecoder su Mac: null se manca un campo o il file non è un backup valido.
    public static KlipskiBackup? Parse(byte[] data)
    {
        try
        {
            using (var doc = JsonDocument.Parse(data))
            {
                if (doc.RootElement.ValueKind != JsonValueKind.Object) return null;
                if (Required.Any(key => !doc.RootElement.TryGetProperty(key, out _))) return null;
            }
            return JsonSerializer.Deserialize<KlipskiBackup>(data);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    /// La scorciatoia del backup tradotta per Windows; null se il tasto non ha un equivalente.
    public HotKeyCombo? WindowsHotKey()
    {
        var vk = MacToVk.TryGetValue(HotKeyCode, out var v) ? v : 0u;
        uint modifiers = 0;
        if ((HotKeyModifiers & CmdKey) != 0) modifiers |= Native.MOD_CONTROL;
        if ((HotKeyModifiers & ShiftKey) != 0) modifiers |= Native.MOD_SHIFT;
        if ((HotKeyModifiers & OptionKey) != 0) modifiers |= Native.MOD_ALT;
        if ((HotKeyModifiers & ControlKey) != 0) modifiers |= Native.MOD_WIN;
        return vk == 0 || modifiers == 0 ? null : new HotKeyCombo(modifiers, vk);
    }

    private static (int, int)? ToMac(HotKeyCombo combo)
    {
        var code = MacToVk.FirstOrDefault(p => p.Value == combo.Vk);
        if (code.Value == 0) return null;
        var modifiers = 0;
        if ((combo.Modifiers & Native.MOD_CONTROL) != 0) modifiers |= CmdKey;
        if ((combo.Modifiers & Native.MOD_SHIFT) != 0) modifiers |= ShiftKey;
        if ((combo.Modifiers & Native.MOD_ALT) != 0) modifiers |= OptionKey;
        if ((combo.Modifiers & Native.MOD_WIN) != 0) modifiers |= ControlKey;
        return (code.Key, modifiers);
    }

    // Key code macOS (kVK_*, posizione sulla tastiera ANSI) → virtual key di Windows.
    private static readonly Dictionary<int, uint> MacToVk = new()
    {
        [0] = 'A', [11] = 'B', [8] = 'C', [2] = 'D', [14] = 'E', [3] = 'F', [5] = 'G', [4] = 'H', [34] = 'I',
        [38] = 'J', [40] = 'K', [37] = 'L', [46] = 'M', [45] = 'N', [31] = 'O', [35] = 'P', [12] = 'Q', [15] = 'R',
        [1] = 'S', [17] = 'T', [32] = 'U', [9] = 'V', [13] = 'W', [7] = 'X', [16] = 'Y', [6] = 'Z',
        [29] = '0', [18] = '1', [19] = '2', [20] = '3', [21] = '4', [23] = '5', [22] = '6', [26] = '7', [28] = '8', [25] = '9',
        [24] = 0xBB, [27] = 0xBD, [33] = 0xDB, [30] = 0xDD, [39] = 0xDE, [41] = 0xBA, [42] = 0xDC,
        [43] = 0xBC, [47] = 0xBE, [44] = 0xBF, [50] = 0xC0,
        [36] = 0x0D, [48] = 0x09, [49] = 0x20, [51] = 0x08, [53] = 0x1B,
        [122] = 0x70, [120] = 0x71, [99] = 0x72, [118] = 0x73, [96] = 0x74, [97] = 0x75, [98] = 0x76, [100] = 0x77,
        [101] = 0x78, [109] = 0x79, [103] = 0x7A, [111] = 0x7B, [105] = 0x7C, [107] = 0x7D, [113] = 0x7E,
        [114] = 0x2D, [115] = 0x24, [116] = 0x21, [117] = 0x2E, [119] = 0x23, [121] = 0x22,
        [123] = 0x25, [124] = 0x27, [125] = 0x28, [126] = 0x26
    };
}
