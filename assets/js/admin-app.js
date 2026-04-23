import { APP_VERSION, appendVersion, logCacheDiagnostics } from "./cache-utils.js";

const [
  {
    createDebug,
    getFilterOptions,
    loadCatalogFromFiles,
    loadCatalogFromManifest,
    sortProducts,
    errorMessage,
  },
  { requireElements, showStatus, escapeHtml },
  { renderCategoryNav, renderDatasets, renderProducts },
] = await Promise.all([
  import(appendVersion("./catalog-core.js")),
  import(appendVersion("./dom-utils.js")),
  import(appendVersion("./render.js")),
]);

const REQUIRED = [
  "#status",
  "#loadManifestBtn",
  "#fileInput",
  "#directoryInput",
  "#debugPanel",
  "#debugContent",
  "#runDiagnosticsBtn",
  "#copyDebugBtn",
  "#datasetList",
  "#resultCount",
  "#datasetCount",
  "#duplicateCount",
  "#categoryNav",
  "#productGrid",
  "#emptyState",
  "#productCardTemplate",
];

let elements;
let catalog = {
  datasets: [],
  products: [],
  duplicateCount: 0,
  debug: createDebug("admin"),
};
let previewProducts = [];

init();

async function init() {
  try {
    elements = requireElements(REQUIRED);
  } catch (error) {
    return;
  }

  bindAdminActions();
  await loadManifest("admin");
}

function bindAdminActions() {
  elements.loadManifestBtn.addEventListener("click", () => loadManifest("admin-reload"));
  elements.runDiagnosticsBtn.addEventListener("click", () => loadManifest("diagnostics"));
  elements.fileInput.addEventListener("change", (event) => loadFiles(event.target.files, "manual-files"));
  elements.directoryInput.addEventListener("change", (event) => loadFiles(event.target.files, "manual-directory"));
  elements.copyDebugBtn.addEventListener("click", copyDebug);

  if (!("webkitdirectory" in HTMLInputElement.prototype)) {
    elements.directoryInput.closest("label").hidden = true;
  }
}

async function loadManifest(mode) {
  showStatus(elements.status, "Manifest és datasetek betöltése folyamatban...");
  console.groupCollapsed("[Admin catalog] Manifest betöltés");

  try {
    catalog = await loadCatalogFromManifest({
      debug: createDebug(mode),
    });
    renderAdmin();
    logCacheDiagnostics({
      page: "admin",
      appScriptUrl: import.meta.url,
      manifestUrl: catalog.debug?.manifest?.fetchUrl || appendVersion("data/manifest.json"),
    });
    showStatus(
      elements.status,
      `Betöltve: ${catalog.datasets.length} dataset, ${catalog.products.length} termék, ${previewProducts.length} előnézeti kártya.`,
      catalog.debug.errors.length ? "error" : "info",
    );
  } catch (error) {
    catalog.debug = error.debug || catalog.debug || createDebug(mode);
    catalog.debug.errors.push({
      stage: "admin-manifest",
      path: "",
      message: errorMessage(error),
    });
    console.error("Admin manifest betöltési hiba", error);
    showStatus(elements.status, `Manifest betöltési hiba: ${errorMessage(error)}`, "error");
    renderAdmin();
  } finally {
    console.groupEnd();
  }
}

async function loadFiles(files, mode) {
  showStatus(elements.status, "Kézi import feldolgozása...");
  console.groupCollapsed("[Admin catalog] Kézi import");

  try {
    catalog = await loadCatalogFromFiles(files, { debug: createDebug(mode) });
    renderAdmin();
    showStatus(
      elements.status,
      `Kézi import kész: ${catalog.datasets.length} dataset, ${catalog.products.length} termék.`,
      catalog.debug.errors.length ? "error" : "info",
    );
  } catch (error) {
    catalog.debug.errors.push({
      stage: "manual-import",
      path: "",
      message: errorMessage(error),
    });
    console.error("Kézi import hiba", error);
    showStatus(elements.status, `Kézi import hiba: ${errorMessage(error)}`, "error");
    renderDebugPanel();
  } finally {
    console.groupEnd();
  }
}

