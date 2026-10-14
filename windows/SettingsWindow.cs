using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Input;
using System.Windows.Interop;
using System.Windows.Media;

namespace Klipski;

/// Finestra Personalizza…: stessa struttura di SettingsWindowController.swift, in stile Windows 11.
sealed class SettingsWindow : Window
{
    private readonly AppController app;
    private readonly int[] textPresets = { 10, 25, 50, 100, 200 };
    private readonly int[] imagePresets = { 5, 10, 20, 50 };

    private readonly ListBox foldersList = new();
    private readonly ListBox snippetsList = new();
    private readonly TextBox titleField = new();
    private readonly TextBox contentField = new();
    private readonly Button recorder = new();
    private TextBlock? hotKeyHint;
    private bool recording;
    private int? editingFolder, editingSnippet;

    private List<SnippetFolder> Folders => app.Snippets.Folders;
    private int? SelectedFolder => foldersList.SelectedIndex >= 0 ? foldersList.SelectedIndex : null;

    public SettingsWindow(AppController app)
    {
        this.app = app;
        Theme.Refresh();
        Title = Loc.L("Klipski - Preferenze");
        Icon = System.Windows.Media.Imaging.BitmapFrame.Create(new Uri("pack://application:,,,/Klipski.ico"));
        Width = 780;
        SizeToContent = SizeToContent.Height;
        ResizeMode = ResizeMode.CanMinimize;
        WindowStartupLocation = WindowStartupLocation.CenterScreen;
        SetResourceReference(BackgroundProperty, "WindowFill");
        FontFamily = Theme.Font;
        FontSize = 14;
        UseLayoutRounding = true;
        FlowDirection = Loc.RightToLeft ? FlowDirection.RightToLeft : FlowDirection.LeftToRight;
        Content = BuildContent();
        Closed += (_, _) => CommitEditor();
    }

    protected override void OnSourceInitialized(EventArgs e)
    {
        base.OnSourceInitialized(e);
        Backdrop.Apply(this, new WindowInteropHelper(this).Handle, Native.DWMSBT_MAINWINDOW);
    }

    // MARK: - UI

    public FrameworkElement BuildContent()
    {
        var general = new StackPanel();
        general.Children.Add(SettingRow("\uE896", Loc.L("Backup:"), null,
            Row(MakeButton(Loc.L("Esporta dati…"), () => app.ExportData(this)), MakeButton(Loc.L("Importa dati…"), ImportData))));
        general.Children.Add(Divider());
        general.Children.Add(SettingRow("\uE774", Loc.L("Lingua:"), null, LanguagePicker()));
        general.Children.Add(Divider());
        recorder.Click += (_, _) => StartRecording();
        recorder.PreviewKeyDown += RecorderKeyDown;
        recorder.LostKeyboardFocus += (_, _) => StopRecording();
        recorder.MinWidth = 150;
        RefreshRecorder();
        var shortcutRow = SettingRow("\uE765", Loc.L("Scorciatoia apertura:"), Loc.L("(clicca e premi la combinazione, Esc annulla)"), recorder);
        hotKeyHint = shortcutRow.Tag as TextBlock;
        if (!app.HotKeyRegistered) ShowHotKeyError(app.Settings.HotKey);
        general.Children.Add(shortcutRow);
        general.Children.Add(Divider());
        general.Children.Add(SettingRow("\uE81C", Loc.L("Cronologia - elementi mostrati:"), null, Row(
            Label(Loc.L("Testi:")), LimitPicker(textPresets, app.Settings.TextLimit, v => app.SetLimits(v, app.Settings.ImageLimit)),
            Label(Loc.L("Immagini:")), LimitPicker(imagePresets, app.Settings.ImageLimit, v => app.SetLimits(app.Settings.TextLimit, v)))));

        var root = new StackPanel { Margin = new Thickness(20, 16, 20, 20) };
        root.Children.Add(Card(general));
        root.Children.Add(new Border { Height = 12 });
        root.Children.Add(Card(SnippetEditor()));
        ReloadFolders();
        UpdateEditorEnabled(false);
        return root;
    }

