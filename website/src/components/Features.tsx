const FEATURES = [
  {
    title: "Cronologia testi e immagini",
    body: "Tiene traccia di tutto ciò che copi, con deduplica e limiti separati e configurabili. I tuoi dati restano sul tuo computer.",
  },
  {
    title: "Snippet a cartelle",
    body: "Organizza testi fissi — mail, firme, risposte rapide — in cartelle sempre a portata di click dal menu.",
  },
  {
    title: "Hotkey globale",
    body: "Richiama la cronologia da qualsiasi app con una scorciatoia personalizzabile e incolla con un solo click.",
  },
  {
    title: "Incolla automatico",
    body: "Seleziona un elemento e Klipski lo incolla per te nell'app attiva, simulando la combinazione di tasti.",
  },
  {
    title: "Import da Clipy",
    body: "Migri da Clipy? Importa le tue cartelle di snippet da un semplice file XML esportato.",
  },
  {
    title: "Leggero e nativo",
    body: "Vive nella barra di stato, senza icona nel Dock e senza appesantire il sistema. Avvio automatico al login.",
  },
];

export function Features() {
  return (
    <section id="features" className="section">
      <h2 className="section-title">Tutto quello che ti serve per copiare e incollare</h2>
      <div className="feature-grid">
        {FEATURES.map((f) => (
          <article className="feature-card" key={f.title}>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
