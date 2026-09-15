import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve(process.env.STORE_DIST || "artifacts/cabl-store/dist/public");
const routes = ["/", "/chargers", "/cables", "/guides/chargers-yemen", "/brand/anker", "/anker/chargers", "/about"];

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

console.log(`SEO pre-render acceptance passed for ${routes.length} routes and ${productCandidates.length} product pages`);