using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Interop;
using System.Windows.Media;

namespace Klipski;

/// Voce di menu, equivalente di NSMenuItem.
sealed class MenuEntry
{
    public string Title = "";
    public string? Detail;
    public string? Shortcut;
    public Key ShortcutKey;
    public bool? Checked;
    public bool Enabled = true;
    public bool Separator;
    public ImageSource? Thumbnail;
    public Func<ImageSource?>? Preview;
    public Func<string, List<MenuEntry>>? Submenu;
    public bool Searchable;
    public Action? Action;

    public bool Selectable => !Separator && Enabled;
    public static MenuEntry Divider => new() { Separator = true };
}

/// Una finestra di menu: il menu principale o un sottomenu che si apre di lato.
/// Finestra senza bordi con acrylic di sistema, angoli arrotondati e ombra di DWM.
sealed class MenuPopup : Window
{
    public const double Padding5 = 5;

    public readonly int Level;
    public MenuPopup? Child;
    public int ChildRow = -1;
    public int Selected { get; private set; } = -1;
    public readonly TextBox? Search;
    public IntPtr Hwnd { get; private set; }

    private readonly MenuController controller;
    private readonly Func<string, List<MenuEntry>> provider;
    private readonly StackPanel list = new();
    private readonly ScrollViewer scroll;
    private readonly List<(MenuEntry Entry, FrameworkElement View)> rows = new();

    public MenuEntry? SelectedEntry => Selected >= 0 ? rows[Selected].Entry : null;
    public IEnumerable<MenuEntry> Entries => rows.Select(r => r.Entry);

    public MenuPopup(MenuController controller, int level, Func<string, List<MenuEntry>> provider, bool searchable)
    {
        this.controller = controller;
        this.provider = provider;
        Level = level;

        WindowStyle = WindowStyle.None;
        ResizeMode = ResizeMode.NoResize;
        ShowInTaskbar = false;
        Topmost = true;
        SizeToContent = SizeToContent.WidthAndHeight;
        Background = Brushes.Transparent;
        UseLayoutRounding = true;

        scroll = new ScrollViewer
        {
            Content = list,
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
            HorizontalScrollBarVisibility = ScrollBarVisibility.Disabled,
            Focusable = false
        };
        var dock = new DockPanel();
        if (searchable)
        {
            Search = new TextBox();
            var field = MakeSearchField(Search);
            DockPanel.SetDock(field, Dock.Top);
            dock.Children.Add(field);
            Search.TextChanged += (_, _) => Rebuild(Search.Text, highlightFirst: Search.Text.Length > 0);
        }
        dock.Children.Add(scroll);
        var root = new Border
        {
            Background = Theme.MenuTint,
            Padding = new Thickness(Padding5),
            Child = dock,
            MinWidth = level == 0 ? 248 : 290,
            MaxWidth = 460,
            FlowDirection = Loc.RightToLeft ? FlowDirection.RightToLeft : FlowDirection.LeftToRight
        };
        TextElement.SetFontFamily(root, Theme.Font);
        TextElement.SetFontSize(root, 14);
        TextElement.SetForeground(root, Theme.Ink);
        TextOptions.SetTextFormattingMode(root, TextFormattingMode.Display);
        Content = root;

        PreviewKeyDown += (_, e) => controller.OnKey(this, e);
        MouseEnter += (_, _) => controller.Entered(this);
        MouseLeave += (_, _) => { if (Child == null) Select(-1); };
        Deactivated += (_, _) => controller.CheckDeactivation();
        Rebuild("", highlightFirst: false);
    }

    protected override void OnSourceInitialized(EventArgs e)
    {
        base.OnSourceInitialized(e);
        Hwnd = new WindowInteropHelper(this).Handle;
        Native.AddExStyle(Hwnd, Native.WS_EX_TOOLWINDOW);
        Native.SetDwm(Hwnd, Native.DWMWA_CLOAK, 1);
        Backdrop.Apply(this, Hwnd, Native.DWMSBT_TRANSIENTWINDOW);
    }

    public void Uncloak() => Native.SetDwm(Hwnd, Native.DWMWA_CLOAK, 0);

    // MARK: - Righe

