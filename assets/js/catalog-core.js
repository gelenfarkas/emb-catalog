import { appendVersion } from "./cache-utils.js";

const [
  { loadFromFiles, loadFromManifest, flattenLoadedDatasets },
  { dedupeProducts },
  { expandSearchQuery, findCategoryByQuery, normalizeSearchText },
] = await Promise.all([
  import(appendVersion("./data-loader.js")),
  import(appendVersion("./normalizer.js")),
  import(appendVersion("./category-mapping.js")),
]);

export const MANIFEST_PATHS = ["data/manifest.json", "manifest.php"];

export function createDebug(mode) {
  return {
    mode,
    createdAt: new Date().toISOString(),
    url: location.href,
    protocol: location.protocol,
    manifest: {
      path: MANIFEST_PATHS[0],
      attemptedPaths: [],
      selectedSource: "",
      status: "not-started",
      entryCount: 0,
      error: "",
    },
    datasets: [],
    summary: {
      manifestEntryCount: 0,
      loadedDatasets: 0,
      rawProductsBeforeDedupe: 0,
      normalizedProducts: 0,
      duplicateCount: 0,
      renderedProducts: 0,
    },
    render: {
      status: "not-started",
      error: "",
    },
    performance: {
      manifestFetchMs: 0,
      manifestParseMs: 0,
      datasetTotalMs: 0,
      datasetFetchMs: 0,
      datasetParseMs: 0,
      normalizeMs: 0,
      dedupeMs: 0,
      totalInitMs: 0,
    },
    warnings: [],
    errors: [],
  };
}

export async function loadCatalogFromManifest({ debug = createDebug("manifest"), bypassCache = false } = {}) {
  let result = null;
  let lastError = null;
  const start = performance.now();
  const candidates = location.protocol === "file:" ? [MANIFEST_PATHS[0]] : MANIFEST_PATHS;

  for (const manifestPath of candidates) {
    try {
      console.groupCollapsed(`[Catalog] Manifest: ${manifestPath}`);
      result = await loadFromManifest(manifestPath, { debug, metrics: debug.performance, bypassCache });
      debug.manifest.selectedSource = manifestPath;
      debug.manifest.status = "ok";
      debug.manifest.entryCount = debug.manifest.entryCount || result.manifest?.datasets?.length || 0;
      console.info("Manifest betöltve", { manifestPath, entries: debug.manifest.entryCount });
      console.groupEnd();
      break;
    } catch (error) {
      lastError = error;
      debug.errors.push({
        stage: "manifest",
        path: manifestPath,
        message: errorMessage(error),
      });
      console.error("Manifest betöltési hiba", { manifestPath, error });
      console.groupEnd();
    }
  }

  if (!result) {
    throw Object.assign(new Error(`Nem sikerült manifestet betölteni: ${errorMessage(lastError)}`), {
      debug,
    });
  }

  for (const error of result.errors || []) {
    debug.errors.push({
      stage: "dataset",
      path: error.path,
      message: error.message,
    });
  }

  const state = buildCatalogState(result.loaded, debug);
  debug.performance.totalInitMs = performance.now() - start;
  logPerformance("[Catalog] Betöltési idők", debug.performance);
  return state;
}

export async function loadCatalogFromFiles(fileList, { debug = createDebug("manual") } = {}) {
  const start = performance.now();
  const result = await loadFromFiles(fileList, { debug, metrics: debug.performance });

  for (const error of result.errors || []) {
    debug.errors.push({
      stage: "manual-dataset",
      path: error.path,
      message: error.message,
    });
  }

  const state = buildCatalogState(result.loaded, debug);
  debug.performance.totalInitMs = performance.now() - start;
  logPerformance("[Catalog] Kézi import idők", debug.performance);
  return state;
}

export function buildCatalogState(loaded, debug) {
  const flat = flattenLoadedDatasets(loaded);
  const dedupeStart = performance.now();
  const deduped = dedupeProducts(flat.products);
  debug.performance.dedupeMs += performance.now() - dedupeStart;
  const state = {
    datasets: flat.datasets,
    products: deduped.products,
    duplicateCount: deduped.duplicateCount,
    debug,
  };

  debug.summary.loadedDatasets = state.datasets.length;
  debug.summary.rawProductsBeforeDedupe = flat.products.length;
  debug.summary.normalizedProducts = state.products.length;
  debug.summary.duplicateCount = state.duplicateCount;
  debug.summary.manifestEntryCount = debug.manifest.entryCount || 0;

  console.groupCollapsed("[Catalog] Normalizálás");
  console.info("Datasetek:", state.datasets.length);
  console.info("Termékek dedupe előtt:", flat.products.length);
  console.info("Egyedi termékek:", state.products.length);
  console.info("Duplikációk:", state.duplicateCount);
  console.groupEnd();

  return state;
}

