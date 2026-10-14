using System.Text;
using System.Text.Json;

namespace Klipski;

static class Tests
{
    private static int failures;

    static int Main()
    {
        var root = Path.Combine(Path.GetTempPath(), "klipski-tests-" + Guid.NewGuid().ToString("N")[..8]);
        try
        {
            Run(root, "hash identico al Mac", HashMatchesSwift);
            Run(root, "deduplica testi", TextDedupe);
            Run(root, "limiti testi", TextLimit);
            Run(root, "deduplica e limiti immagini", Images);
            Run(root, "persistenza cronologia", HistoryRoundTrip);
            Run(root, "history.json scritto dal Mac", MacHistory);
            Run(root, "pulisci cronologia", ClearHistory);
            Run(root, "snippet: primo avvio e round-trip", SnippetsRoundTrip);
            Run(root, "snippet: migrazione dal formato piatto", SnippetsMigration);
            Run(root, "impostazioni: default e round-trip", SettingsRoundTrip);
            Run(root, "backup: esportazione in formato Mac", BackupExport);
            Run(root, "backup: importazione di un file del Mac", BackupFromMac);
            Run(root, "backup: file non validi", BackupInvalid);
            Run(root, "backup: scorciatoie andata e ritorno", BackupHotKeys);
        }
        finally
        {
            Directory.Delete(root, recursive: true);
        }
        Console.WriteLine(failures == 0 ? "TUTTI I TEST OK" : $"{failures} CONTROLLI FALLITI");
        return failures == 0 ? 0 : 1;
    }

    private static void Run(string root, string name, Action test)
    {
        AppPaths.SupportDirectory = Path.Combine(root, name.Replace(' ', '-').Replace(':', '-'));
        Directory.CreateDirectory(AppPaths.SupportDirectory);
        var before = failures;
        try { test(); }
        catch (Exception e) { Fail($"eccezione: {e}"); }
        Console.WriteLine($"{(failures == before ? "ok  " : "FAIL")} {name}");
    }

    private static void Check(bool condition, string what)
    {
        if (!condition) Fail(what);
    }

    private static void Fail(string what)
    {
        failures++;
        Console.WriteLine("     ✗ " + what);
    }

    private static byte[] Png(int seed) => Enumerable.Range(0, 64).Select(i => (byte)(i * seed)).ToArray();

    // MARK: - Cronologia

    private static void HashMatchesSwift()
    {
        // Valori calcolati con l'algoritmo di HistoryStore.swift ((h &* 33) ^ b su Int a 64 bit).
        Check(HistoryStore.StableHash(Encoding.UTF8.GetBytes("hello")) == 210631454183, "hash di \"hello\"");
        Check(HistoryStore.StableHash(Encoding.UTF8.GetBytes("città €")) == 8243105030288457600, "hash UTF-8");
        Check(HistoryStore.StableHash(Enumerable.Repeat(Enumerable.Range(0, 256).Select(i => (byte)i), 50).SelectMany(b => b).ToArray()) == 6273597610915726597, "hash con overflow");
    }

    private static void TextDedupe()
    {
        var h = new HistoryStore(50, 10);
        h.AddText("a");
        h.AddText("b");
        h.AddText("a");
        h.AddText("");
        var texts = h.TextItems.Select(i => i.Text).ToList();
        Check(texts.SequenceEqual(new[] { "a", "b" }), $"attesi [a, b], trovati [{string.Join(", ", texts)}]");
    }

    private static void TextLimit()
    {
        var h = new HistoryStore(3, 10);
        for (var i = 1; i <= 5; i++) h.AddText($"t{i}");
        Check(h.TextItems.Select(i => i.Text).SequenceEqual(new[] { "t5", "t4", "t3" }), "restano i 3 più recenti");
        h.UpdateLimits(0, 0);
        Check(h.TextLimit == 1 && h.ImageLimit == 1, "limite minimo 1 come su Mac");
        Check(h.TextItems.Count() == 1, "riduzione del limite applicata subito");
    }

    private static void Images()
    {
        var h = new HistoryStore(50, 2);
        h.AddImage(Png(1));
        h.AddText("testo in mezzo");
        h.AddImage(Png(1));
        Check(h.ImageItems.Count() == 1, "stessa immagine due volte → una voce");
        Check(h.Items[0].Kind == ClipKind.Image, "l'immagine ripetuta torna in cima");
        Check(Directory.GetFiles(AppPaths.ImagesDirectory).Length == 1, "un solo file PNG");
        h.AddImage(Png(2));
        h.AddImage(Png(3));
        Check(h.ImageItems.Count() == 2, "limite immagini 2");
        Check(Directory.GetFiles(AppPaths.ImagesDirectory).Length == 2, "il file dell'immagine scartata viene cancellato");
        Check(h.TextItems.Count() == 1, "i testi non contano nel limite immagini");
    }

