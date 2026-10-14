using System.Windows;
using System.Windows.Input;
using System.Windows.Interop;
using System.Windows.Media;
using System.Windows.Media.Imaging;

namespace Klipski;

/// Finestra nascosta che riceve i messaggi di sistema: scorciatoia globale, icona nella tray, cambio tema.
sealed class MessageWindow
{
    private const int HotKeyId = 1;
    private const int TrayMessage = 0x8001;

    private readonly HwndSource source;
    private readonly uint taskbarCreated = Native.RegisterWindowMessage("TaskbarCreated");
    private IntPtr icon;

    public Action? HotKeyPressed;
    public Action? TrayClicked;

    public MessageWindow()
    {
        source = new HwndSource(new HwndSourceParameters("Klipski") { Width = 0, Height = 0, WindowStyle = 0 });
        source.AddHook(WndProc);
    }

    public bool RegisterHotKey(HotKeyCombo combo)
    {
        Native.UnregisterHotKey(source.Handle, HotKeyId);
        return Native.RegisterHotKey(source.Handle, HotKeyId, combo.Modifiers | Native.MOD_NOREPEAT, combo.Vk);
    }

    public void UnregisterHotKey() => Native.UnregisterHotKey(source.Handle, HotKeyId);

    public void AddTrayIcon() => UpdateTray(Native.NIM_ADD);

    public void RemoveTrayIcon()
    {
        var data = TrayData();
        Native.Shell_NotifyIcon(Native.NIM_DELETE, ref data);
    }

    /// Lampo dell'icona alla cattura di un nuovo elemento, come flashCapture su Mac.
    public void FlashTray()
    {
        UpdateTray(Native.NIM_MODIFY, filled: true);
        var timer = new System.Windows.Threading.DispatcherTimer { Interval = TimeSpan.FromMilliseconds(180) };
        timer.Tick += (_, _) =>
        {
            timer.Stop();
            UpdateTray(Native.NIM_MODIFY);
        };
        timer.Start();
    }

    public void ShowBalloon(string text)
    {
        var data = TrayData();
        data.uFlags = Native.NIF_INFO;
        data.szInfoTitle = "Klipski";
        data.szInfo = text;
        data.dwInfoFlags = Native.NIIF_WARNING;
        Native.Shell_NotifyIcon(Native.NIM_MODIFY, ref data);
    }

    private void UpdateTray(uint message, bool filled = false)
    {
        Theme.Refresh();
        var old = icon;
        icon = TrayIconImage.Create(Theme.TaskbarDark, filled);
        var data = TrayData();
        data.uFlags = Native.NIF_MESSAGE | Native.NIF_ICON | Native.NIF_TIP;
        data.uCallbackMessage = TrayMessage;
        data.hIcon = icon;
        data.szTip = "Klipski";
        Native.Shell_NotifyIcon(message, ref data);
        if (old != IntPtr.Zero) Native.DestroyIcon(old);
    }

    private Native.NOTIFYICONDATA TrayData() => new()
    {
        cbSize = System.Runtime.InteropServices.Marshal.SizeOf<Native.NOTIFYICONDATA>(),
        hWnd = source.Handle,
        uID = 1,
        szTip = "",
        szInfo = "",
        szInfoTitle = ""
    };

    private IntPtr WndProc(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
    {
        if (msg == Native.WM_HOTKEY && wParam.ToInt32() == HotKeyId)
        {
            HotKeyPressed?.Invoke();
            handled = true;
        }
        else if (msg == TrayMessage && lParam.ToInt32() is Native.WM_LBUTTONUP or Native.WM_RBUTTONUP)
        {
            TrayClicked?.Invoke();
            handled = true;
        }
        else if (msg == taskbarCreated)
        {
            // Explorer è ripartito: l'icona va aggiunta di nuovo.
            UpdateTray(Native.NIM_ADD);
        }
        else if (msg == Native.WM_SETTINGCHANGE)
        {
            UpdateTray(Native.NIM_MODIFY);
        }
        return IntPtr.Zero;
    }
}

/// Icona "K" della tray, nera o bianca secondo il colore della barra delle applicazioni
/// (equivalente dell'immagine template della barra di stato su Mac).
static class TrayIconImage
{
    /// `filled`: variante del lampo di conferma, cerchio pieno con la K in negativo.
    public static IntPtr Create(bool darkTaskbar, bool filled = false)
    {
        var size = Native.GetSystemMetrics(49); // SM_CXSMICON
        var ink = darkTaskbar ? Brushes.White : Brushes.Black;
        var paper = darkTaskbar ? Brushes.Black : Brushes.White;
        var visual = new DrawingVisual();
        using (var dc = visual.RenderOpen())
        {
            if (filled) dc.DrawEllipse(ink, null, new Point(size / 2.0, size / 2.0), size / 2.0 - 0.5, size / 2.0 - 0.5);
            var text = new FormattedText("K", System.Globalization.CultureInfo.InvariantCulture, FlowDirection.LeftToRight,
                new Typeface(new FontFamily("Segoe UI Variable Display, Segoe UI"), FontStyles.Normal, FontWeights.Bold, FontStretches.Normal),
                size * (filled ? 0.7 : 0.95), filled ? paper : ink, 1);
            dc.DrawText(text, new Point((size - text.Width) / 2, (size - text.Height) / 2));
        }
        var bitmap = new RenderTargetBitmap(size, size, 96, 96, PixelFormats.Pbgra32);
        bitmap.Render(visual);
        var converted = new FormatConvertedBitmap(bitmap, PixelFormats.Bgra32, null, 0);
        var pixels = new byte[size * size * 4];
        converted.CopyPixels(pixels, size * 4, 0);

        var color = Native.CreateBitmap(size, size, 1, 32, pixels);
        var mask = Native.CreateBitmap(size, size, 1, 1, new byte[(size + 15) / 16 * 2 * size]);
        var info = new Native.ICONINFO { fIcon = true, hbmColor = color, hbmMask = mask };
        var handle = Native.CreateIconIndirect(ref info);
        Native.DeleteObject(color);
        Native.DeleteObject(mask);
        return handle;
    }
}
