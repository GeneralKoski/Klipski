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
    private let onExport: () -> Void
    private let onImport: () -> Void
    private let currentLanguage: String?
    private let onLanguageChange: (String?) -> Void

    private let textPresets = [10, 25, 50, 100, 200]
    private let imagePresets = [5, 10, 20, 50]
    private let languages: [(code: String, name: String)] = [
        ("it", "Italiano"), ("en", "English"), ("es", "Español"), ("fr", "Français"),
        ("de", "Deutsch"), ("pt", "Português"), ("ru", "Русский"), ("ja", "日本語"),
        ("zh-Hans", "简体中文"), ("ar", "العربية")
    ]
    private var languagePopup: NSPopUpButton!

    private var foldersTable: NSTableView!
    private var snippetsTable: NSTableView!
    private var titleField: NSTextField!
    private var contentTextView: NSTextView!
    private var textLimitPopup: NSPopUpButton!
    private var imageLimitPopup: NSPopUpButton!
    private var hotKeyRecorder: HotKeyRecorderButton!

    private var editingFolder: Int?
    private var editingSnippet: Int?

    private static let rowDragType = NSPasteboard.PasteboardType("com.klipski.settings.row")

    init(snippets: SnippetStore, history: HistoryStore,
         hotKeyCode: UInt32, hotKeyModifiers: UInt32,
         saveLimits: @escaping (Int, Int) -> Void,
         onHotKeyChange: @escaping (UInt32, UInt32) -> Void,
         onExport: @escaping () -> Void,
         onImport: @escaping () -> Void,
         currentLanguage: String?,
         onLanguageChange: @escaping (String?) -> Void) {
        self.snippets = snippets
        self.history = history
        self.saveLimits = saveLimits
        self.hotKeyCode = hotKeyCode
        self.hotKeyModifiers = hotKeyModifiers
        self.onHotKeyChange = onHotKeyChange
        self.onExport = onExport
        self.onImport = onImport
        self.currentLanguage = currentLanguage
        self.onLanguageChange = onLanguageChange

        let window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 720, height: 580),
            styleMask: [.titled, .closable],
            backing: .buffered,
            defer: false
        )
        window.title = L("Klipski - Preferenze")
        window.center()
        super.init(window: window)
        window.delegate = self
        buildUI()
    }

    required init?(coder: NSCoder) { fatalError() }

    // MARK: - UI

    private func buildUI() {
        guard let content = window?.contentView else { return }

        // Riga backup dati.
        content.addSubview(makeLabel(L("Backup:"), frame: NSRect(x: 20, y: 544, width: 70, height: 18)))
        content.addSubview(makeButton(L("Esporta dati…"), frame: NSRect(x: 92, y: 538, width: 140, height: 26), action: #selector(exportData)))
        content.addSubview(makeButton(L("Importa dati…"), frame: NSRect(x: 238, y: 538, width: 140, height: 26), action: #selector(importData)))

        // Selettore lingua (richiede riavvio dell'app).
        content.addSubview(makeLabel(L("Lingua:"), frame: NSRect(x: 430, y: 544, width: 62, height: 18)))
        languagePopup = NSPopUpButton(frame: NSRect(x: 494, y: 538, width: 206, height: 26))
        languagePopup.addItem(withTitle: L("Automatica (sistema)"))
        languages.forEach { languagePopup.addItem(withTitle: $0.name) }
        if let current = currentLanguage, let idx = languages.firstIndex(where: { $0.code == current }) {
            languagePopup.selectItem(at: idx + 1)
        } else {
            languagePopup.selectItem(at: 0)
        }
        languagePopup.target = self
        languagePopup.action = #selector(languageChanged)
        content.addSubview(languagePopup)

        // Riga scorciatoia globale.
        content.addSubview(makeLabel(L("Scorciatoia apertura:"), frame: NSRect(x: 20, y: 502, width: 170, height: 18)))
        hotKeyRecorder = HotKeyRecorderButton(frame: NSRect(x: 190, y: 496, width: 160, height: 26))
        hotKeyRecorder.bezelStyle = .rounded
        hotKeyRecorder.setHotKey(keyCode: hotKeyCode, modifiers: hotKeyModifiers)
        hotKeyRecorder.onCapture = { [weak self] code, mods in
            self?.onHotKeyChange(code, mods)
        }
        content.addSubview(hotKeyRecorder)
        content.addSubview(makeLabel(L("(clicca e premi la combinazione, Esc annulla)"),
                                     frame: NSRect(x: 358, y: 502, width: 340, height: 18)))

        // Riga limiti cronologia.
        let limitsLabel = makeLabel(L("Cronologia - elementi mostrati:"), frame: NSRect(x: 20, y: 458, width: 230, height: 18))
        content.addSubview(limitsLabel)

        content.addSubview(makeLabel(L("Testi:"), frame: NSRect(x: 250, y: 458, width: 45, height: 18)))
        textLimitPopup = NSPopUpButton(frame: NSRect(x: 298, y: 452, width: 72, height: 26))
        textLimitPopup.addItems(withTitles: textPresets.map(String.init))
        textLimitPopup.selectItem(withTitle: String(history.textLimit))
        textLimitPopup.target = self
        textLimitPopup.action = #selector(limitsChanged)
        content.addSubview(textLimitPopup)

        content.addSubview(makeLabel(L("Immagini:"), frame: NSRect(x: 388, y: 458, width: 65, height: 18)))
        imageLimitPopup = NSPopUpButton(frame: NSRect(x: 456, y: 452, width: 72, height: 26))
        imageLimitPopup.addItems(withTitles: imagePresets.map(String.init))
        imageLimitPopup.selectItem(withTitle: String(history.imageLimit))
        imageLimitPopup.target = self
        imageLimitPopup.action = #selector(limitsChanged)
        content.addSubview(imageLimitPopup)

        content.addSubview(makeButton(L("Importa da Clipy…"), frame: NSRect(x: 545, y: 452, width: 155, height: 26), action: #selector(importFromClipy)))

        // Intestazioni colonne snippet.
        content.addSubview(makeLabel(L("Cartelle"), frame: NSRect(x: 20, y: 418, width: 180, height: 18)))
        content.addSubview(makeLabel(L("Snippet"), frame: NSRect(x: 212, y: 418, width: 180, height: 18)))
        content.addSubview(makeLabel(L("Titolo / contenuto"), frame: NSRect(x: 404, y: 418, width: 296, height: 18)))

        // Tabella cartelle.
        foldersTable = makeTable { [weak self] in self?.removeFolder() }
        content.addSubview(scrollWrapping(foldersTable, frame: NSRect(x: 20, y: 100, width: 180, height: 310)))
        content.addSubview(makeButton("+", frame: NSRect(x: 20, y: 66, width: 40, height: 26), action: #selector(addFolder)))
        content.addSubview(makeButton("−", frame: NSRect(x: 62, y: 66, width: 40, height: 26), action: #selector(removeFolder)))
        content.addSubview(makeButton(L("Rinomina"), frame: NSRect(x: 104, y: 66, width: 96, height: 26), action: #selector(renameFolder)))
        content.addSubview(makeButton("▲", frame: NSRect(x: 20, y: 34, width: 40, height: 26), action: #selector(moveFolderUp)))
        content.addSubview(makeButton("▼", frame: NSRect(x: 62, y: 34, width: 40, height: 26), action: #selector(moveFolderDown)))

        // Tabella snippet.
        snippetsTable = makeTable { [weak self] in self?.removeSnippet() }
        content.addSubview(scrollWrapping(snippetsTable, frame: NSRect(x: 212, y: 100, width: 180, height: 310)))
        content.addSubview(makeButton("+", frame: NSRect(x: 212, y: 66, width: 40, height: 26), action: #selector(addSnippet)))
        content.addSubview(makeButton("−", frame: NSRect(x: 254, y: 66, width: 40, height: 26), action: #selector(removeSnippet)))
        content.addSubview(makeButton("▲", frame: NSRect(x: 212, y: 34, width: 40, height: 26), action: #selector(moveSnippetUp)))
        content.addSubview(makeButton("▼", frame: NSRect(x: 254, y: 34, width: 40, height: 26), action: #selector(moveSnippetDown)))

        // Editor snippet.
        titleField = NSTextField(frame: NSRect(x: 404, y: 380, width: 296, height: 26))
        content.addSubview(titleField)

        let scroll = NSScrollView(frame: NSRect(x: 404, y: 100, width: 296, height: 270))
        scroll.hasVerticalScroller = true
        scroll.borderType = .bezelBorder
        contentTextView = NSTextView(frame: scroll.bounds)
        contentTextView.isRichText = false
        contentTextView.font = .systemFont(ofSize: 13)
        contentTextView.autoresizingMask = [.width]
        scroll.documentView = contentTextView
        content.addSubview(scroll)

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

    private func makeTable(onDelete: @escaping () -> Void) -> NSTableView {
        let table = DeletableTableView()
        table.onDelete = onDelete
        let column = NSTableColumn(identifier: NSUserInterfaceItemIdentifier("col"))
        column.width = 160
        column.isEditable = true
        column.dataCell = VerticallyCenteredTextFieldCell()
        table.addTableColumn(column)
        table.headerView = nil
        table.columnAutoresizingStyle = .uniformColumnAutoresizingStyle
        table.rowHeight = 22
        table.usesAutomaticRowHeights = false
        table.registerForDraggedTypes([Self.rowDragType])
        table.setDraggingSourceOperationMask(.move, forLocal: true)
        table.draggingDestinationFeedbackStyle = .gap
        return table
    }

    private func scrollWrapping(_ table: NSTableView, frame: NSRect) -> NSScrollView {
        let scroll = NSScrollView(frame: frame)
        scroll.hasVerticalScroller = true
        scroll.hasHorizontalScroller = false
        scroll.autohidesScrollers = true
        scroll.scrollerStyle = .overlay
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

    @objc private func exportData() {
        onExport()
    }

    @objc private func importData() {
        onImport()
    }

    @objc private func importFromClipy() {
        let panel = NSOpenPanel()
        panel.allowedContentTypes = [.xml]
        panel.allowsMultipleSelection = false
        panel.prompt = L("Importa")
        panel.message = L("In Clipy: icona nella barra → Edit Snippets… → menu Snippets → Export Snippets… e salva il file (consigliato: sul Desktop). Poi selezionalo qui.")
        panel.directoryURL = FileManager.default.urls(for: .desktopDirectory, in: .userDomainMask).first
        guard panel.runModal() == .OK, let url = panel.url else { return }
        guard let imported = ClipyImporter.importFolders(from: url), !imported.isEmpty else {
            beep(L("Nessuno snippet trovato nel file selezionato."))
            return
        }
        snippets.importFolders(imported)
        foldersTable.reloadData()
        let total = imported.reduce(0) { $0 + $1.snippets.count }
        beep(L("Importate %d cartelle (%d snippet).", imported.count, total))
    }

    @objc private func languageChanged() {
        let idx = languagePopup.indexOfSelectedItem
        onLanguageChange(idx == 0 ? nil : languages[idx - 1].code)
    }

    @objc private func limitsChanged() {
        let textLimit = Int(textLimitPopup.titleOfSelectedItem ?? "") ?? history.textLimit
        let imageLimit = Int(imageLimitPopup.titleOfSelectedItem ?? "") ?? history.imageLimit
        history.updateLimits(textLimit: textLimit, imageLimit: imageLimit)
        saveLimits(textLimit, imageLimit)
    }

    @objc private func addFolder() {
        guard let name = prompt(message: L("Nuova cartella"), placeholder: L("Nome (es. Mails)")), !name.isEmpty else { return }
        snippets.addFolder(name: name)
        foldersTable.reloadData()
        foldersTable.selectRowIndexes([snippets.folders.count - 1], byExtendingSelection: false)
    }

    @objc private func removeFolder() {
        guard let index = selectedFolder, let window else { return }
        let alert = NSAlert()
        alert.messageText = L("Eliminare la cartella \"%@\"?", snippets.folders[index].name)
        alert.informativeText = L("Verranno rimossi tutti gli snippet contenuti.")
        alert.addButton(withTitle: L("Elimina"))
        alert.addButton(withTitle: L("Annulla"))
        alert.beginSheetModal(for: window) { [weak self] response in
            guard response == .alertFirstButtonReturn, let self else { return }
            // Prima svuoto l'editor: il reload azzera la selezione e farebbe
            // ricadere commitEditor() su indici che non esistono più.
            self.clearEditor()
            self.snippets.deleteFolder(at: index)
            self.foldersTable.reloadData()
            self.snippetsTable.reloadData()
        }
    }

    @objc private func renameFolder() {
        guard let index = selectedFolder else { return }
        guard let name = prompt(message: L("Rinomina cartella"), placeholder: snippets.folders[index].name), !name.isEmpty else { return }
        snippets.renameFolder(at: index, to: name)
        foldersTable.reloadData()
        foldersTable.selectRowIndexes([index], byExtendingSelection: false)
    }

    @objc private func addSnippet() {
        guard let index = selectedFolder else {
            beep(L("Seleziona prima una cartella."))
            return
        }
        snippets.addSnippet(folderIndex: index, title: L("Nuovo snippet"), content: "")
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
        let row = snippetsTable.selectedRow
        clearEditor()
        snippets.deleteSnippet(folderIndex: folder, snippetIndex: row)
        snippetsTable.reloadData()
        foldersTable.reloadData()
        foldersTable.selectRowIndexes([folder], byExtendingSelection: false)
    }

    @objc private func moveFolderUp() { moveSelectedFolder(by: -1) }
    @objc private func moveFolderDown() { moveSelectedFolder(by: 1) }
    @objc private func moveSnippetUp() { moveSelectedSnippet(by: -1) }
    @objc private func moveSnippetDown() { moveSelectedSnippet(by: 1) }

    private func moveSelectedFolder(by delta: Int) {
        guard let index = selectedFolder else { return }
        moveFolder(from: index, to: index + delta)
    }

    private func moveSelectedSnippet(by delta: Int) {
        let row = snippetsTable.selectedRow
        guard row >= 0 else { return }
        moveSnippet(from: row, to: row + delta)
    }

    /// Sposta una cartella e mantiene selezionata la cartella spostata.
    private func moveFolder(from source: Int, to destination: Int) {
        guard snippets.folders.indices.contains(destination), destination != source else { return }
        commitEditor()
        snippets.moveFolder(from: source, to: destination)
        clearEditor()
        foldersTable.reloadData()
        foldersTable.selectRowIndexes([destination], byExtendingSelection: false)
        snippetsTable.reloadData()
    }

    /// Sposta uno snippet nella cartella selezionata e lo mantiene selezionato.
    private func moveSnippet(from source: Int, to destination: Int) {
        guard let folder = selectedFolder,
              snippets.folders[folder].snippets.indices.contains(destination),
              destination != source else { return }
        commitEditor()
        snippets.moveSnippet(folderIndex: folder, from: source, to: destination)
        clearEditor()
        snippetsTable.reloadData()
        snippetsTable.selectRowIndexes([destination], byExtendingSelection: false)
    }

    private func prompt(message: String, placeholder: String) -> String? {
        let alert = NSAlert()
        alert.messageText = message
        alert.addButton(withTitle: L("OK"))
        alert.addButton(withTitle: L("Annulla"))
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
        alert.addButton(withTitle: L("OK"))
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

    func tableView(_ tableView: NSTableView, pasteboardWriterForRow row: Int) -> NSPasteboardWriting? {
        let item = NSPasteboardItem()
        item.setString(String(row), forType: Self.rowDragType)
        return item
    }

    func tableView(_ tableView: NSTableView, validateDrop info: NSDraggingInfo,
                   proposedRow row: Int, proposedDropOperation dropOperation: NSTableView.DropOperation) -> NSDragOperation {
        guard dropOperation == .above, (info.draggingSource as? NSTableView) === tableView else { return [] }
        return .move
    }

    func tableView(_ tableView: NSTableView, acceptDrop info: NSDraggingInfo,
                   row: Int, dropOperation: NSTableView.DropOperation) -> Bool {
        guard let source = Int(info.draggingPasteboard.pasteboardItems?.first?.string(forType: Self.rowDragType) ?? "") else {
            return false
        }
        // `row` è l'indice di inserimento: se si sposta in basso va corretto di uno.
        let destination = row > source ? row - 1 : row
        if tableView === foldersTable {
            moveFolder(from: source, to: destination)
        } else {
            moveSnippet(from: source, to: destination)
        }
        return true
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

/// Tabella che elimina la riga selezionata con Backspace o Canc.
private final class DeletableTableView: NSTableView {
    var onDelete: (() -> Void)?

    override func keyDown(with event: NSEvent) {
        // 51 = backspace, 117 = canc.
        if (event.keyCode == 51 || event.keyCode == 117), selectedRow >= 0 {
            onDelete?()
            return
        }
        super.keyDown(with: event)
    }
}

/// Cella di tabella che centra verticalmente il testo nella riga.
private final class VerticallyCenteredTextFieldCell: NSTextFieldCell {
    private func centered(_ rect: NSRect) -> NSRect {
        let textSize = cellSize(forBounds: rect)
        let dy = max(0, (rect.height - textSize.height) / 2)
        return NSRect(x: rect.origin.x, y: rect.origin.y + dy,
                      width: rect.width, height: textSize.height)
    }

    override func drawInterior(withFrame cellFrame: NSRect, in controlView: NSView) {
        super.drawInterior(withFrame: centered(cellFrame), in: controlView)
    }

    override func edit(withFrame rect: NSRect, in controlView: NSView,
                       editor textObj: NSText, delegate: Any?, event: NSEvent?) {
        super.edit(withFrame: centered(rect), in: controlView,
                   editor: textObj, delegate: delegate, event: event)
    }

    override func select(withFrame rect: NSRect, in controlView: NSView,
                         editor textObj: NSText, delegate: Any?, start selStart: Int, length selLength: Int) {
        super.select(withFrame: centered(rect), in: controlView,
                     editor: textObj, delegate: delegate, start: selStart, length: selLength)
    }
}
