import AppKit

/// Evidenzia programmaticamente una voce di menu (usa l'API privata highlightItem:, con guardia).
@MainActor
enum MenuHighlighter {
    static func highlightFirstResult(in menu: NSMenu) {
        guard menu.items.count > 1 else { return }
        let target = menu.items[1] // item 0 = campo di ricerca
        guard target.isEnabled else { return }
        let selector = NSSelectorFromString("highlightItem:")
        if menu.responds(to: selector) {
            menu.perform(selector, with: target)
        }
    }
}

/// Campo di ricerca da inserire come vista di una voce di menu.
@MainActor
final class MenuSearchField: NSView, NSSearchFieldDelegate {
    private let field = NSSearchField()
    var onChange: ((String) -> Void)?

    override init(frame frameRect: NSRect) {
        super.init(frame: frameRect)
        let h: CGFloat = 24
        field.frame = NSRect(x: 8, y: (frameRect.height - h) / 2, width: frameRect.width - 16, height: h)
        field.autoresizingMask = [.width]
        field.delegate = self
        field.placeholderString = L("Cerca…")
        field.controlSize = .regular
        field.sendsSearchStringImmediately = true
        field.sendsWholeSearchString = false
        addSubview(field)
    }

    required init?(coder: NSCoder) { fatalError() }

    override func viewDidMoveToWindow() {
        super.viewDidMoveToWindow()
        guard window != nil else { return }
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.window?.makeFirstResponder(self.field)
            if let menu = self.enclosingMenuItem?.menu {
                MenuHighlighter.highlightFirstResult(in: menu)
            }
        }
    }

    func controlTextDidChange(_ obj: Notification) {
        onChange?(field.stringValue)
    }

    func control(_ control: NSControl, textView: NSTextView, doCommandBy commandSelector: Selector) -> Bool {
        // Freccia sinistra a campo vuoto → rilascia il focus, così la navigazione
        // nativa del menu (incluso "torna indietro") riprende a funzionare.
        if commandSelector == #selector(NSResponder.moveLeft(_:)), field.stringValue.isEmpty {
            let win = window
            win?.makeFirstResponder(nil)
            // Rilancia la freccia sinistra al menu (ora che il campo non ha più il focus),
            // così con una sola pressione si torna indietro al menu padre.
            DispatchQueue.main.async {
                if let event = NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: [],
                                                timestamp: ProcessInfo.processInfo.systemUptime,
                                                windowNumber: win?.windowNumber ?? 0, context: nil,
                                                characters: "", charactersIgnoringModifiers: "",
                                                isARepeat: false, keyCode: 123) {
                    NSApp.postEvent(event, atStart: true)
                }
            }
            return true
        }
        return false
    }
}

/// Delegate del sottomenu Immagini: mostra un'anteprima ingrandita dell'immagine
/// evidenziata (sia col mouse sia con le frecce), accanto al cursore.
@MainActor
final class ImageMenuHighlightDelegate: NSObject, NSMenuDelegate {
    private var previewWindow: NSWindow?

    func menu(_ menu: NSMenu, willHighlight item: NSMenuItem?) {
        if let url = item?.representedObject as? URL {
            showPreview(url)
        } else {
            hidePreview()
        }
    }

    func menuDidClose(_ menu: NSMenu) {
        hidePreview()
    }

    private func showPreview(_ url: URL) {
        hidePreview()
        guard let image = NSImage(contentsOf: url) else { return }

        let maxSide: CGFloat = 360
        let s = image.size
        let scale = min(maxSide / max(s.width, 1), maxSide / max(s.height, 1), 1)
        let imgSize = NSSize(width: max(s.width * scale, 1), height: max(s.height * scale, 1))
        let inset: CGFloat = 8
        let winSize = NSSize(width: imgSize.width + inset * 2, height: imgSize.height + inset * 2)

        let container = NSView(frame: NSRect(origin: .zero, size: winSize))
        container.wantsLayer = true
        container.layer?.backgroundColor = NSColor.windowBackgroundColor.cgColor
        container.layer?.cornerRadius = 8
        container.layer?.borderWidth = 1
        container.layer?.borderColor = NSColor.separatorColor.cgColor

        let imageView = NSImageView(frame: NSRect(x: inset, y: inset, width: imgSize.width, height: imgSize.height))
        imageView.image = image
        imageView.imageScaling = .scaleProportionallyUpOrDown
        container.addSubview(imageView)

        let mouse = NSEvent.mouseLocation
        let screen = NSScreen.screens.first { $0.frame.contains(mouse) } ?? NSScreen.main
        let vf = screen?.visibleFrame ?? NSRect(x: 0, y: 0, width: winSize.width, height: winSize.height)
        let originX = vf.midX - winSize.width / 2
        let originY = vf.midY - winSize.height / 2

        let win = NSWindow(contentRect: NSRect(x: originX, y: originY, width: winSize.width, height: winSize.height),
                           styleMask: .borderless, backing: .buffered, defer: false)
        win.isOpaque = false
        win.backgroundColor = .clear
        win.hasShadow = true
        win.ignoresMouseEvents = true
        win.level = .popUpMenu
        win.contentView = container
        win.orderFront(nil)
        previewWindow = win
    }

    private func hidePreview() {
        previewWindow?.orderOut(nil)
        previewWindow = nil
    }
}
