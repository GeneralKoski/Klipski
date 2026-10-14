namespace Klipski;

/// Cartella dei dati: %APPDATA%\Klipski, oppure quella passata con --data-dir (test).
static class AppPaths
{
    public static string SupportDirectory { get; set; } =
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Klipski");

    public static string ImagesDirectory => Path.Combine(SupportDirectory, "images");

    public static string File(string name) => Path.Combine(SupportDirectory, name);

    public static void EnsureDirectory(string path) => Directory.CreateDirectory(path);

    /// Scrive su un file temporaneo e poi lo sostituisce: un crash a metà non lascia JSON troncati.
    public static void WriteAtomic(string path, byte[] data)
    {
        var temp = path + ".tmp";
        System.IO.File.WriteAllBytes(temp, data);
        System.IO.File.Move(temp, path, overwrite: true);
    }
}
