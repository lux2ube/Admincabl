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
    const entries = safeValues(table, parsedBody.data.values, true);
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
    const entries = safeValues(table, parsedBody.data.values, false);
    if (entries.length === 0) throw new Error("At least one editable field is required");
    const values = entries.map(([, value]) => value);
    const assignments = entries.map(([key], index) => `${quoteIdentifier(key)} = $${index + 1}`).join(", ");
    const keyParams: unknown[] = [];
    const where = whereClause(table, parseRowId(table, parsedParams.data.id), keyParams, values.length);
    const result = await pool.query(
      `UPDATE ${quoteIdentifier(table.key)} SET ${assignments} WHERE ${where} RETURNING *`,
      [...values, ...keyParams],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: "Row not found" });
      return;
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
  ["00000000-0000-4000-8000-000000000001", "باور بنك 20,000mAh / 22.5W", "CABL-VEN-PB20K", 28.09, "USB-C + USB-A + كابل مدمج", "images/vention-powerbank-20k.jpg"],
  ["00000000-0000-4000-8000-000000000002", "باور بنك 10,000mAh / 22.5W", "CABL-VEN-PB10K", 24.18, "كابل شحن مدمج", "images/vention-powerbank-10k.jpg"],
  ["00000000-0000-4000-8000-000000000003", "باور بنك 10,000mAh / USB-C + Lightning", "CABL-VEN-PB10KL", 24.82, "USB-C + Lightning مدمجان", "images/vention-powerbank-10k-lightning.jpg"],
  ["00000000-0000-4000-8000-000000000004", "شاحن GaN بمنفذين 30W", "CABL-VEN-GAN30", 11.69, "USB-C + USB-A · قابس أوروبي", "images/vention-charger-30w.jpg"],
  ["00000000-0000-4000-8000-000000000005", "طقم شحن GaN بقدرة 30W", "CABL-VEN-GAN30K", 15.90, "شاحن + كابل USB-C إلى USB-C", "images/vention-charger-30w-kit.jpg"],
  ["00000000-0000-4000-8000-000000000006", "شاحن GaN بثلاثة منافذ 65W", "CABL-VEN-GAN65", 37.59, "C+C+A · 65W / 65W / 60W", "images/vention-charger-65w.jpg"],
  ["00000000-0000-4000-8000-000000000007", "شاحن GaN بثلاثة منافذ 70W", "CABL-VEN-GAN70", 39.90, "C+C+A · 70W / 70W / 22.5W", "images/vention-charger-70w.jpg"],
  ["00000000-0000-4000-8000-000000000008", "شاحن GaN بثلاثة منافذ 100W", "CABL-VEN-GAN100", 79.39, "C+C+A · 100W / 100W / 30W", "images/vention-charger-100w.jpg"],
  ["00000000-0000-4000-8000-000000000009", "كابل USB-C إلى USB-C بقدرة 100W", "CABL-VEN-C100", 11.27, "شحن سريع 5A · USB 2.0", "images/vention-cable-100w.jpg"],
  ["00000000-0000-4000-8000-000000000010", "محول سفر عالمي GaN بقدرة 65W", "CABL-VEN-TRAVEL65", 95.88, "شحن عالمي للسفر", "images/vention-adapter-65w.jpg"],
] as const;

async function seedTable(query: string, values: unknown[], conflict = "DO NOTHING") {
  const result = await pool.query(query, values);
  return result.rowCount ?? 0;
}

router.post("/admin/seed", async (req, res): Promise<void> => {
  try {
    const counts: Record<string, number> = {};
    counts.categories = await seedTable(
      `INSERT INTO "categories" ("id", "category_name", "category_description", "image_path", "active") VALUES
       ('10000000-0000-4000-8000-000000000001','باور بانك','حلول طاقة محمولة للاستخدام اليومي','images/vention-powerbank-10k.jpg',TRUE),
       ('10000000-0000-4000-8000-000000000002','الشواحن','شواحن Vention بتقنية GaN','images/vention-charger-65w.jpg',TRUE),
       ('10000000-0000-4000-8000-000000000003','الكابلات','كابلات شحن ونقل بيانات','images/vention-cable-100w.jpg',TRUE),
       ('10000000-0000-4000-8000-000000000004','السفر والسيارة','حلول الشحن أثناء التنقل','images/vention-adapter-65w.jpg',TRUE)
       ON CONFLICT ("id") DO NOTHING`, []);
    counts.tags = await seedTable(`INSERT INTO "tags" ("id","tag_name","icon") VALUES (1,'Vention','brand'),(2,'USB-C','cable'),(3,'GaN','bolt') ON CONFLICT ("id") DO NOTHING`, []);
    counts.products = 0;
    for (const [productId, name, sku, price, description, image] of productsSeed) {
      counts.products += await seedTable(
        `INSERT INTO "products" ("id","product_name","SKU","regular_price","quantity","short_description","product_description","published")
         VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE)
         ON CONFLICT ("id") DO UPDATE SET "product_name"=EXCLUDED."product_name","SKU"=EXCLUDED."SKU","regular_price"=EXCLUDED."regular_price","short_description"=EXCLUDED."short_description","product_description"=EXCLUDED."product_description","published"=TRUE`,
        [productId, name, sku, price, 25, description, `${name}. منتج أصلي متوفر من CABL مع توصيل داخل اليمن.`],
      );
    }
    counts.product_categories = 0;
    for (let index = 0; index < productsSeed.length; index += 1) {
      const categoryId = index < 3 ? "10000000-0000-4000-8000-000000000001" : index < 8 ? "10000000-0000-4000-8000-000000000002" : index === 8 ? "10000000-0000-4000-8000-000000000003" : "10000000-0000-4000-8000-000000000004";
      counts.product_categories += await seedTable(`INSERT INTO "product_categories" ("category_id","product_id") VALUES ($1,$2) ON CONFLICT DO NOTHING`, [categoryId, productsSeed[index][0]]);
    }
    counts.galleries = 0;
    for (const [productId, , , , , image] of productsSeed) {
      counts.galleries += await seedTable(`INSERT INTO "galleries" ("id","product_id","image_path","thumbail","display_order") VALUES ($1,$2,$3,TRUE,0) ON CONFLICT ("id") DO NOTHING`, [`20000000-0000-4000-8000-${productId.slice(-12)}`, productId, image]);
    }
    counts.shippings = await seedTable(`INSERT INTO "shippings" ("id","name","active","icon_path") VALUES (1,'توصيل داخل اليمن',TRUE,'truck'),(2,'توصيل محلي سريع',TRUE,'sparkles') ON CONFLICT ("id") DO NOTHING`, []);
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
    counts.attributes = await seedTable(`INSERT INTO "attributes" ("id","attribute_name") VALUES ('30000000-0000-4000-8000-000000000001','نوع الاستخدام'),('30000000-0000-4000-8000-000000000002','المنفذ') ON CONFLICT ("id") DO NOTHING`, []);
    counts.attribute_values = await seedTable(`INSERT INTO "attribute_values" ("id","attribute_id","attribute_value") VALUES ('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','يومي'),('40000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','السفر'),('40000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000002','USB-C') ON CONFLICT ("id") DO NOTHING`, []);
    const inserted = Object.values(counts).reduce((sum, count) => sum + count, 0);
    res.json(SeedAdminDataResponse.parse({ seeded: true, inserted, tables: counts }));
  } catch (error) {
    req.log.error({ err: error }, "Failed to seed admin data");
    res.status(500).json({ error: "تعذر تجهيز بيانات المتجر" });
  }
});

export default router;