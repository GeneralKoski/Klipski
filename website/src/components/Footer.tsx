import { SITE } from "../lib/config";
import { fmt, useI18n } from "../i18n";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="footer">
      <div className="footer-inner">
        <p className="footer-brand">
          <span className="brand-mark" aria-hidden="true">K</span>
          {SITE.name}
        </p>
        <p className="footer-meta">{fmt(t.footer.meta, { version: SITE.version })}</p>
        <nav className="footer-nav" aria-label={SITE.name}>
          <a href="#features">{t.nav.features}</a>
          <a href="#install">{t.nav.install}</a>
          <a href={SITE.repo} target="_blank" rel="noreferrer noopener">
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