    private static void HistoryRoundTrip()
    {
        var h = new HistoryStore(50, 10);
        h.AddText("riga 1\nriga 2 \"virgolette\" è");
        h.AddText("password", concealed: true);
        h.AddImage(Png(5));
        var reloaded = new HistoryStore(50, 10);
        Check(reloaded.Items.Count == 3, "3 voci dopo la rilettura");
        for (var i = 0; i < Math.Min(3, reloaded.Items.Count); i++)
        {
            var a = h.Items[i];
            var b = reloaded.Items[i];
            Check(a.Id == b.Id && a.Kind == b.Kind && a.Text == b.Text && a.ImageFile == b.ImageFile && a.Hash == b.Hash && a.Concealed == b.Concealed,
                  $"voce {i} identica");
            Check(Math.Abs((a.CreatedAt - b.CreatedAt).TotalMilliseconds) < 1, $"data della voce {i}");
        }
        using var doc = JsonDocument.Parse(File.ReadAllBytes(AppPaths.File("history.json")));
        var first = doc.RootElement[0];
        Check(first.GetProperty("kind").GetString() == "image" && first.GetProperty("imageFile").GetString()!.EndsWith(".png"), "schema immagine");
        Check(first.GetProperty("id").GetString() == first.GetProperty("id").GetString()!.ToUpperInvariant(), "UUID maiuscolo come Swift");
        Check(first.GetProperty("createdAt").ValueKind == JsonValueKind.Number, "createdAt numerico (secondi dal 2001)");
        Check(!File.Exists(AppPaths.File("history.json.tmp")), "nessun file temporaneo rimasto");
    }

    private static void MacHistory()
    {
        // Esempio di history.json come lo scrive JSONEncoder su Mac (concealed assente nelle voci vecchie).
        File.WriteAllText(AppPaths.File("history.json"), """
            [{"id":"6F9619FF-8B86-D011-B42D-00C04FC964FF","kind":"text","text":"ciao","hash":6385123718,"createdAt":782049600},
             {"id":"7F9619FF-8B86-D011-B42D-00C04FC964FF","kind":"text","text":"segreto","hash":1,"createdAt":782049500.25,"concealed":true}]
            """);
        var h = new HistoryStore(50, 10);
        Check(h.Items.Count == 2, "2 voci lette");
        Check(h.Items[0].Text == "ciao" && h.Items[0].Concealed == null, "voce senza concealed");
        Check(h.Items[1].Concealed == true, "voce riservata");
        Check(h.Items[0].CreatedAt.ToUniversalTime() == new DateTime(2025, 10, 13, 12, 0, 0, DateTimeKind.Utc), "data dal riferimento 2001");
    }

    private static void ClearHistory()
    {
        var h = new HistoryStore(50, 10);
        h.AddText("x");
        h.AddImage(Png(7));
        h.Clear();
        Check(h.Items.Count == 0 && Directory.GetFiles(AppPaths.ImagesDirectory).Length == 0, "voci e file cancellati");
        Check(new HistoryStore(50, 10).Items.Count == 0, "vuota anche dopo la rilettura");
    }

    // MARK: - Snippet e impostazioni

    private static void SnippetsRoundTrip()
    {
        var s = new SnippetStore();
        Check(s.Folders.Count == 1 && s.Folders[0].Snippets.Count == 3, "cartella di esempio al primo avvio");
        s.Folders.Add(new SnippetFolder { Name = "Mails", Snippets = { new Snippet { Title = "Firma", Content = "Ciao,\nMartin" } } });
        (s.Folders[0], s.Folders[1]) = (s.Folders[1], s.Folders[0]);
        s.Save();
        var reloaded = new SnippetStore();
        Check(reloaded.Folders.Select(f => f.Name).SequenceEqual(s.Folders.Select(f => f.Name)), "ordine delle cartelle salvato");
        Check(reloaded.Folders[0].Snippets[0].Content == "Ciao,\nMartin", "contenuto multiriga");
        var json = File.ReadAllText(AppPaths.File("snippets.json"));
        Check(json.Contains("\"name\"") && json.Contains("\"snippets\"") && json.Contains("\"title\"") && json.Contains("\"content\""), "chiavi come SnippetStore.swift");
    }

    private static void SnippetsMigration()
    {
        File.WriteAllText(AppPaths.File("snippets.json"), """[{"title":"A","content":"uno"},{"title":"B","content":"due"}]""");
        var s = new SnippetStore();
        Check(s.Folders.Count == 1 && s.Folders[0].Name == "Generale" && s.Folders[0].Snippets.Count == 2, "lista piatta → cartella Generale");
    }

