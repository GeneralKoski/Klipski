import { MACOS_DOWNLOAD, WINDOWS_DOWNLOAD, type OS } from "../lib/config";
import { useI18n } from "../i18n";

const TABS: { os: OS; name: string }[] = [
  { os: "mac", name: "macOS" },
  { os: "win", name: "Windows" },
];

export function Install({ os, setOs }: { os: OS; setOs: (os: OS) => void }) {
  const { t } = useI18n();
  const { steps, specs } = t.install[os];
  const [first, ...rest] = steps;
  const download = os === "win" ? WINDOWS_DOWNLOAD : MACOS_DOWNLOAD;

  return (
    <section id="install" className="section">
      <h2 className="section-title">{t.install.title}</h2>
      <div className="seg" role="group" aria-label={t.install.title}>
        {TABS.map((tab) => (
          <button
            type="button"
            key={tab.os}
            aria-pressed={os === tab.os}
            onClick={() => setOs(tab.os)}
          >
            {tab.name}
          </button>
        ))}
      </div>
      <div className="install-grid">
        <ol className="steps">
          <li className="step">
            <h3>
              <a href={download.url}>{first.title}</a>
            </h3>
            <p>{first.body}</p>
          </li>
          {rest.map((s) => (
            <li className="step" key={s.title}>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              {s.code && (
                <pre className="step-code">
                  <code>{s.code}</code>
                </pre>
              )}
            </li>
          ))}
        </ol>

        <div className="group specs">
          <h3 className="group-title">{t.install.specsTitle}</h3>
          <dl className="glist">
            {specs.map((s) => (
              <div className="spec" key={s.label}>
                <dt>{s.label}</dt>
                <dd>
                  {s.href ? (
                    <a href={s.href} target="_blank" rel="noreferrer noopener">
                      {s.value}
                    </a>
                  ) : (
                    s.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
