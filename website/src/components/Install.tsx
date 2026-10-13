import { MACOS_DOWNLOAD } from "../lib/config";
import { useI18n } from "../i18n";

export function Install() {
  const { t } = useI18n();
  const [first, ...rest] = t.install.steps;
  return (
    <section id="install" className="section">
      <h2 className="section-title">{t.install.title}</h2>
      <div className="install-grid">
        <ol className="steps">
          <li className="step">
            <h3>
              <a href={MACOS_DOWNLOAD.url}>{first.title}</a>
            </h3>
            <p>{first.body}</p>
          </li>
          {rest.map((s) => (
            <li className="step" key={s.title}>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="group specs">
          <h3 className="group-title">{t.install.specsTitle}</h3>
          <dl className="glist">
            {t.install.specs.map((s) => (
              <div className="spec" key={s.label}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
