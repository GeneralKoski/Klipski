import Foundation

/// Importa snippet dall'XML esportato da Clipy (Snippets → Export Snippets…).
/// Formato atteso:
/// <folders>
///   <folder><title>...</title><snippets>
///     <snippet><title>...</title><content>...</content></snippet>
///   </snippets></folder>
/// </folders>
final class ClipyImporter: NSObject, XMLParserDelegate {
    private var folders: [SnippetFolder] = []
    private var currentFolderName = ""
    private var currentSnippets: [Snippet] = []
    private var currentSnippetTitle = ""
    private var currentSnippetContent = ""
    private var buffer = ""
    private var inFolder = false
    private var inSnippet = false

    static func importFolders(from url: URL) -> [SnippetFolder]? {
        guard let parser = XMLParser(contentsOf: url) else { return nil }
        let importer = ClipyImporter()
        parser.delegate = importer
        guard parser.parse() else { return nil }
        return importer.folders
    }

    func parser(_ parser: XMLParser, didStartElement elementName: String, namespaceURI: String?,
                qualifiedName qName: String?, attributes attributeDict: [String: String] = [:]) {
        buffer = ""
        switch elementName {
        case "folder":
            inFolder = true
            currentFolderName = ""
            currentSnippets = []
        case "snippet":
            inSnippet = true
            currentSnippetTitle = ""
            currentSnippetContent = ""
        default:
            break
        }
    }

    func parser(_ parser: XMLParser, foundCharacters string: String) {
        buffer += string
    }

    func parser(_ parser: XMLParser, didEndElement elementName: String, namespaceURI: String?,
                qualifiedName qName: String?) {
        let text = buffer
        switch elementName {
        case "title":
            if inSnippet {
                currentSnippetTitle = text
            } else if inFolder {
                currentFolderName = text
            }
        case "content":
            if inSnippet { currentSnippetContent = text }
        case "snippet":
            currentSnippets.append(Snippet(title: currentSnippetTitle, content: currentSnippetContent))
            inSnippet = false
        case "folder":
            let name = currentFolderName.trimmingCharacters(in: .whitespacesAndNewlines)
            folders.append(SnippetFolder(name: name.isEmpty ? "Importata" : name, snippets: currentSnippets))
            inFolder = false
        default:
            break
        }
        buffer = ""
    }
}
