using System.Windows;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;

namespace Klipski;

/// Equivalente di AppDelegate: costruisce il menu e gestisce le azioni.
sealed class AppController
{
    private readonly MenuController menu = new();
    private ClipboardService? clipboard;
    private MessageWindow? messages;
    private SettingsWindow? settings;

    public readonly Settings Settings = Settings.Load();
    public readonly HistoryStore History;
    public readonly SnippetStore Snippets;
    public bool HotKeyRegistered { get; private set; } = true;

    public AppController(string? language)
    {
        Loc.Load(language ?? Settings.Language);
        History = new HistoryStore(Settings.TextLimit, Settings.ImageLimit);
        Snippets = new SnippetStore();
    }

    /// Avvia appunti, scorciatoia globale e icona nella tray (non in modalità --snapshot).
    public void Start()
    {
        clipboard = new ClipboardService(History);
        messages = new MessageWindow { HotKeyPressed = ShowMenu, TrayClicked = ShowMenu };
        clipboard.OnChange = messages.FlashTray;
        clipboard.Start();
        messages.AddTrayIcon();
        Application.Current.Exit += (_, _) => messages.RemoveTrayIcon();
        Paster.StartTracking();
        HotKeyRegistered = messages.RegisterHotKey(Settings.HotKey);
        if (!HotKeyRegistered) messages.ShowBalloon(Loc.L("%@ è già usata da un'altra app: scegline un'altra.", Settings.HotKey));
    }

    public void ShowMenu()
    {
        Paster.RememberForeground();
        menu.Show(BuildMenu);
    }

    // MARK: - Menu (come AppDelegate.menuNeedsUpdate)

    public List<MenuEntry> BuildMenu()
    {
        var entries = new List<MenuEntry> { TextMenu(), ImageMenu(), MenuEntry.Divider };
        entries.AddRange(SnippetFolders());
        entries.Add(MenuEntry.Divider);
        entries.Add(new MenuEntry { Title = Loc.L("Incolla automaticamente"), Checked = Settings.AutoPaste, Action = ToggleAutoPaste });
        entries.Add(new MenuEntry { Title = Loc.L("Avvia al login"), Checked = LoginItem.IsEnabled, Action = () => LoginItem.SetEnabled(!LoginItem.IsEnabled) });
        entries.Add(MenuEntry.Divider);
        entries.Add(new MenuEntry { Title = Loc.L("Personalizza…"), Action = OpenCustomizer });
        entries.Add(new MenuEntry { Title = Loc.L("Pulisci cronologia"), Action = History.Clear });
        entries.Add(new MenuEntry { Title = Loc.L("Esci"), Shortcut = "Ctrl+Q", ShortcutKey = Key.Q, Action = Quit });
        return entries;
    }

    private MenuEntry TextMenu()
    {
        var texts = History.TextItems.ToList();
        return new MenuEntry
        {
            Title = Loc.L("Testi (%d)", texts.Count),
            Searchable = true,
            Submenu = query =>
            {
                var q = query.Trim().ToLowerInvariant();
                var filtered = q.Length == 0 ? texts : texts.Where(i => (i.Text ?? "").ToLowerInvariant().Contains(q)).ToList();
                if (filtered.Count == 0)
                    return new List<MenuEntry> { new() { Title = q.Length == 0 ? Loc.L("Vuoto") : Loc.L("Nessun risultato"), Enabled = false } };
                return filtered.Select(item => new MenuEntry
                {
                    // Elemento riservato (es. password): titolo oscurato, il contenuto si incolla normalmente.
                    Title = item.Concealed == true ? MaskedTitle(item.Text ?? "") : Truncate(item.Text ?? ""),
                    Detail = RelativeTime.Format(item.CreatedAt),
                    Action = () => SelectHistoryItem(item)
                }).ToList();
            }
        };
    }

