import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang =
  | "it" | "en" | "es" | "fr" | "de" | "pt" | "ru" | "ja" | "zh-Hans" | "ar";

interface Item {
  title: string;
  body: string;
}

export interface Dict {
  nav: { features: string; install: string };
  hero: {
    tagline: string;
    lede: string;
    download: string;
    note: string;
    shortcut: string;
  };
  mockup: {
    text: string;
    images: string;
    search: string;
    folder: string;
    autoPaste: string;
    login: string;
    customize: string;
    clear: string;
    quit: string;
    now: string;
  };
  features: { title: string; groups: { title: string; items: Item[] }[] };
  install: {
    title: string;
    steps: Item[];
    specsTitle: string;
    specs: { label: string; value: string }[];
  };
  footer: { meta: string };
}

export const LANGS: { code: Lang; label: string; dir: "ltr" | "rtl" }[] = [
  { code: "it", label: "Italiano", dir: "ltr" },
  { code: "en", label: "English", dir: "ltr" },
  { code: "es", label: "Español", dir: "ltr" },
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "de", label: "Deutsch", dir: "ltr" },
  { code: "pt", label: "Português", dir: "ltr" },
  { code: "ru", label: "Русский", dir: "ltr" },
  { code: "ja", label: "日本語", dir: "ltr" },
  { code: "zh-Hans", label: "简体中文", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
];

