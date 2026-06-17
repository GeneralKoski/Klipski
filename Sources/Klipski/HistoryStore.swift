import AppKit

struct ClipItem: Codable, Identifiable {
    enum Kind: String, Codable { case text, image }

    let id: UUID
    let kind: Kind
    var text: String?
    var rtfBase64: String?
    var imageFile: String?
    var hash: Int
    let createdAt: Date
    var concealed: Bool?

    var rtfData: Data? {
        guard let rtfBase64 else { return nil }
        return Data(base64Encoded: rtfBase64)
    }
}

@MainActor
final class HistoryStore {
    private(set) var items: [ClipItem] = []
    var textLimit: Int
    var imageLimit: Int

    var textItems: [ClipItem] { items.filter { $0.kind == .text } }
    var imageItems: [ClipItem] { items.filter { $0.kind == .image } }

    private let baseURL: URL
    private let imagesURL: URL
    private let fileURL: URL

    init(textLimit: Int, imageLimit: Int) {
        self.textLimit = textLimit
        self.imageLimit = imageLimit
        self.baseURL = AppPaths.supportDirectory
        self.imagesURL = baseURL.appendingPathComponent("images", isDirectory: true)
        self.fileURL = baseURL.appendingPathComponent("history.json")
        AppPaths.ensureDirectory(baseURL)
        AppPaths.ensureDirectory(imagesURL)
        load()
    }

    // MARK: - Add

    func addText(_ text: String, rtf: Data? = nil, concealed: Bool = false) {
        let trimmed = text
        guard !trimmed.isEmpty else { return }
        let h = HistoryStore.stableHash(Array(trimmed.utf8))
        items.removeAll { $0.kind == .text && $0.hash == h && $0.text == trimmed }
        let item = ClipItem(id: UUID(), kind: .text, text: trimmed,
                            rtfBase64: rtf?.base64EncodedString(), imageFile: nil,
                            hash: h, createdAt: Date(), concealed: concealed)
        items.insert(item, at: 0)
        trim()
        save()
    }

    func addImage(_ data: Data) {
        let h = HistoryStore.stableHash(data)
        if let existing = items.first(where: { $0.kind == .image && $0.hash == h }) {
            // già presente: spostalo in cima aggiornando il timestamp
            items.removeAll { $0.id == existing.id }
            let refreshed = ClipItem(id: existing.id, kind: .image, text: nil, rtfBase64: nil,
                                     imageFile: existing.imageFile, hash: existing.hash, createdAt: Date())
            items.insert(refreshed, at: 0)
            save()
            return
        }
        let filename = "\(UUID().uuidString).png"
        let url = imagesURL.appendingPathComponent(filename)
        do {
            try data.write(to: url)
        } catch {
            NSLog("Klipski: impossibile salvare immagine: \(error)")
            return
        }
        items.insert(ClipItem(id: UUID(), kind: .image, text: nil, rtfBase64: nil, imageFile: filename, hash: h, createdAt: Date()), at: 0)
        trim()
        save()
    }

    // MARK: - Access

    func updateLimits(textLimit: Int, imageLimit: Int) {
        self.textLimit = max(textLimit, 1)
        self.imageLimit = max(imageLimit, 1)
        trim()
        save()
    }

    func imageURL(for item: ClipItem) -> URL? {
        guard let file = item.imageFile else { return nil }
        return imagesURL.appendingPathComponent(file)
    }

    func clear() {
        for item in items where item.kind == .image {
            if let url = imageURL(for: item) {
                try? FileManager.default.removeItem(at: url)
            }
        }
        items.removeAll()
        save()
    }

    // MARK: - Private

    private func trim() {
        var textCount = 0
        var imageCount = 0
        var kept: [ClipItem] = []
        for item in items {
            switch item.kind {
            case .text:
                if textCount < textLimit {
                    kept.append(item)
                    textCount += 1
                }
            case .image:
                if imageCount < imageLimit {
                    kept.append(item)
                    imageCount += 1
                } else if let url = imageURL(for: item) {
                    try? FileManager.default.removeItem(at: url)
                }
            }
        }
        items = kept
    }

    private func load() {
        guard let data = try? Data(contentsOf: fileURL) else { return }
        if let decoded = try? JSONDecoder().decode([ClipItem].self, from: data) {
            items = decoded
        }
    }

    private func save() {
        do {
            let data = try JSONEncoder().encode(items)
            try data.write(to: fileURL)
        } catch {
            NSLog("Klipski: impossibile salvare history.json: \(error)")
        }
    }

    static func stableHash<S: Sequence>(_ bytes: S) -> Int where S.Element == UInt8 {
        var h = 5381
        for b in bytes { h = (h &* 33) ^ Int(b) }
        return h
    }
}
