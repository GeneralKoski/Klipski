import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HistoryView } from "./views/HistoryView.tsx";
import { SettingsView } from "./views/SettingsView.tsx";
import "./styles.css";

const view = new URLSearchParams(window.location.search).get("view");

createRoot(document.getElementById("root")!).render(
  <StrictMode>{view === "settings" ? <SettingsView /> : <HistoryView />}</StrictMode>
);
