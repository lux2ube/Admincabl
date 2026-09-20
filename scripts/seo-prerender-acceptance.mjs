import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve(process.env.STORE_DIST || "artifacts/cabl-store/dist/public");
const baseUrl = process.env.ACCEPTANCE_BASE_URL?.replace(/\/+$/, "") || null;
const expectedBasePath = (process.env.BASE_PATH || "/cabl-store/").replace(/\/+$/, "");
const routes = ["/", "/category/wireless-microphones", "/brand/anker", "/anker/chargers", "/soundcore/wireless-earbuds/soundcore-r50i-cabl-sco-r50i", "/guides/chargers-yemen", "/locations/yemen"];

for (const route of routes) {
  const file = route === "/" ? path.join(distDir, "index.html") : path.join(distDir, route.slice(1), "index.html");
  assert.ok(fs.existsSync(file), `missing pre-rendered route: ${route}`);
  const html = fs.readFileSync(file, "utf8");
  assert.match(html, /<h1>[^<]+<\/h1>/, `${route} should contain a crawlable H1`);
  assert.match(html, /<link rel="canonical" href="[^"]+"/, `${route} should contain a canonical`);
  assert.match(html, /<script type="application\/ld\+json">/, `${route} should contain JSON-LD`);
  assert.match(html, /<script id="cabl-catalog-data" type="application\/json">/, `${route} should contain the canonical catalog payload`);
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1, `${route} should contain one canonical`);
  assert.equal((html.match(/application\/ld\+json/g) || []).length, 1, `${route} should contain one JSON-LD block`);
  assert.doesNotMatch(html, /<h1>Page Not Found/i, `${route} must not be a 404 shell`);
  const expectedCanonical = route === "/" ? (expectedBasePath || "/") : `${expectedBasePath}${route}`;
  assert.match(html, new RegExp(`canonical" href="${expectedCanonical.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`), `${route} should use the mounted canonical`);
  const catalogPayload = html.match(/<script id="cabl-catalog-data" type="application\/json">([\s\S]*?)<\/script>/);
  assert.ok(catalogPayload, `${route} should expose a parseable catalog payload`);
  const catalog = JSON.parse(catalogPayload[1]);
  assert.ok(Array.isArray(catalog.products), `${route} catalog payload should contain products`);
  assert.ok(Array.isArray(catalog.currencies), `${route} catalog payload should contain currencies`);
  assert.doesNotMatch(html, /جارٍ تجهيز المتجر/, `${route} should not expose a loading-only SEO shell`);
}

const robots = fs.readFileSync(path.join(distDir, "robots.txt"), "utf8");
assert.match(robots, /^User-agent: \*/m, "robots.txt should be generated in the storefront output");
assert.equal(robots.match(/^Sitemap: (.+)$/m)?.[1], `${expectedBasePath || ""}/sitemap.xml`, "robots.txt should point to the static storefront sitemap");
assert.doesNotMatch(robots, /\/api\/store\/sitemap\.xml/, "robots.txt must not depend on the backend sitemap route");

const sitemap = fs.readFileSync(path.join(distDir, "sitemap.xml"), "utf8");
assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/, "sitemap.xml should be valid XML output");
assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/, "sitemap.xml should use the sitemap namespace");
assert.match(sitemap, new RegExp(`<loc>${expectedBasePath || ""}(?:/[^<]*)?<\\/loc>`), "sitemap.xml should contain mounted storefront URLs");
assert.doesNotMatch(sitemap, /\/api\/store\//, "sitemap.xml must not point crawlers at backend routes");

const productCandidates = [];
function collectHtml(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collectHtml(file);
      continue;
    }
    if (entry.name !== "index.html") continue;
    const html = fs.readFileSync(file, "utf8");
    const jsonMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (!jsonMatch || !/<strong>SKU:<\/strong>/.test(html)) continue;
    let jsonLd;
    try {
      jsonLd = JSON.parse(jsonMatch[1]);
    } catch {
      return;
    }
    const product = (jsonLd["@graph"] || []).find((item) => item["@type"] === "Product");
    const breadcrumbs = (jsonLd["@graph"] || []).find((item) => item["@type"] === "BreadcrumbList");
    if (product) productCandidates.push({ file, html, product, breadcrumbs });
  }
}
collectHtml(distDir);
assert.ok(productCandidates.length > 0, "at least one product page should be pre-rendered");

