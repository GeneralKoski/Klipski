import { type DownloadTarget, type OSId } from "../lib/config";
import { fmt, useI18n } from "../i18n";

const OS_LABEL: Record<OSId, string> = {
  macos: "macOS",
  windows: "Windows",
  linux: "Linux",
};

export function Hero({
  recommended,
  detected,
}: {
  recommended: DownloadTarget | null;
  detected: OSId | null;
}) {
  const { t } = useI18n();

  return (
    <section className="hero">
      <p className="eyebrow">{t.hero.eyebrow}</p>
      <h1>{t.hero.tagline}</h1>
      <p className="lede">{t.hero.lede}</p>

      <div className="hero-cta">
        {recommended && recommended.available ? (
          <a className="btn btn-primary" href={recommended.url}>
            {fmt(t.hero.downloadFor, { os: OS_LABEL[recommended.id] })}
            <span className="btn-sub">{recommended.format}</span>
          </a>
        ) : (
          <a className="btn btn-primary" href="#download">
            {t.hero.download}
          </a>
        )}
        <a className="btn btn-ghost" href="#download">
          {t.hero.otherPlatforms}
        </a>
      </div>

      {detected && (
        <p className="detect-note">
          {fmt(t.hero.detected, { os: OS_LABEL[detected] })}{" "}
          <a href="#download">{t.hero.choose}</a>
        </p>
      )}

      <div className="hero-window" aria-hidden="true">
        <div className="hw-bar">
          <span /><span /><span />
        </div>
        <div className="hw-body">
          <div className="hw-side">
            <p className="hw-group">{t.mockup.text}</p>
            <p className="hw-item">Lorem ipsum dolor sit amet</p>
            <p className="hw-item">https://klipski.app</p>
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
