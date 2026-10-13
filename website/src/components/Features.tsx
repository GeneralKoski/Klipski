import type { ReactNode } from "react";
import { useI18n } from "../i18n";

const p = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

// Un'icona e un colore per ogni voce, nello stesso ordine dei gruppi in i18n.
const ICONS: { color: string; icon: ReactNode }[][] = [
  [
    { color: "var(--c-blue)", icon: <><circle cx="12" cy="12" r="8" {...p} /><path d="M12 7.5V12l3 2" {...p} /></> },
    { color: "var(--c-teal)", icon: <><circle cx="10.5" cy="10.5" r="6" {...p} /><path d="m19.5 19.5-4.5-4.5" {...p} /></> },
    { color: "var(--c-gray)", icon: <><rect x="5" y="10.5" width="14" height="9.5" rx="2" {...p} /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" {...p} /></> },
  ],
  [
    { color: "var(--c-indigo)", icon: <path d="M9 9V6.5a2.5 2.5 0 1 0-2.5 2.5H9Zm0 0h6m-6 0v6m6-6V6.5A2.5 2.5 0 1 1 17.5 9H15Zm0 0v6m0 0h-6m6 0v2.5a2.5 2.5 0 1 0 2.5-2.5H15Zm-6 0H6.5A2.5 2.5 0 1 0 9 17.5V15Z" {...p} /> },
    { color: "var(--c-green)", icon: <><rect x="6" y="4.5" width="12" height="16" rx="2.5" {...p} /><path d="M9.5 4.5h5v2.5h-5zM9 12h6M9 15.5h4" {...p} /></> },
    { color: "var(--c-orange)", icon: <path d="M3.5 7.5A2 2 0 0 1 5.5 5.5h4l2 2.5h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" {...p} /> },
  ],
  [
    { color: "var(--c-pink)", icon: <><path d="M12 4v10M8 10l4 4 4-4" {...p} /><path d="M5 15.5v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" {...p} /></> },
    { color: "var(--c-purple)", icon: <><circle cx="12" cy="12" r="8" {...p} /><path d="M4 12h16M12 4c2.2 2.3 3.3 5 3.3 8s-1.1 5.7-3.3 8c-2.2-2.3-3.3-5-3.3-8S9.8 6.3 12 4Z" {...p} /></> },
    { color: "var(--c-red)", icon: <><rect x="3.5" y="5" width="17" height="14" rx="2.5" {...p} /><path d="M3.5 9h17" {...p} /></> },
  ],
];

export function Features() {
  const { t } = useI18n();
  return (
    <section id="features" className="section">
      <h2 className="section-title">{t.features.title}</h2>
      <div className="groups">
        {t.features.groups.map((g, gi) => (
          <div className="group" key={gi}>
            <h3 className="group-title">{g.title}</h3>
            <ul className="glist">
              {g.items.map((f, i) => (
                <li className="grow" key={i}>
                  <span className="gicon" style={{ background: ICONS[gi][i].color }} aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24">{ICONS[gi][i].icon}</svg>
                  </span>
                  <div className="gtext">
                    <h4>{f.title}</h4>
                    <p>{f.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