    private static void SettingsRoundTrip()
    {
        var s = Settings.Load();
        Check(s.TextLimit == 50 && s.ImageLimit == 10 && s.AutoPaste && s.HotKey == HotKeyCombo.Default && s.Language == null,
              "default come AppDelegate.init (50, 10, incolla automatico, Ctrl+Shift+V)");
        s.TextLimit = 25;
        s.ImageLimit = 5;
        s.AutoPaste = false;
        s.HotKey = new HotKeyCombo(Native.MOD_ALT | Native.MOD_WIN, 0x4B);
        s.Language = "ja";
        s.Save();
        var r = Settings.Load();
        Check(r.TextLimit == 25 && r.ImageLimit == 5 && !r.AutoPaste && r.HotKey == s.HotKey && r.Language == "ja", "valori riletti");
        File.WriteAllText(AppPaths.File("settings.json"), "{ rotto");
        Check(Settings.Load().TextLimit == 50, "file malformato → default");
    }

    // MARK: - Backup

    private static void BackupExport()
    {
        var settings = new Settings();
        var folders = new List<SnippetFolder> { new() { Name = "Esempi", Snippets = { new Snippet { Title = "Email", Content = "a@b.it" } } } };
        using var doc = JsonDocument.Parse(KlipskiBackup.From(folders, settings).Serialize());
        var r = doc.RootElement;
        Check(r.EnumerateObject().Select(p => p.Name).OrderBy(n => n).SequenceEqual(new[] { "autoPaste", "hotKeyCode", "hotKeyModifiers", "imageLimit", "snippets", "textLimit" }),
              "esattamente i campi di KlipskiBackup");
        Check(r.GetProperty("hotKeyCode").GetInt32() == 9 && r.GetProperty("hotKeyModifiers").GetInt32() == 768, "Ctrl+Shift+V → ⌘⇧V (9, cmdKey|shiftKey)");
        Check(r.GetProperty("textLimit").GetInt32() == 50 && r.GetProperty("imageLimit").GetInt32() == 10 && r.GetProperty("autoPaste").GetBoolean(), "limiti e incolla automatico");
        Check(r.GetProperty("snippets")[0].GetProperty("snippets")[0].GetProperty("content").GetString() == "a@b.it", "snippet");
    }

    private static void BackupFromMac()
    {
        // Come lo scrive JSONEncoder(.prettyPrinted) su Mac: spazi prima dei due punti e "/" con escape.
        var mac = """
            {
              "autoPaste" : false,
              "hotKeyCode" : 40,
              "hotKeyModifiers" : 2304,
              "imageLimit" : 20,
              "snippets" : [
                {
                  "name" : "Lavoro",
                  "snippets" : [
                    {
                      "content" : "https:\/\/klipski.martin-trajkovski.it",
                      "title" : "Sito"
                    }
                  ]
                }
              ],
              "textLimit" : 100
            }
            """;
        var backup = KlipskiBackup.Parse(Encoding.UTF8.GetBytes(mac));
        Check(backup != null, "backup del Mac accettato");
        if (backup == null) return;
        Check(backup.TextLimit == 100 && backup.ImageLimit == 20 && !backup.AutoPaste, "limiti e incolla automatico");
        Check(backup.Snippets[0].Name == "Lavoro" && backup.Snippets[0].Snippets[0].Content == "https://klipski.martin-trajkovski.it", "snippet con / senza escape");
        Check(backup.WindowsHotKey() == new HotKeyCombo(Native.MOD_CONTROL | Native.MOD_ALT, 'K'), "⌘⌥K → Ctrl+Alt+K");
    }

    private static void BackupInvalid()
    {
        Check(KlipskiBackup.Parse(Encoding.UTF8.GetBytes("""{"snippets":[],"textLimit":50,"imageLimit":10,"autoPaste":true,"hotKeyCode":9}""")) == null, "campo mancante → non valido (come JSONDecoder)");
        Check(KlipskiBackup.Parse(Encoding.UTF8.GetBytes("non json")) == null, "testo qualsiasi → non valido");
        Check(KlipskiBackup.Parse(Encoding.UTF8.GetBytes("[]")) == null, "array → non valido");
        var unknownKey = KlipskiBackup.Parse(Encoding.UTF8.GetBytes("""{"snippets":[],"textLimit":50,"imageLimit":10,"autoPaste":true,"hotKeyCode":64,"hotKeyModifiers":256}"""));
        Check(unknownKey != null && unknownKey.WindowsHotKey() == null, "tasto senza equivalente → scorciatoia attuale invariata");
    }

    private static void BackupHotKeys()
    {
        var combos = new[]
        {
            HotKeyCombo.Default,
            new HotKeyCombo(Native.MOD_WIN | Native.MOD_ALT, 0x74),      // Win+Alt+F5
            new HotKeyCombo(Native.MOD_CONTROL, 0xBF),                   // Ctrl+/
            new HotKeyCombo(Native.MOD_SHIFT | Native.MOD_ALT, 0x26),    // Shift+Alt+↑
        };
        foreach (var combo in combos)
        {
            var settings = new Settings { HotKey = combo };
            var back = KlipskiBackup.Parse(KlipskiBackup.From(new List<SnippetFolder>(), settings).Serialize());
            Check(back?.WindowsHotKey() == combo, $"andata e ritorno di {combo.Modifiers:X}+{combo.Vk:X}");
        }
    }
}
