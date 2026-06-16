import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang =
  | "it" | "en" | "es" | "fr" | "de" | "pt" | "ru" | "ja" | "zh-Hans" | "ar";

export interface Dict {
  nav: { features: string; download: string };
  hero: {
    eyebrow: string;
    tagline: string;
    lede: string;
    downloadFor: string;
    download: string;
    otherPlatforms: string;
    detected: string;
    choose: string;
  };
  mockup: { caption: string; text: string; images: string };
  features: { title: string; items: { title: string; body: string }[] };
  download: { title: string; sub: string; recommended: string; button: string };
  requirements: { macos: string; windows: string; linux: string };
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
    nav: { features: "Funzioni", download: "Download" },
    hero: {
      eyebrow: "Gratis · Open source · Nativo",
      tagline: "Il gestore di appunti che mancava al tuo computer",
      lede: "Klipski è un clipboard manager leggero e nativo: cronologia di testi e immagini, snippet a cartelle, hotkey globale e incolla automatico. Gratis e open source per macOS, Windows e Linux.",
      downloadFor: "Scarica per {os}",
      download: "Scarica Klipski",
      otherPlatforms: "Altre piattaforme",
      detected: "Abbiamo rilevato {os}. Non è il tuo sistema?",
      choose: "Scegli un'altra versione",
    },
    mockup: { caption: "Apri la cronologia ovunque, incolla con un click.", text: "Testi", images: "Immagini" },
    features: {
      title: "Tutto quello che ti serve per copiare e incollare",
      items: [
        { title: "Cronologia testi e immagini", body: "Tiene traccia di tutto ciò che copi, con deduplica e limiti separati e configurabili. I tuoi dati restano sul tuo computer." },
        { title: "Snippet a cartelle", body: "Organizza testi fissi - mail, firme, risposte rapide - in cartelle sempre a portata di click dal menu." },
        { title: "Hotkey globale", body: "Richiama la cronologia da qualsiasi app con una scorciatoia personalizzabile e incolla con un solo click." },
        { title: "Incolla automatico", body: "Seleziona un elemento e Klipski lo incolla per te nell'app attiva, simulando la combinazione di tasti." },
        { title: "Import da Clipy", body: "Migri da Clipy? Importa le tue cartelle di snippet da un semplice file XML esportato." },
        { title: "Leggero e nativo", body: "Vive nella barra di stato, senza icona nel Dock e senza appesantire il sistema. Avvio automatico al login." },
      ],
    },
    download: { title: "Scarica Klipski", sub: "Gratis e open source. Scegli la versione per il tuo sistema operativo.", recommended: "Consigliato per te", button: "Scarica" },
    requirements: { macos: "macOS 14 (Sonoma) o superiore", windows: "Windows 10 / 11 (64-bit)", linux: "AppImage · distribuzioni glibc recenti" },
    footer: { meta: "Open source · Versione {version} · macOS · Windows · Linux" },
  },
  en: {
    nav: { features: "Features", download: "Download" },
    hero: {
      eyebrow: "Free · Open source · Native",
      tagline: "The clipboard manager your computer was missing",
      lede: "Klipski is a lightweight, native clipboard manager: history of text and images, folder snippets, a global hotkey and auto-paste. Free and open source for macOS, Windows and Linux.",
      downloadFor: "Download for {os}",
      download: "Download Klipski",
      otherPlatforms: "Other platforms",
      detected: "We detected {os}. Not your system?",
      choose: "Choose another version",
    },
    mockup: { caption: "Open your history anywhere, paste with one click.", text: "Text", images: "Images" },
    features: {
      title: "Everything you need to copy and paste",
      items: [
        { title: "Text & image history", body: "Tracks everything you copy, with de-duplication and separate, configurable limits. Your data stays on your computer." },
        { title: "Folder snippets", body: "Organize fixed text - emails, signatures, quick replies - into folders, always one click away from the menu." },
        { title: "Global hotkey", body: "Bring up your history from any app with a customizable shortcut and paste with a single click." },
        { title: "Auto-paste", body: "Pick an item and Klipski pastes it into the active app for you, simulating the keystroke." },
        { title: "Import from Clipy", body: "Migrating from Clipy? Import your snippet folders from a simple exported XML file." },
        { title: "Lightweight & native", body: "Lives in the status bar, no Dock icon, easy on your system. Launches at login." },
      ],
    },
    download: { title: "Download Klipski", sub: "Free and open source. Pick the version for your operating system.", recommended: "Recommended for you", button: "Download" },
    requirements: { macos: "macOS 14 (Sonoma) or later", windows: "Windows 10 / 11 (64-bit)", linux: "AppImage · recent glibc distributions" },
    footer: { meta: "Open source · Version {version} · macOS · Windows · Linux" },
  },
  es: {
    nav: { features: "Funciones", download: "Descargar" },
    hero: {
      eyebrow: "Gratis · Código abierto · Nativo",
      tagline: "El gestor de portapapeles que le faltaba a tu ordenador",
      lede: "Klipski es un gestor de portapapeles ligero y nativo: historial de textos e imágenes, snippets en carpetas, atajo global y pegado automático. Gratis y de código abierto para macOS, Windows y Linux.",
      downloadFor: "Descargar para {os}",
      download: "Descargar Klipski",
      otherPlatforms: "Otras plataformas",
      detected: "Hemos detectado {os}. ¿No es tu sistema?",
      choose: "Elige otra versión",
    },
    mockup: { caption: "Abre el historial en cualquier sitio y pega con un clic.", text: "Textos", images: "Imágenes" },
    features: {
      title: "Todo lo que necesitas para copiar y pegar",
      items: [
        { title: "Historial de textos e imágenes", body: "Registra todo lo que copias, con deduplicación y límites separados y configurables. Tus datos se quedan en tu ordenador." },
        { title: "Snippets en carpetas", body: "Organiza textos fijos - correos, firmas, respuestas rápidas - en carpetas siempre a un clic desde el menú." },
        { title: "Atajo global", body: "Abre el historial desde cualquier app con un atajo personalizable y pega con un solo clic." },
        { title: "Pegado automático", body: "Elige un elemento y Klipski lo pega por ti en la app activa, simulando la combinación de teclas." },
        { title: "Importar desde Clipy", body: "¿Vienes de Clipy? Importa tus carpetas de snippets desde un sencillo archivo XML exportado." },
        { title: "Ligero y nativo", body: "Vive en la barra de estado, sin icono en el Dock y sin sobrecargar el sistema. Se inicia al arrancar sesión." },
      ],
    },
    download: { title: "Descargar Klipski", sub: "Gratis y de código abierto. Elige la versión para tu sistema operativo.", recommended: "Recomendado para ti", button: "Descargar" },
    requirements: { macos: "macOS 14 (Sonoma) o posterior", windows: "Windows 10 / 11 (64 bits)", linux: "AppImage · distribuciones glibc recientes" },
    footer: { meta: "Código abierto · Versión {version} · macOS · Windows · Linux" },
  },
  fr: {
    nav: { features: "Fonctions", download: "Télécharger" },
    hero: {
      eyebrow: "Gratuit · Open source · Natif",
      tagline: "Le gestionnaire de presse-papiers qui manquait à votre ordinateur",
      lede: "Klipski est un gestionnaire de presse-papiers léger et natif : historique de textes et d'images, snippets en dossiers, raccourci global et collage automatique. Gratuit et open source pour macOS, Windows et Linux.",
      downloadFor: "Télécharger pour {os}",
      download: "Télécharger Klipski",
      otherPlatforms: "Autres plateformes",
      detected: "Nous avons détecté {os}. Ce n'est pas votre système ?",
      choose: "Choisir une autre version",
    },
    mockup: { caption: "Ouvrez l'historique partout, collez en un clic.", text: "Textes", images: "Images" },
    features: {
      title: "Tout ce qu'il faut pour copier et coller",
      items: [
        { title: "Historique de textes et d'images", body: "Garde une trace de tout ce que vous copiez, avec déduplication et limites séparées et configurables. Vos données restent sur votre ordinateur." },
        { title: "Snippets en dossiers", body: "Organisez vos textes fixes - e-mails, signatures, réponses rapides - dans des dossiers toujours à portée de clic depuis le menu." },
        { title: "Raccourci global", body: "Affichez l'historique depuis n'importe quelle app avec un raccourci personnalisable et collez en un seul clic." },
        { title: "Collage automatique", body: "Sélectionnez un élément et Klipski le colle pour vous dans l'app active, en simulant la combinaison de touches." },
        { title: "Import depuis Clipy", body: "Vous venez de Clipy ? Importez vos dossiers de snippets depuis un simple fichier XML exporté." },
        { title: "Léger et natif", body: "Vit dans la barre d'état, sans icône dans le Dock et sans alourdir le système. Démarrage automatique à l'ouverture de session." },
      ],
    },
    download: { title: "Télécharger Klipski", sub: "Gratuit et open source. Choisissez la version pour votre système d'exploitation.", recommended: "Recommandé pour vous", button: "Télécharger" },
    requirements: { macos: "macOS 14 (Sonoma) ou ultérieur", windows: "Windows 10 / 11 (64 bits)", linux: "AppImage · distributions glibc récentes" },
    footer: { meta: "Open source · Version {version} · macOS · Windows · Linux" },
  },
  de: {
    nav: { features: "Funktionen", download: "Download" },
    hero: {
      eyebrow: "Kostenlos · Open Source · Nativ",
      tagline: "Der Zwischenablage-Manager, der deinem Computer gefehlt hat",
      lede: "Klipski ist ein leichter, nativer Zwischenablage-Manager: Verlauf von Texten und Bildern, Snippets in Ordnern, globaler Hotkey und automatisches Einfügen. Kostenlos und Open Source für macOS, Windows und Linux.",
      downloadFor: "Für {os} herunterladen",
      download: "Klipski herunterladen",
      otherPlatforms: "Andere Plattformen",
      detected: "Wir haben {os} erkannt. Nicht dein System?",
      choose: "Andere Version wählen",
    },
    mockup: { caption: "Öffne den Verlauf überall, füge mit einem Klick ein.", text: "Texte", images: "Bilder" },
    features: {
      title: "Alles, was du zum Kopieren und Einfügen brauchst",
      items: [
        { title: "Text- und Bildverlauf", body: "Verfolgt alles, was du kopierst, mit Deduplizierung und getrennten, konfigurierbaren Limits. Deine Daten bleiben auf deinem Computer." },
        { title: "Snippets in Ordnern", body: "Organisiere feste Texte - E-Mails, Signaturen, Schnellantworten - in Ordnern, immer einen Klick entfernt im Menü." },
        { title: "Globaler Hotkey", body: "Rufe den Verlauf aus jeder App mit einem anpassbaren Tastenkürzel auf und füge mit einem Klick ein." },
        { title: "Automatisches Einfügen", body: "Wähle einen Eintrag und Klipski fügt ihn für dich in die aktive App ein, indem es die Tastenkombination simuliert." },
        { title: "Import aus Clipy", body: "Wechselst du von Clipy? Importiere deine Snippet-Ordner aus einer einfachen exportierten XML-Datei." },
        { title: "Leicht und nativ", body: "Lebt in der Statusleiste, ohne Dock-Symbol und ohne das System zu belasten. Startet beim Anmelden." },
      ],
    },
    download: { title: "Klipski herunterladen", sub: "Kostenlos und Open Source. Wähle die Version für dein Betriebssystem.", recommended: "Für dich empfohlen", button: "Herunterladen" },
    requirements: { macos: "macOS 14 (Sonoma) oder neuer", windows: "Windows 10 / 11 (64-Bit)", linux: "AppImage · aktuelle glibc-Distributionen" },
    footer: { meta: "Open Source · Version {version} · macOS · Windows · Linux" },
  },
  pt: {
    nav: { features: "Funções", download: "Baixar" },
    hero: {
      eyebrow: "Grátis · Código aberto · Nativo",
      tagline: "O gerenciador de área de transferência que faltava no seu computador",
      lede: "O Klipski é um gerenciador de área de transferência leve e nativo: histórico de textos e imagens, snippets em pastas, atalho global e colagem automática. Grátis e de código aberto para macOS, Windows e Linux.",
      downloadFor: "Baixar para {os}",
      download: "Baixar Klipski",
      otherPlatforms: "Outras plataformas",
      detected: "Detectamos {os}. Não é o seu sistema?",
      choose: "Escolher outra versão",
    },
    mockup: { caption: "Abra o histórico em qualquer lugar e cole com um clique.", text: "Textos", images: "Imagens" },
    features: {
      title: "Tudo o que você precisa para copiar e colar",
      items: [
        { title: "Histórico de textos e imagens", body: "Registra tudo o que você copia, com deduplicação e limites separados e configuráveis. Seus dados ficam no seu computador." },
        { title: "Snippets em pastas", body: "Organize textos fixos - e-mails, assinaturas, respostas rápidas - em pastas sempre a um clique no menu." },
        { title: "Atalho global", body: "Abra o histórico em qualquer app com um atalho personalizável e cole com um único clique." },
        { title: "Colagem automática", body: "Selecione um item e o Klipski cola por você no app ativo, simulando a combinação de teclas." },
        { title: "Importar do Clipy", body: "Vindo do Clipy? Importe suas pastas de snippets a partir de um simples arquivo XML exportado." },
        { title: "Leve e nativo", body: "Vive na barra de status, sem ícone no Dock e sem pesar no sistema. Inicia ao fazer login." },
      ],
    },
    download: { title: "Baixar Klipski", sub: "Grátis e de código aberto. Escolha a versão para o seu sistema operacional.", recommended: "Recomendado para você", button: "Baixar" },
    requirements: { macos: "macOS 14 (Sonoma) ou superior", windows: "Windows 10 / 11 (64 bits)", linux: "AppImage · distribuições glibc recentes" },
    footer: { meta: "Código aberto · Versão {version} · macOS · Windows · Linux" },
  },
  ru: {
    nav: { features: "Возможности", download: "Скачать" },
    hero: {
      eyebrow: "Бесплатно · Открытый код · Нативно",
      tagline: "Менеджер буфера обмена, которого не хватало вашему компьютеру",
      lede: "Klipski - это лёгкий нативный менеджер буфера обмена: история текстов и изображений, сниппеты по папкам, глобальная горячая клавиша и автоматическая вставка. Бесплатно и с открытым кодом для macOS, Windows и Linux.",
      downloadFor: "Скачать для {os}",
      download: "Скачать Klipski",
      otherPlatforms: "Другие платформы",
      detected: "Мы определили {os}. Это не ваша система?",
      choose: "Выбрать другую версию",
    },
    mockup: { caption: "Открывайте историю где угодно и вставляйте одним кликом.", text: "Тексты", images: "Изображения" },
    features: {
      title: "Всё, что нужно для копирования и вставки",
      items: [
        { title: "История текстов и изображений", body: "Отслеживает всё, что вы копируете, с дедупликацией и отдельными настраиваемыми лимитами. Ваши данные остаются на вашем компьютере." },
        { title: "Сниппеты по папкам", body: "Организуйте готовые тексты - письма, подписи, быстрые ответы - в папках, всегда в одном клике в меню." },
        { title: "Глобальная горячая клавиша", body: "Вызывайте историю из любого приложения настраиваемым сочетанием клавиш и вставляйте одним кликом." },
        { title: "Автоматическая вставка", body: "Выберите элемент, и Klipski вставит его за вас в активное приложение, имитируя нажатие клавиш." },
        { title: "Импорт из Clipy", body: "Переходите с Clipy? Импортируйте папки сниппетов из простого экспортированного XML-файла." },
        { title: "Лёгкий и нативный", body: "Живёт в строке состояния, без значка в Dock и не нагружает систему. Запускается при входе в систему." },
      ],
    },
    download: { title: "Скачать Klipski", sub: "Бесплатно и с открытым кодом. Выберите версию для вашей операционной системы.", recommended: "Рекомендуем вам", button: "Скачать" },
    requirements: { macos: "macOS 14 (Sonoma) или новее", windows: "Windows 10 / 11 (64-бит)", linux: "AppImage · современные дистрибутивы glibc" },
    footer: { meta: "Открытый код · Версия {version} · macOS · Windows · Linux" },
  },
  ja: {
    nav: { features: "機能", download: "ダウンロード" },
    hero: {
      eyebrow: "無料 · オープンソース · ネイティブ",
      tagline: "あなたのパソコンに足りなかったクリップボードマネージャー",
      lede: "Klipski は軽量でネイティブなクリップボードマネージャーです。テキストと画像の履歴、フォルダー別スニペット、グローバルホットキー、自動貼り付けに対応。macOS、Windows、Linux 向けに無料・オープンソースで提供。",
      downloadFor: "{os} 用をダウンロード",
      download: "Klipski をダウンロード",
      otherPlatforms: "他のプラットフォーム",
      detected: "{os} を検出しました。お使いのシステムと違いますか？",
      choose: "別のバージョンを選ぶ",
    },
    mockup: { caption: "どこでも履歴を開いて、ワンクリックで貼り付け。", text: "テキスト", images: "画像" },
    features: {
      title: "コピー＆ペーストに必要なすべて",
      items: [
        { title: "テキストと画像の履歴", body: "コピーした内容をすべて記録。重複排除と、別々に設定できる上限つき。データはあなたのパソコンの中に留まります。" },
        { title: "フォルダー別スニペット", body: "メール、署名、定型返信などの固定テキストをフォルダーに整理。メニューから常にワンクリックで。" },
        { title: "グローバルホットキー", body: "カスタマイズ可能なショートカットで、どのアプリからでも履歴を呼び出し、ワンクリックで貼り付け。" },
        { title: "自動貼り付け", body: "項目を選ぶと、キー操作をシミュレートしてアクティブなアプリに Klipski が貼り付けます。" },
        { title: "Clipy からインポート", body: "Clipy から移行ですか？エクスポートしたシンプルな XML ファイルからスニペットのフォルダーをインポートできます。" },
        { title: "軽量＆ネイティブ", body: "ステータスバーに常駐し、Dock アイコンなし、システムへの負荷も最小限。ログイン時に自動起動。" },
      ],
    },
    download: { title: "Klipski をダウンロード", sub: "無料・オープンソース。お使いの OS のバージョンを選んでください。", recommended: "あなたへのおすすめ", button: "ダウンロード" },
    requirements: { macos: "macOS 14 (Sonoma) 以降", windows: "Windows 10 / 11 (64ビット)", linux: "AppImage · 新しめの glibc ディストリビューション" },
    footer: { meta: "オープンソース · バージョン {version} · macOS · Windows · Linux" },
  },
  "zh-Hans": {
    nav: { features: "功能", download: "下载" },
    hero: {
      eyebrow: "免费 · 开源 · 原生",
      tagline: "你的电脑一直缺少的剪贴板管理器",
      lede: "Klipski 是一款轻量的原生剪贴板管理器：文本与图片历史、文件夹代码片段、全局快捷键和自动粘贴。面向 macOS、Windows 和 Linux，免费且开源。",
      downloadFor: "下载 {os} 版",
      download: "下载 Klipski",
      otherPlatforms: "其他平台",
      detected: "我们检测到 {os}。不是你的系统？",
      choose: "选择其他版本",
    },
    mockup: { caption: "随处打开历史记录，一键粘贴。", text: "文本", images: "图片" },
    features: {
      title: "复制粘贴所需的一切",
      items: [
        { title: "文本与图片历史", body: "记录你复制的一切，支持去重和可分别配置的上限。你的数据保留在自己的电脑上。" },
        { title: "文件夹代码片段", body: "把邮件、签名、快速回复等固定文本整理到文件夹中，在菜单里始终一键可达。" },
        { title: "全局快捷键", body: "用可自定义的快捷键在任意应用中呼出历史记录，并一键粘贴。" },
        { title: "自动粘贴", body: "选择一个条目，Klipski 会模拟按键，替你粘贴到当前应用中。" },
        { title: "从 Clipy 导入", body: "从 Clipy 迁移？从导出的简单 XML 文件导入你的代码片段文件夹。" },
        { title: "轻量且原生", body: "常驻状态栏，无 Dock 图标，不拖慢系统。登录时自动启动。" },
      ],
    },
    download: { title: "下载 Klipski", sub: "免费且开源。请选择适合你操作系统的版本。", recommended: "为你推荐", button: "下载" },
    requirements: { macos: "macOS 14 (Sonoma) 或更高版本", windows: "Windows 10 / 11（64 位）", linux: "AppImage · 较新的 glibc 发行版" },
    footer: { meta: "开源 · 版本 {version} · macOS · Windows · Linux" },
  },
  ar: {
    nav: { features: "المزايا", download: "تنزيل" },
    hero: {
      eyebrow: "مجاني · مفتوح المصدر · أصلي",
      tagline: "مدير الحافظة الذي كان ينقص جهازك",
      lede: "كليبسكي مدير حافظة خفيف وأصلي: سجل للنصوص والصور، ومقتطفات ضمن مجلدات، واختصار عام، ولصق تلقائي. مجاني ومفتوح المصدر لنظام macOS وWindows وLinux.",
      downloadFor: "تنزيل لـ {os}",
      download: "تنزيل كليبسكي",
      otherPlatforms: "منصات أخرى",
      detected: "اكتشفنا {os}. ليس نظامك؟",
      choose: "اختر إصدارًا آخر",
    },
    mockup: { caption: "افتح السجل في أي مكان، والصق بنقرة واحدة.", text: "نصوص", images: "صور" },
    features: {
      title: "كل ما تحتاجه للنسخ واللصق",
      items: [
        { title: "سجل النصوص والصور", body: "يتتبع كل ما تنسخه، مع إزالة التكرار وحدود منفصلة وقابلة للتخصيص. تبقى بياناتك على جهازك." },
        { title: "مقتطفات ضمن مجلدات", body: "نظّم النصوص الثابتة - الرسائل والتواقيع والردود السريعة - في مجلدات على بُعد نقرة دائمًا من القائمة." },
        { title: "اختصار عام", body: "استدعِ السجل من أي تطبيق باختصار قابل للتخصيص، والصق بنقرة واحدة." },
        { title: "لصق تلقائي", body: "اختر عنصرًا وسيلصقه كليبسكي نيابةً عنك في التطبيق النشط بمحاكاة ضغط المفاتيح." },
        { title: "الاستيراد من Clipy", body: "أتنتقل من Clipy؟ استورد مجلدات المقتطفات من ملف XML مُصدَّر بسيط." },
        { title: "خفيف وأصلي", body: "يعيش في شريط الحالة، دون أيقونة في الـ Dock ودون إثقال النظام. يبدأ عند تسجيل الدخول." },
      ],
    },
    download: { title: "تنزيل كليبسكي", sub: "مجاني ومفتوح المصدر. اختر الإصدار المناسب لنظام تشغيلك.", recommended: "موصى به لك", button: "تنزيل" },
    requirements: { macos: "macOS 14 (Sonoma) أو أحدث", windows: "Windows 10 / 11 (64 بت)", linux: "AppImage · توزيعات glibc الحديثة" },
    footer: { meta: "مفتوح المصدر · الإصدار {version} · macOS · Windows · Linux" },
  },
};

export function fmt(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

function detectLang(): Lang {
  const codes = LANGS.map((l) => l.code);
  const stored = localStorage.getItem("klipski-lang") as Lang | null;
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
    localStorage.setItem("klipski-lang", lang);
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
