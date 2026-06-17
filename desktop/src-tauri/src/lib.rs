mod clipy;
mod paste;
mod store;

use arboard::{Clipboard, ImageData};
use base64::Engine;
use std::borrow::Cow;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use store::{AppState, HistoryItem, Settings, SnippetFolder};
use tauri::{AppHandle, Manager, State};
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};
use uuid::Uuid;

// ---------- utilità ----------

fn now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

fn fnv(bytes: &[u8]) -> u64 {
    let mut h: u64 = 1469598103934665603;
    for b in bytes {
        h ^= *b as u64;
        h = h.wrapping_mul(1099511628211);
    }
    h
}

fn sig_text(s: &str) -> u64 {
    fnv(format!("t:{s}").as_bytes())
}

fn sig_image(bytes: &[u8]) -> u64 {
    let mut buf = b"i:".to_vec();
    buf.extend_from_slice(bytes);
    fnv(&buf)
}

// ---------- gestione cronologia ----------

fn trim_history(items: &mut Vec<HistoryItem>, text_limit: usize, image_limit: usize) {
    let mut texts = 0usize;
    let mut images = 0usize;
    items.retain(|it| {
        if it.kind == "image" {
            images += 1;
            images <= image_limit
        } else {
            texts += 1;
            texts <= text_limit
        }
    });
}

fn record_text(app: &AppHandle, text: String) {
    let state = app.state::<AppState>();
    let (text_limit, image_limit) = {
        let s = state.settings.lock().unwrap();
        (s.text_limit, s.image_limit)
    };
    {
        let mut h = state.history.lock().unwrap();
        h.retain(|it| it.text.as_deref() != Some(text.as_str()));
        h.insert(
            0,
            HistoryItem {
                id: Uuid::new_v4().to_string(),
                kind: "text".into(),
                text: Some(text),
                image_path: None,
                created_at: now(),
            },
        );
        trim_history(&mut h, text_limit, image_limit);
    }
    state.save_history();
    let _ = tauri::Emitter::emit(app, "history-changed", ());
}

fn record_image(app: &AppHandle, width: usize, height: usize, rgba: Vec<u8>) {
    let state = app.state::<AppState>();
    let (text_limit, image_limit) = {
        let s = state.settings.lock().unwrap();
        (s.text_limit, s.image_limit)
    };
    let file = state.images_dir().join(format!("{}.png", Uuid::new_v4()));
    let buffer = match image::RgbaImage::from_raw(width as u32, height as u32, rgba) {
        Some(b) => b,
        None => return,
    };
    if buffer.save(&file).is_err() {
        return;
    }
    {
        let mut h = state.history.lock().unwrap();
        h.insert(
            0,
            HistoryItem {
                id: Uuid::new_v4().to_string(),
                kind: "image".into(),
                text: None,
                image_path: Some(file.to_string_lossy().to_string()),
                created_at: now(),
            },
        );
        trim_history(&mut h, text_limit, image_limit);
    }
    state.save_history();
    let _ = tauri::Emitter::emit(app, "history-changed", ());
}

// Thread che osserva gli appunti e registra le novità.
fn start_monitor(app: AppHandle) {
    std::thread::spawn(move || {
        let mut clipboard = match Clipboard::new() {
            Ok(c) => c,
            Err(_) => return,
        };
        loop {
            std::thread::sleep(Duration::from_millis(600));

            if let Ok(text) = clipboard.get_text() {
                if !text.trim().is_empty() {
                    let sig = sig_text(&text);
                    let changed = {
                        let state = app.state::<AppState>();
                        let mut last = state.last_seen.lock().unwrap();
                        if *last != sig {
                            *last = sig;
                            true
                        } else {
                            false
                        }
                    };
                    if changed {
                        record_text(&app, text);
                    }
                    continue;
                }
            }

            if let Ok(img) = clipboard.get_image() {
                let sig = sig_image(&img.bytes);
                let changed = {
                    let state = app.state::<AppState>();
                    let mut last = state.last_seen.lock().unwrap();
                    if *last != sig {
                        *last = sig;
                        true
                    } else {
                        false
                    }
                };
                if changed {
                    record_image(&app, img.width, img.height, img.bytes.into_owned());
                }
            }
        }
    });
}

// ---------- clipboard: scrittura ----------

fn set_clipboard_text(app: &AppHandle, text: &str) {
    if let Ok(mut c) = Clipboard::new() {
        let _ = c.set_text(text.to_string());
    }
    *app.state::<AppState>().last_seen.lock().unwrap() = sig_text(text);
}

fn set_clipboard_image(app: &AppHandle, path: &str) {
    let img = match image::open(path) {
        Ok(i) => i.to_rgba8(),
        Err(_) => return,
    };
    let (w, h) = (img.width() as usize, img.height() as usize);
    let raw = img.into_raw();
    *app.state::<AppState>().last_seen.lock().unwrap() = sig_image(&raw);
    if let Ok(mut c) = Clipboard::new() {
        let _ = c.set_image(ImageData {
            width: w,
            height: h,
            bytes: Cow::Owned(raw),
        });
    }
}

fn maybe_paste(app: &AppHandle) {
    let auto = app.state::<AppState>().settings.lock().unwrap().auto_paste;
    if !auto {
        return;
    }
    std::thread::spawn(|| {
        std::thread::sleep(Duration::from_millis(150));
        paste::paste();
    });
}

// ---------- finestre ----------

