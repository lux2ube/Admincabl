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
    }
  }

  if (table.key === "brands" && before.slug !== after.slug) {
    await insertSeoRedirect(brandPublicPath(String(before.slug || "")), brandPublicPath(String(after.slug || "")));
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
  ["00000000-0000-4000-8000-000000000038", "UGREEN", "شاحن UGREEN USB-C بقدرة 20W", "CABL-UGR-20W", 13.00, "شاحن USB-C سريع بقدرة 20W", "https://www.ugreen.com/cdn/shop/files/65786.png?v=1762323345&width=300", "10000000-0000-4000-8000-000000000002"],
  ["00000000-0000-4000-8000-000000000039", "UGREEN", "شاحن UGREEN USB-C بقدرة 30W", "CABL-UGR-30W", 18.00, "شاحن USB-C سريع بقدرة 30W", "https://www.ugreen.com/cdn/shop/files/65786.png?v=1762323345&width=300", "10000000-0000-4000-8000-000000000002"],
  ["00000000-0000-4000-8000-000000000040", "UGREEN", "شاحن UGREEN Nexode GaN بقدرة 45W", "CABL-UGR-45W", 27.00, "شاحن UGREEN Nexode ثنائي المنافذ بتقنية GaN وقدرة 45W", "https://www.ugreen.com/cdn/shop/files/c25a0e077dd5d91597a8b4d5c6990840.png?v=1762321987&width=300", "10000000-0000-4000-8000-000000000002"],
  ["00000000-0000-4000-8000-000000000041", "UGREEN", "شاحن UGREEN GaN بقدرة 65W", "CABL-UGR-65W", 36.00, "شاحن UGREEN GaN بقدرة 65W", "https://www.ugreen.com/cdn/shop/files/15817.png?v=1762323446&width=300", "10000000-0000-4000-8000-000000000002"],
  ["00000000-0000-4000-8000-000000000042", "UGREEN", "كابل UGREEN USB-A إلى USB-C", "CABL-UGR-A2C", 8.00, "كابل UGREEN من USB-A إلى USB-C", "https://www.ugreen.com/cdn/shop/files/5ecbd42ae6b223a53267218ec68a4b9e.png?v=1762322059&width=300", "10000000-0000-4000-8000-000000000003"],
  ["00000000-0000-4000-8000-000000000043", "UGREEN", "كابل UGREEN USB-C إلى USB-C بقدرة 60W", "CABL-UGR-C2C60", 10.00, "كابل UGREEN USB-C إلى USB-C للشحن السريع بقدرة 60W", "https://www.ugreen.com/cdn/shop/files/b81dd756173ef421d96d0ecc0069022f.png?v=1762322048&width=300", "10000000-0000-4000-8000-000000000003"],
  ["00000000-0000-4000-8000-000000000044", "UGREEN", "كابل UGREEN USB-C إلى USB-C بقدرة 100W", "CABL-UGR-C2C100", 14.00, "كابل UGREEN USB-C إلى USB-C بقدرة 100W", "https://www.ugreen.com/cdn/shop/files/bab5255d39b70ee3027845fad0648f10.png?v=1762322054&width=300", "10000000-0000-4000-8000-000000000003"],
  ["00000000-0000-4000-8000-000000000045", "UGREEN", "كابل UGREEN USB-C إلى Lightning", "CABL-UGR-C2L", 12.00, "كابل UGREEN USB-C إلى Lightning", "https://www.ugreen.com/cdn/shop/files/eb6684f5edbb3b8de07faf881b0195ac.png?v=1762322051&width=300", "10000000-0000-4000-8000-000000000003"],
  ["00000000-0000-4000-8000-000000000046", "UGREEN", "باور بنك UGREEN بسعة 10,000mAh", "CABL-UGR-PB10K", 28.00, "باور بنك UGREEN Uno بقدرة 30W وسعة 10,000mAh", "https://www.ugreen.com/cdn/shop/files/0f8988c44c76c157a802a4a21d0032ce.png?v=1762322015&width=300", "10000000-0000-4000-8000-000000000001"],
  ["00000000-0000-4000-8000-000000000047", "UGREEN", "باور بنك UGREEN بسعة 20,000mAh / 30W", "CABL-UGR-PB20K30", 41.00, "باور بنك UGREEN عالي السعة", "https://www.ugreen.com/cdn/shop/files/247309e266dff4f7659607ac05079b41.png?v=1762322020&width=300", "10000000-0000-4000-8000-000000000001"],
  ["00000000-0000-4000-8000-000000000048", "UGREEN", "شاحن سيارة UGREEN بقدرة 30W", "CABL-UGR-CAR30", 19.00, "شاحن سيارة UGREEN لاسلكي بقدرة 30W", "https://www.ugreen.com/cdn/shop/files/ff27cd7abcb96a42eea60b5ed0980508.png?v=1762322031&width=300", "10000000-0000-4000-8000-000000000004"],
  ["00000000-0000-4000-8000-000000000049", "UGREEN", "شاحن سيارة UGREEN بقدرة 50W", "CABL-UGR-CAR50", 22.00, "شاحن سيارة UGREEN سريع", "https://www.ugreen.com/cdn/shop/files/ff27cd7abcb96a42eea60b5ed0980508.png?v=1762322031&width=300", "10000000-0000-4000-8000-000000000004"],
  ["00000000-0000-4000-8000-000000000050", "UGREEN", "محور UGREEN USB-C ‏7 في 1", "CABL-UGR-HUB7", 43.00, "محور UGREEN Revodok Pro USB-C بسبعة منافذ", "https://www.ugreen.com/cdn/shop/files/1795373640d911068a5841b77e48e007.png?v=1762322086&width=300", "10000000-0000-4000-8000-000000000005"],
] as const;

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
      `INSERT INTO "categories" ("id", "category_name", "category_description", "image_path", "active") VALUES
       ('10000000-0000-4000-8000-000000000001','باور بانك','حلول طاقة محمولة للاستخدام اليومي','images/vention-powerbank-10k.jpg',TRUE),
       ('10000000-0000-4000-8000-000000000002','الشواحن','شواحن Vention بتقنية GaN','images/vention-charger-65w.jpg',TRUE),
       ('10000000-0000-4000-8000-000000000003','الكابلات','كابلات شحن ونقل بيانات','images/vention-cable-100w.jpg',TRUE),
       ('10000000-0000-4000-8000-000000000004','السفر والسيارة','حلول الشحن أثناء التنقل','images/vention-adapter-65w.jpg',TRUE),
       ('10000000-0000-4000-8000-000000000005','الملحقات','محاور وكابلات العرض والاتصال','images/baseus-hub.svg',TRUE)
       ON CONFLICT ("id") DO NOTHING`, []);
     counts.tags = await seedTable(`INSERT INTO "tags" ("id","tag_name","icon") VALUES (1,'Vention','brand'),(2,'USB-C','cable'),(3,'GaN','bolt'),(4,'Baseus','brand'),(5,'Anker','brand'),(6,'UGREEN','brand') ON CONFLICT ("id") DO NOTHING`, []);
    counts.products = 0;
    for (const [productId, brand, name, sku, price, description, image] of productsSeed) {
      counts.products += await seedTable(
        `INSERT INTO "products" ("id","brand","product_name","SKU","regular_price","quantity","short_description","product_description","published")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE)
         ON CONFLICT ("id") DO UPDATE SET "brand"=EXCLUDED."brand","product_name"=EXCLUDED."product_name","SKU"=EXCLUDED."SKU","regular_price"=EXCLUDED."regular_price","short_description"=EXCLUDED."short_description","product_description"=EXCLUDED."product_description","published"=TRUE`,
        [productId, brand, name, sku, price, 25, description, `${name}. منتج أصلي متوفر من CABL، الوكيل الحصري لـ ${brand} في اليمن، مع توصيل داخل اليمن.`],
      );
    }
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
       ('30000000-0000-4000-8000-000000000005','السعة','capacity_mah','number','mAh','السعة المعلنة للمنتج',TRUE,TRUE,TRUE)
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
       ('50000000-0000-4000-8000-000000000005','Lightning','lightning',TRUE)
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
    const inserted = Object.values(counts).reduce((sum, count) => sum + count, 0);
    res.json(SeedAdminDataResponse.parse({ seeded: true, inserted, tables: counts }));
  } catch (error) {
    req.log.error({ err: error }, "Failed to seed admin data");
    res.status(500).json({ error: "تعذر تجهيز بيانات المتجر" });
  }
});

export default router;