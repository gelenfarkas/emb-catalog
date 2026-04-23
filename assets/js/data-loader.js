import { appendVersion } from "./cache-utils.js";

const { buildDatasetId, inferCategoryFromPath, normalizeDataset } = await import(appendVersion("./normalizer.js"));

export async function loadFromManifest(manifestPath = "data/manifest.json", options = {}) {
  const debug = options.debug || null;
  const metrics = createMetrics(options);
  const manifestUrl = appendVersion(manifestPath);
  const manifestDebug = debug ? startManifestDebug(debug, manifestPath, manifestUrl) : null;
  let response;
  let text = "";
  let manifest;

  try {
    const manifestFetchStart = performance.now();
    response = await fetch(manifestUrl, buildFetchOptions(options));
    metrics.manifestFetchMs += elapsedSince(manifestFetchStart);
    if (manifestDebug) {
      manifestDebug.fetchSucceeded = true;
      manifestDebug.fetchStatus = response.status;
      manifestDebug.fetchStatusText = response.statusText;
      manifestDebug.responseOk = response.ok;
    }
  } catch (error) {
    if (manifestDebug) {
      manifestDebug.fetchSucceeded = false;
      manifestDebug.status = "error";
      manifestDebug.error = errorMessage(error);
    }
    throw new Error(`Manifest fetch hiba (${manifestPath}): ${errorMessage(error)}`);
  }

  if (!response.ok) {
    const message = `Manifest HTTP hiba (${manifestPath}): ${response.status} ${response.statusText}`;
    if (manifestDebug) {
      manifestDebug.status = "error";
      manifestDebug.error = message;
    }
    throw new Error(message);
  }

  try {
    text = await response.text();
    const manifestParseStart = performance.now();
    manifest = JSON.parse(text);
    metrics.manifestParseMs += elapsedSince(manifestParseStart);
    if (manifestDebug) manifestDebug.parseSucceeded = true;
  } catch (error) {
    if (manifestDebug) {
      manifestDebug.parseSucceeded = false;
      manifestDebug.status = "error";
      manifestDebug.error = errorMessage(error);
      manifestDebug.preview = text.slice(0, 300);
    }
    throw new Error(`Manifest JSON parse hiba (${manifestPath}): ${errorMessage(error)}`);
  }

  const datasets = Array.isArray(manifest.datasets) ? manifest.datasets : [];
  if (manifestDebug) {
    manifestDebug.status = "ok";
    manifestDebug.entryCount = datasets.length;
    manifestDebug.topLevelKeys = Object.keys(manifest || {});
  }

  const manifestCategories = uniqueManifestCategories(datasets);
  const datasetOptions = { ...options, manifestCategories };
  const datasetsStart = performance.now();
  const results = await Promise.allSettled(
    datasets.map((entry) => loadDatasetEntry(entry, datasetOptions, debug, metrics)),
  );
  metrics.datasetTotalMs += elapsedSince(datasetsStart);

  const loaded = [];
  const errors = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      loaded.push(result.value);
    } else {
      errors.push(result.reason);
    }
  }

  return { loaded, errors, manifest, manifestPath };
}

export async function loadFromFiles(fileList, options = {}) {
  const debug = options.debug || null;
  const files = Array.from(fileList || []).filter((file) => /\.json$/i.test(file.name));
  const loaded = [];
  const errors = [];

  for (const file of files) {
    const relativePath = file.webkitRelativePath || file.name;
    const datasetDebug = debug
      ? startDatasetDebug(debug, {
          path: relativePath,
          label: relativePath,
          category: options.category || inferCategoryFromPath(relativePath),
        })
      : null;

    try {
      const text = await file.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (error) {
        if (datasetDebug) {
          datasetDebug.parseSucceeded = false;
          datasetDebug.preview = text.slice(0, 300);
        }
        throw new Error(`Kézi import JSON parse hiba (${relativePath}): ${errorMessage(error)}`);
      }
      if (datasetDebug) {
        datasetDebug.fetchStarted = false;
        datasetDebug.fetchSucceeded = true;
        datasetDebug.parseSucceeded = true;
      }
      validateDatasetShape(json, datasetDebug);

      const category = options.category || inferCategoryFromPath(relativePath);
      const normalizeStart = performance.now();
      const normalized = normalizeDataset(
        json,
        {
          id: buildDatasetId(relativePath),
          path: relativePath,
          name: file.name,
          label: relativePath,
          category,
        },
        options,
      );
      createMetrics(options).normalizeMs += elapsedSince(normalizeStart);

      if (datasetDebug) {
        datasetDebug.normalizeSucceeded = true;
        datasetDebug.normalizedProductCount = normalized.products.length;
        datasetDebug.status = normalized.products.length ? "ok" : "warning";
      }

      loaded.push(normalized);
    } catch (error) {
      if (datasetDebug) {
        datasetDebug.status = "error";
        datasetDebug.error = errorMessage(error);
      }
      errors.push({
        path: relativePath,
        message: errorMessage(error),
      });
    }
  }

  return { loaded, errors };
}

