import { useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { api, uid, type Settings, type SnippetFolder } from "../api";

export function SettingsView() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [folders, setFolders] = useState<SnippetFolder[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    api.getSettings().then(setSettings);
    api.getSnippets().then(setFolders);
  }, []);

  if (!settings) return <div className="settings loading">Caricamento…</div>;

  function patch(p: Partial<Settings>) {
    setSettings((s) => (s ? { ...s, ...p } : s));
  }

  async function saveAll() {
    if (!settings) return;
    await api.saveSettings(settings);
    await api.saveSnippets(folders);
    flash("Salvato ✓");
  }

  function flash(msg: string) {
    setStatus(msg);
    setTimeout(() => setStatus(""), 2000);
  }

  async function importClipy() {
    const path = await open({
      multiple: false,
      filters: [{ name: "Clipy XML", extensions: ["xml"] }],
    });
    if (typeof path === "string") {
      try {
        const n = await api.importClipy(path);
        setFolders(await api.getSnippets());
        flash(`Importate ${n} cartelle ✓`);
      } catch (e) {
        flash(`Errore import: ${e}`);
      }
    }
  }

  return (
    <div className="settings">
      <h1>Personalizza Klipski</h1>

      <section className="card">
        <h2>Cronologia</h2>
        <label className="field">
          <span>Testi da conservare</span>
          <input
            type="number"
            min={1}
            value={settings.textLimit}
            onChange={(e) => patch({ textLimit: Number(e.target.value) })}
          />
        </label>
        <label className="field">
          <span>Immagini da conservare</span>
          <input
            type="number"
            min={1}
            value={settings.imageLimit}
            onChange={(e) => patch({ imageLimit: Number(e.target.value) })}
          />
        </label>
      </section>

      <section className="card">
        <h2>Comportamento</h2>
        <label className="field">
          <span>Scorciatoia globale</span>
          <input
            type="text"
            value={settings.hotkey}
            placeholder="CommandOrControl+Shift+V"
            onChange={(e) => patch({ hotkey: e.target.value })}
          />
        </label>
        <p className="hint">
          Formato: <code>CommandOrControl+Shift+V</code>, <code>Alt+Space</code>…
        </p>
        <label className="check">
          <input
            type="checkbox"
            checked={settings.autoPaste}
            onChange={(e) => patch({ autoPaste: e.target.checked })}
          />
          <span>Incolla automaticamente dopo la selezione</span>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={settings.launchAtLogin}
            onChange={(e) => patch({ launchAtLogin: e.target.checked })}
          />
          <span>Avvia al login</span>
        </label>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Snippet a cartelle</h2>
          <div className="row-actions">
            <button onClick={importClipy}>Importa da Clipy…</button>
            <button
              onClick={() =>
                setFolders((f) => [...f, { id: uid(), name: "Nuova cartella", snippets: [] }])
              }
            >
              + Cartella
            </button>
          </div>
        </div>

        {folders.map((folder, fi) => (
          <div key={folder.id} className="folder">
            <div className="folder-head">
              <input
                className="folder-name"
                value={folder.name}
                onChange={(e) =>
                  setFolders((fs) =>
                    fs.map((f, i) => (i === fi ? { ...f, name: e.target.value } : f))
                  )
                }
              />
              <button
                className="link"
                onClick={() => setFolders((fs) => fs.filter((_, i) => i !== fi))}
              >
                Elimina
              </button>
            </div>

            {folder.snippets.map((s, si) => (
              <div key={s.id} className="snippet">
                <input
                  placeholder="Titolo"
                  value={s.title}
                  onChange={(e) =>
                    setFolders((fs) =>
                      fs.map((f, i) =>
                        i === fi
                          ? {
                              ...f,
                              snippets: f.snippets.map((x, j) =>
                                j === si ? { ...x, title: e.target.value } : x
                              ),
                            }
                          : f
                      )
                    )
                  }
                />
                <textarea
                  placeholder="Contenuto"
                  value={s.content}
                  onChange={(e) =>
                    setFolders((fs) =>
                      fs.map((f, i) =>
                        i === fi
                          ? {
                              ...f,
                              snippets: f.snippets.map((x, j) =>
                                j === si ? { ...x, content: e.target.value } : x
                              ),
                            }
                          : f
                      )
                    )
                  }
                />
                <button
                  className="link"
                  onClick={() =>
                    setFolders((fs) =>
                      fs.map((f, i) =>
                        i === fi
                          ? { ...f, snippets: f.snippets.filter((_, j) => j !== si) }
                          : f
                      )
                    )
                  }
                >
                  Rimuovi snippet
                </button>
              </div>
            ))}

            <button
              className="link"
              onClick={() =>
                setFolders((fs) =>
                  fs.map((f, i) =>
                    i === fi
                      ? { ...f, snippets: [...f.snippets, { id: uid(), title: "", content: "" }] }
                      : f
                  )
                )
              }
            >
              + Snippet
            </button>
          </div>
        ))}
      </section>

      <div className="save-bar">
        <span className="status">{status}</span>
        <button className="primary" onClick={saveAll}>
          Salva
        </button>
      </div>
    </div>
  );
}
