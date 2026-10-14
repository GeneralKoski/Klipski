using System.IO;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Media;
using System.Windows.Media.Effects;
using System.Windows.Media.Imaging;

namespace Klipski;

/// Istantanee della UI in PNG senza aprire finestre (verifica senza toccare il desktop).
/// Acrylic, Mica e ombra di DWM qui sono simulati: il resto (righe, testi, colori) è la UI vera.
static class Snapshot
{
    public static void Run(AppController app, string folder)
    {
        Directory.CreateDirectory(folder);
        foreach (var dark in new[] { false, true })
        {
            Theme.Forced = dark;
            Theme.Refresh();
            var suffix = dark ? "dark" : "light";
            Save(MenuScene(app, row: 0, childRow: 0, query: null), Path.Combine(folder, $"menu-texts-{suffix}.png"));
            Save(MenuScene(app, row: 0, childRow: -1, query: "git"), Path.Combine(folder, $"menu-search-{suffix}.png"));
            Save(MenuScene(app, row: 1, childRow: 0, query: null), Path.Combine(folder, $"menu-images-{suffix}.png"));
            Save(MenuScene(app, row: 3, childRow: 1, query: null), Path.Combine(folder, $"menu-snippets-{suffix}.png"));
            Save(SettingsScene(app), Path.Combine(folder, $"settings-{suffix}.png"));
        }
        Theme.Forced = false;
        Theme.Refresh();
        Loc.Load("ar");
        Save(MenuScene(app, row: 0, childRow: 0, query: null), Path.Combine(folder, "menu-texts-ar.png"));
        Save(SettingsScene(app), Path.Combine(folder, "settings-ar.png"));
        Loc.Load("en");
        Save(MenuScene(app, row: 0, childRow: 0, query: null), Path.Combine(folder, "menu-texts-en.png"));
    }

    private static FrameworkElement MenuScene(AppController app, int row, int childRow, string? query)
    {
        var controller = new MenuController();
        var root = new MenuPopup(controller, 0, _ => app.BuildMenu(), searchable: false);
        root.Select(row);
        var entry = root.SelectedEntry!;
        var child = new MenuPopup(controller, 1, entry.Submenu!, entry.Searchable);
        if (query != null) child.Search!.Text = query;
        else if (childRow >= 0) child.Select(childRow);

        var canvas = new Canvas { Width = 1000, Height = 760, Background = Wallpaper(), ClipToBounds = true };
        var rtl = Loc.RightToLeft;
        var mainFrame = Frame(root);
        var childFrame = Frame(child);
        canvas.Children.Add(mainFrame);
        Layout(canvas);
        var mainX = rtl ? canvas.Width - 40 - mainFrame.ActualWidth : 40;
        Canvas.SetLeft(mainFrame, mainX);
        Canvas.SetTop(mainFrame, 30);
        Layout(canvas);

        if (child.SelectedEntry?.Preview?.Invoke() is { } image)
        {
            var preview = PreviewFrame(image);
            canvas.Children.Insert(0, preview);
            Layout(canvas);
            Canvas.SetLeft(preview, (canvas.Width - preview.ActualWidth) / 2 + 150);
            Canvas.SetTop(preview, (canvas.Height - preview.ActualHeight) / 2);
        }

        canvas.Children.Add(childFrame);
        Layout(canvas);
        var top = root.RowTop(row, canvas).Y - MenuPopup.Padding5 - 1;
        Canvas.SetLeft(childFrame, rtl ? mainX - childFrame.ActualWidth + 1 : mainX + mainFrame.ActualWidth - 1);
        Canvas.SetTop(childFrame, top);
        Layout(canvas);
        return canvas;
    }

