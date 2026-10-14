using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Interop;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Threading;

namespace Klipski;

/// Gestisce la cascata menu → sottomenu: mouse, tastiera, posizione sullo schermo, anteprima immagini.
/// Come su macOS il passaggio del mouse apre il sottomenu, le frecce lo navigano e la destra ci entra.
sealed class MenuController
{
    private readonly List<MenuPopup> stack = new();
    private MenuPopup? focus;
    private readonly DispatcherTimer hoverTimer = new() { Interval = TimeSpan.FromMilliseconds(160) };
    private Action? pendingHover;
    private readonly ImagePreview preview = new();
    private MenuEntry? previewEntry;

    public bool IsOpen => stack.Count > 0;

    public MenuController()
    {
        hoverTimer.Tick += (_, _) =>
        {
            hoverTimer.Stop();
            var action = pendingHover;
            pendingHover = null;
            action?.Invoke();
        };
    }

    /// Apre il menu principale al cursore.
    public void Show(Func<List<MenuEntry>> build)
    {
        CloseAll();
        Theme.Refresh();
        var root = new MenuPopup(this, 0, _ => build(), searchable: false);
        stack.Add(root);
        focus = root;
        var cursor = Native.CursorPosition();
        var (work, scale) = Native.MonitorAt(cursor);
        root.MaxHeight = work.Height / scale;
        root.Left = cursor.X / scale;
        root.Top = cursor.Y / scale;
        root.ContentRendered += (_, _) =>
        {
            Place(root, () => PlaceAtCursor(root, cursor));
            root.Activate();
            Native.SetForegroundWindow(root.Hwnd);
        };
        root.Show();
    }

    public void CloseAll()
    {
        hoverTimer.Stop();
        pendingHover = null;
        previewEntry = null;
        preview.Hide();
        var windows = stack.ToList();
        stack.Clear();
        focus = null;
        foreach (var window in windows) window.Close();
    }

    // MARK: - Mouse

    public void Hover(MenuPopup popup, int index)
    {
        Focus(popup);
        popup.Select(index);
        Schedule(() => SyncChild(popup));
    }

    public void Entered(MenuPopup popup)
    {
        // Arrivati nel sottomenu: annulla il cambio pendente e la riga che lo apre resta evidenziata.
        if (popup.Level == 0) return;
        Schedule(null);
        var parent = stack[popup.Level - 1];
        parent.Select(parent.ChildRow);
        Focus(popup);
    }

    public void Click(MenuPopup popup, int index)
    {
        popup.Select(index);
        var entry = popup.SelectedEntry;
        if (entry == null) return;
        if (entry.Submenu != null) EnterChild(popup);
        else Invoke(entry);
    }

    // MARK: - Tastiera

    public void OnKey(MenuPopup source, KeyEventArgs e)
    {
        var popup = focus ?? source;
        var key = e.Key == Key.System ? e.SystemKey : e.Key;
        if (Loc.RightToLeft && key is Key.Left or Key.Right) key = key == Key.Left ? Key.Right : Key.Left;
        var searchText = popup.Search?.Text ?? "";

        if (Keyboard.Modifiers == ModifierKeys.Control && key != Key.LeftCtrl && key != Key.RightCtrl)
        {
            var shortcut = stack[0].Entries.FirstOrDefault(entry => entry.ShortcutKey == key && entry.Action != null);
            if (shortcut != null)
            {
                Invoke(shortcut);
                e.Handled = true;
            }
            return;
        }

        switch (key)
        {
            case Key.Down:
            case Key.Up:
                popup.Move(key == Key.Down ? 1 : -1);
                Schedule(() => SyncChild(popup));
                break;
            case Key.Right:
                if (popup.SelectedEntry?.Submenu == null) return;
                EnterChild(popup);
                break;
            case Key.Left:
                if (searchText.Length > 0 && popup.Search!.CaretIndex > 0) return;
                if (popup.Level > 0) Back(popup);
                break;
            case Key.Escape:
                if (popup.Level > 0) Back(popup);
                else CloseAll();
                break;
            case Key.Enter:
                var entry = popup.SelectedEntry;
                if (entry == null) break;
                if (entry.Submenu != null) EnterChild(popup);
                else Invoke(entry);
                break;
            case Key.Home:
            case Key.End:
                if (popup.Search != null) return;
                popup.Select(-1);
                popup.Move(key == Key.Home ? 1 : -1);
                break;
            default:
                return;
        }
        e.Handled = true;
    }

