import { useState } from "react";
import { MACOS_DOWNLOAD, SITE } from "../lib/config";
import { useI18n } from "../i18n";
import { MenuMockup } from "./MenuMockup";

export function Hero() {
  const { t } = useI18n();
  const [run, setRun] = useState(0);

  return (
    <section className="hero">
      <div className="hero-copy">
        <h1>{t.hero.tagline}</h1>
        <p className="lede">{t.hero.lede}</p>

        <div className="hero-cta">
          <a className="btn" href={MACOS_DOWNLOAD.url}>
            <DownloadIcon />
            <span>{t.hero.download}</span>
            <span className="btn-meta">{SITE.version}</span>
          </a>
          <p className="hero-note">{t.hero.note}</p>
        </div>

        <button
          type="button"
          className="keys"
          key={`keys-${run}`}
          onClick={() => setRun((r) => r + 1)}
        >
          <span className="keys-caps" aria-hidden="true">
            <kbd>⌘</kbd>
            <kbd>⇧</kbd>
            <kbd>V</kbd>
          </span>
          <span className="sr-only">Command Shift V</span>
          <span className="keys-label">{t.hero.shortcut}</span>
        </button>
      </div>

      <MenuMockup key={`menu-${run}`} />
    </section>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />
    </svg>
  );
}
