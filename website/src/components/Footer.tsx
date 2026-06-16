import { SITE } from "../lib/config";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <p className="footer-brand">{SITE.name}</p>
        <nav className="footer-nav">
          <a href="#features">Funzioni</a>
          <a href="#download">Download</a>
          <a href={SITE.repo} target="_blank" rel="noreferrer noopener">
            GitHub
          </a>
        </nav>
        <p className="footer-meta">
          Open source · Versione {SITE.version} · macOS · Windows · Linux
        </p>
      </div>
    </footer>
  );
}
