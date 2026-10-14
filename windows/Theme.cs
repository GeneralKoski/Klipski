using System.Windows;
using System.Windows.Media;
using Microsoft.Win32;

namespace Klipski;

/// Colori del menu presi dal mockup del sito (website/src/styles.css), che riproduce il menu macOS.
static class Theme
{
    /// Forzato da riga di comando (--theme light|dark), altrimenti segue Windows.
    public static bool? Forced;

    public static bool Dark { get; private set; }
    public static bool TaskbarDark { get; private set; }

    /// Acrylic/Mica di sistema: Windows 11 22H2 o successivo.
    public static bool BackdropSupported => Environment.OSVersion.Version.Build >= 22621;

    public static Brush Ink { get; private set; } = Brushes.Black;
    public static Brush Ink2 { get; private set; } = Brushes.Gray;
    public static Brush Rule { get; private set; } = Brushes.Gray;
    public static Brush FieldBg { get; private set; } = Brushes.Transparent;
    public static Brush MenuTint { get; private set; } = Brushes.White;
    public static Brush Highlight { get; private set; } = Brushes.Blue;
    public static Brush OnHighlight => Brushes.White;

    /// Rilegge tema e accento di Windows: va chiamato prima di costruire menu o finestre.
    public static void Refresh()
    {
        Dark = Forced ?? ReadPersonalize("AppsUseLightTheme") == 0;
        TaskbarDark = Forced ?? ReadPersonalize("SystemUsesLightTheme") == 0;
        Ink = Brush(Dark ? "#F2F3F8" : "#141622");
        Ink2 = Brush(Dark ? "#8CF2F3F8" : "#85141622");
        Rule = Brush(Dark ? "#1FFFFFFF" : "#1A141622");
        FieldBg = Brush(Dark ? "#12FFFFFF" : "#0D141622");
        // Velo sopra l'acrylic per avvicinarsi alla tinta del menu macOS; senza backdrop è opaco.
        MenuTint = BackdropSupported
            ? Brush(Dark ? "#59262834" : "#73F8F8FB")
            : Brush(Dark ? "#FF262834" : "#FFF8F8FB");
        var highlight = new SolidColorBrush(Accent);
        highlight.Freeze();
        Highlight = highlight;
        if (Application.Current != null) ApplyFluent(Application.Current.Resources);
    }

    /// Colore d'accento di Windows (di default azzurro); se troppo chiaro per il testo bianco usa la variante scura.
    private static Color Accent => Luminance(Palette(3)) > 0.45 ? Palette(4) : Palette(3);

    /// AccentPalette: 8 colori RGBA dal più chiaro al più scuro (3 = base, 1 = Light2, 4 = Dark1).
    private static Color Palette(int index)
    {
        var palette = Registry.GetValue(@"HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\Accent",
                                        "AccentPalette", null) as byte[];
        if (palette is not { Length: >= 32 })
            return index switch { 1 => Color.FromRgb(0x99, 0xEB, 0xFF), 4 => Color.FromRgb(0x00, 0x5F, 0xB8), _ => Color.FromRgb(0x00, 0x78, 0xD4) };
        return Color.FromRgb(palette[index * 4], palette[index * 4 + 1], palette[index * 4 + 2]);
    }

    /// Pennelli dei controlli Fluent (Fluent.xaml), con i valori dei token di WinUI 3.
    private static void ApplyFluent(ResourceDictionary resources)
    {
        void Set(string key, string light, string dark) => resources[key] = Brush(Dark ? dark : light);
        Set("TextPrimary", "#E4000000", "#FFFFFFFF");
        Set("TextSecondary", "#9E000000", "#C5FFFFFF");
        Set("TextDisabled", "#5C000000", "#5DFFFFFF");
        Set("ControlFill", "#B3FFFFFF", "#0FFFFFFF");
        Set("ControlFillHover", "#80F9F9F9", "#15FFFFFF");
        Set("ControlFillPressed", "#4DF9F9F9", "#08FFFFFF");
        Set("ControlStroke", "#0F000000", "#12FFFFFF");
        Set("ControlStrokeBottom", "#29000000", "#18FFFFFF");
        Set("StrongStroke", "#9C000000", "#8BFFFFFF");
        Set("InputActive", "#FFFFFFFF", "#B31E1E1E");
        Set("CardFill", "#B3FFFFFF", "#0DFFFFFF");
        Set("CardStroke", "#0F000000", "#19000000");
        Set("SubtleHover", "#09000000", "#0FFFFFFF");
        Set("SubtlePressed", "#06000000", "#0AFFFFFF");
        Set("Divider", "#0F000000", "#15FFFFFF");
        Set("FlyoutFill", "#FFF9F9F9", "#FF2C2C2C");
        Set("FlyoutStroke", "#0F000000", "#33000000");
        Set("WindowFill", BackdropSupported ? "#00000000" : "#FFF3F3F3", BackdropSupported ? "#00000000" : "#FF202020");
        var accent = new SolidColorBrush(Dark ? Palette(1) : Palette(4));
        accent.Freeze();
        resources["AccentFill"] = accent;
        resources["TextOnAccent"] = Dark ? Brushes.Black : Brushes.White;
    }

    private static double Luminance(Color c) => (0.2126 * c.R + 0.7152 * c.G + 0.0722 * c.B) / 255;

    private static int ReadPersonalize(string name) =>
        Registry.GetValue(@"HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize", name, 1) is int v ? v : 1;

    private static SolidColorBrush Brush(string hex)
    {
        var brush = new SolidColorBrush((Color)ColorConverter.ConvertFromString(hex));
        brush.Freeze();
        return brush;
    }

    public static readonly FontFamily Font = new("Segoe UI Variable Text, Segoe UI");
    public static readonly FontFamily Icons = new("Segoe Fluent Icons, Segoe MDL2 Assets");
}
