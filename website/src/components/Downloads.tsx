import { DOWNLOADS, type OSId } from "../lib/config";

export function Downloads({
  recommended,
  order,
}: {
  recommended: OSId | null;
  order: OSId[];
}) {
  return (
    <section id="download" className="section">
      <h2 className="section-title">Scarica Klipski</h2>
      <p className="section-sub">
        Gratis e open source. Scegli la versione per il tuo sistema operativo.
      </p>

      <div className="download-grid">
        {order.map((id) => {
          const dl = DOWNLOADS[id];
          const isRecommended = id === recommended;
          return (
            <article
              key={id}
              id={`download-${id}`}
              className={`download-card${isRecommended ? " is-recommended" : ""}`}
            >
              {isRecommended && <span className="badge">Consigliato per te</span>}
              <OSIcon os={id} />
              <h3>{dl.label}</h3>
              <p className="dl-req">{dl.requirement}</p>
              <a className="btn btn-primary btn-block" href={dl.url}>
                Scarica <span className="btn-sub">{dl.format}</span>
              </a>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function OSIcon({ os }: { os: OSId }) {
  const common = { width: 40, height: 40, viewBox: "0 0 24 24", "aria-hidden": true } as const;
  if (os === "macos") {
    return (
      <svg {...common} fill="currentColor">
        <path d="M16.4 12.5c0-1.9 1.5-2.8 1.6-2.9-.9-1.3-2.2-1.5-2.7-1.5-1.1-.1-2.2.7-2.8.7-.6 0-1.5-.6-2.4-.6-1.2 0-2.4.7-3 1.8-1.3 2.2-.3 5.5.9 7.3.6.9 1.3 1.9 2.2 1.8.9 0 1.2-.6 2.3-.6s1.4.6 2.3.6 1.5-.8 2.1-1.7c.6-1 .9-1.9.9-1.9-.1 0-1.7-.7-1.7-2.8zM14.6 6.4c.5-.6.8-1.5.7-2.4-.7 0-1.6.5-2.2 1.1-.5.5-.9 1.4-.8 2.2.8.1 1.6-.4 2.3-.9z" />
      </svg>
    );
  }
  if (os === "windows") {
    return (
      <svg {...common} fill="currentColor">
        <path d="M3 5.5 10.5 4.4v7.1H3zM11.5 4.3 21 3v8.5h-9.5zM3 12.5h7.5v7.1L3 18.5zM11.5 12.5H21V21l-9.5-1.3z" />
      </svg>
    );
  }
  return (
    <svg {...common} fill="currentColor">
      <path d="M12 2c-1.7 0-3 1.5-3 3.4 0 1 .1 1.9-.4 2.8C7.4 9.7 6 11.3 6 13.6c0 .9.3 1.6.3 2.3-.6.6-1.3 1.2-1.3 2 0 .6.5 1 1.2 1.2 1 .3 1.7 1 2.4 1.6.6.5 1.4.8 2.4.8h.4c1 0 1.8-.3 2.4-.8.7-.6 1.4-1.3 2.4-1.6.7-.2 1.2-.6 1.2-1.2 0-.8-.7-1.4-1.3-2 0-.7.3-1.4.3-2.3 0-2.3-1.4-3.9-2.6-5.4-.5-.9-.4-1.8-.4-2.8C15 3.5 13.7 2 12 2z" />
    </svg>
  );
}
