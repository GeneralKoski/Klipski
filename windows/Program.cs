using System.Security.Cryptography;
using System.Text;
using System.Windows;

namespace Klipski;

static class Program
{
    /// Opzioni: --show apre subito il menu al cursore, --settings apre Personalizza…,
    /// --data-dir <cartella> usa un'altra cartella dati (test), --theme light|dark forza il tema,
    /// --lang <codice> forza la lingua, --snapshot <cartella> salva la UI in PNG senza mostrare finestre.
    [STAThread]
    static void Main(string[] args)
    {
        string? Option(string name) => Array.IndexOf(args, name) is var i and >= 0 && i + 1 < args.Length ? args[i + 1] : null;

        if (Option("--data-dir") is { } dataDir) AppPaths.SupportDirectory = Path.GetFullPath(dataDir);
        Theme.Forced = Option("--theme") switch { "dark" => true, "light" => false, _ => null };
        Theme.Refresh();

        // Un'istanza per cartella dati: rilanciarla apre il menu di quella già attiva.
        var id = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(AppPaths.SupportDirectory.ToLowerInvariant())))[..16];
        using var mutex = new Mutex(true, $@"Local\Klipski-{id}", out var first);
        using var showSignal = new EventWaitHandle(false, EventResetMode.AutoReset, $@"Local\Klipski-{id}.show");
        if (!first && Option("--snapshot") == null)
        {
            Native.AllowSetForegroundWindow(-1);
            showSignal.Set();
            return;
        }

        var app = new Application { ShutdownMode = ShutdownMode.OnExplicitShutdown };
        app.Resources.MergedDictionaries.Add(new ResourceDictionary { Source = new Uri("pack://application:,,,/Klipski;component/Fluent.xaml") });
        var controller = new AppController(Option("--lang"));

        if (Option("--snapshot") is { } folder)
        {
            Snapshot.Run(controller, folder);
            return;
        }

        controller.Start();
        ThreadPool.RegisterWaitForSingleObject(showSignal,
            (_, _) => app.Dispatcher.BeginInvoke(controller.ShowMenu), null, -1, false);
        app.Startup += (_, _) =>
        {
            if (args.Contains("--settings")) controller.OpenCustomizer();
            if (args.Contains("--show")) controller.ShowMenu();
        };
        app.Run();
    }
}
