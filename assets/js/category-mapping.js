export const UNCATEGORIZED_LABEL = "Kategorizálatlan";

const CN_WEIGHT = 2;
const DEFAULT_WEIGHT = 1;

const UNCATEGORIZED_KEYWORDS = ["耳机", "钱包", "腰带"];

export const CATEGORY_MAP = [
  {
    id: "cipo",
    label: "Cipő",
    keywords: {
      hu: ["cipő", "cipők", "sportcipő", "edzőcipő", "cipo", "cipok", "sportcipo", "edzocipo", "bakancs", "szandal"],
      en: ["shoe", "shoes", "sneaker", "sneakers", "running shoe", "basketball shoe", "boots", "sandals", "dunk"],
      cn: ["鞋", "鞋子", "运动鞋", "跑步鞋", "篮球鞋", "休闲鞋", "徒步", "越野", "户外", "低帮", "高帮", "DUNK"],
    },
  },
  {
    id: "sport",
    label: "Sport",
    priority: 1,
    keywords: {
      hu: ["sport", "edzo", "fut", "futas", "kosarlabda", "fitness"],
      en: ["sport", "sports", "running", "runner", "basketball", "training", "fitness", "gym", "workout"],
      cn: [],
    },
  },
  {
    id: "outdoor",
    label: "Outdoor",
    priority: 1,
    keywords: {
      hu: ["outdoor", "tura", "turazas", "turacipo", "bakancs", "terep", "kemping"],
      en: ["outdoor", "hiking", "trekking", "trail", "camping", "boots", "mountain"],
      cn: [],
    },
  },
  {
    id: "taska",
    label: "Táska",
    keywords: {
      hu: ["táska", "táskák", "hátizsák", "sporttáska", "oldaltáska", "kézitáska", "válltáska"],
      en: ["bag", "bags", "backpack", "shoulder bag", "tote bag", "bucket bag", "travel bag", "school bag", "makeup bag"],
      cn: ["包", "背包", "双肩包", "手提包", "单肩包", "斜挎包", "托特包", "水桶包", "购物袋", "旅行包", "书包", "化妆包"],
    },
  },
  {
    id: "ruha",
    label: "Női ruhák",
    keywords: {
      hu: ["ruha", "felső", "szoknya", "póló", "pulcsi", "pulóver", "ing", "melegítő"],
      en: ["dress", "top", "shirt", "t-shirt", "tee", "hoodie", "sweater", "outfit"],
      cn: ["衣", "上衣", "外套", "短袖", "长袖", "套装", "卫衣", "毛衣", "连衣裙", "衬衫", "T恤"],
    },
  },
  {
    id: "polo",
    label: "Póló / Ing",
    priority: 1,
    keywords: {
      hu: ["póló", "rövid ujjú", "hosszú ujjú"],
      en: ["t-shirt", "tee", "short sleeve", "long sleeve"],
      cn: ["短袖", "长袖", "T恤"],
    },
  },
  {
    id: "pulcsi",
    label: "Pulóver",
    priority: 1,
    keywords: {
      hu: ["pulcsi", "pulóver", "kapucnis pulóver"],
      en: ["hoodie", "sweater", "pullover"],
      cn: ["卫衣", "毛衣"],
    },
  },
  {
    id: "sapka",
    label: "Sapka",
    keywords: {
      hu: ["sapka", "kalap", "baseball sapka"],
      en: ["cap", "hat", "baseball cap", "beanie", "knit hat"],
      cn: ["帽", "帽子", "棒球帽", "鸭舌帽", "毛线帽", "针织帽"],
    },
  },
  {
    id: "sal",
    label: "Sál",
    keywords: {
      hu: ["sál", "nyaksál", "kendő", "csősál", "körsál", "téli sál", "gyapjú sál"],
      en: ["scarf", "neck scarf", "neck warmer", "winter scarf", "shawl", "wrap", "loop scarf", "infinity scarf"],
      cn: ["围巾", "围脖", "披肩"],
    },
  },
  {
    id: "nadrag",
    label: "Nadrág",
    keywords: {
      hu: ["nadrág", "farmer", "rövidnadrág", "melegítő nadrág"],
      en: ["pants", "trousers", "jeans", "shorts"],
      cn: ["裤", "长裤", "短裤", "牛仔裤"],
    },
  },
  {
    id: "kabat",
    label: "Kabát",
    priority: 1,
    keywords: {
      hu: ["kabát", "dzseki"],
      en: ["jacket", "coat", "down jacket"],
      cn: ["外套", "夹克", "羽绒服"],
    },
  },
  {
    id: "melleny",
    label: "Mellény",
    keywords: {
      hu: ["mellény"],
      en: ["vest"],
      cn: ["马甲"],
    },
  },
  {
    id: "furdoruha",
    label: "Fürdőruha",
    keywords: {
      hu: ["fürdőruha"],
      en: ["swimwear", "swimsuit"],
      cn: ["泳衣"],
    },
  },
  {
    id: "kategorizalatlan",
    label: UNCATEGORIZED_LABEL,
    keywords: {
      hu: [],
      en: [],
      cn: [],
    },
  },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORY_MAP.map((category) => [category.id, category]));