    // MARK: - Sottomenu

    private void EnterChild(MenuPopup popup)
    {
        if (popup.Child == null || popup.ChildRow != popup.Selected)
        {
            CloseChildren(popup);
            OpenChild(popup, enter: true);
            return;
        }
        var child = popup.Child;
        Focus(child);
        child.SelectFirst();
    }

    private void SyncChild(MenuPopup popup)
    {
        if (!stack.Contains(popup)) return;
        if (popup.Child != null && popup.ChildRow == popup.Selected) return;
        CloseChildren(popup);
        if (popup.SelectedEntry?.Submenu != null) OpenChild(popup, enter: false);
    }

    private void OpenChild(MenuPopup popup, bool enter)
    {
        var entry = popup.SelectedEntry!;
        var row = popup.Selected;
        var child = new MenuPopup(this, popup.Level + 1, entry.Submenu!, entry.Searchable);
        popup.Child = child;
        popup.ChildRow = row;
        stack.Add(child);
        var (work, scale) = Native.MonitorOf(popup.Hwnd);
        child.MaxHeight = work.Height / scale;
        child.ShowActivated = enter;
        child.ContentRendered += (_, _) =>
        {
            Place(child, () => PlaceBeside(child, popup, row));
            if (!enter) return;
            Focus(child);
            child.SelectFirst();
        };
        child.Show();
    }

    private void Back(MenuPopup popup)
    {
        var parent = stack[popup.Level - 1];
        Focus(parent);
        CloseChildren(parent);
    }

    private void CloseChildren(MenuPopup popup)
    {
        var children = stack.Where(p => p.Level > popup.Level).ToList();
        foreach (var child in children)
        {
            stack.Remove(child);
            child.Close();
        }
        popup.Child = null;
        popup.ChildRow = -1;
        SelectionChanged();
    }

    private void Focus(MenuPopup popup)
    {
        focus = popup;
        if (!popup.IsActive) popup.Activate();
        if (popup.Search != null) Keyboard.Focus(popup.Search);
    }

    private void Schedule(Action? action)
    {
        hoverTimer.Stop();
        pendingHover = action;
        if (action != null) hoverTimer.Start();
    }

    /// L'azione parte prima di chiudere il menu: finché Klipski è in primo piano può ridare il fuoco all'app di prima.
    private void Invoke(MenuEntry entry)
    {
        entry.Action?.Invoke();
        CloseAll();
    }

    /// Il menu si chiude quando il fuoco passa a una finestra che non è uno dei suoi popup.
    public void CheckDeactivation()
    {
        Application.Current.Dispatcher.BeginInvoke(DispatcherPriority.Input, () =>
        {
            if (stack.Count > 0 && !stack.Any(p => p.IsActive)) CloseAll();
        });
    }

    // MARK: - Anteprima immagini

    public void SelectionChanged()
    {
        var deepest = stack.LastOrDefault(p => p.Selected >= 0);
        var entry = deepest?.SelectedEntry;
        if (entry?.Preview == null || deepest == null)
        {
            previewEntry = null;
            preview.Hide();
            return;
        }
        if (entry == previewEntry) return;
        previewEntry = entry;
        // L'immagine intera si carica solo quando la voce viene evidenziata.
        if (entry.Preview() is not { } image)
        {
            preview.Hide();
            return;
        }
        preview.Show(image, deepest.Hwnd);
        foreach (var popup in stack)
            Native.SetWindowPos(popup.Hwnd, Native.HWND_TOPMOST, 0, 0, 0, 0, Native.SWP_NOMOVE | Native.SWP_NOSIZE | Native.SWP_NOACTIVATE);
    }

    // MARK: - Posizione (in pixel fisici, per monitor)

    /// Posiziona la finestra ancora nascosta, poi la mostra; si riposiziona se cambia misura (es. cambio DPI).
    /// Va chiamato da ContentRendered: Loaded può arrivare prima che esista l'HWND.
    private static void Place(MenuPopup popup, Action place)
    {
        place();
        popup.Uncloak();
        popup.SizeChanged += (_, _) => place();
    }

