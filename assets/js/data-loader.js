import { buildDatasetId, inferCategoryFromPath, normalizeDataset } from "./normalizer.js";

export async function loadFromManifest(manifestPath = "data/manifest.json", options = {}) {
  const debug = options.debug || null;
  const manifestDebug = debug ? startManifestDebug(debug, manifestPath) : null;
  let response;
  let text = "";
  let manifest;

  try {
    response = await fetch(manifestPath, { cache: "no-store" });
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
    manifest = JSON.parse(text);
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

  const loaded = [];
  const errors = [];

  for (const entry of datasets) {
    const datasetDebug = debug ? startDatasetDebug(debug, entry) : null;
    try {
      const datasetPath = entry.path || "";
      if (!datasetPath) throw new Error("Hiányzó dataset path a manifest entry-ben.");

      if (datasetDebug) datasetDebug.fetchStarted = true;
      const json = await fetchAndParseDataset(datasetPath, datasetDebug);
      validateDatasetShape(json, datasetDebug);

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

      if (datasetDebug) {
        datasetDebug.normalizeSucceeded = true;
        datasetDebug.normalizedProductCount = normalized.products.length;
        datasetDebug.status = normalized.products.length ? "ok" : "warning";
        if (datasetDebug.rawItemCount > 0 && normalized.products.length === 0) {
          datasetDebug.warnings.push("Van items tömb, de a normalizáló 0 terméket adott vissza.");
        }
      }

      loaded.push(normalized);
    } catch (error) {
      if (datasetDebug) {
        datasetDebug.status = "error";
        datasetDebug.error = errorMessage(error);
      }
      errors.push({
        path: entry.path || "(nincs path)",
        message: errorMessage(error),
      });
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

async function fetchAndParseDataset(path, datasetDebug) {
  let response;
  let text = "";

  try {
    response = await fetch(path, { cache: "no-store" });
    if (datasetDebug) {
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
    const json = JSON.parse(text);
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

function startManifestDebug(debug, path) {
  const previousAttempts = debug.manifest?.attemptedPaths || [];
  debug.manifest = {
    path,
    attemptedPaths: [...previousAttempts, path],
    status: "loading",
    fetchStarted: true,
    fetchSucceeded: false,
    fetchStatus: null,
    fetchStatusText: "",
    responseOk: null,
    parseSucceeded: false,
    entryCount: 0,
    topLevelKeys: [],
    selectedSource: "",
    preview: "",
    error: "",
  };
  return debug.manifest;
}

function startDatasetDebug(debug, entry) {
  const record = {
    path: entry.path || "",
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