    private MenuEntry ImageMenu()
    {
        var images = History.ImageItems.Select(item => (item, path: History.ImagePath(item)!))
            .Where(i => File.Exists(i.path)).ToList();
        return new MenuEntry
        {
            Title = Loc.L("Immagini (%d)", images.Count),
            Submenu = _ => images.Count == 0
                ? new List<MenuEntry> { new() { Title = Loc.L("Vuoto"), Enabled = false } }
                : images.Select(i => new MenuEntry
                {
                    Title = Loc.L("Immagine"),
                    Detail = RelativeTime.Format(i.item.CreatedAt),
                    Thumbnail = ImageCache.Thumbnail(i.path),
                    Preview = () => ImageCache.Load(i.path),
                    Action = () => SelectHistoryItem(i.item)
                }).ToList()
        };
    }

    private IEnumerable<MenuEntry> SnippetFolders()
    {
        if (Snippets.Folders.Count == 0)
            return new[] { new MenuEntry { Title = Loc.L("Nessuno snippet (crea da Personalizza…)"), Enabled = false } };
        return Snippets.Folders.Select(folder => new MenuEntry
        {
            Title = folder.Name,
            Submenu = _ => folder.Snippets.Count == 0
                ? new List<MenuEntry> { new() { Title = Loc.L("Vuota"), Enabled = false } }
                : folder.Snippets.Select(snippet => new MenuEntry { Title = snippet.Title, Action = () => SelectSnippet(snippet) }).ToList()
        });
    }

    // MARK: - Azioni

    private void SelectHistoryItem(ClipItem item)
    {
        if (item.Kind == ClipKind.Text)
        {
            clipboard?.SetText(item.Text ?? "");
            History.AddText(item.Text ?? "", item.Concealed ?? false);
        }
        else if (History.ImagePath(item) is { } path && File.Exists(path))
        {
            var data = File.ReadAllBytes(path);
            clipboard?.SetImage(data);
            History.AddImage(data);
        }
        Paster.Restore(Settings.AutoPaste);
    }

    private void SelectSnippet(Snippet snippet)
    {
        clipboard?.SetText(snippet.Content);
        History.AddText(snippet.Content);
        Paster.Restore(Settings.AutoPaste);
    }

    private void ToggleAutoPaste()
    {
        Settings.AutoPaste = !Settings.AutoPaste;
        Settings.Save();
    }

    public void OpenCustomizer()
    {
        if (settings == null)
        {
            settings = new SettingsWindow(this);
            settings.Closed += (_, _) => settings = null;
        }
        settings.Show();
        settings.Activate();
    }

    /// Lingua applicata subito (nil = automatica): niente riavvio, menu e finestra si ricostruiscono.
    public void SetLanguage(string? code)
    {
        Settings.Language = code;
        Settings.Save();
        Loc.Load(code);
        settings?.Close();
        OpenCustomizer();
    }

    public void SetLimits(int textLimit, int imageLimit)
    {
        History.UpdateLimits(textLimit, imageLimit);
        Settings.TextLimit = History.TextLimit;
        Settings.ImageLimit = History.ImageLimit;
        Settings.Save();
    }

    /// Registra la nuova scorciatoia; se è occupata rimette la precedente e restituisce false.
    public bool SetHotKey(HotKeyCombo combo)
    {
        if (messages == null) return false;
        if (!messages.RegisterHotKey(combo))
        {
            HotKeyRegistered = messages.RegisterHotKey(Settings.HotKey);
            return false;
        }
        Settings.HotKey = combo;
        Settings.Save();
        HotKeyRegistered = true;
        return true;
    }

    /// Durante la registrazione la scorciatoia attuale va liberata, se no la intercetta Windows.
    public void SuspendHotKey(bool suspend)
    {
        if (messages == null) return;
        if (suspend) messages.UnregisterHotKey();
        else HotKeyRegistered = messages.RegisterHotKey(Settings.HotKey);
    }

    public void SaveSnippets() => Snippets.Save();

    // MARK: - Backup (stesso formato del Mac)