fn toggle_history(app: &AppHandle) {
    if let Some(win) = app.get_webview_window("history") {
        let visible = win.is_visible().unwrap_or(false);
        if visible {
            let _ = win.hide();
        } else {
            let _ = win.center();
            let _ = win.show();
            let _ = win.set_focus();
            let _ = tauri::Emitter::emit(app, "history-changed", ());
        }
    }
}

fn open_settings(app: &AppHandle) {
    if let Some(win) = app.get_webview_window("settings") {
        let _ = win.show();
        let _ = win.set_focus();
    }
}

fn register_hotkey(app: &AppHandle, accelerator: &str) -> Result<(), String> {
    let gs = app.global_shortcut();
    let _ = gs.unregister_all();
    let handle = app.clone();
    gs.on_shortcut(accelerator, move |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            toggle_history(&handle);
        }
    })
    .map_err(|e| e.to_string())
}

// ---------- comandi ----------

#[tauri::command]
fn get_history(state: State<'_, AppState>) -> Vec<HistoryItem> {
    state.history.lock().unwrap().clone()
}

#[tauri::command]
fn get_snippets(state: State<'_, AppState>) -> Vec<SnippetFolder> {
    state.snippets.lock().unwrap().clone()
}

#[tauri::command]
fn get_settings(state: State<'_, AppState>) -> Settings {
    state.settings.lock().unwrap().clone()
}

#[tauri::command]
fn save_settings(app: AppHandle, state: State<'_, AppState>, settings: Settings) -> Result<(), String> {
    let hotkey = settings.hotkey.clone();
    let launch = settings.launch_at_login;
    *state.settings.lock().unwrap() = settings;
    state.save_settings();

    register_hotkey(&app, &hotkey)?;

    let auto = app.autolaunch();
    if launch {
        let _ = auto.enable();
    } else {
        let _ = auto.disable();
    }
    Ok(())
}

#[tauri::command]
fn save_snippets(state: State<'_, AppState>, folders: Vec<SnippetFolder>) {
    *state.snippets.lock().unwrap() = folders;
    state.save_snippets();
}

#[tauri::command]
fn clear_history(state: State<'_, AppState>) {
    state.history.lock().unwrap().clear();
    state.save_history();
}

#[tauri::command]
fn delete_item(state: State<'_, AppState>, id: String) {
    state.history.lock().unwrap().retain(|it| it.id != id);
    state.save_history();
}

#[tauri::command]
fn apply_item(app: AppHandle, state: State<'_, AppState>, id: String) {
    let item = state.history.lock().unwrap().iter().find(|it| it.id == id).cloned();
    if let Some(item) = item {
        if let Some(win) = app.get_webview_window("history") {
            let _ = win.hide();
        }
        if item.kind == "image" {
            if let Some(p) = item.image_path {
                set_clipboard_image(&app, &p);
            }
        } else if let Some(t) = item.text {
            set_clipboard_text(&app, &t);
        }
        maybe_paste(&app);
    }
}

#[tauri::command]
fn apply_snippet(app: AppHandle, state: State<'_, AppState>, content: String) {
    let _ = state; // contenuto già passato dal frontend
    if let Some(win) = app.get_webview_window("history") {
        let _ = win.hide();
    }
    set_clipboard_text(&app, &content);
    record_text(&app, content);
    maybe_paste(&app);
}

#[tauri::command]
fn import_clipy(state: State<'_, AppState>, path: String) -> Result<usize, String> {
    let xml = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let mut folders = clipy::parse(&xml)?;
    let count = folders.len();
    state.snippets.lock().unwrap().append(&mut folders);
    state.save_snippets();
    Ok(count)
}

#[tauri::command]
fn image_data_url(path: String) -> Option<String> {
    let bytes = std::fs::read(&path).ok()?;
    let b64 = base64::engine::general_purpose::STANDARD.encode(bytes);
    Some(format!("data:image/png;base64,{b64}"))
}

#[tauri::command]
fn hide_history(app: AppHandle) {
    if let Some(win) = app.get_webview_window("history") {
        let _ = win.hide();
    }
}

#[tauri::command]
fn show_settings(app: AppHandle) {
    open_settings(&app);
}

// ---------- avvio ----------

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(|app| {
            let dir = app.path().app_data_dir()?;
            let state = AppState::load(dir);
            let hotkey = state.settings.lock().unwrap().hotkey.clone();
            app.manage(state);

            build_tray(app.handle())?;
            let _ = register_hotkey(app.handle(), &hotkey);
            start_monitor(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_history,
            get_snippets,
            get_settings,
            save_settings,
            save_snippets,
            clear_history,
            delete_item,
            apply_item,
            apply_snippet,
            import_clipy,
            image_data_url,
            hide_history,
            show_settings
        ])
        .run(tauri::generate_context!())
        .expect("errore nell'avvio di Klipski");
}

fn build_tray(app: &AppHandle) -> tauri::Result<()> {
    use tauri::menu::{Menu, MenuItem};
    use tauri::tray::TrayIconBuilder;

    let open = MenuItem::with_id(app, "open", "Apri Klipski", true, None::<&str>)?;
    let settings = MenuItem::with_id(app, "settings", "Personalizza…", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Esci", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open, &settings, &quit])?;

    let icon = app
        .default_window_icon()
        .cloned()
        .ok_or_else(|| tauri::Error::AssetNotFound("icon".into()))?;

    TrayIconBuilder::with_id("main")
        .icon(icon)
        .tooltip("Klipski")
        .menu(&menu)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "open" => toggle_history(app),
            "settings" => open_settings(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .build(app)?;
    Ok(())
}
