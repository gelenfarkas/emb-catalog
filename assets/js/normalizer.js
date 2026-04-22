export const DEFAULT_AFFILIATE_USERNAME = "gelenfarkas";
export const DEFAULT_HUF_RATE = 370;
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20600%20600'%3E%3Crect%20width='600'%20height='600'%20fill='%23efebe3'/%3E%3Ctext%20x='50%25'%20y='50%25'%20dominant-baseline='middle'%20text-anchor='middle'%20font-family='Arial'%20font-size='28'%20fill='%2368665f'%3ENincs%20k%C3%A9p%3C/text%3E%3C/svg%3E";

import { appendVersion } from "./cache-utils.js";

const { UNCATEGORIZED_LABEL, detectCategories, getCategoryLabel, normalizeSearchText } = await import(
  appendVersion("./category-mapping.js")
);
const { estimateShipping } = await import(appendVersion("./shipping-estimator.js"));

const categoryDetectionCache = new Map();

const CATEGORY_LABELS = {
  cipo: "Cipő",
  cipok: "Cipő",
  shoe: "Cipő",
  shoes: "Cipő",
  zokni: "Zokni",
  socks: "Zokni",
  taska: "Táska",
  bag: "Táska",
  bags: "Táska",
  sal: "Sál",
  nadrag: "Nadrág",
  kabat: "Kabát",
  melleny: "Mellény",
  sapka: "Sapka",
  polo: "Póló",
  pulcsi: "Pulcsi",
  pulover: "Pulóver",
  furdoruha: "Fürdőruha",
  kategorizalatlan: "Kategorizálatlan",
};

export function normalizeDataset(json, datasetInput, options = {}) {
  const root = json && typeof json === "object" ? json : {};
  const items = Array.isArray(root.items) ? root.items : [];
  const generatedAt = cleanText(root.generatedAt || datasetInput.generatedAt || "");
  const categories = normalizeCategories(
    datasetInput.categories || datasetInput.category || inferCategoryFromPath(datasetInput.path || datasetInput.name || ""),
  );

  const dataset = {
    id: datasetInput.id || buildDatasetId(datasetInput.path || datasetInput.name || generatedAt),
    label:
      cleanText(datasetInput.label) ||
      cleanText(root.sourceLabel) ||
      cleanText(root.page && root.page.sellerName) ||
      cleanText(datasetInput.name) ||
      "EastMallBuy export",
    path: cleanText(datasetInput.path || datasetInput.name || ""),
    categories,
    generatedAt,
    source: cleanText(root.source || datasetInput.source || ""),
    sourceLabel: cleanText(root.sourceLabel || ""),
    sellerName: cleanText(root.page && root.page.sellerName),
    itemCount: items.length,
    loadedAt: new Date().toISOString(),
    meta: {
      pageHref: cleanText(root.page && root.page.href),
      pageTitle: cleanText(root.page && root.page.title),
      tp: cleanText((root.page && root.page.tp) || root.stats?.dominantTp || "micro"),
      affiliateUsername: cleanText(root.affiliate && root.affiliate.username),
    },
  };

  const affiliateUsername =
    normalizeAffiliateUsername(options.affiliateUsername) ||
    normalizeAffiliateUsername(dataset.meta.affiliateUsername) ||
    DEFAULT_AFFILIATE_USERNAME;

  const products = items
    .map((item, index) =>
      normalizeProduct(item, {
        root,
        dataset,
        index,
        affiliateUsername,
      }),
    )
    .filter(Boolean);

  dataset.itemCount = products.length;
  return { dataset, products };
}

