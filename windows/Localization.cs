using System.Globalization;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;

namespace Klipski;

/// Stringhe localizzate lette dai Localizable.strings dell'app macOS (incorporati nell'exe).
/// Come su Mac la chiave è il testo italiano; con argomenti è un formato (%d, %@).
static class Loc
{
    public static readonly (string Code, string Name)[] Languages =
    {
        ("it", "Italiano"), ("en", "English"), ("es", "Español"), ("fr", "Français"),
        ("de", "Deutsch"), ("pt", "Português"), ("ru", "Русский"), ("ja", "日本語"),
        ("zh-Hans", "简体中文"), ("ar", "العربية")
    };

    public static string Code { get; private set; } = "en";
    public static bool RightToLeft => Code == "ar";

    private static Dictionary<string, string> table = new();
    private static readonly Regex Line = new("^\"((?:[^\"\\\\]|\\\\.)*)\"\\s*=\\s*\"((?:[^\"\\\\]|\\\\.)*)\";");

    /// `code` nullo = lingua di sistema, con ripiego sull'inglese.
    public static void Load(string? code)
    {
        Code = code ?? SystemLanguage();
        table = Parse(Code);
    }

    private static string SystemLanguage()
    {
        var culture = CultureInfo.CurrentUICulture;
        if (culture.TwoLetterISOLanguageName == "zh") return "zh-Hans";
        return Languages.Any(l => l.Code == culture.TwoLetterISOLanguageName) ? culture.TwoLetterISOLanguageName : "en";
    }

    private static Dictionary<string, string> Parse(string code)
    {
        var result = new Dictionary<string, string>();
        var assembly = Assembly.GetExecutingAssembly();
        var name = assembly.GetManifestResourceNames()
            .FirstOrDefault(n => n.StartsWith(code + ".lproj", StringComparison.Ordinal));
        if (name == null) return result;
        using var reader = new StreamReader(assembly.GetManifestResourceStream(name)!);
        while (reader.ReadLine() is { } line)
        {
            var match = Line.Match(line.Trim());
            if (match.Success) result[Unescape(match.Groups[1].Value)] = Unescape(match.Groups[2].Value);
        }
        return result;
    }

    private static string Unescape(string s) =>
        Regex.Replace(s, @"\\(.)", m => m.Groups[1].Value == "n" ? "\n" : m.Groups[1].Value);

    /// Stringhe che esistono solo su Windows (non nei Localizable.strings del Mac).
    private static readonly Dictionary<string, Dictionary<string, string>> WindowsOnly = new()
    {
        ["%@ è già usata da un'altra app: scegline un'altra."] = new()
        {
            ["it"] = "%@ è già usata da un'altra app: scegline un'altra.",
            ["en"] = "%@ is already used by another app: choose a different one.",
            ["es"] = "%@ ya la usa otra app: elige otra.",
            ["fr"] = "%@ est déjà utilisé par une autre app : choisissez-en un autre.",
            ["de"] = "%@ wird bereits von einer anderen App verwendet: Wähle eine andere.",
            ["pt"] = "%@ já é usado por outro app: escolha outro.",
            ["ru"] = "%@ уже используется другим приложением: выберите другое сочетание.",
            ["ja"] = "%@ は別のアプリで使用されています。別の組み合わせを選んでください。",
            ["zh-Hans"] = "%@ 已被其他应用占用，请选择其他组合。",
            ["ar"] = "%@ مستخدم بالفعل من تطبيق آخر: اختر اختصارًا آخر."
        }
    };

    public static string L(string key, params object[] args)
    {
        var format = table.TryGetValue(key, out var value) ? value
            : WindowsOnly.TryGetValue(key, out var translations) && translations.TryGetValue(Code, out var translated) ? translated
            : key;
        if (args.Length == 0) return format;
        var index = 0;
        return Regex.Replace(format, "%[d@]", _ => index < args.Length ? args[index++].ToString() ?? "" : "");
    }
}

/// Tempo trascorso breve e localizzato ("2 min fa"), con lo stesso motore ICU che usa
/// RelativeDateTimeFormatter su macOS (icu.dll è incluso in Windows 10 1903 e successivi).
/// Numerico come lo stile predefinito di Apple: "1 g fa", non "ieri".
static class RelativeTime
{
    [DllImport("icu.dll", CharSet = CharSet.Ansi)]
    private static extern IntPtr ureldatefmt_open(string locale, IntPtr numberFormat, int width, int context, ref int status);

    [DllImport("icu.dll")]
    private static extern void ureldatefmt_close(IntPtr formatter);

    [DllImport("icu.dll", CharSet = CharSet.Unicode)]
    private static extern int ureldatefmt_formatNumeric(IntPtr formatter, double offset, int unit, char[] result, int capacity, ref int status);

    private const int StyleShort = 1, CapitalizationNone = 256;
    private const int UnitYear = 0, UnitMonth = 2, UnitWeek = 3, UnitDay = 4, UnitHour = 5, UnitMinute = 6, UnitSecond = 7;

    private static IntPtr formatter;
    private static string? formatterLocale;

    public static string Format(DateTime date)
    {
        var seconds = (DateTime.Now - date).TotalSeconds;
        if (seconds < 3) return Loc.L("adesso");
        var (value, unit) = seconds switch
        {
            < 60 => (seconds, UnitSecond),
            < 3600 => (seconds / 60, UnitMinute),
            < 86400 => (seconds / 3600, UnitHour),
            < 7 * 86400 => (seconds / 86400, UnitDay),
            < 30 * 86400 => (seconds / (7 * 86400), UnitWeek),
            < 365 * 86400 => (seconds / (30 * 86400), UnitMonth),
            _ => (seconds / (365 * 86400), UnitYear)
        };
        try
        {
            var locale = Loc.Code.Replace('-', '_');
            if (formatterLocale != locale)
            {
                if (formatter != IntPtr.Zero) ureldatefmt_close(formatter);
                var status = 0;
                formatter = ureldatefmt_open(locale, IntPtr.Zero, StyleShort, CapitalizationNone, ref status);
                formatterLocale = locale;
            }
            if (formatter == IntPtr.Zero) return "";
            var buffer = new char[64];
            var error = 0;
            var length = ureldatefmt_formatNumeric(formatter, -Math.Floor(value), unit, buffer, buffer.Length, ref error);
            return error > 0 ? "" : new string(buffer, 0, length);
        }
        catch (Exception e) when (e is DllNotFoundException or EntryPointNotFoundException)
        {
            return "";
        }
    }
}