    private FrameworkElement SnippetEditor()
    {
        var grid = new Grid { Height = 330 };
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(200) });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(200) });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
        grid.ColumnDefinitions.Add(new ColumnDefinition());

        var folders = Column(Loc.L("Cartelle"), foldersList, Toolbar(
            IconButton("\uE710", null, AddFolder), IconButton("\uE738", null, RemoveFolder),
            IconButton("\uE8AC", Loc.L("Rinomina"), RenameFolder),
            IconButton("\uE70E", null, () => MoveFolder(-1)), IconButton("\uE70D", null, () => MoveFolder(1))));
        var snippets = Column(Loc.L("Snippet"), snippetsList, Toolbar(
            IconButton("\uE710", null, AddSnippet), IconButton("\uE738", null, RemoveSnippet),
            IconButton("\uE70E", null, () => MoveSnippet(-1)), IconButton("\uE70D", null, () => MoveSnippet(1))));

        contentField.AcceptsReturn = true;
        contentField.AcceptsTab = true;
        contentField.TextWrapping = TextWrapping.Wrap;
        contentField.VerticalContentAlignment = VerticalAlignment.Top;
        contentField.Margin = new Thickness(0, 8, 0, 0);
        contentField.Padding = new Thickness(8, 6, 6, 6);
        ScrollViewer.SetVerticalScrollBarVisibility(contentField, ScrollBarVisibility.Auto);
        var editorPanel = new DockPanel { Margin = new Thickness(12, 0, 12, 12) };
        DockPanel.SetDock(titleField, Dock.Top);
        editorPanel.Children.Add(titleField);
        editorPanel.Children.Add(contentField);
        var editor = Column(Loc.L("Titolo / contenuto"), editorPanel, null);

        grid.Children.Add(folders);
        Grid.SetColumn(snippets, 2);
        grid.Children.Add(snippets);
        Grid.SetColumn(editor, 4);
        grid.Children.Add(editor);
        foreach (var column in new[] { 1, 3 })
        {
            var line = new Border { Width = 1 };
            line.SetResourceReference(Border.BackgroundProperty, "Divider");
            Grid.SetColumn(line, column);
            grid.Children.Add(line);
        }

        foldersList.SelectionChanged += (_, _) =>
        {
            CommitEditor();
            ClearEditor();
            ReloadSnippets();
        };
        snippetsList.SelectionChanged += (_, _) =>
        {
            CommitEditor();
            if (SelectedFolder is { } folder && snippetsList.SelectedIndex >= 0) PopulateEditor(folder, snippetsList.SelectedIndex);
            else ClearEditor();
        };
        foldersList.KeyDown += (_, e) => { if (e.Key is Key.Delete or Key.Back) RemoveFolder(); if (e.Key == Key.F2) RenameFolder(); };
        foldersList.MouseDoubleClick += (_, _) => RenameFolder();
        snippetsList.KeyDown += (_, e) => { if (e.Key is Key.Delete or Key.Back) RemoveSnippet(); };
        return grid;
    }

    private static FrameworkElement Column(string header, FrameworkElement body, FrameworkElement? toolbar)
    {
        var dock = new DockPanel();
        var title = new TextBlock { Text = header, FontSize = 12, FontWeight = FontWeights.SemiBold, Margin = new Thickness(14, 12, 12, 8) };
        title.SetResourceReference(TextBlock.ForegroundProperty, "TextSecondary");
        DockPanel.SetDock(title, Dock.Top);
        dock.Children.Add(title);
        if (toolbar != null)
        {
            DockPanel.SetDock(toolbar, Dock.Bottom);
            dock.Children.Add(toolbar);
        }
        dock.Children.Add(body);
        return dock;
    }

    private static FrameworkElement Toolbar(params Button[] buttons)
    {
        var panel = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(6, 4, 6, 6) };
        foreach (var button in buttons) panel.Children.Add(button);
        var border = new Border { BorderThickness = new Thickness(0, 1, 0, 0), Child = panel };
        border.SetResourceReference(Border.BorderBrushProperty, "Divider");
        return border;
    }

    private static Button IconButton(string glyph, string? tooltip, Action action)
    {
        var button = new Button { Content = glyph, ToolTip = tooltip };
        button.SetResourceReference(StyleProperty, "IconButton");
        button.Click += (_, _) => action();
        return button;
    }

    private static Button MakeButton(string title, Action action)
    {
        var button = new Button { Content = title, Margin = new Thickness(8, 0, 0, 0) };
        button.Click += (_, _) => action();
        return button;
    }

    private static TextBlock Label(string text) =>
        new() { Text = text, VerticalAlignment = VerticalAlignment.Center, Margin = new Thickness(16, 0, 8, 0) };

    private static StackPanel Row(params FrameworkElement[] children)
    {
        var panel = new StackPanel { Orientation = Orientation.Horizontal, VerticalAlignment = VerticalAlignment.Center };
        foreach (var child in children) panel.Children.Add(child);
        return panel;
    }

    /// Riga delle impostazioni stile Windows 11: icona, titolo (con eventuale descrizione), controllo a destra.
    private static Grid SettingRow(string glyph, string title, string? description, FrameworkElement control)
    {
        var grid = new Grid { MinHeight = 62, Margin = new Thickness(16, 0, 16, 0) };
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(36) });
        grid.ColumnDefinitions.Add(new ColumnDefinition());
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
        grid.Children.Add(new TextBlock { Text = glyph, FontFamily = Theme.Icons, FontSize = 16, VerticalAlignment = VerticalAlignment.Center });

        var text = new StackPanel { VerticalAlignment = VerticalAlignment.Center };
        text.Children.Add(new TextBlock { Text = title.TrimEnd(':', '：', ' '), TextWrapping = TextWrapping.Wrap });
        if (description != null)
        {
            var detail = new TextBlock { Text = description.Trim('(', ')'), FontSize = 12, TextWrapping = TextWrapping.Wrap };
            detail.SetResourceReference(TextBlock.ForegroundProperty, "TextSecondary");
            text.Children.Add(detail);
            grid.Tag = detail;
        }
        Grid.SetColumn(text, 1);
        grid.Children.Add(text);

        control.VerticalAlignment = VerticalAlignment.Center;
        control.Margin = new Thickness(16, 0, 0, 0);
        Grid.SetColumn(control, 2);
        grid.Children.Add(control);
        return grid;
    }

    private static Border Divider()
    {
        var line = new Border { Height = 1 };
        line.SetResourceReference(Border.BackgroundProperty, "Divider");
        return line;
    }

    private static Border Card(FrameworkElement child)
    {
        var card = new Border { Child = child };
        card.SetResourceReference(StyleProperty, "Card");
        return card;
    }

    private FrameworkElement LanguagePicker()
    {
        var combo = new ComboBox { MinWidth = 200 };
        combo.Items.Add(Loc.L("Automatica (sistema)"));
        foreach (var (_, name) in Loc.Languages) combo.Items.Add(name);
        var index = Array.FindIndex(Loc.Languages, l => l.Code == app.Settings.Language);
        combo.SelectedIndex = index + 1;
        combo.SelectionChanged += (_, _) =>
            Dispatcher.BeginInvoke(() => app.SetLanguage(combo.SelectedIndex == 0 ? null : Loc.Languages[combo.SelectedIndex - 1].Code));
        return combo;
    }

    private static FrameworkElement LimitPicker(int[] presets, int current, Action<int> changed)
    {
        var combo = new ComboBox { MinWidth = 84 };
        foreach (var preset in presets) combo.Items.Add(preset.ToString());
        combo.SelectedItem = current.ToString();
        combo.SelectionChanged += (_, _) => changed(int.Parse((string)combo.SelectedItem));
        return combo;
    }

    // MARK: - Scorciatoia

    private void RefreshRecorder()
    {
        if (recording)
        {
            recorder.Content = Loc.L("Premi i tasti…");
            return;
        }
        var keys = new StackPanel { Orientation = Orientation.Horizontal, FlowDirection = FlowDirection.LeftToRight };
        foreach (var part in app.Settings.HotKey.ToString().Split('+'))
        {
            var text = new TextBlock { Text = part, FontSize = 13, FontWeight = FontWeights.SemiBold, HorizontalAlignment = HorizontalAlignment.Center };
            text.SetResourceReference(TextBlock.ForegroundProperty, "TextOnAccent");
            var cap = new Border { Child = text };
            cap.SetResourceReference(StyleProperty, "KeyCap");
            keys.Children.Add(cap);
        }
        recorder.Content = keys;
    }

    private void StartRecording()
    {
        recording = true;
        app.SuspendHotKey(true);
        recorder.Focus();
        RefreshRecorder();
    }

    private void StopRecording()
    {
        if (!recording) return;
        recording = false;
        app.SuspendHotKey(false);
        RefreshRecorder();
    }

    private void RecorderKeyDown(object sender, KeyEventArgs e)
    {
        if (!recording) return;
        e.Handled = true;
        var key = e.Key == Key.System ? e.SystemKey : e.Key;
        if (key == Key.Escape)
        {
            StopRecording();
            return;
        }
        if (key is Key.LeftCtrl or Key.RightCtrl or Key.LeftShift or Key.RightShift or Key.LeftAlt or Key.RightAlt or Key.LWin or Key.RWin)
            return;
        var keys = Keyboard.Modifiers;
        var modifiers = (keys.HasFlag(ModifierKeys.Control) ? Native.MOD_CONTROL : 0) |
                        (keys.HasFlag(ModifierKeys.Alt) ? Native.MOD_ALT : 0) |
                        (keys.HasFlag(ModifierKeys.Shift) ? Native.MOD_SHIFT : 0) |
                        (Keyboard.IsKeyDown(Key.LWin) || Keyboard.IsKeyDown(Key.RWin) ? Native.MOD_WIN : 0); // Keyboard.Modifiers non riporta mai il tasto Win
        if (modifiers == 0)
        {
            System.Media.SystemSounds.Beep.Play(); // serve almeno un modificatore
            return;
        }
        var combo = new HotKeyCombo(modifiers, (uint)KeyInterop.VirtualKeyFromKey(key));
        ShowHotKeyError(app.SetHotKey(combo) ? null : combo);
        StopRecording();
    }

    /// Scorciatoia occupata da un'altra app: errore chiaro al posto del suggerimento.
    private void ShowHotKeyError(HotKeyCombo? combo)
    {
        if (hotKeyHint == null) return;
        if (combo is { } taken)
        {
            hotKeyHint.Text = Loc.L("%@ è già usata da un'altra app: scegline un'altra.", taken);
            hotKeyHint.Foreground = new SolidColorBrush(Theme.Dark ? Color.FromRgb(0xFF, 0x99, 0xA4) : Color.FromRgb(0xC4, 0x2B, 0x1C));
        }
        else
        {
            hotKeyHint.Text = Loc.L("(clicca e premi la combinazione, Esc annulla)").Trim('(', ')');
            hotKeyHint.SetResourceReference(TextBlock.ForegroundProperty, "TextSecondary");
        }
    }

    private void ImportData()
    {
        CommitEditor();
        if (!app.ImportData(this)) return;
        // Snippet e impostazioni sono cambiati: la finestra si riapre con i dati ripristinati.
        Dispatcher.BeginInvoke(() =>
        {
            Close();
            app.OpenCustomizer();
        });
    }

    // MARK: - Snippet

    private void ReloadFolders(int? select = null)
    {
        foldersList.ItemsSource = Folders.Select(f => f.Name).ToList();
        if (select is { } index) foldersList.SelectedIndex = index;
        ReloadSnippets();
    }

    private void ReloadSnippets(int? select = null)
    {
        snippetsList.ItemsSource = SelectedFolder is { } folder ? Folders[folder].Snippets.Select(s => s.Title).ToList() : null;
        if (select is { } index) snippetsList.SelectedIndex = index;
    }

    private void ClearEditor()
    {
        editingFolder = null;
        editingSnippet = null;
        titleField.Text = "";
        contentField.Text = "";
        UpdateEditorEnabled(false);
    }

    private void UpdateEditorEnabled(bool enabled)
    {
        titleField.IsEnabled = enabled;
        contentField.IsEnabled = enabled;
    }

    private void PopulateEditor(int folder, int snippet)
    {
        editingFolder = folder;
        editingSnippet = snippet;
        titleField.Text = Folders[folder].Snippets[snippet].Title;
        contentField.Text = Folders[folder].Snippets[snippet].Content;
        UpdateEditorEnabled(true);
    }

    /// Salva l'editor corrente sul modello (auto-salvataggio prima di cambiare selezione).
    private void CommitEditor()
    {
        if (editingFolder is not { } f || editingSnippet is not { } s) return;
        if (f >= Folders.Count || s >= Folders[f].Snippets.Count) return;
        var title = titleField.Text.Trim();
        if (title.Length == 0) return;
        var changed = Folders[f].Snippets[s].Title != title;
        if (!changed && Folders[f].Snippets[s].Content == contentField.Text) return;
        Folders[f].Snippets[s] = new Snippet { Title = title, Content = contentField.Text };
        app.SaveSnippets();
        if (changed && SelectedFolder == f && snippetsList.ItemsSource is List<string> titles && s < titles.Count) titles[s] = title;
    }

    private void AddFolder()
    {
        var name = Dialog.Prompt(this, Loc.L("Nuova cartella"), Loc.L("Nome (es. Mails)"), "");
        if (string.IsNullOrEmpty(name)) return;
        Folders.Add(new SnippetFolder { Name = name });
        app.SaveSnippets();
        ReloadFolders(Folders.Count - 1);
    }

    private void RemoveFolder()
    {
        if (SelectedFolder is not { } index) return;
        if (!Dialog.Confirm(this, Loc.L("Eliminare la cartella \"%@\"?", Folders[index].Name),
                            Loc.L("Verranno rimossi tutti gli snippet contenuti."), Loc.L("Elimina"))) return;
        ClearEditor();
        Folders.RemoveAt(index);
        app.SaveSnippets();
        ReloadFolders();
    }

    private void RenameFolder()
    {
        if (SelectedFolder is not { } index) return;
        var name = Dialog.Prompt(this, Loc.L("Rinomina cartella"), Folders[index].Name, Folders[index].Name);
        if (string.IsNullOrEmpty(name)) return;
        Folders[index].Name = name;
        app.SaveSnippets();
        ReloadFolders(index);
    }

    private void AddSnippet()
    {
        if (SelectedFolder is not { } index)
        {
            System.Media.SystemSounds.Beep.Play();
            Dialog.Message(this, Loc.L("Seleziona prima una cartella."));
            return;
        }
        CommitEditor();
        Folders[index].Snippets.Add(new Snippet { Title = Loc.L("Nuovo snippet") });
        app.SaveSnippets();
        ReloadSnippets(Folders[index].Snippets.Count - 1);
        titleField.Focus();
        titleField.SelectAll();
    }

    private void RemoveSnippet()
    {
        if (SelectedFolder is not { } folder || snippetsList.SelectedIndex < 0) return;
        var row = snippetsList.SelectedIndex;
        ClearEditor();
        Folders[folder].Snippets.RemoveAt(row);
        app.SaveSnippets();
        ReloadSnippets();
    }

    /// Sposta la cartella selezionata e la mantiene selezionata.
    private void MoveFolder(int delta)
    {
        if (SelectedFolder is not { } index) return;
        var destination = index + delta;
        if (destination < 0 || destination >= Folders.Count) return;
        CommitEditor();
        ClearEditor();
        var folder = Folders[index];
        Folders.RemoveAt(index);
        Folders.Insert(destination, folder);
        app.SaveSnippets();
        ReloadFolders(destination);
    }

    private void MoveSnippet(int delta)
    {
        if (SelectedFolder is not { } folder || snippetsList.SelectedIndex < 0) return;
        var list = Folders[folder].Snippets;
        var index = snippetsList.SelectedIndex;
        var destination = index + delta;
        if (destination < 0 || destination >= list.Count) return;
        CommitEditor();
        ClearEditor();
        var snippet = list[index];
        list.RemoveAt(index);
        list.Insert(destination, snippet);
        app.SaveSnippets();
        ReloadSnippets(destination);
    }

    /// Selezione iniziale per le istantanee di verifica.
    public void SelectForPreview(int folder, int snippet)
    {
        if (folder >= Folders.Count) return;
        foldersList.SelectedIndex = folder;
        if (snippet < Folders[folder].Snippets.Count) snippetsList.SelectedIndex = snippet;
    }
}

