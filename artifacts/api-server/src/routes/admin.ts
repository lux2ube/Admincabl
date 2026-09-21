import { Router, type IRouter, type Response } from "express";
import {
  CreateAdminRowBody,
  CreateAdminRowParams,
  CreateAdminRowResponse,
  DeleteAdminRowParams,
  GetAdminDashboardResponse,
  GetAdminMetadataResponse,
  ListAdminRowsParams,
  ListAdminRowsQueryParams,
  ListAdminRowsResponse,
  SeedAdminDataResponse,
  UpdateAdminRowBody,
  UpdateAdminRowParams,
  UpdateAdminRowResponse,
} from "@workspace/api-zod";
import { pool } from "@workspace/db";
import { adminTableMap, adminTables, type AdminColumn, type AdminTable } from "../lib/admin-schema";
import { brandPublicPath, productPublicPath, productSlug, publicCategoryPath, slugify } from "../lib/store-seo";

const router: IRouter = Router();
const sensitiveColumns = new Set(["password_hash", "reset_token", "access_token", "refresh_token"]);

const sanitizeRow = (row: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(row).filter(([key]) => !sensitiveColumns.has(key)));

const sanitizeRows = (rows: Record<string, unknown>[]) => rows.map(sanitizeRow);

const quoteIdentifier = (value: string) => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) throw new Error("Invalid identifier");
  return `"${value}"`;
};

const tableOr404 = (tableName: string, res: Response) => {
  const table = adminTableMap.get(tableName);
  if (!table) {
    res.status(404).json({ error: "Unknown admin table" });
    return null;
  }
  return table;
};

const columnMap = (table: AdminTable) => new Map(table.columns.map((column) => [column.key, column]));

function normalizeValue(value: unknown, column: AdminColumn): unknown {
  if (value === "" && column.nullable) return null;
  if (value === null || value === undefined) return value;
  if (column.type === "number") {
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed)) throw new Error(`Invalid number for ${column.key}`);
    return parsed;
  }
  if (column.type === "boolean") return value === true || value === "true" || value === "on";
  if (column.type === "json" || column.type === "array") {
    if (typeof value !== "string") return value;
    try {
      return JSON.parse(value);
    } catch {
      if (column.type === "array") return value.split(",").map((item) => item.trim()).filter(Boolean);
      throw new Error(`Invalid JSON for ${column.key}`);
    }
  }
  return String(value);
}

function safeValues(table: AdminTable, values: Record<string, unknown>, allowPrimaryKey: boolean) {
  const columns = columnMap(table);
  const entries: Array<[string, unknown]> = [];
  for (const [key, value] of Object.entries(values)) {
    const definition = columns.get(key);
    if (!definition || definition.generated || (!allowPrimaryKey && definition.primaryKey)) {
      throw new Error(`Field cannot be written: ${key}`);
    }
    entries.push([key, normalizeValue(value, definition)]);
  }
  return entries;
}

function primaryKeyColumns(table: AdminTable) {
  return table.primaryKey.split(",").map((value) => value.trim());
}

function parseRowId(table: AdminTable, encodedId: string): Record<string, string> {
  const keys = primaryKeyColumns(table);
  const decoded = decodeURIComponent(encodedId);
  if (keys.length === 1) return { [keys[0]]: decoded };
  const pairs = new Map(decoded.split("|").map((pair) => {
    const separator = pair.indexOf("=");
    return separator === -1 ? [pair, ""] : [pair.slice(0, separator), pair.slice(separator + 1)];
  }));
  return Object.fromEntries(keys.map((key) => [key, pairs.get(key) ?? ""]));
}

function whereClause(table: AdminTable, keyValues: Record<string, string>, params: unknown[], offset = 0) {
  const definitions = columnMap(table);
  const keys = primaryKeyColumns(table);
  const clauses = keys.map((key) => {
    const definition = definitions.get(key);
    if (!definition) throw new Error("Primary key metadata is invalid");
    const value = normalizeValue(keyValues[key], definition);
    params.push(value);
    return `${quoteIdentifier(key)} = $${offset + params.length}`;
  });
  return clauses.join(" AND ");
}

function withGeneratedCatalogSlug(table: AdminTable, values: Record<string, unknown>) {
  const next = { ...values };
  if (next.slug && String(next.slug).trim()) return next;
  if (table.key === "categories" && next.category_name) {
    next.slug = slugify(String(next.category_name));
  } else if (table.key === "brands" && next.brand_name) {
    next.slug = slugify(String(next.brand_name));
  } else if (table.key === "products" && next.product_name && next.SKU) {
    next.slug = productSlug(String(next.product_name), String(next.SKU));
  }
  return next;
}

async function insertSeoRedirect(fromPath: string | null | undefined, toPath: string | null | undefined) {
  if (!fromPath || !toPath || fromPath === toPath || !fromPath.startsWith("/") || !toPath.startsWith("/")) return;
  await pool.query(
    `INSERT INTO "seo_redirects" ("from_path", "to_path", "status_code", "active")
     VALUES ($1, $2, 301, TRUE)
     ON CONFLICT ("from_path") DO UPDATE
       SET "to_path" = EXCLUDED."to_path", "status_code" = 301, "active" = TRUE, "updated_at" = NOW()`,
    [fromPath, toPath],
  );
}

function unmountedStorePath(path: string) {
  return path.replace(/^\/cabl-store(?=\/|$)/, "") || "/";
}

async function productPathSnapshot(id: string) {
  const result = await pool.query<{
    slug: string | null;
    brand_slug: string | null;
    category_slug: string | null;
  }>(
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
     WHERE p."id" = $1
     LIMIT 1`,
    [id],
  );
  const row = result.rows[0];
  if (!row?.slug || !String(row.slug).trim()) return null;
  return {
    path: productPublicPath({ productSlug: row.slug, brandSlug: row.brand_slug, categorySlug: row.category_slug }),
    brandSlug: row.brand_slug,
    categorySlug: row.category_slug,
  };
}

async function updateCatalogRedirects(table: AdminTable, before: Record<string, unknown>, after: Record<string, unknown>) {
  if (table.key === "categories" && before.slug !== after.slug) {
    await insertSeoRedirect(publicCategoryPath(before.slug ? String(before.slug) : null), publicCategoryPath(after.slug ? String(after.slug) : null));
    await insertSeoRedirect(
      before.slug ? `/${String(before.slug)}` : null,
      after.slug ? `/${String(after.slug)}` : null,
    );
    const affected = await pool.query<{ slug: string; brand_slug: string | null; category_slug: string | null }>(
      `SELECT p."slug", b."slug" AS "brand_slug", c."slug" AS "category_slug"
       FROM "products" p
       JOIN "product_categories" pc ON pc."product_id" = p."id" AND pc."category_id" = $1
       LEFT JOIN "brands" b ON b."id" = p."brand_id"
       LEFT JOIN LATERAL (
         SELECT c1."slug"
         FROM "product_categories" pc1
         JOIN "categories" c1 ON c1."id" = pc1."category_id" AND c1."active" = TRUE
         WHERE pc1."product_id" = p."id"
         ORDER BY c1."parent_id" NULLS FIRST, c1."category_name"
         LIMIT 1
       ) c ON TRUE
       WHERE p."published" = TRUE AND p."slug" IS NOT NULL`,
      [after.id],
    );
    for (const product of affected.rows) {
      if (!product.category_slug || !before.slug || !after.slug) continue;
      await insertSeoRedirect(
        productPublicPath({ productSlug: product.slug, brandSlug: product.brand_slug, categorySlug: String(before.slug) }),
        productPublicPath({ productSlug: product.slug, brandSlug: product.brand_slug, categorySlug: product.category_slug }),
      );
      await insertSeoRedirect(
        unmountedStorePath(productPublicPath({ productSlug: product.slug, brandSlug: product.brand_slug, categorySlug: String(before.slug) })),
        unmountedStorePath(productPublicPath({ productSlug: product.slug, brandSlug: product.brand_slug, categorySlug: product.category_slug })),
      );
    }
  }

  if (table.key === "brands" && before.slug !== after.slug) {
    await insertSeoRedirect(brandPublicPath(String(before.slug || "")), brandPublicPath(String(after.slug || "")));
    await insertSeoRedirect(`/${String(before.slug || "")}`, `/${String(after.slug || "")}`);
    const affected = await pool.query<{ slug: string; category_slug: string | null }>(
      `SELECT p."slug", c."slug" AS "category_slug"
       FROM "products" p
       LEFT JOIN LATERAL (
         SELECT c1."slug"
         FROM "product_categories" pc1
         JOIN "categories" c1 ON c1."id" = pc1."category_id" AND c1."active" = TRUE
         WHERE pc1."product_id" = p."id"
         ORDER BY c1."parent_id" NULLS FIRST, c1."category_name"
         LIMIT 1
       ) c ON TRUE
       WHERE p."published" = TRUE AND p."brand_id" = $1 AND p."slug" IS NOT NULL`,
      [after.id],
    );
    for (const product of affected.rows) {
      if (!product.category_slug) continue;
      await insertSeoRedirect(
        productPublicPath({ productSlug: product.slug, brandSlug: String(before.slug || ""), categorySlug: product.category_slug }),
        productPublicPath({ productSlug: product.slug, brandSlug: String(after.slug || ""), categorySlug: product.category_slug }),
      );
      await insertSeoRedirect(
        unmountedStorePath(productPublicPath({ productSlug: product.slug, brandSlug: String(before.slug || ""), categorySlug: product.category_slug })),
        unmountedStorePath(productPublicPath({ productSlug: product.slug, brandSlug: String(after.slug || ""), categorySlug: product.category_slug })),
      );
    }
  }

  if (table.key === "products" && before.slug !== after.slug) {
    const current = await productPathSnapshot(String(after.id));
    const oldPath = current
      ? productPublicPath({
          productSlug: String(before.slug || ""),
          brandSlug: current.brandSlug,
          categorySlug: current.categorySlug,
        })
      : null;
    await insertSeoRedirect(oldPath, current?.path);
    await insertSeoRedirect(unmountedStorePath(oldPath || ""), unmountedStorePath(current?.path || ""));
  }
}

router.get("/admin/metadata", (_req, res) => {
  res.json(GetAdminMetadataResponse.parse({ tables: adminTables }));
});

router.get("/admin/dashboard", async (req, res): Promise<void> => {
  try {
    const counts = await Promise.all(adminTables.map(async (table) => {
      const result = await pool.query(`SELECT COUNT(*)::int AS count FROM ${quoteIdentifier(table.key)}`);
      return { table: table.key, label: table.label, count: Number(result.rows[0]?.count ?? 0) };
    }));
    const totalRows = counts.reduce((sum, item) => sum + item.count, 0);
    const recent = await pool.query(`SELECT * FROM "orders" ORDER BY "created_at" DESC NULLS LAST LIMIT 5`);
    res.json(GetAdminDashboardResponse.parse({ totalRows, tableCounts: counts, recentOrders: recent.rows }));
  } catch (error) {
    req.log.error({ err: error }, "Failed to load admin dashboard");
    res.status(500).json({ error: "تعذر تحميل ملخص لوحة الإدارة" });
  }
});

router.get("/admin/tables/:table/rows", async (req, res): Promise<void> => {
  const parsedParams = ListAdminRowsParams.safeParse(req.params);
  const parsedQuery = ListAdminRowsQueryParams.safeParse(req.query);
  if (!parsedParams.success || !parsedQuery.success) {
    res.status(400).json({ error: "Invalid table query" });
    return;
  }
  const table = tableOr404(parsedParams.data.table, res);
  if (!table) return;
  try {
    const { search, limit, offset } = parsedQuery.data;
    const searchColumns = table.columns.filter((column) => ["text", "uuid", "number"].includes(column.type));
    const params: unknown[] = search && searchColumns.length ? [`%${search}%`] : [];
    const searchClause = search && searchColumns.length
      ? ` WHERE ${searchColumns.map((column) => `CAST(${quoteIdentifier(column.key)} AS TEXT) ILIKE $1`).join(" OR ")}`
      : "";
    const countParams = search && searchColumns.length ? [`%${search}%`] : [];
    const rowsResult = await pool.query(
      `SELECT * FROM ${quoteIdentifier(table.key)}${searchClause} ORDER BY ${quoteIdentifier(primaryKeyColumns(table)[0])} DESC LIMIT $${params.push(limit)} OFFSET $${params.push(offset)}`,
      params,
    );
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM ${quoteIdentifier(table.key)}${searchClause}`,
      countParams,
    );
    res.json(ListAdminRowsResponse.parse({ table: table.key, rows: sanitizeRows(rowsResult.rows), total: Number(countResult.rows[0]?.count ?? 0) }));
  } catch (error) {
    req.log.error({ err: error, table: parsedParams.data.table }, "Failed to list admin rows");
    res.status(500).json({ error: "تعذر تحميل بيانات الجدول" });
  }
});

router.post("/admin/tables/:table/rows", async (req, res): Promise<void> => {
  const parsedParams = CreateAdminRowParams.safeParse(req.params);
  const parsedBody = CreateAdminRowBody.safeParse(req.body);
  if (!parsedParams.success || !parsedBody.success) {
    res.status(400).json({ error: "Invalid row input" });
    return;
  }
  const table = tableOr404(parsedParams.data.table, res);
  if (!table) return;
  try {
    const entries = safeValues(table, withGeneratedCatalogSlug(table, parsedBody.data.values), true);
    if (entries.length === 0) throw new Error("At least one field is required");
    const columns = entries.map(([key]) => quoteIdentifier(key)).join(", ");
    const placeholders = entries.map((_, index) => `$${index + 1}`).join(", ");
    const result = await pool.query(
      `INSERT INTO ${quoteIdentifier(table.key)} (${columns}) VALUES (${placeholders}) RETURNING *`,
      entries.map(([, value]) => value),
    );
    res.status(201).json(CreateAdminRowResponse.parse({ row: sanitizeRow(result.rows[0]) }));
  } catch (error) {
    req.log.error({ err: error, table: table.key }, "Failed to create admin row");
    res.status(400).json({ error: error instanceof Error ? error.message : "تعذر إنشاء السجل" });
  }
});

router.patch("/admin/tables/:table/rows/:id", async (req, res): Promise<void> => {
  const parsedParams = UpdateAdminRowParams.safeParse(req.params);
  const parsedBody = UpdateAdminRowBody.safeParse(req.body);
  if (!parsedParams.success || !parsedBody.success) {
    res.status(400).json({ error: "Invalid row input" });
    return;
  }
  const table = tableOr404(parsedParams.data.table, res);
  if (!table) return;
  try {
    const inputValues = parsedBody.data.values;
    if (["products", "categories", "brands"].includes(table.key) && Object.prototype.hasOwnProperty.call(inputValues, "slug") && !String(inputValues.slug ?? "").trim()) {
      throw new Error("Slug cannot be empty for a public catalog record");
    }
    const keyValues = parseRowId(table, parsedParams.data.id);
    const beforeParams: unknown[] = [];
    const beforeWhere = whereClause(table, keyValues, beforeParams);
    const beforeResult = ["products", "categories", "brands"].includes(table.key)
      ? await pool.query(`SELECT * FROM ${quoteIdentifier(table.key)} WHERE ${beforeWhere} LIMIT 1`, beforeParams)
      : null;
    const entries = safeValues(table, inputValues, false);
    if (entries.length === 0) throw new Error("At least one editable field is required");
    const updateValues = entries.map(([, value]) => value);
    const assignments = entries.map(([key], index) => `${quoteIdentifier(key)} = $${index + 1}`).join(", ");
    const keyParams: unknown[] = [];
    const where = whereClause(table, parseRowId(table, parsedParams.data.id), keyParams, updateValues.length);
    const result = await pool.query(
      `UPDATE ${quoteIdentifier(table.key)} SET ${assignments} WHERE ${where} RETURNING *`,
      [...updateValues, ...keyParams],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: "Row not found" });
      return;
    }
    if (beforeResult?.rows[0]) {
      try {
        await updateCatalogRedirects(table, beforeResult.rows[0], result.rows[0]);
      } catch (redirectError) {
        req.log.error({ err: redirectError, table: table.key }, "Catalog updated but SEO redirect history could not be updated");
      }
    }
    res.json(UpdateAdminRowResponse.parse({ row: sanitizeRow(result.rows[0]) }));
  } catch (error) {
    req.log.error({ err: error, table: table.key }, "Failed to update admin row");
    res.status(400).json({ error: error instanceof Error ? error.message : "تعذر تحديث السجل" });
  }
});

