# Klipski for Windows

Native Windows client of Klipski (C# / .NET 8 / WPF), with the same features,
menu and settings as the macOS app in `../Sources/Klipski`, which is the spec.

- Clipboard history of text and images (50 texts and 10 images by default,
  configurable), captured through clipboard events, kept across reboots.
- Popup menu at the mouse cursor on `Ctrl+Shift+V` or from the tray icon:
  Texts with search, Images with preview, snippet folders, Paste automatically,
  Launch at login, Customize…, Clear history, Quit.
- Choosing an item writes plain text (or the image) to the clipboard, gives the
  focus back to the previous window and, with Paste automatically on, sends
  `Ctrl+V`. Pasted snippets are added to the history.
- Entries that password managers mark as private
  (`ExcludeClipboardContentFromMonitorProcessing`,
  `CanIncludeInClipboardHistory=0`, `CanUploadToCloudClipboard=0`) are kept
  but shown masked, like `ConcealedType` on the Mac.
- Backup and restore use the same `Klipski-backup.json` as the Mac, so a
  backup moves between the two. The shortcut is mapped Ctrl ↔ ⌘, Alt ↔ ⌥,
  Shift ↔ ⇧, Win ↔ ⌃.

Data lives in `%APPDATA%\Klipski`: `history.json`, `snippets.json` and
`images\*.png` with the same format as the Mac, plus `settings.json`.

## Build

Requires the .NET 8 SDK on Windows (`winget install Microsoft.DotNet.SDK.8`).

```powershell
cd windows
dotnet publish -c Release -o publish
dotnet run -c Release --project Tests   # logic tests, no UI
```

The result is a single `publish\Klipski.exe` of about 360 KB. It is
framework-dependent: it needs the .NET 8 Desktop Runtime, which Windows offers
to download on first launch if it is missing. Releases attach it as
`Klipski_<version>_windows_x64.zip`.

## Run

```powershell
.\publish\Klipski.exe            # tray icon + Ctrl+Shift+V
.\publish\Klipski.exe --show     # also opens the menu at the cursor right away
.\publish\Klipski.exe --settings # opens Customize…
```

Other options: `--data-dir <folder>` uses another data folder (for tests),
`--theme light|dark` forces the theme, `--lang <code>` forces the language,
`--snapshot <folder>` renders the UI to PNG files without opening windows.
Launching it again while it runs opens the menu.

## Notes

- **Ctrl+Shift+V** is the default to match ⌘⇧V on the Mac, but a global
  shortcut takes it away from every other app: in Chrome, Edge and VS Code it
  normally means "paste as plain text". Pick another one in Customize… if you
  need that. If the shortcut is already taken by another app, Customize… shows
  an error and a notification appears at startup.
- Copying an image file in File Explorer adds the image to the history, but
  unlike the Mac the clipboard keeps the file, so copying files still works.
- Auto-paste cannot type into apps running as administrator while Klipski is
  not (Windows blocks input across privilege levels).
- The strings come from `../Resources/*.lproj/Localizable.strings`, shared with
  the macOS app.

## SmartScreen

The exe is not signed, so on first launch Windows SmartScreen may show
"Windows protected your PC": click **More info**, then **Run anyway**.