/// Finestre di dialogo modali (equivalenti di NSAlert), con Mica e controlli Fluent.
static class Dialog
{
    public static string? Prompt(Window owner, string message, string placeholder, string text)
    {
        var field = new TextBox { Text = text, Margin = new Thickness(0, 12, 0, 0), MinWidth = 300 };
        var hint = new TextBlock { Text = placeholder, Margin = new Thickness(11, 12, 0, 0), IsHitTestVisible = false, VerticalAlignment = VerticalAlignment.Center };
        hint.SetResourceReference(TextBlock.ForegroundProperty, "TextSecondary");
        hint.Visibility = text.Length == 0 ? Visibility.Visible : Visibility.Collapsed;
        field.TextChanged += (_, _) => hint.Visibility = field.Text.Length == 0 ? Visibility.Visible : Visibility.Collapsed;
        var input = new Grid();
        input.Children.Add(field);
        input.Children.Add(hint);
        var ok = Show(owner, message, null, input, Loc.L("OK"), Loc.L("Annulla"), () => { field.Focus(); field.SelectAll(); });
        return ok ? field.Text.Trim() : null;
    }

    public static bool Confirm(Window owner, string message, string info, string action) =>
        Show(owner, message, info, null, action, Loc.L("Annulla"), null);

    public static void Message(Window owner, string message, string? info = null) =>
        Show(owner, message, info, null, Loc.L("OK"), null, null);

