import { MACOS_DOWNLOAD } from "../lib/config";
import { useI18n } from "../i18n";

export function Hero() {
  const { t } = useI18n();

  return (
    <section className="hero">
      <h1>{t.hero.tagline}</h1>
      <p className="lede">{t.hero.lede}</p>

      <div className="hero-cta">
        <a className="btn btn-primary" href={MACOS_DOWNLOAD.url}>
          {t.hero.download}
          <span className="btn-sub">{MACOS_DOWNLOAD.format}</span>
        </a>
      </div>

      <div className="hero-window" aria-hidden="true">
        <div className="hw-bar">
          <span /><span /><span />
        </div>
        <div className="hw-body">
          <div className="hw-side">
            <p className="hw-group">{t.mockup.text}</p>
            <p className="hw-item">Lorem ipsum dolor sit amet</p>
            <p className="hw-item">https://klipski.martin-trajkovski.it</p>
            <p className="hw-item active">npm install</p>
            <p className="hw-group">{t.mockup.images}</p>
            <p className="hw-item">screenshot-2026.png</p>
          </div>
          <div className="hw-main">
            <p className="hw-kbd">⌘⇧V</p>
            <p>{t.mockup.caption}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
