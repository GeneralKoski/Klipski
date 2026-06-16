import AppKit

@MainActor
final class ClipboardManager {
    private let pasteboard = NSPasteboard.general
    private var lastChangeCount: Int
    private var timer: Timer?

    private let history: HistoryStore
    var onChange: (() -> Void)?

    init(history: HistoryStore) {
        self.history = history
        self.lastChangeCount = pasteboard.changeCount
    }

    func start() {
        timer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { [weak self] _ in
            MainActor.assumeIsolated { self?.poll() }
        }
    }

    /// Scrive negli appunti senza che il polling lo ri-catturi come nuovo elemento.
    func setText(_ text: String) {
        pasteboard.clearContents()
        pasteboard.setString(text, forType: .string)
        lastChangeCount = pasteboard.changeCount
    }

    /// Scrive testo formattato (RTF) + il fallback in testo semplice.
    func setRichText(_ rtf: Data, plain: String) {
        pasteboard.clearContents()
        pasteboard.declareTypes([.rtf, .string], owner: nil)
        pasteboard.setData(rtf, forType: .rtf)
        pasteboard.setString(plain, forType: .string)
        lastChangeCount = pasteboard.changeCount
    }

    func setImage(_ data: Data) {
        pasteboard.clearContents()
        pasteboard.declareTypes([.tiff, .png], owner: nil)
        if let image = NSImage(data: data), let tiff = image.tiffRepresentation {
            pasteboard.setData(tiff, forType: .tiff)
        }
        pasteboard.setData(data, forType: .png)
        lastChangeCount = pasteboard.changeCount
    }

    private func poll() {
        guard pasteboard.changeCount != lastChangeCount else { return }
        lastChangeCount = pasteboard.changeCount
        capture()
    }

    private func capture() {
        // 1. File immagine copiato dal Finder (es. screenshot sul Desktop):
        // sostituisce sempre il file negli appunti con l'immagine vera,
        // così copiare un'immagine = avere un'immagine (Cmd+V incolla la foto, non il nome).
        if let data = imageDataFromFileURL() {
            history.addImage(data)
            setImage(data)
            onChange?()
            return
        }
        // 2. Testo (con RTF se la sorgente lo fornisce, per poter incollare con formattazione).
        if let str = pasteboard.string(forType: .string),
           !str.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            history.addText(str, rtf: pasteboard.data(forType: .rtf))
            onChange?()
            return
        }
        // 3. Immagine grezza negli appunti (es. Cmd+Ctrl+Shift+4, copia da Anteprima).
        if let data = imageData() {
            history.addImage(data)
            onChange?()
        }
    }

    private func imageDataFromFileURL() -> Data? {
        let options: [NSPasteboard.ReadingOptionKey: Any] = [
            .urlReadingContentsConformToTypes: ["public.image"]
        ]
        guard let urls = pasteboard.readObjects(forClasses: [NSURL.self], options: options) as? [URL],
              let url = urls.first,
              let fileData = try? Data(contentsOf: url) else {
            return nil
        }
        if let image = NSImage(data: fileData),
           let tiff = image.tiffRepresentation,
           let rep = NSBitmapImageRep(data: tiff) {
            return rep.representation(using: .png, properties: [:])
        }
        return fileData
    }

    private func imageData() -> Data? {
        if let png = pasteboard.data(forType: .png) {
            return png
        }
        if let tiff = pasteboard.data(forType: .tiff),
           let rep = NSBitmapImageRep(data: tiff) {
            return rep.representation(using: .png, properties: [:])
        }
        return nil
    }
}
