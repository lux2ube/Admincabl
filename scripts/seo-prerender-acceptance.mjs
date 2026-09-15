import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve(process.env.STORE_DIST || "artifacts/cabl-store/dist/public");
const baseUrl = process.env.ACCEPTANCE_BASE_URL?.replace(/\/+$/, "") || null;
const routes = ["/", "/category/wireless-microphones", "/brand/anker", "/anker/chargers", "/soundcore/wireless-earbuds/soundcore-r50i-cabl-sco-r50i", "/guides/chargers-yemen", "/locations/yemen"];

for (const route of routes) {
  const file = route === "/" ? path.join(distDir, "index.html") : path.join(distDir, route.slice(1), "index.html");
  assert.ok(fs.existsSync(file), `missing pre-rendered route: ${route}`);
  const html = fs.readFileSync(file, "utf8");
  assert.match(html, /<h1>[^<]+<\/h1>/, `${route} should contain a crawlable H1`);
  assert.match(html, /<link rel="canonical" href="[^"]+"/, `${route} should contain a canonical`);
  assert.match(html, /<script type="application\/ld\+json">/, `${route} should contain JSON-LD`);
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1, `${route} should contain one canonical`);
  assert.equal((html.match(/application\/ld\+json/g) || []).length, 1, `${route} should contain one JSON-LD block`);
  assert.doesNotMatch(html, /<h1>Page Not Found/i, `${route} must not be a 404 shell`);
  assert.match(html, new RegExp(`canonical" href="/cabl-store${route === "/" ? "" : route}"`), `${route} should use the mounted canonical`);
}

const productCandidates = [];
function collectHtml(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) collectHtml(file);
    else if (entry.name === "index.html" && /SKU:<\/strong>/.test(fs.readFileSync(file, "utf8"))) productCandidates.push(file);
  }
}
collectHtml(distDir);
assert.ok(productCandidates.length > 0, "at least one product page should be pre-rendered");

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
}

console.log(`SEO pre-render acceptance passed for ${routes.length} routes, ${productCandidates.length} product pages${baseUrl ? " and production HTTP responses" : ""}`);