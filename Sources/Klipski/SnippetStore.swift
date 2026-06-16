import Foundation

struct Snippet: Codable {
    var title: String
    var content: String
}

struct SnippetFolder: Codable {
    var name: String
    var snippets: [Snippet]
}

@MainActor
final class SnippetStore {
    private(set) var folders: [SnippetFolder] = []
    let fileURL: URL

    init() {
        let base = AppPaths.supportDirectory
        AppPaths.ensureDirectory(base)
        self.fileURL = base.appendingPathComponent("snippets.json")
        load()
    }

    // MARK: - Mutazioni

    func addFolder(name: String) {
        folders.append(SnippetFolder(name: name, snippets: []))
        save()
    }

    func importFolders(_ newFolders: [SnippetFolder]) {
        folders.append(contentsOf: newFolders)
        save()
    }

    func replaceAll(_ newFolders: [SnippetFolder]) {
        folders = newFolders
        save()
    }

    func deleteFolder(at index: Int) {
        guard folders.indices.contains(index) else { return }
        folders.remove(at: index)
        save()
    }

    func renameFolder(at index: Int, to name: String) {
        guard folders.indices.contains(index) else { return }
        folders[index].name = name
        save()
    }

    func updateSnippet(folderIndex: Int, snippetIndex: Int, title: String, content: String) {
        guard folders.indices.contains(folderIndex),
              folders[folderIndex].snippets.indices.contains(snippetIndex) else { return }
        folders[folderIndex].snippets[snippetIndex] = Snippet(title: title, content: content)
        save()
    }

    func addSnippet(folderIndex: Int, title: String, content: String) {
        guard folders.indices.contains(folderIndex) else { return }
        folders[folderIndex].snippets.append(Snippet(title: title, content: content))
        save()
    }

    func deleteSnippet(folderIndex: Int, snippetIndex: Int) {
        guard folders.indices.contains(folderIndex),
              folders[folderIndex].snippets.indices.contains(snippetIndex) else { return }
        folders[folderIndex].snippets.remove(at: snippetIndex)
        save()
    }

    @discardableResult
    func reload() -> Bool {
        load()
    }

    // MARK: - Persistenza

    /// Restituisce false se il file esiste ma non è decodificabile (JSON malformato).
    @discardableResult
    private func load() -> Bool {
        if FileManager.default.fileExists(atPath: fileURL.path) {
            guard let data = try? Data(contentsOf: fileURL) else { return false }
            if let decoded = try? JSONDecoder().decode([SnippetFolder].self, from: data) {
                folders = decoded
                return true
            }
            // Migrazione dal vecchio formato (lista piatta di snippet).
            if let flat = try? JSONDecoder().decode([Snippet].self, from: data) {
                folders = [SnippetFolder(name: L("Generale"), snippets: flat)]
                save()
                return true
            }
            NSLog("Klipski: snippets.json non valido, modifiche ignorate.")
            return false
        }
        // Primo avvio: cartella di esempio.
        folders = [
            SnippetFolder(name: L("Esempi"), snippets: [
                Snippet(title: L("Email"), content: "martin.trajkovski@dieffe.tech"),
                Snippet(title: L("Saluto"), content: L("Buongiorno,\n\ngrazie per il messaggio.")),
                Snippet(title: L("Lorem"), content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.")
            ])
        ]
        save()
        return true
    }

    private func save() {
        do {
            let encoder = JSONEncoder()
            encoder.outputFormatting = [.prettyPrinted]
            let data = try encoder.encode(folders)
            try data.write(to: fileURL)
        } catch {
            NSLog("Klipski: impossibile salvare snippets.json: \(error)")
        }
    }
}