const selectedProducts = [];
const selectedBrands = new Set();
for (const candidate of productCandidates) {
  const brand = candidate.product.brand?.name || candidate.product.brand;
  if (brand && !selectedBrands.has(brand)) {
    selectedProducts.push(candidate);
    selectedBrands.add(brand);
  }
  if (selectedProducts.length >= 5) break;
}
const ugreenProduct = productCandidates.find((candidate) => {
  const brand = candidate.product.brand?.name || candidate.product.brand;
  return String(brand).toLowerCase() === "ugreen";
});
assert.ok(ugreenProduct, "the UGREEN product page should be pre-rendered");
if (!selectedProducts.includes(ugreenProduct)) selectedProducts[selectedProducts.length - 1] = ugreenProduct;
assert.ok(selectedProducts.length >= 5, "at least five product pages should be selected for SEO acceptance");
assert.ok(new Set(selectedProducts.map((candidate) => candidate.product.brand?.name || candidate.product.brand)).size >= 4, "selected product pages should cover multiple brands");

for (const candidate of selectedProducts) {
  const route = `${expectedBasePath || ""}/${path.relative(distDir, candidate.file).replace(/\/index\.html$/, "")}`.replace(/\/+/g, "/");
  const canonical = candidate.html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const product = candidate.product;
  const offer = product.offers;
  const productName = String(product.name);
  assert.equal(canonical, route, `${route} should have its own canonical`);
  assert.match(candidate.html, new RegExp(`<title>[^<]*${productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), `${route} title should contain the product name`);
  assert.match(candidate.html, new RegExp(`<h1>${productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}<\/h1>`), `${route} H1 should be the database product name`);
  assert.match(candidate.html, new RegExp(`<strong>SKU:<\/strong>[^<]*<span dir="ltr">${String(product.sku).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}<\/span>`), `${route} should expose its SKU`);
  assert.match(candidate.html, /<img[^>]+alt="[^"]+"/, `${route} should expose an image alt`);
  assert.match(candidate.html, /المواصفات المنشورة|بيانات المنتج/, `${route} should expose product data`);
  assert.equal(product.url, canonical, `${route} Product JSON-LD URL should match canonical`);
  assert.equal(offer?.url, canonical, `${route} Offer URL should match canonical`);
  assert.ok(offer?.price !== undefined, `${route} Product JSON-LD should include a price`);
  assert.ok(offer?.availability, `${route} Product JSON-LD should include availability`);
  assert.equal(candidate.breadcrumbs?.itemListElement?.at(-1)?.item, canonical, `${route} breadcrumb should end at the canonical product URL`);
  assert.equal(candidate.breadcrumbs?.itemListElement?.at(-1)?.name, productName, `${route} breadcrumb should end with the product name`);
}

const missingProductRoute = "/ugreen/chargers/does-not-exist";
assert.ok(
  !fs.existsSync(path.join(distDir, missingProductRoute.slice(1), "index.html")),
  "an unknown product must not be emitted as a homepage or product page",
);

if (baseUrl) {
  async function request(route, redirect = "manual") {
    return fetch(`${baseUrl}${route}`, { redirect });
  }

  for (const route of routes) {
    const response = await request(route);
    assert.equal(response.status, 200, `${route} should return HTTP 200`);
    const html = await response.text();
    assert.match(html, /<h1>[^<]+<\/h1>/, `${route} HTTP response should contain a crawlable H1`);
    assert.match(html, new RegExp(`canonical" href="/cabl-store${route === "/" ? "" : route}"`), `${route} HTTP response should contain its mounted canonical`);
  }

  const slashResponse = await request("/category/wireless-microphones/");
  assert.equal(slashResponse.status, 308, "trailing slash should redirect");
  assert.equal(slashResponse.headers.get("location"), "/cabl-store/category/wireless-microphones", "trailing slash should normalize to the canonical URL");

  for (const route of ["/category/does-not-exist", "/brand/does-not-exist", "/guides/does-not-exist"]) {
    const response = await request(route);
    assert.equal(response.status, 404, `${route} should return HTTP 404`);
  }

  const missingProductResponse = await request(missingProductRoute);
  assert.ok([200, 404].includes(missingProductResponse.status), "unknown product routes should not fail with a server error");
  if (missingProductResponse.status === 200) {
    const html = await missingProductResponse.text();
    assert.match(html, /<h1>المنتج غير موجود<\/h1>/, "unknown product fallback should say the product is missing");
    assert.match(html, /<meta name="robots" content="noindex, follow"/, "unknown product fallback should be noindex");
    assert.doesNotMatch(html, /<h1>شواحن وتوصيلات وخوازن طاقة في اليمن<\/h1>/, "unknown product must not fall back to the homepage");
  }
}

console.log(`SEO pre-render acceptance passed for ${routes.length} routes, ${selectedProducts.length} sampled product pages (${productCandidates.length} total)${baseUrl ? " and production HTTP responses" : ""}`);