export function flattenLoadedDatasets(loaded) {
  const datasets = [];
  const products = [];

  for (const entry of loaded || []) {
    datasets.push(entry.dataset);
    products.push(...entry.products);
  }

  return { datasets, products };
}

async function loadDatasetEntry(entry, options, debug, metrics) {
  const datasetDebug = debug ? startDatasetDebug(debug, entry) : null;
  const datasetPath = entry.path || "";

  try {
    if (!datasetPath) throw new Error("Hiányzó dataset path a manifest entry-ben.");

    if (datasetDebug) datasetDebug.fetchStarted = true;
    const json = await fetchAndParseDataset(datasetPath, datasetDebug, options, metrics);
    validateDatasetShape(json, datasetDebug);

    const normalizeStart = performance.now();
    const normalized = normalizeDataset(
      json,
      {
        id: entry.id || buildDatasetId(datasetPath),
        path: datasetPath,
        label: entry.label,
        category: entry.category,
        categories: entry.categories,
      },
      options,
    );
    metrics.normalizeMs += elapsedSince(normalizeStart);

    if (datasetDebug) {
      datasetDebug.normalizeSucceeded = true;
      datasetDebug.normalizedProductCount = normalized.products.length;
      datasetDebug.status = normalized.products.length ? "ok" : "warning";
      if (datasetDebug.rawItemCount > 0 && normalized.products.length === 0) {
        datasetDebug.warnings.push("Van items tömb, de a normalizáló 0 terméket adott vissza.");
      }
    }

    return normalized;
  } catch (error) {
    if (datasetDebug) {
      datasetDebug.status = "error";
      datasetDebug.error = errorMessage(error);
    }
    throw {
      path: datasetPath || "(nincs path)",
      message: errorMessage(error),
    };
  }
}

async function fetchAndParseDataset(path, datasetDebug, options, metrics) {
  let response;
  let text = "";
  const fetchUrl = appendVersion(path);

  try {
    const fetchStart = performance.now();
    response = await fetch(fetchUrl, buildFetchOptions(options));
    metrics.datasetFetchMs += elapsedSince(fetchStart);
    if (datasetDebug) {
      datasetDebug.fetchUrl = fetchUrl;
      datasetDebug.fetchSucceeded = true;
      datasetDebug.fetchStatus = response.status;
      datasetDebug.fetchStatusText = response.statusText;
      datasetDebug.responseOk = response.ok;
    }
  } catch (error) {
    if (datasetDebug) {
      datasetDebug.fetchSucceeded = false;
      datasetDebug.error = errorMessage(error);
    }
    throw new Error(`Dataset fetch hiba (${path}): ${errorMessage(error)}`);
  }

  if (!response.ok) {
    throw new Error(`Dataset HTTP hiba (${path}): ${response.status} ${response.statusText}`);
  }

  try {
    text = await response.text();
    const parseStart = performance.now();
    const json = JSON.parse(text);
    metrics.datasetParseMs += elapsedSince(parseStart);
    if (datasetDebug) datasetDebug.parseSucceeded = true;
    return json;
  } catch (error) {
    if (datasetDebug) {
      datasetDebug.parseSucceeded = false;
      datasetDebug.preview = text.slice(0, 300);
    }
    throw new Error(`Dataset JSON parse hiba (${path}): ${errorMessage(error)}`);
  }
}

