import { SITE } from "../lib/config";
import { fmt, useI18n } from "../i18n";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="footer">
      <div className="footer-inner">
        <p className="footer-brand">{SITE.name}</p>
        <nav className="footer-nav">
          <a href="#features">{t.nav.features}</a>
          <a href="#download">{t.nav.download}</a>
          <a href={SITE.repo} target="_blank" rel="noreferrer noopener">
            GitHub
          </a>
        </nav>
        <p className="footer-meta">{fmt(t.footer.meta, { version: SITE.version })}</p>
      </div>
    </footer>
  );
}
