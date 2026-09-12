import { Router, type IRouter, type Request } from "express";
import {
  CreateStoreOrderBody,
  CreateStoreOrderResponse,
  GetStoreCatalogResponse,
  GetStoreSeoQueryParams,
  GetStoreSeoResponse,
  GetStoreOrderParams,
  GetStoreOrderQueryParams,
  GetStoreOrderResponse,
  ListStoreOrdersQueryParams,
  ListStoreOrdersResponse,
} from "@workspace/api-zod";
import { pool } from "@workspace/db";
import {
  buildBrandSeo,
  buildCategorySeo,
  buildGuideSeo,
  buildHomeSeo,
  buildProductSeo,
  brandPublicPath,
  productSlug,
  productPublicPath,
  publicCategoryPath,
  slugify,
} from "../lib/store-seo";

const router: IRouter = Router();

type ProductRow = {
  id: string;
  brand: string;
  canonical_brand: string | null;
  brand_slug: string | null;
  product_name: string;
  SKU: string;
  product_slug: string | null;
  regular_price: string | number;
  discount_price: string | number | null;
  quantity: number;
  short_description: string | null;
  product_description: string | null;
  product_note: string | null;
  category_id: string | null;
  category_name: string | null;
  category_slug: string | null;
  image_path: string | null;
  shipping_id: number | null;
  shipping_name: string | null;
  ship_charge: string | number | null;
  shipping_free: boolean | null;
  estimated_days: string | number | null;
};

const asNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const asIso = (value: unknown) => {
  if (value instanceof Date) return value.toISOString();
  return new Date(String(value)).toISOString();
};

const orderId = () => {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CABL-${stamp}-${random}`;
};

const SITEMAP_URL_LIMIT = 50_000;
const STATIC_SITEMAP_PATHS = [
  "/",
  "/about",
  "/blog/best-power-bank-yemen",
  "/locations/yemen",
  "/solutions/slow-car-charging",
  "/lab",
  "/verify",
  "/shipping",
  "/return-policy",
  "/faq",
  "/contact",
];

const xmlEscape = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");

function publicSiteOrigin(req: Request) {
  const forwardedHost = String(req.get("x-forwarded-host") || req.get("host") || "").split(",")[0].trim();
  const forwardedProtocol = String(req.get("x-forwarded-proto") || "").split(",")[0].trim();
  const protocol = forwardedProtocol || (process.env.NODE_ENV === "production" ? "https" : req.protocol);
  const basePath = String(process.env.PUBLIC_SITE_BASE_PATH || "").replace(/\/$/, "");
  return {
    origin: String(process.env.PUBLIC_SITE_ORIGIN || `${protocol}://${forwardedHost}`).replace(/\/$/, ""),
    basePath,
  };
}

async function getSitemapPaths() {
  const [categories, brands, products, guides] = await Promise.all([
    pool.query<{ slug: string }>(
      `SELECT "slug" FROM "categories"
       WHERE "active" = TRUE AND "seo_indexable" = TRUE
         AND "slug" IS NOT NULL AND BTRIM("slug") <> ''`,
    ),
    pool.query<{ slug: string }>(
      `SELECT "slug" FROM "brands"
       WHERE "seo_indexable" = TRUE AND "slug" IS NOT NULL AND BTRIM("slug") <> ''`,
    ),
    pool.query<{ slug: string; brand_slug: string | null; category_slug: string | null }>(
      `SELECT p."slug", b."slug" AS "brand_slug", c."slug" AS "category_slug"
       FROM "products" p
       LEFT JOIN "brands" b ON b."id" = p."brand_id"
       LEFT JOIN LATERAL (
         SELECT c1."slug"
         FROM "product_categories" pc1
         JOIN "categories" c1 ON c1."id" = pc1."category_id" AND c1."active" = TRUE
         WHERE pc1."product_id" = p."id"
         ORDER BY c1."parent_id" NULLS FIRST, c1."category_name"
         LIMIT 1
       ) c ON TRUE
       WHERE p."published" = TRUE
         AND p."slug" IS NOT NULL AND BTRIM(p."slug") <> ''`,
    ),
    pool.query<{ slug: string; canonical_path: string | null }>(
      `SELECT "slug", "canonical_path" FROM "seo_guides"
       WHERE "published" = TRUE AND "seo_indexable" = TRUE
         AND "slug" IS NOT NULL AND BTRIM("slug") <> ''`,
    ),
  ]);

  const paths = new Set(STATIC_SITEMAP_PATHS);
  for (const row of categories.rows) paths.add(publicCategoryPath(row.slug));
  for (const row of brands.rows) paths.add(brandPublicPath(row.slug));
  for (const row of products.rows) {
    paths.add(productPublicPath({
      brandSlug: row.brand_slug,
      categorySlug: row.category_slug,
      productSlug: row.slug,
    }));
  }
  for (const row of guides.rows) paths.add(row.canonical_path || `/guide/${row.slug}`);
  return [...paths].filter((path) => path.startsWith("/") && !path.includes("?") && !path.includes("#"));
}

