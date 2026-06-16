import AppKit
import Carbon

@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate, NSMenuDelegate {
    private var statusItem: NSStatusItem!
    private let menu = NSMenu()

    private let history: HistoryStore
    private let snippets = SnippetStore()
    private let clipboard: ClipboardManager
    private var hotKey: HotKeyManager!
    private var settingsController: SettingsWindowController?

    private let defaults = UserDefaults.standard
    private let autoPasteKey = "autoPaste"
    private let textLimitKey = "textLimit"
    private let imageLimitKey = "imageLimit"
    private let hotKeyCodeKey = "hotKeyCode"
    private let hotKeyModifiersKey = "hotKeyModifiers"
    private let extractImageKey = "extractImageFromFiles"

    private var extractImageFromFiles: Bool {
        get { defaults.bool(forKey: extractImageKey) }
        set { defaults.set(newValue, forKey: extractImageKey) }
    }

    private var autoPaste: Bool {
        get { defaults.bool(forKey: autoPasteKey) }
        set { defaults.set(newValue, forKey: autoPasteKey) }
    }

    override init() {
        if defaults.object(forKey: textLimitKey) == nil {
            defaults.set(50, forKey: textLimitKey)
        }
        if defaults.object(forKey: imageLimitKey) == nil {
            defaults.set(10, forKey: imageLimitKey)
        }
        if defaults.object(forKey: autoPasteKey) == nil {
            defaults.set(true, forKey: autoPasteKey)
        }
        if defaults.object(forKey: extractImageKey) == nil {
            defaults.set(true, forKey: extractImageKey)
        }
        if defaults.object(forKey: hotKeyCodeKey) == nil {
            defaults.set(9, forKey: hotKeyCodeKey) // V
        }
        if defaults.object(forKey: hotKeyModifiersKey) == nil {
            defaults.set(Int(cmdKey | shiftKey), forKey: hotKeyModifiersKey)
        }
        let textLimit = max(defaults.integer(forKey: textLimitKey), 1)
        let imageLimit = max(defaults.integer(forKey: imageLimitKey), 1)
        self.history = HistoryStore(textLimit: textLimit, imageLimit: imageLimit)
        self.clipboard = ClipboardManager(history: history)
        super.init()
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        if let button = statusItem.button {
            if let image = NSImage(systemSymbolName: "doc.on.clipboard", accessibilityDescription: "Klipski") {
                image.isTemplate = true
                button.image = image
            } else {
                button.title = "📋"
            }
        }
        menu.delegate = self
        statusItem.menu = menu

        clipboard.extractImageFromFiles = extractImageFromFiles
        clipboard.start()

        let code = UInt32(defaults.integer(forKey: hotKeyCodeKey))
        let mods = UInt32(defaults.integer(forKey: hotKeyModifiersKey))
        hotKey = HotKeyManager(keyCode: code, modifiers: mods) { [weak self] in
            self?.showMenu()
        }
        hotKey.register()

        // Auto-incolla attivo di default: registra l'app tra le app Accessibilità
        // (mostra il prompt di sistema se il permesso non è ancora stato concesso).
        if autoPaste {
            Paster.ensureAccessibility(prompt: true)
        }
    }

    // MARK: - Menu

    private func showMenu() {
        statusItem.button?.performClick(nil)
    }

    func menuNeedsUpdate(_ menu: NSMenu) {
        menu.removeAllItems()

        menu.addItem(makeHistoryMenu(title: "Testi", kind: .text))
        menu.addItem(makeHistoryMenu(title: "Immagini", kind: .image))

        menu.addItem(.separator())
        addSnippetFolders(to: menu)
        menu.addItem(.separator())

        let autoActive = autoPaste && Paster.isTrusted
        let autoTitle = (autoPaste && !Paster.isTrusted)
            ? "Incolla automaticamente (manca permesso Accessibilità)"
            : "Incolla automaticamente"
        let autoItem = NSMenuItem(title: autoTitle, action: #selector(toggleAutoPaste), keyEquivalent: "")
        autoItem.target = self
        autoItem.state = autoActive ? .on : .off
        menu.addItem(autoItem)

        let extractItem = NSMenuItem(title: "Estrai immagine dai file copiati", action: #selector(toggleExtractImage), keyEquivalent: "")
        extractItem.target = self
        extractItem.state = extractImageFromFiles ? .on : .off
        menu.addItem(extractItem)

        let loginItem = NSMenuItem(title: "Avvia al login", action: #selector(toggleLogin), keyEquivalent: "")
        loginItem.target = self
        loginItem.state = LoginItemManager.isEnabled ? .on : .off
        menu.addItem(loginItem)

        menu.addItem(.separator())

        // Selettore volutamente neutro (non "settings"/"preferences") per evitare
        // l'icona automatica che macOS Tahoe assegna alle voci riconosciute come Impostazioni.
        let prefsItem = NSMenuItem(title: "Personalizza…", action: #selector(openCustomizer), keyEquivalent: "")
        prefsItem.target = self
        menu.addItem(prefsItem)

        let clearItem = NSMenuItem(title: "Pulisci cronologia", action: #selector(clearHistory), keyEquivalent: "")
        clearItem.target = self
        menu.addItem(clearItem)

        let quitItem = NSMenuItem(title: "Esci", action: #selector(quit), keyEquivalent: "q")
        quitItem.target = self
        menu.addItem(quitItem)
    }

    private func makeHistoryMenu(title: String, kind: ClipItem.Kind) -> NSMenuItem {
        let entries = history.items.enumerated().filter { $0.element.kind == kind }
        let parent = NSMenuItem(title: "\(title) (\(entries.count))", action: nil, keyEquivalent: "")
        let submenu = NSMenu()
        if entries.isEmpty {
            let empty = NSMenuItem(title: "Vuoto", action: nil, keyEquivalent: "")
            empty.isEnabled = false
            submenu.addItem(empty)
        } else {
            for (index, item) in entries {
                submenu.addItem(makeHistoryItem(item, index: index))
            }
        }
        parent.submenu = submenu
        return parent
    }

    private func makeHistoryItem(_ item: ClipItem, index: Int) -> NSMenuItem {
        let menuItem = NSMenuItem(title: "", action: #selector(selectHistoryItem(_:)), keyEquivalent: "")
        menuItem.target = self
        menuItem.tag = index

        switch item.kind {
        case .text:
            menuItem.title = truncate(item.text ?? "")
        case .image:
            menuItem.title = "Immagine"
            if let url = history.imageURL(for: item), let image = NSImage(contentsOf: url) {
                menuItem.image = thumbnail(image)
            }
        }
        return menuItem
    }

    private func addSnippetFolders(to menu: NSMenu) {
        guard !snippets.folders.isEmpty else {
            let empty = NSMenuItem(title: "Nessuno snippet (crea da Personalizza…)", action: nil, keyEquivalent: "")
            empty.isEnabled = false
            menu.addItem(empty)
            return
        }
        for (folderIndex, folder) in snippets.folders.enumerated() {
            menu.addItem(makeFolderMenu(folder, folderIndex: folderIndex))
        }
    }

    private func makeFolderMenu(_ folder: SnippetFolder, folderIndex: Int) -> NSMenuItem {
        let parent = NSMenuItem(title: folder.name, action: nil, keyEquivalent: "")
        let submenu = NSMenu()

        if folder.snippets.isEmpty {
            let empty = NSMenuItem(title: "Vuota", action: nil, keyEquivalent: "")
            empty.isEnabled = false
            submenu.addItem(empty)
        } else {
            for (snippetIndex, snippet) in folder.snippets.enumerated() {
                let item = NSMenuItem(title: snippet.title, action: #selector(selectSnippet(_:)), keyEquivalent: "")
                item.target = self
                item.representedObject = "\(folderIndex):\(snippetIndex)"
                submenu.addItem(item)
            }
        }

        parent.submenu = submenu
        return parent
    }

    // MARK: - Actions

    @objc private func selectHistoryItem(_ sender: NSMenuItem) {
        guard history.items.indices.contains(sender.tag) else { return }
        let item = history.items[sender.tag]
        switch item.kind {
        case .text:
            clipboard.setText(item.text ?? "")
        case .image:
            if let url = history.imageURL(for: item), let data = try? Data(contentsOf: url) {
                clipboard.setImage(data)
            }
        }
        pasteIfNeeded()
    }

    @objc private func selectSnippet(_ sender: NSMenuItem) {
        guard let ref = sender.representedObject as? String else { return }
        let parts = ref.split(separator: ":").compactMap { Int($0) }
        guard parts.count == 2,
              snippets.folders.indices.contains(parts[0]),
              snippets.folders[parts[0]].snippets.indices.contains(parts[1]) else { return }
        clipboard.setText(snippets.folders[parts[0]].snippets[parts[1]].content)
        pasteIfNeeded()
    }

    @objc private func toggleAutoPaste() {
        // La spunta riflette lo stato effettivo (attivo + permesso concesso).
        let active = autoPaste && Paster.isTrusted
        if active {
            autoPaste = false
            return
        }
        autoPaste = true
        if !Paster.ensureAccessibility(prompt: true) {
            let alert = NSAlert()
            alert.messageText = "Permesso Accessibilità richiesto"
            alert.informativeText = "Per incollare automaticamente (Cmd+V), abilita Klipski in Impostazioni di Sistema → Privacy e sicurezza → Accessibilità, poi riavvia Klipski. Senza il permesso l'elemento verrà solo copiato negli appunti."
            alert.addButton(withTitle: "OK")
            NSApp.activate(ignoringOtherApps: true)
            alert.runModal()
        }
    }

    @objc private func toggleExtractImage() {
        extractImageFromFiles.toggle()
        clipboard.extractImageFromFiles = extractImageFromFiles
    }

    @objc private func toggleLogin() {
        LoginItemManager.setEnabled(!LoginItemManager.isEnabled)
    }

    @objc private func openCustomizer() {
        if settingsController == nil {
            let defaults = self.defaults
            let textKey = textLimitKey
            let imageKey = imageLimitKey
            let codeKey = hotKeyCodeKey
            let modsKey = hotKeyModifiersKey
            let code = UInt32(defaults.integer(forKey: hotKeyCodeKey))
            let mods = UInt32(defaults.integer(forKey: hotKeyModifiersKey))
            settingsController = SettingsWindowController(
                snippets: snippets,
                history: history,
                hotKeyCode: code,
                hotKeyModifiers: mods,
                saveLimits: { textLimit, imageLimit in
                    defaults.set(textLimit, forKey: textKey)
                    defaults.set(imageLimit, forKey: imageKey)
                },
                onHotKeyChange: { [weak self] newCode, newMods in
                    defaults.set(Int(newCode), forKey: codeKey)
                    defaults.set(Int(newMods), forKey: modsKey)
                    self?.hotKey.update(keyCode: newCode, modifiers: newMods)
                }
            )
        }
        settingsController?.reloadAll()
        NSApp.activate(ignoringOtherApps: true)
        settingsController?.showWindow(nil)
        settingsController?.window?.makeKeyAndOrderFront(nil)
    }

    @objc private func clearHistory() {
        history.clear()
    }

    @objc private func quit() {
        NSApplication.shared.terminate(nil)
    }

    // MARK: - Helpers

    private func pasteIfNeeded() {
        guard autoPaste, Paster.isTrusted else { return }
        // Piccolo ritardo per lasciare che la chiusura del menu restituisca il focus all'app precedente.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
            Paster.paste()
        }
    }

    private func thumbnail(_ image: NSImage, maxSide: CGFloat = 48) -> NSImage {
        let size = image.size
        guard size.width > 0, size.height > 0 else { return image }
        let scale = min(maxSide / size.width, maxSide / size.height, 1)
        let target = NSSize(width: size.width * scale, height: size.height * scale)
        let thumb = NSImage(size: target)
        thumb.lockFocus()
        image.draw(in: NSRect(origin: .zero, size: target),
                   from: NSRect(origin: .zero, size: size),
                   operation: .copy, fraction: 1.0)
        thumb.unlockFocus()
        return thumb
    }

    private func truncate(_ text: String, max: Int = 50) -> String {
        let oneLine = text.replacingOccurrences(of: "\n", with: " ")
            .trimmingCharacters(in: .whitespaces)
        if oneLine.count <= max { return oneLine }
        return String(oneLine.prefix(max)) + "…"
    }

}
