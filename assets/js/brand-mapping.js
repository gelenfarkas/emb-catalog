import { appendVersion } from "./cache-utils.js";

const { normalizeSearchText } = await import(appendVersion("./category-mapping.js"));

const CONTEXT_WEIGHT = 2;
const DEFAULT_WEIGHT = 1;

export const BRAND_MAP = [
  {
    id: "nike",
    label: "Nike",
    keywords: ["nike", "耐克", "dunk", "air force", "vomero", "kobe"],
    tokenKeywords: ["nk"],
  },
  {
    id: "jordan",
    label: "Jordan",
    keywords: ["jordan", "air jordan", "乔丹", "aj1", "aj4", "aj12", "aj14"],
  },
  {
    id: "balenciaga",
    label: "Balenciaga",
    keywords: ["balenciaga", "巴黎世家", "triple s", "3xl", "radar"],
    compactKeywords: ["balenciag"],
  },
  {
    id: "on_cloud",
    label: "On Cloud",
    keywords: ["cloudswift", "cloudtilt", "cloudventure", "cloudmonster", "昂跑", "kith x on"],
    contextualKeywords: ["on", "cloud"],
    contextKeywords: ["昂跑", "running", "runner", "shoe", "shoes", "sneaker", "run", "kith", "paf"],
  },
  {
    id: "hoka",
    label: "Hoka",
    keywords: ["hoka", "one one", "mafate"],
  },
  {
    id: "adidas",
    label: "Adidas",
    keywords: ["adidas", "阿迪"],
    tokenKeywords: ["ad"],
  },
  {
    id: "ralph_lauren",
    label: "Ralph Lauren",
    keywords: ["ralph lauren", "拉夫劳伦"],
    tokenKeywords: ["rl"],
  },
  {
    id: "gucci",
    label: "Gucci",
    keywords: ["gucci", "古驰", "screener"],
    compactKeywords: ["gucci"],
  },
  {
    id: "iphone",
    label: "iPhone",
    keywords: ["iphone", "apple iphone", "苹果手机"],
    contextualKeywords: ["apple", "苹果"],
    contextKeywords: ["iphone", "phone", "case", "手机", "手机壳"],
  },
  {
    id: "fear_of_god_essentials",
    label: "Fear of God / Essentials",
    keywords: ["fear of god", "essentials"],
    tokenKeywords: ["fog"],
    compactKeywords: ["fearofgod", "essentialszone"],
  },
  {
    id: "travis_scott",
    label: "Travis Scott",
    keywords: ["travis scott"],
  },
  {
    id: "syna_world",
    label: "Syna World",
    keywords: ["syna world", "synaworld"],
    compactKeywords: ["syna"],
  },
  {
    id: "corteiz",
    label: "Corteiz",
    keywords: ["corteiz"],
    compactKeywords: ["corteiz"],
  },
  {
    id: "trapstar",
    label: "Trapstar",
    keywords: ["trapstar"],
    compactKeywords: ["trapstar"],
  },
  {
    id: "asics",
    label: "Asics",
    keywords: ["asics", "亚瑟士"],
  },
  {
    id: "chanel",
    label: "Chanel",
    keywords: ["chanel", "香奈儿"],
    compactKeywords: ["chanel"],
  },
  {
    id: "dior",
    label: "Dior",
    keywords: ["dior", "迪奥"],
    compactKeywords: ["dior"],
  },
  {
    id: "new_balance",
    label: "New Balance",
    keywords: ["new balance", "新百伦"],
    tokenKeywords: ["nb"],
  },
  {
    id: "converse",
    label: "Converse",
    keywords: ["converse", "匡威"],
  },
  {
    id: "north_face",
    label: "North Face",
    keywords: ["the north face", "north face", "北面", "乐斯菲斯"],
  },
  {
    id: "norda",
    label: "Norda",
    keywords: ["norda", "诺达"],
  },
  {
    id: "supreme",
    label: "Supreme",
    keywords: ["supreme"],
  },
  {
    id: "louis_vuitton",
    label: "Louis Vuitton",
    keywords: ["louis vuitton", "路易威登"],
    contextualKeywords: ["lv"],
    contextKeywords: ["watch", "scarf", "bag", "wallet", "belt", "monogram", "louis", "vuitton", "手表", "围巾", "包", "钱包", "腰带"],
  },
  {
    id: "burberry",
    label: "Burberry",
    keywords: ["burberry"],
    compactKeywords: ["burberr"],
  },
];