    private static void PlaceAtCursor(MenuPopup popup, Native.POINT cursor)
    {
        Native.GetWindowRect(popup.Hwnd, out var rect);
        var (work, _) = Native.MonitorAt(cursor);
        var x = Loc.RightToLeft ? cursor.X - rect.Width : cursor.X;
        var y = cursor.Y;
        if (x + rect.Width > work.Right) x = cursor.X - rect.Width;
        if (x < work.Left) x = cursor.X;
        if (y + rect.Height > work.Bottom) y = cursor.Y - rect.Height;
        Move(popup, Clamp(x, work.Left, work.Right - rect.Width), Clamp(y, work.Top, work.Bottom - rect.Height));
    }

    private static void PlaceBeside(MenuPopup child, MenuPopup parent, int row)
    {
        Native.GetWindowRect(child.Hwnd, out var rect);
        Native.GetWindowRect(parent.Hwnd, out var parentRect);
        var (work, scale) = Native.MonitorOf(parent.Hwnd);
        var rowTop = (int)parent.RowTopOnScreen(row).Y;
        var right = parentRect.Right - 1;
        var left = parentRect.Left - rect.Width + 1;
        var x = Loc.RightToLeft
            ? (left >= work.Left ? left : right)
            : (right + rect.Width <= work.Right ? right : left);
        var y = rowTop - (int)Math.Round(MenuPopup.Padding5 * scale);
        Move(child, Clamp(x, work.Left, work.Right - rect.Width), Clamp(y, work.Top, work.Bottom - rect.Height));
    }

    private static int Clamp(int value, int min, int max) => Math.Max(min, Math.Min(value, Math.Max(min, max)));

    private static void Move(MenuPopup popup, int x, int y) =>
        Native.SetWindowPos(popup.Hwnd, IntPtr.Zero, x, y, 0, 0, Native.SWP_NOSIZE | Native.SWP_NOZORDER | Native.SWP_NOACTIVATE);
}

/// Anteprima ingrandita dell'immagine evidenziata, al centro dello schermo (come ImageMenuHighlightDelegate).
/// Non prende il fuoco e lascia passare i clic.
sealed class ImagePreview
{
    private Window? window;
    private Image? image;
    private Border? frame;
    private IntPtr hwnd;

    public void Show(ImageSource source, IntPtr near)
    {
        if (window == null) Create();
        image!.Source = source;
        frame!.Background = new SolidColorBrush(Theme.Dark ? Color.FromRgb(0x2B, 0x2B, 0x2B) : Color.FromRgb(0xF3, 0xF3, 0xF3));
        frame.BorderBrush = Theme.Rule;

        var (work, scale) = Native.MonitorOf(near);
        var (width, height) = source is BitmapSource bitmap ? (bitmap.PixelWidth, bitmap.PixelHeight) : (source.Width, source.Height);
        // Fino al 90% del lato più corto dell'area visibile, ingrandendo al massimo 3x le immagini piccole.
        var maxSide = Math.Min(work.Width, work.Height) * 0.9;
        var factor = Math.Min(Math.Min(maxSide / Math.Max(width, 1), maxSide / Math.Max(height, 1)), 3);
        var inset = 8 * scale;
        var w = (int)(width * factor + inset * 2);
        var h = (int)(height * factor + inset * 2);
        window!.Width = w / scale;
        window.Height = h / scale;
        if (!window.IsVisible) window.Show();
        Native.SetWindowPos(hwnd, Native.HWND_TOPMOST, work.Left + (work.Width - w) / 2, work.Top + (work.Height - h) / 2, w, h, Native.SWP_NOACTIVATE);
    }

    public void Hide() => window?.Hide();

    private void Create()
    {
        image = new Image { Stretch = Stretch.Uniform };
        RenderOptions.SetBitmapScalingMode(image, BitmapScalingMode.HighQuality);
        frame = new Border
        {
            CornerRadius = new CornerRadius(8),
            BorderThickness = new Thickness(1),
            Padding = new Thickness(7),
            Child = image
        };
        window = new Window
        {
            WindowStyle = WindowStyle.None,
            AllowsTransparency = true,
            Background = Brushes.Transparent,
            ResizeMode = ResizeMode.NoResize,
            ShowInTaskbar = false,
            ShowActivated = false,
            Topmost = true,
            IsHitTestVisible = false,
            Content = frame
        };
        window.SourceInitialized += (_, _) =>
        {
            hwnd = new WindowInteropHelper(window).Handle;
            Native.AddExStyle(hwnd, Native.WS_EX_TOOLWINDOW | Native.WS_EX_NOACTIVATE | Native.WS_EX_TRANSPARENT | Native.WS_EX_LAYERED);
        };
    }
}
