export const CATEGORY_MAP = [
  {
    id: "cipo",
    label: "Cipő",
    keywords: {
      hu: ["cipő", "sportcipő", "bakancs", "szandál"],
      en: ["shoe", "shoes", "sneaker", "boots", "sandals"],
      cn: ["鞋", "运动鞋", "靴", "凉鞋"],
    },
  },
  {
    id: "taska",
    label: "Táska",
    keywords: {
      hu: ["táska", "hátizsák", "sporttáska", "oldaltáska"],
      en: ["bag", "backpack", "shoulder bag", "sport bag"],
      cn: ["包", "背包", "双肩包", "手提包"],
    },
  },
  {
    id: "nadrag_hosszu",
    label: "Nadrág (hosszú)",
    keywords: {
      hu: ["nadrág", "farmer", "melegítő nadrág"],
      en: ["pants", "trousers", "jeans"],
      cn: ["裤", "长裤", "牛仔裤"],
    },
  },
  {
    id: "nadrag_rovid",
    label: "Nadrág (rövid)",
    keywords: {
      hu: ["rövidnadrág", "short"],
      en: ["shorts"],
      cn: ["短裤"],
    },
  },
  {
    id: "noi_ruha",
    label: "Női ruhák",
    keywords: {
      hu: ["ruha", "szoknya", "felső", "melegítő"],
      en: ["dress", "skirt", "top", "outfit"],
      cn: ["裙", "连衣裙", "女装", "上衣"],
    },
  },
  {
    id: "lego",
    label: "Lego",
    keywords: {
      hu: ["lego"],
      en: ["lego", "building blocks"],
      cn: ["乐高", "积木"],
    },
  },
  {
    id: "kabat",
    label: "Kabát",
    keywords: {
      hu: ["kabát", "dzseki"],
      en: ["jacket", "coat"],
      cn: ["外套", "夹克"],
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
    id: "sapka",
    label: "Sapka",
    keywords: {
      hu: ["sapka", "kalap"],
      en: ["cap", "hat"],
      cn: ["帽", "帽子"],
    },
  },
  {
    id: "polo_ing",
    label: "Póló / Ing",
    keywords: {
      hu: ["póló", "ing"],
      en: ["t-shirt", "shirt"],
      cn: ["T恤", "衬衫"],
    },
  },
  {
    id: "pulover",
    label: "Pulóver",
    keywords: {
      hu: ["pulóver"],
      en: ["hoodie", "sweater"],
      cn: ["卫衣", "毛衣"],
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
    id: "sal",
    label: "Sál",
    keywords: {
      hu: ["sál", "nyaksál", "kendő", "csősál", "körsál", "téli sál", "gyapjú sál"],
      en: ["scarf", "neck scarf", "neck warmer", "winter scarf", "shawl", "wrap", "loop scarf", "infinity scarf"],
      cn: ["围巾", "围脖", "披肩", "围巾女", "围巾男", "冬季围巾"],
    },
  },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORY_MAP.map((category) => [category.id, category]));

export function detectCategory(title) {
  const haystack = normalizeSearchText(title);
  if (!haystack) return "";

  let match = null;

  for (const category of CATEGORY_MAP) {
    for (const keyword of categoryKeywords(category)) {
      const normalizedKeyword = normalizeSearchText(keyword);
      if (!normalizedKeyword || !haystack.includes(normalizedKeyword)) continue;
      if (!match || normalizedKeyword.length > match.keyword.length) {
        match = { category, keyword: normalizedKeyword };
      }
    }
  }

  return match ? match.category.id : "";
}

export function getCategoryLabel(categoryId) {
  return CATEGORY_BY_ID[categoryId]?.label || "";
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

export function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function categoryKeywords(category) {
  return Object.values(category.keywords || {}).flat();
}