function validateDatasetShape(json, datasetDebug) {
  const isObject = !!json && typeof json === "object" && !Array.isArray(json);
  const hasItems = isObject && Object.prototype.hasOwnProperty.call(json, "items");
  const itemsIsArray = hasItems && Array.isArray(json.items);

  if (datasetDebug) {
    datasetDebug.isObject = isObject;
    datasetDebug.hasItems = hasItems;
    datasetDebug.itemsIsArray = itemsIsArray;
    datasetDebug.topLevelKeys = isObject ? Object.keys(json) : [];
    datasetDebug.rawItemCount = itemsIsArray ? json.items.length : 0;
    datasetDebug.replacementCharacterCount = itemsIsArray ? countReplacementCharacters(json.items) : 0;
    if (!isObject) datasetDebug.warnings.push("A JSON nem objektum.");
    if (isObject && !hasItems) datasetDebug.warnings.push("Nincs items mező.");
    if (hasItems && !itemsIsArray) datasetDebug.warnings.push("Az items mező nem tömb.");
    if (itemsIsArray && json.items.length === 0) datasetDebug.warnings.push("Az items tömb üres.");
    if (datasetDebug.replacementCharacterCount > 0) {
      datasetDebug.warnings.push(`A JSON stringek ${datasetDebug.replacementCharacterCount} replacement karaktert tartalmaznak.`);
    }
  }

  if (!isObject) throw new Error("A dataset JSON nem objektum.");
  if (!hasItems) throw new Error(`Nincs items tömb. Top-level kulcsok: ${Object.keys(json).join(", ")}`);
  if (!itemsIsArray) throw new Error("Az items mező nem tömb.");
}

function uniqueManifestCategories(datasets) {
  const values = [];
  for (const dataset of datasets || []) {
    if (Array.isArray(dataset.categories)) {
      values.push(...dataset.categories);
    } else if (dataset.category) {
      values.push(dataset.category);
    }
  }
  return Array.from(new Set(values.map((value) => String(value || "").replace(/\s+/g, " ").trim()).filter(Boolean)));
}

function countReplacementCharacters(items) {
  let count = 0;
  for (const item of items || []) {
    count += countReplacementInValue(item && item.title);
    count += countReplacementInValue(item && item.sellerName);
    count += countReplacementInValue(item && item.priceLabel);
  }
  return count;
}

function countReplacementInValue(value) {
  return typeof value === "string" ? (value.match(/\uFFFD/g) || []).length : 0;
}

function buildFetchOptions(options = {}) {
  return {
    ...(options.fetchOptions || {}),
    cache: "no-store",
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      ...(options.fetchOptions?.headers || {}),
    },
  };
}

function createMetrics(options = {}) {
  const metrics = options.metrics || {};
  metrics.manifestFetchMs = metrics.manifestFetchMs || 0;
  metrics.manifestParseMs = metrics.manifestParseMs || 0;
  metrics.datasetTotalMs = metrics.datasetTotalMs || 0;
  metrics.datasetFetchMs = metrics.datasetFetchMs || 0;
  metrics.datasetParseMs = metrics.datasetParseMs || 0;
  metrics.normalizeMs = metrics.normalizeMs || 0;
  return metrics;
}

function elapsedSince(start) {
  return performance.now() - start;
}

function startManifestDebug(debug, path, fetchUrl) {
  const previousAttempts = debug.manifest?.attemptedPaths || [];
  debug.manifest = {
    path,
    fetchUrl,
    attemptedPaths: [...previousAttempts, path],
    selectedSource: "",
    status: "loading",
    fetchStarted: true,
    fetchSucceeded: false,
    fetchStatus: null,
    fetchStatusText: "",
    responseOk: null,
    parseSucceeded: false,
    entryCount: 0,
    topLevelKeys: [],
    preview: "",
    error: "",
  };
  return debug.manifest;
}

function startDatasetDebug(debug, entry) {
  const record = {
    path: entry.path || "",
    fetchUrl: "",
    label: entry.label || "",
    category: entry.category || (Array.isArray(entry.categories) ? entry.categories.join(", ") : ""),
    status: "loading",
    fetchStarted: false,
    fetchSucceeded: false,
    fetchStatus: null,
    fetchStatusText: "",
    responseOk: null,
    parseSucceeded: false,
    isObject: null,
    hasItems: null,
    itemsIsArray: null,
    topLevelKeys: [],
    rawItemCount: 0,
    replacementCharacterCount: 0,
    normalizeSucceeded: false,
    normalizedProductCount: 0,
    warnings: [],
    preview: "",
    error: "",
  };
  debug.datasets.push(record);
  return record;
}

function errorMessage(error) {
  return error && error.message ? error.message : String(error);
}
