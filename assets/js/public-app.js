import {
  createDebug,
  getFilterOptions,
  loadCatalogFromManifest,
  filterProducts,
  sortProducts,
  errorMessage,
} from "./catalog-core.js";
import { requireElements, showStatus, parseNumber } from "./dom-utils.js";
import { fillSelect, renderActiveFilters, renderCategoryNav, renderProducts } from "./render.js";

const REQUIRED = [
  "#status",
  "#searchInput",
  "#categoryFilter",
  "#minPriceInput",
  "#maxPriceInput",
  "#sellerFilter",
  "#sortSelect",
  "#activeFilters",
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
  debug: createDebug("public"),
};
let rendered = [];
let renderFrame = 0;

init();

async function init() {
  try {
    elements = requireElements(REQUIRED);
  } catch (error) {
    return;
  }

  bindFilters();
  document.querySelector("#resetFiltersBtn")?.addEventListener("click", resetFilters);
  await loadManifest();
}

async function loadManifest() {
  const initStart = performance.now();
  showStatus(elements.status, "A katalógus betöltése folyamatban...");
  console.groupCollapsed("[Public catalog] Betöltés");

  try {
    catalog = await loadCatalogFromManifest({ debug: createDebug("public") });
    refreshFilterOptions();
    render({ reason: "initial" });
    catalog.debug.performance.totalInitMs = performance.now() - initStart;
    logPublicPerformance(catalog.debug.performance);
    showStatus(
      elements.status,
      catalog.debug.errors.length
        ? `${rendered.length} termék betöltve, de ${catalog.debug.errors.length} adatforrás hibát jelzett.`
        : `${rendered.length} termék betöltve a katalógusba.`,
      catalog.debug.errors.length ? "error" : "info",
    );
    console.info("Publikus katalógus betöltve", {
      datasets: catalog.datasets.length,
      products: catalog.products.length,
      rendered: rendered.length,
    });
  } catch (error) {
    console.error("Publikus katalógus betöltési hiba", error);
    showStatus(elements.status, "A katalógus most nem érhető el. Kérlek, nézz vissza később.", "error");
  } finally {
    console.groupEnd();
  }
}

function bindFilters() {
  for (const input of [
    elements.searchInput,
    elements.categoryFilter,
    elements.minPriceInput,
    elements.maxPriceInput,
    elements.sellerFilter,
    elements.sortSelect,
  ]) {
    input.addEventListener("input", scheduleRender);
    input.addEventListener("change", scheduleRender);
  }
}

function refreshFilterOptions() {
  const options = getFilterOptions(catalog.products, catalog.datasets);
  fillSelect(elements.categoryFilter, options.categories, "Összes kategória");
  fillSelect(elements.sellerFilter, options.sellers, "Összes bolt");
  renderCategoryNav(elements.categoryNav, options.categories, (category) => {
    elements.categoryFilter.value = category;
    render({ reason: "category-nav" });
    document.querySelector("#products").scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function scheduleRender() {
  if (renderFrame) return;
  renderFrame = requestAnimationFrame(() => {
    renderFrame = 0;
    render({ reason: "filter-change" });
  });
}

function render({ reason = "manual" } = {}) {
  const start = performance.now();
  const filters = readFilters();
  const filterStart = performance.now();
  rendered = sortProducts(filterProducts(catalog.products, filters), filters.sort);
  const filterSortMs = performance.now() - filterStart;

  try {
    const renderStart = performance.now();
    renderProducts(elements.productGrid, rendered, elements.productCardTemplate, { mode: "public" });
    const renderMs = performance.now() - renderStart;
    catalog.debug.performance.firstRenderMs = catalog.debug.performance.firstRenderMs || renderMs;

    if (reason === "initial") {
      console.info("[Public catalog] Első render", {
        products: rendered.length,
        filterSortMs: roundMs(filterSortMs),
        renderMs: roundMs(renderMs),
        totalRenderCycleMs: roundMs(performance.now() - start),
      });
    }
  } catch (error) {
    console.error("Publikus render hiba", error);
    showStatus(elements.status, `A terméklista megjelenítése nem sikerült: ${errorMessage(error)}`, "error");
    return;
  }

  elements.emptyState.hidden = rendered.length > 0;
  elements.resultCount.textContent = `${rendered.length} termék`;
  elements.datasetCount.textContent = `${catalog.datasets.length} válogatás`;
  elements.duplicateCount.textContent = `${catalog.duplicateCount} ismétlődés szűrve`;
  renderActiveFilters(elements.activeFilters, [
    { label: "Keresés", value: filters.query },
    { label: "Kategória", value: filters.category },
    { label: "Min", value: filters.minPrice ?? "" },
    { label: "Max", value: filters.maxPrice ?? "" },
    { label: "Bolt", value: filters.seller },
  ]);
}

function readFilters() {
  return {
    query: elements.searchInput.value,
    category: elements.categoryFilter.value,
    minPrice: parseNumber(elements.minPriceInput.value),
    maxPrice: parseNumber(elements.maxPriceInput.value),
    seller: elements.sellerFilter.value,
    sort: elements.sortSelect.value,
  };
}

function resetFilters() {
  elements.searchInput.value = "";
  elements.categoryFilter.value = "";
  elements.minPriceInput.value = "";
  elements.maxPriceInput.value = "";
  elements.sellerFilter.value = "";
  elements.sortSelect.value = "fresh";
  render({ reason: "reset" });
}

function logPublicPerformance(metrics) {
  console.info("[Public catalog] Performance mérés");
  console.table({
    "manifest fetch": roundMs(metrics.manifestFetchMs),
    "manifest parse": roundMs(metrics.manifestParseMs),
    "datasetek összesen": roundMs(metrics.datasetTotalMs),
    "dataset fetch összesen": roundMs(metrics.datasetFetchMs),
    "dataset parse összesen": roundMs(metrics.datasetParseMs),
    normalizálás: roundMs(metrics.normalizeMs),
    deduplikáció: roundMs(metrics.dedupeMs),
    "első render": roundMs(metrics.firstRenderMs),
    "teljes public init": roundMs(metrics.totalInitMs),
  });
}

function roundMs(value) {
  return `${Math.round((value || 0) * 10) / 10} ms`;
}
