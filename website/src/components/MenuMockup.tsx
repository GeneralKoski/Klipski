import { useState } from "react";
import { useI18n } from "../i18n";

// Riproduce il menu della barra di stato com'è costruito in AppDelegate.menuNeedsUpdate:
// Testi (N) con campo di ricerca, Immagini (N), cartelle snippet, due opzioni con spunta,
// Personalizza…, Pulisci cronologia, Esci (⌘Q). Si apre da solo su Testi, poi si può navigare.
function ago(lang: string, value: number, unit: Intl.RelativeTimeFormatUnit): string {
  try {
    return new Intl.RelativeTimeFormat(lang, { style: "short" }).format(-value, unit);
  } catch {
    return "";
  }
}

type Sub = "text" | "images" | "folder";

const IMAGES = [
  { size: "1440 × 900", colors: ["#7aa7ff", "#c7d8ff"] },
  { size: "820 × 512", colors: ["#ffb36b", "#ffe1b8"] },
];

const SNIPPETS = ["git status", "npm run dev", "SELECT * FROM users;"];

export function MenuMockup() {
  const { t, lang } = useI18n();
  const m = t.mockup;
  const [live, setLive] = useState(false);
  const [open, setOpen] = useState<Sub>("text");
  const [query, setQuery] = useState("");
  const [checks, setChecks] = useState({ autoPaste: true, login: true });
  const [cleared, setCleared] = useState(false);

  const texts = cleared
    ? []
    : [
        { label: "npm install", time: m.now },
        { label: "https://klipski.martin-trajkovski.it", time: ago(lang, 2, "minute") },
        { label: "p••••••••••6", time: ago(lang, 5, "minute") },
        { label: 'git commit -m "Wrap menu"', time: ago(lang, 1, "hour") },
      ];
  const images = cleared ? [] : IMAGES;
  const shown = texts.filter((it) => it.label.toLowerCase().includes(query.trim().toLowerCase()));

  const go = (sub: Sub) => {
    setLive(true);
    setOpen(sub);
  };
  const toggle = (key: keyof typeof checks) => {
    setLive(true);
    setChecks((c) => ({ ...c, [key]: !c[key] }));
  };

  return (
    <div className="stage" aria-hidden="true">
      <div className="mbar">
        <span className="mbar-item mbar-k">K</span>
        <span className="mbar-item">
          <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
            <path d="M8 2.2c2.3 0 4.4.9 6 2.4l1-1.1A10 10 0 0 0 8 .7 10 10 0 0 0 1 3.5l1 1.1a8.6 8.6 0 0 1 6-2.4Zm0 3c1.5 0 2.9.6 3.9 1.5l1-1.1A7.2 7.2 0 0 0 8 3.7c-1.9 0-3.6.7-4.9 1.9l1 1.1c1-.9 2.4-1.5 3.9-1.5Zm0 3c-.7 0-1.4.3-1.9.8L8 11.2l1.9-2.2c-.5-.5-1.2-.8-1.9-.8Z" />
          </svg>
        </span>
        <span className="mbar-item mbar-clock">9:41</span>
      </div>

      <div className={`menus${live ? " is-live" : ""}`}>
        <div className="menu menu-sub" key={open}>
          {open === "text" && (
            <>
              <label className="m-search">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                  <circle cx="10.5" cy="10.5" r="6.5" />
                  <path d="m20 20-4.8-4.8" />
                </svg>
                <input
                  tabIndex={-1}
                  value={query}
                  placeholder={m.search}
                  onFocus={() => setLive(true)}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              {shown.map((it, i) => (
                <div className={`m-row${i === 0 && (!live || query) ? " is-hl" : ""}`} key={it.label}>
                  <span className="m-gutter" />
                  <span className="m-label">
                    <span className="m-text">{it.label}</span>
                    <span className="m-time">{it.time}</span>
                  </span>
                </div>
              ))}
            </>
          )}
          {open === "images" &&
            images.map((img) => (
              <div className="m-row m-img" key={img.size}>
                <span className="m-gutter" />
                <span className="m-thumb" style={{ background: `linear-gradient(135deg, ${img.colors[0]}, ${img.colors[1]})` }} />
                <span className="m-label">
                  <span className="m-text">{img.size}</span>
                </span>
              </div>
            ))}
          {open === "folder" &&
            SNIPPETS.map((s) => (
              <div className="m-row" key={s}>
                <span className="m-gutter" />
                <span className="m-label">
                  <span className="m-text">{s}</span>
                </span>
              </div>
            ))}
          {((open === "text" && shown.length === 0) || (open === "images" && images.length === 0)) && (
            <div className="m-row m-empty">
              <span className="m-gutter" />
              <span className="m-label">-</span>
            </div>
          )}
        </div>

        <div className="menu menu-main">
          <Row label={`${m.text} (${texts.length})`} submenu open={open === "text"} onPick={() => go("text")} />
          <Row label={`${m.images} (${images.length})`} submenu open={open === "images"} onPick={() => go("images")} />
          <div className="m-sep" />
          <Row label={m.folder} submenu open={open === "folder"} onPick={() => go("folder")} />
          <div className="m-sep" />
          <Row label={m.autoPaste} checked={checks.autoPaste} onClick={() => toggle("autoPaste")} />
          <Row label={m.login} checked={checks.login} onClick={() => toggle("login")} />
          <div className="m-sep" />
          <Row label={m.customize} />
          <Row
            label={m.clear}
            onClick={() => {
              setLive(true);
              setCleared(true);
            }}
          />
          <Row label={m.quit} shortcut="⌘Q" />
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  submenu,
  open,
  checked,
  shortcut,
  onPick,
  onClick,
}: {
  label: string;
  submenu?: boolean;
  open?: boolean;
  checked?: boolean;
  shortcut?: string;
  onPick?: () => void;
  onClick?: () => void;
}) {
  return (
    <div className={`m-row${open ? " is-open" : ""}`} onMouseEnter={onPick} onClick={onPick ?? onClick}>
      <span className="m-gutter">{checked ? "✓" : ""}</span>
      <span className="m-label">{label}</span>
      {submenu && <span className="m-chev">›</span>}
      {shortcut && <span className="m-key">{shortcut}</span>}
    </div>
  );
}
