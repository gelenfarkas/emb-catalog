export const UNKNOWN_SHIPPING_LABEL = "Ismeretlen";

export const SHIPPING_CATEGORY_RULES = {
  cipo: {
    label: "Cipő",
    estimatedWeightKg: 1.4,
    estimatedSize: "medium",
    dhlEstimateHuf: 8500,
  },
  taska: {
    label: "Táska",
    estimatedWeightKg: 1.2,
    estimatedSize: "medium",
    dhlEstimateHuf: 7900,
  },
  nadrag: {
    label: "Nadrág",
    estimatedWeightKg: 0.7,
    estimatedSize: "small",
    dhlEstimateHuf: 5900,
  },
  polo: {
    label: "Póló / Ing",
    estimatedWeightKg: 0.5,
    estimatedSize: "small",
    dhlEstimateHuf: 4900,
  },
  polo_ing: {
    label: "Póló / Ing",
    estimatedWeightKg: 0.5,
    estimatedSize: "small",
    dhlEstimateHuf: 4900,
  },
  pulcsi: {
    label: "Pulóver",
    estimatedWeightKg: 0.9,
    estimatedSize: "small-medium",
    dhlEstimateHuf: 6500,
  },
  pulover: {
    label: "Pulóver",
    estimatedWeightKg: 0.9,
    estimatedSize: "small-medium",
    dhlEstimateHuf: 6500,
  },
  kabat: {
    label: "Kabát",
    estimatedWeightKg: 1.8,
    estimatedSize: "large",
    dhlEstimateHuf: 9900,
  },
  melleny: {
    label: "Mellény",
    estimatedWeightKg: 0.8,
    estimatedSize: "small-medium",
    dhlEstimateHuf: 6200,
  },
  sapka: {
    label: "Sapka",
    estimatedWeightKg: 0.3,
    estimatedSize: "small",
    dhlEstimateHuf: 3900,
  },
  sal: {
    label: "Sál",
    estimatedWeightKg: 0.4,
    estimatedSize: "small",
    dhlEstimateHuf: 3900,
  },
  furdoruha: {
    label: "Fürdőruha",
    estimatedWeightKg: 0.3,
    estimatedSize: "small",
    dhlEstimateHuf: 3900,
  },
  ruha: {
    label: "Női ruhák",
    estimatedWeightKg: 0.8,
    estimatedSize: "small-medium",
    dhlEstimateHuf: 6500,
  },
  noi_ruha: {
    label: "Női ruhák",
    estimatedWeightKg: 0.8,
    estimatedSize: "small-medium",
    dhlEstimateHuf: 6500,
  },
  lego: {
    label: "Lego",
    estimatedWeightKg: 1.6,
    estimatedSize: "medium-large",
    dhlEstimateHuf: 9200,
  },
};

const CATEGORY_ALIASES = {
  cipő: "cipo",
  cipo: "cipo",
  táska: "taska",
  taska: "taska",
  nadrág: "nadrag",
  nadrag: "nadrag",
  póló: "polo",
  polo: "polo",
  ing: "polo",
  pulcsi: "pulcsi",
  pulóver: "pulcsi",
  pulover: "pulcsi",
  kabát: "kabat",
  kabat: "kabat",
  mellény: "melleny",
  melleny: "melleny",
  sapka: "sapka",
  sál: "sal",
  sal: "sal",
  fürdőruha: "furdoruha",
  furdoruha: "furdoruha",
  ruha: "ruha",
  "női ruhák": "noi_ruha",
  "noi ruhak": "noi_ruha",
  noi_ruhak: "noi_ruha",
  lego: "lego",
};

export function estimateShippingForProduct(product) {
  return estimateShipping({
    categoryIds: product?.categoryIds || [product?.categoryId],
    categories: product?.categories || [product?.categoryLabel || product?.category],
  });
}

export function estimateShipping({ categoryIds = [], categories = [] } = {}) {
  const rule = [...categoryIds, ...categories]
    .map(resolveRule)
    .filter(Boolean)
    .sort((a, b) => b.dhlEstimateHuf - a.dhlEstimateHuf)[0];

  if (!rule) {
    return {
      known: false,
      label: UNKNOWN_SHIPPING_LABEL,
      displayHuf: UNKNOWN_SHIPPING_LABEL,
      dhlEstimateHuf: null,
      estimatedWeightKg: null,
      estimatedSize: "",
      sourceCategory: "",
    };
  }

  return {
    known: true,
    label: rule.label,
    displayHuf: formatHuf(rule.dhlEstimateHuf),
    dhlEstimateHuf: rule.dhlEstimateHuf,
    estimatedWeightKg: rule.estimatedWeightKg,
    estimatedSize: rule.estimatedSize,
    sourceCategory: rule.label,
  };
}

function resolveRule(value) {
  const key = normalizeCategoryKey(value);
  return SHIPPING_CATEGORY_RULES[key] || SHIPPING_CATEGORY_RULES[CATEGORY_ALIASES[key]] || null;
}

function normalizeCategoryKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function formatHuf(value) {
  return `${new Intl.NumberFormat("hu-HU").format(value)} Ft`;
}