function sitemapUrl(origin: string, basePath: string, path: string) {
  return `${origin}${basePath}${path === "/" ? "/" : path}`;
}

function sitemapXml(origin: string, basePath: string, paths: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
    .map((path) => `  <url><loc>${xmlEscape(sitemapUrl(origin, basePath, path))}</loc></url>`)
    .join("\n")}\n</urlset>\n`;
}

function sitemapIndexXml(origin: string, basePath: string, chunkCount: number) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${Array.from({ length: chunkCount }, (_, index) => `  <sitemap><loc>${xmlEscape(sitemapUrl(origin, basePath, `/api/store/sitemap-${index}.xml`))}</loc></sitemap>`).join("\n")}\n</sitemapindex>\n`;
}

async function findCatalogRedirect(type: "product" | "category" | "brand", slug: string) {
  const exactPaths = type === "product"
    ? [`/product/${slug}`]
    : type === "category"
      ? [publicCategoryPath(slug), `/category/${slug}`]
      : [brandPublicPath(slug), `/brand/${slug}`];
  const result = await pool.query<{ to_path: string }>(
    `SELECT "to_path"
     FROM "seo_redirects"
     WHERE "active" = TRUE
       AND ("from_path" = ANY($1::text[]) OR ($2 = 'product' AND "from_path" LIKE $3))
     ORDER BY CASE WHEN "from_path" = ANY($1::text[]) THEN 0 ELSE 1 END, "updated_at" DESC NULLS LAST
     LIMIT 1`,
    [exactPaths, type, `%/${slug}`],
  );
  return result.rows[0]?.to_path ?? null;
}

const lastPathSegment = (path: string) => path.split("/").filter(Boolean).at(-1) ?? null;

router.get("/store/sitemap.xml", async (req, res): Promise<void> => {
  try {
    const paths = await getSitemapPaths();
    const { origin, basePath } = publicSiteOrigin(req);
    if (paths.length <= SITEMAP_URL_LIMIT) {
      res.type("application/xml").send(sitemapXml(origin, basePath, paths));
      return;
    }
    res.type("application/xml").send(sitemapIndexXml(origin, basePath, Math.ceil(paths.length / SITEMAP_URL_LIMIT)));
  } catch (error) {
    req.log.error({ err: error }, "Failed to generate store sitemap");
    res.status(500).type("text/plain").send("Unable to generate sitemap");
  }
});

router.get("/store/sitemap-:part.xml", async (req, res): Promise<void> => {
  const part = Number(req.params.part);
  if (!Number.isInteger(part) || part < 0) {
    res.status(404).send("Sitemap not found");
    return;
  }
  try {
    const paths = await getSitemapPaths();
    const start = part * SITEMAP_URL_LIMIT;
    if (start >= paths.length) {
      res.status(404).send("Sitemap not found");
      return;
    }
    const { origin, basePath } = publicSiteOrigin(req);
    res.type("application/xml").send(sitemapXml(origin, basePath, paths.slice(start, start + SITEMAP_URL_LIMIT)));
  } catch (error) {
    req.log.error({ err: error, part }, "Failed to generate store sitemap chunk");
    res.status(500).type("text/plain").send("Unable to generate sitemap");
  }
});

