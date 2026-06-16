use crate::store::{Snippet, SnippetFolder};
use uuid::Uuid;

// Parser dell'export XML di Clipy (Snippets → Export Snippets…).
// Struttura: <folders><folder><title>..</title><snippets><snippet><title/><content/>..
pub fn parse(xml: &str) -> Result<Vec<SnippetFolder>, String> {
    let doc = roxmltree::Document::parse(xml).map_err(|e| e.to_string())?;
    let mut folders = Vec::new();

    for folder in doc.descendants().filter(|n| n.has_tag_name("folder")) {
        let name = child_text(&folder, "title").unwrap_or_else(|| "Senza nome".into());
        let mut snippets = Vec::new();

        for snip in folder.descendants().filter(|n| n.has_tag_name("snippet")) {
            let title = child_text(&snip, "title").unwrap_or_default();
            let content = child_text(&snip, "content").unwrap_or_default();
            if title.is_empty() && content.is_empty() {
                continue;
            }
            snippets.push(Snippet {
                id: Uuid::new_v4().to_string(),
                title,
                content,
            });
        }

        folders.push(SnippetFolder {
            id: Uuid::new_v4().to_string(),
            name,
            snippets,
        });
    }

    if folders.is_empty() {
        return Err("Nessuna cartella trovata nel file XML.".into());
    }
    Ok(folders)
}

fn child_text(node: &roxmltree::Node, tag: &str) -> Option<String> {
    node.children()
        .find(|c| c.has_tag_name(tag))
        .and_then(|c| c.text())
        .map(|s| s.to_string())
}
