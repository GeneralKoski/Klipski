using System.Runtime.InteropServices;
using System.Windows.Interop;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Threading;

namespace Klipski;

/// Equivalente di ClipboardManager.swift, ma a eventi (AddClipboardFormatListener) invece che a polling.
sealed class ClipboardService
{
    private const int WM_CLIPBOARDUPDATE = 0x031D;
    private const uint CF_UNICODETEXT = 13, CF_DIB = 8, CF_HDROP = 15;
    private static readonly uint CF_PNG = Native.RegisterClipboardFormat("PNG");
    // Formati con cui i password manager marcano il contenuto riservato (equivalenti di ConcealedType/TransientType).
    private static readonly uint CF_EXCLUDE = Native.RegisterClipboardFormat("ExcludeClipboardContentFromMonitorProcessing");
    private static readonly uint CF_HISTORY = Native.RegisterClipboardFormat("CanIncludeInClipboardHistory");
    private static readonly uint CF_CLOUD = Native.RegisterClipboardFormat("CanUploadToCloudClipboard");
    private static readonly string[] ImageExtensions = { ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tif", ".tiff", ".heic", ".webp" };

    private readonly HistoryStore history;
    private readonly HwndSource window;
    private uint lastSequence;
    public Action? OnChange;

    public ClipboardService(HistoryStore history)
    {
        this.history = history;
        // Finestra message-only: riceve solo messaggi, non compare da nessuna parte.
        window = new HwndSource(new HwndSourceParameters("Klipski.Clipboard") { ParentWindow = new IntPtr(-3), WindowStyle = 0 });
        window.AddHook(WndProc);
        lastSequence = Native.GetClipboardSequenceNumber();
    }

    public void Start() => Native.AddClipboardFormatListener(window.Handle);

    private IntPtr WndProc(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
    {
        if (msg == WM_CLIPBOARDUPDATE)
        {
            Dispatcher.CurrentDispatcher.BeginInvoke(DispatcherPriority.Background, Capture);
            handled = true;
        }
        return IntPtr.Zero;
    }

    // MARK: - Scrittura (senza che il listener la ricatturi come nuovo elemento)

    /// Solo testo semplice, come "incolla sempre come testo semplice" su Mac.
    public void SetText(string text)
    {
        if (!Open()) return;
        try
        {
            Native.EmptyClipboard();
            var bytes = System.Text.Encoding.Unicode.GetBytes(text + "\0");
            Native.SetClipboardData(CF_UNICODETEXT, ToGlobal(bytes));
        }
        finally
        {
            Close();
        }
    }

    /// PNG (con trasparenza) per chi lo legge, più una bitmap DIB per tutte le altre app.
    public void SetImage(byte[] png)
    {
        var dib = PngToDib(png);
        if (!Open()) return;
        try
        {
            Native.EmptyClipboard();
            Native.SetClipboardData(CF_PNG, ToGlobal(png));
            if (dib != null) Native.SetClipboardData(CF_DIB, ToGlobal(dib));
        }
        finally
        {
            Close();
        }
    }

    // MARK: - Cattura

    private async void Capture()
    {
        var sequence = Native.GetClipboardSequenceNumber();
        if (sequence == lastSequence) return;
        lastSequence = sequence;

        string? text = null, file = null;
        byte[]? png = null, dib = null;
        var concealed = false;
        if (!Open()) return;
        try
        {
            concealed = IsConcealed();
            file = ImageFile();
            text = ReadText();
            png = ReadBytes(CF_PNG);
            if (png == null) dib = ReadBytes(CF_DIB);
        }
        finally
        {
            Close();
        }

        // 1. File immagine copiato da Esplora file: in cronologia va l'immagine vera.
        //    A differenza del Mac il file resta negli appunti, così copia e incolla di file continua a funzionare.
        if (file != null)
        {
            var data = await Task.Run(() => FileToPng(file));
            if (data != null)
            {
                history.AddImage(data);
                OnChange?.Invoke();
                return;
            }
        }
        // 2. Testo (sempre solo testo semplice).
        if (!string.IsNullOrWhiteSpace(text))
        {
            history.AddText(text, concealed);
            OnChange?.Invoke();
            return;
        }
        // 3. Immagine negli appunti (es. Win+Shift+S, copia immagine dal browser).
        var image = png ?? (dib != null ? await Task.Run(() => DibToPng(dib)) : null);
        if (image != null)
        {
            history.AddImage(image);
            OnChange?.Invoke();
        }
    }

    private static bool IsConcealed()
    {
        if (Native.IsClipboardFormatAvailable(CF_EXCLUDE)) return true;
        foreach (var format in new[] { CF_HISTORY, CF_CLOUD })
        {
            if (ReadBytes(format) is { Length: >= 4 } value && BitConverter.ToInt32(value, 0) == 0) return true;
        }
        return false;
    }

    private static string? ReadText()
    {
        var handle = Native.GetClipboardData(CF_UNICODETEXT);
        if (handle == IntPtr.Zero) return null;
        var pointer = Native.GlobalLock(handle);
        if (pointer == IntPtr.Zero) return null;
        try
        {
            return Marshal.PtrToStringUni(pointer);
        }
        finally
        {
            Native.GlobalUnlock(handle);
        }
    }

    private static byte[]? ReadBytes(uint format)
    {
        if (!Native.IsClipboardFormatAvailable(format)) return null;
        var handle = Native.GetClipboardData(format);
        if (handle == IntPtr.Zero) return null;
        var size = (int)Native.GlobalSize(handle);
        var pointer = Native.GlobalLock(handle);
        if (pointer == IntPtr.Zero) return null;
        try
        {
            var data = new byte[size];
            Marshal.Copy(pointer, data, 0, size);
            return data;
        }
        finally
        {
            Native.GlobalUnlock(handle);
        }
    }

    private static string? ImageFile()
    {
        var drop = Native.GetClipboardData(CF_HDROP);
        if (drop == IntPtr.Zero || Native.DragQueryFile(drop, 0xFFFFFFFF, null, 0) == 0) return null;
        var buffer = new System.Text.StringBuilder(32768);
        Native.DragQueryFile(drop, 0, buffer, buffer.Capacity);
        var path = buffer.ToString();
        return ImageExtensions.Contains(Path.GetExtension(path).ToLowerInvariant()) ? path : null;
    }

    // MARK: - Conversioni immagine

    private static byte[]? FileToPng(string path)
    {
        try
        {
            using var stream = File.OpenRead(path);
            return Encode(BitmapDecoder.Create(stream, BitmapCreateOptions.PreservePixelFormat, BitmapCacheOption.OnLoad).Frames[0]);
        }
        catch (Exception e) when (e is IOException or UnauthorizedAccessException or NotSupportedException or FileFormatException or ArgumentException)
        {
            return null;
        }
    }

    /// Una DIB degli appunti è un file BMP senza intestazione: la ricostruisco e la decodifico.
    private static byte[]? DibToPng(byte[] dib)
    {
        if (dib.Length < 40) return null;
        var headerSize = BitConverter.ToInt32(dib, 0);
        var bitCount = BitConverter.ToUInt16(dib, 14);
        var compression = BitConverter.ToInt32(dib, 16);
        var colorsUsed = BitConverter.ToInt32(dib, 32);
        var masks = compression == 3 && headerSize == 40 ? 12 : 0;
        var palette = (colorsUsed > 0 ? colorsUsed : bitCount <= 8 ? 1 << bitCount : 0) * 4;
        var file = new byte[14 + dib.Length];
        file[0] = (byte)'B';
        file[1] = (byte)'M';
        BitConverter.GetBytes(file.Length).CopyTo(file, 2);
        BitConverter.GetBytes(14 + headerSize + masks + palette).CopyTo(file, 10);
        dib.CopyTo(file, 14);
        try
        {
            using var stream = new MemoryStream(file);
            return Encode(new BmpBitmapDecoder(stream, BitmapCreateOptions.None, BitmapCacheOption.OnLoad).Frames[0]);
        }
        catch (Exception e) when (e is NotSupportedException or FileFormatException or ArgumentException or IOException)
        {
            return null;
        }
    }

    private static byte[] Encode(BitmapSource image)
    {
        var encoder = new PngBitmapEncoder();
        encoder.Frames.Add(BitmapFrame.Create(image));
        using var stream = new MemoryStream();
        encoder.Save(stream);
        return stream.ToArray();
    }

    /// DIB a 32 bit dal basso verso l'alto, con la trasparenza composta su bianco (molte app ignorano l'alfa).
    private static byte[]? PngToDib(byte[] png)
    {
        BitmapSource image;
        try
        {
            using var stream = new MemoryStream(png);
            image = new FormatConvertedBitmap(BitmapFrame.Create(stream, BitmapCreateOptions.None, BitmapCacheOption.OnLoad), PixelFormats.Bgra32, null, 0);
        }
        catch (Exception e) when (e is NotSupportedException or FileFormatException or ArgumentException)
        {
            return null;
        }
        int width = image.PixelWidth, height = image.PixelHeight, stride = width * 4;
        var pixels = new byte[stride * height];
        image.CopyPixels(pixels, stride, 0);
        var dib = new byte[40 + pixels.Length];
        BitConverter.GetBytes(40).CopyTo(dib, 0);
        BitConverter.GetBytes(width).CopyTo(dib, 4);
        BitConverter.GetBytes(height).CopyTo(dib, 8);
        BitConverter.GetBytes((ushort)1).CopyTo(dib, 12);
        BitConverter.GetBytes((ushort)32).CopyTo(dib, 14);
        BitConverter.GetBytes(pixels.Length).CopyTo(dib, 20);
        for (var y = 0; y < height; y++)
        {
            var source = y * stride;
            var target = 40 + (height - 1 - y) * stride;
            for (var x = 0; x < stride; x += 4)
            {
                var alpha = pixels[source + x + 3];
                for (var c = 0; c < 3; c++)
                    dib[target + x + c] = (byte)((pixels[source + x + c] * alpha + 255 * (255 - alpha)) / 255);
                dib[target + x + 3] = 255;
            }
        }
        return dib;
    }

    // MARK: - Win32

    /// Gli appunti possono essere occupati per un attimo da chi li sta scrivendo: qualche tentativo breve.
    private bool Open()
    {
        for (var attempt = 0; attempt < 10; attempt++)
        {
            if (Native.OpenClipboard(window.Handle)) return true;
            Thread.Sleep(20);
        }
        return false;
    }

    private void Close()
    {
        Native.CloseClipboard();
        lastSequence = Native.GetClipboardSequenceNumber();
    }

    private static IntPtr ToGlobal(byte[] data)
    {
        var handle = Native.GlobalAlloc(0x0002, (UIntPtr)data.Length); // GMEM_MOVEABLE
        var pointer = Native.GlobalLock(handle);
        Marshal.Copy(data, 0, pointer, data.Length);
        Native.GlobalUnlock(handle);
        return handle;
    }
}