function renderAdmin() {
  const options = getFilterOptions(catalog.products, catalog.datasets);
  previewProducts = sortProducts(catalog.products, "fresh").slice(0, 24);

  try {
    renderDatasets(elements.datasetList, catalog.datasets);
    renderCategoryNav(elements.categoryNav, options.categories, () => {});
    renderProducts(elements.productGrid, previewProducts, elements.productCardTemplate, { mode: "admin" });
    catalog.debug.render.status = "ok";
  } catch (error) {
    catalog.debug.render.status = "error";
    catalog.debug.render.error = errorMessage(error);
    catalog.debug.errors.push({
      stage: "admin-render",
      path: "",
      message: errorMessage(error),
    });
    console.error("Admin render hiba", error);
    showStatus(elements.status, `Admin előnézet render hiba: ${errorMessage(error)}`, "error");
  }

  catalog.debug.summary.renderedProducts = previewProducts.length;
  elements.emptyState.hidden = previewProducts.length > 0;
  elements.resultCount.textContent = `${previewProducts.length} előnézeti termék`;
  elements.datasetCount.textContent = `${catalog.datasets.length} dataset`;
  elements.duplicateCount.textContent = `${catalog.duplicateCount} duplikáció`;
  renderDebugPanel();
}

function renderDebugPanel() {
  const debug = catalog.debug || createDebug("admin");
  const errorsHtml = debug.errors.length
    ? debug.errors
        .map(
          (error) =>
            `<div class="debug-error">${escapeHtml(error.stage || "hiba")} · ${escapeHtml(error.path || "")}<br>${escapeHtml(error.message)}</div>`,
        )
        .join("")
    : `<div class="debug-kv"><small>Legutóbbi hibák</small>Nincs rögzített hiba.</div>`;
  const datasetHtml = debug.datasets.length
    ? debug.datasets.map(renderDatasetDebug).join("")
    : `<div class="debug-dataset"><small>Datasetek</small>Nincs dataset debug rekord.</div>`;

  elements.debugContent.innerHTML = `
    <div class="debug-grid">
      ${debugKv("Mód", debug.mode)}
      ${debugKv("APP_VERSION", APP_VERSION)}
      ${debugKv("Protocol", debug.protocol)}
      ${debugKv("Manifest forrás", debug.manifest.selectedSource || "-")}
      ${debugKv("Manifest státusz", debug.manifest.status)}
      ${debugKv("Manifest entry", debug.summary.manifestEntryCount)}
      ${debugKv("Betöltött dataset", debug.summary.loadedDatasets)}
      ${debugKv("Normalizált termék", debug.summary.normalizedProducts)}
      ${debugKv("Renderelt előnézet", debug.summary.renderedProducts)}
    </div>
    <div class="debug-list">
      <h3>Dataset állapotok</h3>
      ${datasetHtml}
    </div>
    <div class="debug-list">
      <h3>Hibák</h3>
      ${errorsHtml}
    </div>
    <details>
      <summary>Teljes debug JSON</summary>
      <pre>${escapeHtml(JSON.stringify(debug, null, 2))}</pre>
    </details>
  `;
}

function renderDatasetDebug(dataset) {
  const className = dataset.status === "error" ? "debug-dataset is-error" : "debug-dataset is-ok";
  const warnings = dataset.warnings?.length ? `<br>Figyelmeztetés: ${escapeHtml(dataset.warnings.join(" | "))}` : "";
  const error = dataset.error ? `<br>Hiba: ${escapeHtml(dataset.error)}` : "";

  return `
    <div class="${className}">
      <small>${escapeHtml(dataset.path || "(nincs path)")}</small>
      <span>Státusz: ${escapeHtml(dataset.status)}</span>
      <span>Fetch: ${escapeHtml(String(dataset.fetchStatus ?? "-"))} · ok: ${escapeHtml(String(dataset.responseOk))}</span>
      <span>Parse: ${escapeHtml(String(dataset.parseSucceeded))} · items: ${escapeHtml(String(dataset.rawItemCount))} · normalizált: ${escapeHtml(String(dataset.normalizedProductCount))}</span>
      <span>Replacement karakterek: ${escapeHtml(String(dataset.replacementCharacterCount || 0))}</span>
      <span>Kulcsok: ${escapeHtml((dataset.topLevelKeys || []).join(", "))}${warnings}${error}</span>
    </div>
  `;
}

async function copyDebug() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(catalog.debug, null, 2));
    showStatus(elements.status, "Debug JSON kimásolva a vágólapra.");
  } catch (error) {
    console.error("Debug másolási hiba", error);
    showStatus(elements.status, `Debug másolási hiba: ${errorMessage(error)}`, "error");
  }
}

function debugKv(label, value) {
  return `<div class="debug-kv"><small>${escapeHtml(label)}</small>${escapeHtml(String(value ?? ""))}</div>`;
}
