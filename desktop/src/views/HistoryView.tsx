import { useEffect, useMemo, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { api, type HistoryItem, type SnippetFolder } from "../api";

type Tab = "text" | "image" | "snippet";

export function HistoryView() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [folders, setFolders] = useState<SnippetFolder[]>([]);
  const [tab, setTab] = useState<Tab>("text");
  const [query, setQuery] = useState("");

  async function reload() {
    setItems(await api.getHistory());
    setFolders(await api.getSnippets());
  }

  useEffect(() => {
    reload();
    const un = listen("history-changed", reload);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") api.hideHistory();
    };
    const onBlur = () => api.hideHistory();
    window.addEventListener("keydown", onKey);
    getCurrentWindow().onFocusChanged(({ payload }) => {
      if (!payload) onBlur();
    });
    return () => {
      un.then((f) => f());
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const texts = useMemo(
    () => items.filter((i) => i.kind === "text"),
    [items]
  );
  const images = useMemo(() => items.filter((i) => i.kind === "image"), [items]);

  const filteredTexts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return texts;
    return texts.filter((i) => (i.text ?? "").toLowerCase().includes(q));
  }, [texts, query]);

  return (
    <div className="hist">
      <div className="hist-head">
        <input
          autoFocus
          className="search"
          placeholder="Cerca…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className="icon-btn"
          title="Personalizza"
          onClick={() => api.showSettings()}
        >
          ⚙
        </button>
      </div>

      <div className="tabs">
        <button className={tab === "text" ? "on" : ""} onClick={() => setTab("text")}>
          Testi <span className="count">{texts.length}</span>
        </button>
        <button className={tab === "image" ? "on" : ""} onClick={() => setTab("image")}>
          Immagini <span className="count">{images.length}</span>
        </button>
        <button className={tab === "snippet" ? "on" : ""} onClick={() => setTab("snippet")}>
          Snippet
        </button>
      </div>

      <div className="list">
        {tab === "text" &&
          filteredTexts.map((i) => (
            <button key={i.id} className="row" onClick={() => api.applyItem(i.id)}>
              <span className="row-text">{i.text}</span>
              <span
                className="row-del"
                onClick={(e) => {
                  e.stopPropagation();
                  api.deleteItem(i.id).then(reload);
                }}
              >
                ×
              </span>
            </button>
          ))}

        {tab === "text" && filteredTexts.length === 0 && (
          <p className="empty">Nessun testo.</p>
        )}

        {tab === "image" &&
          images.map((i) => <ImageRow key={i.id} item={i} onDelete={reload} />)}
        {tab === "image" && images.length === 0 && (
          <p className="empty">Nessuna immagine.</p>
        )}

        {tab === "snippet" &&
          folders.map((f) => (
            <div key={f.id} className="snip-group">
              <p className="snip-folder">{f.name}</p>
              {f.snippets.map((s) => (
                <button
                  key={s.id}
                  className="row"
                  onClick={() => api.applySnippet(s.content)}
                >
                  <span className="row-text">{s.title || s.content}</span>
                </button>
              ))}
            </div>
          ))}
        {tab === "snippet" && folders.length === 0 && (
          <p className="empty">Nessuno snippet. Aggiungili da Personalizza.</p>
        )}
      </div>
    </div>
  );
}

function ImageRow({ item, onDelete }: { item: HistoryItem; onDelete: () => void }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (item.imagePath) api.imageDataUrl(item.imagePath).then(setSrc);
  }, [item.imagePath]);
  return (
    <button className="row row-img" onClick={() => api.applyItem(item.id)}>
      {src ? <img src={src} alt="" /> : <span className="row-text">Immagine</span>}
      <span
        className="row-del"
        onClick={(e) => {
          e.stopPropagation();
          api.deleteItem(item.id).then(onDelete);
        }}
      >
        ×
      </span>
    </button>
  );
}
