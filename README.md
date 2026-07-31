# Klipski

A clipboard manager for macOS, written as a replacement for Clipy. It keeps a
history of copied text and images, holds reusable snippets in folders, and pastes
the selected item automatically. It lives in the status bar and has no Dock icon.

Main features: separate history limits for text and images (50 and 10 by
default), snippet folders shown directly in the menu, a configurable global
hotkey (`Cmd+Shift+V` by default), auto-paste, import of snippet folders from a
Clipy XML export, and launch at login.

## Stack

- Swift 6, macOS 14 or later
- AppKit for the UI, Carbon for the global hotkey, ServiceManagement for launch at login
- No external dependencies: a single SwiftPM executable target
- `website/`: a separate landing page in React and Vite

History and snippets are stored as JSON in
`~/Library/Application Support/Klipski/`, with images kept as PNG files
alongside. Preferences live in `UserDefaults` under `com.klipski.app`.

## Running locally

Requires the Xcode Command Line Tools (`xcode-select --install`). Xcode itself is
not needed.

```bash
./build.sh
```

This builds in release mode, assembles `Klipski.app`, signs it ad-hoc, copies it
to `/Applications` and launches it.

Auto-paste simulates `Cmd+V` and needs the Accessibility permission
(System Settings, Privacy and Security, Accessibility). Grant it and restart the
app. Without the permission the item is still copied to the clipboard.

Note: each rebuild changes the ad-hoc signature, so macOS resets the
Accessibility permission and it has to be granted again.

For the landing page:

```bash
cd website
npm install
npm run dev
```

## Status

Complete and working. Releases are automated in GitHub Actions: bumping the
version in `website/package.json` and pushing to `main` creates the matching
`vX.Y.Z` tag and publishes a release with the macOS DMG.

Licensed under MIT.