export function normalizeProduct(item, context) {
  if (!item || typeof item !== "object") return null;

  const dataset = context.dataset;
  const page = context.root.page || {};
  const raw = item.raw && typeof item.raw === "object" ? item.raw : {};
  const url = normalizeUrl(firstNonEmpty([item.url, raw.detail_url, raw.url, raw.href, raw.item_url, raw.pc_url, raw.h5_url]));
  const itemId = cleanText(firstNonEmpty([item.itemId, item.item_id, item.num_iid, item.tid, raw.item_id, raw.num_iid, raw.tid, extractTid(url)]));
  const title = cleanText(firstNonEmpty([item.title, item.name, item.item_title, raw.title, raw.name]));

  if (!itemId && !url && !title) return null;

  const tp = cleanText(firstNonEmpty([item.tp, raw.tp, extractParam(url, "tp"), page.tp, dataset.meta.tp, "micro"]));
  const price = parsePrice(firstNonEmpty([item.price, item.priceLabel, raw.price, raw.priceText, raw.promotion_price]));
  const priceLabel = cleanText(item.priceLabel) || (price === null ? "" : formatUsd(price));
  const image = normalizeUrl(firstNonEmpty([item.image, raw.image, raw.pic_url, raw.img, raw.imageSrc])) || PLACEHOLDER_IMAGE;
  const sellerName =
    cleanText(firstNonEmpty([item.sellerName, raw.seller_name, raw.shop_name, raw.seller, page.sellerName, dataset.sellerName])) ||
    "EastMallBuy shop";
  const normalizedTitle = normalizeSearchText(title);
  const detectedCategoryIds = getDetectedCategoryIds(normalizedTitle);
  const categoryId = detectedCategoryIds[0] || "kategorizalatlan";
  const categoryLabel = getCategoryLabel(categoryId) || UNCATEGORIZED_LABEL;
  const categoryIds = unique([categoryId, ...detectedCategoryIds]);
  const categories = unique([
    ...detectedCategoryIds.map((detectedCategoryId) => getCategoryLabel(detectedCategoryId) || UNCATEGORIZED_LABEL),
    categoryLabel,
  ]);
  const shippingEstimate = estimateShipping({ categoryIds, categories });
  const source = cleanText(item.source || dataset.source || "unknown");
  const affiliateUrl =
    normalizeUrl(item.affiliateUrl) ||
    buildAffiliateUrl({
      url,
      itemId,
      tp,
      inviter: context.affiliateUsername,
    });

  return {
    key: buildProductKey({ itemId, url, title, image }),
    itemId,
    tp,
    title: title || "Névtelen EastMallBuy termék",
    price,
    priceLabel,
    approxHuf: price === null ? "" : formatHuf(Math.round(price * DEFAULT_HUF_RATE)),
    image,
    url,
    affiliateUrl,
    sellerName,
    source,
    category: categoryLabel,
    categoryId,
    categoryIds,
    categoryLabel,
    normalizedTitle,
    categories,
    shippingEstimate,
    shippingEstimateHuf: shippingEstimate.dhlEstimateHuf,
    shippingEstimateLabel: shippingEstimate.displayHuf,
    shippingEstimateSourceCategory: shippingEstimate.sourceCategory,
    datasetIds: [dataset.id],
    datasetLabels: [dataset.label],
    datasetPaths: [dataset.path],
    datasetCount: 1,
    newestGeneratedAt: dataset.generatedAt,
    raw,
  };
}

export function dedupeProducts(products) {
  const byKey = new Map();
  let duplicateCount = 0;

  for (const product of products) {
    const key = buildProductKey(product);
    if (!key) continue;

    if (!byKey.has(key)) {
      byKey.set(key, { ...product, key });
      continue;
    }

    duplicateCount += 1;
    byKey.set(key, mergeProduct(byKey.get(key), product));
  }

  return {
    products: Array.from(byKey.values()),
    duplicateCount,
  };
}

export function inferCategoryFromPath(path) {
  const parts = cleanText(path).replace(/\\/g, "/").split("/").filter(Boolean);
  const dataIndex = parts.findIndex((part) => part.toLowerCase() === "data");
  const folder = dataIndex >= 0 ? parts[dataIndex + 1] : parts.length > 1 ? parts[parts.length - 2] : "";
  return humanizeCategory(folder);
}

export function humanizeCategory(value) {
  const slug = slugify(value);
  if (!slug) return "Egyéb";
  return CATEGORY_LABELS[slug] || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
}

export function buildAffiliateUrl({ url, itemId, tp, inviter }) {
  const tid = cleanText(itemId || extractTid(url));
  if (!tid) return normalizeUrl(url);

  const params = new URLSearchParams();
  params.set("tp", cleanText(tp) || extractParam(url, "tp") || "micro");
  params.set("tid", tid);

  const normalizedInviter = normalizeAffiliateUsername(inviter);
  if (normalizedInviter) params.set("inviter", normalizedInviter);

  return `https://eastmallbuy.com/index/item/index.html?${params.toString()}`;
}

export function buildDatasetId(value) {
  const base = slugify(value) || "dataset";
  return `${base}-${hashString(value || String(Date.now()))}`;
}

export function buildProductKey(product) {
  const itemId = cleanText(product.itemId);
  if (itemId) return `id:${itemId}`;

  const url = normalizeUrl(product.url);
  if (url) return `url:${url}`;

  return `fallback:${slugify(product.title)}:${slugify(product.image)}`;
}