router.get("/store/catalog", async (req, res): Promise<void> => {
  try {
    const result = await pool.query<ProductRow>(`
      SELECT
        p."id",
        p."brand",
        b."brand_name" AS "canonical_brand",
        b."slug" AS "brand_slug",
        p."product_name",
        p."SKU",
        p."slug" AS "product_slug",
        p."regular_price",
        p."discount_price",
        p."quantity",
        p."short_description",
        p."product_description",
        p."product_note",
        c."id" AS "category_id",
        c."category_name" AS "category_name",
        c."slug" AS "category_slug",
        g."image_path",
        s."id" AS "shipping_id",
        s."name" AS "shipping_name",
        ps."ship_charge",
        ps."free" AS "shipping_free",
        ps."estimated_days"
      FROM "products" p
      LEFT JOIN "brands" b ON b."id" = p."brand_id"
      LEFT JOIN "product_categories" pc ON pc."product_id" = p."id"
      LEFT JOIN "categories" c ON c."id" = pc."category_id" AND c."active" = TRUE
      LEFT JOIN "galleries" g ON g."product_id" = p."id"
      LEFT JOIN "product_shippings" ps ON ps."product_id" = p."id"
      LEFT JOIN "shippings" s ON s."id" = ps."shipping_id" AND s."active" = TRUE
      WHERE p."published" = TRUE
      ORDER BY p."created_at" DESC NULLS LAST, p."product_name" ASC, g."display_order" ASC
    `);

    const productMap = new Map<string, {
      id: string;
      slug: string;
      brand: string;
      brandSlug: string;
      productName: string;
      sku: string;
      regularPrice: number;
      discountPrice: number | null;
      quantity: number;
      shortDescription: string | null;
      productDescription: string | null;
      productNote: string | null;
      category: { id: string; name: string; slug: string } | null;
      images: string[];
      shippingOptions: Array<{ id: number; name: string; charge: number; free: boolean; estimatedDays: number | null }>;
    }>();

    for (const row of result.rows) {
      const existing = productMap.get(row.id) ?? {
        id: row.id,
        slug: productSlug(row.product_name, row.SKU, row.product_slug),
        brand: row.canonical_brand ?? row.brand,
        brandSlug: row.brand_slug ?? slugify(row.canonical_brand ?? row.brand),
        productName: row.product_name,
        sku: row.SKU,
        regularPrice: asNumber(row.regular_price),
        discountPrice: row.discount_price === null ? null : asNumber(row.discount_price),
        quantity: row.quantity,
        shortDescription: row.short_description,
        productDescription: row.product_description,
        productNote: row.product_note,
        category: row.category_id && row.category_name
          ? { id: row.category_id, name: row.category_name, slug: row.category_slug ?? slugify(row.category_name) }
          : null,
        images: [],
        shippingOptions: [],
      };
      if (row.image_path && !existing.images.includes(row.image_path)) existing.images.push(row.image_path);
      if (row.shipping_id && row.shipping_name && !existing.shippingOptions.some((option) => option.id === row.shipping_id)) {
        existing.shippingOptions.push({
          id: row.shipping_id,
          name: row.shipping_name,
          charge: asNumber(row.ship_charge),
          free: Boolean(row.shipping_free),
          estimatedDays: row.estimated_days === null ? null : asNumber(row.estimated_days),
        });
      }
      productMap.set(row.id, existing);
    }

    const shippingResult = await pool.query<{
      id: number;
      name: string;
      charge: string | number;
      free: boolean;
      estimated_days: string | number | null;
    }>(`SELECT s."id", s."name",
          COALESCE(MAX(ps."ship_charge"), 0) AS "charge",
          COALESCE(BOOL_AND(COALESCE(ps."free", TRUE)), TRUE) AS "free",
          MIN(ps."estimated_days") AS "estimated_days"
       FROM "shippings" s
       LEFT JOIN "product_shippings" ps ON ps."shipping_id" = s."id"
       WHERE s."active" = TRUE
       GROUP BY s."id", s."name"
       ORDER BY s."id" ASC`);
    const shippingOptions = shippingResult.rows.map((shipping) => ({
      id: shipping.id,
      name: shipping.name,
      charge: asNumber(shipping.charge),
      free: shipping.free,
      estimatedDays: shipping.estimated_days === null ? null : asNumber(shipping.estimated_days),
    }));
    const paymentMethodsResult = await pool.query<{
      id: number;
      name: string;
      description: string | null;
      account_name: string | null;
      account_number: string | null;
      instructions: string | null;
      icon_key: string;
      requires_transaction_reference: boolean;
    }>(
      `SELECT "id", "name", "description", "account_name", "account_number", "instructions",
              "icon_key", "requires_transaction_reference"
       FROM "payment_methods"
       WHERE "active" = TRUE
       ORDER BY "sort_order" ASC, "id" ASC`,
    );
    const paymentMethods = paymentMethodsResult.rows.map((method) => ({
      id: method.id,
      name: method.name,
      description: method.description,
      accountName: method.account_name,
      accountNumber: method.account_number,
      instructions: method.instructions,
      iconKey: method.icon_key,
      requiresTransactionReference: method.requires_transaction_reference,
    }));
    const currenciesResult = await pool.query<{
      code: string;
      name: string;
      rate_per_usd: string | number;
      is_default: boolean;
    }>(
      `SELECT "code", "name", "rate_per_usd", "is_default"
       FROM "currencies"
       WHERE "active" = TRUE
       ORDER BY "is_default" DESC, "id" ASC`,
    );
    const currencies = currenciesResult.rows.map((currency) => ({
      code: currency.code,
      name: currency.name,
      ratePerUsd: asNumber(currency.rate_per_usd),
      isDefault: currency.is_default,
    }));

    const response = GetStoreCatalogResponse.parse({
      products: [...productMap.values()],
      shippingOptions,
      paymentMethods,
      currencies,
    });
    res.json(response);
  } catch (error) {
    req.log.error({ err: error }, "Failed to load store catalog");
    res.status(500).json({ error: "تعذر تحميل كتالوج المتجر" });
  }
});