export const BRAND_BY_ID = Object.fromEntries(BRAND_MAP.map((brand) => [brand.id, brand]));

export function detectBrands(title) {
  const haystack = normalizeSearchText(title);
  const tokenText = normalizeTokenText(title);
  const compactText = normalizeCompactText(title);
  if (!haystack || !tokenText) return [];

  const tokens = tokenize(tokenText);
  const matches = BRAND_MAP.map((brand) => ({ brand, ...scoreBrand(brand, { haystack, tokenText, compactText, tokens }) }))
    .filter((match) => match.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.longestKeyword.length !== a.longestKeyword.length) return b.longestKeyword.length - a.longestKeyword.length;
      return 0;
    });

  return uniqueLabels(matches.map((match) => match.brand.label));
}

export function normalizeBrandLabel(value) {
  const normalized = normalizeSearchText(value);
  if (!normalized) return "";

  for (const brand of BRAND_MAP) {
    if (normalizeSearchText(brand.label) === normalized || brand.id === normalized.replace(/[^a-z0-9]+/g, "_")) {
      return brand.label;
    }
  }

  return String(value || "").replace(/\s+/g, " ").trim();
}

function scoreBrand(brand, context) {
  let score = 0;
  let longestKeyword = "";

  for (const keyword of brand.keywords || []) {
    const normalizedKeyword = matchKeyword(context, keyword);
    if (!normalizedKeyword) continue;
    score += DEFAULT_WEIGHT;
    if (normalizedKeyword.length > longestKeyword.length) longestKeyword = normalizedKeyword;
  }

  for (const keyword of brand.tokenKeywords || []) {
    const normalizedKeyword = normalizeTokenText(keyword);
    if (!normalizedKeyword || !context.tokens.has(normalizedKeyword)) continue;
    score += DEFAULT_WEIGHT;
    if (normalizedKeyword.length > longestKeyword.length) longestKeyword = normalizedKeyword;
  }

  for (const keyword of brand.compactKeywords || []) {
    const normalizedKeyword = normalizeCompactText(keyword);
    if (!normalizedKeyword || !context.compactText.includes(normalizedKeyword)) continue;
    score += DEFAULT_WEIGHT;
    if (normalizedKeyword.length > longestKeyword.length) longestKeyword = normalizedKeyword;
  }

  for (const keyword of brand.contextualKeywords || []) {
    const normalizedKeyword = matchKeyword(context, keyword);
    if (!normalizedKeyword) continue;
    if (!hasContext(context, brand.contextKeywords || [])) continue;
    score += CONTEXT_WEIGHT;
    if (normalizedKeyword.length > longestKeyword.length) longestKeyword = normalizedKeyword;
  }

  return { score, longestKeyword };
}

function matchKeyword(context, keyword) {
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

function normalizeTokenText(value) {
  return normalizeSearchText(value)
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCompactText(value) {
  return normalizeSearchText(value).replace(/[^a-z0-9\u4e00-\u9fff]+/g, "");
}

function tokenize(value) {
  return new Set(normalizeTokenText(value).split(" ").filter(Boolean));
}

function containsCjk(value) {
  return /[\u4e00-\u9fff]/.test(String(value || ""));
}

function uniqueLabels(values) {
  const labels = [];
  const seen = new Set();

  for (const value of values || []) {
    const label = normalizeBrandLabel(value);
    const key = normalizeSearchText(label);
    if (!label || seen.has(key)) continue;
    seen.add(key);
    labels.push(label);
  }

  return labels;
}
