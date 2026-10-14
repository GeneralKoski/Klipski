import { MACOS_DOWNLOAD, WINDOWS_DOWNLOAD, detectOS, type OS } from "../lib/config";
import { fmt, useI18n } from "../i18n";
import { MenuMockup } from "./MenuMockup";

export function Hero({ onDownload }: { onDownload: (os: OS) => void }) {
  const { t } = useI18n();
  const os = detectOS() ?? "mac";
  const d = os === "win" ? { name: "Windows", ...WINDOWS_DOWNLOAD } : { name: "macOS", ...MACOS_DOWNLOAD };

  return (
    <section className="hero">
      <div className="hero-copy">
        <h1>{t.hero.tagline}</h1>
        <p className="lede">{t.hero.lede}</p>

        <div className="hero-cta">
          <div className="dl-row">
            <a className="btn" href="#install" onClick={() => onDownload(os)}>
              <DownloadIcon />
              <span>{fmt(t.hero.downloadFor, { os: d.name })}</span>
              <span className="btn-meta">{d.format}</span>
            </a>
          </div>
          <p className="hero-note">{t.hero.note}</p>
        </div>
      </div>

      <MenuMockup />
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