router.get("/store/seo", async (req, res): Promise<void> => {
  const parsed = GetStoreSeoQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "يرجى تحديد نوع صفحة SEO والـ slug الصحيح" });
    return;
  }

    const { type, slug } = parsed.data;
  if (type !== "home" && !slug) {
    res.status(400).json({ error: "هذه الصفحة تحتاج إلى slug" });
    return;
  }

  try {
    let lookupSlug = slug;
    if (slug && (type === "product" || type === "category" || type === "brand")) {
      const redirectTarget = await findCatalogRedirect(type, slug);
      const redirectSlug = redirectTarget ? lastPathSegment(redirectTarget) : null;
      if (redirectSlug) lookupSlug = redirectSlug;
    }

    if (type === "home") {
      res.json(GetStoreSeoResponse.parse(buildHomeSeo()));
      return;
    }

    if (type === "product") {
      const result = await pool.query<{
        slug: string;
        brand: string;
        brand_slug: string | null;
        product_name: string;
        SKU: string;
        regular_price: string | number;
        discount_price: string | number | null;
        quantity: number;
        short_description: string | null;
        product_description: string | null;
        image_path: string | null;
        category_name: string | null;
        category_slug: string | null;
      }>(
        `SELECT p."slug", COALESCE(b."brand_name", p."brand") AS "brand", b."slug" AS "brand_slug",
                p."product_name", p."SKU", p."regular_price", p."discount_price", p."quantity",
                p."short_description", p."product_description", g."image_path",
                c."category_name", c."slug" AS "category_slug"
         FROM "products" p
         LEFT JOIN "brands" b ON b."id" = p."brand_id"
         LEFT JOIN LATERAL (
           SELECT c1."category_name", c1."slug"
           FROM "product_categories" pc1
           JOIN "categories" c1 ON c1."id" = pc1."category_id" AND c1."active" = TRUE
           WHERE pc1."product_id" = p."id"
           ORDER BY c1."parent_id" NULLS FIRST, c1."category_name"
           LIMIT 1
         ) c ON TRUE
         LEFT JOIN LATERAL (
           SELECT g1."image_path"
           FROM "galleries" g1
           WHERE g1."product_id" = p."id"
           ORDER BY g1."thumbail" DESC, g1."display_order" ASC
           LIMIT 1
         ) g ON TRUE
         WHERE p."published" = TRUE AND p."slug" = $1
         LIMIT 1`,
         [lookupSlug],
      );
      const product = result.rows[0];
      if (!product) {
        res.status(404).json({ error: "المنتج غير موجود" });
        return;
      }
      const brand = product.brand;
      const seo = buildProductSeo({
        slug: product.slug,
        brand,
        brandSlug: product.brand_slug ?? slugify(brand),
        productName: product.product_name,
        sku: product.SKU,
        regularPrice: asNumber(product.regular_price),
        discountPrice: product.discount_price === null ? null : asNumber(product.discount_price),
        quantity: product.quantity,
        shortDescription: product.short_description,
        productDescription: product.product_description,
        image: product.image_path,
        categoryName: product.category_name,
        categorySlug: product.category_slug ?? (product.category_name ? slugify(product.category_name) : null),
      });
      res.json(GetStoreSeoResponse.parse(seo));
      return;
    }

    if (type === "category") {
      const result = await pool.query<{
        slug: string;
        category_name: string;
        category_description: string | null;
        seo_description: string | null;
        seo_title: string | null;
        meta_description: string | null;
        image_path: string | null;
        seo_indexable: boolean;
      }>(
        `SELECT "slug", "category_name", "category_description", "seo_description", "seo_title",
                "meta_description", "image_path", "seo_indexable"
         FROM "categories"
         WHERE "slug" = $1 AND "active" = TRUE
         LIMIT 1`,
         [lookupSlug],
      );
      const category = result.rows[0];
      if (!category) {
        res.status(404).json({ error: "التصنيف غير موجود" });
        return;
      }
      res.json(GetStoreSeoResponse.parse(buildCategorySeo({
        slug: category.slug,
        name: category.category_name,
        description: category.category_description,
        seoDescription: category.seo_description,
        seoTitle: category.seo_title,
        metaDescription: category.meta_description,
        imagePath: category.image_path,
        indexable: category.seo_indexable,
      })));
      return;
    }

    if (type === "brand") {
      const result = await pool.query<{
        slug: string;
        brand_name: string;
        description: string | null;
        seo_description: string | null;
        seo_title: string | null;
        meta_description: string | null;
        image_path: string | null;
        seo_indexable: boolean;
      }>(
        `SELECT "slug", "brand_name", "description", "seo_description", "seo_title",
                "meta_description", "image_path", "seo_indexable"
         FROM "brands"
         WHERE "slug" = $1
         LIMIT 1`,
         [lookupSlug],
      );
      const brand = result.rows[0];
      if (!brand) {
        res.status(404).json({ error: "العلامة التجارية غير موجودة" });
        return;
      }
      res.json(GetStoreSeoResponse.parse(buildBrandSeo({
        slug: brand.slug,
        name: brand.brand_name,
        description: brand.description,
        seoDescription: brand.seo_description,
        seoTitle: brand.seo_title,
        metaDescription: brand.meta_description,
        imagePath: brand.image_path,
        indexable: brand.seo_indexable,
      })));
      return;
    }

    const result = await pool.query<{
      slug: string;
      title: string;
      h1: string;
      meta_description: string;
      description: string | null;
      content: string;
      image_path: string | null;
      canonical_path: string | null;
      seo_indexable: boolean;
    }>(
      `SELECT "slug", "title", "h1", "meta_description", "description", "content",
              "image_path", "canonical_path", "seo_indexable"
       FROM "seo_guides"
       WHERE "slug" = $1 AND "published" = TRUE
       LIMIT 1`,
      [slug],
    );
    const guide = result.rows[0];
    if (!guide) {
      res.status(404).json({ error: "الدليل غير موجود" });
      return;
    }
    res.json(GetStoreSeoResponse.parse(buildGuideSeo({
      slug: guide.slug,
      title: guide.title,
      h1: guide.h1,
      metaDescription: guide.meta_description,
      description: guide.description,
      content: guide.content,
      imagePath: guide.image_path,
      canonicalPath: guide.canonical_path,
      indexable: guide.seo_indexable,
    })));
  } catch (error) {
    req.log.error({ err: error, type, slug }, "Failed to generate store SEO metadata");
    res.status(500).json({ error: "تعذر توليد بيانات SEO" });
  }
});

