import assert from "node:assert/strict";

const apiBase = (process.env.API_URL || "http://127.0.0.1:8080/api").replace(/\/$/, "");
const suffix = `seo-acceptance-${Date.now().toString(36)}`;
const created = {
  categoryId: null,
  brandId: null,
  productId: null,
  relationId: null,
};
const redirectPaths = new Set();

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) },
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${path} failed (${response.status}): ${typeof body === "string" ? body : JSON.stringify(body)}`);
  }
  return body;
}

const post = (path, values) => request(path, { method: "POST", body: JSON.stringify({ values }) });
const patch = (table, id, values) => request(`/admin/tables/${table}/rows/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ values }) });
const remove = (table, id) => request(`/admin/tables/${table}/rows/${encodeURIComponent(id)}`, { method: "DELETE" });

async function sitemap() {
  const response = await fetch(`${apiBase}/store/sitemap.xml`);
  assert.equal(response.status, 200, "sitemap endpoint should return 200");
  return response.text();
}

async function redirects() {
  const result = await request(`/admin/tables/seo_redirects/rows?limit=100&offset=0&search=${encodeURIComponent(suffix)}`);
  return result.rows || [];
}

try {
  const categorySlug = `${suffix}-category`;
  const renamedCategorySlug = `${suffix}-category-renamed`;
  const brandSlug = `${suffix}-brand`;
  const renamedBrandSlug = `${suffix}-brand-renamed`;
  const productSlug = `${suffix}-product`;
  const renamedProductSlug = `${suffix}-product-renamed`;

  const category = await post("/admin/tables/categories/rows", {
    category_name: "SEO acceptance category",
    slug: categorySlug,
    active: true,
    seo_indexable: true,
  });
  created.categoryId = category.row.id;

  const brand = await post("/admin/tables/brands/rows", {
    brand_name: "SEO acceptance brand",
    slug: brandSlug,
    seo_indexable: true,
  });
  created.brandId = brand.row.id;

  const product = await post("/admin/tables/products/rows", {
    brand: "SEO acceptance brand",
    brand_id: created.brandId,
    product_name: "SEO acceptance product",
    SKU: `${suffix}-SKU`,
    slug: productSlug,
    regular_price: 1,
    quantity: 4,
    published: true,
  });
  created.productId = product.row.id;

  const relation = await post("/admin/tables/product_categories/rows", {
    category_id: created.categoryId,
    product_id: created.productId,
  });
  created.relationId = `category_id=${created.categoryId}|product_id=${created.productId}`;

  let currentSitemap = await sitemap();
  assert.match(currentSitemap, new RegExp(`/${categorySlug}(?:<|&)`), "published category should be in sitemap");
  assert.match(currentSitemap, new RegExp(`/${brandSlug}(?:<|&)`), "indexable brand should be in sitemap");
  assert.match(currentSitemap, new RegExp(`/${brandSlug}/${categorySlug}/${productSlug}(?:<|&)`), "published product should be in sitemap");

  await patch("categories", created.categoryId, { slug: renamedCategorySlug });
  redirectPaths.add(`/${categorySlug}`);
  redirectPaths.add(`/${brandSlug}/${categorySlug}/${productSlug}`);
  const oldCategorySeo = await request(`/store/seo?type=category&slug=${categorySlug}`);
  assert.equal(oldCategorySeo.slug, renamedCategorySlug, "old category SEO URL should resolve to the renamed category");
  currentSitemap = await sitemap();
  assert.match(currentSitemap, new RegExp(`/${renamedCategorySlug}(?:<|&)`), "renamed category should replace the old sitemap URL");
  assert.doesNotMatch(currentSitemap, new RegExp(`/${categorySlug}(?:<|&)`), "old category slug should leave the sitemap");

  await patch("brands", created.brandId, { slug: renamedBrandSlug });
  redirectPaths.add(`/${brandSlug}`);
  redirectPaths.add(`/${brandSlug}/${renamedCategorySlug}/${productSlug}`);
  const oldBrandSeo = await request(`/store/seo?type=brand&slug=${brandSlug}`);
  assert.equal(oldBrandSeo.slug, renamedBrandSlug, "old brand SEO URL should resolve to the renamed brand");

  await patch("products", created.productId, { slug: renamedProductSlug });
  redirectPaths.add(`/${renamedBrandSlug}/${renamedCategorySlug}/${productSlug}`);
  const oldProductSeo = await request(`/store/seo?type=product&slug=${productSlug}`);
  assert.equal(oldProductSeo.slug, renamedProductSlug, "old product SEO URL should resolve to the renamed product");

  const rows = await redirects();
  for (const fromPath of redirectPaths) {
    assert.ok(rows.some((row) => row.from_path === fromPath && row.status_code === 301 && row.active), `missing active redirect for ${fromPath}`);
  }

  await patch("categories", created.categoryId, { seo_indexable: false });
  await patch("products", created.productId, { published: false });
  currentSitemap = await sitemap();
  assert.doesNotMatch(currentSitemap, new RegExp(`/${renamedCategorySlug}(?:<|&)`), "noindex category should leave the sitemap");
  assert.doesNotMatch(currentSitemap, new RegExp(`/${renamedBrandSlug}/${renamedCategorySlug}/${renamedProductSlug}(?:<|&)`), "unpublished product should leave the sitemap");

  console.log("SEO acceptance checks passed");
} finally {
  if (created.relationId) await remove("product_categories", created.relationId).catch(() => {});
  if (created.productId) await remove("products", created.productId).catch(() => {});
  if (created.brandId) await remove("brands", created.brandId).catch(() => {});
  if (created.categoryId) await remove("categories", created.categoryId).catch(() => {});
  const rows = await redirects().catch(() => []);
  for (const row of rows) {
    if (String(row.from_path || "").includes(suffix)) {
      await remove("seo_redirects", row.id).catch(() => {});
    }
  }
}