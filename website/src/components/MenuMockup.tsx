import { useI18n } from "../i18n";

// Riproduce il menu della barra di stato com'è costruito in AppDelegate.menuNeedsUpdate:
// Testi (N) con campo di ricerca, Immagini (N), cartelle snippet, due opzioni con spunta,
// Personalizza…, Pulisci cronologia, Esci (⌘Q).
function ago(lang: string, value: number, unit: Intl.RelativeTimeFormatUnit): string {
  try {
    return new Intl.RelativeTimeFormat(lang, { style: "short" }).format(-value, unit);
  } catch {
    return "";
  }
}

export function MenuMockup() {
  const { t, lang } = useI18n();
  const m = t.mockup;

  const texts = [
    { label: "npm install", time: m.now },
    { label: "https://klipski.martin-trajkovski.it", time: ago(lang, 2, "minute") },
    { label: "p••••••••••6", time: ago(lang, 5, "minute") },
    { label: 'git commit -m "Wrap menu"', time: ago(lang, 1, "hour") },
  ];

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

      <div className="menus">
        <div className="menu menu-sub">
          <div className="m-search">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m20 20-4.8-4.8" />
            </svg>
            <span>{m.search}</span>
          </div>
          {texts.map((it, i) => (
            <div className={`m-row${i === 0 ? " is-hl" : ""}`} key={it.label}>
              <span className="m-gutter" />
              <span className="m-label">
                <span className="m-text">{it.label}</span>
                <span className="m-time">{it.time}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="menu menu-main">
          <Row label={`${m.text} (${texts.length})`} submenu open />
          <Row label={`${m.images} (2)`} submenu />
          <div className="m-sep" />
          <Row label={m.folder} submenu />
          <div className="m-sep" />
          <Row label={m.autoPaste} checked />
          <Row label={m.login} checked />
          <div className="m-sep" />
          <Row label={m.customize} />
          <Row label={m.clear} />
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
}: {
  label: string;
  submenu?: boolean;
  open?: boolean;
  checked?: boolean;
  shortcut?: string;
}) {
  return (
    <div className={`m-row${open ? " is-open" : ""}`}>
      <span className="m-gutter">{checked ? "✓" : ""}</span>
      <span className="m-label">{label}</span>
      {submenu && <span className="m-chev">›</span>}
      {shortcut && <span className="m-key">{shortcut}</span>}
    </div>
  );
}