router.get("/store/orders", async (req, res): Promise<void> => {
  const parsed = ListStoreOrdersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "يرجى إدخال البريد الإلكتروني ورقم الهاتف بشكل صحيح" });
    return;
  }
  try {
    const result = await pool.query<{
      id: string;
      status: string;
      total: string | number;
      created_at: Date;
    }>(
      `SELECT o."id", COALESCE(os."status_name", 'جديد') AS "status",
        COALESCE(SUM(oi."price" * oi."quantity"), 0) +
          COALESCE(SUM(CASE WHEN oi."shipping_id" IS NOT NULL THEN COALESCE(ps."ship_charge", 0) * oi."quantity" ELSE 0 END), 0) AS "total",
        o."created_at"
       FROM "orders" o
       JOIN "customers" c ON c."id" = o."customer_id"
       LEFT JOIN "order_statuses" os ON os."id" = o."order_status_id"
       LEFT JOIN "order_items" oi ON oi."order_id" = o."id"
       LEFT JOIN "product_shippings" ps ON ps."product_id" = oi."product_id" AND ps."shipping_id" = oi."shipping_id"
       WHERE LOWER(c."email") = LOWER($1) AND c."phone_number" = $2
       GROUP BY o."id", os."status_name", o."created_at"
       ORDER BY o."created_at" DESC NULLS LAST`,
      [parsed.data.email.trim(), parsed.data.phone.trim()],
    );
    res.json(ListStoreOrdersResponse.parse({
      orders: result.rows.map((row) => ({
        id: row.id,
        status: row.status,
        total: roundMoney(asNumber(row.total)),
        createdAt: asIso(row.created_at),
      })),
    }));
  } catch (error) {
    req.log.error({ err: error }, "Failed to list customer orders");
    res.status(500).json({ error: "تعذر تحميل طلبات العميل" });
  }
});

