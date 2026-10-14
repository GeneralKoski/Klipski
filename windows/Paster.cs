using System.Diagnostics;
using System.Text;
using System.Windows.Threading;

namespace Klipski;

/// Riporta il fuoco all'app di prima e simula Ctrl+V (equivalente di Paster.swift, senza permessi da chiedere).
static class Paster
{
    private const uint EVENT_SYSTEM_FOREGROUND = 3;
    private static readonly uint OwnProcess = (uint)Environment.ProcessId;
    // Barra delle applicazioni e area di notifica: il clic sull'icona le porta in primo piano, ma non sono un bersaglio.
    private static readonly string[] ShellClasses =
    {
        "Shell_TrayWnd", "Shell_SecondaryTrayWnd", "NotifyIconOverflowWindow",
        "TopLevelWindowForOverflowXamlIsland", "XamlExplorerHostIslandWindow"
    };

    private static IntPtr target;
    private static Native.WinEventProc? hookProc;

    /// Tiene traccia dell'ultima finestra di un'altra app in primo piano (serve quando il menu si apre dalla tray).
    public static void StartTracking()
    {
        hookProc = (_, _, hwnd, _, _, _, _) => Remember(hwnd);
        Native.SetWinEventHook(EVENT_SYSTEM_FOREGROUND, EVENT_SYSTEM_FOREGROUND, IntPtr.Zero, hookProc, 0, 0, 0);
        Remember(Native.GetForegroundWindow());
    }

    public static void RememberForeground() => Remember(Native.GetForegroundWindow());

    private static void Remember(IntPtr hwnd)
    {
        if (hwnd == IntPtr.Zero) return;
        Native.GetWindowThreadProcessId(hwnd, out var process);
        if (process == OwnProcess) return;
        var name = new StringBuilder(256);
        Native.GetClassName(hwnd, name, name.Capacity);
        if (ShellClasses.Contains(name.ToString())) return;
        target = hwnd;
    }

    /// Da chiamare mentre Klipski è ancora in primo piano: solo così Windows concede di passare il fuoco.
    public static void Restore(bool paste)
    {
        if (target == IntPtr.Zero || !Native.IsWindow(target)) return;
        Native.SetForegroundWindow(target);
        if (!paste) return;
        var window = target;
        var started = Stopwatch.StartNew();
        var timer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(30) };
        timer.Tick += (_, _) =>
        {
            if (Native.GetForegroundWindow() != window && started.ElapsedMilliseconds < 600) return;
            timer.Stop();
            if (Native.GetForegroundWindow() == window) SendPaste();
        };
        timer.Start();
    }

    private static void SendPaste()
    {
        var inputs = new List<Native.INPUT>();
        // Modificatori ancora premuti (es. Shift della scorciatoia) trasformerebbero Ctrl+V in un'altra combinazione.
        foreach (var vk in new ushort[] { 0x10, 0x12, 0x5B, 0x5C })
            if (Native.GetAsyncKeyState(vk) < 0) inputs.Add(Key(vk, up: true));
        inputs.Add(Key(0x11, up: false));
        inputs.Add(Key(0x56, up: false));
        inputs.Add(Key(0x56, up: true));
        inputs.Add(Key(0x11, up: true));
        Native.SendInput((uint)inputs.Count, inputs.ToArray(), System.Runtime.InteropServices.Marshal.SizeOf<Native.INPUT>());
    }

    private static Native.INPUT Key(ushort vk, bool up) => new() { type = 1, wVk = vk, dwFlags = up ? 2u : 0u };
}

/// Avvio al login con la chiave Run dell'utente (equivalente di LoginItemManager.swift).
static class LoginItem
{
    private const string RunKey = @"Software\Microsoft\Windows\CurrentVersion\Run";
    private const string ApprovedKey = @"Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run";
    private const string Name = "Klipski";

    public static bool IsEnabled
    {
        get
        {
            using var run = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(RunKey);
            if (run?.GetValue(Name) == null) return false;
            // Disattivato da Gestione attività: il primo byte è dispari.
            using var approved = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(ApprovedKey);
            return !(approved?.GetValue(Name) is byte[] { Length: > 0 } state && (state[0] & 1) == 1);
        }
    }

    public static void SetEnabled(bool enabled)
    {
        using var run = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(RunKey);
        using var approved = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(ApprovedKey, writable: true);
        approved?.DeleteValue(Name, throwOnMissingValue: false);
        if (enabled) run.SetValue(Name, $"\"{Environment.ProcessPath}\"");
        else run.DeleteValue(Name, throwOnMissingValue: false);
    }
}