const CATEGORY_ALIAS_BY_KEY = {
  cipo: "cipo",
  cipok: "cipo",
  shoe: "cipo",
  shoes: "cipo",
  taska: "taska",
  bag: "taska",
  bags: "taska",
  ruha: "ruha",
  noi_ruha: "ruha",
  noi_ruhak: "ruha",
  polo: "polo",
  polo_ing: "polo",
  polo_inge: "polo",
  polo_ingek: "polo",
  ing: "polo",
  ingek: "polo",
  poló: "polo",
  pulcsi: "pulcsi",
  pulover: "pulcsi",
  pulóver: "pulcsi",
  sapka: "sapka",
  sal: "sal",
  nadrag: "nadrag",
  kabat: "kabat",
  melleny: "melleny",
  furdoruha: "furdoruha",
  furdo_ruha: "furdoruha",
  kategorizalatlan: "kategorizalatlan",
};

export function detectCategory(title) {
  return detectCategories(title)[0] || "";
}

export function detectCategories(title) {
  const haystack = normalizeSearchText(title);
  if (!haystack) return [];

  const matches = rankCategoryMatches(haystack);
  const best = matches[0];
  if (!best) return [];
  if (hasUncategorizedKeyword(haystack) && best.score <= CN_WEIGHT) return [];

  return matches.map((match) => match.category.id);
}

export function getCategoryLabel(categoryId) {
  return CATEGORY_BY_ID[categoryId]?.label || "";
}

export function normalizeCategoryId(value) {
  const key = normalizeCategoryKey(value);
  if (!key) return "";
  if (CATEGORY_BY_ID[key]) return key;
  return CATEGORY_ALIAS_BY_KEY[key] || "";
}

export function normalizeCategoryLabel(value) {
  const categoryId = normalizeCategoryId(value);
  if (categoryId) return getCategoryLabel(categoryId);
  return cleanCategoryLabel(value);
}

export function findCategoryByQuery(query) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return null;

  for (const category of CATEGORY_MAP) {
    if (normalizeSearchText(category.label) === normalizedQuery || category.id === normalizedQuery) {
      return category;
    }

    for (const keyword of categoryKeywords(category)) {
      if (normalizeSearchText(keyword) === normalizedQuery) return category;
    }
  }

  return null;
}

export function expandSearchQuery(query) {
  const terms = [normalizeSearchText(query)].filter(Boolean);
  const category = findCategoryByQuery(query);
  if (!category) return terms;

  for (const keyword of categoryKeywords(category)) {
    const normalizedKeyword = normalizeSearchText(keyword);
    if (normalizedKeyword) terms.push(normalizedKeyword);
  }

  return unique(terms);
}

export function isManifestCategory(categoryId, manifestCategories = []) {
  const label = getCategoryLabel(categoryId);
  if (!label) return false;
  return manifestCategories.some((category) => normalizeSearchText(category) === normalizeSearchText(label));
}

export function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function scoreCategory(category, haystack) {
  let score = 0;
  let longestKeyword = "";

  for (const [language, keywords] of Object.entries(category.keywords || {})) {
    const weight = language === "cn" ? CN_WEIGHT : DEFAULT_WEIGHT;
    for (const keyword of keywords || []) {
      const normalizedKeyword = normalizeSearchText(keyword);
      if (!normalizedKeyword || !haystack.includes(normalizedKeyword)) continue;
      score += weight;
      if (normalizedKeyword.length > longestKeyword.length) longestKeyword = normalizedKeyword;
    }
  }

  return { score, longestKeyword };
}

function rankCategoryMatches(haystack) {
  return CATEGORY_MAP.map((category) => ({ category, ...scoreCategory(category, haystack) }))
    .filter((match) => match.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.longestKeyword.length !== a.longestKeyword.length) return b.longestKeyword.length - a.longestKeyword.length;
      return categoryPriority(b.category) - categoryPriority(a.category);
    });
}

function hasUncategorizedKeyword(haystack) {
  return UNCATEGORIZED_KEYWORDS.some((keyword) => haystack.includes(normalizeSearchText(keyword)));
}

function categoryKeywords(category) {
  return Object.values(category.keywords || {}).flat();
}

function categoryPriority(category) {
  return Number.isFinite(category.priority) ? category.priority : 0;
}

function normalizeCategoryKey(value) {
  return normalizeSearchText(value)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function cleanCategoryLabel(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function unique(values) {
  return Array.from(new Set(values));
}