export const DICTS: Record<Lang, Dict> = {
  it: {
    nav: { features: "Funzioni", install: "Installazione" },
    hero: {
      tagline: "Il gestore di appunti che mancava al tuo computer",
      lede: "Klipski è un clipboard manager leggero e nativo: cronologia di testi e immagini, snippet a cartelle, hotkey globale e incolla automatico. Gratis e open source per macOS.",
      download: "Scarica Klipski",
      note: "Gratis e open source. Richiede macOS 14 o successivo su Apple silicon.",
      shortcut: "apre Klipski da qualsiasi app",
    },
    mockup: {
      text: "Testi", images: "Immagini", search: "Cerca…", folder: "Esempi",
      autoPaste: "Incolla automaticamente", login: "Avvia al login", customize: "Personalizza…",
      clear: "Pulisci cronologia", quit: "Esci", now: "adesso",
    },
    features: {
      title: "Tutto quello che ti serve per copiare e incollare",
      groups: [
        {
          title: "Cronologia",
          items: [
            { title: "Testi e immagini", body: "Tiene gli ultimi 50 testi e 10 immagini, senza doppioni, e mostra da quanto tempo li hai copiati. I limiti si cambiano nelle preferenze, i dati restano sul tuo Mac." },
            { title: "Ricerca e anteprima", body: "Il campo in cima ai testi filtra mentre scrivi. Passando su un'immagine, anche con le frecce, ne vedi un'anteprima ingrandita." },
            { title: "Password oscurate", body: "Quello che arriva da un password manager compare nel menu come p••••6, ma si incolla per intero." },
          ],
        },
        {
          title: "Incolla",
          items: [
            { title: "Scorciatoia globale", body: "⌘⇧V apre il menu da qualsiasi app, oppure scegli la tua combinazione. Con le frecce scorri le voci e dall'ultima torni alla prima." },
            { title: "Incolla automatico", body: "Scegli un elemento e Klipski lo incolla nell'app attiva. Il testo arriva sempre senza formattazione." },
            { title: "Snippet a cartelle", body: "Firme, indirizzi e risposte pronte, in cartelle sempre visibili nel menu. Trascinali per riordinare cartelle e snippet." },
          ],
        },
        {
          title: "L'app",
          items: [
            { title: "Import da Clipy e backup", body: "Importa le cartelle di snippet esportate da Clipy. Salva snippet e impostazioni in un file JSON e ripristinali quando vuoi." },
            { title: "In 10 lingue", body: "Segue la lingua del sistema, oppure la scegli nelle preferenze." },
            { title: "Leggero e nativo", body: "Scritto in Swift, vive nella barra dei menu senza icona nel Dock e può avviarsi al login." },
          ],
        },
      ],
    },
    install: {
      title: "Installazione",
      steps: [
        { title: "Scarica il DMG", body: "Aprilo e copia Klipski nella cartella Applicazioni." },
        { title: "Apri comunque", body: "Klipski non è notarizzato da Apple, quindi macOS blocca il primo avvio. Vai in Impostazioni di Sistema → Privacy e sicurezza e scegli Apri comunque." },
        { title: "Concedi l'Accessibilità", body: "Serve per l'incolla automatico e per lo scorrimento circolare del menu: Impostazioni di Sistema → Privacy e sicurezza → Accessibilità. Senza permesso Klipski copia comunque negli appunti. Dopo un aggiornamento può servire concederlo di nuovo." },
      ],
      specsTitle: "Requisiti e impostazioni predefinite",
      specs: [
        { label: "Sistema", value: "macOS 14 Sonoma o successivo" },
        { label: "Processore", value: "Apple silicon" },
        { label: "Scorciatoia", value: "⌘⇧V" },
        { label: "Cronologia", value: "50 testi, 10 immagini" },
        { label: "Licenza", value: "MIT" },
      ],
    },
    footer: { meta: "Versione {version} per macOS. Open source, licenza MIT." },
  },
  en: {
    nav: { features: "Features", install: "Install" },
    hero: {
      tagline: "The clipboard manager your computer was missing",
      lede: "Klipski is a lightweight, native clipboard manager: history of text and images, folder snippets, a global hotkey and auto-paste. Free and open source for macOS.",
      download: "Download Klipski",
      note: "Free and open source. Requires macOS 14 or later on Apple silicon.",
      shortcut: "opens Klipski from any app",
    },
    mockup: {
      text: "Text", images: "Images", search: "Search…", folder: "Examples",
      autoPaste: "Paste automatically", login: "Launch at login", customize: "Customize…",
      clear: "Clear history", quit: "Quit", now: "now",
    },
    features: {
      title: "Everything you need to copy and paste",
      groups: [
        {
          title: "History",
          items: [
            { title: "Text and images", body: "Keeps your last 50 text items and 10 images, without duplicates, and shows how long ago you copied each one. Change the limits in the preferences; your data stays on your Mac." },
            { title: "Search and preview", body: "The field at the top of the text list filters as you type. Hover an image, or reach it with the arrow keys, to see an enlarged preview." },
            { title: "Hidden passwords", body: "Anything copied from a password manager shows up in the menu as p••••6, but pastes in full." },
          ],
        },
        {
          title: "Pasting",
          items: [
            { title: "Global shortcut", body: "⌘⇧V opens the menu from any app, or pick your own combination. Move through items with the arrow keys; past the last one you are back at the first." },
            { title: "Auto-paste", body: "Pick an item and Klipski pastes it into the active app. Text always arrives without formatting." },
            { title: "Snippet folders", body: "Signatures, addresses and canned replies, in folders that are always in the menu. Drag to reorder folders and snippets." },
          ],
        },
        {
          title: "The app",
          items: [
            { title: "Clipy import and backup", body: "Import the snippet folders you exported from Clipy. Save snippets and settings to a JSON file and restore them whenever you need." },
            { title: "In 10 languages", body: "Follows the system language, or choose one in the preferences." },
            { title: "Light and native", body: "Written in Swift, it lives in the menu bar with no Dock icon and can launch at login." },
          ],
        },
      ],
    },
    install: {
      title: "Install",
      steps: [
        { title: "Download the DMG", body: "Open it and copy Klipski to your Applications folder." },
        { title: "Open Anyway", body: "Klipski is not notarized by Apple, so macOS blocks the first launch. Go to System Settings → Privacy & Security and choose Open Anyway." },
        { title: "Allow Accessibility", body: "Auto-paste and menu wrap-around need it: System Settings → Privacy & Security → Accessibility. Without it, Klipski still copies to the clipboard. After an update you may need to allow it again." },
      ],
      specsTitle: "Requirements and defaults",
      specs: [
        { label: "System", value: "macOS 14 Sonoma or later" },
        { label: "Processor", value: "Apple silicon" },
        { label: "Shortcut", value: "⌘⇧V" },
        { label: "History", value: "50 text items, 10 images" },
        { label: "License", value: "MIT" },
      ],
    },
    footer: { meta: "Version {version} for macOS. Open source, MIT license." },
  },
  es: {
    nav: { features: "Funciones", install: "Instalación" },
    hero: {
      tagline: "El gestor de portapapeles que le faltaba a tu ordenador",
      lede: "Klipski es un gestor de portapapeles ligero y nativo: historial de textos e imágenes, snippets en carpetas, atajo global y pegado automático. Gratis y de código abierto para macOS.",
      download: "Descargar Klipski",
      note: "Gratis y de código abierto. Requiere macOS 14 o posterior con Apple silicon.",
      shortcut: "abre Klipski desde cualquier app",
    },
    mockup: {
      text: "Textos", images: "Imágenes", search: "Buscar…", folder: "Ejemplos",
      autoPaste: "Pegar automáticamente", login: "Abrir al iniciar sesión", customize: "Personalizar…",
      clear: "Borrar historial", quit: "Salir", now: "ahora",
    },
    features: {
      title: "Todo lo que necesitas para copiar y pegar",
      groups: [
        {
          title: "Historial",
          items: [
            { title: "Textos e imágenes", body: "Guarda los últimos 50 textos y 10 imágenes, sin duplicados, y muestra cuánto hace que copiaste cada uno. Cambia los límites en las preferencias; tus datos se quedan en tu Mac." },
            { title: "Búsqueda y vista previa", body: "El campo de arriba en la lista de textos filtra mientras escribes. Pasa sobre una imagen, o llega a ella con las flechas, para verla ampliada." },
            { title: "Contraseñas ocultas", body: "Lo que copias desde un gestor de contraseñas aparece en el menú como p••••6, pero se pega completo." },
          ],
        },
        {
          title: "Pegar",
          items: [
            { title: "Atajo global", body: "⌘⇧V abre el menú desde cualquier app, o elige tu propia combinación. Recorre los elementos con las flechas; después del último vuelves al primero." },
            { title: "Pegado automático", body: "Elige un elemento y Klipski lo pega en la app activa. El texto llega siempre sin formato." },
            { title: "Snippets en carpetas", body: "Firmas, direcciones y respuestas rápidas, en carpetas siempre visibles en el menú. Arrastra para reordenar carpetas y snippets." },
          ],
        },
        {
          title: "La app",
          items: [
            { title: "Importar de Clipy y copia de seguridad", body: "Importa las carpetas de snippets exportadas desde Clipy. Guarda snippets y ajustes en un archivo JSON y restáuralos cuando quieras." },
            { title: "En 10 idiomas", body: "Sigue el idioma del sistema, o elige uno en las preferencias." },
            { title: "Ligero y nativo", body: "Escrito en Swift, vive en la barra de menús sin icono en el Dock y puede abrirse al iniciar sesión." },
          ],
        },
      ],
    },
    install: {
      title: "Instalación",
      steps: [
        { title: "Descarga el DMG", body: "Ábrelo y copia Klipski en la carpeta Aplicaciones." },
        { title: "Abrir de todos modos", body: "Klipski no está notarizado por Apple, así que macOS bloquea el primer arranque. Ve a Ajustes del Sistema → Privacidad y seguridad y elige Abrir de todos modos." },
        { title: "Permite la accesibilidad", body: "La necesitan el pegado automático y el recorrido circular del menú: Ajustes del Sistema → Privacidad y seguridad → Accesibilidad. Sin ella, Klipski sigue copiando al portapapeles. Tras una actualización puede que tengas que permitirla de nuevo." },
      ],
      specsTitle: "Requisitos y valores predeterminados",
      specs: [
        { label: "Sistema", value: "macOS 14 Sonoma o posterior" },
        { label: "Procesador", value: "Apple silicon" },
        { label: "Atajo", value: "⌘⇧V" },
        { label: "Historial", value: "50 textos, 10 imágenes" },
        { label: "Licencia", value: "MIT" },
      ],
    },
    footer: { meta: "Versión {version} para macOS. Código abierto, licencia MIT." },
  },
  fr: {
    nav: { features: "Fonctions", install: "Installation" },
    hero: {
      tagline: "Le gestionnaire de presse-papiers qui manquait à votre ordinateur",
      lede: "Klipski est un gestionnaire de presse-papiers léger et natif : historique de textes et d'images, snippets en dossiers, raccourci global et collage automatique. Gratuit et open source pour macOS.",
      download: "Télécharger Klipski",
      note: "Gratuit et open source. Nécessite macOS 14 ou ultérieur sur Apple silicon.",
      shortcut: "ouvre Klipski depuis n'importe quelle app",
    },
    mockup: {
      text: "Textes", images: "Images", search: "Rechercher…", folder: "Exemples",
      autoPaste: "Coller automatiquement", login: "Ouvrir à la connexion", customize: "Personnaliser…",
      clear: "Effacer l'historique", quit: "Quitter", now: "à l'instant",
    },
    features: {
      title: "Tout ce qu'il faut pour copier et coller",
      groups: [
        {
          title: "Historique",
          items: [
            { title: "Textes et images", body: "Garde vos 50 derniers textes et 10 dernières images, sans doublons, et indique depuis quand vous les avez copiés. Modifiez les limites dans les préférences ; vos données restent sur votre Mac." },
            { title: "Recherche et aperçu", body: "Le champ en haut de la liste des textes filtre pendant la saisie. Survolez une image, ou atteignez-la avec les flèches, pour la voir en grand." },
            { title: "Mots de passe masqués", body: "Ce qui vient d'un gestionnaire de mots de passe apparaît dans le menu sous la forme p••••6, mais se colle en entier." },
          ],
        },
        {
          title: "Coller",
          items: [
            { title: "Raccourci global", body: "⌘⇧V ouvre le menu depuis n'importe quelle app, ou choisissez votre propre combinaison. Parcourez les éléments avec les flèches ; après le dernier, on revient au premier." },
            { title: "Collage automatique", body: "Choisissez un élément et Klipski le colle dans l'app active. Le texte arrive toujours sans mise en forme." },
            { title: "Snippets en dossiers", body: "Signatures, adresses et réponses toutes prêtes, dans des dossiers toujours présents dans le menu. Faites glisser pour réordonner dossiers et snippets." },
          ],
        },
        {
          title: "L'app",
          items: [
            { title: "Import Clipy et sauvegarde", body: "Importez les dossiers de snippets exportés depuis Clipy. Enregistrez snippets et réglages dans un fichier JSON et restaurez-les quand vous voulez." },
            { title: "En 10 langues", body: "Suit la langue du système, ou choisissez-en une dans les préférences." },
            { title: "Léger et natif", body: "Écrit en Swift, il vit dans la barre des menus sans icône dans le Dock et peut s'ouvrir à la connexion." },
          ],
        },
      ],
    },
    install: {
      title: "Installation",
      steps: [
        { title: "Téléchargez le DMG", body: "Ouvrez-le et copiez Klipski dans le dossier Applications." },
        { title: "Ouvrir quand même", body: "Klipski n'est pas notarisé par Apple, donc macOS bloque le premier lancement. Allez dans Réglages Système → Confidentialité et sécurité et choisissez Ouvrir quand même." },
        { title: "Autorisez l'accessibilité", body: "Le collage automatique et le défilement circulaire du menu en ont besoin : Réglages Système → Confidentialité et sécurité → Accessibilité. Sans elle, Klipski copie quand même dans le presse-papiers. Après une mise à jour, il peut falloir l'autoriser de nouveau." },
      ],
      specsTitle: "Configuration requise et valeurs par défaut",
      specs: [
        { label: "Système", value: "macOS 14 Sonoma ou ultérieur" },
        { label: "Processeur", value: "Apple silicon" },
        { label: "Raccourci", value: "⌘⇧V" },
        { label: "Historique", value: "50 textes, 10 images" },
        { label: "Licence", value: "MIT" },
      ],
    },
    footer: { meta: "Version {version} pour macOS. Open source, licence MIT." },
  },
  de: {
    nav: { features: "Funktionen", install: "Installation" },
    hero: {
      tagline: "Der Zwischenablage-Manager, der deinem Computer gefehlt hat",
      lede: "Klipski ist ein leichter, nativer Zwischenablage-Manager: Verlauf von Texten und Bildern, Snippets in Ordnern, globaler Hotkey und automatisches Einfügen. Kostenlos und Open Source für macOS.",
      download: "Klipski herunterladen",
      note: "Kostenlos und Open Source. Benötigt macOS 14 oder neuer mit Apple Silicon.",
      shortcut: "öffnet Klipski aus jeder App",
    },
    mockup: {
      text: "Texte", images: "Bilder", search: "Suchen…", folder: "Beispiele",
      autoPaste: "Automatisch einfügen", login: "Bei der Anmeldung öffnen", customize: "Anpassen…",
      clear: "Verlauf löschen", quit: "Beenden", now: "gerade eben",
    },
    features: {
      title: "Alles, was du zum Kopieren und Einfügen brauchst",
      groups: [
        {
          title: "Verlauf",
          items: [
            { title: "Texte und Bilder", body: "Behält die letzten 50 Texte und 10 Bilder ohne Duplikate und zeigt, wann du sie kopiert hast. Die Limits änderst du in den Einstellungen; deine Daten bleiben auf deinem Mac." },
            { title: "Suche und Vorschau", body: "Das Feld oben in der Textliste filtert beim Tippen. Fahre über ein Bild oder wähle es mit den Pfeiltasten, um es vergrößert zu sehen." },
            { title: "Verdeckte Passwörter", body: "Was aus einem Passwortmanager kommt, erscheint im Menü als p••••6, wird aber vollständig eingefügt." },
          ],
        },
        {
          title: "Einfügen",
          items: [
            { title: "Globales Tastenkürzel", body: "⌘⇧V öffnet das Menü aus jeder App, oder wähle deine eigene Kombination. Mit den Pfeiltasten gehst du durch die Einträge; nach dem letzten geht es beim ersten weiter." },
            { title: "Automatisches Einfügen", body: "Wähle einen Eintrag und Klipski fügt ihn in die aktive App ein. Text kommt immer ohne Formatierung an." },
            { title: "Snippets in Ordnern", body: "Signaturen, Adressen und Standardantworten in Ordnern, die immer im Menü stehen. Ordner und Snippets sortierst du per Drag-and-drop." },
          ],
        },
        {
          title: "Die App",
          items: [
            { title: "Clipy-Import und Backup", body: "Importiere die aus Clipy exportierten Snippet-Ordner. Sichere Snippets und Einstellungen in einer JSON-Datei und stelle sie jederzeit wieder her." },
            { title: "In 10 Sprachen", body: "Folgt der Systemsprache, oder du wählst eine in den Einstellungen." },
            { title: "Leicht und nativ", body: "In Swift geschrieben, lebt in der Menüleiste ohne Dock-Symbol und kann bei der Anmeldung starten." },
          ],
        },
      ],
    },
    install: {
      title: "Installation",
      steps: [
        { title: "DMG herunterladen", body: "Öffne es und kopiere Klipski in den Ordner Programme." },
        { title: "Trotzdem öffnen", body: "Klipski ist nicht von Apple notarisiert, deshalb blockiert macOS den ersten Start. Öffne Systemeinstellungen → Datenschutz & Sicherheit und wähle Trotzdem öffnen." },
        { title: "Bedienungshilfen erlauben", body: "Automatisches Einfügen und das Durchlaufen des Menüs brauchen diese Berechtigung: Systemeinstellungen → Datenschutz & Sicherheit → Bedienungshilfen. Ohne sie kopiert Klipski trotzdem in die Zwischenablage. Nach einem Update musst du sie eventuell erneut erteilen." },
      ],
      specsTitle: "Voraussetzungen und Standardwerte",
      specs: [
        { label: "System", value: "macOS 14 Sonoma oder neuer" },
        { label: "Prozessor", value: "Apple Silicon" },
        { label: "Tastenkürzel", value: "⌘⇧V" },
        { label: "Verlauf", value: "50 Texte, 10 Bilder" },
        { label: "Lizenz", value: "MIT" },
      ],
    },
    footer: { meta: "Version {version} für macOS. Open Source, MIT-Lizenz." },
  },
  pt: {
    nav: { features: "Funções", install: "Instalação" },
    hero: {
      tagline: "O gerenciador de área de transferência que faltava no seu computador",
      lede: "O Klipski é um gerenciador de área de transferência leve e nativo: histórico de textos e imagens, snippets em pastas, atalho global e colagem automática. Grátis e de código aberto para macOS.",
      download: "Baixar Klipski",
      note: "Grátis e de código aberto. Requer macOS 14 ou posterior com Apple silicon.",
      shortcut: "abre o Klipski em qualquer app",
    },
    mockup: {
      text: "Textos", images: "Imagens", search: "Buscar…", folder: "Exemplos",
      autoPaste: "Colar automaticamente", login: "Abrir ao iniciar sessão", customize: "Personalizar…",
      clear: "Limpar histórico", quit: "Sair", now: "agora",
    },
    features: {
      title: "Tudo o que você precisa para copiar e colar",
      groups: [
        {
          title: "Histórico",
          items: [
            { title: "Textos e imagens", body: "Guarda os últimos 50 textos e 10 imagens, sem duplicados, e mostra há quanto tempo você copiou cada um. Mude os limites nas preferências; seus dados ficam no seu Mac." },
            { title: "Busca e pré-visualização", body: "O campo no topo da lista de textos filtra enquanto você digita. Passe sobre uma imagem, ou chegue a ela com as setas, para vê-la ampliada." },
            { title: "Senhas ocultas", body: "O que vem de um gerenciador de senhas aparece no menu como p••••6, mas é colado por inteiro." },
          ],
        },
        {
          title: "Colar",
          items: [
            { title: "Atalho global", body: "⌘⇧V abre o menu em qualquer app, ou escolha sua própria combinação. Percorra os itens com as setas; depois do último, você volta ao primeiro." },
            { title: "Colagem automática", body: "Escolha um item e o Klipski cola no app ativo. O texto chega sempre sem formatação." },
            { title: "Snippets em pastas", body: "Assinaturas, endereços e respostas prontas, em pastas sempre visíveis no menu. Arraste para reordenar pastas e snippets." },
          ],
        },
        {
          title: "O app",
          items: [
            { title: "Importar do Clipy e backup", body: "Importe as pastas de snippets exportadas do Clipy. Salve snippets e configurações em um arquivo JSON e restaure quando quiser." },
            { title: "Em 10 idiomas", body: "Segue o idioma do sistema, ou escolha um nas preferências." },
            { title: "Leve e nativo", body: "Escrito em Swift, vive na barra de menus sem ícone no Dock e pode abrir ao iniciar sessão." },
          ],
        },
      ],
    },
    install: {
      title: "Instalação",
      steps: [
        { title: "Baixe o DMG", body: "Abra e copie o Klipski para a pasta Aplicativos." },
        { title: "Abrir mesmo assim", body: "O Klipski não é notarizado pela Apple, então o macOS bloqueia a primeira abertura. Vá em Ajustes do Sistema → Privacidade e Segurança e escolha Abrir mesmo assim." },
        { title: "Permita a acessibilidade", body: "A colagem automática e a navegação circular do menu precisam dela: Ajustes do Sistema → Privacidade e Segurança → Acessibilidade. Sem ela, o Klipski continua copiando para a área de transferência. Depois de uma atualização, pode ser preciso permitir de novo." },
      ],
      specsTitle: "Requisitos e padrões",
      specs: [
        { label: "Sistema", value: "macOS 14 Sonoma ou posterior" },
        { label: "Processador", value: "Apple silicon" },
        { label: "Atalho", value: "⌘⇧V" },
        { label: "Histórico", value: "50 textos, 10 imagens" },
        { label: "Licença", value: "MIT" },
      ],
    },
    footer: { meta: "Versão {version} para macOS. Código aberto, licença MIT." },
  },
  ru: {
    nav: { features: "Возможности", install: "Установка" },
    hero: {
      tagline: "Менеджер буфера обмена, которого не хватало вашему компьютеру",
      lede: "Klipski - это лёгкий нативный менеджер буфера обмена: история текстов и изображений, сниппеты по папкам, глобальная горячая клавиша и автоматическая вставка. Бесплатно и с открытым кодом для macOS.",
      download: "Скачать Klipski",
      note: "Бесплатно, с открытым кодом. Нужна macOS 14 или новее на Apple silicon.",
      shortcut: "открывает Klipski из любого приложения",
    },
    mockup: {
      text: "Тексты", images: "Изображения", search: "Поиск…", folder: "Примеры",
      autoPaste: "Вставлять автоматически", login: "Запускать при входе", customize: "Настроить…",
      clear: "Очистить историю", quit: "Выйти", now: "только что",
    },
    features: {
      title: "Всё, что нужно для копирования и вставки",
      groups: [
        {
          title: "История",
          items: [
            { title: "Тексты и изображения", body: "Хранит последние 50 текстов и 10 изображений без дублей и показывает, как давно вы их скопировали. Лимиты меняются в настройках, данные остаются на вашем Mac." },
            { title: "Поиск и просмотр", body: "Поле вверху списка текстов фильтрует по мере ввода. Наведите на изображение или выберите его стрелками, чтобы увидеть его крупно." },
            { title: "Скрытые пароли", body: "То, что скопировано из менеджера паролей, показывается в меню как p••••6, но вставляется целиком." },
          ],
        },
        {
          title: "Вставка",
          items: [
            { title: "Глобальное сочетание клавиш", body: "⌘⇧V открывает меню из любого приложения, или задайте своё сочетание. Листайте пункты стрелками: после последнего снова идёт первый." },
            { title: "Автоматическая вставка", body: "Выберите элемент, и Klipski вставит его в активное приложение. Текст всегда вставляется без форматирования." },
            { title: "Сниппеты по папкам", body: "Подписи, адреса и готовые ответы в папках, которые всегда есть в меню. Порядок папок и сниппетов меняется перетаскиванием." },
          ],
        },
        {
          title: "Приложение",
          items: [
            { title: "Импорт из Clipy и резервная копия", body: "Импортируйте папки сниппетов, экспортированные из Clipy. Сохраняйте сниппеты и настройки в файл JSON и восстанавливайте их в любой момент." },
            { title: "На 10 языках", body: "Использует язык системы, или выберите язык в настройках." },
            { title: "Лёгкий и нативный", body: "Написан на Swift, живёт в строке меню без значка в Dock и может запускаться при входе." },
          ],
        },
      ],
    },
    install: {
      title: "Установка",
      steps: [
        { title: "Скачайте DMG", body: "Откройте его и скопируйте Klipski в папку «Программы»." },
        { title: "Открыть всё равно", body: "Klipski не нотариально заверен Apple, поэтому macOS блокирует первый запуск. Откройте Системные настройки → Конфиденциальность и безопасность и выберите «Открыть всё равно»." },
        { title: "Разрешите универсальный доступ", body: "Он нужен для автоматической вставки и циклической навигации по меню: Системные настройки → Конфиденциальность и безопасность → Универсальный доступ. Без него Klipski всё равно копирует в буфер обмена. После обновления разрешение может понадобиться выдать снова." },
      ],
      specsTitle: "Требования и значения по умолчанию",
      specs: [
        { label: "Система", value: "macOS 14 Sonoma или новее" },
        { label: "Процессор", value: "Apple silicon" },
        { label: "Сочетание клавиш", value: "⌘⇧V" },
        { label: "История", value: "50 текстов, 10 изображений" },
        { label: "Лицензия", value: "MIT" },
      ],
    },
    footer: { meta: "Версия {version} для macOS. Открытый код, лицензия MIT." },
  },
  ja: {
    nav: { features: "機能", install: "インストール" },
    hero: {
      tagline: "あなたのパソコンに足りなかったクリップボードマネージャー",
      lede: "Klipski は軽量でネイティブなクリップボードマネージャーです。テキストと画像の履歴、フォルダー別スニペット、グローバルホットキー、自動貼り付けに対応。macOS 向けに無料・オープンソースで提供。",
      download: "Klipski をダウンロード",
      note: "無料・オープンソース。Apple シリコン搭載の macOS 14 以降が必要です。",
      shortcut: "どのアプリからでも Klipski を開く",
    },
    mockup: {
      text: "テキスト", images: "画像", search: "検索…", folder: "例",
      autoPaste: "自動でペースト", login: "ログイン時に起動", customize: "カスタマイズ…",
      clear: "履歴を消去", quit: "終了", now: "たった今",
    },
    features: {
      title: "コピー＆ペーストに必要なすべて",
      groups: [
        {
          title: "履歴",
          items: [
            { title: "テキストと画像", body: "直近のテキスト50件と画像10件を重複なしで保存し、コピーしてからの経過時間を表示します。上限は環境設定で変更でき、データは Mac の中に留まります。" },
            { title: "検索とプレビュー", body: "テキスト一覧の上部の検索欄で、入力しながら絞り込めます。画像にポインタを合わせるか矢印キーで選ぶと、拡大プレビューが表示されます。" },
            { title: "パスワードを伏せ字に", body: "パスワード管理アプリからコピーした内容はメニューに p••••6 のように表示され、ペーストすると全文が入ります。" },
          ],
        },
        {
          title: "ペースト",
          items: [
            { title: "グローバルショートカット", body: "⌘⇧V でどのアプリからでもメニューを開けます。組み合わせは変更可能。矢印キーで項目を移動し、最後の次は最初に戻ります。" },
            { title: "自動ペースト", body: "項目を選ぶと、Klipski がアクティブなアプリにペーストします。テキストは常に書式なしで入ります。" },
            { title: "フォルダー別スニペット", body: "署名、住所、定型返信をフォルダーに整理し、いつでもメニューから使えます。フォルダーとスニペットはドラッグで並べ替えられます。" },
          ],
        },
        {
          title: "アプリ",
          items: [
            { title: "Clipy からの読み込みとバックアップ", body: "Clipy から書き出したスニペットのフォルダーを読み込めます。スニペットと設定を JSON ファイルに保存し、いつでも復元できます。" },
            { title: "10 言語に対応", body: "システムの言語に従うか、環境設定で言語を選べます。" },
            { title: "軽量＆ネイティブ", body: "Swift で書かれ、Dock アイコンなしでメニューバーに常駐し、ログイン時に起動できます。" },
          ],
        },
      ],
    },
    install: {
      title: "インストール",
      steps: [
        { title: "DMG をダウンロード", body: "開いて Klipski を「アプリケーション」フォルダーにコピーします。" },
        { title: "このまま開く", body: "Klipski は Apple の公証を受けていないため、初回起動は macOS にブロックされます。システム設定 → プライバシーとセキュリティ で「このまま開く」を選んでください。" },
        { title: "アクセシビリティを許可", body: "自動ペーストとメニューの循環移動に必要です。システム設定 → プライバシーとセキュリティ → アクセシビリティ。許可しなくても Klipski はクリップボードにコピーします。アップデート後は再度許可が必要な場合があります。" },
      ],
      specsTitle: "動作環境とデフォルト設定",
      specs: [
        { label: "システム", value: "macOS 14 Sonoma 以降" },
        { label: "プロセッサ", value: "Apple シリコン" },
        { label: "ショートカット", value: "⌘⇧V" },
        { label: "履歴", value: "テキスト50件、画像10件" },
        { label: "ライセンス", value: "MIT" },
      ],
    },
    footer: { meta: "macOS 版 バージョン {version}。オープンソース（MIT ライセンス）。" },
  },
  "zh-Hans": {
    nav: { features: "功能", install: "安装" },
    hero: {
      tagline: "你的电脑一直缺少的剪贴板管理器",
      lede: "Klipski 是一款轻量的原生剪贴板管理器：文本与图片历史、文件夹代码片段、全局快捷键和自动粘贴。面向 macOS，免费且开源。",
      download: "下载 Klipski",
      note: "免费开源。需要搭载 Apple 芯片的 macOS 14 或更高版本。",
      shortcut: "在任意应用中打开 Klipski",
    },
    mockup: {
      text: "文本", images: "图片", search: "搜索…", folder: "示例",
      autoPaste: "自动粘贴", login: "登录时启动", customize: "自定义…",
      clear: "清除历史", quit: "退出", now: "刚刚",
    },
    features: {
      title: "复制粘贴所需的一切",
      groups: [
        {
          title: "历史记录",
          items: [
            { title: "文本与图片", body: "保留最近 50 条文本和 10 张图片，自动去重，并显示每项复制于多久之前。上限可在偏好设置中修改，数据只保存在你的 Mac 上。" },
            { title: "搜索与预览", body: "文本列表顶部的搜索框会随输入即时筛选。将指针移到图片上或用方向键选中，即可查看放大预览。" },
            { title: "隐藏密码", body: "从密码管理器复制的内容在菜单中显示为 p••••6，但粘贴时是完整内容。" },
          ],
        },
        {
          title: "粘贴",
          items: [
            { title: "全局快捷键", body: "⌘⇧V 可在任意应用中打开菜单，也可以设置自己的组合键。用方向键浏览条目，到最后一项后会回到第一项。" },
            { title: "自动粘贴", body: "选择一个条目，Klipski 就会把它粘贴到当前应用。文本始终以纯文本粘贴。" },
            { title: "文件夹代码片段", body: "签名、地址和常用回复按文件夹整理，始终显示在菜单中。拖动即可调整文件夹和片段的顺序。" },
          ],
        },
        {
          title: "应用",
          items: [
            { title: "从 Clipy 导入与备份", body: "导入从 Clipy 导出的片段文件夹。将片段和设置保存为 JSON 文件，随时恢复。" },
            { title: "支持 10 种语言", body: "跟随系统语言，也可以在偏好设置中选择。" },
            { title: "轻量且原生", body: "使用 Swift 编写，常驻菜单栏，无 Dock 图标，可在登录时启动。" },
          ],
        },
      ],
    },
    install: {
      title: "安装",
      steps: [
        { title: "下载 DMG", body: "打开后将 Klipski 拷贝到“应用程序”文件夹。" },
        { title: "仍要打开", body: "Klipski 未经 Apple 公证，因此 macOS 会阻止首次启动。前往 系统设置 → 隐私与安全性，选择“仍要打开”。" },
        { title: "允许辅助功能", body: "自动粘贴和菜单循环导航需要此权限：系统设置 → 隐私与安全性 → 辅助功能。没有该权限时，Klipski 仍会复制到剪贴板。更新后可能需要重新授权。" },
      ],
      specsTitle: "系统要求与默认设置",
      specs: [
        { label: "系统", value: "macOS 14 Sonoma 或更高版本" },
        { label: "处理器", value: "Apple 芯片" },
        { label: "快捷键", value: "⌘⇧V" },
        { label: "历史记录", value: "50 条文本，10 张图片" },
        { label: "许可证", value: "MIT" },
      ],
    },
    footer: { meta: "macOS 版本 {version}。开源，MIT 许可证。" },
  },
  ar: {
    nav: { features: "المزايا", install: "التثبيت" },
    hero: {
      tagline: "مدير الحافظة الذي كان ينقص جهازك",
      lede: "كليبسكي مدير حافظة خفيف وأصلي: سجل للنصوص والصور، ومقتطفات ضمن مجلدات، واختصار عام، ولصق تلقائي. مجاني ومفتوح المصدر لنظام macOS.",
      download: "تنزيل كليبسكي",
      note: "مجاني ومفتوح المصدر. يتطلب macOS 14 أو أحدث على Apple silicon.",
      shortcut: "يفتح كليبسكي من أي تطبيق",
    },
    mockup: {
      text: "نصوص", images: "صور", search: "بحث…", folder: "أمثلة",
      autoPaste: "اللصق تلقائيًا", login: "التشغيل عند تسجيل الدخول", customize: "تخصيص…",
      clear: "مسح السجل", quit: "إنهاء", now: "الآن",
    },
    features: {
      title: "كل ما تحتاجه للنسخ واللصق",
      groups: [
        {
          title: "السجل",
          items: [
            { title: "النصوص والصور", body: "يحتفظ بآخر 50 نصًا و10 صور دون تكرار، ويعرض منذ متى نسخت كل عنصر. يمكنك تغيير الحدود من التفضيلات، وتبقى بياناتك على جهاز Mac." },
            { title: "البحث والمعاينة", body: "حقل البحث أعلى قائمة النصوص يصفّي النتائج أثناء الكتابة. مرّر المؤشر فوق صورة، أو انتقل إليها بالأسهم، لتراها مكبّرة." },
            { title: "كلمات مرور مخفية", body: "ما تنسخه من مدير كلمات المرور يظهر في القائمة بشكل p••••6، لكنه يُلصق كاملًا." },
          ],
        },
        {
          title: "اللصق",
          items: [
            { title: "اختصار عام", body: "يفتح ⌘⇧V القائمة من أي تطبيق، أو اختر تركيبتك الخاصة. تنقّل بين العناصر بالأسهم، وبعد العنصر الأخير تعود إلى الأول." },
            { title: "لصق تلقائي", body: "اختر عنصرًا وسيلصقه كليبسكي في التطبيق النشط. يصل النص دائمًا دون تنسيق." },
            { title: "مقتطفات ضمن مجلدات", body: "التواقيع والعناوين والردود الجاهزة في مجلدات تظهر دائمًا في القائمة. اسحب لإعادة ترتيب المجلدات والمقتطفات." },
          ],
        },
        {
          title: "التطبيق",
          items: [
            { title: "الاستيراد من Clipy والنسخ الاحتياطي", body: "استورد مجلدات المقتطفات المُصدَّرة من Clipy. احفظ المقتطفات والإعدادات في ملف JSON واستعدها متى شئت." },
            { title: "بـ 10 لغات", body: "يتبع لغة النظام، أو اختر لغة من التفضيلات." },
            { title: "خفيف وأصلي", body: "مكتوب بلغة Swift، يعيش في شريط القوائم دون أيقونة في الـ Dock ويمكن تشغيله عند تسجيل الدخول." },
          ],
        },
      ],
    },
    install: {
      title: "التثبيت",
      steps: [
        { title: "نزّل ملف DMG", body: "افتحه وانسخ كليبسكي إلى مجلد التطبيقات." },
        { title: "افتح على أي حال", body: "كليبسكي غير موثّق من Apple، لذلك يمنع macOS التشغيل الأول. انتقل إلى إعدادات النظام ← الخصوصية والأمان واختر «افتح على أي حال»." },
        { title: "اسمح بتسهيلات الاستخدام", body: "يحتاجها اللصق التلقائي والتنقل الدائري في القائمة: إعدادات النظام ← الخصوصية والأمان ← تسهيلات الاستخدام. من دونها يواصل كليبسكي النسخ إلى الحافظة. بعد التحديث قد تحتاج إلى منح الإذن مجددًا." },
      ],
      specsTitle: "المتطلبات والإعدادات الافتراضية",
      specs: [
        { label: "النظام", value: "macOS 14 Sonoma أو أحدث" },
        { label: "المعالج", value: "Apple silicon" },
        { label: "الاختصار", value: "⌘⇧V" },
        { label: "السجل", value: "50 نصًا، 10 صور" },
        { label: "الترخيص", value: "MIT" },
      ],
    },
    footer: { meta: "الإصدار {version} لنظام macOS. مفتوح المصدر بترخيص MIT." },
  },
};

export function fmt(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

export function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage non disponibile: la preferenza vale solo per questa visita
  }
}

function detectLang(): Lang {
  const codes = LANGS.map((l) => l.code);
  const stored = readStored("klipski-lang") as Lang | null;
  if (stored && codes.includes(stored)) return stored;
  for (const pref of navigator.languages ?? [navigator.language]) {
    const low = pref.toLowerCase();
    if (low.startsWith("zh")) return "zh-Hans";
    const base = low.split("-")[0] as Lang;
    if (codes.includes(base)) return base;
  }
  return "en";
}

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    setLang(detectLang());
  }, []);

  useEffect(() => {
    const dir = LANGS.find((l) => l.code === lang)?.dir ?? "ltr";
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    writeStored("klipski-lang", lang);
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: DICTS[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
