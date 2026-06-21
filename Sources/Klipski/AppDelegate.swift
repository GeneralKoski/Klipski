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
    private let imageMenuDelegate = ImageMenuHighlightDelegate()

    private weak var highlightedMainItem: NSMenuItem?
    private weak var wrapField: MenuArrowWrapField?

    private let defaults = UserDefaults.standard
    private let autoPasteKey = "autoPaste"
    private let textLimitKey = "textLimit"
    private let imageLimitKey = "imageLimit"
    private let hotKeyCodeKey = "hotKeyCode"
    private let hotKeyModifiersKey = "hotKeyModifiers"
    private let languageOverrideKey = "languageOverride"

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
            button.image = AppDelegate.statusBarIcon()
        }
        menu.delegate = self
        statusItem.menu = menu

        clipboard.onChange = { [weak self] in self?.flashCapture() }
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

    /// Icona "K" nitida e template (si adatta a barra chiara/scura).
    private static func statusBarIcon() -> NSImage {
        let size = NSSize(width: 18, height: 18)
        let image = NSImage(size: size, flipped: false) { rect in
            let style = NSMutableParagraphStyle()
            style.alignment = .center
            let font = NSFont.systemFont(ofSize: 15, weight: .bold)
            let attrs: [NSAttributedString.Key: Any] = [
                .font: font,
                .foregroundColor: NSColor.black,
                .paragraphStyle: style
            ]
            let letter = "K" as NSString
            let textSize = letter.size(withAttributes: attrs)
            let point = NSPoint(x: 0, y: (rect.height - textSize.height) / 2)
            letter.draw(in: NSRect(x: point.x, y: point.y, width: rect.width, height: textSize.height),
                        withAttributes: attrs)
            return true
        }
        image.isTemplate = true
        return image
    }

    /// Lampo discreto dell'icona nella barra di stato alla cattura di un nuovo elemento.
    private func flashCapture() {
        guard let button = statusItem.button else { return }
        button.image = AppDelegate.statusBarIconFilled()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) { [weak self] in
            self?.statusItem.button?.image = AppDelegate.statusBarIcon()
        }
    }

    /// Variante piena (non-template) usata per il lampo di conferma.
    private static func statusBarIconFilled() -> NSImage {
        let size = NSSize(width: 18, height: 18)
        let image = NSImage(size: size, flipped: false) { rect in
            let circle = NSBezierPath(ovalIn: rect.insetBy(dx: 0.5, dy: 0.5))
            NSColor.white.setFill()
            circle.fill()
            let style = NSMutableParagraphStyle()
            style.alignment = .center
            let attrs: [NSAttributedString.Key: Any] = [
                .font: NSFont.systemFont(ofSize: 12, weight: .bold),
                .foregroundColor: NSColor.black,
                .paragraphStyle: style
            ]
            let letter = "K" as NSString
            let textSize = letter.size(withAttributes: attrs)
            let point = NSPoint(x: 0, y: (rect.height - textSize.height) / 2)
            letter.draw(in: NSRect(x: point.x, y: point.y, width: rect.width, height: textSize.height),
                        withAttributes: attrs)
            return true
        }
        image.isTemplate = false
        return image
    }

    // MARK: - Menu

    private func showMenu() {
        statusItem.button?.performClick(nil)
    }

    // Wrap su/giù nel menu principale: il campo invisibile in cima cattura le frecce
    // e qui teniamo traccia della voce evidenziata.
    func menu(_ menu: NSMenu, willHighlight item: NSMenuItem?) {
        guard menu === self.menu else { return }
        highlightedMainItem = item
        // Tornati a navigare il menu principale (es. dopo essere usciti da un
        // sottomenu), il campo riprende il focus così il wrap su/giù continua a funzionare.
        DispatchQueue.main.async { [weak self] in self?.wrapField?.grabFocus() }
    }

    func menuNeedsUpdate(_ menu: NSMenu) {
        menu.removeAllItems()
        highlightedMainItem = nil

        let wrapItem = NSMenuItem()
        let wrapField = MenuArrowWrapField(frame: NSRect(x: 0, y: 0, width: 1, height: 1))
        wrapField.highlightedItem = { [weak self] in self?.highlightedMainItem }
        self.wrapField = wrapField
        wrapItem.view = wrapField
        menu.addItem(wrapItem)

        menu.addItem(makeTextMenu())
        menu.addItem(makeImageMenu())

        menu.addItem(.separator())
        addSnippetFolders(to: menu)
        menu.addItem(.separator())

        let autoActive = autoPaste && Paster.isTrusted
        let autoItem = NSMenuItem(title: L("Incolla automaticamente"), action: #selector(toggleAutoPaste), keyEquivalent: "")
        autoItem.target = self
        autoItem.state = autoActive ? .on : .off
        menu.addItem(autoItem)

        let loginItem = NSMenuItem(title: L("Avvia al login"), action: #selector(toggleLogin), keyEquivalent: "")
        loginItem.target = self
        loginItem.state = LoginItemManager.isEnabled ? .on : .off
        menu.addItem(loginItem)

        menu.addItem(.separator())

        // Selettore volutamente neutro (non "settings"/"preferences") per evitare
        // l'icona automatica che macOS Tahoe assegna alle voci riconosciute come Impostazioni.
        let prefsItem = NSMenuItem(title: L("Personalizza…"), action: #selector(openCustomizer), keyEquivalent: "")
        prefsItem.target = self
        menu.addItem(prefsItem)

        let clearItem = NSMenuItem(title: L("Pulisci cronologia"), action: #selector(clearHistory), keyEquivalent: "")
        clearItem.target = self
        menu.addItem(clearItem)

        let quitItem = NSMenuItem(title: L("Esci"), action: #selector(quit), keyEquivalent: "q")
        quitItem.target = self
        menu.addItem(quitItem)
    }

    private func makeTextMenu() -> NSMenuItem {
        let count = history.items.lazy.filter { $0.kind == .text }.count
        let parent = NSMenuItem(title: L("Testi (%d)", count), action: nil, keyEquivalent: "")
        let submenu = NSMenu()

        let searchItem = NSMenuItem()
        let searchView = MenuSearchField(frame: NSRect(x: 0, y: 0, width: 260, height: 36))
        searchView.onChange = { [weak self, weak submenu] query in
            guard let self, let submenu else { return }
            self.populateTextMenu(submenu, query: query)
        }
        searchItem.view = searchView
        submenu.addItem(searchItem)

        populateTextMenu(submenu, query: "")
        parent.submenu = submenu
        return parent
    }

    /// Riempie il sottomenu Testi sotto il campo di ricerca (item 0), filtrando per `query`.
    private func populateTextMenu(_ submenu: NSMenu, query: String) {
        while submenu.items.count > 1 {
            submenu.removeItem(at: 1)
        }
        let entries = history.items.enumerated().filter { $0.element.kind == .text }
        let q = query.trimmingCharacters(in: .whitespaces).lowercased()
        let filtered = q.isEmpty ? Array(entries) : entries.filter { ($0.element.text ?? "").lowercased().contains(q) }

        if filtered.isEmpty {
            let empty = NSMenuItem(title: q.isEmpty ? L("Vuoto") : L("Nessun risultato"), action: nil, keyEquivalent: "")
            empty.isEnabled = false
            submenu.addItem(empty)
        } else {
            for (index, item) in filtered {
                submenu.addItem(makeHistoryItem(item, index: index))
            }
            MenuHighlighter.highlightFirstResult(in: submenu)
        }
    }

    private func makeImageMenu() -> NSMenuItem {
        let entries = history.items.enumerated().filter { $0.element.kind == .image }
        let parent = NSMenuItem(title: L("Immagini (%d)", entries.count), action: nil, keyEquivalent: "")
        let submenu = NSMenu()
        submenu.delegate = imageMenuDelegate
        if entries.isEmpty {
            let empty = NSMenuItem(title: L("Vuoto"), action: nil, keyEquivalent: "")
            empty.isEnabled = false
            submenu.addItem(empty)
        } else {
            for (index, item) in entries {
                guard let url = history.imageURL(for: item), let image = NSImage(contentsOf: url) else { continue }
                let menuItem = NSMenuItem(title: L("Immagine"), action: #selector(selectHistoryItem(_:)), keyEquivalent: "")
                menuItem.attributedTitle = titleWithTimestamp(L("Immagine"), date: item.createdAt)
                menuItem.target = self
                menuItem.tag = index
                menuItem.image = thumbnail(image)
                menuItem.representedObject = url // usata dal delegate per l'anteprima
                submenu.addItem(menuItem)
            }
        }
        parent.submenu = submenu
        return parent
    }

    private func makeHistoryItem(_ item: ClipItem, index: Int) -> NSMenuItem {
        switch item.kind {
        case .text:
            // Elemento riservato (es. password da un password manager): titolo oscurato,
            // ma il contenuto reale resta e si incolla normalmente.
            if item.concealed == true {
                let masked = maskedTitle(item.text ?? "")
                let menuItem = NSMenuItem(title: masked, action: #selector(selectHistoryItem(_:)), keyEquivalent: "")
                menuItem.attributedTitle = titleWithTimestamp(masked, date: item.createdAt)
                menuItem.target = self
                menuItem.tag = index
                return menuItem
            }
            // Testo con formattazione: sottomenu con la scelta. Altrimenti click singolo.
            if item.rtfData != nil {
                let parent = NSMenuItem(title: truncate(item.text ?? ""), action: nil, keyEquivalent: "")
                parent.attributedTitle = titleWithTimestamp(truncate(item.text ?? ""), date: item.createdAt)
                let submenu = NSMenu()
                let formatted = NSMenuItem(title: L("Incolla con formattazione"), action: #selector(selectTextFormatted(_:)), keyEquivalent: "")
                formatted.target = self
                formatted.tag = index
                submenu.addItem(formatted)
                let plain = NSMenuItem(title: L("Incolla solo testo"), action: #selector(selectHistoryItem(_:)), keyEquivalent: "")
                plain.target = self
                plain.tag = index
                submenu.addItem(plain)
                parent.submenu = submenu
                return parent
            }
            let menuItem = NSMenuItem(title: truncate(item.text ?? ""), action: #selector(selectHistoryItem(_:)), keyEquivalent: "")
            menuItem.attributedTitle = titleWithTimestamp(truncate(item.text ?? ""), date: item.createdAt)
            menuItem.target = self
            menuItem.tag = index
            return menuItem
        case .image:
            let menuItem = NSMenuItem(title: L("Immagine"), action: #selector(selectHistoryItem(_:)), keyEquivalent: "")
            menuItem.attributedTitle = titleWithTimestamp(L("Immagine"), date: item.createdAt)
            menuItem.target = self
            menuItem.tag = index
            if let url = history.imageURL(for: item), let image = NSImage(contentsOf: url) {
                menuItem.image = thumbnail(image)
            }
            return menuItem
        }
    }

    private func addSnippetFolders(to menu: NSMenu) {
        guard !snippets.folders.isEmpty else {
            let empty = NSMenuItem(title: L("Nessuno snippet (crea da Personalizza…)"), action: nil, keyEquivalent: "")
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
            let empty = NSMenuItem(title: L("Vuota"), action: nil, keyEquivalent: "")
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
            history.addText(item.text ?? "", rtf: item.rtfData, concealed: item.concealed ?? false)
        case .image:
            if let url = history.imageURL(for: item), let data = try? Data(contentsOf: url) {
                clipboard.setImage(data)
                history.addImage(data)
            }
        }
        pasteIfNeeded()
    }

    @objc private func selectTextFormatted(_ sender: NSMenuItem) {
        guard history.items.indices.contains(sender.tag) else { return }
        let item = history.items[sender.tag]
        if let rtf = item.rtfData {
            clipboard.setRichText(rtf, plain: item.text ?? "")
        } else {
            clipboard.setText(item.text ?? "")
        }
        history.addText(item.text ?? "", rtf: item.rtfData, concealed: item.concealed ?? false)
        pasteIfNeeded()
    }

    @objc private func selectSnippet(_ sender: NSMenuItem) {
        guard let ref = sender.representedObject as? String else { return }
        let parts = ref.split(separator: ":").compactMap { Int($0) }
        guard parts.count == 2,
              snippets.folders.indices.contains(parts[0]),
              snippets.folders[parts[0]].snippets.indices.contains(parts[1]) else { return }
        let content = snippets.folders[parts[0]].snippets[parts[1]].content
        clipboard.setText(content)
        history.addText(content, rtf: nil, concealed: false)
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
        Paster.ensureAccessibility(prompt: true)
    }

    @objc private func toggleLogin() {
        LoginItemManager.setEnabled(!LoginItemManager.isEnabled)
    }

    /// Imposta la lingua dell'app (nil = automatica da sistema) e riavvia per applicarla.
    private func setLanguage(_ code: String?) {
        if let code {
            defaults.set(code, forKey: languageOverrideKey)
            defaults.set([code], forKey: "AppleLanguages")
        } else {
            defaults.removeObject(forKey: languageOverrideKey)
            defaults.removeObject(forKey: "AppleLanguages")
        }
        defaults.synchronize()
        relaunch()
    }

    private func relaunch() {
        let path = Bundle.main.bundlePath
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/bin/sh")
        process.arguments = ["-c", "sleep 1; open \"\(path)\""]
        try? process.run()
        NSApp.terminate(nil)
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
                },
                onExport: { [weak self] in self?.exportData() },
                onImport: { [weak self] in self?.importData() },
                currentLanguage: defaults.string(forKey: languageOverrideKey),
                onLanguageChange: { [weak self] code in self?.setLanguage(code) }
            )
        }
        settingsController?.reloadAll()
        NSApp.activate(ignoringOtherApps: true)
        settingsController?.showWindow(nil)
        settingsController?.window?.makeKeyAndOrderFront(nil)
    }

    private struct KlipskiBackup: Codable {
        var snippets: [SnippetFolder]
        var textLimit: Int
        var imageLimit: Int
        var autoPaste: Bool
        var hotKeyCode: Int
        var hotKeyModifiers: Int
    }

    private func exportData() {
        let backup = KlipskiBackup(
            snippets: snippets.folders,
            textLimit: history.textLimit,
            imageLimit: history.imageLimit,
            autoPaste: autoPaste,
            hotKeyCode: defaults.integer(forKey: hotKeyCodeKey),
            hotKeyModifiers: defaults.integer(forKey: hotKeyModifiersKey)
        )
        let panel = NSSavePanel()
        panel.nameFieldStringValue = "Klipski-backup.json"
        panel.allowedContentTypes = [.json]
        NSApp.activate(ignoringOtherApps: true)
        guard panel.runModal() == .OK, let url = panel.url else { return }
        do {
            let encoder = JSONEncoder()
            encoder.outputFormatting = [.prettyPrinted]
            try encoder.encode(backup).write(to: url)
        } catch {
            showAlert(title: L("Esportazione fallita"), text: "\(error.localizedDescription)")
        }
    }

    private func importData() {
        let panel = NSOpenPanel()
        panel.allowedContentTypes = [.json]
        panel.allowsMultipleSelection = false
        panel.message = L("Seleziona un file Klipski-backup.json")
        NSApp.activate(ignoringOtherApps: true)
        guard panel.runModal() == .OK, let url = panel.url else { return }
        guard let data = try? Data(contentsOf: url),
              let backup = try? JSONDecoder().decode(KlipskiBackup.self, from: data) else {
            showAlert(title: L("Importazione fallita"), text: L("Il file non è un backup di Klipski valido."))
            return
        }
        snippets.replaceAll(backup.snippets)
        defaults.set(backup.textLimit, forKey: textLimitKey)
        defaults.set(backup.imageLimit, forKey: imageLimitKey)
        defaults.set(backup.hotKeyCode, forKey: hotKeyCodeKey)
        defaults.set(backup.hotKeyModifiers, forKey: hotKeyModifiersKey)
        autoPaste = backup.autoPaste

        history.updateLimits(textLimit: backup.textLimit, imageLimit: backup.imageLimit)
        hotKey.update(keyCode: UInt32(backup.hotKeyCode), modifiers: UInt32(backup.hotKeyModifiers))

        settingsController?.reloadAll()
        settingsController?.setRecorder(keyCode: UInt32(backup.hotKeyCode), modifiers: UInt32(backup.hotKeyModifiers))
        showAlert(title: L("Importazione completata"), text: L("Snippet e impostazioni ripristinati."))
    }

    private func showAlert(title: String, text: String) {
        let alert = NSAlert()
        alert.messageText = title
        alert.informativeText = text
        alert.addButton(withTitle: L("OK"))
        NSApp.activate(ignoringOtherApps: true)
        alert.runModal()
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

    private static let relativeFormatter: RelativeDateTimeFormatter = {
        let f = RelativeDateTimeFormatter()
        f.unitsStyle = .short
        return f
    }()

    /// Titolo con il tempo trascorso (grigio, più piccolo) in coda.
    private func titleWithTimestamp(_ text: String, date: Date) -> NSAttributedString {
        let result = NSMutableAttributedString(string: text, attributes: [
            .font: NSFont.menuFont(ofSize: 0)
        ])
        let elapsed = Date().timeIntervalSince(date)
        let relative = elapsed < 3 ? L("adesso") : AppDelegate.relativeFormatter.localizedString(for: date, relativeTo: Date())
        let stamp = "   " + relative
        result.append(NSAttributedString(string: stamp, attributes: [
            .font: NSFont.menuFont(ofSize: NSFont.smallSystemFontSize),
            .foregroundColor: NSColor.secondaryLabelColor
        ]))
        return result
    }

    /// Oscura un elemento riservato lasciando la prima e l'ultima lettera come riferimento.
    private func maskedTitle(_ text: String) -> String {
        let count = text.count
        guard count > 2 else { return String(repeating: "•", count: max(count, 1)) }
        let first = text.prefix(1)
        let last = text.suffix(1)
        let dots = String(repeating: "•", count: min(count - 2, 10))
        return "\(first)\(dots)\(last)"
    }

    private func truncate(_ text: String, max: Int = 50) -> String {
        let oneLine = text.replacingOccurrences(of: "\n", with: " ")
            .trimmingCharacters(in: .whitespaces)
        if oneLine.count <= max { return oneLine }
        return String(oneLine.prefix(max)) + "…"
    }

}
