import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_KEYWORD_BANK = "attached_assets/CABL_Yemen_Keyword_Bank_With_Earpods_Hollyland_1789951960574.csv";

const brandAliases = [
  { slug: "anker", values: ["anker", "انكر"] },
  { slug: "baseus", values: ["baseus", "بيسوس"] },
  { slug: "vention", values: ["vention", "فنتشن"] },
  { slug: "ugreen", values: ["ugreen", "يوقرين"] },
  { slug: "soundcore", values: ["soundcore", "ساوندكور"] },
  { slug: "hollyland", values: ["hollyland", "هوليلاند"] },
];

const groupProfiles = {
  Chargers: { guideRoute: "/guides/chargers-yemen", categorySlug: "chargers", supportsBrandRoutes: true },
  Cables: { guideRoute: "/guides/charging-cables-yemen", categorySlug: "charging-cables", supportsBrandRoutes: true },
  "Power Banks": { guideRoute: "/guides/power-banks-yemen", categorySlug: "power-banks", supportsBrandRoutes: true },
  "Hubs & Adapters": { guideRoute: "/guides/hubs-adapters-yemen", categorySlug: "phone-accessories", supportsBrandRoutes: true },
  "Phone/Device Accessories": { guideRoute: "/guides/hubs-adapters-yemen", categorySlug: "phone-accessories", supportsBrandRoutes: true },
  "Power Stations & Charging": { guideRoute: "/guides/chargers-yemen", categorySlug: "chargers", supportsBrandRoutes: false },
  "Wireless Charging": { guideRoute: "/guides/chargers-yemen", categorySlug: "chargers", supportsBrandRoutes: false },
  "Car Charging": { guideRoute: "/guides/travel-car-charging-yemen", categorySlug: "travel-adapters", supportsBrandRoutes: false },
  "Earpods / Wireless Earbuds": { guideRoute: "/guides/wireless-earbuds-yemen", categorySlug: "wireless-earbuds", supportsBrandRoutes: true },
  "Hollyland Wireless Microphone": { guideRoute: "/guides/wireless-microphones-yemen", categorySlug: "wireless-microphones", supportsBrandRoutes: true },
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const input = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const next = input[index + 1];
    if (character === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    if (row.some((value) => value.trim() !== "")) rows.push(row);
  }

  const headers = rows.shift()?.map((header) => header.trim()) || [];
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, (values[index] || "").trim()])));
}

function normalize(value) {
  return String(value || "")
    .toLocaleLowerCase("ar-YE")
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function publicCategorySlug(slug) {
  return {
    "charging-cables": "cables",
    "travel-adapters": "car-accessories",
    "phone-accessories": "hubs-adapters",
  }[slug] || slug;
}

function productPath(product) {
  return product.brandSlug && product.category?.slug
    ? `/${product.brandSlug}/${publicCategorySlug(product.category.slug)}/${product.slug}`
    : `/product/${product.slug}`;
}

function detectBrand(keyword) {
  const value = normalize(keyword);
  return brandAliases.find((brand) => brand.values.some((alias) => value.split(" ").includes(normalize(alias)))) || null;
}

function modelMatch(keyword, product) {
  const value = normalize(keyword);
  const productText = normalize(`${product.productName} ${product.sku}`);
  const modelTokens = productText
    .split(" ")
    .filter((token) => /\d/.test(token) || /[a-z]/i.test(token))
    .filter((token) => token.length >= 2);
  return modelTokens.some((token) => value.split(" ").includes(token));
}

function routeForKeyword(row, products, routeSet) {
  const profile = groupProfiles[row.Category] || groupProfiles.Chargers;
  const brand = detectBrand(row.Keyword);

  const matchedProduct = products.find((product) =>
    product.category?.slug === profile.categorySlug
    && modelMatch(row.Keyword, product)
    && (!brand || product.brandSlug === brand.slug),
  );
  if (matchedProduct && routeSet.has(productPath(matchedProduct))) return productPath(matchedProduct);

  if (brand && profile.supportsBrandRoutes) {
    const brandCategoryPath = `/${brand.slug}/${publicCategorySlug(profile.categorySlug)}`;
    if (routeSet.has(brandCategoryPath)) return brandCategoryPath;
    const brandPath = `/brand/${brand.slug}`;
    if (routeSet.has(brandPath)) return brandPath;
  }

  return profile.guideRoute;
}

function preferredTerms(rows, limit = 3) {
  const seen = new Set();
  return rows
    .filter((row) => row.Priority === "P1")
    .sort((a, b) => a.Keyword.length - b.Keyword.length)
    .map((row) => row.Keyword)
    .filter((keyword) => {
      const key = normalize(keyword);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

export async function loadKeywordBank(root = process.cwd()) {
  const relativePath = process.env.CABL_KEYWORD_BANK || DEFAULT_KEYWORD_BANK;
  const candidates = [
    path.resolve(root, relativePath),
    path.resolve(root, "..", "..", relativePath),
  ];
  let text;
  let lastError;
  for (const candidate of candidates) {
    try {
      text = await fs.readFile(candidate, "utf8");
      break;
    } catch (error) {
      lastError = error;
    }
  }
  if (text === undefined) throw lastError;
  const rows = parseCsv(text).filter((row) => row.Keyword && groupProfiles[row.Category]);
  const unique = new Map();
  for (const row of rows) {
    const key = row.Keyword.trim();
    if (!unique.has(key)) unique.set(key, row);
  }
  return [...unique.values()];
}

export function distributeKeywordBank(rows, products, routes) {
  const routeSet = new Set(routes.keys());
  const assignments = new Map([...routeSet].map((route) => [route, []]));
  for (const row of rows) {
    const route = routeForKeyword(row, products, routeSet);
    const target = assignments.get(route);
    if (!target) throw new Error(`Keyword bank route is not registered: ${route}`);
    target.push(row);
  }
  return assignments;
}

export function keywordMetadata(rows, baseDescription) {
  const terms = preferredTerms(rows, 2);
  if (!terms.length) return { description: baseDescription, primaryTerms: [] };
  const suffix = ` يشمل ذلك البحث عن ${terms.join(" و")}.`;
  const description = `${baseDescription}${suffix}`;
  return {
    description: description.length <= 160 ? description : baseDescription,
    primaryTerms: terms,
  };
}

export function keywordCoverageStats(rows, assignments) {
  const assigned = [...assignments.values()].reduce((total, routeRows) => total + routeRows.length, 0);
  return { source: rows.length, assigned, unused: rows.length - assigned };
}
