import { APP_VERSION } from "./app-version.js";

let cleanupPromise = null;

export async function runServiceWorkerCleanup(page = "unknown") {
  if (cleanupPromise) return cleanupPromise;

  cleanupPromise = (async () => {
    const summary = {
      page,
      appVersion: APP_VERSION,
      serviceWorkerSupported: "serviceWorker" in navigator,
      registrationsFound: 0,
      registrationsRemoved: 0,
      cacheCleanupAttempted: false,
      cachesDeleted: [],
    };

    if (!summary.serviceWorkerSupported) {
      console.info("[Cache] SW cleanup", summary);
      return summary;
    }

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      summary.registrationsFound = registrations.length;

      for (const registration of registrations) {
        try {
          const removed = await registration.unregister();
          if (removed) summary.registrationsRemoved += 1;
        } catch (error) {
          console.warn("[Cache] SW unregister hiba", error);
        }
      }
    } catch (error) {
      console.warn("[Cache] SW lista lekérése sikertelen", error);
    }

    if ("caches" in window) {
      summary.cacheCleanupAttempted = true;
      try {
        const cacheNames = await caches.keys();
        const deletableNames = cacheNames.filter((name) => /(emb|eastmall|catalog|workbox|precache|runtime)/i.test(name));

        for (const cacheName of deletableNames) {
          try {
            const deleted = await caches.delete(cacheName);
            if (deleted) summary.cachesDeleted.push(cacheName);
          } catch (error) {
            console.warn(`[Cache] Cache törlés sikertelen: ${cacheName}`, error);
          }
        }
      } catch (error) {
        console.warn("[Cache] Cache Storage lekérés sikertelen", error);
      }
    }

    console.info("[Cache] SW cleanup", summary);
    return summary;
  })();

  return cleanupPromise;
}
