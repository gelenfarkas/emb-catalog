export const UNCATEGORIZED_LABEL = "Kategorizálatlan";

const CN_WEIGHT = 2;
const DEFAULT_WEIGHT = 1;

const UNCATEGORIZED_KEYWORDS = ["耳机"];

export const CATEGORY_MAP = [
  {
    id: "cipo",
    label: "Cipő",
    keywords: {
      hu: ["cipő", "cipők", "sportcipő", "edzőcipő", "bakancs", "szandál", "szandal"],
      en: ["shoe", "shoes", "sneaker", "sneakers", "running shoe", "basketball shoe", "boots", "sandals", "trainer"],
      cn: ["鞋子", "运动鞋", "跑步鞋", "篮球鞋", "休闲鞋", "徒步鞋", "低帮", "高帮", "板鞋", "帆布鞋", "凉鞋"],
    },
  },
  {
    id: "sport",
    label: "Sport",
    priority: 1,
    keywords: {
      hu: ["sport", "edző", "edzo", "futás", "futas", "kosárlabda", "kosarlabda", "fitness"],
      en: ["sport", "sports", "running", "runner", "basketball", "training", "fitness", "gym", "workout"],
      cn: ["运动", "篮球", "训练", "健身"],
    },
  },
  {
    id: "outdoor",
    label: "Outdoor",
    priority: 1,
    keywords: {
      hu: ["outdoor", "túra", "tura", "túrázás", "turazas", "túracipő", "turacipo", "terep", "kemping"],
      en: ["outdoor", "hiking", "trekking", "trail", "camping", "mountain"],
      cn: ["户外", "登山", "徒步", "越野"],
    },
  },
  {
    id: "taska",
    label: "Táska",
    keywords: {
      hu: ["táska", "táskák", "hátizsák", "hatizsak", "sporttáska", "oldaltáska", "kézitáska", "kezitaska", "válltáska", "valltaska"],
      en: ["bag", "bags", "backpack", "shoulder bag", "tote bag", "bucket bag", "travel bag", "school bag", "makeup bag"],
      cn: ["背包", "双肩包", "手提包", "单肩包", "斜挎包", "托特包", "水桶包", "购物袋", "旅行包", "书包", "化妆包"],
    },
  },
  {
    id: "ruha",
    label: "Női ruhák",
    priority: 1,
    contextualKeywords: {
      hu: ["női", "noi", "lány", "lany"],
      en: ["woman", "women", "girl", "girls", "lady", "ladies", "female"],
      cn: ["女", "女士", "女款", "女装", "女生"],
    },
    contextKeywords: {
      hu: ["ruha", "felső", "felso", "szoknya", "póló", "polo", "pulcsi", "pulóver", "pulover", "ing", "kabát", "kabat", "dzseki", "mellény", "melleny"],
      en: ["dress", "shirt", "t shirt", "tee", "hoodie", "sweater", "pullover", "blouse", "jacket", "coat", "skirt"],
      cn: ["连衣裙", "裙子", "上衣", "短袖", "长袖", "卫衣", "毛衣", "衬衫", "外套", "夹克"],
    },
  },
  {
    id: "polo",
    label: "Póló / Ing",
    priority: 1,
    keywords: {
      hu: ["póló", "polo", "rövid ujjú", "rovid ujju", "hosszú ujjú", "hosszu ujju", "ing"],
      en: ["t shirt", "tee", "short sleeve", "long sleeve", "shirt"],
      cn: ["短袖", "长袖", "衬衫", "t恤"],
    },
  },
  {
    id: "pulcsi",
    label: "Pulóver",
    priority: 1,
    keywords: {
      hu: ["pulcsi", "pulóver", "pulover", "kapucnis pulóver", "kapucnis pulover"],
      en: ["hoodie", "sweater", "pullover", "hooded sweatshirt"],
      cn: ["卫衣", "毛衣", "帽衫"],
    },
  },
  {
    id: "sapka",
    label: "Sapka",
    keywords: {
      hu: ["sapka", "kalap", "baseball sapka"],
      en: ["cap", "hat", "baseball cap", "beanie", "knit hat"],
      cn: ["帽子", "棒球帽", "鸭舌帽", "毛线帽", "针织帽"],
    },
  },
  {
    id: "sal",
    label: "Sál",
    keywords: {
      hu: ["sál", "sal", "nyaksál", "nyaksal", "kendő", "kendo", "csősál", "csosal", "körsál", "korsal", "téli sál", "teli sal", "gyapjú sál", "gyapju sal"],
      en: ["scarf", "neck scarf", "neck warmer", "winter scarf", "shawl", "wrap", "loop scarf", "infinity scarf"],
      cn: ["围巾", "围脖", "披肩"],
    },
  },
  {
    id: "nadrag",
    label: "Nadrág",
    keywords: {
      hu: ["nadrág", "nadrag", "farmer", "rövidnadrág", "rovidnadrag", "melegítő nadrág", "melegito nadrag"],
      en: ["trousers", "cargo pants", "track pants", "sweatpants", "joggers"],
      cn: ["长裤", "短裤", "牛仔裤", "裤子", "休闲裤", "卫裤", "工装裤"],
    },
  },
  {
    id: "kabat",
    label: "Kabát",
    priority: 1,
    keywords: {
      hu: ["kabát", "kabat", "dzseki"],
      en: ["jacket", "coat", "down jacket", "puffer"],
      cn: ["外套", "夹克", "羽绒服", "棉服"],
    },
  },
  {
    id: "melleny",
    label: "Mellény",
    keywords: {
      hu: ["mellény", "melleny"],
      en: ["vest", "gilet"],
      cn: ["马甲"],
    },
  },
  {
    id: "furdoruha",
    label: "Fürdőruha",
    keywords: {
      hu: ["fürdőruha", "furdoruha"],
      en: ["swimwear", "swimsuit", "bikini"],
      cn: ["泳衣", "比基尼"],
    },
  },
  {
    id: "ora",
    label: "Óra",
    keywords: {
      hu: ["óra", "ora", "karóra", "karora"],
      en: ["watch", "wrist watch"],
      cn: ["手表"],
    },
  },
  {
    id: "ov",
    label: "Öv",
    keywords: {
      hu: ["öv", "ov"],
      en: ["belt"],
      cn: ["腰带", "皮带"],
    },
  },
  {
    id: "zokni",
    label: "Zokni",
    keywords: {
      hu: ["zokni"],
      en: ["sock", "socks"],
      cn: ["袜子", "长袜", "短袜"],
    },
  },
  {
    id: "takaro_pled",
    label: "Takaró / Pléd",
    keywords: {
      hu: ["takaró", "takaro", "pléd", "pled"],
      en: ["blanket", "throw"],
      cn: ["毛毯", "毯子"],
    },
  },
  {
    id: "penztarca",
    label: "Pénztárca",
    keywords: {
      hu: ["pénztárca", "penztarca", "pénztárca szett", "penztarca szett", "kártyatartó", "kartyatarto"],
      en: ["wallet", "card holder", "coin purse"],
      cn: ["钱包", "卡包", "钱夹", "零钱包"],
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
  polo_ingek: "polo",
  ing: "polo",
  pulcsi: "pulcsi",
  pulover: "pulcsi",
  sapka: "sapka",
  sal: "sal",
  nadrag: "nadrag",
  kabat: "kabat",
  melleny: "melleny",
  furdoruha: "furdoruha",
  furdo_ruha: "furdoruha",
  ora: "ora",
  watch: "ora",
  ov: "ov",
  belt: "ov",
  zokni: "zokni",
  sock: "zokni",
  socks: "zokni",
  takaro: "takaro_pled",
  takaro_pled: "takaro_pled",
  pled: "takaro_pled",
  blanket: "takaro_pled",
  penztarca: "penztarca",
  wallet: "penztarca",
  card_holder: "penztarca",
  kategorizalatlan: "kategorizalatlan",
};

export function detectCategory(title) {
  return detectCategories(title)[0] || "";
}

export function detectCategories(title) {
  const haystack = normalizeSearchText(title);
  const tokenText = normalizeTokenText(title);
  if (!haystack || !tokenText) return [];

  const tokens = tokenize(tokenText);
  const matches = rankCategoryMatches({ haystack, tokenText, tokens });
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
  const normalizedTokenQuery = normalizeTokenText(query);
  if (!normalizedQuery) return null;

  for (const category of CATEGORY_MAP) {
    if (normalizeSearchText(category.label) === normalizedQuery || category.id === normalizedQuery) {
      return category;
    }

    for (const keyword of categoryKeywords(category)) {
      const normalizedKeyword = normalizeTokenText(keyword);
      if (!normalizedKeyword) continue;
      if (normalizedKeyword === normalizedTokenQuery) return category;
    }
  }

  return null;
}

export function expandSearchQuery(query) {
  const terms = [normalizeTokenText(query)].filter(Boolean);
  const category = findCategoryByQuery(query);
  if (!category) return terms;

  for (const keyword of categoryKeywords(category)) {
    const normalizedKeyword = normalizeTokenText(keyword);
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

function scoreCategory(category, context) {
  let score = 0;
  let longestKeyword = "";

  for (const [language, keywords] of Object.entries(category.keywords || {})) {
    const weight = language === "cn" ? CN_WEIGHT : DEFAULT_WEIGHT;
    for (const keyword of keywords || []) {
      const normalizedKeyword = matchedKeyword(context, keyword);
      if (!normalizedKeyword) continue;
      score += weight;
      if (normalizedKeyword.length > longestKeyword.length) longestKeyword = normalizedKeyword;
    }
  }

  for (const keyword of contextualCategoryKeywords(category)) {
    const normalizedKeyword = matchedKeyword(context, keyword);
    if (!normalizedKeyword) continue;
    if (!hasContext(context, contextualCategoryContexts(category))) continue;
    score += DEFAULT_WEIGHT;
    if (normalizedKeyword.length > longestKeyword.length) longestKeyword = normalizedKeyword;
  }

  return { score, longestKeyword };
}

function rankCategoryMatches(context) {
  return CATEGORY_MAP.map((category) => ({ category, ...scoreCategory(category, context) }))
    .filter((match) => match.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.longestKeyword.length !== a.longestKeyword.length) return b.longestKeyword.length - a.longestKeyword.length;
      return categoryPriority(b.category) - categoryPriority(a.category);
    });
}

function matchedKeyword(context, keyword) {
  const normalizedKeyword = normalizeTokenText(keyword);
  if (!normalizedKeyword) return "";
  if (matchesKeyword(context, keyword)) return normalizedKeyword;
  return "";
}

function matchesKeyword(context, keyword) {
  const normalizedKeyword = normalizeTokenText(keyword);
  if (!normalizedKeyword) return false;
  if (containsCjk(keyword)) return context.haystack.includes(normalizeSearchText(keyword));
  if (normalizedKeyword.includes(" ")) return context.tokenText.includes(normalizedKeyword);
  return context.tokens.has(normalizedKeyword);
}

function hasContext(context, contextKeywords) {
  return (contextKeywords || []).some((keyword) => matchesKeyword(context, keyword));
}

function hasUncategorizedKeyword(haystack) {
  return UNCATEGORIZED_KEYWORDS.some((keyword) => haystack.includes(normalizeSearchText(keyword)));
}

function categoryKeywords(category) {
  return [
    ...Object.values(category.keywords || {}).flat(),
    ...contextualCategoryKeywords(category),
  ];
}

function contextualCategoryKeywords(category) {
  return Object.values(category.contextualKeywords || {}).flat();
}

function contextualCategoryContexts(category) {
  return Object.values(category.contextKeywords || {}).flat();
}

function categoryPriority(category) {
  return Number.isFinite(category.priority) ? category.priority : 0;
}

function normalizeCategoryKey(value) {
  return normalizeSearchText(value)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeTokenText(value) {
  return normalizeSearchText(value)
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  return new Set(normalizeTokenText(value).split(" ").filter(Boolean));
}

function containsCjk(value) {
  return /[\u4e00-\u9fff]/.test(String(value || ""));
}

function cleanCategoryLabel(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function unique(values) {
  return Array.from(new Set(values));
}