    /// Cornice che imita il popup sullo schermo: acrylic, bordo e ombra di DWM, angoli da 8 px.
    private static FrameworkElement Frame(MenuPopup popup)
    {
        var content = (Border)popup.Content;
        popup.Content = null;
        content.CornerRadius = new CornerRadius(7);
        return new Border
        {
            Child = content,
            CornerRadius = new CornerRadius(8),
            BorderThickness = new Thickness(1),
            BorderBrush = Hex(Theme.Dark ? "#80000000" : "#1F000000"),
            Background = Hex(Theme.Dark ? "#EB2C2C2C" : "#EBF9F9F9"),
            Effect = new DropShadowEffect { BlurRadius = 28, ShadowDepth = 8, Direction = 270, Opacity = 0.28 }
        };
    }

    private static FrameworkElement PreviewFrame(ImageSource image) => new Border
    {
        CornerRadius = new CornerRadius(8),
        BorderThickness = new Thickness(1),
        BorderBrush = Theme.Rule,
        Background = Hex(Theme.Dark ? "#2B2B2B" : "#F3F3F3"),
        Padding = new Thickness(7),
        Width = 560,
        Child = new Image { Source = image, Stretch = Stretch.Uniform }
    };

    private static FrameworkElement SettingsScene(AppController app)
    {
        var window = new SettingsWindow(app);
        window.SelectForPreview(0, 1);
        var content = (FrameworkElement)window.Content;
        window.Content = null;

        var titleBar = new DockPanel { Height = 32 };
        var caption = new TextBlock { Text = "\uE921      \uE922      \uE8BB", FontFamily = Theme.Icons, FontSize = 10, Margin = new Thickness(0, 0, 18, 0), VerticalAlignment = VerticalAlignment.Center };
        DockPanel.SetDock(caption, Dock.Right);
        titleBar.Children.Add(caption);
        titleBar.Children.Add(new TextBlock { Text = window.Title, FontSize = 12, Margin = new Thickness(16, 0, 0, 0), VerticalAlignment = VerticalAlignment.Center });

        var panel = new DockPanel { FlowDirection = window.FlowDirection };
        DockPanel.SetDock(titleBar, Dock.Top);
        panel.Children.Add(titleBar);
        panel.Children.Add(content);
        var frame = new Border
        {
            Width = window.Width,
            Child = panel,
            Background = Hex(Theme.Dark ? "#FF202020" : "#FFF3F3F3"),
            BorderBrush = Hex(Theme.Dark ? "#FF404040" : "#FFD0D0D0"),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(8)
        };
        TextElement.SetFontFamily(frame, Theme.Font);
        TextElement.SetFontSize(frame, 14);
        TextOptions.SetTextFormattingMode(frame, TextFormattingMode.Display);
        var wrapper = new Border { Padding = new Thickness(30), Background = Wallpaper(), Child = frame };
        Layout(wrapper);
        return wrapper;
    }

    private static Brush Wallpaper()
    {
        var colors = Theme.Dark ? new[] { "#1F2547", "#2E2448", "#3A2834" } : new[] { "#C9D2F2", "#E6DCF3", "#F4E5E2" };
        return new LinearGradientBrush(new GradientStopCollection
        {
            new(((SolidColorBrush)Hex(colors[0])).Color, 0),
            new(((SolidColorBrush)Hex(colors[1])).Color, 0.5),
            new(((SolidColorBrush)Hex(colors[2])).Color, 1)
        }, 45);
    }

    private static Brush Hex(string hex) => new SolidColorBrush((Color)ColorConverter.ConvertFromString(hex));

    private static void Layout(FrameworkElement element)
    {
        element.Measure(new Size(double.PositiveInfinity, double.PositiveInfinity));
        element.Arrange(new Rect(element.DesiredSize));
        element.UpdateLayout();
    }

    private static void Save(FrameworkElement element, string path)
    {
        Layout(element);
        var bitmap = new RenderTargetBitmap((int)Math.Ceiling(element.ActualWidth), (int)Math.Ceiling(element.ActualHeight), 96, 96, PixelFormats.Pbgra32);
        bitmap.Render(element);
        var encoder = new PngBitmapEncoder();
        encoder.Frames.Add(BitmapFrame.Create(bitmap));
        using var stream = File.Create(path);
        encoder.Save(stream);
    }
}