    private static bool Show(Window owner, string message, string? info, FrameworkElement? extra, string primary, string? secondary, Action? loaded)
    {
        var panel = new StackPanel { Margin = new Thickness(24, 20, 24, 0) };
        panel.Children.Add(new TextBlock { Text = message, FontSize = 16, FontWeight = FontWeights.SemiBold, TextWrapping = TextWrapping.Wrap, MaxWidth = 360 });
        if (info != null) panel.Children.Add(new TextBlock { Text = info, Margin = new Thickness(0, 8, 0, 0), TextWrapping = TextWrapping.Wrap, MaxWidth = 360 });
        if (extra != null) panel.Children.Add(extra);

        var window = new Window
        {
            Owner = owner,
            Title = "Klipski",
            SizeToContent = SizeToContent.WidthAndHeight,
            ResizeMode = ResizeMode.NoResize,
            WindowStartupLocation = WindowStartupLocation.CenterOwner,
            ShowInTaskbar = false,
            FontFamily = Theme.Font,
            FontSize = 14,
            FlowDirection = owner.FlowDirection,
            MinWidth = 380
        };
        window.SetResourceReference(Window.BackgroundProperty, "WindowFill");
        window.SourceInitialized += (_, _) => Backdrop.Apply(window, new WindowInteropHelper(window).Handle, Native.DWMSBT_MAINWINDOW);

        var buttons = new UniformGrid { Rows = 1, HorizontalAlignment = HorizontalAlignment.Stretch };
        var primaryButton = new Button { Content = primary, IsDefault = true, Margin = new Thickness(0, 0, secondary == null ? 0 : 8, 0) };
        primaryButton.SetResourceReference(FrameworkElement.StyleProperty, "AccentButton");
        primaryButton.Click += (_, _) => window.DialogResult = true;
        buttons.Children.Add(primaryButton);
        if (secondary != null) buttons.Children.Add(new Button { Content = secondary, IsCancel = true });
        var footer = new Border { Padding = new Thickness(24), Margin = new Thickness(0, 24, 0, 0), Child = buttons };
        footer.SetResourceReference(Border.BackgroundProperty, "CardFill");

        var root = new DockPanel();
        DockPanel.SetDock(footer, Dock.Bottom);
        root.Children.Add(footer);
        root.Children.Add(panel);
        window.Content = root;
        if (loaded != null) window.Loaded += (_, _) => loaded();
        return window.ShowDialog() == true;
    }
}