    public void ExportData(Window owner)
    {
        var dialog = new Microsoft.Win32.SaveFileDialog { FileName = "Klipski-backup.json", Filter = "JSON|*.json", DefaultExt = ".json" };
        if (dialog.ShowDialog(owner) != true) return;
        try
        {
            File.WriteAllBytes(dialog.FileName, KlipskiBackup.From(Snippets.Folders, Settings).Serialize());
        }
        catch (Exception e) when (e is IOException or UnauthorizedAccessException)
        {
            Dialog.Message(owner, Loc.L("Esportazione fallita"), e.Message);
        }
    }

    /// Restituisce true se il ripristino è andato a buon fine (la finestra va ricaricata).
    public bool ImportData(Window owner)
    {
        var dialog = new Microsoft.Win32.OpenFileDialog { Filter = "JSON|*.json", Title = Loc.L("Seleziona un file Klipski-backup.json") };
        if (dialog.ShowDialog(owner) != true) return false;
        KlipskiBackup? backup = null;
        try
        {
            backup = KlipskiBackup.Parse(File.ReadAllBytes(dialog.FileName));
        }
        catch (Exception e) when (e is IOException or UnauthorizedAccessException) { }
        if (backup == null)
        {
            Dialog.Message(owner, Loc.L("Importazione fallita"), Loc.L("Il file non è un backup di Klipski valido."));
            return false;
        }
        Snippets.ReplaceAll(backup.Snippets);
        Settings.AutoPaste = backup.AutoPaste;
        SetLimits(backup.TextLimit, backup.ImageLimit);
        if (backup.WindowsHotKey() is { } combo) SetHotKey(combo);
        Dialog.Message(owner, Loc.L("Importazione completata"), Loc.L("Snippet e impostazioni ripristinati."));
        return true;
    }

    public void Quit()
    {
        menu.CloseAll();
        Application.Current.Shutdown();
    }

    // MARK: - Helper

    /// Oscura un elemento riservato lasciando la prima e l'ultima lettera come riferimento.
    private static string MaskedTitle(string text)
    {
        if (text.Length <= 2) return new string('•', Math.Max(text.Length, 1));
        return $"{text[0]}{new string('•', Math.Min(text.Length - 2, 10))}{text[^1]}";
    }

    private static string Truncate(string text, int max = 50)
    {
        var oneLine = text.Replace("\r\n", " ").Replace("\n", " ").Trim();
        return oneLine.Length <= max ? oneLine : oneLine[..max] + "…";
    }
}

/// Miniature (in cache: i file delle immagini non cambiano mai) e immagini intere per l'anteprima.
static class ImageCache
{
    private static readonly Dictionary<string, BitmapSource?> thumbnails = new();

    public static BitmapSource? Thumbnail(string path)
    {
        if (thumbnails.TryGetValue(path, out var cached)) return cached;
        // Lato lungo a 96 px: nitida fino al 200% di scala per una miniatura da 48.
        var (width, height) = PngSize(path);
        var thumbnail = Decode(path, width >= height ? Math.Min(96, width) : 0, width < height ? Math.Min(96, height) : 0);
        thumbnails[path] = thumbnail;
        return thumbnail;
    }

    public static BitmapSource? Load(string path) => Decode(path, 0, 0);

    private static BitmapSource? Decode(string path, int width, int height)
    {
        try
        {
            var image = new BitmapImage();
            image.BeginInit();
            image.UriSource = new Uri(path);
            image.CacheOption = BitmapCacheOption.OnLoad;
            if (width > 0) image.DecodePixelWidth = width;
            if (height > 0) image.DecodePixelHeight = height;
            image.EndInit();
            image.Freeze();
            return image;
        }
        catch (Exception e) when (e is IOException or NotSupportedException or FileFormatException or UriFormatException)
        {
            return null;
        }
    }

    private static (int, int) PngSize(string path)
    {
        try
        {
            using var stream = File.OpenRead(path);
            var header = new byte[24];
            if (stream.Read(header, 0, 24) < 24) return (0, 0);
            int Read(int offset) => header[offset] << 24 | header[offset + 1] << 16 | header[offset + 2] << 8 | header[offset + 3];
            return (Read(16), Read(20));
        }
        catch (IOException)
        {
            return (0, 0);
        }
    }
}