router.delete("/admin/tables/:table/rows/:id", async (req, res): Promise<void> => {
  const parsedParams = DeleteAdminRowParams.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ error: "Invalid row id" });
    return;
  }
  const table = tableOr404(parsedParams.data.table, res);
  if (!table) return;
  try {
    const params: unknown[] = [];
    const where = whereClause(table, parseRowId(table, parsedParams.data.id), params);
    const result = await pool.query(`DELETE FROM ${quoteIdentifier(table.key)} WHERE ${where}`, params);
    if (!result.rowCount) {
      res.status(404).json({ error: "Row not found" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    req.log.error({ err: error, table: table.key }, "Failed to delete admin row");
    res.status(400).json({ error: "لا يمكن حذف السجل بسبب علاقة مرتبطة أو بيانات غير صالحة" });
  }
});

const productsSeed = [
  ["00000000-0000-4000-8000-000000000001", "Vention", "باور بنك 20,000mAh / 22.5W", "CABL-VEN-PB20K", 28.09, "USB-C + USB-A + كابل مدمج", "images/vention-powerbank-20k.jpg", "10000000-0000-4000-8000-000000000001"],
  ["00000000-0000-4000-8000-000000000002", "Vention", "باور بنك 10,000mAh / 22.5W", "CABL-VEN-PB10K", 24.18, "كابل شحن مدمج", "images/vention-powerbank-10k.jpg", "10000000-0000-4000-8000-000000000001"],
  ["00000000-0000-4000-8000-000000000003", "Vention", "باور بنك 10,000mAh / USB-C + Lightning", "CABL-VEN-PB10KL", 24.82, "USB-C + Lightning مدمجان", "images/vention-powerbank-10k-lightning.jpg", "10000000-0000-4000-8000-000000000001"],
  ["00000000-0000-4000-8000-000000000004", "Vention", "شاحن GaN بمنفذين 30W", "CABL-VEN-GAN30", 11.69, "USB-C + USB-A · قابس أوروبي", "images/vention-charger-30w.jpg", "10000000-0000-4000-8000-000000000002"],
  ["00000000-0000-4000-8000-000000000005", "Vention", "طقم شحن GaN بقدرة 30W", "CABL-VEN-GAN30K", 15.90, "شاحن + كابل USB-C إلى USB-C", "images/vention-charger-30w-kit.jpg", "10000000-0000-4000-8000-000000000002"],
  ["00000000-0000-4000-8000-000000000006", "Vention", "شاحن GaN بثلاثة منافذ 65W", "CABL-VEN-GAN65", 37.59, "C+C+A · 65W / 65W / 60W", "images/vention-charger-65w.jpg", "10000000-0000-4000-8000-000000000002"],
  ["00000000-0000-4000-8000-000000000007", "Vention", "شاحن GaN بثلاثة منافذ 70W", "CABL-VEN-GAN70", 39.90, "C+C+A · 70W / 70W / 22.5W", "images/vention-charger-70w.jpg", "10000000-0000-4000-8000-000000000002"],
  ["00000000-0000-4000-8000-000000000008", "Vention", "شاحن GaN بثلاثة منافذ 100W", "CABL-VEN-GAN100", 79.39, "C+C+A · 100W / 100W / 30W", "images/vention-charger-100w.jpg", "10000000-0000-4000-8000-000000000002"],
  ["00000000-0000-4000-8000-000000000009", "Vention", "كابل USB-C إلى USB-C بقدرة 100W", "CABL-VEN-C100", 11.27, "شحن سريع 5A · USB 2.0", "images/vention-cable-100w.jpg", "10000000-0000-4000-8000-000000000003"],
  ["00000000-0000-4000-8000-000000000010", "Vention", "محول سفر عالمي GaN بقدرة 65W", "CABL-VEN-TRAVEL65", 95.88, "شحن عالمي للسفر", "images/vention-adapter-65w.jpg", "10000000-0000-4000-8000-000000000004"],
  ["00000000-0000-4000-8000-000000000011", "Baseus", "شاحن Baseus 20W USB-C", "CABL-BAS-20W", 12.50, "شاحن USB-C سريع بقدرة 20W", "https://cdn.shopify.com/s/files/1/0555/8432/5709/products/Baseus_Compact_3_ports_Fast_Charger_30W_Black_1_front_side.jpg?v=1667903787", "10000000-0000-4000-8000-000000000002"],
  ["00000000-0000-4000-8000-000000000012", "Baseus", "شاحن Baseus بمنفذين 33W", "CABL-BAS-33W", 18.00, "شاحن مزدوج USB-C و USB-A بقدرة 33W", "https://cdn.shopify.com/s/files/1/0555/8432/5709/files/Baseus_PicoGo_AN13_Fast_Charger_2C_45W_1.jpg?v=1757405524", "10000000-0000-4000-8000-000000000002"],
  ["00000000-0000-4000-8000-000000000013", "Baseus", "شاحن Baseus GaN بقدرة 65W", "CABL-BAS-65W", 34.00, "شحن GaN سريع للأجهزة اليومية", "https://cdn.shopify.com/s/files/1/0555/8432/5709/files/Baseus_GaN5_Pro_2_Pack_Fast_Charger_2C_U_65W_1.jpg?v=1778656625", "10000000-0000-4000-8000-000000000002"],
  ["00000000-0000-4000-8000-000000000014", "Baseus", "شاحن Baseus GaN بقدرة 100W", "CABL-BAS-100W", 54.00, "طاقة عالية للحواسيب والأجهزة المحمولة", "https://cdn.shopify.com/s/files/1/0555/8432/5709/files/Baseus_PicoGo_AE21_Fast_Charger_2C_U_100W_1.jpg?v=1761289660", "10000000-0000-4000-8000-000000000002"],
  ["00000000-0000-4000-8000-000000000015", "Baseus", "كابل Baseus USB-A إلى USB-C", "CABL-BAS-A2C", 7.50, "كابل شحن ومزامنة USB-A إلى USB-C", "https://cdn.shopify.com/s/files/1/0555/8432/5709/products/Baseus_Cafule_USB-C_to_USB-C_Cable_100W_6.6_ft_1_front.jpg?v=1667903529", "10000000-0000-4000-8000-000000000003"],
  ["00000000-0000-4000-8000-000000000016", "Baseus", "كابل Baseus USB-C إلى USB-C بقدرة 60W", "CABL-BAS-C2C60", 9.50, "كابل USB-C إلى USB-C بقدرة 60W", "https://cdn.shopify.com/s/files/1/0555/8432/5709/files/Baseus_Free2Pull_Mini_Retractable_USB-C_Cable_60W_White_1.jpg?v=1715158422", "10000000-0000-4000-8000-000000000003"],
  ["00000000-0000-4000-8000-000000000017", "Baseus", "كابل Baseus USB-C إلى USB-C بقدرة 100W", "CABL-BAS-C2C100", 12.50, "كابل USB-C إلى USB-C بقدرة 100W", "https://cdn.shopify.com/s/files/1/0555/8432/5709/products/Baseus_USB-C_to_USB-C_Cable_100W_3.3ft_1_front.jpg?v=1667906429", "10000000-0000-4000-8000-000000000003"],
  ["00000000-0000-4000-8000-000000000018", "Baseus", "كابل Baseus USB-C إلى Lightning", "CABL-BAS-C2L", 11.50, "كابل USB-C إلى Lightning للشحن السريع", "https://cdn.shopify.com/s/files/1/0555/8432/5709/files/Baseus_Nomos_Retractable_USB-C_Cable_100W_4.9ft_1.jpg?v=1727176467", "10000000-0000-4000-8000-000000000003"],
  ["00000000-0000-4000-8000-000000000019", "Baseus", "باور بنك Baseus بسعة 10,000mAh", "CABL-BAS-PB10K", 22.00, "طاقة محمولة للاستخدام اليومي", "https://cdn.shopify.com/s/files/1/0555/8432/5709/products/Baseus_Adaman_Power_Bank_22.5W_10000mAh_1_front.jpg?v=1667906493", "10000000-0000-4000-8000-000000000001"],
  ["00000000-0000-4000-8000-000000000020", "Baseus", "باور بنك Baseus 20,000mAh / 22.5W", "CABL-BAS-PB20K22", 30.00, "سعة كبيرة وشحن سريع 22.5W", "https://cdn.shopify.com/s/files/1/0555/8432/5709/files/Baseus_EnerFill_FC11_Power_Bank_with_Dual_Built_in__Cables_20000mAh_45W_Black_1.jpg?v=1775810008", "10000000-0000-4000-8000-000000000001"],
  ["00000000-0000-4000-8000-000000000021", "Baseus", "باور بنك Baseus 20,000mAh / 30W", "CABL-BAS-PB20K30", 38.00, "سعة كبيرة وشحن سريع 30W", "https://cdn.shopify.com/s/files/1/0555/8432/5709/files/Baseus_EnerCore_CR11_Power_Bank_with_Retractable_Cable_20000mAh_100W_1.jpg?v=1750760050", "10000000-0000-4000-8000-000000000001"],
  ["00000000-0000-4000-8000-000000000022", "Baseus", "شاحن سيارة Baseus بمنفذين 30W", "CABL-BAS-CAR30", 16.00, "شاحن سيارة مزدوج بقدرة 30W", "https://cdn.shopify.com/s/files/1/0555/8432/5709/products/Baseus_USB-A_USB-C_Car_Charger_60W_1.jpg?v=1677123988", "10000000-0000-4000-8000-000000000004"],
  ["00000000-0000-4000-8000-000000000023", "Baseus", "حامل هاتف Baseus مغناطيسي للسيارة", "CABL-BAS-HOLDER", 18.00, "حامل هاتف مغناطيسي للسيارة", "https://cdn.shopify.com/s/files/1/0555/8432/5709/files/Baseus_PrimeTrip_C03_Magnetic_Car_Mount_1.jpg?v=1764238515", "10000000-0000-4000-8000-000000000004"],
  ["00000000-0000-4000-8000-000000000024", "Baseus", "محور Baseus USB-C ‏5 في 1 مع HDMI", "CABL-BAS-HUB5", 35.00, "محور USB-C متعدد المنافذ مع HDMI", "https://cdn.shopify.com/s/files/1/0555/8432/5709/products/Baseus_Metal_Gleam_9_in_1_USB_C_Hub_1_front_side.jpg?v=1667905757", "10000000-0000-4000-8000-000000000005"],
  ["00000000-0000-4000-8000-000000000025", "Baseus", "كابل Baseus HDMI 2.1", "CABL-BAS-HDMI21", 15.00, "كابل HDMI 2.1 للصورة والصوت عاليي الجودة", "https://baseusonline.com/uploads/img/pi/173/173089320676/1730893206.jpg", "10000000-0000-4000-8000-000000000005"],
  ["00000000-0000-4000-8000-000000000026", "Anker", "شاحن Anker Nano بقدرة 20W USB-C", "CABL-ANK-20W", 14.00, "شاحن جداري سريع بقدرة 20W", "https://cdn.shopify.com/s/files/1/0493/9834/9974/files/2pack_2cableblack-01_3840x.jpg?v=1731481782", "10000000-0000-4000-8000-000000000002"],
  ["00000000-0000-4000-8000-000000000027", "Anker", "شاحن Anker Nano بقدرة 30W USB-C", "CABL-ANK-30W", 19.00, "شاحن Nano سريع بقدرة 30W", "https://cdn.shopify.com/s/files/1/0493/9834/9974/files/SKU-04-Phantom_Black_3840x.png?v=1764228261", "10000000-0000-4000-8000-000000000002"],
  ["00000000-0000-4000-8000-000000000028", "Anker", "شاحن Anker Nano GaN بقدرة 45W", "CABL-ANK-45W", 29.00, "شاحن Nano GaN بقدرة 45W مع شاشة ذكية", "https://cdn.shopify.com/s/files/1/0493/9834/9974/files/Frame_2147226954_3840x.png?v=1769048905", "10000000-0000-4000-8000-000000000002"],
  ["00000000-0000-4000-8000-000000000029", "Anker", "شاحن Anker Nano II GaN بقدرة 65W", "CABL-ANK-65W", 39.00, "شاحن GaN مدمج بقدرة 65W", "https://cdn.shopify.com/s/files/1/0493/9834/9974/products/A2663111-Anker_715_Charger_Nano_II_65W_3840x.png?v=1767756360", "10000000-0000-4000-8000-000000000002"],
  ["00000000-0000-4000-8000-000000000030", "Anker", "كابل Anker USB-A إلى USB-C", "CABL-ANK-A2C", 8.50, "كابل USB-A إلى USB-C مضفر للشحن والمزامنة", "https://cdn.shopify.com/s/files/1/0493/9834/9974/files/Group29_6ebea34c-6387-440d-adc1-8bb313e74b0c_3840x.png?v=1775968186", "10000000-0000-4000-8000-000000000003"],
  ["00000000-0000-4000-8000-000000000031", "Anker", "كابل Anker USB-C إلى USB-C بقدرة 60W", "CABL-ANK-C2C60", 10.00, "كابل USB-C إلى USB-C للشحن السريع بقدرة 60W", "https://cdn.shopify.com/s/files/1/0493/9834/9974/files/A81E1021_TD01_V1_658086d5-4161-4179-98d0-f41dede70a70_3840x.png?v=1730775241", "10000000-0000-4000-8000-000000000003"],
  ["00000000-0000-4000-8000-000000000032", "Anker", "كابل Anker USB-C إلى USB-C بقدرة 100W", "CABL-ANK-C2C100", 14.00, "كابل USB-C إلى USB-C بقدرة 100W وطول 10 أقدام", "https://cdn.shopify.com/s/files/1/0493/9834/9974/files/Frame_2147226466_3840x.png?v=1763545234", "10000000-0000-4000-8000-000000000003"],
  ["00000000-0000-4000-8000-000000000033", "Anker", "كابل Anker USB-C إلى Lightning", "CABL-ANK-C2L", 13.00, "كابل USB-C إلى Lightning من Anker", "https://cdn.shopify.com/s/files/1/0493/9834/9974/files/A8625011_ND01_V1_4fe4a7c0-fe0a-4ebd-ae6d-022a96174cc5_3840x.png?v=1730776038", "10000000-0000-4000-8000-000000000003"],
  ["00000000-0000-4000-8000-000000000034", "Anker", "باور بنك Anker بسعة 10,000mAh", "CABL-ANK-PB10K", 29.00, "باور بنك محمول بقدرة 30W وكابل USB-C مدمج", "https://cdn.shopify.com/s/files/1/0493/9834/9974/files/A1685011_Rich_image_TD01_US_V1_3c77e0e9-ed80-4e31-a8f8-cdff9e4644a3_3840x.png?v=1753960984", "10000000-0000-4000-8000-000000000001"],
  ["00000000-0000-4000-8000-000000000035", "Anker", "باور بنك Anker بسعة 20,000mAh / 30W", "CABL-ANK-PB20K30", 42.00, "باور بنك عالي السعة بقدرة 30W", "https://cdn.shopify.com/s/files/1/0493/9834/9974/files/Black_20_000_mAh-01_3840x.png?v=1732159201", "10000000-0000-4000-8000-000000000001"],
  ["00000000-0000-4000-8000-000000000036", "Anker", "شاحن سيارة Anker بقدرة 30W أو 50W", "CABL-ANK-CAR50", 21.00, "شاحن سيارة سريع متعدد المنافذ", "https://cdn.shopify.com/s/files/1/0493/9834/9974/files/B2735011_ND01_3840x.png?v=1749783207", "10000000-0000-4000-8000-000000000004"],
  ["00000000-0000-4000-8000-000000000037", "Anker", "محور Anker USB-C ‏7 في 1", "CABL-ANK-HUB7", 45.00, "محور USB-C من Anker بسبعة منافذ", "https://cdn.shopify.com/s/files/1/0493/9834/9974/files/image_11_3f856f3b-1d0b-4609-974f-af0ea4ca2d12_3840x.png?v=1764833041", "10000000-0000-4000-8000-000000000005"],
  ["00000000-0000-4000-8000-000000000038", "UGREEN", "شاحن UGREEN USB-C بثلاثة منافذ 30W", "CABL-UGR-55538", 18.00, "شاحن UGREEN USB-C بثلاثة منافذ وقدرة 30W وتقنية GaN", "https://www.ugreen.com/cdn/shop/files/ab4da9f4776c1d15392b28d3a91da6ca_1cac3ec9-130e-4332-920b-93d8338856cc.webp?v=1766488069&width=1445", "10000000-0000-4000-8000-000000000002"],
  ["00000000-0000-4000-8000-000000000039", "UGREEN", "شاحن UGREEN Nexode بقدرة 45W مع كابل USB-C قابل للسحب", "CABL-UGR-65312", 27.00, "شاحن UGREEN Nexode بقدرة 45W مع كابل USB-C مدمج قابل للسحب وثلاثة منافذ", "https://www.ugreen.com/cdn/shop/files/f8ba0863af04a5d9472e06ce4058a37d.webp?v=1766052404&width=1445", "10000000-0000-4000-8000-000000000002"],
  ["00000000-0000-4000-8000-000000000040", "UGREEN", "شاحن UGREEN Nexode بقدرة 65W مع كابل USB-C قابل للسحب", "CABL-UGR-55897", 36.00, "شاحن UGREEN Nexode بقدرة 65W مع كابل USB-C مدمج قابل للسحب وثلاثة منافذ", "https://www.ugreen.com/cdn/shop/files/5c5fe6b6bea7c9b286442ccc68fe5b04.png?v=1762321971&width=1445", "10000000-0000-4000-8000-000000000002"],
  ["00000000-0000-4000-8000-000000000041", "UGREEN", "شاحن UGREEN Nexode Air USB-C بقدرة 45W", "CABL-UGR-95786", 29.00, "شاحن UGREEN Nexode Air USB-C بقدرة 45W وتقنية GaN مع قابس قابل للطي", "https://www.ugreen.com/cdn/shop/files/X840_95786_a6688d8f-677e-4f59-b366-7875a3642829.webp?v=1781761936&width=1445", "10000000-0000-4000-8000-000000000002"],
  ["00000000-0000-4000-8000-000000000042", "UGREEN", "كابل UGREEN USB-C إلى USB-C بقدرة 100W و5A مضفر بالنايلون", "CABL-UGR-70429", 14.00, "كابل UGREEN USB-C إلى USB-C بقدرة 100W و5A مع تغليف نايلون مضفر", "https://www.ugreen.com/cdn/shop/files/61SC5ARK_NL.jpg?v=1765189854&width=1445", "10000000-0000-4000-8000-000000000003"],
  ["00000000-0000-4000-8000-000000000043", "UGREEN", "كابل UGREEN Nexode USB-C قابل للسحب بقدرة 100W", "CABL-UGR-65904", 16.00, "كابل UGREEN Nexode USB-C إلى USB-C قابل للسحب بقدرة 100W", "https://www.ugreen.com/cdn/shop/files/b6067aaf1cc675699f0d45d87d952ae7.webp?v=1766052433&width=1445", "10000000-0000-4000-8000-000000000003"],
  ["00000000-0000-4000-8000-000000000044", "UGREEN", "كابل UGREEN USB-C إلى USB-C بقدرة 60W — طول 2M", "CABL-UGR-50152", 11.00, "كابل UGREEN USB-C إلى USB-C بقدرة 60W وطول 2 متر ومضفر بالنايلون", "https://uk.ugreen.com/cdn/shop/products/ugreen-usb-c-to-usb-c-60w-charger-cable-braided-50149-937062.png?v=1695723704&width=3840", "10000000-0000-4000-8000-000000000003"],
  ["00000000-0000-4000-8000-000000000045", "UGREEN", "كابل UGREEN USB-C إلى USB-C بقدرة 60W", "CABL-UGR-50150", 10.00, "كابل UGREEN USB-C إلى USB-C بقدرة 60W ونقل بيانات بسرعة 480Mbps", "https://www.ugreen.com/cdn/shop/files/71U9WVoGotL.jpg?v=1765189892&width=1445", "10000000-0000-4000-8000-000000000003"],
  ["00000000-0000-4000-8000-000000000046", "UGREEN", "باور بنك UGREEN بسعة 10,000mAh", "CABL-UGR-PB10K", 28.00, "باور بنك UGREEN Uno بقدرة 30W وسعة 10,000mAh", "https://www.ugreen.com/cdn/shop/files/0f8988c44c76c157a802a4a21d0032ce.png?v=1762322015&width=300", "10000000-0000-4000-8000-000000000001"],
  ["00000000-0000-4000-8000-000000000047", "UGREEN", "باور بنك UGREEN بسعة 20,000mAh / 30W", "CABL-UGR-PB20K30", 41.00, "باور بنك UGREEN عالي السعة", "https://www.ugreen.com/cdn/shop/files/247309e266dff4f7659607ac05079b41.png?v=1762322020&width=300", "10000000-0000-4000-8000-000000000001"],
  ["00000000-0000-4000-8000-000000000049", "UGREEN", "كابل UGREEN Uno USB-C إلى USB-C بقدرة 100W مع شاشة LED", "CABL-UGR-35501", 16.00, "كابل UGREEN Uno USB-C إلى USB-C بقدرة 100W مع شاشة LED ذكية", "https://www.ugreen.com/cdn/shop/files/c5959273e9dd2835422af91a621de3aa.webp?v=1766052046&width=1445", "10000000-0000-4000-8000-000000000003"],
  ["00000000-0000-4000-8000-000000000048", "UGREEN", "شاحن سيارة UGREEN PD سريع بقدرة 60W بمنفذين USB-C", "CABL-UGR-70594", 22.00, "شاحن سيارة UGREEN بقدرة 60W ومنفذين USB-C، يدعم 12–24V", "https://www.ugreen.com/cdn/shop/files/0341a0bcc6a0339889cd1c665d77dd9b.webp?v=1766052447&width=1445", "10000000-0000-4000-8000-000000000004"],
  ["00000000-0000-4000-8000-000000000050", "UGREEN", "محور UGREEN USB-C ‏7 في 1", "CABL-UGR-HUB7", 43.00, "محور UGREEN Revodok Pro USB-C بسبعة منافذ", "https://www.ugreen.com/cdn/shop/files/1795373640d911068a5841b77e48e007.png?v=1762322086&width=300", "10000000-0000-4000-8000-000000000005"],
  ["00000000-0000-4000-8000-000000000051", "Hollyland", "Hollyland LARK M2S Combo", "CABL-HOL-M2S-COMBO", 114.00, "ميكروفون لاسلكي صغير لصناعة المحتوى والمقابلات والبث المباشر، مع نسخة Combo.", "https://store.hollyland.com/cdn/shop/files/6302-lark_m2s-clear-001.png?crop=center&height=280&v=1766029782&width=280", "10000000-0000-4000-8000-000000000006"],
  ["00000000-0000-4000-8000-000000000052", "Hollyland", "Hollyland LARK M2 Combo", "CABL-HOL-M2-COMBO", 99.00, "ميكروفون لاسلكي Lavalier لصناعة المحتوى، مع نسخة Combo ومخرجين USB-C وLightning حسب التكوين.", "https://store.hollyland.com/cdn/shop/files/6301-lark_m2-clear-001.png?crop=center&height=280&v=1766029688&width=280", "10000000-0000-4000-8000-000000000006"],
  ["00000000-0000-4000-8000-000000000053", "Hollyland", "Hollyland LARK M2", "CABL-HOL-M2", 99.00, "ميكروفون لاسلكي خفيف لصناعة المحتوى والبودكاست والمقابلات، مع صوت عالي الدقة.", "https://store.hollyland.com/cdn/shop/files/6301-lark_m2-clear-001.png?crop=center&height=280&v=1766029688&width=280", "10000000-0000-4000-8000-000000000006"],
  ["00000000-0000-4000-8000-000000000054", "Hollyland", "Hollyland LARK A1", "CABL-HOL-A1", 49.90, "ميكروفون لاسلكي لصناعة المحتوى مع إلغاء ضوضاء ذكي وصوت عالي الدقة.", "https://store.hollyland.com/cdn/shop/files/6108-lark_a1-clear-001.png?crop=center&height=280&v=1766029366&width=280", "10000000-0000-4000-8000-000000000006"],
  ["00000000-0000-4000-8000-000000000055", "Soundcore", "Soundcore P41i", "CABL-SCO-P41I", 89.99, "سماعات أذن لاسلكية مع علبة شحن للهاتف، وبطارية طويلة للاستخدام اليومي والسفر.", "https://cdn.shopify.com/s/files/1/0501/7678/6607/files/A3937Z22_Product_Image_04_3840x.png?v=1753427170", "10000000-0000-4000-8000-000000000007"],
  ["00000000-0000-4000-8000-000000000056", "Soundcore", "Soundcore R60i NC", "CABL-SCO-R60I-NC", 49.99, "سماعات أذن لاسلكية من Soundcore للاستخدام اليومي والمكالمات والاستماع المتنقل.", "https://cdn.shopify.com/s/files/1/0516/3761/6830/files/D1202_banner_US_V1.png?v=1764848058", "10000000-0000-4000-8000-000000000007"],
  ["00000000-0000-4000-8000-000000000057", "Soundcore", "Soundcore R50i NC", "CABL-SCO-R50I-NC", 49.99, "سماعات أذن لاسلكية من Soundcore مع نسخة NC للاستخدام اليومي والمكالمات.", "https://cdn.shopify.com/s/files/1/0516/3761/6830/files/20250715-181408.png?v=1752574504", "10000000-0000-4000-8000-000000000007"],
  ["00000000-0000-4000-8000-000000000058", "Soundcore", "Soundcore R50i", "CABL-SCO-R50I", 39.99, "سماعات أذن لاسلكية خفيفة من Soundcore للاستخدام اليومي والاستماع المتنقل.", "https://cdn.shopify.com/s/files/1/0516/3761/6830/files/D1202_banner_US_V1.png?v=1764848058", "10000000-0000-4000-8000-000000000007"],
] as const;

const ugreenReplacementProductIds = [
  "00000000-0000-4000-8000-000000000038",
  "00000000-0000-4000-8000-000000000039",
  "00000000-0000-4000-8000-000000000040",
  "00000000-0000-4000-8000-000000000041",
  "00000000-0000-4000-8000-000000000042",
  "00000000-0000-4000-8000-000000000043",
  "00000000-0000-4000-8000-000000000044",
  "00000000-0000-4000-8000-000000000045",
  "00000000-0000-4000-8000-000000000046",
  "00000000-0000-4000-8000-000000000047",
  "00000000-0000-4000-8000-000000000048",
  "00000000-0000-4000-8000-000000000049",
  "00000000-0000-4000-8000-000000000050",
] as const;

type UgreenSpecificationSeed = {
  productId: string;
  sourceUrl: string;
  sourceNote: string;
  maxPowerW: number | null;
  inputVoltage?: string;
  weightG?: number;
  gan?: boolean;
  portAttribute?: string;
  ports?: Array<{ name: string; typeSlug: string; maxPowerW?: number; maxVoltageV?: number; maxCurrentA?: number }>;
  protocols?: string[];
  profiles?: Array<{ name: string; totalPowerW: number; description: string }>;
  dimensions?: { lengthMm?: number; widthMm?: number; heightMm?: number; weightG?: number; note: string };
  protections?: string[];
  compatibility?: Array<{ categorySlug: string; notes: string }>;
  warrantyMonths?: number;
  cable?: {
    connectorA?: string;
    connectorB?: string;
    lengthM?: number;
    maxPowerW?: number;
    dataSpeedGbps?: number;
    usbVersion?: string;
    eMarker?: boolean;
    videoSupport?: boolean;
    material?: string;
  };
  powerBank?: {
    capacityMah: number;
    inputSummary?: string;
    outputSummary?: string;
    maxOutputW?: number;
    rechargeTimeHours?: number;
    wirelessCharging?: boolean;
    display?: boolean;
    passThroughCharging?: boolean;
  };
  carCharger?: {
    inputVoltageV?: string;
    maxOutputW?: number;
    powerDistribution?: string;
    carCompatibility?: string;
  };
};

const ugreenSpecificationSeed: UgreenSpecificationSeed[] = [
  {
    productId: "00000000-0000-4000-8000-000000000046",
    sourceUrl: "https://www.ugreen.com/en-ae/products/ae-35603",
    sourceNote: "المصدر الرسمي يذكر شحناً ثنائي الاتجاه بقدرة 30W، كابل USB-C مدمجاً، منفذي USB-C وUSB-A، شاشة TFT، وثلاث عشرة طبقة حماية.",
    maxPowerW: 30,
    portAttribute: "USB-C مدمج، USB-C، USB-A",
    ports: [
      { name: "USB-C cable", typeSlug: "usb-c", maxPowerW: 30 },
      { name: "USB-C", typeSlug: "usb-c", maxPowerW: 30 },
      { name: "USB-A", typeSlug: "usb-a" },
    ],
    protocols: ["PD"],
    powerBank: {
      capacityMah: 10000,
      inputSummary: "كابل USB-C مدمج أو منفذ USB-C",
      outputSummary: "كابل USB-C مدمج ومنفذا USB-C وUSB-A",
      maxOutputW: 30,
      display: true,
    },
  },
  {
    productId: "00000000-0000-4000-8000-000000000047",
    sourceUrl: "https://www.ugreen.com/en-au/products/au-55989",
    sourceNote: "المصدر الرسمي يذكر سعة 20,000mAh، منفذي USB-C ومنفذ USB-A، قدرة 30W، أبعاد 150×70×30 مم، وزن 447 غراماً ووقت إعادة شحن يقارب 4 ساعات.",
    maxPowerW: 30,
    portAttribute: "USB-C، USB-C، USB-A",
    ports: [
      { name: "USB-C1", typeSlug: "usb-c", maxPowerW: 30 },
      { name: "USB-C2", typeSlug: "usb-c", maxPowerW: 30 },
      { name: "USB-A", typeSlug: "usb-a" },
    ],
    protocols: ["PD"],
    dimensions: { lengthMm: 150, widthMm: 70, heightMm: 30, weightG: 447, note: "الأبعاد والوزن كما يذكرهما المصدر الرسمي." },
    powerBank: {
      capacityMah: 20000,
      inputSummary: "منفذ USB-C بقدرة 30W",
      outputSummary: "منفذا USB-C ومنفذ USB-A",
      maxOutputW: 30,
      rechargeTimeHours: 4,
    },
  },
  {
    productId: "00000000-0000-4000-8000-000000000050",
    sourceUrl: "https://www.ugreen.com/en-ae/products/ae-15214",
    sourceNote: "المصدر الرسمي يذكر محور Revodok بسبعة منافذ: HDMI بدقة 4K/30Hz، شحن USB-C PD بقدرة 100W، USB-C للبيانات، منفذا USB 3.0 بسرعة 5Gbps، وقارئَي SD وTF، مع هيكل من الألومنيوم وضمان 24 شهراً.",
    maxPowerW: 100,
    portAttribute: "USB-C، HDMI، USB-A، SD، TF",
    ports: [
      { name: "USB-C PD", typeSlug: "usb-c", maxPowerW: 100 },
      { name: "USB-C data", typeSlug: "usb-c" },
      { name: "USB-A 1", typeSlug: "usb-a" },
      { name: "USB-A 2", typeSlug: "usb-a" },
      { name: "HDMI", typeSlug: "hdmi" },
      { name: "SD", typeSlug: "sd" },
      { name: "TF", typeSlug: "tf" },
    ],
    protocols: ["PD"],
    profiles: [{ name: "USB-C pass-through", totalPowerW: 100, description: "شحن مرورّي بقدرة تصل إلى 100W." }],
    warrantyMonths: 24,
  },
  {
    productId: "00000000-0000-4000-8000-000000000038",
    sourceUrl: "https://www.ugreen.com/ar-sa/products/sa-55538",
    sourceNote: "المصدر الرسمي يذكر PD 3.0، ثلاثة منافذ، أبعاد (44×38×33)±0.5 مم، حماية من الجهد الزائد والسخونة الزائدة والقصر، وضمان 24 شهرًا.",
    maxPowerW: 30,
    inputVoltage: "100–240V",
    gan: true,
    portAttribute: "USB-C1، USB-C2، USB-A",
    ports: [
      { name: "USB-C1", typeSlug: "usb-c", maxPowerW: 30 },
      { name: "USB-C2", typeSlug: "usb-c" },
      { name: "USB-A", typeSlug: "usb-a" },
    ],
    protocols: ["PD 3.0"],
    profiles: [{ name: "USB-C PD 3.0", totalPowerW: 30, description: "منفذ USB-C PD 3.0 بقدرة قصوى 30W." }],
    dimensions: { lengthMm: 44, widthMm: 38, heightMm: 33, note: "التفاوت المنشور ±0.5 مم." },
    protections: ["الجهد الزائد", "السخونة الزائدة", "الدائرة القصيرة"],
    compatibility: [{ categorySlug: "phones-tablets", notes: "iPhone 17/16/15/14/13، Samsung Galaxy S25/S24/S23/S22، Xiaomi Redmi Note 14/13/12، POCO X7 Pro/X6 Pro، HONOR X7b/X9c/X6a." }],
    warrantyMonths: 24,
  },
  {
    productId: "00000000-0000-4000-8000-000000000039",
    sourceUrl: "https://www.ugreen.com/ar-ae/products/ae-65312",
    sourceNote: "المصدر الرسمي يذكر ثلاثة منافذ، كابلًا مدمجًا قابلًا للسحب بطول 69 سم، USB-A بقدرة 22.5W، إجمالي 45W، وضمان 24 شهرًا.",
    maxPowerW: 45,
    inputVoltage: "240V",
    gan: true,
    portAttribute: "USB-C، USB-C2، USB-A",
    ports: [
      { name: "USB-C (cable)", typeSlug: "usb-c" },
      { name: "USB-C2", typeSlug: "usb-c" },
      { name: "USB-A", typeSlug: "usb-a", maxPowerW: 22.5 },
    ],
    protocols: ["PD 3.0", "PPS", "QC4+", "QC3.0", "SCP", "Samsung Super Fast Charging 2.0"],
    profiles: [{ name: "Total output", totalPowerW: 45, description: "إجمالي خرج الشاحن 45W؛ الكابل المدمج قابل للسحب بطول 69 سم." }],
    protections: ["Overvoltage", "Overpower", "Undervoltage", "Short-circuit Protection"],
    compatibility: [{ categorySlug: "phones-tablets", notes: "iPhone Air/17/16/15/14/13، Galaxy S24/S23/S22/S21/S20/S10/S9/S8/Note، Pixel 9/8/7/6." }],
    warrantyMonths: 24,
  },
  {
    productId: "00000000-0000-4000-8000-000000000040",
    sourceUrl: "https://www.ugreen.com/products/usa-55897",
    sourceNote: "صفحة UGREEN الرسمية للمنتج 55897 تذكر إجمالي 65W، ثلاثة منافذ، كابل USB-C بقدرة 60W، منفذ USB-C بقدرة 65W، USB-A بقدرة 22.5W، أبعاد (53×50.9×50.4)±0.5 مم ووزن 195g.",
    maxPowerW: 65,
    inputVoltage: "100–240Vac 50/60Hz 1.8A Max",
    weightG: 195,
    gan: true,
    portAttribute: "USB-C cable، USB-C، USB-A",
    ports: [
      { name: "USB-C (cable)", typeSlug: "usb-c", maxPowerW: 60, maxCurrentA: 3 },
      { name: "USB-C", typeSlug: "usb-c", maxPowerW: 65, maxCurrentA: 3.25 },
      { name: "USB-A", typeSlug: "usb-a", maxPowerW: 22.5 },
    ],
    protocols: ["PD3.0/2.0", "PPS", "QC3.0", "QC2.0", "AFC", "SCP", "FCP", "APPLE 2.4A", "SAMSUNG 5V/2A", "BC1.2"],
    profiles: [
      { name: "USB-C cable output", totalPowerW: 60, description: "5V/3A، 9V/3A، 12V/3A، 15V/3A، 20V/3A؛ PPS 5–21V/3A." },
      { name: "USB-C output", totalPowerW: 65, description: "5V/3A، 9V/3A، 12V/3A، 15V/3A، 20V/3.25A؛ PPS 5–11V/4.5A." },
      { name: "USB-A output", totalPowerW: 22.5, description: "5V/3A، 9V/2A، 12V/1.5A، 10V/2.25A." },
    ],
    dimensions: { lengthMm: 53, widthMm: 50.9, heightMm: 50.4, weightG: 195, note: "التفاوت المنشور ±0.5 مم." },
    protections: ["Overcurrent", "Overvoltage", "Short Circuit Protection", "Overtemperature Protection"],
    compatibility: [{ categorySlug: "phones-tablets", notes: "هواتف وأجهزة USB-C المتوافقة مع بروتوكولات الشحن المنشورة." }, { categorySlug: "laptops", notes: "أجهزة اللابتوب المتوافقة مع خرج USB-C حتى 65W." }],
  },
  {
    productId: "00000000-0000-4000-8000-000000000041",
    sourceUrl: "https://www.ugreen.com/en-ae/products/ae-95786",
    sourceNote: "المصدر الرسمي يذكر خرجًا أقصى 45W، منفذ USB-C واحد، جهد 240V، وتقنيات PD3.2/PD3.0 وPPS وQC وFCP وSCP وAFC وBC1.2 وAVS.",
    maxPowerW: 45,
    inputVoltage: "240V",
    gan: true,
    portAttribute: "USB-C",
    ports: [{ name: "USB-C", typeSlug: "usb-c", maxPowerW: 45 }],
    protocols: ["PD3.2", "PD3.0", "PPS", "QC3.0", "QC2.0", "FCP", "SCP", "AFC", "BC1.2", "APPLE 2.4A", "Galaxy 5V/2A", "AVS"],
    profiles: [{ name: "USB-C output", totalPowerW: 45, description: "خرج USB-C أقصى 45W." }],
    protections: ["over-voltage", "under-voltage", "over-temperature", "over-current", "interference", "short-circuit"],
    compatibility: [{ categorySlug: "phones-tablets", notes: "iPhone 17/16/15/14/13، Galaxy S26/S25/S24/S23، Xiaomi Redmi وMi، HONOR، iPad وMacBook." }, { categorySlug: "laptops", notes: "MacBook Pro وMacBook Air وأجهزة USB-C المتوافقة." }],
  },
  {
    productId: "00000000-0000-4000-8000-000000000042",
    sourceUrl: "https://www.ugreen.com/ar-ae/products/ae-70429",
    sourceNote: "المصدر الرسمي يذكر USB 2.0، سرعة 480Mbps، 100W و5A، أطوال 2M، E-marker بمقاومة 56Ω، وعدم دعم الفيديو.",
    maxPowerW: 100,
    portAttribute: "USB-C إلى USB-C",
    protocols: ["PD", "Huawei FCP", "Qualcomm QC 3.0", "Xiaomi Fast Charge"],
    compatibility: [{ categorySlug: "phones-tablets", notes: "Smartphone، Tablet، iPhone 15/16/17، Samsung Galaxy S25/S24، iPad، Huawei." }, { categorySlug: "laptops", notes: "Laptop، MacBook Pro/Air، Microsoft، Dell." }],
    warrantyMonths: 24,
    cable: { connectorA: "USB-C", connectorB: "USB-C", lengthM: 2, maxPowerW: 100, dataSpeedGbps: 0.48, usbVersion: "2.0", eMarker: true, videoSupport: false, material: "aluminum alloy shell, nylon braided" },
  },
  {
    productId: "00000000-0000-4000-8000-000000000043",
    sourceUrl: "https://www.ugreen.com/en-ae/products/ae-65904",
    sourceNote: "المصدر الرسمي يذكر 100W، أطوالًا قابلة للضبط من 0.36m إلى 1m، USB 2.0 و480Mbps، PD 3.0، حماية من التيار والحرارة، وضمان 24 شهرًا.",
    maxPowerW: 100,
    portAttribute: "USB-C إلى USB-C",
    protocols: ["PD 3.0"],
    compatibility: [{ categorySlug: "phones-tablets", notes: "iPhone 17/16/15، Samsung Galaxy S25/S24، Xiaomi، Oppo، Vivo، Switch، PS5، Smart Watch." }, { categorySlug: "laptops", notes: "Dell XPS، Huawei، Chromebook، أجهزة اللابتوب المتوافقة." }],
    warrantyMonths: 24,
    cable: { connectorA: "USB-C", connectorB: "USB-C", lengthM: 1, maxPowerW: 100, dataSpeedGbps: 0.48, usbVersion: "USB 2.0", eMarker: true, videoSupport: false, material: "Graphene shielding" },
  },
  {
    productId: "00000000-0000-4000-8000-000000000044",
    sourceUrl: "https://uk.ugreen.com/products/ugreen-usb-c-to-usb-c-60w-charger-cable",
    sourceNote: "المصدر الرسمي البريطاني يذكر SKU 50152 لنسخة 6.5ft، قدرة 60W، تيار 3A، USB 2.0، 480Mbps، دعم PD/PPS/BC1.2، تغليف نايلون مضفر وضمان سنتين.",
    maxPowerW: 60,
    protocols: ["PD", "PPS", "BC1.2"],
    compatibility: [{ categorySlug: "phones-tablets", notes: "iPad، Galaxy، Redmi، Huawei، Pixel، OnePlus، Xperia، Moto، وأجهزة USB-C المتوافقة." }, { categorySlug: "laptops", notes: "MacBook، HP، ThinkPad، ASUS، Microsoft Surface، Chromebook." }],
    warrantyMonths: 24,
    cable: { connectorA: "USB-C", connectorB: "USB-C", lengthM: 1.98, maxPowerW: 60, dataSpeedGbps: 0.48, usbVersion: "USB 2.0", videoSupport: false, material: "Nylon Braided" },
  },
  {
    productId: "00000000-0000-4000-8000-000000000045",
    sourceUrl: "https://www.ugreen.com/ar-ae/products/ae-50150",
    sourceNote: "المصدر الرسمي يذكر 60W، USB-C إلى USB-C، USB 2.0، 480Mbps، مقاومة سحب 56Ω، حماية من التيار والحرارة والقصر وضمان 24 شهرًا.",
    maxPowerW: 60,
    protocols: ["PD fast charge", "Huawei FCP", "Qualcomm QC 3.0", "Xiaomi Fast Charge"],
    compatibility: [{ categorySlug: "phones-tablets", notes: "iPhone، iPad، Galaxy، Huawei، Google Pixel، Xiaomi، GoPro وSwitch." }, { categorySlug: "laptops", notes: "MacBook Pro/Air، Dell XPS، HP Spectre X360." }],
    warrantyMonths: 24,
    cable: { connectorA: "USB-C", connectorB: "USB-C", maxPowerW: 60, dataSpeedGbps: 0.48, usbVersion: "2.0", material: "Nylon-Braided & Aluminium Alloy" },
  },
  {
    productId: "00000000-0000-4000-8000-000000000049",
    sourceUrl: "https://www.ugreen.com/ar-ae/products/ae-35501",
    sourceNote: "المصدر الرسمي يذكر 100W، USB-C إلى USB-C، 20V/5A، 480Mbps، E-marker، خامة نايلون مزدوج الطبقة وشاشة LED.",
    maxPowerW: 100,
    protocols: ["PD"],
    compatibility: [{ categorySlug: "phones-tablets", notes: "iPhone 17/16/15، Galaxy S25/S24/S23، Pixel، iPad وSwitch." }, { categorySlug: "laptops", notes: "MacBook Pro M3، MacBook Air، ThinkPad، Surface، Dell." }],
    warrantyMonths: 24,
    cable: { connectorA: "USB-C", connectorB: "USB-C", maxPowerW: 100, dataSpeedGbps: 0.48, eMarker: true, material: "Aluminum alloy shells, double-layer nylon braided" },
  },
  {
    productId: "00000000-0000-4000-8000-000000000048",
    sourceUrl: "https://www.ugreen.com/ar-ae/products/ae-70594",
    sourceNote: "المصدر الرسمي يذكر 12–24V، إجمالي 60W، منفذين USB-C بقدرة 30W لكل منهما، دعم PD/PPS/QC/FCP/AFC وغيرها، حماية من الجهد والقصر والسخونة وضمان 24 شهرًا.",
    maxPowerW: 60,
    portAttribute: "USB-C، USB-C",
    ports: [
      { name: "USB-C1", typeSlug: "usb-c", maxPowerW: 30 },
      { name: "USB-C2", typeSlug: "usb-c", maxPowerW: 30 },
    ],
    protocols: ["PD3.0", "PD2.0", "PPS", "QC3.0", "QC2.0", "FCP", "AFC", "BC1.2", "DCP", "APPLE 2.4A", "Samsung 5V2A"],
    profiles: [{ name: "2 × USB-C", totalPowerW: 60, description: "كل منفذ USB-C يخرج 30W بشكل مستقل." }],
    protections: ["over-voltage", "short-circuit", "overheating"],
    compatibility: [{ categorySlug: "phones-tablets", notes: "iPhone، Huawei، Samsung، Xiaomi، Drones، Steam Deck، Camera." }, { categorySlug: "car-devices", notes: "متوافق مع السيارات والشاحنات وSUVs بجهد 12–24V." }],
    warrantyMonths: 24,
    carCharger: { inputVoltageV: "12–24", maxOutputW: 60, powerDistribution: "كل منفذ USB-C يخرج 30W بشكل مستقل", carCompatibility: "Trucks/SUVs" },
  },
];

const ugreenSourceSlug = (value: string) => {
  const slug = slugify(value).replace(/^-+|-+$/g, "");
  return `ugreen-${slug || "value"}`;
};

async function seedUgreenSpecifications() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const ids = ugreenReplacementProductIds;
    await client.query(`DELETE FROM "product_attributes" WHERE "product_id" = ANY($1::uuid[])`, [ids]);
    await client.query(`DELETE FROM "product_warranties" WHERE "product_id" = ANY($1::uuid[])`, [ids]);
    await client.query(`DELETE FROM "cable_specifications" WHERE "product_id" = ANY($1::uuid[])`, [ids]);
    await client.query(`DELETE FROM "car_charger_specifications" WHERE "product_id" = ANY($1::uuid[])`, [ids]);
    await client.query(`DELETE FROM "product_charging_protocols" WHERE "product_id" = ANY($1::uuid[])`, [ids]);
    await client.query(`DELETE FROM "charger_power_profile_outputs" WHERE "profile_id" IN (SELECT "id" FROM "charger_power_profiles" WHERE "product_id" = ANY($1::uuid[]))`, [ids]);
    await client.query(`DELETE FROM "charger_power_profiles" WHERE "product_id" = ANY($1::uuid[])`, [ids]);
    await client.query(`DELETE FROM "charger_ports" WHERE "product_id" = ANY($1::uuid[])`, [ids]);
    await client.query(`DELETE FROM "product_dimensions" WHERE "product_id" = ANY($1::uuid[])`, [ids]);
    await client.query(`DELETE FROM "product_protections" WHERE "product_id" = ANY($1::uuid[])`, [ids]);
    await client.query(`DELETE FROM "product_compatibility" WHERE "product_id" = ANY($1::uuid[])`, [ids]);

    const attributeRows = await client.query<{ id: string; slug: string }>(
      `SELECT "id", "slug" FROM "attributes" WHERE "slug" = ANY($1::text[])`,
      [["max_power_w", "gan", "port_type", "input_voltage_v", "weight_g"]],
    );
    const attributeIds = new Map(attributeRows.rows.map((row) => [row.slug, row.id]));
    const portTypes = await client.query<{ id: string; slug: string }>(
      `SELECT "id", "slug" FROM "port_types" WHERE "slug" = ANY($1::text[])`,
      [["usb-c", "usb-a", "hdmi", "sd", "tf"]],
    );
    const portTypeIds = new Map(portTypes.rows.map((row) => [row.slug, row.id]));
    const compatibilityRows = await client.query<{ id: string; slug: string }>(
      `SELECT "id", "slug" FROM "compatibility_categories" WHERE "slug" = ANY($1::text[])`,
      [["phones-tablets", "laptops", "car-devices"]],
    );
    const compatibilityIds = new Map(compatibilityRows.rows.map((row) => [row.slug, row.id]));

    const protocolNames = [...new Set(ugreenSpecificationSeed.flatMap((item) => item.protocols ?? []))];
    for (const name of protocolNames) {
      await client.query(
        `INSERT INTO "charging_protocols" ("name","slug","active") VALUES ($1,$2,TRUE)
         ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name", "active" = TRUE`,
        [name, ugreenSourceSlug(name)],
      );
    }
    const protocolRows = await client.query<{ id: string; slug: string }>(
      `SELECT "id", "slug" FROM "charging_protocols" WHERE "slug" = ANY($1::text[])`,
      [protocolNames.map(ugreenSourceSlug)],
    );
    const protocolIds = new Map(protocolRows.rows.map((row) => [row.slug, row.id]));

    const protectionNames = [...new Set(ugreenSpecificationSeed.flatMap((item) => item.protections ?? []))];
    for (const name of protectionNames) {
      await client.query(
        `INSERT INTO "protection_types" ("name","slug","active") VALUES ($1,$2,TRUE)
         ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name", "active" = TRUE`,
        [name, ugreenSourceSlug(name)],
      );
    }
    const protectionRows = await client.query<{ id: string; slug: string }>(
      `SELECT "id", "slug" FROM "protection_types" WHERE "slug" = ANY($1::text[])`,
      [protectionNames.map(ugreenSourceSlug)],
    );
    const protectionIds = new Map(protectionRows.rows.map((row) => [row.slug, row.id]));

    for (const item of ugreenSpecificationSeed) {
      const addAttribute = async (slug: string, value: { text?: string; number?: number; boolean?: boolean }) => {
        const attributeId = attributeIds.get(slug);
        if (!attributeId) return;
        await client.query(
          `INSERT INTO "product_attributes" ("product_id","attribute_id","value_text","value_number","value_boolean","source_url","source_note")
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT ("product_id","attribute_id") DO UPDATE SET
             "value_text" = EXCLUDED."value_text", "value_number" = EXCLUDED."value_number",
             "value_boolean" = EXCLUDED."value_boolean", "source_url" = EXCLUDED."source_url",
             "source_note" = EXCLUDED."source_note", "updated_at" = NOW()`,
          [item.productId, attributeId, value.text ?? null, value.number ?? null, value.boolean ?? null, item.sourceUrl, item.sourceNote],
        );
      };
      if (item.maxPowerW !== null) await addAttribute("max_power_w", { number: item.maxPowerW });
      if (item.inputVoltage) await addAttribute("input_voltage_v", { text: item.inputVoltage });
      if (item.weightG !== undefined) await addAttribute("weight_g", { number: item.weightG });
      if (item.gan !== undefined) await addAttribute("gan", { boolean: item.gan });
      if (item.portAttribute) await addAttribute("port_type", { text: item.portAttribute });

      if (item.warrantyMonths) {
        await client.query(
          `INSERT INTO "product_warranties" ("product_id","warranty_months","warranty_note","source_url","source_note")
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT ("product_id") DO UPDATE SET "warranty_months" = EXCLUDED."warranty_months",
             "warranty_note" = EXCLUDED."warranty_note", "source_url" = EXCLUDED."source_url",
             "source_note" = EXCLUDED."source_note", "updated_at" = NOW()`,
          [item.productId, item.warrantyMonths, `${item.warrantyMonths} شهر`, item.sourceUrl, item.sourceNote],
        );
      }

      if (item.cable) {
        await client.query(
          `INSERT INTO "cable_specifications" ("product_id","connector_a","connector_b","length_m","max_power_w","data_speed_gbps","usb_version","e_marker","video_support","material","source_url","source_note")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
           ON CONFLICT ("product_id") DO UPDATE SET "connector_a"=EXCLUDED."connector_a","connector_b"=EXCLUDED."connector_b",
             "length_m"=EXCLUDED."length_m","max_power_w"=EXCLUDED."max_power_w","data_speed_gbps"=EXCLUDED."data_speed_gbps",
             "usb_version"=EXCLUDED."usb_version","e_marker"=EXCLUDED."e_marker","video_support"=EXCLUDED."video_support",
             "material"=EXCLUDED."material","source_url"=EXCLUDED."source_url","source_note"=EXCLUDED."source_note","updated_at"=NOW()`,
          [item.productId, item.cable.connectorA ?? null, item.cable.connectorB ?? null, item.cable.lengthM ?? null, item.cable.maxPowerW ?? null, item.cable.dataSpeedGbps ?? null, item.cable.usbVersion ?? null, item.cable.eMarker ?? null, item.cable.videoSupport ?? null, item.cable.material ?? null, item.sourceUrl, item.sourceNote],
        );
      }

      if (item.powerBank) {
        await client.query(
          `INSERT INTO "power_bank_specifications"
             ("product_id","capacity_mah","input_summary","output_summary","max_output_w","recharge_time_hours","wireless_charging","display","pass_through_charging","source_url","source_note")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
           ON CONFLICT ("product_id") DO UPDATE SET
             "capacity_mah"=EXCLUDED."capacity_mah","input_summary"=EXCLUDED."input_summary",
             "output_summary"=EXCLUDED."output_summary","max_output_w"=EXCLUDED."max_output_w",
             "recharge_time_hours"=EXCLUDED."recharge_time_hours","wireless_charging"=EXCLUDED."wireless_charging",
             "display"=EXCLUDED."display","pass_through_charging"=EXCLUDED."pass_through_charging",
             "source_url"=EXCLUDED."source_url","source_note"=EXCLUDED."source_note","updated_at"=NOW()`,
          [
            item.productId,
            item.powerBank.capacityMah,
            item.powerBank.inputSummary ?? null,
            item.powerBank.outputSummary ?? null,
            item.powerBank.maxOutputW ?? null,
            item.powerBank.rechargeTimeHours ?? null,
            item.powerBank.wirelessCharging ?? null,
            item.powerBank.display ?? null,
            item.powerBank.passThroughCharging ?? null,
            item.sourceUrl,
            item.sourceNote,
          ],
        );
      }

      if (item.carCharger) {
        await client.query(
          `INSERT INTO "car_charger_specifications" ("product_id","input_voltage_v","max_output_w","power_distribution","car_compatibility","source_url","source_note")
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT ("product_id") DO UPDATE SET "input_voltage_v"=EXCLUDED."input_voltage_v","max_output_w"=EXCLUDED."max_output_w",
             "power_distribution"=EXCLUDED."power_distribution","car_compatibility"=EXCLUDED."car_compatibility",
             "source_url"=EXCLUDED."source_url","source_note"=EXCLUDED."source_note","updated_at"=NOW()`,
          [item.productId, item.carCharger.inputVoltageV ?? null, item.carCharger.maxOutputW ?? null, item.carCharger.powerDistribution ?? null, item.carCharger.carCompatibility ?? null, item.sourceUrl, item.sourceNote],
        );
      }

      for (const port of item.ports ?? []) {
        const portTypeId = portTypeIds.get(port.typeSlug);
        if (!portTypeId) continue;
        await client.query(
          `INSERT INTO "charger_ports" ("product_id","port_name","port_type_id","max_power_w","max_voltage_v","max_current_a","sort_order","source_url","source_note")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT ("product_id","port_name") DO UPDATE SET "port_type_id"=EXCLUDED."port_type_id","max_power_w"=EXCLUDED."max_power_w",
             "max_voltage_v"=EXCLUDED."max_voltage_v","max_current_a"=EXCLUDED."max_current_a","sort_order"=EXCLUDED."sort_order",
             "source_url"=EXCLUDED."source_url","source_note"=EXCLUDED."source_note","updated_at"=NOW()`,
          [item.productId, port.name, portTypeId, port.maxPowerW ?? null, port.maxVoltageV ?? null, port.maxCurrentA ?? null, item.ports?.indexOf(port) ?? 0, item.sourceUrl, item.sourceNote],
        );
      }

      const productPorts = await client.query<{ id: string }>(
        `SELECT "id" FROM "charger_ports" WHERE "product_id" = $1 ORDER BY "sort_order","port_name"`,
        [item.productId],
      );
      for (const name of item.protocols ?? []) {
        const protocolId = protocolIds.get(ugreenSourceSlug(name));
        if (!protocolId) continue;
        await client.query(
          `INSERT INTO "product_charging_protocols" ("product_id","protocol_id","port_id","source_url","source_note")
           VALUES ($1,$2,NULL,$3,$4)
           ON CONFLICT DO NOTHING`,
          [item.productId, protocolId, item.sourceUrl, item.sourceNote],
        );
      }
      for (const profile of item.profiles ?? []) {
        const profileRow = await client.query<{ id: string }>(
          `INSERT INTO "charger_power_profiles" ("product_id","configuration_name","total_power_w","description","sort_order","source_url","source_note")
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT ("product_id","configuration_name") DO UPDATE SET "total_power_w"=EXCLUDED."total_power_w",
             "description"=EXCLUDED."description","sort_order"=EXCLUDED."sort_order","source_url"=EXCLUDED."source_url",
             "source_note"=EXCLUDED."source_note","updated_at"=NOW()
           RETURNING "id"`,
          [item.productId, profile.name, profile.totalPowerW, profile.description, item.profiles?.indexOf(profile) ?? 0, item.sourceUrl, item.sourceNote],
        );
        const profileId = profileRow.rows[0]?.id;
        if (profileId && productPorts.rows[0]) {
          await client.query(
            `INSERT INTO "charger_power_profile_outputs" ("profile_id","port_id","power_w")
             VALUES ($1,$2,$3)
             ON CONFLICT ("profile_id","port_id") DO UPDATE SET "power_w"=EXCLUDED."power_w"`,
            [profileId, productPorts.rows[0].id, profile.totalPowerW],
          );
        }
      }
      if (item.dimensions) {
        await client.query(
          `INSERT INTO "product_dimensions" ("product_id","length_mm","width_mm","height_mm","weight_g","source_url","source_note")
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT ("product_id") DO UPDATE SET "length_mm"=EXCLUDED."length_mm","width_mm"=EXCLUDED."width_mm",
             "height_mm"=EXCLUDED."height_mm","weight_g"=EXCLUDED."weight_g","source_url"=EXCLUDED."source_url",
             "source_note"=EXCLUDED."source_note","updated_at"=NOW()`,
          [item.productId, item.dimensions.lengthMm ?? null, item.dimensions.widthMm ?? null, item.dimensions.heightMm ?? null, item.dimensions.weightG ?? null, item.sourceUrl, `${item.sourceNote} ${item.dimensions.note}`],
        );
      }
      for (const name of item.protections ?? []) {
        const protectionId = protectionIds.get(ugreenSourceSlug(name));
        if (!protectionId) continue;
        await client.query(
          `INSERT INTO "product_protections" ("product_id","protection_id","source_url","source_note")
           VALUES ($1,$2,$3,$4)
           ON CONFLICT ("product_id","protection_id") DO UPDATE SET "source_url"=EXCLUDED."source_url","source_note"=EXCLUDED."source_note","updated_at"=NOW()`,
          [item.productId, protectionId, item.sourceUrl, item.sourceNote],
        );
      }
      for (const compatibility of item.compatibility ?? []) {
        const compatibilityId = compatibilityIds.get(compatibility.categorySlug);
        if (!compatibilityId) continue;
        await client.query(
          `INSERT INTO "product_compatibility" ("product_id","compatibility_category_id","compatibility_type","notes","source_url","source_note")
           VALUES ($1,$2,'supported',$3,$4,$5)
           ON CONFLICT ("product_id","compatibility_category_id") DO UPDATE SET "compatibility_type"='supported',
             "notes"=EXCLUDED."notes","source_url"=EXCLUDED."source_url","source_note"=EXCLUDED."source_note","updated_at"=NOW()`,
          [item.productId, compatibilityId, compatibility.notes, item.sourceUrl, item.sourceNote],
        );
      }
    }
    await client.query("COMMIT");
    return ugreenSpecificationSeed.length;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

const catalogSourcePendingNote = "مستورد من بيانات الكتالوج الحالية؛ يحتاج رابطًا رسميًا للتحقق.";

const catalogOfficialSourceUrls: Record<string, string> = {
  "CABL-UGR-HUB7": "https://www.ugreen.com/en-ae/products/ae-15214",
  "CABL-UGR-PB20K30": "https://www.ugreen.com/en-au/products/au-55989",
  "CABL-UGR-PB10K": "https://www.ugreen.com/en-ae/products/ae-35603",
  "CABL-ANK-HUB7": "https://www.anker.com/products/a83d2-usb-c-hub-7-in-1",
  "CABL-ANK-PB20K30": "https://service.anker.com/product-description/a08J1000000YcHbIAK",
  "CABL-ANK-PB10K": "https://www.anker.com/products/a1637",
  "CABL-ANK-C2L": "https://www.anker.com/products/a81a7",
  "CABL-ANK-C2C100": "https://www.anker.com/products/a8758",
  "CABL-ANK-C2C60": "https://www.anker.com/products/a8753",
  "CABL-ANK-A2C": "https://www.anker.com/products/a82g2",
  "CABL-ANK-65W": "https://www.anker.com/eu-en/products/a2663",
  "CABL-ANK-45W": "https://www.anker.com/products/a2692-45w-usb-c-fast-charger",
  "CABL-ANK-30W": "https://www.anker.com/products/a2147",
  "CABL-ANK-20W": "https://www.anker.com/products/a2637-nano-20w-charger",
  "CABL-BAS-C2C100": "https://www.baseus.com/products/usb-c-to-usb-c-cable-100w",
  "CABL-BAS-C2C60": "https://www.baseus.com/products/free2pull-mini-retractable-usb-c-cable-60w",
  "CABL-BAS-PB20K30": "https://www.baseus.com/products/adaman2-power-bank-30w-20000mah-vooc",
  "CABL-BAS-100W": "https://www.baseus.com/products/gan2-usb-c-fast-charger-100w",
  "CABL-VEN-TRAVEL65": "https://ventiontech.com/products/3-port-usb-c-c-a-gan-universal-travel-adapter-65w-65w-30w-black",
  "CABL-VEN-C100": "https://ventiontech.com/products/usb-type-c-to-usb-c-cable-usb-c-pd-100w-60w-fast-charger-for-samsung-s20-macbook-ipad-quick-charge-4-0-usb-c-charge-cord",
  "CABL-VEN-GAN100": "https://ventiontech.com/products/3-port-usb-c-c-a-gan-charger-100w-100w-30w-eu-plug",
  "CABL-VEN-GAN70": "https://ventiontech.com/products/3-port-usb-c-c-a-gan-charger-70w-70w-22-5w-eu-plug-gray-1",
  "CABL-VEN-GAN65": "https://ventiontech.com/products/3-port-usb-c-c-a-gan-charger-65w-65w-60w-eu-plug-black",
  "CABL-VEN-GAN30K": "https://ventiontech.com/products/2-port-usb-c-a-gan-charger-30w-30w-with-usb-c-to-usb-c-cable",
  "CABL-VEN-PB10KL": "https://ventiontech.com/products/vention-10000mah-power-bank-usb-c-usb-a-with-built-in-cable-22-5w-led-display-type",
  "CABL-VEN-PB10K": "https://ventiontech.com/products/10000mah-power-bank-micro-usb-usb-c-usb-a-usb-a-22-5w",
  "CABL-VEN-PB20K": "https://ventiontech.com/products/20000mah-power-bank",
  "CABL-SCO-P41I": "https://www.soundcore.com/products/a3937-p41i-ture-wireless-earbuds",
  "CABL-SCO-R60I-NC": "https://www.soundcore.com/products/a3958-r60i-nc",
  "CABL-SCO-R50I-NC": "https://www.soundcore.com/products/a3959-p30i",
  "CABL-SCO-R50I": "https://www.soundcore.com/products/a3949-r50i",
};

async function seedCatalogSourceUrls() {
  const client = await pool.connect();
  let applied = 0;
  try {
    await client.query("BEGIN");
    for (const [sku, sourceUrl] of Object.entries(catalogOfficialSourceUrls)) {
      const product = await client.query<{ id: string }>(
        `SELECT "id" FROM "products" WHERE "SKU" = $1 LIMIT 1`,
        [sku],
      );
      const productId = product.rows[0]?.id;
      if (!productId) continue;
      for (const table of [
        "product_attributes",
        "cable_specifications",
        "power_bank_specifications",
        "car_charger_specifications",
      ]) {
        const result = await client.query(
          `UPDATE "${table}"
           SET "source_url" = COALESCE("source_url", $2),
               "source_note" = CASE WHEN "source_url" IS NULL THEN 'تم التحقق من صفحة الشركة الرسمية.' ELSE "source_note" END,
               "updated_at" = NOW()
           WHERE "product_id" = $1 AND "source_url" IS NULL`,
          [productId, sourceUrl],
        );
        applied += result.rowCount ?? 0;
      }
    }
    const unresolved = await client.query<{ sku: string; brand: string; name: string }>(
      `SELECT p."SKU" AS "sku", p."brand", p."product_name" AS "name"
       FROM "products" p
       WHERE p."published" = TRUE
         AND NOT EXISTS (
           SELECT 1 FROM "product_attributes" pa
           WHERE pa."product_id" = p."id" AND pa."source_url" IS NOT NULL
         )
         AND NOT EXISTS (
           SELECT 1 FROM "cable_specifications" cs
           WHERE cs."product_id" = p."id" AND cs."source_url" IS NOT NULL
         )
         AND NOT EXISTS (
           SELECT 1 FROM "power_bank_specifications" pb
           WHERE pb."product_id" = p."id" AND pb."source_url" IS NOT NULL
         )
         AND NOT EXISTS (
           SELECT 1 FROM "car_charger_specifications" cc
           WHERE cc."product_id" = p."id" AND cc."source_url" IS NOT NULL
         )
       ORDER BY p."brand", p."SKU"`,
    );
    await client.query("COMMIT");
    return { applied, unresolved: unresolved.rows };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function firstNumber(text: string, pattern: RegExp) {
  const match = text.match(pattern);
  if (!match?.[1]) return null;
  const value = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(value) && value > 0 ? value : null;
}

async function seedCatalogDerivedSpecifications() {
  const client = await pool.connect();
  let importedAttributes = 0;
  let importedModules = 0;
  const missingSourceProducts: Array<{ sku: string; brand: string; name: string }> = [];
  try {
    await client.query("BEGIN");
    const attributeRows = await client.query<{ id: string; slug: string }>(
      `SELECT "id", "slug" FROM "attributes"
       WHERE "slug" = ANY($1::text[])`,
      [["max_power_w", "gan", "capacity_mah", "port_type"]],
    );
    const attributeIds = new Map(attributeRows.rows.map((row) => [row.slug, row.id]));
    const products = await client.query<{
      id: string;
      brand: string;
      product_name: string;
      sku: string;
      short_description: string | null;
      product_description: string | null;
      category_slug: string | null;
    }>(
      `SELECT p."id", p."brand", p."product_name", p."SKU" AS "sku",
              p."short_description", p."product_description", c."slug" AS "category_slug"
       FROM "products" p
       LEFT JOIN LATERAL (
         SELECT c1."slug"
         FROM "product_categories" pc1
         JOIN "categories" c1 ON c1."id" = pc1."category_id" AND c1."active" = TRUE
         WHERE pc1."product_id" = p."id"
         ORDER BY c1."parent_id" NULLS FIRST, c1."category_name"
         LIMIT 1
       ) c ON TRUE
       WHERE p."published" = TRUE`,
    );
    const portTypes = await client.query<{ id: string; slug: string }>(
      `SELECT "id", "slug" FROM "port_types" WHERE "slug" = ANY($1::text[])`,
      [["usb-c", "usb-a"]],
    );
    const portTypeIds = new Map(portTypes.rows.map((row) => [row.slug, row.id]));

    for (const product of products.rows) {
      const text = `${product.product_name} ${product.short_description ?? ""} ${product.product_description ?? ""}`;
      if (product.brand !== "UGREEN") {
        missingSourceProducts.push({ sku: product.sku, brand: product.brand, name: product.product_name });
      }
      const maxPowerW = firstNumber(text, /(\d+(?:\.\d+)?)\s*W\b/i);
      const capacityMah = firstNumber(text, /(\d[\d,]*)\s*mAh\b/i);
      const gan = /\bGaN\b/i.test(text);
      const portTokens = [...new Set(text.match(/USB-[A-Z]+|Lightning|C\+C\+A|C\+C|C\+A/gi) ?? [])];
      const portType = portTokens.length ? portTokens.join("، ") : null;
      const addAttribute = async (slug: string, value: { text?: string; number?: number; boolean?: boolean }) => {
        const attributeId = attributeIds.get(slug);
        if (!attributeId) return;
        const result = await client.query(
          `INSERT INTO "product_attributes" ("product_id","attribute_id","value_text","value_number","value_boolean","source_note")
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT ("product_id","attribute_id") DO NOTHING`,
          [product.id, attributeId, value.text ?? null, value.number ?? null, value.boolean ?? null, catalogSourcePendingNote],
        );
        importedAttributes += result.rowCount ?? 0;
      };
      if (maxPowerW !== null) await addAttribute("max_power_w", { number: maxPowerW });
      if (capacityMah !== null) await addAttribute("capacity_mah", { number: capacityMah });
      if (gan) await addAttribute("gan", { boolean: true });
      if (portType) await addAttribute("port_type", { text: portType });

      if (product.category_slug === "charging-cables") {
        const connectorTokens = text.match(/USB-[A-Z]+|Lightning/gi) ?? [];
        const connectorA = connectorTokens[0] ?? null;
        const connectorB = connectorTokens[1] ?? connectorA;
        const lengthM = firstNumber(text, /(\d+(?:\.\d+)?)\s*(?:M|م)\b/i);
        const dataSpeedMbps = firstNumber(text, /(\d+(?:\.\d+)?)\s*Mbps\b/i);
        const usbVersion = text.match(/USB\s*([0-9]+(?:\.[0-9]+)?)/i)?.[1] ? `USB ${text.match(/USB\s*([0-9]+(?:\.[0-9]+)?)/i)?.[1]}` : null;
        const material = /nylon|نايلون|مضفر/i.test(text) ? "Nylon braided" : null;
        const cableResult = await client.query(
          `INSERT INTO "cable_specifications" ("product_id","connector_a","connector_b","length_m","max_power_w","data_speed_gbps","usb_version","material","source_note")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT ("product_id") DO NOTHING`,
          [product.id, connectorA, connectorB, lengthM, maxPowerW, dataSpeedMbps === null ? null : dataSpeedMbps / 1000, usbVersion, material, catalogSourcePendingNote],
        );
        importedModules += cableResult.rowCount ?? 0;
      } else if (product.category_slug === "power-banks") {
        const powerBankResult = await client.query(
          `INSERT INTO "power_bank_specifications" ("product_id","capacity_mah","max_output_w","source_note")
           VALUES ($1,$2,$3,$4)
           ON CONFLICT ("product_id") DO NOTHING`,
          [product.id, capacityMah, maxPowerW, catalogSourcePendingNote],
        );
        importedModules += powerBankResult.rowCount ?? 0;
      } else if (product.category_slug === "travel-adapters" && /سيارة|car/i.test(text)) {
        const inputVoltage = text.match(/(\d+\s*[-–]\s*\d+)\s*V/i)?.[1]?.replace(/\s+/g, "") ?? null;
        const carResult = await client.query(
          `INSERT INTO "car_charger_specifications" ("product_id","input_voltage_v","max_output_w","source_note")
           VALUES ($1,$2,$3,$4)
           ON CONFLICT ("product_id") DO NOTHING`,
          [product.id, inputVoltage, maxPowerW, catalogSourcePendingNote],
        );
        importedModules += carResult.rowCount ?? 0;
      }
    }
    await client.query("COMMIT");
    return { importedAttributes, importedModules, missingSourceProducts };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

type VerifiedCatalogAttributeSeed = {
  sku: string;
  sourceUrl: string;
  valueText?: string;
  maxPowerW?: number;
  portType?: string;
};

const verifiedCatalogAttributeSeed: VerifiedCatalogAttributeSeed[] = [
  {
    sku: "CABL-UGR-HUB7",
    sourceUrl: "https://www.ugreen.com/en-ae/products/ae-15214",
    valueText: "إخراج 4K عند 30Hz عبر HDMI، نقل بيانات بسرعة 5Gbps، وشحن مرورّي حتى 100W",
    maxPowerW: 100,
    portType: "USB-C، HDMI، USB-A، SD، TF",
  },
  {
    sku: "CABL-UGR-PB10K",
    sourceUrl: "https://www.ugreen.com/en-ae/products/ae-35603",
    valueText: "كابل USB-C مدمج وشاشة TFT وشحن ثنائي الاتجاه بقدرة 30W",
  },
  {
    sku: "CABL-ANK-HUB7",
    sourceUrl: "https://www.anker.com/products/a83d2-usb-c-hub-7-in-1",
    valueText: "إخراج 4K عند 60Hz عبر HDMI، نقل بيانات بسرعة 5Gbps، وشحن مرورّي حتى 85W",
    maxPowerW: 85,
    portType: "USB-C، HDMI، USB-A، SD، microSD",
  },
  {
    sku: "CABL-HOL-A1",
    sourceUrl: "https://www.hollyland.com/product/lark-a1",
    valueText: "تسجيل 24-bit/48kHz وإلغاء ضوضاء ذكي بثلاثة مستويات",
  },
  {
    sku: "CABL-HOL-M2-COMBO",
    sourceUrl: "https://www.hollyland.com/product/lark-m2",
    valueText: "تسجيل 24-bit/48kHz وإلغاء ضوضاء بيئي ENC وبطارية تصل إلى 40 ساعة",
  },
  {
    sku: "CABL-HOL-M2",
    sourceUrl: "https://www.hollyland.com/product/lark-m2",
    valueText: "تسجيل 24-bit/48kHz وإلغاء ضوضاء بيئي ENC وبطارية تصل إلى 40 ساعة",
  },
  {
    sku: "CABL-HOL-M2S-COMBO",
    sourceUrl: "https://www.hollyland.com/product/lark-m2s",
    valueText: "تسجيل 24-bit/48kHz وإلغاء ضوضاء بيئي ENC ومدى لاسلكي يصل إلى 300 متر وبطارية تصل إلى 30 ساعة ووزن 7 غرامات للميكروفون",
  },
  {
    sku: "CABL-SCO-P41I",
    sourceUrl: "https://www.soundcore.com/products/a3937-p41i-ture-wireless-earbuds",
    valueText: "علبة شحن تشحن الهاتف، بطارية تصل إلى 192 ساعة، إلغاء ضوضاء تكيفي، ومحركات 11 مم",
  },
];

async function seedVerifiedCatalogSpecifications() {
  const client = await pool.connect();
  let applied = 0;
  try {
    await client.query("BEGIN");
    const attributeRows = await client.query<{ id: string; slug: string }>(
      `SELECT "id", "slug" FROM "attributes"
       WHERE "slug" = ANY($1::text[])`,
      [["use_case", "max_power_w", "port_type"]],
    );
    const attributeIds = new Map(attributeRows.rows.map((row) => [row.slug, row.id]));
    for (const item of verifiedCatalogAttributeSeed) {
      const product = await client.query<{ id: string }>(
        `SELECT "id" FROM "products" WHERE "SKU" = $1 LIMIT 1`,
        [item.sku],
      );
      const productId = product.rows[0]?.id;
      if (!productId) continue;
      const upsertAttribute = async (slug: string, value: { text?: string; number?: number }) => {
        const attributeId = attributeIds.get(slug);
        if (!attributeId) return;
        const result = await client.query(
          `INSERT INTO "product_attributes"
             ("product_id","attribute_id","value_text","value_number","source_url","source_note")
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT ("product_id","attribute_id") DO UPDATE SET
             "value_text"=EXCLUDED."value_text","value_number"=EXCLUDED."value_number",
             "source_url"=EXCLUDED."source_url","source_note"=EXCLUDED."source_note","updated_at"=NOW()`,
          [
            productId,
            attributeId,
            value.text ?? null,
            value.number ?? null,
            item.sourceUrl,
            "تمت مطابقة المواصفة مع صفحة الشركة الرسمية للموديل نفسه.",
          ],
        );
        applied += result.rowCount ?? 0;
      };
      if (item.valueText) await upsertAttribute("use_case", { text: item.valueText });
      if (item.maxPowerW !== undefined) await upsertAttribute("max_power_w", { number: item.maxPowerW });
      if (item.portType) await upsertAttribute("port_type", { text: item.portType });
    }
    await client.query("COMMIT");
    return applied;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function seedTable(query: string, values: unknown[], conflict = "DO NOTHING") {
  const result = await pool.query(query, values);
  return result.rowCount ?? 0;
}

router.post("/admin/seed", async (req, res): Promise<void> => {
  try {
    const counts: Record<string, number> = {};
    counts.currencies = await seedTable(
      `INSERT INTO "currencies" ("code","name","rate_per_usd","is_default","active") VALUES
       ('YER','ريال يمني',535,TRUE,TRUE),
       ('NYER','ريال يمني جديد',1572,FALSE,TRUE),
       ('SAR','ريال سعودي',3.83,FALSE,TRUE)
       ON CONFLICT ("code") DO UPDATE SET
         "name" = EXCLUDED."name",
         "rate_per_usd" = EXCLUDED."rate_per_usd",
         "is_default" = EXCLUDED."is_default",
         "active" = EXCLUDED."active"`,
      [],
    );
    counts.categories = await seedTable(
      `INSERT INTO "categories"
        ("id", "category_name", "slug", "category_description", "seo_title", "meta_description", "seo_description", "image_path", "seo_indexable", "active")
       VALUES
       ('10000000-0000-4000-8000-000000000001','خوازن الطاقة','power-banks','حلول طاقة محمولة للاستخدام اليومي (Power Bank)','خوازن الطاقة (Power Bank) في اليمن | CABL','قارن خوازن الطاقة حسب السعة والقدرة والمنافذ والتوافر في اليمن.','قارن منتجات خوازن الطاقة (Power Bank) المنشورة في كتالوج CABL قبل الطلب.','images/vention-powerbank-10k.jpg',TRUE,TRUE),
       ('10000000-0000-4000-8000-000000000002','الشواحن','chargers','شواحن Vention بتقنية GaN','شواحن سريعة في اليمن | CABL','شواحن USB-C وGaN بقدرات ومنافذ مختلفة من كتالوج CABL.','راجع القدرة والمنافذ والبروتوكولات قبل اختيار الشاحن.','images/vention-charger-65w.jpg',TRUE,TRUE),
       ('10000000-0000-4000-8000-000000000003','توصيلات','charging-cables','توصيلات شحن ونقل بيانات (Charging Cables)','توصيلات شحن ونقل بيانات | CABL','قارن توصيلات USB-C وLightning حسب الطرف والقدرة والطول.','توصيلات شحن ونقل بيانات منشورة مع بيانات الموديل والتوافر.','images/vention-cable-100w.jpg',TRUE,TRUE),
       ('10000000-0000-4000-8000-000000000004','السفر والسيارة','travel-adapters','حلول الشحن أثناء التنقل','شواحن السيارة والسفر في اليمن | CABL','حلول شحن للسيارة والسفر مع مقارنة القدرة والمنافذ.','اختر ملحق الشحن المناسب للتنقل بعد مراجعة بيانات المنتج.','images/vention-adapter-65w.jpg',TRUE,TRUE),
       ('10000000-0000-4000-8000-000000000005','الملحقات','phone-accessories','محاور وكابلات العرض والاتصال','ملحقات الهاتف والاتصال | CABL','محاور USB-C وكابلات العرض والملحقات من كتالوج CABL.','ملحقات اتصال منشورة مع روابط الأقسام والمنتجات ذات الصلة.','images/baseus-hub.svg',TRUE,TRUE),
        ('10000000-0000-4000-8000-000000000006','مايكروفونات لاسلكية','wireless-microphones','ميكروفونات لاسلكية لصناعة المحتوى والمقابلات والبث المباشر','مايكروفونات لاسلكية في اليمن | CABL','قارن ميكروفونات Hollyland اللاسلكية لصناعة المحتوى والمقابلات والبث المباشر.','ميكروفونات لاسلكية منشورة من Hollyland مع روابط الموديلات والمعلومات المعلنة.','https://store.hollyland.com/cdn/shop/files/6108-lark_a1-clear-001.png?crop=center&height=280&v=1766029366&width=280',TRUE,TRUE),
        ('10000000-0000-4000-8000-000000000007','سماعات أذن لاسلكية','wireless-earbuds','سماعات أذن لاسلكية للاستماع والمكالمات والتنقل','سماعات أذن لاسلكية في اليمن | CABL','قارن سماعات الأذن اللاسلكية حسب الاستخدام والموديل والسعر والتوافر.','سماعات أذن لاسلكية منشورة من Soundcore مع روابط المنتجات والمعلومات المعلنة.','https://cdn.shopify.com/s/files/1/0501/7678/6607/files/A3937Z22_Product_Image_04_3840x.png?v=1753427170',TRUE,TRUE)
       ON CONFLICT ("id") DO UPDATE SET
         "category_name" = EXCLUDED."category_name",
         "slug" = EXCLUDED."slug",
         "category_description" = EXCLUDED."category_description",
         "seo_title" = EXCLUDED."seo_title",
         "meta_description" = EXCLUDED."meta_description",
         "seo_description" = EXCLUDED."seo_description",
         "image_path" = EXCLUDED."image_path",
         "seo_indexable" = EXCLUDED."seo_indexable",
         "active" = EXCLUDED."active"`, []);
     counts.brands = await seedTable(
       `INSERT INTO "brands"
         ("id","brand_name","slug","description","seo_title","meta_description","seo_description","seo_indexable")
        VALUES
         ('70000000-0000-4000-8000-000000000001','Vention','vention','منتجات شحن وطاقة من Vention في كتالوج CABL.','منتجات Vention في اليمن | CABL','تصفح منتجات Vention المنشورة في كتالوج CABL.','منتجات Vention للشحن والطاقة والاستخدام اليومي.','TRUE'),
         ('70000000-0000-4000-8000-000000000002','Baseus','baseus','منتجات Baseus للشحن والطاقة والاتصال.','منتجات Baseus في اليمن | CABL','تصفح منتجات Baseus المنشورة في كتالوج CABL.','منتجات Baseus للشحن والطاقة والاتصال من الكتالوج الحالي.','TRUE'),
         ('70000000-0000-4000-8000-000000000003','Anker','anker','منتجات Anker للشحن والطاقة والاتصال.','منتجات Anker في اليمن | CABL','تصفح منتجات Anker المنشورة في كتالوج CABL.','منتجات Anker للشحن والطاقة والاتصال من الكتالوج الحالي.','TRUE'),
         ('70000000-0000-4000-8000-000000000004','UGREEN','ugreen','منتجات UGREEN للشحن والطاقة والاتصال.','منتجات UGREEN في اليمن | CABL','تصفح منتجات UGREEN المنشورة في كتالوج CABL.','منتجات UGREEN للشحن والطاقة والاتصال من الكتالوج الحالي.','TRUE'),
          ('70000000-0000-4000-8000-000000000005','Hollyland','hollyland','ميكروفونات لاسلكية Hollyland لصناعة المحتوى والمقابلات والبث المباشر.','ميكروفونات Hollyland اللاسلكية في اليمن | CABL','قارن ميكروفونات Hollyland اللاسلكية لصناعة المحتوى والمقابلات والبث المباشر.','منتجات Hollyland المنشورة في كتالوج CABL مع روابط الموديلات والبيانات المعلنة.','TRUE'),
          ('70000000-0000-4000-8000-000000000006','Soundcore','soundcore','سماعات أذن لاسلكية من Soundcore للاستماع والمكالمات والتنقل.','سماعات Soundcore اللاسلكية في اليمن | CABL','قارن سماعات Soundcore اللاسلكية المنشورة في كتالوج CABL.','منتجات Soundcore المنشورة مع روابط الموديلات والمعلومات المعلنة.','TRUE')
        ON CONFLICT ("brand_name") DO UPDATE SET
          "slug" = EXCLUDED."slug",
          "description" = EXCLUDED."description",
          "seo_title" = EXCLUDED."seo_title",
          "meta_description" = EXCLUDED."meta_description",
          "seo_description" = EXCLUDED."seo_description",
          "seo_indexable" = EXCLUDED."seo_indexable"`, []);
     counts.tags = await seedTable(`INSERT INTO "tags" ("id","tag_name","icon") VALUES (1,'Vention','brand'),(2,'USB-C','cable'),(3,'GaN','bolt'),(4,'Baseus','brand'),(5,'Anker','brand'),(6,'UGREEN','brand') ON CONFLICT ("id") DO NOTHING`, []);
     const previousUgreenSlugs = await pool.query<{ id: string; slug: string | null }>(
       `SELECT "id", "slug" FROM "products" WHERE "id" = ANY($1::uuid[])`,
       [ugreenReplacementProductIds],
     );
     const previousSlugByProductId = new Map(previousUgreenSlugs.rows.map((row) => [row.id, row.slug]));
    counts.products = 0;
    for (const [productId, brand, name, sku, price, description, image] of productsSeed) {
      counts.products += await seedTable(
          `INSERT INTO "products" ("id","brand","brand_id","product_name","SKU","slug","regular_price","quantity","short_description","product_description","published")
           VALUES ($1,$2::varchar,(SELECT "id" FROM "brands" WHERE "brand_name" = $2::varchar LIMIT 1),$3,$4,$5,$6,$7,$8,$9,TRUE)
           ON CONFLICT ("id") DO UPDATE SET
             "brand"=EXCLUDED."brand",
             "brand_id"=EXCLUDED."brand_id",
             "product_name"=EXCLUDED."product_name",
             "SKU"=EXCLUDED."SKU",
             "slug"=EXCLUDED."slug",
             "regular_price"=EXCLUDED."regular_price",
             "short_description"=EXCLUDED."short_description",
             "product_description"=EXCLUDED."product_description",
             "published"=TRUE`,
          [productId, brand, name, sku, productSlug(name, sku), price, brand === "Hollyland" || brand === "Soundcore" ? 0 : 25, description, `${name}. منتج منشور من CABL مع توصيل داخل اليمن. راجع بيانات الموديل والتوافر قبل الطلب.`],
      );
    }
     for (const [productId, oldSlug] of previousSlugByProductId) {
       const product = productsSeed.find((seedProduct) => seedProduct[0] === productId);
       if (product && oldSlug) {
         await insertSeoRedirect(`/product/${oldSlug}`, `/product/${productSlug(product[2], product[3])}`);
       }
     }
    counts.ugreen_category_cleanup = await seedTable(
      `DELETE FROM "product_categories" WHERE "product_id" = ANY($1::uuid[])`,
      [ugreenReplacementProductIds],
    );
    counts.product_categories = 0;
    for (const product of productsSeed) {
      const categoryId = product[7];
      counts.product_categories += await seedTable(`INSERT INTO "product_categories" ("category_id","product_id") VALUES ($1,$2) ON CONFLICT DO NOTHING`, [categoryId, product[0]]);
    }
    counts.galleries = 0;
    for (const [productId, , , , , , image] of productsSeed) {
      counts.galleries += await seedTable(`INSERT INTO "galleries" ("id","product_id","image_path","thumbail","display_order") VALUES ($1,$2,$3,TRUE,0) ON CONFLICT ("id") DO UPDATE SET "image_path"=EXCLUDED."image_path","thumbail"=TRUE`, [`20000000-0000-4000-8000-${productId.slice(-12)}`, productId, image]);
    }
    counts.shippings = await seedTable(`INSERT INTO "shippings" ("id","name","active","icon_path") VALUES (1,'توصيل داخل اليمن',TRUE,'truck'),(2,'توصيل محلي سريع',TRUE,'sparkles') ON CONFLICT ("id") DO NOTHING`, []);
    counts.payment_methods = await seedTable(
      `INSERT INTO "payment_methods" ("id","name","description","account_name","account_number","instructions","icon_key","requires_transaction_reference","active","sort_order") VALUES
       (1,'محفظة جيب','تحويل إلى محفظة جيب',NULL,NULL,'أضف رقم الحساب والتعليمات من لوحة الإدارة قبل تفعيل استقبال التحويلات.','wallet',TRUE,TRUE,1),
       (2,'جوالي','تحويل عبر جوالي',NULL,NULL,'أضف رقم الحساب والتعليمات من لوحة الإدارة قبل تفعيل استقبال التحويلات.','smartphone',TRUE,TRUE,2),
       (3,'حساب من بنك الكريمي للتحويل الأصغر الإسلامي','تحويل بنكي عبر بنك الكريمي',NULL,NULL,'أضف رقم الحساب والتعليمات من لوحة الإدارة قبل تفعيل استقبال التحويلات.','bank',TRUE,TRUE,3),
       (4,'ONE كاش','تحويل عبر ONE كاش',NULL,NULL,'أضف رقم الحساب والتعليمات من لوحة الإدارة قبل تفعيل استقبال التحويلات.','onecash',TRUE,TRUE,4),
       (5,'كاش','تحويل عبر كاش',NULL,NULL,'أضف رقم الحساب والتعليمات من لوحة الإدارة قبل تفعيل استقبال التحويلات.','cash',TRUE,TRUE,5),
       (6,'فلوسك','تحويل عبر فلوسك',NULL,NULL,'أضف رقم الحساب والتعليمات من لوحة الإدارة قبل تفعيل استقبال التحويلات.','wallet',TRUE,TRUE,6),
       (7,'بييس','تحويل عبر بييس',NULL,NULL,'أضف رقم الحساب والتعليمات من لوحة الإدارة قبل تفعيل استقبال التحويلات.','wallet',TRUE,TRUE,7),
       (8,'محفظة إيزي','تحويل عبر محفظة إيزي',NULL,NULL,'أضف رقم الحساب والتعليمات من لوحة الإدارة قبل تفعيل استقبال التحويلات.','wallet',TRUE,TRUE,8),
       (9,'سبأكاش','تحويل عبر سبأكاش',NULL,NULL,'أضف رقم الحساب والتعليمات من لوحة الإدارة قبل تفعيل استقبال التحويلات.','wallet',TRUE,TRUE,9),
       (10,'محفظة شامل موني','تحويل عبر شامل موني',NULL,NULL,'أضف رقم الحساب والتعليمات من لوحة الإدارة قبل تفعيل استقبال التحويلات.','wallet',TRUE,TRUE,10),
       (11,'موبايل موني (رقم النقطة: 996600)','تحويل عبر موبايل موني',NULL,NULL,'أضف رقم الحساب والتعليمات من لوحة الإدارة قبل تفعيل استقبال التحويلات.','smartphone',TRUE,TRUE,11),
       (12,'الدفع عند الاستلام','الدفع نقدًا عند استلام الطلب',NULL,NULL,'سيتم تحصيل قيمة الطلب عند التسليم. لا تحتاج إلى إدخال رقم عملية.','cash',FALSE,TRUE,12)
       ON CONFLICT ("id") DO NOTHING`,
      [],
    );
     counts.hollyland_attributes = await seedTable(
       `INSERT INTO "product_attributes"
         ("product_id","attribute_id","value_text","source_url","source_note")
        VALUES
         ('00000000-0000-4000-8000-000000000051','30000000-0000-4000-8000-000000000001','صناعة المحتوى، المقابلات، البث المباشر','https://www.hollyland.com/product/lark-m2s','تمت مراجعة صفحة Hollyland الرسمية للمنتج.'),
         ('00000000-0000-4000-8000-000000000052','30000000-0000-4000-8000-000000000001','صناعة المحتوى، البودكاست، المقابلات','https://www.hollyland.com/product/lark-m2','تمت مراجعة صفحة Hollyland الرسمية للمنتج.'),
         ('00000000-0000-4000-8000-000000000053','30000000-0000-4000-8000-000000000001','صناعة المحتوى، البودكاست، المقابلات','https://www.hollyland.com/product/lark-m2','تمت مراجعة صفحة Hollyland الرسمية للمنتج.'),
         ('00000000-0000-4000-8000-000000000054','30000000-0000-4000-8000-000000000001','صناعة المحتوى، البث المباشر، المقابلات','https://www.hollyland.com/product/lark-a1','تمت مراجعة صفحة Hollyland الرسمية للمنتج.')
        ON CONFLICT ("product_id","attribute_id") DO UPDATE SET
          "value_text"=EXCLUDED."value_text",
          "source_url"=EXCLUDED."source_url",
          "source_note"=EXCLUDED."source_note",
          "updated_at"=NOW()`, []);
      counts.soundcore_attributes = await seedTable(
        `INSERT INTO "product_attributes"
          ("product_id","attribute_id","value_text","source_url","source_note")
         VALUES
          ('00000000-0000-4000-8000-000000000055','30000000-0000-4000-8000-000000000001','الاستماع اليومي، السفر، شحن الهاتف','https://www.soundcore.com/products/a3937-p41i-ture-wireless-earbuds','تمت مراجعة صفحة Soundcore الرسمية للمنتج.'),
          ('00000000-0000-4000-8000-000000000056','30000000-0000-4000-8000-000000000001','الاستماع اليومي، المكالمات، التنقل','https://www.soundcore.com/products/a3958-r60i-nc','تمت مراجعة مرجع Soundcore الرسمي للمنتج.'),
          ('00000000-0000-4000-8000-000000000057','30000000-0000-4000-8000-000000000001','الاستماع اليومي، المكالمات، التنقل','https://www.soundcore.com/products/a3959-p30i','تمت مراجعة صفحة Soundcore الرسمية للموديل A3959.'),
          ('00000000-0000-4000-8000-000000000058','30000000-0000-4000-8000-000000000001','الاستماع اليومي، المكالمات، التنقل','https://www.soundcore.com/products/a3949-r50i','تمت مراجعة مرجع Soundcore الرسمي للموديل A3949.')
         ON CONFLICT ("product_id","attribute_id") DO UPDATE SET
           "value_text"=EXCLUDED."value_text",
           "source_url"=EXCLUDED."source_url",
           "source_note"=EXCLUDED."source_note",
           "updated_at"=NOW()`, []);
     counts.product_shippings = 0;
    for (const [productId] of productsSeed) {
      counts.product_shippings += await seedTable(
        `INSERT INTO "product_shippings" ("product_id","shipping_id","ship_charge","free","estimated_days")
         VALUES ($1,1,0,TRUE,5),($1,2,3.5,FALSE,2)
         ON CONFLICT ("product_id","shipping_id") DO UPDATE SET
           "ship_charge" = EXCLUDED."ship_charge",
           "free" = EXCLUDED."free",
           "estimated_days" = EXCLUDED."estimated_days"`,
        [productId],
      );
    }
    counts.order_statuses = await seedTable(`INSERT INTO "order_statuses" ("id","status_name","color","privacy") VALUES (1,'جديد','#d6ee42','public'),(2,'قيد التجهيز','#1748bd','public'),(3,'تم الشحن','#efb12a','public'),(4,'مكتمل','#2f9e44','public') ON CONFLICT ("id") DO NOTHING`, []);
    counts.roles = await seedTable(`INSERT INTO "roles" ("id","role_name","privileges") VALUES (1,'مدير المتجر',ARRAY['catalog.read','catalog.write','orders.read','customers.read']) ON CONFLICT ("id") DO NOTHING`, []);
    counts.attributes = await seedTable(
       `INSERT INTO "attributes" ("id","attribute_name","slug","type","unit","description","is_filterable","is_comparable","is_active") VALUES
       ('30000000-0000-4000-8000-000000000001','نوع الاستخدام','use_case','select',NULL,'الاستخدام المنشور للمنتج',FALSE,TRUE,TRUE),
       ('30000000-0000-4000-8000-000000000002','المنفذ','port_type','multiselect',NULL,'أنواع المنافذ المنشورة',TRUE,TRUE,TRUE),
       ('30000000-0000-4000-8000-000000000003','القدرة القصوى','max_power_w','number','W','القدرة القصوى كما يثبتها المصدر',TRUE,TRUE,TRUE),
       ('30000000-0000-4000-8000-000000000004','تقنية GaN','gan','boolean',NULL,'وجود تقنية GaN وفق المصدر',TRUE,TRUE,TRUE),
        ('30000000-0000-4000-8000-000000000005','السعة','capacity_mah','number','mAh','السعة المعلنة للمنتج',TRUE,TRUE,TRUE),
        ('30000000-0000-4000-8000-000000000006','جهد الإدخال','input_voltage_v','text','V','جهد الإدخال المنشور للمصدر',FALSE,TRUE,TRUE),
        ('30000000-0000-4000-8000-000000000007','الوزن','weight_g','number','g','وزن المنتج المنشور للمصدر',FALSE,TRUE,TRUE)
       ON CONFLICT ("id") DO UPDATE SET
         "attribute_name" = EXCLUDED."attribute_name",
         "slug" = EXCLUDED."slug",
         "type" = EXCLUDED."type",
         "unit" = EXCLUDED."unit",
         "description" = EXCLUDED."description",
         "is_filterable" = EXCLUDED."is_filterable",
         "is_comparable" = EXCLUDED."is_comparable",
         "is_active" = EXCLUDED."is_active"`,
      [],
    );
    counts.specification_definitions = await seedTable(
      `INSERT INTO "specification_definitions" ("id","slug","label","group_name","value_type","unit","sort_order","filterable","comparable","active") VALUES
       ('60000000-0000-4000-8000-000000000001','warranty_months','الضمان','مشترك','number','شهر',10,FALSE,TRUE,TRUE),
       ('60000000-0000-4000-8000-000000000002','dimensions','الأبعاد','مشترك','text','mm',20,FALSE,TRUE,TRUE),
       ('60000000-0000-4000-8000-000000000003','compatibility','التوافق','مشترك','multiselect',NULL,30,FALSE,TRUE,TRUE),
       ('60000000-0000-4000-8000-000000000004','max_power_w','القدرة القصوى','الطاقة','number','W',40,TRUE,TRUE,TRUE),
       ('60000000-0000-4000-8000-000000000005','capacity_mah','السعة','باور بانك','number','mAh',50,TRUE,TRUE,TRUE),
       ('60000000-0000-4000-8000-000000000006','energy_wh','الطاقة','باور بانك','number','Wh',60,TRUE,TRUE,TRUE),
       ('60000000-0000-4000-8000-000000000007','input_summary','المدخلات','باور بانك','text',NULL,70,FALSE,TRUE,TRUE),
       ('60000000-0000-4000-8000-000000000008','output_summary','المخرجات','باور بانك','text',NULL,80,FALSE,TRUE,TRUE),
       ('60000000-0000-4000-8000-000000000009','max_output_w','أقصى خرج','باور بانك','number','W',90,TRUE,TRUE,TRUE),
       ('60000000-0000-4000-8000-000000000010','recharge_time_hours','وقت إعادة الشحن','باور بانك','number','ساعة',100,FALSE,TRUE,TRUE),
       ('60000000-0000-4000-8000-000000000011','wireless_charging','الشحن اللاسلكي','باور بانك','boolean',NULL,110,TRUE,TRUE,TRUE),
       ('60000000-0000-4000-8000-000000000012','display','الشاشة','باور بانك','boolean',NULL,120,TRUE,TRUE,TRUE),
       ('60000000-0000-4000-8000-000000000013','pass_through_charging','الشحن أثناء التمرير','باور بانك','boolean',NULL,130,TRUE,TRUE,TRUE),
       ('60000000-0000-4000-8000-000000000014','connector_a','الموصل A','كابل','text',NULL,140,FALSE,TRUE,TRUE),
       ('60000000-0000-4000-8000-000000000015','connector_b','الموصل B','كابل','text',NULL,150,FALSE,TRUE,TRUE),
       ('60000000-0000-4000-8000-000000000016','length_m','الطول','كابل','number','m',160,TRUE,TRUE,TRUE),
       ('60000000-0000-4000-8000-000000000017','data_speed_gbps','سرعة نقل البيانات','كابل','number','Gbps',170,TRUE,TRUE,TRUE),
       ('60000000-0000-4000-8000-000000000018','usb_version','إصدار USB','كابل','text',NULL,180,TRUE,TRUE,TRUE),
       ('60000000-0000-4000-8000-000000000019','e_marker','E-marker','كابل','boolean',NULL,190,TRUE,TRUE,TRUE),
       ('60000000-0000-4000-8000-000000000020','video_support','دعم الفيديو','كابل','boolean',NULL,200,TRUE,TRUE,TRUE),
       ('60000000-0000-4000-8000-000000000021','material','الخامة','كابل','text',NULL,210,FALSE,TRUE,TRUE),
       ('60000000-0000-4000-8000-000000000022','input_voltage_v','جهد الإدخال','شاحن سيارة','text','V',220,FALSE,TRUE,TRUE),
       ('60000000-0000-4000-8000-000000000023','power_distribution','توزيع الطاقة','شاحن سيارة','text',NULL,230,FALSE,TRUE,TRUE),
       ('60000000-0000-4000-8000-000000000024','car_compatibility','توافق السيارة','شاحن سيارة','text',NULL,240,FALSE,TRUE,TRUE)
       ON CONFLICT ("id") DO UPDATE SET
         "label" = EXCLUDED."label", "group_name" = EXCLUDED."group_name", "value_type" = EXCLUDED."value_type",
         "unit" = EXCLUDED."unit", "sort_order" = EXCLUDED."sort_order", "filterable" = EXCLUDED."filterable",
         "comparable" = EXCLUDED."comparable", "active" = EXCLUDED."active"`,
      [],
    );
    counts.category_specification_definitions = await seedTable(
      `INSERT INTO "category_specification_definitions" ("category_id","definition_id","visible") VALUES
       ('10000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001',TRUE),
       ('10000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000002',TRUE),
       ('10000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000003',TRUE),
       ('10000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000005',TRUE),
       ('10000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000006',TRUE),
       ('10000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000007',TRUE),
       ('10000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000008',TRUE),
       ('10000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000009',TRUE),
       ('10000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000010',TRUE),
       ('10000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000011',TRUE),
       ('10000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000012',TRUE),
       ('10000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000013',TRUE),
       ('10000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000001',TRUE),
       ('10000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000002',TRUE),
       ('10000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000003',TRUE),
       ('10000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000004',TRUE),
       ('10000000-0000-4000-8000-000000000003','60000000-0000-4000-8000-000000000001',TRUE),
       ('10000000-0000-4000-8000-000000000003','60000000-0000-4000-8000-000000000002',TRUE),
       ('10000000-0000-4000-8000-000000000003','60000000-0000-4000-8000-000000000003',TRUE),
       ('10000000-0000-4000-8000-000000000003','60000000-0000-4000-8000-000000000004',TRUE),
       ('10000000-0000-4000-8000-000000000003','60000000-0000-4000-8000-000000000014',TRUE),
       ('10000000-0000-4000-8000-000000000003','60000000-0000-4000-8000-000000000015',TRUE),
       ('10000000-0000-4000-8000-000000000003','60000000-0000-4000-8000-000000000016',TRUE),
       ('10000000-0000-4000-8000-000000000003','60000000-0000-4000-8000-000000000017',TRUE),
       ('10000000-0000-4000-8000-000000000003','60000000-0000-4000-8000-000000000018',TRUE),
       ('10000000-0000-4000-8000-000000000003','60000000-0000-4000-8000-000000000019',TRUE),
       ('10000000-0000-4000-8000-000000000003','60000000-0000-4000-8000-000000000020',TRUE),
       ('10000000-0000-4000-8000-000000000003','60000000-0000-4000-8000-000000000021',TRUE),
       ('10000000-0000-4000-8000-000000000004','60000000-0000-4000-8000-000000000001',TRUE),
       ('10000000-0000-4000-8000-000000000004','60000000-0000-4000-8000-000000000002',TRUE),
       ('10000000-0000-4000-8000-000000000004','60000000-0000-4000-8000-000000000003',TRUE),
       ('10000000-0000-4000-8000-000000000004','60000000-0000-4000-8000-000000000004',TRUE),
       ('10000000-0000-4000-8000-000000000004','60000000-0000-4000-8000-000000000009',TRUE),
       ('10000000-0000-4000-8000-000000000004','60000000-0000-4000-8000-000000000022',TRUE),
       ('10000000-0000-4000-8000-000000000004','60000000-0000-4000-8000-000000000023',TRUE),
       ('10000000-0000-4000-8000-000000000004','60000000-0000-4000-8000-000000000024',TRUE),
       ('10000000-0000-4000-8000-000000000005','60000000-0000-4000-8000-000000000001',TRUE),
       ('10000000-0000-4000-8000-000000000005','60000000-0000-4000-8000-000000000002',TRUE),
       ('10000000-0000-4000-8000-000000000005','60000000-0000-4000-8000-000000000003',TRUE),
       ('10000000-0000-4000-8000-000000000005','60000000-0000-4000-8000-000000000004',TRUE),
       ('10000000-0000-4000-8000-000000000005','60000000-0000-4000-8000-000000000014',TRUE),
       ('10000000-0000-4000-8000-000000000005','60000000-0000-4000-8000-000000000015',TRUE),
       ('10000000-0000-4000-8000-000000000005','60000000-0000-4000-8000-000000000016',TRUE),
       ('10000000-0000-4000-8000-000000000005','60000000-0000-4000-8000-000000000017',TRUE),
       ('10000000-0000-4000-8000-000000000005','60000000-0000-4000-8000-000000000018',TRUE),
       ('10000000-0000-4000-8000-000000000005','60000000-0000-4000-8000-000000000019',TRUE),
       ('10000000-0000-4000-8000-000000000005','60000000-0000-4000-8000-000000000020',TRUE),
       ('10000000-0000-4000-8000-000000000005','60000000-0000-4000-8000-000000000021',TRUE)
       ON CONFLICT ("category_id","definition_id") DO UPDATE SET "visible" = EXCLUDED."visible"`,
      [],
    );
    counts.attribute_values = await seedTable(`INSERT INTO "attribute_values" ("id","attribute_id","attribute_value") VALUES ('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','يومي'),('40000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','السفر'),('40000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000002','USB-C') ON CONFLICT ("id") DO NOTHING`, []);
    counts.port_types = await seedTable(
      `INSERT INTO "port_types" ("id","name","slug","active") VALUES
       ('50000000-0000-4000-8000-000000000001','USB-C','usb-c',TRUE),
       ('50000000-0000-4000-8000-000000000002','USB-A','usb-a',TRUE),
       ('50000000-0000-4000-8000-000000000003','AC','ac',TRUE),
       ('50000000-0000-4000-8000-000000000004','HDMI','hdmi',TRUE),
       ('50000000-0000-4000-8000-000000000005','Lightning','lightning',TRUE),
       ('50000000-0000-4000-8000-000000000006','SD','sd',TRUE),
       ('50000000-0000-4000-8000-000000000007','TF','tf',TRUE)
       ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "slug" = EXCLUDED."slug", "active" = EXCLUDED."active"`,
      [],
    );
    counts.charging_protocols = await seedTable(
      `INSERT INTO "charging_protocols" ("id","name","slug","active") VALUES
       ('51000000-0000-4000-8000-000000000001','USB Power Delivery','usb-pd',TRUE),
       ('51000000-0000-4000-8000-000000000002','Programmable Power Supply','pps',TRUE),
       ('51000000-0000-4000-8000-000000000003','Quick Charge','quick-charge',TRUE),
       ('51000000-0000-4000-8000-000000000004','Adaptive Fast Charging','afc',TRUE)
       ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "slug" = EXCLUDED."slug", "active" = EXCLUDED."active"`,
      [],
    );
    counts.protection_types = await seedTable(
      `INSERT INTO "protection_types" ("id","name","slug","active") VALUES
       ('52000000-0000-4000-8000-000000000001','الحماية من زيادة التيار','over-current',TRUE),
       ('52000000-0000-4000-8000-000000000002','الحماية من زيادة الجهد','over-voltage',TRUE),
       ('52000000-0000-4000-8000-000000000003','الحماية من الحرارة','over-temperature',TRUE),
       ('52000000-0000-4000-8000-000000000004','الحماية من القصر','short-circuit',TRUE)
       ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "slug" = EXCLUDED."slug", "active" = EXCLUDED."active"`,
      [],
    );
    counts.compatibility_categories = await seedTable(
      `INSERT INTO "compatibility_categories" ("id","name","slug","active") VALUES
       ('53000000-0000-4000-8000-000000000001','هواتف وأجهزة لوحية','phones-tablets',TRUE),
       ('53000000-0000-4000-8000-000000000002','حواسيب محمولة','laptops',TRUE),
       ('53000000-0000-4000-8000-000000000003','أجهزة السيارة','car-devices',TRUE),
       ('53000000-0000-4000-8000-000000000004','أجهزة الألعاب','gaming-devices',TRUE)
       ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "slug" = EXCLUDED."slug", "active" = EXCLUDED."active"`,
      [],
    );
    counts.ugreen_specifications = await seedUgreenSpecifications();
    const catalogDerived = await seedCatalogDerivedSpecifications();
    counts.catalog_derived_attributes = catalogDerived.importedAttributes;
    counts.catalog_derived_modules = catalogDerived.importedModules;
     counts.verified_catalog_specifications = await seedVerifiedCatalogSpecifications();
    const catalogSources = await seedCatalogSourceUrls();
    counts.catalog_source_urls = catalogSources.applied;
    counts.catalog_products_missing_source = catalogSources.unresolved.length;
    if (catalogSources.unresolved.length > 0) {
      req.log.warn(
        { products: catalogSources.unresolved },
        "Some catalog products still have no verified official source URL",
      );
    }
    const inserted = Object.values(counts).reduce((sum, count) => sum + count, 0);
    res.json(SeedAdminDataResponse.parse({ seeded: true, inserted, tables: counts }));
  } catch (error) {
    req.log.error({ err: error }, "Failed to seed admin data");
    res.status(500).json({ error: "تعذر تجهيز بيانات المتجر" });
  }
});

export default router;