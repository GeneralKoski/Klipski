import { useEffect, useState } from "react";
import { SITE, detectOS, type OS } from "./lib/config";
import { LANGS, readStored, useI18n, writeStored } from "./i18n";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { Install } from "./components/Install";
import { Footer } from "./components/Footer";

type Theme = "light" | "dark";

function initialTheme(): Theme {
  const stored = readStored("klipski-theme");
  if (stored === "light" || stored === "dark") return stored;
  return "dark";
}

export default function App() {
  const { t, lang, setLang } = useI18n();
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [os, setOs] = useState<OS>(() => detectOS() ?? "mac");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    writeStored("klipski-theme", theme);
  }, [theme]);

  const nextLabel = theme === "dark" ? "Light mode" : "Dark mode";

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#top" aria-label={SITE.name}>
            <span className="brand-mark" aria-hidden="true">K</span>
            <span>{SITE.name}</span>
          </a>
          <nav className="topnav" aria-label={SITE.name}>
            <a href="#features">{t.nav.features}</a>
            <a href="#install">{t.nav.install}</a>
            <a href={SITE.repo} target="_blank" rel="noreferrer noopener">
              GitHub
            </a>
          </nav>
          <div className="topbar-tools">
            <button
              type="button"
              className="tool-btn"
              onClick={() => setTheme((th) => (th === "dark" ? "light" : "dark"))}
              aria-label={nextLabel}
              title={nextLabel}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
            <label className="lang-select">
              <GlobeIcon />
              <select
                id="lang"
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
            </label>
          </div>
        </div>
      </header>

      <main id="top">
        <Hero onDownload={setOs} />
        <Features />
        <Install os={os} setOs={setOs} />
      </main>

      <Footer />
    </>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
    </svg>
  );
}
