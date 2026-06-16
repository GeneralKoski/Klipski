import AppKit
import UniformTypeIdentifiers

@MainActor
final class SettingsWindowController: NSWindowController, NSTableViewDataSource, NSTableViewDelegate, NSWindowDelegate {
    private let snippets: SnippetStore
    private let history: HistoryStore
    private let saveLimits: (Int, Int) -> Void
    private let hotKeyCode: UInt32
    private let hotKeyModifiers: UInt32
    private let onHotKeyChange: (UInt32, UInt32) -> Void

    private let textPresets = [10, 25, 50, 100, 200]
    private let imagePresets = [5, 10, 20, 50]

    private var foldersTable: NSTableView!
    private var snippetsTable: NSTableView!
    private var titleField: NSTextField!
    private var contentTextView: NSTextView!
    private var textLimitPopup: NSPopUpButton!
    private var imageLimitPopup: NSPopUpButton!
    private var hotKeyRecorder: HotKeyRecorderButton!

    private var editingFolder: Int?
    private var editingSnippet: Int?

    init(snippets: SnippetStore, history: HistoryStore,
         hotKeyCode: UInt32, hotKeyModifiers: UInt32,
         saveLimits: @escaping (Int, Int) -> Void,
         onHotKeyChange: @escaping (UInt32, UInt32) -> Void) {
        self.snippets = snippets
        self.history = history
        self.saveLimits = saveLimits
        self.hotKeyCode = hotKeyCode
        self.hotKeyModifiers = hotKeyModifiers
        self.onHotKeyChange = onHotKeyChange

        let window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 720, height: 540),
            styleMask: [.titled, .closable],
            backing: .buffered,
            defer: false
        )
        window.title = "Klipski - Preferenze"
        window.center()
        super.init(window: window)
        window.delegate = self
        buildUI()
    }

    required init?(coder: NSCoder) { fatalError() }

    // MARK: - UI

    private func buildUI() {
        guard let content = window?.contentView else { return }

        // Riga scorciatoia globale.
        content.addSubview(makeLabel("Scorciatoia apertura:", frame: NSRect(x: 20, y: 502, width: 170, height: 18)))
        hotKeyRecorder = HotKeyRecorderButton(frame: NSRect(x: 190, y: 496, width: 160, height: 26))
        hotKeyRecorder.bezelStyle = .rounded
        hotKeyRecorder.setHotKey(keyCode: hotKeyCode, modifiers: hotKeyModifiers)
        hotKeyRecorder.onCapture = { [weak self] code, mods in
            self?.onHotKeyChange(code, mods)
        }
        content.addSubview(hotKeyRecorder)
        content.addSubview(makeLabel("(clicca e premi la combinazione, Esc annulla)",
                                     frame: NSRect(x: 358, y: 502, width: 340, height: 18)))

        // Riga limiti cronologia.
        let limitsLabel = makeLabel("Cronologia - elementi mostrati:", frame: NSRect(x: 20, y: 458, width: 230, height: 18))
        content.addSubview(limitsLabel)

        content.addSubview(makeLabel("Testi:", frame: NSRect(x: 250, y: 458, width: 45, height: 18)))
        textLimitPopup = NSPopUpButton(frame: NSRect(x: 298, y: 452, width: 72, height: 26))
        textLimitPopup.addItems(withTitles: textPresets.map(String.init))
        textLimitPopup.selectItem(withTitle: String(history.textLimit))
        textLimitPopup.target = self
        textLimitPopup.action = #selector(limitsChanged)
        content.addSubview(textLimitPopup)

        content.addSubview(makeLabel("Immagini:", frame: NSRect(x: 388, y: 458, width: 65, height: 18)))
        imageLimitPopup = NSPopUpButton(frame: NSRect(x: 456, y: 452, width: 72, height: 26))
        imageLimitPopup.addItems(withTitles: imagePresets.map(String.init))
        imageLimitPopup.selectItem(withTitle: String(history.imageLimit))
        imageLimitPopup.target = self
        imageLimitPopup.action = #selector(limitsChanged)
        content.addSubview(imageLimitPopup)

        content.addSubview(makeButton("Importa da Clipy…", frame: NSRect(x: 545, y: 452, width: 155, height: 26), action: #selector(importFromClipy)))

        // Intestazioni colonne snippet.
        content.addSubview(makeLabel("Cartelle", frame: NSRect(x: 20, y: 418, width: 180, height: 18)))
        content.addSubview(makeLabel("Snippet", frame: NSRect(x: 212, y: 418, width: 180, height: 18)))
        content.addSubview(makeLabel("Titolo / contenuto", frame: NSRect(x: 404, y: 418, width: 296, height: 18)))

        // Tabella cartelle.
        foldersTable = makeTable()
        content.addSubview(scrollWrapping(foldersTable, frame: NSRect(x: 20, y: 70, width: 180, height: 340)))
        content.addSubview(makeButton("+", frame: NSRect(x: 20, y: 38, width: 40, height: 26), action: #selector(addFolder)))
        content.addSubview(makeButton("−", frame: NSRect(x: 62, y: 38, width: 40, height: 26), action: #selector(removeFolder)))
        content.addSubview(makeButton("Rinomina", frame: NSRect(x: 104, y: 38, width: 96, height: 26), action: #selector(renameFolder)))

        // Tabella snippet.
        snippetsTable = makeTable()
        content.addSubview(scrollWrapping(snippetsTable, frame: NSRect(x: 212, y: 70, width: 180, height: 340)))
        content.addSubview(makeButton("+", frame: NSRect(x: 212, y: 38, width: 40, height: 26), action: #selector(addSnippet)))
        content.addSubview(makeButton("−", frame: NSRect(x: 254, y: 38, width: 40, height: 26), action: #selector(removeSnippet)))

        // Editor snippet.
        titleField = NSTextField(frame: NSRect(x: 404, y: 380, width: 296, height: 26))
        titleField.placeholderString = "Titolo"
        content.addSubview(titleField)

        let scroll = NSScrollView(frame: NSRect(x: 404, y: 70, width: 296, height: 300))
        scroll.hasVerticalScroller = true
        scroll.borderType = .bezelBorder
        contentTextView = NSTextView(frame: scroll.bounds)
        contentTextView.isRichText = false
        contentTextView.font = .systemFont(ofSize: 13)
        contentTextView.autoresizingMask = [.width]
        scroll.documentView = contentTextView
        content.addSubview(scroll)

        content.addSubview(makeButton("Salva snippet", frame: NSRect(x: 404, y: 38, width: 140, height: 26), action: #selector(saveSnippet)))

        // Collego i data source solo ora che entrambe le tabelle esistono
        // (setDataSource innesca subito numberOfRows, che le referenzia entrambe).
        foldersTable.dataSource = self
        foldersTable.delegate = self
        snippetsTable.dataSource = self
        snippetsTable.delegate = self

        updateEditorEnabled(false)
    }

    private func makeLabel(_ text: String, frame: NSRect) -> NSTextField {
        let label = NSTextField(labelWithString: text)
        label.frame = frame
        return label
    }

    private func makeButton(_ title: String, frame: NSRect, action: Selector) -> NSButton {
        let button = NSButton(title: title, target: self, action: action)
        button.frame = frame
        button.bezelStyle = .rounded
        return button
    }

    private func makeTable() -> NSTableView {
        let table = NSTableView()
        let column = NSTableColumn(identifier: NSUserInterfaceItemIdentifier("col"))
        column.width = 160
        column.isEditable = true
        table.addTableColumn(column)
        table.headerView = nil
        return table
    }

    private func scrollWrapping(_ table: NSTableView, frame: NSRect) -> NSScrollView {
        let scroll = NSScrollView(frame: frame)
        scroll.hasVerticalScroller = true
        scroll.borderType = .bezelBorder
        scroll.documentView = table
        return scroll
    }

    // MARK: - Stato

    func reloadAll() {
        textLimitPopup.selectItem(withTitle: String(history.textLimit))
        imageLimitPopup.selectItem(withTitle: String(history.imageLimit))
        foldersTable.reloadData()
        snippetsTable.reloadData()
        clearEditor()
    }

    func setRecorder(keyCode: UInt32, modifiers: UInt32) {
        hotKeyRecorder.setHotKey(keyCode: keyCode, modifiers: modifiers)
    }

    private var selectedFolder: Int? {
        let row = foldersTable.selectedRow
        return row >= 0 ? row : nil
    }

    private func clearEditor() {
        editingFolder = nil
        editingSnippet = nil
        titleField.stringValue = ""
        contentTextView.string = ""
        updateEditorEnabled(false)
    }

    private func updateEditorEnabled(_ enabled: Bool) {
        titleField.isEnabled = enabled
        contentTextView.isEditable = enabled
    }

    private func populateEditor(folderIndex: Int, snippetIndex: Int) {
        guard snippets.folders.indices.contains(folderIndex),
              snippets.folders[folderIndex].snippets.indices.contains(snippetIndex) else {
            clearEditor()
            return
        }
        editingFolder = folderIndex
        editingSnippet = snippetIndex
        let snippet = snippets.folders[folderIndex].snippets[snippetIndex]
        titleField.stringValue = snippet.title
        contentTextView.string = snippet.content
        updateEditorEnabled(true)
    }

    /// Salva l'editor corrente sul modello (auto-salvataggio prima di cambiare selezione).
    private func commitEditor() {
        guard let f = editingFolder, let s = editingSnippet else { return }
        let title = titleField.stringValue.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !title.isEmpty else { return }
        snippets.updateSnippet(folderIndex: f, snippetIndex: s, title: title, content: contentTextView.string)
    }

    // MARK: - Azioni

    @objc private func importFromClipy() {
        let panel = NSOpenPanel()
        panel.allowedContentTypes = [.xml]
        panel.allowsMultipleSelection = false
        panel.prompt = "Importa"
        panel.message = """
        In Clipy: icona nella barra → Edit Snippets… → menu Snippets → Export Snippets… e salva il file (consigliato: sul Desktop). Poi selezionalo qui.
        """
        panel.directoryURL = FileManager.default.urls(for: .desktopDirectory, in: .userDomainMask).first
        guard panel.runModal() == .OK, let url = panel.url else { return }
        guard let imported = ClipyImporter.importFolders(from: url), !imported.isEmpty else {
            beep("Nessuno snippet trovato nel file selezionato.")
            return
        }
        snippets.importFolders(imported)
        foldersTable.reloadData()
        let total = imported.reduce(0) { $0 + $1.snippets.count }
        beep("Importate \(imported.count) cartelle (\(total) snippet).")
    }

    @objc private func limitsChanged() {
        let textLimit = Int(textLimitPopup.titleOfSelectedItem ?? "") ?? history.textLimit
        let imageLimit = Int(imageLimitPopup.titleOfSelectedItem ?? "") ?? history.imageLimit
        history.updateLimits(textLimit: textLimit, imageLimit: imageLimit)
        saveLimits(textLimit, imageLimit)
    }

    @objc private func addFolder() {
        guard let name = prompt(message: "Nuova cartella", placeholder: "Nome (es. Mails)"), !name.isEmpty else { return }
        snippets.addFolder(name: name)
        foldersTable.reloadData()
        foldersTable.selectRowIndexes([snippets.folders.count - 1], byExtendingSelection: false)
    }

    @objc private func removeFolder() {
        guard let index = selectedFolder else { return }
        let alert = NSAlert()
        alert.messageText = "Eliminare la cartella \"\(snippets.folders[index].name)\"?"
        alert.informativeText = "Verranno rimossi tutti gli snippet contenuti."
        alert.addButton(withTitle: "Elimina")
        alert.addButton(withTitle: "Annulla")
        guard alert.runModal() == .alertFirstButtonReturn else { return }
        snippets.deleteFolder(at: index)
        foldersTable.reloadData()
        snippetsTable.reloadData()
        clearEditor()
    }

    @objc private func renameFolder() {
        guard let index = selectedFolder else { return }
        guard let name = prompt(message: "Rinomina cartella", placeholder: snippets.folders[index].name), !name.isEmpty else { return }
        snippets.renameFolder(at: index, to: name)
        foldersTable.reloadData()
        foldersTable.selectRowIndexes([index], byExtendingSelection: false)
    }

    @objc private func addSnippet() {
        guard let index = selectedFolder else {
            beep("Seleziona prima una cartella.")
            return
        }
        snippets.addSnippet(folderIndex: index, title: "Nuovo snippet", content: "")
        snippetsTable.reloadData()
        let last = snippets.folders[index].snippets.count - 1
        snippetsTable.selectRowIndexes([last], byExtendingSelection: false)
        populateEditor(folderIndex: index, snippetIndex: last)
        foldersTable.reloadData()
        foldersTable.selectRowIndexes([index], byExtendingSelection: false)
        window?.makeFirstResponder(titleField)
    }

    @objc private func removeSnippet() {
        guard let folder = selectedFolder, snippetsTable.selectedRow >= 0 else { return }
        snippets.deleteSnippet(folderIndex: folder, snippetIndex: snippetsTable.selectedRow)
        snippetsTable.reloadData()
        foldersTable.reloadData()
        foldersTable.selectRowIndexes([folder], byExtendingSelection: false)
        clearEditor()
    }

    @objc private func saveSnippet() {
        commitEditor()
        if let folder = selectedFolder {
            snippetsTable.reloadData()
            foldersTable.reloadData()
            foldersTable.selectRowIndexes([folder], byExtendingSelection: false)
            if let s = editingSnippet {
                snippetsTable.selectRowIndexes([s], byExtendingSelection: false)
            }
        }
    }

    private func prompt(message: String, placeholder: String) -> String? {
        let alert = NSAlert()
        alert.messageText = message
        alert.addButton(withTitle: "OK")
        alert.addButton(withTitle: "Annulla")
        let field = NSTextField(frame: NSRect(x: 0, y: 0, width: 260, height: 24))
        field.placeholderString = placeholder
        alert.accessoryView = field
        alert.window.initialFirstResponder = field
        guard alert.runModal() == .alertFirstButtonReturn else { return nil }
        return field.stringValue.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func beep(_ message: String) {
        NSSound.beep()
        let alert = NSAlert()
        alert.messageText = message
        alert.addButton(withTitle: "OK")
        alert.runModal()
    }

    // MARK: - NSTableViewDataSource / Delegate

    func numberOfRows(in tableView: NSTableView) -> Int {
        if tableView === foldersTable {
            return snippets.folders.count
        }
        guard let folder = selectedFolder else { return 0 }
        return snippets.folders[folder].snippets.count
    }

    func tableView(_ tableView: NSTableView, objectValueFor tableColumn: NSTableColumn?, row: Int) -> Any? {
        if tableView === foldersTable {
            guard snippets.folders.indices.contains(row) else { return nil }
            return snippets.folders[row].name
        }
        guard let folder = selectedFolder,
              snippets.folders[folder].snippets.indices.contains(row) else { return nil }
        return snippets.folders[folder].snippets[row].title
    }

    func tableView(_ tableView: NSTableView, setObjectValue object: Any?, for tableColumn: NSTableColumn?, row: Int) {
        let text = (object as? String)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if tableView === foldersTable {
            guard !text.isEmpty, snippets.folders.indices.contains(row) else { return }
            snippets.renameFolder(at: row, to: text)
            foldersTable.reloadData()
            foldersTable.selectRowIndexes([row], byExtendingSelection: false)
        } else {
            guard !text.isEmpty,
                  let folder = selectedFolder,
                  snippets.folders[folder].snippets.indices.contains(row) else { return }
            let content = snippets.folders[folder].snippets[row].content
            snippets.updateSnippet(folderIndex: folder, snippetIndex: row, title: text, content: content)
            snippetsTable.reloadData()
            snippetsTable.selectRowIndexes([row], byExtendingSelection: false)
            if editingFolder == folder, editingSnippet == row {
                titleField.stringValue = text
            }
        }
    }

    func tableViewSelectionDidChange(_ notification: Notification) {
        guard let table = notification.object as? NSTableView else { return }
        commitEditor()
        if table === foldersTable {
            snippetsTable.reloadData()
            clearEditor()
        } else if table === snippetsTable {
            if let folder = selectedFolder, snippetsTable.selectedRow >= 0 {
                populateEditor(folderIndex: folder, snippetIndex: snippetsTable.selectedRow)
            } else {
                clearEditor()
            }
        }
    }

    // MARK: - NSWindowDelegate

    func windowWillClose(_ notification: Notification) {
        commitEditor()
    }
}