function mergeProduct(existing, incoming) {
  const better = scoreProduct(incoming) > scoreProduct(existing) ? incoming : existing;
  const other = better === incoming ? existing : incoming;
  const datasetIds = unique([...(existing.datasetIds || []), ...(incoming.datasetIds || [])]);
  const datasetLabels = unique([...(existing.datasetLabels || []), ...(incoming.datasetLabels || [])]);
  const datasetPaths = unique([...(existing.datasetPaths || []), ...(incoming.datasetPaths || [])]);
  const categoryIds = unique([...(existing.categoryIds || [existing.categoryId]), ...(incoming.categoryIds || [incoming.categoryId])]);
  const categories = unique([...(existing.categories || []), ...(incoming.categories || [])]);
  const shippingEstimate = estimateShipping({ categoryIds, categories });

  return {
    ...other,
    ...better,
    categoryIds,
    categories,
    shippingEstimate,
    shippingEstimateHuf: shippingEstimate.dhlEstimateHuf,
    shippingEstimateLabel: shippingEstimate.displayHuf,
    shippingEstimateSourceCategory: shippingEstimate.sourceCategory,
    datasetIds,
    datasetLabels,
    datasetPaths,
    datasetCount: datasetIds.length,
    newestGeneratedAt: maxDate(existing.newestGeneratedAt, incoming.newestGeneratedAt),
    raw: { ...(other.raw || {}), ...(better.raw || {}) },
  };
}

function getDetectedCategoryIds(normalizedTitle) {
  if (!categoryDetectionCache.has(normalizedTitle)) {
    categoryDetectionCache.set(normalizedTitle, detectCategories(normalizedTitle));
  }
  return categoryDetectionCache.get(normalizedTitle);
}

function scoreProduct(product) {
  let score = 0;
  if (product.itemId) score += 5;
  if (product.url) score += 4;
  if (product.affiliateUrl) score += 3;
  if (product.image && product.image !== PLACEHOLDER_IMAGE) score += 3;
  if (product.price !== null) score += 2;
  if (product.sellerName) score += 1;
  if ((product.title || "").length > 8) score += 1;
  return score;
}

function normalizeCategories(value) {
  const raw = Array.isArray(value) ? value : String(value || "").split(",");
  const categories = raw.map((entry) => cleanText(entry)).filter(Boolean);
  return categories.length ? unique(categories) : ["Egyéb"];
}

function maxDate(a, b) {
  const da = Date.parse(a || "");
  const db = Date.parse(b || "");
  if (!Number.isFinite(da)) return b || a || "";
  if (!Number.isFinite(db)) return a || b || "";
  return db > da ? b : a;
}

function normalizeAffiliateUsername(value) {
  return cleanText(value).replace(/\s+/g, "");
}

function normalizeUrl(value) {
  const text = cleanText(value);
  if (!text) return "";
  if (text.startsWith("data:image/")) return text;
  if (text.startsWith("//")) return `${location.protocol}${text}`;
  try {
    return new URL(text, location.href).toString();
  } catch (error) {
    return "";
  }
}

function extractTid(url) {
  return extractParam(url, "tid") || (String(url || "").match(/(\d{5,})/) || [])[1] || "";
}

function extractParam(url, key) {
  const value = cleanText(url);
  if (!value) return "";
  try {
    return cleanText(new URL(value, location.href).searchParams.get(key));
  } catch (error) {
    const match = value.match(new RegExp(`[?&]${escapeRegExp(key)}=([^&#]+)`, "i"));
    return match ? cleanText(decodeURIComponent(match[1])) : "";
  }
}

function parsePrice(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const normalized = String(value).replace(/\s/g, "").replace(/,/g, ".").replace(/[^\d.]/g, "");
  if (!normalized) return null;
  const parts = normalized.split(".");
  const repaired = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : normalized;
  const parsed = Number(repaired);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatUsd(value) {
  return `$${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
}

function formatHuf(value) {
  return `kb. ${new Intl.NumberFormat("hu-HU").format(value)} Ft`;
}

function firstNonEmpty(values) {
  for (const value of values) {
    if (value === 0) return value;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function unique(values) {
  return Array.from(new Set(values.map((value) => cleanText(value)).filter(Boolean)));
}

function slugify(value) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function hashString(value) {
  let hash = 0;
  const text = String(value || "");
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
