import { SITE, type DownloadTarget, type OSId } from "../lib/config";

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
  return (
    <section className="hero">
      <p className="eyebrow">Gratis · Open source · Nativo</p>
      <h1>{SITE.tagline}</h1>
      <p className="lede">{SITE.description}</p>

      <div className="hero-cta">
        {recommended ? (
          <a className="btn btn-primary" href={recommended.url}>
            Scarica per {OS_LABEL[recommended.id]}
            <span className="btn-sub">{recommended.format}</span>
          </a>
        ) : (
          <a className="btn btn-primary" href="#download">
            Scarica Klipski
          </a>
        )}
        <a className="btn btn-ghost" href="#download">
          Altre piattaforme
        </a>
      </div>

      {detected && (
        <p className="detect-note">
          Abbiamo rilevato <strong>{OS_LABEL[detected]}</strong>. Non è il tuo
          sistema?{" "}
          <a href="#download">Scegli un'altra versione</a>.
        </p>
      )}

      <div className="hero-window" aria-hidden="true">
        <div className="hw-bar">
          <span /><span /><span />
        </div>
        <div className="hw-body">
          <div className="hw-side">
            <p className="hw-group">Testi</p>
            <p className="hw-item">Riunione lunedì alle 10:00</p>
            <p className="hw-item">https://klipski.app</p>
            <p className="hw-item active">npm install</p>
            <p className="hw-group">Immagini</p>
            <p className="hw-item">screenshot-2026.png</p>
          </div>
          <div className="hw-main">
            <p className="hw-kbd">⌘⇧V</p>
            <p>Apri ovunque la cronologia, incolla con un click.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
