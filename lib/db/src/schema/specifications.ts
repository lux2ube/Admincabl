import { boolean, check, integer, numeric, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { attributesTable, categoriesTable, productsTable } from "./catalog";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
};

export const portTypesTable = pgTable("port_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 80 }).notNull(),
  slug: varchar("slug", { length: 80 }).notNull(),
  active: boolean("active").notNull().default(true),
  ...timestamps,
}, (table) => [uniqueIndex("port_types_slug_unique").on(table.slug)]);

export const chargerPortsTable = pgTable("charger_ports", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  portName: varchar("port_name", { length: 80 }).notNull(),
  portTypeId: uuid("port_type_id").notNull().references(() => portTypesTable.id),
  maxPowerW: numeric("max_power_w", { precision: 8, scale: 2 }),
  maxVoltageV: numeric("max_voltage_v", { precision: 8, scale: 2 }),
  maxCurrentA: numeric("max_current_a", { precision: 8, scale: 2 }),
  sortOrder: integer("sort_order").notNull().default(0),
  sourceUrl: text("source_url"),
  sourceNote: text("source_note"),
  ...timestamps,
}, (table) => [
  uniqueIndex("charger_ports_product_name_unique").on(table.productId, table.portName),
  check("charger_ports_positive_values", sql`("max_power_w" IS NULL OR "max_power_w" > 0) AND ("max_voltage_v" IS NULL OR "max_voltage_v" > 0) AND ("max_current_a" IS NULL OR "max_current_a" > 0)`),
]);

export const chargingProtocolsTable = pgTable("charging_protocols", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  ...timestamps,
}, (table) => [uniqueIndex("charging_protocols_slug_unique").on(table.slug)]);

export const productChargingProtocolsTable = pgTable("product_charging_protocols", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  protocolId: uuid("protocol_id").notNull().references(() => chargingProtocolsTable.id),
  portId: uuid("port_id").references(() => chargerPortsTable.id, { onDelete: "cascade" }),
  sourceUrl: text("source_url"),
  sourceNote: text("source_note"),
  ...timestamps,
}, (table) => [
  uniqueIndex("product_protocol_port_unique").on(table.productId, table.protocolId, table.portId),
]);

export const chargerPowerProfilesTable = pgTable("charger_power_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  configurationName: varchar("configuration_name", { length: 160 }).notNull(),
  totalPowerW: numeric("total_power_w", { precision: 8, scale: 2 }),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  sourceUrl: text("source_url"),
  sourceNote: text("source_note"),
  ...timestamps,
}, (table) => [
  uniqueIndex("charger_power_profiles_product_name_unique").on(table.productId, table.configurationName),
  check("charger_power_profiles_positive_power", sql`"total_power_w" IS NULL OR "total_power_w" > 0`),
]);

export const chargerPowerProfileOutputsTable = pgTable("charger_power_profile_outputs", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id").notNull().references(() => chargerPowerProfilesTable.id, { onDelete: "cascade" }),
  portId: uuid("port_id").notNull().references(() => chargerPortsTable.id, { onDelete: "cascade" }),
  powerW: numeric("power_w").notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex("power_profile_port_unique").on(table.profileId, table.portId),
  check("power_profile_outputs_positive_power", sql`"power_w" > 0`),
]);

export const productDimensionsTable = pgTable("product_dimensions", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  lengthMm: numeric("length_mm", { precision: 8, scale: 2 }),
  widthMm: numeric("width_mm", { precision: 8, scale: 2 }),
  heightMm: numeric("height_mm", { precision: 8, scale: 2 }),
  weightG: numeric("weight_g", { precision: 8, scale: 2 }),
  sourceUrl: text("source_url"),
  sourceNote: text("source_note"),
  ...timestamps,
}, (table) => [
  uniqueIndex("product_dimensions_product_unique").on(table.productId),
  check("product_dimensions_positive_values", sql`("length_mm" IS NULL OR "length_mm" > 0) AND ("width_mm" IS NULL OR "width_mm" > 0) AND ("height_mm" IS NULL OR "height_mm" > 0) AND ("weight_g" IS NULL OR "weight_g" > 0)`),
]);

export const protectionTypesTable = pgTable("protection_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull(),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  ...timestamps,
}, (table) => [uniqueIndex("protection_types_slug_unique").on(table.slug)]);

export const productProtectionsTable = pgTable("product_protections", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  protectionId: uuid("protection_id").notNull().references(() => protectionTypesTable.id),
  sourceUrl: text("source_url"),
  sourceNote: text("source_note"),
  ...timestamps,
}, (table) => [
  uniqueIndex("product_protection_unique").on(table.productId, table.protectionId),
]);

export const compatibilityCategoriesTable = pgTable("compatibility_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull(),
  active: boolean("active").notNull().default(true),
  ...timestamps,
}, (table) => [uniqueIndex("compatibility_categories_slug_unique").on(table.slug)]);

export const productCompatibilityTable = pgTable("product_compatibility", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  compatibilityCategoryId: uuid("compatibility_category_id").notNull().references(() => compatibilityCategoriesTable.id),
  compatibilityType: varchar("compatibility_type", { length: 32 }).notNull(),
  notes: text("notes"),
  sourceUrl: text("source_url"),
  sourceNote: text("source_note"),
  ...timestamps,
}, (table) => [
  uniqueIndex("product_compatibility_unique").on(table.productId, table.compatibilityCategoryId),
  check("product_compatibility_type_check", sql`"compatibility_type" IN ('supported', 'partially_supported', 'not_recommended')`),
]);

export const insertPortTypeSchema = createInsertSchema(portTypesTable);
export const insertChargerPortSchema = createInsertSchema(chargerPortsTable);
export const insertChargingProtocolSchema = createInsertSchema(chargingProtocolsTable);
export const insertProductChargingProtocolSchema = createInsertSchema(productChargingProtocolsTable);
export const insertChargerPowerProfileSchema = createInsertSchema(chargerPowerProfilesTable);
export const insertChargerPowerProfileOutputSchema = createInsertSchema(chargerPowerProfileOutputsTable);
export const insertProductDimensionsSchema = createInsertSchema(productDimensionsTable);
export const insertProtectionTypeSchema = createInsertSchema(protectionTypesTable);
export const insertProductProtectionSchema = createInsertSchema(productProtectionsTable);
export const insertCompatibilityCategorySchema = createInsertSchema(compatibilityCategoriesTable);
export const insertProductCompatibilitySchema = createInsertSchema(productCompatibilityTable);

export type PortType = typeof portTypesTable.$inferSelect;
export type ChargerPort = typeof chargerPortsTable.$inferSelect;
export type ChargingProtocol = typeof chargingProtocolsTable.$inferSelect;
export type ProductChargingProtocol = typeof productChargingProtocolsTable.$inferSelect;
export type ChargerPowerProfile = typeof chargerPowerProfilesTable.$inferSelect;
export type ChargerPowerProfileOutput = typeof chargerPowerProfileOutputsTable.$inferSelect;
export type ProductDimensions = typeof productDimensionsTable.$inferSelect;
export type ProtectionType = typeof protectionTypesTable.$inferSelect;
export type ProductProtection = typeof productProtectionsTable.$inferSelect;
export type CompatibilityCategory = typeof compatibilityCategoriesTable.$inferSelect;
export type ProductCompatibility = typeof productCompatibilityTable.$inferSelect;

export const specificationCategoryTableReference = {
  attributes: attributesTable,
  categories: categoriesTable,
};

export const specificationCompatibilityType = z.enum(["supported", "partially_supported", "not_recommended"]);