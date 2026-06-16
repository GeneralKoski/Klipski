import type { OSId } from "./config";

// Rileva il sistema operativo del visitatore. Usa la User-Agent Client Hints
// API quando disponibile (Chromium), con fallback sullo userAgent classico.
export function detectOS(): OSId | null {
  if (typeof navigator === "undefined") return null;

  const uaData = (navigator as unknown as {
    userAgentData?: { platform?: string };
  }).userAgentData;
  const platform = (uaData?.platform ?? navigator.platform ?? "").toLowerCase();
  const ua = navigator.userAgent.toLowerCase();

  const haystack = `${platform} ${ua}`;

  // iOS/Android non hanno un client desktop: trattali come "nessuno".
  if (/android|iphone|ipad|ipod/.test(haystack)) return null;

  if (/mac|darwin/.test(haystack)) return "macos";
  if (/win/.test(haystack)) return "windows";
  if (/linux|x11|ubuntu|fedora|debian/.test(haystack)) return "linux";

  return null;
}