    public void Rebuild(string query, bool highlightFirst)
    {
        list.Children.Clear();
        rows.Clear();
        Selected = -1;
        foreach (var entry in provider(query))
        {
            var index = rows.Count;
            var view = entry.Separator ? MakeSeparator() : MakeRow(entry, index);
            list.Children.Add(view);
            rows.Add((entry, view));
        }
        if (highlightFirst) SelectFirst();
        controller.SelectionChanged();
    }

    public void SelectFirst()
    {
        var first = rows.FindIndex(r => r.Entry.Selectable);
        Select(first);
    }

    public void Select(int index)
    {
        if (index == Selected) return;
        if (Selected >= 0) Paint(Selected, false);
        Selected = index;
        if (index >= 0)
        {
            Paint(index, true);
            rows[index].View.BringIntoView();
        }
        controller.SelectionChanged();
    }

    /// Su/giù con giro infinito tra le voci selezionabili.
    public void Move(int delta)
    {
        var selectable = Enumerable.Range(0, rows.Count).Where(i => rows[i].Entry.Selectable).ToList();
        if (selectable.Count == 0) return;
        var position = selectable.IndexOf(Selected);
        var next = position < 0
            ? (delta > 0 ? 0 : selectable.Count - 1)
            : (position + delta + selectable.Count) % selectable.Count;
        Select(selectable[next]);
    }

    public Point RowTopOnScreen(int index) => rows[index].View.PointToScreen(new Point(0, 0));
    public Point RowTop(int index, Visual ancestor) => rows[index].View.TransformToAncestor(ancestor).Transform(new Point(0, 0));

    private void Paint(int index, bool on)
    {
        if (rows[index].View is not Border row || row.Tag is not RowParts parts) return;
        row.Background = on ? Theme.Highlight : Brushes.Transparent;
        var ink = on ? Theme.OnHighlight : Theme.Ink;
        var ink2 = on ? Theme.OnHighlight : Theme.Ink2;
        parts.Gutter.Foreground = ink;
        parts.Label.Foreground = ink;
        if (parts.Detail != null) parts.Detail.Foreground = ink2;
        if (parts.Accessory != null) parts.Accessory.Foreground = ink2;
    }

    private sealed record RowParts(TextBlock Gutter, TextBlock Label, Run? Detail, TextBlock? Accessory);