export function filterProducts(products, filters) {
  return (products || []).filter((product) => productMatches(product, filters || {}));
}

export function sortProducts(products, sort = "fresh") {
  const sorted = [...(products || [])];
  sorted.sort((a, b) => compareProducts(a, b, sort));
  return sorted;
}

export function getFilterOptions(products, datasets = []) {
  return {
    categories: unique([
      ...(datasets || []).flatMap((dataset) => dataset.categories || []),
      ...(products || []).flatMap((product) => product.categories || product.categoryLabel || []),
    ]),
    sellers: unique(products.map((product) => product.sellerName)),
    sources: unique(products.map((product) => product.source)),
    datasets: unique(datasets.map((dataset) => dataset.label)),
  };
}

export function unique(values) {
  return Array.from(new Set((values || []).map((value) => cleanText(value)).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "hu"),
  );
}

export function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function errorMessage(error) {
  return error && error.message ? error.message : String(error);
}

function productMatches(product, filters) {
  const query = normalizeSearchText(filters.query);
  if (query) {
    const queryCategory = findCategoryByQuery(query);
    const queryTerms = expandSearchQuery(filters.query);
    const haystack =
      product.searchText ||
      [
        product.title,
        product.itemId,
        product.sellerName,
        product.source,
        ...(product.categories || []),
        ...(product.datasetLabels || []),
      ]
        .join(" ")
        .toLowerCase();
    const normalizedHaystack = normalizeSearchText(haystack);
    const matchesText = queryTerms.some((term) => normalizedHaystack.includes(term));
    const matchesCategory =
      queryCategory &&
      (product.categoryId === queryCategory.id ||
        product.category === queryCategory.label ||
        product.categoryLabel === queryCategory.label ||
        (product.categories || []).includes(queryCategory.label));
    if (!matchesText && !matchesCategory) return false;
  }

  if (
    filters.category &&
    product.category !== filters.category &&
    product.categoryLabel !== filters.category &&
    product.categoryId !== filters.category &&
    !(product.categories || []).includes(filters.category)
  ) {
    return false;
  }
  if (filters.source && product.source !== filters.source) return false;
  if (filters.seller && product.sellerName !== filters.seller) return false;
  if (filters.dataset && !(product.datasetLabels || []).includes(filters.dataset)) return false;
  if (filters.minPrice !== null && filters.minPrice !== undefined && (product.price === null || product.price < filters.minPrice)) return false;
  if (filters.maxPrice !== null && filters.maxPrice !== undefined && (product.price === null || product.price > filters.maxPrice)) return false;

  return true;
}

function compareProducts(a, b, sort) {
  if (sort === "default") return compareOheroFirst(a, b) || dateValue(b.newestGeneratedAt) - dateValue(a.newestGeneratedAt);
  if (sort === "title-asc") return a.title.localeCompare(b.title, "hu");
  if (sort === "title-desc") return b.title.localeCompare(a.title, "hu");
  if (sort === "price-asc") return compareNullablePrice(a.price, b.price);
  if (sort === "price-desc") return compareNullablePrice(b.price, a.price);
  if (sort === "category-asc") return (a.categories?.[0] || "").localeCompare(b.categories?.[0] || "", "hu");
  return dateValue(b.newestGeneratedAt) - dateValue(a.newestGeneratedAt);
}

function compareOheroFirst(a, b) {
  const aIsOhero = a.sellerName?.toLowerCase().includes("ohero");
  const bIsOhero = b.sellerName?.toLowerCase().includes("ohero");

  if (aIsOhero && !bIsOhero) return -1;
  if (!aIsOhero && bIsOhero) return 1;
  return 0;
}

function compareNullablePrice(a, b) {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

function dateValue(value) {
  const date = Date.parse(value || "");
  return Number.isFinite(date) ? date : 0;
}

function logPerformance(label, metrics) {
  console.info(label);
  console.table({
    "manifest fetch": roundMs(metrics.manifestFetchMs),
    "manifest parse": roundMs(metrics.manifestParseMs),
    "datasetek összesen": roundMs(metrics.datasetTotalMs),
    "dataset fetch összesen": roundMs(metrics.datasetFetchMs),
    "dataset parse összesen": roundMs(metrics.datasetParseMs),
    normalizálás: roundMs(metrics.normalizeMs),
    deduplikáció: roundMs(metrics.dedupeMs),
    "teljes adat init": roundMs(metrics.totalInitMs),
  });
}

function roundMs(value) {
  return `${Math.round((value || 0) * 10) / 10} ms`;
}
