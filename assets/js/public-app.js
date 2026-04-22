import { appendVersion } from "./cache-utils.js";

const [
  {
    createDebug,
    getFilterOptions,
    loadCatalogFromManifest,
    filterProducts,
    sortProducts,
    errorMessage,
  },
  { requireElements, showStatus, parseNumber },
  { fillSelect, renderActiveFilters, renderCategoryNav, renderProducts },
] = await Promise.all([
  import(appendVersion("./catalog-core.js")),
  import(appendVersion("./dom-utils.js")),
  import(appendVersion("./render.js")),
]);

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
  "#loadMoreBtn",
  "#emptyState",
  "#productCardTemplate",
];

const PAGE_SIZE = 48;
const SEARCH_DEBOUNCE_MS = 180;

let elements;
let catalog = {
  datasets: [],
  products: [],
  duplicateCount: 0,
  debug: createDebug("public"),
};
let rendered = [];
let visibleLimit = PAGE_SIZE;
let renderFrame = 0;
let searchDebounceTimer = 0;

init();

async function init() {
  try {
    elements = requireElements(REQUIRED);
  } catch (error) {
    return;
  }

  bindFilters();
  document.querySelector("#resetFiltersBtn")?.addEventListener("click", resetFilters);
  elements.loadMoreBtn.addEventListener("click", showMoreProducts);
  await loadManifest();
}

async function loadManifest() {
  const initStart = performance.now();
  showStatus(elements.status, "A katalógus betöltése folyamatban...");
  console.groupCollapsed("[Public catalog] Betöltés");

  try {
    catalog = await loadCatalogFromManifest({ debug: createDebug("public") });
    prepareProductsForSearch();
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
  elements.searchInput.addEventListener("input", scheduleSearchRender);
  elements.searchInput.addEventListener("change", () => scheduleRender({ resetPage: true }));

  for (const input of [elements.minPriceInput, elements.maxPriceInput]) {
    input.addEventListener("input", () => scheduleRender({ resetPage: true }));
    input.addEventListener("change", () => scheduleRender({ resetPage: true }));
  }

  for (const input of [elements.categoryFilter, elements.sellerFilter, elements.sortSelect]) {
    input.addEventListener("change", () => scheduleRender({ resetPage: true }));
  }
}

function prepareProductsForSearch() {
  for (const product of catalog.products) {
    product.searchText = [
      product.title,
      product.itemId,
      product.sellerName,
      product.source,
      ...(product.categories || []),
      ...(product.datasetLabels || []),
    ]
      .join(" ")
      .toLowerCase();
  }
}

function refreshFilterOptions() {
  const options = getFilterOptions(catalog.products, catalog.datasets);
  fillSelect(elements.categoryFilter, options.categories, "Összes kategória");
  fillSelect(elements.sellerFilter, options.sellers, "Összes bolt");
  renderCategoryNav(elements.categoryNav, options.categories, (category) => {
    elements.categoryFilter.value = category;
    render({ reason: "category-nav", resetPage: true });
    document.querySelector("#products").scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function scheduleSearchRender() {
  window.clearTimeout(searchDebounceTimer);
  searchDebounceTimer = window.setTimeout(() => {
    scheduleRender({ resetPage: true });
  }, SEARCH_DEBOUNCE_MS);
}

function scheduleRender({ resetPage = false } = {}) {
  if (renderFrame) return;
  renderFrame = requestAnimationFrame(() => {
    renderFrame = 0;
    render({ reason: "filter-change", resetPage });
  });
}

function render({ reason = "manual", resetPage = false } = {}) {
  const start = performance.now();
  if (resetPage) visibleLimit = PAGE_SIZE;
  const filters = readFilters();
  const filterStart = performance.now();
  rendered = sortProducts(filterProducts(catalog.products, filters), filters.sort);
  const visibleProducts = rendered.slice(0, visibleLimit);
  const filterSortMs = performance.now() - filterStart;

  try {
    const renderStart = performance.now();
    renderProducts(elements.productGrid, visibleProducts, elements.productCardTemplate, { mode: "public" });
    const renderMs = performance.now() - renderStart;
    catalog.debug.performance.firstRenderMs = catalog.debug.performance.firstRenderMs || renderMs;

    if (reason === "initial") {
      console.info("[Public catalog] Első render", {
        products: visibleProducts.length,
        totalMatches: rendered.length,
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
  elements.loadMoreBtn.hidden = visibleLimit >= rendered.length;
  elements.resultCount.textContent =
    visibleLimit < rendered.length ? `${visibleProducts.length} / ${rendered.length} termék` : `${rendered.length} termék`;
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

function showMoreProducts() {
  visibleLimit += PAGE_SIZE;
  render({ reason: "load-more" });
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
  render({ reason: "reset", resetPage: true });
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
