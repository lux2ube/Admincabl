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