import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const devDomain = process.env.REPLIT_DEV_DOMAIN;
const apiBase = (process.env.API_URL || (devDomain ? `https://${devDomain}/api` : "http://127.0.0.1:8080/api")).replace(/\/$/, "");
const storeBase = process.env.STORE_URL || (devDomain ? `https://${devDomain}/cabl-store/` : "http://127.0.0.1:25770/cabl-store/");
const chromium = process.env.CHROMIUM_BIN || "chromium";

async function request(path) {
  const response = await fetch(`${apiBase}${path}`);
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  assert.equal(response.ok, true, `${path} should return a successful response, got ${response.status}: ${text}`);
  return body;
}

function publicCategorySlug(slug) {
  return {
    "charging-cables": "cables",
    "travel-adapters": "car-accessories",
    "phone-accessories": "hubs-adapters",
  }[slug] || slug;
}

function routeUrl(path) {
  return new URL(path.replace(/^\/+/, ""), storeBase).toString();
}

async function render(path) {
  const url = routeUrl(path);
  const { stdout, stderr } = await execFileAsync(chromium, [
    "--headless",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--dump-dom",
    "--virtual-time-budget=20000",
    url,
  ], {
    maxBuffer: 8 * 1024 * 1024,
    timeout: 45_000,
  });
  if (!stdout.trim()) {
    throw new Error(`Chromium returned an empty DOM for ${url}${stderr ? `\n${stderr}` : ""}`);
  }
  return stdout;
}

function bodyText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, value) => String.fromCodePoint(Number.parseInt(value, 16)))
    .replace(/&#([0-9]+);/g, (_, value) => String.fromCodePoint(Number(value)))
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function tags(html, tagName) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, "gi"))].map((match) => match[0]);
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1] || null;
}

function metadata(html, name) {
  const tag = tags(html, "meta").find((candidate) => attribute(candidate, "name")?.toLowerCase() === name);
  return tag ? attribute(tag, "content") : null;
}

function canonicalPath(html) {
  const tag = tags(html, "link").find((candidate) => attribute(candidate, "rel")?.toLowerCase() === "canonical");
  return tag ? new URL(attribute(tag, "href"), storeBase).pathname : null;
}

function hrefPaths(html) {
  return tags(html, "a")
    .map((tag) => attribute(tag, "href"))
    .filter(Boolean)
    .map((href) => new URL(href, storeBase).pathname + (new URL(href, storeBase).search || ""));
}

function expectedMountedPath(path) {
  return new URL(routeUrl(path)).pathname;
}

const catalog = await request("/store/catalog");
assert.ok(Array.isArray(catalog?.products) && catalog.products.length > 0, "the live catalog should contain at least one published product");

const brandProduct = catalog.products.find((product) => product.brandSlug && product.category?.slug);
assert.ok(brandProduct, "the live catalog should contain a product with a brand and category slug");

const brandSlug = brandProduct.brandSlug;
const brandName = brandProduct.brand;
const categorySlug = brandProduct.category.slug;
const categoryPath = `/${brandSlug}/${publicCategorySlug(categorySlug)}`;
const brandProducts = catalog.products.filter((product) => product.brandSlug === brandSlug || product.brand.toLowerCase().replace(/\s+/g, "-") === brandSlug);
const availableProducts = brandProducts.filter((product) => product.quantity > 0).length;
const brandSeo = await request(`/store/seo?type=brand&slug=${encodeURIComponent(brandSlug)}`);

assert.equal(brandSeo.entityType, "brand", "the selected catalog brand should have brand SEO data");
assert.equal(brandSeo.canonicalPath, `/brand/${brandSlug}`, "standalone brand SEO should use the standalone brand route");
assert.equal(brandSeo.indexable, true, "a live brand should be indexable");

const brandHtml = await render(`/brand/${brandSlug}`);
const brandText = bodyText(brandHtml);
assert.match(brandText, new RegExp(`${brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), "the brand route should render the live brand name");
assert.match(brandText, new RegExp(`${brandProducts.length} ${brandProducts.length === 1 ? "منتج منشور" : "منتجات منشورة"}`), "the brand route should render the live published product count");
assert.match(brandText, new RegExp(`${availableProducts} متاح الآن`), "the brand route should render the live availability count");
assert.equal(canonicalPath(brandHtml), expectedMountedPath(`/brand/${brandSlug}`), "the brand route should keep its mounted canonical URL");
assert.equal(metadata(brandHtml, "robots"), "index, follow", "a real brand route should remain indexable");
assert.ok(hrefPaths(brandHtml).includes(expectedMountedPath(categoryPath)), "brand/category links should use the expected public category path");

const productPath = `${categoryPath}/${brandProduct.slug}`;
const productSeo = await request(`/store/seo?type=product&slug=${encodeURIComponent(brandProduct.slug)}`);
assert.equal(productSeo.entityType, "product", "the selected catalog product should have product SEO data");
assert.equal(productSeo.canonicalPath, `/cabl-store${productPath}`, "product SEO should preserve the public brand/category/product path");
assert.equal(productSeo.breadcrumbs.at(-1)?.path, productSeo.canonicalPath, "product SEO breadcrumbs should end at the product canonical path");
assert.equal(productSeo.breadcrumbs.find((item) => item.name === brandName)?.path, `/cabl-store/brand/${brandSlug}`, "product SEO should link back to the public brand path");
assert.equal(productSeo.breadcrumbs.find((item) => item.name === brandProduct.category.name)?.path, `/cabl-store${categoryPath}`, "product SEO should link back to the public brand/category path");

const productHtml = await render(productPath);
const productText = bodyText(productHtml);
assert.match(productText, new RegExp(`${brandProduct.productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), "the public brand/category/product route should render the live product");
assert.equal(canonicalPath(productHtml), expectedMountedPath(productPath), "the product route should keep its public mounted canonical URL");
assert.equal(metadata(productHtml, "robots"), "index, follow", "a live product route should remain indexable");
assert.ok(hrefPaths(productHtml).includes(expectedMountedPath(`/brand/${brandSlug}`)), "product breadcrumbs should link to the public brand route");
assert.ok(hrefPaths(productHtml).includes(expectedMountedPath(categoryPath)), "product breadcrumbs should link to the public brand/category route");

const legacyProductHtml = await render(`/product/${brandProduct.slug}`);
assert.equal(canonicalPath(legacyProductHtml), expectedMountedPath(productPath), "the legacy product route should canonicalize to the public brand/category/product path");

const unknownSlug = "__brand-route-regression-unknown__";
const unknownHtml = await render(`/brand/${unknownSlug}`);
const unknownText = bodyText(unknownHtml);
assert.match(unknownText, /لم نجد منتجات منشورة/, "an unknown brand should render an honest empty-brand state");
assert.ok(hrefPaths(unknownHtml).some((path) => path.endsWith("/search?view=brands")), "an unknown brand should offer a recovery link to the brand directory");
assert.equal(metadata(unknownHtml, "robots"), "noindex, follow", "an unknown brand should not be indexable");

console.log(`Brand acceptance checks passed for ${brandName} (${brandProducts.length} published, ${availableProducts} available)`);