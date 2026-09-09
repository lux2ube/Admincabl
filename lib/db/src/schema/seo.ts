import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * The brand name remains on products for backwards compatibility with the
 * imported catalog. New and migrated products should use brandId as the
 * canonical relationship.
 */
export const brandsTable = pgTable("brands", {
  id: uuid("id").defaultRandom().primaryKey(),
  brandName: varchar("brand_name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  description: text("description"),
  imagePath: text("image_path"),
  seoTitle: varchar("seo_title", { length: 255 }),
  metaDescription: varchar("meta_description", { length: 320 }),
  seoDescription: text("seo_description"),
  seoIndexable: boolean("seo_indexable").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const seoGuidesTable = pgTable("seo_guides", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  h1: varchar("h1", { length: 255 }).notNull(),
  metaDescription: varchar("meta_description", { length: 320 }).notNull(),
  description: text("description"),
  content: text("content").notNull(),
  imagePath: text("image_path"),
  canonicalPath: varchar("canonical_path", { length: 255 }),
  seoIndexable: boolean("seo_indexable").notNull().default(true),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/**
 * Keeps renamed or retired SEO paths useful without putting aliases in
 * product/category content or generating duplicate indexable pages.
 */
export const seoRedirectsTable = pgTable("seo_redirects", {
  id: uuid("id").defaultRandom().primaryKey(),
  fromPath: varchar("from_path", { length: 500 }).notNull().unique(),
  toPath: varchar("to_path", { length: 500 }).notNull(),
  statusCode: integer("status_code").notNull().default(301),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertBrandSchema = createInsertSchema(brandsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type Brand = typeof brandsTable.$inferSelect;

export const insertSeoGuideSchema = createInsertSchema(seoGuidesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSeoGuide = z.infer<typeof insertSeoGuideSchema>;
export type SeoGuide = typeof seoGuidesTable.$inferSelect;

export const insertSeoRedirectSchema = createInsertSchema(seoRedirectsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSeoRedirect = z.infer<typeof insertSeoRedirectSchema>;
export type SeoRedirect = typeof seoRedirectsTable.$inferSelect;