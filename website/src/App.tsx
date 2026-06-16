import { useEffect, useMemo, useState } from "react";
import { detectOS } from "./lib/detectOS";
import { DOWNLOADS, OS_ORDER, SITE, type OSId } from "./lib/config";
import { LANGS, useI18n } from "./i18n";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { Downloads } from "./components/Downloads";
import { Footer } from "./components/Footer";

export default function App() {
  const { t, lang, setLang } = useI18n();
  const [detected, setDetected] = useState<OSId | null>(null);

  useEffect(() => {
    setDetected(detectOS());
  }, []);

  const recommended = useMemo(
    () => (detected ? DOWNLOADS[detected] : null),
    [detected]
  );

  return (
    <>
      <header className="topbar">
        <a className="brand" href="#top" aria-label={SITE.name}>
          <Logo />
          <span>{SITE.name}</span>
        </a>
        <nav className="topnav">
          <a href="#features">{t.nav.features}</a>
          <a href="#download">{t.nav.download}</a>
          <a href={SITE.repo} target="_blank" rel="noreferrer noopener">
            GitHub
          </a>
          <div className="lang-select">
            <span aria-hidden="true">🌐</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as typeof lang)}
              aria-label="Language"
            >
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </nav>
      </header>

      <main id="top">
        <Hero recommended={recommended} detected={detected} />
        <Features />
        <Downloads recommended={detected} order={OS_ORDER} />
      </main>

      <Footer />
    </>
  );
}

function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="3" width="14" height="18" rx="3" fill="currentColor" opacity="0.18" />
      <rect x="8.5" y="2" width="7" height="4" rx="2" fill="currentColor" />
      <path d="M9 11h6M9 14.5h6M9 18h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
