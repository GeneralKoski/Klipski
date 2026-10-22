import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang =
  | "it" | "en" | "es" | "fr" | "de" | "pt" | "ru" | "ja" | "zh-Hans" | "ar";

interface Item {
  title: string;
  body: string;
  code?: string;
}

const HOTKEYS_KEY = `"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced"`;

const winV = (free: string, restore: string) => `# ${free}
reg add ${HOTKEYS_KEY} /v DisabledHotkeys /t REG_SZ /d V /f
Stop-Process -Name explorer -Force

# ${restore}
reg delete ${HOTKEYS_KEY} /v DisabledHotkeys /f
Stop-Process -Name explorer -Force`;

export interface Spec {
  label: string;
  value: string;
  href?: string;
}

interface Platform {
  steps: Item[];
  specs: Spec[];
}

export interface Dict {
  nav: { features: string; install: string };
  hero: {
    tagline: string;
    lede: string;
    downloadFor: string;
    note: string;
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
    specsTitle: string;
    mac: Platform;
    win: Platform;
  };
  footer: { meta: string; privacy: string };
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
      lede: "Klipski è un clipboard manager leggero e nativo: cronologia di testi e immagini, snippet a cartelle, hotkey globale e incolla automatico. Gratis e open source per macOS e Windows.",
      downloadFor: "Scarica per {os}",
      note: "Gratis e open source. macOS 14 o successivo su Apple silicon, Windows 10 o 11 a 64 bit.",
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
            { title: "Testi e immagini", body: "Tiene gli ultimi 50 testi e 10 immagini, senza doppioni, e mostra da quanto tempo li hai copiati. I limiti si cambiano nelle preferenze, i dati restano sul tuo computer." },
            { title: "Ricerca e anteprima", body: "Il campo in cima ai testi filtra mentre scrivi. Passando su un'immagine, anche con le frecce, ne vedi un'anteprima ingrandita." },
            { title: "Password oscurate", body: "Quello che arriva da un password manager compare nel menu come p••••6, ma si incolla per intero. Su Windows, se il password manager chiede di escluderlo, non viene proprio salvato." },
          ],
        },
        {
          title: "Incolla",
          items: [
            { title: "Scorciatoia globale", body: "⌘⇧V su Mac e Ctrl+Shift+V su Windows aprono il menu da qualsiasi app, oppure scegli la tua combinazione. Con le frecce scorri le voci e dall'ultima torni alla prima." },
            { title: "Incolla automatico", body: "Scegli un elemento e Klipski lo incolla nell'app attiva. Il testo arriva sempre senza formattazione." },
            { title: "Snippet a cartelle", body: "Firme, indirizzi e risposte pronte, in cartelle sempre visibili nel menu. Cartelle e snippet si riordinano nelle preferenze." },
          ],
        },
        {
          title: "L'app",
          items: [
            { title: "Backup e import da Clipy", body: "Salva snippet e impostazioni in un file JSON e ripristinali anche sull'altro sistema. Su Mac puoi importare le cartelle esportate da Clipy." },
            { title: "In 10 lingue", body: "Segue la lingua del sistema, oppure la scegli nelle preferenze." },
            { title: "Leggero e nativo", body: "Scritto in Swift su Mac e in C# su Windows. Vive nella barra dei menu o nell'area di notifica e può avviarsi al login." },
          ],
        },
      ],
    },
    install: {
      title: "Installazione",
      specsTitle: "Requisiti e impostazioni predefinite",
      mac: {
        steps: [
          { title: "Scarica il DMG", body: "Aprilo e copia Klipski nella cartella Applicazioni." },
          { title: "Apri comunque", body: "Klipski non è notarizzato da Apple, quindi macOS blocca il primo avvio. Vai in Impostazioni di Sistema → Privacy e sicurezza e scegli Apri comunque." },
          { title: "Concedi l'Accessibilità", body: "Serve per l'incolla automatico e per lo scorrimento circolare del menu: Impostazioni di Sistema → Privacy e sicurezza → Accessibilità. Senza permesso Klipski copia comunque negli appunti. Dopo un aggiornamento può servire concederlo di nuovo." },
        ],
        specs: [
          { label: "Sistema", value: "macOS 14 Sonoma o successivo" },
          { label: "Processore", value: "Apple silicon" },
          { label: "Scorciatoia", value: "⌘⇧V" },
          { label: "Cronologia", value: "50 testi, 10 immagini" },
          { label: "Licenza", value: "MIT" },
        ],
      },
      win: {
        steps: [
          { title: "Scarica lo zip", body: "Estrai Klipski.exe in una cartella a tua scelta e avvialo. Serve il .NET 8 Desktop Runtime: se manca, Windows lo propone al primo avvio." },
          { title: "Esegui comunque", body: "L'exe non è firmato, quindi SmartScreen può mostrare «Windows ha protetto il PC»: fai clic su Ulteriori informazioni e poi su Esegui comunque." },
          { title: "Apri il menu", body: "Klipski resta nell'area di notifica: apri il menu con Ctrl+Shift+V o con un clic sull'icona. In Chrome, Edge e VS Code quella combinazione incolla come testo semplice: se ti serve, scegline un'altra in Personalizza…" },
          { title: "Usa Win+V (facoltativo)", body: "Windows riserva Win+V alla sua cronologia degli appunti. Per assegnarlo a Klipski esegui questi comandi in PowerShell (non servono i diritti di amministratore), poi in Personalizza… premi Win+V. Il riavvio di Esplora risorse chiude le finestre delle cartelle aperte.", code: winV("Libera Win+V", "Per tornare alla cronologia degli appunti di Windows") },
        ],
        specs: [
          { label: "Sistema", value: "Windows 10 o 11 a 64 bit" },
          { label: "Runtime", value: ".NET 8 Desktop Runtime", href: "https://dotnet.microsoft.com/download/dotnet/8.0" },
          { label: "Scorciatoia", value: "Ctrl+Shift+V" },
          { label: "Cronologia", value: "50 testi, 10 immagini" },
          { label: "Licenza", value: "MIT" },
        ],
      },
    },
    footer: { meta: "Versione {version} per macOS e Windows. Open source, licenza MIT.", privacy: "Questo sito usa Hydran, un'analitica senza cookie, per contare visite ed errori. Non salva il tuo indirizzo IP: conserva solo un identificativo anonimo nel browser (localStorage)." },
  },
  en: {
    nav: { features: "Features", install: "Install" },
    hero: {
      tagline: "The clipboard manager your computer was missing",
      lede: "Klipski is a lightweight, native clipboard manager: history of text and images, folder snippets, a global hotkey and auto-paste. Free and open source for macOS and Windows.",
      downloadFor: "Download for {os}",
      note: "Free and open source. macOS 14 or later on Apple silicon, 64-bit Windows 10 or 11.",
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
            { title: "Text and images", body: "Keeps your last 50 text items and 10 images, without duplicates, and shows how long ago you copied each one. Change the limits in the preferences; your data stays on your computer." },
            { title: "Search and preview", body: "The field at the top of the text list filters as you type. Hover an image, or reach it with the arrow keys, to see an enlarged preview." },
            { title: "Hidden passwords", body: "Anything copied from a password manager shows up in the menu as p••••6, but pastes in full. On Windows, if the password manager asks to exclude it, it is not saved at all." },
          ],
        },
        {
          title: "Pasting",
          items: [
            { title: "Global shortcut", body: "⌘⇧V on the Mac and Ctrl+Shift+V on Windows open the menu from any app, or pick your own combination. Move through items with the arrow keys; past the last one you are back at the first." },
            { title: "Auto-paste", body: "Pick an item and Klipski pastes it into the active app. Text always arrives without formatting." },
            { title: "Snippet folders", body: "Signatures, addresses and canned replies, in folders that are always in the menu. Reorder folders and snippets in the preferences." },
          ],
        },
        {
          title: "The app",
          items: [
            { title: "Backup and Clipy import", body: "Save snippets and settings to a JSON file and restore them, even on the other system. On the Mac you can import the folders exported from Clipy." },
            { title: "In 10 languages", body: "Follows the system language, or choose one in the preferences." },
            { title: "Light and native", body: "Written in Swift on the Mac and C# on Windows. It lives in the menu bar or the notification area and can launch at login." },
          ],
        },
      ],
    },
    install: {
      title: "Install",
      specsTitle: "Requirements and defaults",
      mac: {
        steps: [
          { title: "Download the DMG", body: "Open it and copy Klipski to your Applications folder." },
          { title: "Open Anyway", body: "Klipski is not notarized by Apple, so macOS blocks the first launch. Go to System Settings → Privacy & Security and choose Open Anyway." },
          { title: "Allow Accessibility", body: "Auto-paste and menu wrap-around need it: System Settings → Privacy & Security → Accessibility. Without it, Klipski still copies to the clipboard. After an update you may need to allow it again." },
        ],
        specs: [
          { label: "System", value: "macOS 14 Sonoma or later" },
          { label: "Processor", value: "Apple silicon" },
          { label: "Shortcut", value: "⌘⇧V" },
          { label: "History", value: "50 text items, 10 images" },
          { label: "License", value: "MIT" },
        ],
      },
      win: {
        steps: [
          { title: "Download the zip", body: "Extract Klipski.exe to any folder and run it. It needs the .NET 8 Desktop Runtime: if it is missing, Windows offers it on first launch." },
          { title: "Run anyway", body: "The exe is not signed, so SmartScreen may show “Windows protected your PC”: click More info, then Run anyway." },
          { title: "Open the menu", body: "Klipski stays in the notification area: open the menu with Ctrl+Shift+V or by clicking the icon. In Chrome, Edge and VS Code that combination pastes as plain text; if you need it, pick another one in Customize…" },
          { title: "Use Win+V (optional)", body: "Windows reserves Win+V for its own clipboard history. To give it to Klipski, run these commands in PowerShell (no admin rights needed), then press Win+V in Customize… Restarting Explorer closes any open folder windows.", code: winV("Free up Win+V", "To go back to the Windows clipboard history") },
        ],
        specs: [
          { label: "System", value: "64-bit Windows 10 or 11" },
          { label: "Runtime", value: ".NET 8 Desktop Runtime", href: "https://dotnet.microsoft.com/download/dotnet/8.0" },
          { label: "Shortcut", value: "Ctrl+Shift+V" },
          { label: "History", value: "50 text items, 10 images" },
          { label: "License", value: "MIT" },
        ],
      },
    },
    footer: { meta: "Version {version} for macOS and Windows. Open source, MIT license.", privacy: "This site uses Hydran, a cookie-free analytics tool, to count visits and errors. It does not store your IP address: it only keeps an anonymous ID in your browser (localStorage)." },
  },
  es: {
    nav: { features: "Funciones", install: "Instalación" },
    hero: {
      tagline: "El gestor de portapapeles que le faltaba a tu ordenador",
      lede: "Klipski es un gestor de portapapeles ligero y nativo: historial de textos e imágenes, snippets en carpetas, atajo global y pegado automático. Gratis y de código abierto para macOS y Windows.",
      downloadFor: "Descargar para {os}",
      note: "Gratis y de código abierto. macOS 14 o posterior con Apple silicon, Windows 10 u 11 de 64 bits.",
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
            { title: "Textos e imágenes", body: "Guarda los últimos 50 textos y 10 imágenes, sin duplicados, y muestra cuánto hace que copiaste cada uno. Cambia los límites en las preferencias; tus datos se quedan en tu ordenador." },
            { title: "Búsqueda y vista previa", body: "El campo de arriba en la lista de textos filtra mientras escribes. Pasa sobre una imagen, o llega a ella con las flechas, para verla ampliada." },
            { title: "Contraseñas ocultas", body: "Lo que copias desde un gestor de contraseñas aparece en el menú como p••••6, pero se pega completo. En Windows, si el gestor pide excluirlo, no se guarda en absoluto." },
          ],
        },
        {
          title: "Pegar",
          items: [
            { title: "Atajo global", body: "⌘⇧V en Mac y Ctrl+Shift+V en Windows abren el menú desde cualquier app, o elige tu propia combinación. Recorre los elementos con las flechas; después del último vuelves al primero." },
            { title: "Pegado automático", body: "Elige un elemento y Klipski lo pega en la app activa. El texto llega siempre sin formato." },
            { title: "Snippets en carpetas", body: "Firmas, direcciones y respuestas rápidas, en carpetas siempre visibles en el menú. Reordena carpetas y snippets en las preferencias." },
          ],
        },
        {
          title: "La app",
          items: [
            { title: "Copia de seguridad e importación de Clipy", body: "Guarda snippets y ajustes en un archivo JSON y restáuralos, también en el otro sistema. En Mac puedes importar las carpetas exportadas desde Clipy." },
            { title: "En 10 idiomas", body: "Sigue el idioma del sistema, o elige uno en las preferencias." },
            { title: "Ligero y nativo", body: "Escrito en Swift en Mac y en C# en Windows. Vive en la barra de menús o en el área de notificación y puede abrirse al iniciar sesión." },
          ],
        },
      ],
    },
    install: {
      title: "Instalación",
      specsTitle: "Requisitos y valores predeterminados",
      mac: {
        steps: [
          { title: "Descarga el DMG", body: "Ábrelo y copia Klipski en la carpeta Aplicaciones." },
          { title: "Abrir de todos modos", body: "Klipski no está notarizado por Apple, así que macOS bloquea el primer arranque. Ve a Ajustes del Sistema → Privacidad y seguridad y elige Abrir de todos modos." },
          { title: "Permite la accesibilidad", body: "La necesitan el pegado automático y el recorrido circular del menú: Ajustes del Sistema → Privacidad y seguridad → Accesibilidad. Sin ella, Klipski sigue copiando al portapapeles. Tras una actualización puede que tengas que permitirla de nuevo." },
        ],
        specs: [
          { label: "Sistema", value: "macOS 14 Sonoma o posterior" },
          { label: "Procesador", value: "Apple silicon" },
          { label: "Atajo", value: "⌘⇧V" },
          { label: "Historial", value: "50 textos, 10 imágenes" },
          { label: "Licencia", value: "MIT" },
        ],
      },
      win: {
        steps: [
          { title: "Descarga el zip", body: "Extrae Klipski.exe en la carpeta que quieras y ábrelo. Necesita .NET 8 Desktop Runtime: si falta, Windows lo ofrece en el primer arranque." },
          { title: "Ejecutar de todas formas", body: "El exe no está firmado, así que SmartScreen puede mostrar «Windows protegió su PC»: haz clic en Más información y luego en Ejecutar de todas formas." },
          { title: "Abre el menú", body: "Klipski queda en el área de notificación: abre el menú con Ctrl+Shift+V o con un clic en el icono. En Chrome, Edge y VS Code esa combinación pega como texto sin formato; si la necesitas, elige otra en Personalizar…" },
          { title: "Usa Win+V (opcional)", body: "Windows reserva Win+V para su propio historial del portapapeles. Para asignarlo a Klipski, ejecuta estos comandos en PowerShell (no hacen falta permisos de administrador) y luego pulsa Win+V en Personalizar… Reiniciar el Explorador cierra las ventanas de carpetas abiertas.", code: winV("Libera Win+V", "Para volver al historial del portapapeles de Windows") },
        ],
        specs: [
          { label: "Sistema", value: "Windows 10 u 11 de 64 bits" },
          { label: "Runtime", value: ".NET 8 Desktop Runtime", href: "https://dotnet.microsoft.com/download/dotnet/8.0" },
          { label: "Atajo", value: "Ctrl+Shift+V" },
          { label: "Historial", value: "50 textos, 10 imágenes" },
          { label: "Licencia", value: "MIT" },
        ],
      },
    },
    footer: { meta: "Versión {version} para macOS y Windows. Código abierto, licencia MIT.", privacy: "Este sitio usa Hydran, una analítica sin cookies, para contar visitas y errores. No guarda tu dirección IP: solo conserva un identificador anónimo en tu navegador (localStorage)." },
  },
  fr: {
    nav: { features: "Fonctions", install: "Installation" },
    hero: {
      tagline: "Le gestionnaire de presse-papiers qui manquait à votre ordinateur",
      lede: "Klipski est un gestionnaire de presse-papiers léger et natif : historique de textes et d'images, snippets en dossiers, raccourci global et collage automatique. Gratuit et open source pour macOS et Windows.",
      downloadFor: "Télécharger pour {os}",
      note: "Gratuit et open source. macOS 14 ou ultérieur sur Apple silicon, Windows 10 ou 11 64 bits.",
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
            { title: "Textes et images", body: "Garde vos 50 derniers textes et 10 dernières images, sans doublons, et indique depuis quand vous les avez copiés. Modifiez les limites dans les préférences ; vos données restent sur votre ordinateur." },
            { title: "Recherche et aperçu", body: "Le champ en haut de la liste des textes filtre pendant la saisie. Survolez une image, ou atteignez-la avec les flèches, pour la voir en grand." },
            { title: "Mots de passe masqués", body: "Ce qui vient d'un gestionnaire de mots de passe apparaît dans le menu sous la forme p••••6, mais se colle en entier. Sous Windows, si le gestionnaire demande de l'exclure, il n'est pas enregistré du tout." },
          ],
        },
        {
          title: "Coller",
          items: [
            { title: "Raccourci global", body: "⌘⇧V sur Mac et Ctrl+Maj+V sous Windows ouvrent le menu depuis n'importe quelle app, ou choisissez votre propre combinaison. Parcourez les éléments avec les flèches ; après le dernier, on revient au premier." },
            { title: "Collage automatique", body: "Choisissez un élément et Klipski le colle dans l'app active. Le texte arrive toujours sans mise en forme." },
            { title: "Snippets en dossiers", body: "Signatures, adresses et réponses toutes prêtes, dans des dossiers toujours présents dans le menu. Réordonnez dossiers et snippets dans les préférences." },
          ],
        },
        {
          title: "L'app",
          items: [
            { title: "Sauvegarde et import Clipy", body: "Enregistrez snippets et réglages dans un fichier JSON et restaurez-les, même sur l'autre système. Sur Mac, vous pouvez importer les dossiers exportés depuis Clipy." },
            { title: "En 10 langues", body: "Suit la langue du système, ou choisissez-en une dans les préférences." },
            { title: "Léger et natif", body: "Écrit en Swift sur Mac et en C# sous Windows. Il vit dans la barre des menus ou la zone de notification et peut s'ouvrir à la connexion." },
          ],
        },
      ],
    },
    install: {
      title: "Installation",
      specsTitle: "Configuration requise et valeurs par défaut",
      mac: {
        steps: [
          { title: "Téléchargez le DMG", body: "Ouvrez-le et copiez Klipski dans le dossier Applications." },
          { title: "Ouvrir quand même", body: "Klipski n'est pas notarisé par Apple, donc macOS bloque le premier lancement. Allez dans Réglages Système → Confidentialité et sécurité et choisissez Ouvrir quand même." },
          { title: "Autorisez l'accessibilité", body: "Le collage automatique et le défilement circulaire du menu en ont besoin : Réglages Système → Confidentialité et sécurité → Accessibilité. Sans elle, Klipski copie quand même dans le presse-papiers. Après une mise à jour, il peut falloir l'autoriser de nouveau." },
        ],
        specs: [
          { label: "Système", value: "macOS 14 Sonoma ou ultérieur" },
          { label: "Processeur", value: "Apple silicon" },
          { label: "Raccourci", value: "⌘⇧V" },
          { label: "Historique", value: "50 textes, 10 images" },
          { label: "Licence", value: "MIT" },
        ],
      },
      win: {
        steps: [
          { title: "Téléchargez le zip", body: "Extrayez Klipski.exe dans le dossier de votre choix et lancez-le. Il nécessite .NET 8 Desktop Runtime : s'il manque, Windows le propose au premier lancement." },
          { title: "Exécuter quand même", body: "L'exe n'est pas signé, donc SmartScreen peut afficher « Windows a protégé votre ordinateur » : cliquez sur Informations complémentaires, puis sur Exécuter quand même." },
          { title: "Ouvrez le menu", body: "Klipski reste dans la zone de notification : ouvrez le menu avec Ctrl+Maj+V ou d'un clic sur l'icône. Dans Chrome, Edge et VS Code, cette combinaison colle en texte brut ; si vous en avez besoin, choisissez-en une autre dans Personnaliser…" },
          { title: "Utilisez Win+V (facultatif)", body: "Windows réserve Win+V à son propre historique du presse-papiers. Pour l'attribuer à Klipski, exécutez ces commandes dans PowerShell (pas besoin de droits administrateur), puis appuyez sur Win+V dans Personnaliser… Le redémarrage de l'Explorateur ferme les fenêtres de dossiers ouvertes.", code: winV("Libérer Win+V", "Pour revenir à l'historique du presse-papiers de Windows") },
        ],
        specs: [
          { label: "Système", value: "Windows 10 ou 11 64 bits" },
          { label: "Runtime", value: ".NET 8 Desktop Runtime", href: "https://dotnet.microsoft.com/download/dotnet/8.0" },
          { label: "Raccourci", value: "Ctrl+Maj+V" },
          { label: "Historique", value: "50 textes, 10 images" },
          { label: "Licence", value: "MIT" },
        ],
      },
    },
    footer: { meta: "Version {version} pour macOS et Windows. Open source, licence MIT.", privacy: "Ce site utilise Hydran, un outil d'analyse sans cookies, pour compter les visites et les erreurs. Il n'enregistre pas votre adresse IP : il conserve seulement un identifiant anonyme dans votre navigateur (localStorage)." },
  },
  de: {
    nav: { features: "Funktionen", install: "Installation" },
    hero: {
      tagline: "Der Zwischenablage-Manager, der deinem Computer gefehlt hat",
      lede: "Klipski ist ein leichter, nativer Zwischenablage-Manager: Verlauf von Texten und Bildern, Snippets in Ordnern, globaler Hotkey und automatisches Einfügen. Kostenlos und Open Source für macOS und Windows.",
      downloadFor: "Für {os} herunterladen",
      note: "Kostenlos und Open Source. macOS 14 oder neuer mit Apple Silicon, Windows 10 oder 11 (64 Bit).",
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
            { title: "Texte und Bilder", body: "Behält die letzten 50 Texte und 10 Bilder ohne Duplikate und zeigt, wann du sie kopiert hast. Die Limits änderst du in den Einstellungen; deine Daten bleiben auf deinem Computer." },
            { title: "Suche und Vorschau", body: "Das Feld oben in der Textliste filtert beim Tippen. Fahre über ein Bild oder wähle es mit den Pfeiltasten, um es vergrößert zu sehen." },
            { title: "Verdeckte Passwörter", body: "Was aus einem Passwortmanager kommt, erscheint im Menü als p••••6, wird aber vollständig eingefügt. Unter Windows wird es gar nicht gespeichert, wenn der Passwortmanager das verlangt." },
          ],
        },
        {
          title: "Einfügen",
          items: [
            { title: "Globales Tastenkürzel", body: "⌘⇧V auf dem Mac und Strg+Umschalt+V unter Windows öffnen das Menü aus jeder App, oder wähle deine eigene Kombination. Mit den Pfeiltasten gehst du durch die Einträge; nach dem letzten geht es beim ersten weiter." },
            { title: "Automatisches Einfügen", body: "Wähle einen Eintrag und Klipski fügt ihn in die aktive App ein. Text kommt immer ohne Formatierung an." },
            { title: "Snippets in Ordnern", body: "Signaturen, Adressen und Standardantworten in Ordnern, die immer im Menü stehen. Ordner und Snippets sortierst du in den Einstellungen." },
          ],
        },
        {
          title: "Die App",
          items: [
            { title: "Backup und Clipy-Import", body: "Sichere Snippets und Einstellungen in einer JSON-Datei und stelle sie wieder her, auch auf dem anderen System. Auf dem Mac importierst du die aus Clipy exportierten Ordner." },
            { title: "In 10 Sprachen", body: "Folgt der Systemsprache, oder du wählst eine in den Einstellungen." },
            { title: "Leicht und nativ", body: "In Swift auf dem Mac und in C# unter Windows geschrieben. Lebt in der Menüleiste bzw. im Infobereich und kann bei der Anmeldung starten." },
          ],
        },
      ],
    },
    install: {
      title: "Installation",
      specsTitle: "Voraussetzungen und Standardwerte",
      mac: {
        steps: [
          { title: "DMG herunterladen", body: "Öffne es und kopiere Klipski in den Ordner Programme." },
          { title: "Trotzdem öffnen", body: "Klipski ist nicht von Apple notarisiert, deshalb blockiert macOS den ersten Start. Öffne Systemeinstellungen → Datenschutz & Sicherheit und wähle Trotzdem öffnen." },
          { title: "Bedienungshilfen erlauben", body: "Automatisches Einfügen und das Durchlaufen des Menüs brauchen diese Berechtigung: Systemeinstellungen → Datenschutz & Sicherheit → Bedienungshilfen. Ohne sie kopiert Klipski trotzdem in die Zwischenablage. Nach einem Update musst du sie eventuell erneut erteilen." },
        ],
        specs: [
          { label: "System", value: "macOS 14 Sonoma oder neuer" },
          { label: "Prozessor", value: "Apple Silicon" },
          { label: "Tastenkürzel", value: "⌘⇧V" },
          { label: "Verlauf", value: "50 Texte, 10 Bilder" },
          { label: "Lizenz", value: "MIT" },
        ],
      },
      win: {
        steps: [
          { title: "ZIP herunterladen", body: "Entpacke Klipski.exe in einen beliebigen Ordner und starte es. Benötigt wird die .NET 8 Desktop Runtime: Fehlt sie, bietet Windows sie beim ersten Start an." },
          { title: "Trotzdem ausführen", body: "Die exe ist nicht signiert, daher kann SmartScreen „Der Computer wurde durch Windows geschützt“ anzeigen: Klicke auf Weitere Informationen und dann auf Trotzdem ausführen." },
          { title: "Menü öffnen", body: "Klipski bleibt im Infobereich: Öffne das Menü mit Strg+Umschalt+V oder per Klick auf das Symbol. In Chrome, Edge und VS Code fügt diese Kombination als reinen Text ein; wenn du sie brauchst, wähle unter Anpassen… eine andere." },
          { title: "Win+V verwenden (optional)", body: "Windows reserviert Win+V für den eigenen Zwischenablageverlauf. Um es Klipski zuzuweisen, führe diese Befehle in PowerShell aus (keine Administratorrechte nötig) und drücke dann unter Anpassen… Win+V. Der Neustart des Explorers schließt geöffnete Ordnerfenster.", code: winV("Win+V freigeben", "Zurück zum Zwischenablageverlauf von Windows") },
        ],
        specs: [
          { label: "System", value: "Windows 10 oder 11 (64 Bit)" },
          { label: "Laufzeit", value: ".NET 8 Desktop Runtime", href: "https://dotnet.microsoft.com/download/dotnet/8.0" },
          { label: "Tastenkürzel", value: "Strg+Umschalt+V" },
          { label: "Verlauf", value: "50 Texte, 10 Bilder" },
          { label: "Lizenz", value: "MIT" },
        ],
      },
    },
    footer: { meta: "Version {version} für macOS und Windows. Open Source, MIT-Lizenz.", privacy: "Diese Website nutzt Hydran, ein Analysetool ohne Cookies, um Besuche und Fehler zu zählen. Deine IP-Adresse wird nicht gespeichert: Im Browser liegt nur eine anonyme Kennung (localStorage)." },
  },
  pt: {
    nav: { features: "Funções", install: "Instalação" },
    hero: {
      tagline: "O gerenciador de área de transferência que faltava no seu computador",
      lede: "O Klipski é um gerenciador de área de transferência leve e nativo: histórico de textos e imagens, snippets em pastas, atalho global e colagem automática. Grátis e de código aberto para macOS e Windows.",
      downloadFor: "Baixar para {os}",
      note: "Grátis e de código aberto. macOS 14 ou posterior com Apple silicon, Windows 10 ou 11 de 64 bits.",
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
            { title: "Textos e imagens", body: "Guarda os últimos 50 textos e 10 imagens, sem duplicados, e mostra há quanto tempo você copiou cada um. Mude os limites nas preferências; seus dados ficam no seu computador." },
            { title: "Busca e pré-visualização", body: "O campo no topo da lista de textos filtra enquanto você digita. Passe sobre uma imagem, ou chegue a ela com as setas, para vê-la ampliada." },
            { title: "Senhas ocultas", body: "O que vem de um gerenciador de senhas aparece no menu como p••••6, mas é colado por inteiro. No Windows, se o gerenciador pedir para excluí-lo, ele nem é salvo." },
          ],
        },
        {
          title: "Colar",
          items: [
            { title: "Atalho global", body: "⌘⇧V no Mac e Ctrl+Shift+V no Windows abrem o menu em qualquer app, ou escolha sua própria combinação. Percorra os itens com as setas; depois do último, você volta ao primeiro." },
            { title: "Colagem automática", body: "Escolha um item e o Klipski cola no app ativo. O texto chega sempre sem formatação." },
            { title: "Snippets em pastas", body: "Assinaturas, endereços e respostas prontas, em pastas sempre visíveis no menu. Reordene pastas e snippets nas preferências." },
          ],
        },
        {
          title: "O app",
          items: [
            { title: "Backup e importação do Clipy", body: "Salve snippets e configurações em um arquivo JSON e restaure, inclusive no outro sistema. No Mac, você pode importar as pastas exportadas do Clipy." },
            { title: "Em 10 idiomas", body: "Segue o idioma do sistema, ou escolha um nas preferências." },
            { title: "Leve e nativo", body: "Escrito em Swift no Mac e em C# no Windows. Vive na barra de menus ou na área de notificação e pode abrir ao iniciar sessão." },
          ],
        },
      ],
    },
    install: {
      title: "Instalação",
      specsTitle: "Requisitos e padrões",
      mac: {
        steps: [
          { title: "Baixe o DMG", body: "Abra e copie o Klipski para a pasta Aplicativos." },
          { title: "Abrir mesmo assim", body: "O Klipski não é notarizado pela Apple, então o macOS bloqueia a primeira abertura. Vá em Ajustes do Sistema → Privacidade e Segurança e escolha Abrir mesmo assim." },
          { title: "Permita a acessibilidade", body: "A colagem automática e a navegação circular do menu precisam dela: Ajustes do Sistema → Privacidade e Segurança → Acessibilidade. Sem ela, o Klipski continua copiando para a área de transferência. Depois de uma atualização, pode ser preciso permitir de novo." },
        ],
        specs: [
          { label: "Sistema", value: "macOS 14 Sonoma ou posterior" },
          { label: "Processador", value: "Apple silicon" },
          { label: "Atalho", value: "⌘⇧V" },
          { label: "Histórico", value: "50 textos, 10 imagens" },
          { label: "Licença", value: "MIT" },
        ],
      },
      win: {
        steps: [
          { title: "Baixe o zip", body: "Extraia o Klipski.exe em qualquer pasta e abra. É preciso o .NET 8 Desktop Runtime: se faltar, o Windows oferece na primeira abertura." },
          { title: "Executar assim mesmo", body: "O exe não é assinado, então o SmartScreen pode mostrar «O Windows protegeu o computador»: clique em Mais informações e depois em Executar assim mesmo." },
          { title: "Abra o menu", body: "O Klipski fica na área de notificação: abra o menu com Ctrl+Shift+V ou clicando no ícone. No Chrome, Edge e VS Code essa combinação cola como texto simples; se precisar dela, escolha outra em Personalizar…" },
          { title: "Use Win+V (opcional)", body: "O Windows reserva Win+V para o próprio histórico da área de transferência. Para atribuí-lo ao Klipski, execute estes comandos no PowerShell (não são precisas permissões de administrador) e depois prima Win+V em Personalizar… Reiniciar o Explorador fecha as janelas de pastas abertas.", code: winV("Libertar Win+V", "Para voltar ao histórico da área de transferência do Windows") },
        ],
        specs: [
          { label: "Sistema", value: "Windows 10 ou 11 de 64 bits" },
          { label: "Runtime", value: ".NET 8 Desktop Runtime", href: "https://dotnet.microsoft.com/download/dotnet/8.0" },
          { label: "Atalho", value: "Ctrl+Shift+V" },
          { label: "Histórico", value: "50 textos, 10 imagens" },
          { label: "Licença", value: "MIT" },
        ],
      },
    },
    footer: { meta: "Versão {version} para macOS e Windows. Código aberto, licença MIT.", privacy: "Este site usa o Hydran, uma análise sem cookies, para contar visitas e erros. Não guarda o seu endereço IP: guarda apenas um identificador anónimo no navegador (localStorage)." },
  },
  ru: {
    nav: { features: "Возможности", install: "Установка" },
    hero: {
      tagline: "Менеджер буфера обмена, которого не хватало вашему компьютеру",
      lede: "Klipski - это лёгкий нативный менеджер буфера обмена: история текстов и изображений, сниппеты по папкам, глобальная горячая клавиша и автоматическая вставка. Бесплатно и с открытым кодом для macOS и Windows.",
      downloadFor: "Скачать для {os}",
      note: "Бесплатно, с открытым кодом. macOS 14 или новее на Apple silicon, 64-битная Windows 10 или 11.",
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
            { title: "Тексты и изображения", body: "Хранит последние 50 текстов и 10 изображений без дублей и показывает, как давно вы их скопировали. Лимиты меняются в настройках, данные остаются на вашем компьютере." },
            { title: "Поиск и просмотр", body: "Поле вверху списка текстов фильтрует по мере ввода. Наведите на изображение или выберите его стрелками, чтобы увидеть его крупно." },
            { title: "Скрытые пароли", body: "То, что скопировано из менеджера паролей, показывается в меню как p••••6, но вставляется целиком. В Windows, если менеджер паролей просит исключить запись, она вообще не сохраняется." },
          ],
        },
        {
          title: "Вставка",
          items: [
            { title: "Глобальное сочетание клавиш", body: "⌘⇧V на Mac и Ctrl+Shift+V в Windows открывают меню из любого приложения, или задайте своё сочетание. Листайте пункты стрелками: после последнего снова идёт первый." },
            { title: "Автоматическая вставка", body: "Выберите элемент, и Klipski вставит его в активное приложение. Текст всегда вставляется без форматирования." },
            { title: "Сниппеты по папкам", body: "Подписи, адреса и готовые ответы в папках, которые всегда есть в меню. Порядок папок и сниппетов меняется в настройках." },
          ],
        },
        {
          title: "Приложение",
          items: [
            { title: "Резервная копия и импорт из Clipy", body: "Сохраняйте сниппеты и настройки в файл JSON и восстанавливайте их, в том числе на другой системе. На Mac можно импортировать папки, экспортированные из Clipy." },
            { title: "На 10 языках", body: "Использует язык системы, или выберите язык в настройках." },
            { title: "Лёгкий и нативный", body: "Написан на Swift для Mac и на C# для Windows. Живёт в строке меню или в области уведомлений и может запускаться при входе." },
          ],
        },
      ],
    },
    install: {
      title: "Установка",
      specsTitle: "Требования и значения по умолчанию",
      mac: {
        steps: [
          { title: "Скачайте DMG", body: "Откройте его и скопируйте Klipski в папку «Программы»." },
          { title: "Открыть всё равно", body: "Klipski не нотариально заверен Apple, поэтому macOS блокирует первый запуск. Откройте Системные настройки → Конфиденциальность и безопасность и выберите «Открыть всё равно»." },
          { title: "Разрешите универсальный доступ", body: "Он нужен для автоматической вставки и циклической навигации по меню: Системные настройки → Конфиденциальность и безопасность → Универсальный доступ. Без него Klipski всё равно копирует в буфер обмена. После обновления разрешение может понадобиться выдать снова." },
        ],
        specs: [
          { label: "Система", value: "macOS 14 Sonoma или новее" },
          { label: "Процессор", value: "Apple silicon" },
          { label: "Сочетание клавиш", value: "⌘⇧V" },
          { label: "История", value: "50 текстов, 10 изображений" },
          { label: "Лицензия", value: "MIT" },
        ],
      },
      win: {
        steps: [
          { title: "Скачайте zip", body: "Распакуйте Klipski.exe в любую папку и запустите. Нужна среда .NET 8 Desktop Runtime: если её нет, Windows предложит установить её при первом запуске." },
          { title: "Выполнить в любом случае", body: "Exe не подписан, поэтому SmartScreen может показать «Система Windows защитила ваш компьютер»: нажмите «Подробнее», затем «Выполнить в любом случае»." },
          { title: "Откройте меню", body: "Klipski живёт в области уведомлений: откройте меню сочетанием Ctrl+Shift+V или щелчком по значку. В Chrome, Edge и VS Code это сочетание вставляет текст без форматирования; если оно вам нужно, выберите другое в «Настроить…»." },
          { title: "Используйте Win+V (необязательно)", body: "Windows резервирует Win+V для собственного журнала буфера обмена. Чтобы назначить это сочетание Klipski, выполните эти команды в PowerShell (права администратора не нужны), затем нажмите Win+V в разделе Настроить… Перезапуск Проводника закроет открытые окна папок.", code: winV("Освободить Win+V", "Вернуть журнал буфера обмена Windows") },
        ],
        specs: [
          { label: "Система", value: "64-битная Windows 10 или 11" },
          { label: "Среда выполнения", value: ".NET 8 Desktop Runtime", href: "https://dotnet.microsoft.com/download/dotnet/8.0" },
          { label: "Сочетание клавиш", value: "Ctrl+Shift+V" },
          { label: "История", value: "50 текстов, 10 изображений" },
          { label: "Лицензия", value: "MIT" },
        ],
      },
    },
    footer: { meta: "Версия {version} для macOS и Windows. Открытый код, лицензия MIT.", privacy: "Этот сайт использует Hydran, аналитику без cookie, чтобы считать посещения и ошибки. IP-адрес не сохраняется: в браузере хранится только анонимный идентификатор (localStorage)." },
  },
  ja: {
    nav: { features: "機能", install: "インストール" },
    hero: {
      tagline: "あなたのパソコンに足りなかったクリップボードマネージャー",
      lede: "Klipski は軽量でネイティブなクリップボードマネージャーです。テキストと画像の履歴、フォルダー別スニペット、グローバルホットキー、自動貼り付けに対応。macOS と Windows 向けに無料・オープンソースで提供。",
      downloadFor: "{os} 版をダウンロード",
      note: "無料・オープンソース。Apple シリコン搭載の macOS 14 以降、64 ビット版 Windows 10 / 11 に対応。",
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
            { title: "テキストと画像", body: "直近のテキスト50件と画像10件を重複なしで保存し、コピーしてからの経過時間を表示します。上限は環境設定で変更でき、データはパソコンの中に留まります。" },
            { title: "検索とプレビュー", body: "テキスト一覧の上部の検索欄で、入力しながら絞り込めます。画像にポインタを合わせるか矢印キーで選ぶと、拡大プレビューが表示されます。" },
            { title: "パスワードを伏せ字に", body: "パスワード管理アプリからコピーした内容はメニューに p••••6 のように表示され、ペーストすると全文が入ります。Windows では、パスワード管理アプリが除外を指定した内容は保存されません。" },
          ],
        },
        {
          title: "ペースト",
          items: [
            { title: "グローバルショートカット", body: "Mac では ⌘⇧V、Windows では Ctrl+Shift+V で、どのアプリからでもメニューを開けます。組み合わせは変更可能。矢印キーで項目を移動し、最後の次は最初に戻ります。" },
            { title: "自動ペースト", body: "項目を選ぶと、Klipski がアクティブなアプリにペーストします。テキストは常に書式なしで入ります。" },
            { title: "フォルダー別スニペット", body: "署名、住所、定型返信をフォルダーに整理し、いつでもメニューから使えます。フォルダーとスニペットは環境設定で並べ替えられます。" },
          ],
        },
        {
          title: "アプリ",
          items: [
            { title: "バックアップと Clipy からの読み込み", body: "スニペットと設定を JSON ファイルに保存し、もう一方のシステムでも復元できます。Mac では Clipy から書き出したフォルダーを読み込めます。" },
            { title: "10 言語に対応", body: "システムの言語に従うか、環境設定で言語を選べます。" },
            { title: "軽量＆ネイティブ", body: "Mac 版は Swift、Windows 版は C# で書かれています。メニューバーまたは通知領域に常駐し、ログイン時に起動できます。" },
          ],
        },
      ],
    },
    install: {
      title: "インストール",
      specsTitle: "動作環境とデフォルト設定",
      mac: {
        steps: [
          { title: "DMG をダウンロード", body: "開いて Klipski を「アプリケーション」フォルダーにコピーします。" },
          { title: "このまま開く", body: "Klipski は Apple の公証を受けていないため、初回起動は macOS にブロックされます。システム設定 → プライバシーとセキュリティ で「このまま開く」を選んでください。" },
          { title: "アクセシビリティを許可", body: "自動ペーストとメニューの循環移動に必要です。システム設定 → プライバシーとセキュリティ → アクセシビリティ。許可しなくても Klipski はクリップボードにコピーします。アップデート後は再度許可が必要な場合があります。" },
        ],
        specs: [
          { label: "システム", value: "macOS 14 Sonoma 以降" },
          { label: "プロセッサ", value: "Apple シリコン" },
          { label: "ショートカット", value: "⌘⇧V" },
          { label: "履歴", value: "テキスト50件、画像10件" },
          { label: "ライセンス", value: "MIT" },
        ],
      },
      win: {
        steps: [
          { title: "zip をダウンロード", body: "Klipski.exe を任意のフォルダーに展開して起動します。.NET 8 デスクトップ ランタイムが必要です。ない場合は初回起動時に Windows がインストールを案内します。" },
          { title: "実行", body: "exe は署名されていないため、SmartScreen が「Windows によって PC が保護されました」と表示することがあります。「詳細情報」をクリックしてから「実行」を選んでください。" },
          { title: "メニューを開く", body: "Klipski は通知領域に常駐します。Ctrl+Shift+V またはアイコンのクリックでメニューを開きます。Chrome、Edge、VS Code ではこの組み合わせが書式なし貼り付けに使われているので、必要ならカスタマイズ…で別の組み合わせを選んでください。" },
          { title: "Win+V を使う（任意）", body: "Windows は Win+V を独自のクリップボード履歴に割り当てています。Klipski で使うには、PowerShell で次のコマンドを実行し（管理者権限は不要）、カスタマイズ…で Win+V を押してください。エクスプローラーを再起動すると、開いているフォルダーのウィンドウは閉じます。", code: winV("Win+V を解放する", "Windows のクリップボード履歴に戻す") },
        ],
        specs: [
          { label: "システム", value: "64 ビット版 Windows 10 / 11" },
          { label: "ランタイム", value: ".NET 8 デスクトップ ランタイム", href: "https://dotnet.microsoft.com/download/dotnet/8.0" },
          { label: "ショートカット", value: "Ctrl+Shift+V" },
          { label: "履歴", value: "テキスト50件、画像10件" },
          { label: "ライセンス", value: "MIT" },
        ],
      },
    },
    footer: { meta: "macOS・Windows 版 バージョン {version}。オープンソース（MIT ライセンス）。", privacy: "このサイトは、訪問数とエラーを数えるために Cookie を使わない解析ツール Hydran を使っています。IP アドレスは保存せず、ブラウザ (localStorage) に匿名の ID だけを保持します。" },
  },
  "zh-Hans": {
    nav: { features: "功能", install: "安装" },
    hero: {
      tagline: "你的电脑一直缺少的剪贴板管理器",
      lede: "Klipski 是一款轻量的原生剪贴板管理器：文本与图片历史、文件夹代码片段、全局快捷键和自动粘贴。面向 macOS 和 Windows，免费且开源。",
      downloadFor: "下载 {os} 版",
      note: "免费开源。支持搭载 Apple 芯片的 macOS 14 或更高版本，以及 64 位 Windows 10 和 11。",
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
            { title: "文本与图片", body: "保留最近 50 条文本和 10 张图片，自动去重，并显示每项复制于多久之前。上限可在偏好设置中修改，数据只保存在你的电脑上。" },
            { title: "搜索与预览", body: "文本列表顶部的搜索框会随输入即时筛选。将指针移到图片上或用方向键选中，即可查看放大预览。" },
            { title: "隐藏密码", body: "从密码管理器复制的内容在菜单中显示为 p••••6，但粘贴时是完整内容。在 Windows 上，如果密码管理器要求排除，则完全不会保存。" },
          ],
        },
        {
          title: "粘贴",
          items: [
            { title: "全局快捷键", body: "在 Mac 上用 ⌘⇧V、在 Windows 上用 Ctrl+Shift+V，可在任意应用中打开菜单，也可以设置自己的组合键。用方向键浏览条目，到最后一项后会回到第一项。" },
            { title: "自动粘贴", body: "选择一个条目，Klipski 就会把它粘贴到当前应用。文本始终以纯文本粘贴。" },
            { title: "文件夹代码片段", body: "签名、地址和常用回复按文件夹整理，始终显示在菜单中。可在偏好设置中调整文件夹和片段的顺序。" },
          ],
        },
        {
          title: "应用",
          items: [
            { title: "备份与从 Clipy 导入", body: "将片段和设置保存为 JSON 文件，可在另一个系统上恢复。在 Mac 上还能导入从 Clipy 导出的文件夹。" },
            { title: "支持 10 种语言", body: "跟随系统语言，也可以在偏好设置中选择。" },
            { title: "轻量且原生", body: "Mac 版使用 Swift，Windows 版使用 C# 编写。常驻菜单栏或通知区域，可在登录时启动。" },
          ],
        },
      ],
    },
    install: {
      title: "安装",
      specsTitle: "系统要求与默认设置",
      mac: {
        steps: [
          { title: "下载 DMG", body: "打开后将 Klipski 拷贝到“应用程序”文件夹。" },
          { title: "仍要打开", body: "Klipski 未经 Apple 公证，因此 macOS 会阻止首次启动。前往 系统设置 → 隐私与安全性，选择“仍要打开”。" },
          { title: "允许辅助功能", body: "自动粘贴和菜单循环导航需要此权限：系统设置 → 隐私与安全性 → 辅助功能。没有该权限时，Klipski 仍会复制到剪贴板。更新后可能需要重新授权。" },
        ],
        specs: [
          { label: "系统", value: "macOS 14 Sonoma 或更高版本" },
          { label: "处理器", value: "Apple 芯片" },
          { label: "快捷键", value: "⌘⇧V" },
          { label: "历史记录", value: "50 条文本，10 张图片" },
          { label: "许可证", value: "MIT" },
        ],
      },
      win: {
        steps: [
          { title: "下载 zip", body: "将 Klipski.exe 解压到任意文件夹并运行。需要 .NET 8 桌面运行时：如果缺少，Windows 会在首次启动时提示安装。" },
          { title: "仍要运行", body: "该 exe 未签名，SmartScreen 可能会显示“Windows 已保护你的电脑”：点击“更多信息”，再点击“仍要运行”。" },
          { title: "打开菜单", body: "Klipski 常驻通知区域：按 Ctrl+Shift+V 或点击图标即可打开菜单。在 Chrome、Edge 和 VS Code 中该组合键用于粘贴纯文本，如有需要，请在“自定义…”中另选组合键。" },
          { title: "使用 Win+V（可选）", body: "Windows 将 Win+V 保留给自带的剪贴板历史记录。要将其分配给 Klipski，请在 PowerShell 中运行以下命令（无需管理员权限），然后在“自定义…”中按下 Win+V。重启资源管理器会关闭已打开的文件夹窗口。", code: winV("释放 Win+V", "恢复 Windows 剪贴板历史记录") },
        ],
        specs: [
          { label: "系统", value: "64 位 Windows 10 或 11" },
          { label: "运行时", value: ".NET 8 桌面运行时", href: "https://dotnet.microsoft.com/download/dotnet/8.0" },
          { label: "快捷键", value: "Ctrl+Shift+V" },
          { label: "历史记录", value: "50 条文本，10 张图片" },
          { label: "许可证", value: "MIT" },
        ],
      },
    },
    footer: { meta: "macOS 和 Windows 版本 {version}。开源，MIT 许可证。", privacy: "本网站使用无需 Cookie 的分析工具 Hydran 来统计访问和错误。我们不保存你的 IP 地址，只在浏览器 (localStorage) 中保留一个匿名标识。" },
  },
  ar: {
    nav: { features: "المزايا", install: "التثبيت" },
    hero: {
      tagline: "مدير الحافظة الذي كان ينقص جهازك",
      lede: "كليبسكي مدير حافظة خفيف وأصلي: سجل للنصوص والصور، ومقتطفات ضمن مجلدات، واختصار عام، ولصق تلقائي. مجاني ومفتوح المصدر لنظامي macOS وWindows.",
      downloadFor: "تنزيل لنظام {os}",
      note: "مجاني ومفتوح المصدر. macOS 14 أو أحدث على Apple silicon، وWindows 10 أو 11 بنظام 64 بت.",
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
            { title: "النصوص والصور", body: "يحتفظ بآخر 50 نصًا و10 صور دون تكرار، ويعرض منذ متى نسخت كل عنصر. يمكنك تغيير الحدود من التفضيلات، وتبقى بياناتك على جهازك." },
            { title: "البحث والمعاينة", body: "حقل البحث أعلى قائمة النصوص يصفّي النتائج أثناء الكتابة. مرّر المؤشر فوق صورة، أو انتقل إليها بالأسهم، لتراها مكبّرة." },
            { title: "كلمات مرور مخفية", body: "ما تنسخه من مدير كلمات المرور يظهر في القائمة بشكل p••••6، لكنه يُلصق كاملًا. وعلى Windows، إذا طلب مدير كلمات المرور استبعاده فلن يُحفظ إطلاقًا." },
          ],
        },
        {
          title: "اللصق",
          items: [
            { title: "اختصار عام", body: "يفتح ⌘⇧V على Mac وCtrl+Shift+V على Windows القائمة من أي تطبيق، أو اختر تركيبتك الخاصة. تنقّل بين العناصر بالأسهم، وبعد العنصر الأخير تعود إلى الأول." },
            { title: "لصق تلقائي", body: "اختر عنصرًا وسيلصقه كليبسكي في التطبيق النشط. يصل النص دائمًا دون تنسيق." },
            { title: "مقتطفات ضمن مجلدات", body: "التواقيع والعناوين والردود الجاهزة في مجلدات تظهر دائمًا في القائمة. أعِد ترتيب المجلدات والمقتطفات من التفضيلات." },
          ],
        },
        {
          title: "التطبيق",
          items: [
            { title: "النسخ الاحتياطي والاستيراد من Clipy", body: "احفظ المقتطفات والإعدادات في ملف JSON واستعدها، حتى على النظام الآخر. على Mac يمكنك استيراد المجلدات المُصدَّرة من Clipy." },
            { title: "بـ 10 لغات", body: "يتبع لغة النظام، أو اختر لغة من التفضيلات." },
            { title: "خفيف وأصلي", body: "مكتوب بلغة Swift على Mac وبلغة C# على Windows. يعيش في شريط القوائم أو منطقة الإشعارات ويمكن تشغيله عند تسجيل الدخول." },
          ],
        },
      ],
    },
    install: {
      title: "التثبيت",
      specsTitle: "المتطلبات والإعدادات الافتراضية",
      mac: {
        steps: [
          { title: "نزّل ملف DMG", body: "افتحه وانسخ كليبسكي إلى مجلد التطبيقات." },
          { title: "افتح على أي حال", body: "كليبسكي غير موثّق من Apple، لذلك يمنع macOS التشغيل الأول. انتقل إلى إعدادات النظام ← الخصوصية والأمان واختر «افتح على أي حال»." },
          { title: "اسمح بتسهيلات الاستخدام", body: "يحتاجها اللصق التلقائي والتنقل الدائري في القائمة: إعدادات النظام ← الخصوصية والأمان ← تسهيلات الاستخدام. من دونها يواصل كليبسكي النسخ إلى الحافظة. بعد التحديث قد تحتاج إلى منح الإذن مجددًا." },
        ],
        specs: [
          { label: "النظام", value: "macOS 14 Sonoma أو أحدث" },
          { label: "المعالج", value: "Apple silicon" },
          { label: "الاختصار", value: "⌘⇧V" },
          { label: "السجل", value: "50 نصًا، 10 صور" },
          { label: "الترخيص", value: "MIT" },
        ],
      },
      win: {
        steps: [
          { title: "نزّل ملف zip", body: "استخرج Klipski.exe في أي مجلد وشغّله. يحتاج إلى .NET 8 Desktop Runtime، وإن لم يكن مثبتًا يعرضه Windows عند التشغيل الأول." },
          { title: "تشغيل على أي حال", body: "ملف exe غير موقّع، لذلك قد يعرض SmartScreen رسالة «قام Windows بحماية الكمبيوتر»: انقر «مزيد من المعلومات» ثم «تشغيل على أي حال»." },
          { title: "افتح القائمة", body: "يبقى كليبسكي في منطقة الإشعارات: افتح القائمة بـ Ctrl+Shift+V أو بالنقر على الأيقونة. في Chrome وEdge وVS Code تلصق هذه التركيبة نصًا عاديًا، فإن احتجت إليها فاختر تركيبة أخرى من «تخصيص…»." },
          { title: "استخدم Win+V (اختياري)", body: "يحجز Windows الاختصار Win+V لسجل الحافظة الخاص به. لتعيينه إلى كليبسكي شغّل هذه الأوامر في PowerShell (لا حاجة لصلاحيات المسؤول)، ثم اضغط Win+V في «تخصيص…». تؤدي إعادة تشغيل مستكشف الملفات إلى إغلاق نوافذ المجلدات المفتوحة.", code: winV("تحرير Win+V", "للعودة إلى سجل حافظة Windows") },
        ],
        specs: [
          { label: "النظام", value: "Windows 10 أو 11 بنظام 64 بت" },
          { label: "بيئة التشغيل", value: ".NET 8 Desktop Runtime", href: "https://dotnet.microsoft.com/download/dotnet/8.0" },
          { label: "الاختصار", value: "Ctrl+Shift+V" },
          { label: "السجل", value: "50 نصًا، 10 صور" },
          { label: "الترخيص", value: "MIT" },
        ],
      },
    },
    footer: { meta: "الإصدار {version} لنظامي macOS وWindows. مفتوح المصدر بترخيص MIT.", privacy: "يستخدم هذا الموقع Hydran، وهو أداة تحليلات بدون ملفات تعريف ارتباط، لإحصاء الزيارات والأخطاء. لا يحفظ عنوان IP الخاص بك، ويحتفظ فقط بمعرّف مجهول في المتصفح (localStorage)." },
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