    private FrameworkElement MakeRow(MenuEntry entry, int index)
    {
        var grid = new Grid();
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(20) });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

        var gutter = new TextBlock
        {
            Text = entry.Checked == true ? "\uE73E" : "",
            FontFamily = Theme.Icons,
            FontSize = 11,
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center
        };
        grid.Children.Add(gutter);

        if (entry.Thumbnail != null)
        {
            var image = new Image
            {
                Source = entry.Thumbnail,
                MaxWidth = 48,
                MaxHeight = 48,
                Stretch = Stretch.Uniform,
                Margin = new Thickness(0, 3, 8, 3),
                VerticalAlignment = VerticalAlignment.Center
            };
            RenderOptions.SetBitmapScalingMode(image, BitmapScalingMode.HighQuality);
            Grid.SetColumn(image, 1);
            grid.Children.Add(image);
        }

        var label = new TextBlock
        {
            VerticalAlignment = VerticalAlignment.Center,
            TextTrimming = TextTrimming.CharacterEllipsis,
            Foreground = entry.Enabled ? Theme.Ink : Theme.Ink2
        };
        label.Inlines.Add(new Run(Bidi(entry.Title)));
        Run? detail = null;
        if (entry.Detail is { Length: > 0 })
        {
            detail = new Run("   " + entry.Detail) { FontSize = 12, Foreground = Theme.Ink2 };
            label.Inlines.Add(detail);
        }
        Grid.SetColumn(label, 2);
        grid.Children.Add(label);

        TextBlock? accessory = null;
        if (entry.Submenu != null)
        {
            accessory = new TextBlock
            {
                Text = Loc.RightToLeft ? "\uE76B" : "\uE76C",
                FontFamily = Theme.Icons,
                FontSize = 10,
                Margin = new Thickness(18, 0, 0, 0),
                FlowDirection = FlowDirection.LeftToRight
            };
        }
        else if (entry.Shortcut != null)
        {
            accessory = new TextBlock { Text = entry.Shortcut, FontSize = 13, Margin = new Thickness(18, 0, 0, 0), FlowDirection = FlowDirection.LeftToRight };
        }
        if (accessory != null)
        {
            accessory.Foreground = Theme.Ink2;
            accessory.VerticalAlignment = VerticalAlignment.Center;
            Grid.SetColumn(accessory, 3);
            grid.Children.Add(accessory);
        }

        var row = new Border
        {
            Child = grid,
            MinHeight = 26,
            Padding = new Thickness(2, 0, 10, 0),
            CornerRadius = new CornerRadius(5),
            Background = Brushes.Transparent,
            Tag = new RowParts(gutter, label, detail, accessory)
        };
        if (entry.Selectable)
        {
            row.MouseEnter += (_, _) => controller.Hover(this, index);
            row.MouseLeftButtonUp += (_, _) => controller.Click(this, index);
        }
        return row;
    }

    /// In arabo il testo latino copiato resta da sinistra a destra (come unicode-bidi: plaintext nel mockup).
    private static string Bidi(string text)
    {
        if (!Loc.RightToLeft) return text;
        var strong = text.FirstOrDefault(char.IsLetter);
        return strong != default && strong < 0x0590 ? "\u202A" + text + "\u202C" : text;
    }

    private static FrameworkElement MakeSeparator() =>
        new Border { Height = 1, Margin = new Thickness(10, 5, 10, 5), Background = Theme.Rule };

    private static FrameworkElement MakeSearchField(TextBox box)
    {
        box.SetResourceReference(StyleProperty, "BareTextBox");
        box.Foreground = Theme.Ink;
        box.CaretBrush = Theme.Ink;
        box.SelectionBrush = Theme.Highlight;
        box.FontSize = 13;
        box.VerticalAlignment = VerticalAlignment.Center;

        var placeholder = new TextBlock
        {
            Text = Loc.L("Cerca…"),
            FontSize = 13,
            Foreground = Theme.Ink2,
            IsHitTestVisible = false,
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(2, 0, 0, 0)
        };
        box.TextChanged += (_, _) => placeholder.Visibility = box.Text.Length == 0 ? Visibility.Visible : Visibility.Collapsed;

        var icon = new TextBlock
        {
            Text = "\uE721",
            FontFamily = Theme.Icons,
            FontSize = 12,
            Foreground = Theme.Ink2,
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(0, 0, 6, 0)
        };
        var grid = new Grid();
        grid.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
        grid.ColumnDefinitions.Add(new ColumnDefinition());
        grid.Children.Add(icon);
        Grid.SetColumn(placeholder, 1);
        Grid.SetColumn(box, 1);
        grid.Children.Add(placeholder);
        grid.Children.Add(box);

        return new Border
        {
            Child = grid,
            Height = 26,
            Margin = new Thickness(4, 3, 4, 6),
            Padding = new Thickness(8, 0, 8, 0),
            BorderThickness = new Thickness(1),
            BorderBrush = Theme.Rule,
            Background = Theme.FieldBg,
            CornerRadius = new CornerRadius(6)
        };
    }
}

/// Materiale di sistema di Windows 11 (acrylic per i menu, Mica per le finestre) dietro a un contenuto WPF trasparente.
static class Backdrop
{
    public static void Apply(Window window, IntPtr hwnd, int type)
    {
        Native.SetDwm(hwnd, Native.DWMWA_USE_IMMERSIVE_DARK_MODE, Theme.Dark ? 1 : 0);
        Native.SetDwm(hwnd, Native.DWMWA_WINDOW_CORNER_PREFERENCE, Native.DWMWCP_ROUND);
        if (!Theme.BackdropSupported) return;
        if (HwndSource.FromHwnd(hwnd) is { CompositionTarget: { } target }) target.BackgroundColor = Colors.Transparent;
        var margins = new Native.MARGINS { Left = -1, Right = -1, Top = -1, Bottom = -1 };
        Native.DwmExtendFrameIntoClientArea(hwnd, ref margins);
        Native.SetDwm(hwnd, Native.DWMWA_SYSTEMBACKDROP_TYPE, type);
    }
}
