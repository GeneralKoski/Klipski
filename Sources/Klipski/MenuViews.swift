import AppKit

/// Evidenzia programmaticamente una voce di menu (usa l'API privata highlightItem:, con guardia).
@MainActor
enum MenuHighlighter {
    static func highlightFirstResult(in menu: NSMenu) {
        guard menu.items.count > 1 else { return }
        let target = menu.items[1] // item 0 = campo di ricerca
        guard target.isEnabled else { return }
        let selector = NSSelectorFromString("highlightItem:")
        guard menu.responds(to: selector) else { return }
        menu.perform(selector, with: target)
    }
}

/// Campo di ricerca da inserire come vista di una voce di menu.
///
/// Il first responder se lo prende solo quando il sottomenu viene davvero evidenziato,
/// cioè quando ci si è entrati. Aprendosi, la finestra del sottomenu lo darebbe al campo
/// già solo passando sul genitore: da lì in poi le frecce finiscono nel field editor e il
/// menu principale, che è ancora quello navigato, smette di rispondere.
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
        field.refusesFirstResponder = true
        addSubview(field)
    }

    required init?(coder: NSCoder) { fatalError() }

    func noteHighlight(_ item: NSMenuItem?) {
        guard item != nil else {
            field.refusesFirstResponder = true
            return
        }
        guard let window, field.currentEditor() == nil else { return }
        field.refusesFirstResponder = false
        window.makeFirstResponder(field)
    }

    override func viewDidMoveToWindow() {
        super.viewDidMoveToWindow()
        guard window == nil else { return }
        field.refusesFirstResponder = true
    }

    func controlTextDidChange(_ obj: Notification) {
        onChange?(field.stringValue)
    }

    func control(_ control: NSControl, textView: NSTextView, doCommandBy commandSelector: Selector) -> Bool {
        // Su/giù il menu li gestisce da sé anche mentre il campo ha il first responder,
        // la freccia sinistra no: qui la rilanciamo dopo aver mollato il fuoco, così con
        // una sola pressione si torna al menu padre.
        guard commandSelector == #selector(NSResponder.moveLeft(_:)), field.stringValue.isEmpty else {
            return false
        }
        let win = window
        field.refusesFirstResponder = true
        win?.makeFirstResponder(nil)
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
}

/// Delegate del sottomenu Testi: gira i cambi di evidenziazione al campo di ricerca,
/// che li usa per sapere quando è il momento di prendere il first responder.
@MainActor
final class TextMenuDelegate: NSObject, NSMenuDelegate {
    weak var searchField: MenuSearchField?

    func menu(_ menu: NSMenu, willHighlight item: NSMenuItem?) {
        searchField?.noteHighlight(item)
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

        let mouse = NSEvent.mouseLocation
        let screen = NSScreen.screens.first { $0.frame.contains(mouse) } ?? NSScreen.main
        let vf = screen?.visibleFrame ?? NSRect(x: 0, y: 0, width: 800, height: 800)

        // Si adatta allo schermo: usa fino al 90% del lato più corto dell'area
        // visibile, così l'anteprima resta sempre contenuta in entrambe le dimensioni.
        let inset: CGFloat = 8
        let maxSide = min(vf.width, vf.height) * 0.90
        let s = image.size
        // Permette anche l'ingrandimento (fino a 3x) per le immagini piccole.
        let scale = min(maxSide / max(s.width, 1), maxSide / max(s.height, 1), 3)
        let imgSize = NSSize(width: max(s.width * scale, 1), height: max(s.height * scale, 1))
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
        imageView.wantsLayer = true
        imageView.layer?.minificationFilter = .trilinear
        imageView.layer?.magnificationFilter = .trilinear
        container.addSubview(imageView)

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
