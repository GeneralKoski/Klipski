use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

#[derive(Serialize, Deserialize, Clone)]
pub struct HistoryItem {
    pub id: String,
    pub kind: String, // "text" | "image"
    #[serde(default)]
    pub text: Option<String>,
    #[serde(default, rename = "imagePath")]
    pub image_path: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: u64,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Snippet {
    pub id: String,
    pub title: String,
    pub content: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct SnippetFolder {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub snippets: Vec<Snippet>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Settings {
    #[serde(rename = "textLimit")]
    pub text_limit: usize,
    #[serde(rename = "imageLimit")]
    pub image_limit: usize,
    pub hotkey: String,
    #[serde(rename = "autoPaste")]
    pub auto_paste: bool,
    #[serde(rename = "launchAtLogin")]
    pub launch_at_login: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Settings {
            text_limit: 50,
            image_limit: 10,
            hotkey: "CommandOrControl+Shift+V".into(),
            auto_paste: true,
            launch_at_login: false,
        }
    }
}

pub struct AppState {
    pub dir: PathBuf,
    pub history: Mutex<Vec<HistoryItem>>,
    pub snippets: Mutex<Vec<SnippetFolder>>,
    pub settings: Mutex<Settings>,
    // Hash dell'ultimo contenuto visto, per la deduplica del monitor.
    pub last_seen: Mutex<u64>,
}

impl AppState {
    pub fn load(dir: PathBuf) -> Self {
        let _ = fs::create_dir_all(dir.join("images"));
        let history = read_json(&dir.join("history.json")).unwrap_or_default();
        let snippets = read_json(&dir.join("snippets.json")).unwrap_or_default();
        let settings = read_json(&dir.join("settings.json")).unwrap_or_default();
        AppState {
            dir,
            history: Mutex::new(history),
            snippets: Mutex::new(snippets),
            settings: Mutex::new(settings),
            last_seen: Mutex::new(0),
        }
    }

    pub fn images_dir(&self) -> PathBuf {
        self.dir.join("images")
    }

    pub fn save_history(&self) {
        if let Ok(h) = self.history.lock() {
            write_json(&self.dir.join("history.json"), &*h);
        }
    }

    pub fn save_snippets(&self) {
        if let Ok(s) = self.snippets.lock() {
            write_json(&self.dir.join("snippets.json"), &*s);
        }
    }

    pub fn save_settings(&self) {
        if let Ok(s) = self.settings.lock() {
            write_json(&self.dir.join("settings.json"), &*s);
        }
    }
}

fn read_json<T: for<'de> Deserialize<'de>>(path: &Path) -> Option<T> {
    let data = fs::read_to_string(path).ok()?;
    serde_json::from_str(&data).ok()
}

fn write_json<T: Serialize>(path: &Path, value: &T) {
    if let Ok(json) = serde_json::to_string_pretty(value) {
        let _ = fs::write(path, json);
    }
}