router.post("/store/orders", async (req, res): Promise<void> => {
  const parsed = CreateStoreOrderBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid store order");
    res.status(400).json({ error: "بيانات الطلب غير مكتملة أو غير صالحة" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const input = parsed.data;
    const email = input.customer.email.trim().toLowerCase();
    const phoneNumber = input.customer.phoneNumber.trim();
    const productIds = [...new Set(input.items.map((item) => item.productId))];

    const shippingResult = await client.query<{
      id: number;
      name: string;
    }>(`SELECT "id", "name" FROM "shippings" WHERE "id" = $1 AND "active" = TRUE`, [input.shippingId]);
    if (!shippingResult.rows[0]) throw new Error("طريقة الشحن المحددة غير متاحة");
    const paymentMethodResult = await client.query<{
      id: number;
      name: string;
      requires_transaction_reference: boolean;
    }>(
      `SELECT "id", "name", "requires_transaction_reference"
       FROM "payment_methods"
       WHERE "id" = $1 AND "active" = TRUE`,
      [input.paymentMethodId],
    );
    const paymentMethod = paymentMethodResult.rows[0];
    if (!paymentMethod) throw new Error("طريقة الدفع المحددة غير متاحة");
    const paymentReference = input.paymentReference?.trim() || null;
    if (paymentMethod.requires_transaction_reference && !paymentReference) {
      throw new Error("يرجى إدخال رقم عملية التحويل");
    }

    const productsResult = await client.query<{
      id: string;
      product_name: string;
      regular_price: string | number;
      discount_price: string | number | null;
      quantity: number;
    }>(
      `SELECT "id", "product_name", "regular_price", "discount_price", "quantity"
       FROM "products"
       WHERE "id" = ANY($1::uuid[]) AND "published" = TRUE
       FOR UPDATE`,
      [productIds],
    );
    const products = new Map(productsResult.rows.map((product) => [product.id, product]));
    if (products.size !== productIds.length) throw new Error("أحد المنتجات لم يعد متاحًا");

    const shippingRulesResult = await client.query<{
      product_id: string;
      ship_charge: string | number;
      free: boolean;
    }>(
      `SELECT "product_id", "ship_charge", "free"
       FROM "product_shippings"
       WHERE "shipping_id" = $1 AND "product_id" = ANY($2::uuid[])`,
      [input.shippingId, productIds],
    );
    const shippingRules = new Map(shippingRulesResult.rows.map((rule) => [rule.product_id, rule]));
    let subtotal = 0;
    let shippingCost = 0;
    const items = input.items.map((item) => {
      const product = products.get(item.productId)!;
      if (product.quantity < item.quantity) throw new Error(`الكمية المطلوبة من ${product.product_name} غير متوفرة`);
      const price = asNumber(product.discount_price ?? product.regular_price);
      const shippingRule = shippingRules.get(item.productId);
      subtotal += price * item.quantity;
      if (shippingRule && !shippingRule.free) shippingCost += asNumber(shippingRule.ship_charge) * item.quantity;
      return { productId: item.productId, productName: product.product_name, quantity: item.quantity, price };
    });

    let discount = 0;
    let couponId: number | null = null;
    if (input.couponCode?.trim()) {
      const couponResult = await client.query<{
        id: number;
        discount_value: string | number | null;
      }>(
        `SELECT "id", "discount_value"
         FROM "coupons"
         WHERE UPPER("code") = UPPER($1)
           AND ("coupon_start_date" IS NULL OR "coupon_start_date" <= NOW())
           AND ("coupon_end_date" IS NULL OR "coupon_end_date" >= NOW())
           AND ("max_usage" IS NULL OR "times_used" < "max_usage")
         LIMIT 1`,
        [input.couponCode.trim()],
      );
      const coupon = couponResult.rows[0];
      if (!coupon) throw new Error("القسيمة غير صالحة أو منتهية");
      couponId = coupon.id;
      discount = Math.min(subtotal, Math.max(0, asNumber(coupon.discount_value)));
    }

    const customerResult = await client.query<{ id: string }>(
      `INSERT INTO "customers" ("first_name", "last_name", "phone_number", "email", "active", "registered_at", "created_at")
       VALUES ($1, $2, $3, $4, TRUE, NOW(), NOW())
       ON CONFLICT ("email") DO UPDATE SET
         "first_name" = EXCLUDED."first_name",
         "last_name" = EXCLUDED."last_name",
         "phone_number" = EXCLUDED."phone_number",
         "active" = TRUE
       RETURNING "id"`,
      [input.customer.firstName.trim(), input.customer.lastName.trim(), phoneNumber, email],
    );
    const customerId = customerResult.rows[0].id;
    await client.query(
      `INSERT INTO "customer_addresses" ("customer_id", "address_line1", "address_line2", "postal_code", "country", "city", "phone_number")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        customerId,
        input.address.addressLine1.trim(),
        input.address.addressLine2?.trim() || null,
        input.address.postalCode?.trim() || null,
        input.address.country.trim(),
        input.address.city.trim(),
        input.address.phoneNumber?.trim() || phoneNumber,
      ],
    );

    const statusResult = await client.query<{ id: number; status_name: string }>(
      `SELECT "id", "status_name" FROM "order_statuses" ORDER BY "id" ASC LIMIT 1`,
    );
    const statusId = statusResult.rows[0]?.id ?? null;
    const statusName = statusResult.rows[0]?.status_name ?? "جديد";
    const id = orderId();
    const total = roundMoney(subtotal + shippingCost - discount);
    const paymentStatus = paymentMethod.requires_transaction_reference ? "awaiting_verification" : "cod_pending";
    await client.query(
      `INSERT INTO "orders" ("id", "coupon_id", "customer_id", "payment_method_id", "payment_reference", "payment_status", "payment_submitted_at", "order_status_id", "created_at")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [id, couponId, customerId, paymentMethod.id, paymentReference, paymentStatus, paymentReference ? new Date() : null, statusId],
    );
    for (const item of items) {
      await client.query(
        `INSERT INTO "order_items" ("product_id", "order_id", "price", "quantity", "shipping_id")
         VALUES ($1, $2, $3, $4, $5)`,
        [item.productId, id, item.price, item.quantity, input.shippingId],
      );
      await client.query(
        `UPDATE "products" SET "quantity" = "quantity" - $1, "updated_at" = NOW() WHERE "id" = $2`,
        [item.quantity, item.productId],
      );
    }
    if (couponId !== null) await client.query(`UPDATE "coupons" SET "times_used" = "times_used" + 1, "updated_at" = NOW() WHERE "id" = $1`, [couponId]);
    await client.query("COMMIT");

    res.status(201).json(CreateStoreOrderResponse.parse({
      id,
      status: statusName,
      subtotal: roundMoney(subtotal),
      shippingCost: roundMoney(shippingCost),
      discount: roundMoney(discount),
      total,
      paymentMethodName: paymentMethod.name,
      paymentStatus,
      paymentReference,
      createdAt: new Date().toISOString(),
      items,
    }));
  } catch (error) {
    await client.query("ROLLBACK");
    req.log.error({ err: error }, "Failed to create store order");
    res.status(400).json({ error: error instanceof Error ? error.message : "تعذر إنشاء الطلب" });
  } finally {
    client.release();
  }
});

router.get("/store/orders/:id", async (req, res): Promise<void> => {
  const parsedParams = GetStoreOrderParams.safeParse(req.params);
  const parsedQuery = GetStoreOrderQueryParams.safeParse(req.query);
  if (!parsedParams.success || !parsedQuery.success) {
    res.status(400).json({ error: "يرجى إدخال رقم الطلب ورقم الهاتف بشكل صحيح" });
    return;
  }
  try {
    const orderResult = await pool.query<{
      id: string;
      status: string;
      created_at: Date;
      subtotal: string | number;
      shipping_cost: string | number;
      payment_method_name: string;
      payment_status: string;
      payment_reference: string | null;
      items: unknown;
    }>(
       `SELECT o."id", COALESCE(os."status_name", 'جديد') AS "status", o."created_at",
         COALESCE(pm."name", 'غير محددة') AS "payment_method_name",
         COALESCE(o."payment_status", 'awaiting_payment') AS "payment_status",
         o."payment_reference",
        COALESCE(SUM(oi."price" * oi."quantity"), 0) AS "subtotal",
        COALESCE(SUM(CASE WHEN oi."shipping_id" IS NOT NULL THEN COALESCE(ps."ship_charge", 0) * oi."quantity" ELSE 0 END), 0) AS "shipping_cost"
       FROM "orders" o
       JOIN "customers" c ON c."id" = o."customer_id"
       LEFT JOIN "order_statuses" os ON os."id" = o."order_status_id"
        LEFT JOIN "payment_methods" pm ON pm."id" = o."payment_method_id"
       LEFT JOIN "order_items" oi ON oi."order_id" = o."id"
       LEFT JOIN "product_shippings" ps ON ps."product_id" = oi."product_id" AND ps."shipping_id" = oi."shipping_id"
       WHERE o."id" = $1 AND c."phone_number" = $2
        GROUP BY o."id", os."status_name", pm."name", o."payment_status", o."payment_reference", o."created_at"`,
      [parsedParams.data.id, parsedQuery.data.phone.trim()],
    );
    const order = orderResult.rows[0];
    if (!order) {
      res.status(404).json({ error: "لم يتم العثور على الطلب" });
      return;
    }
    const itemsResult = await pool.query<{
      product_id: string;
      product_name: string;
      quantity: number;
      price: string | number;
    }>(
      `SELECT oi."product_id", p."product_name", oi."quantity", oi."price"
       FROM "order_items" oi JOIN "products" p ON p."id" = oi."product_id"
       WHERE oi."order_id" = $1 ORDER BY oi."id" ASC`,
      [order.id],
    );
    const subtotal = roundMoney(asNumber(order.subtotal));
    const shippingCost = roundMoney(asNumber(order.shipping_cost));
    res.json(GetStoreOrderResponse.parse({
      id: order.id,
      status: order.status,
      subtotal,
      shippingCost,
      discount: 0,
      total: roundMoney(subtotal + shippingCost),
      paymentMethodName: order.payment_method_name,
      paymentStatus: order.payment_status,
      paymentReference: order.payment_reference,
      createdAt: asIso(order.created_at),
      items: itemsResult.rows.map((item) => ({
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        price: asNumber(item.price),
      })),
    }));
  } catch (error) {
    req.log.error({ err: error }, "Failed to load store order");
    res.status(500).json({ error: "تعذر تحميل تفاصيل الطلب" });
  }
});

export default router;