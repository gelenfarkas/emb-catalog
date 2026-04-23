import { APP_VERSION } from "./app-version.js";

export { APP_VERSION };

export function appendVersion(url, version = APP_VERSION) {
  if (!url || !version) return url;

  const [urlWithoutHash, hash = ""] = String(url).split("#", 2);
  const [path, query = ""] = urlWithoutHash.split("?", 2);
  const params = new URLSearchParams(query);
  params.set("v", version);
  const versionedUrl = `${path}?${params.toString()}`;

  return hash ? `${versionedUrl}#${hash}` : versionedUrl;
}

export function loadVersionedStylesheet(href) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = appendVersion(href);
  document.head.append(link);
  return link;
}

export function getLoadedStylesheetUrls() {
  return Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map((link) => link.href)
    .filter(Boolean);
}

export function logCacheDiagnostics({ page = "unknown", appScriptUrl = "", manifestUrl = "" } = {}) {
  console.info("[Cache] Diagnostics", {
    page,
    appVersion: APP_VERSION,
    cssUrls: getLoadedStylesheetUrls(),
    appScriptUrl,
    manifestUrl,
    faviconUrl: document.querySelector('link[rel="icon"]')?.href || "",
  });
}
