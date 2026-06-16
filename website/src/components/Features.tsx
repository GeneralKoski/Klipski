import { useI18n } from "../i18n";

export function Features() {
  const { t } = useI18n();
  return (
    <section id="features" className="section">
      <h2 className="section-title">{t.features.title}</h2>
      <div className="feature-grid">
        {t.features.items.map((f, i) => (
          <article className="feature-card" key={i}>
            <div className="feature-dot" aria-hidden="true" />
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
