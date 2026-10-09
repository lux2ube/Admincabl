import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const adminAuthCredentialsTable = pgTable(
  "admin_auth_credentials",
  {
    id: integer("id").primaryKey().default(1),
    username: text("username").notNull(),
    passwordHash: text("password_hash").notNull(),
    passwordSalt: text("password_salt").notNull(),
    sessionKey: text("session_key").notNull(),
    sessionVersion: integer("session_version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check("admin_auth_credentials_singleton", sql`${table.id} = 1`)],
);

export const adminAuthLoginAttemptsTable = pgTable(
  "admin_auth_login_attempts",
  {
    keyHash: text("key_hash").primaryKey(),
    windowStartedAt: timestamp("window_started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    attempts: integer("attempts").notNull().default(0),
  },
  (table) => [
    index("admin_auth_login_attempts_window_started_at_idx").on(table.windowStartedAt),
  ],
);

export const insertAdminAuthCredentialsSchema = createInsertSchema(
  adminAuthCredentialsTable,
).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertAdminAuthCredentials = z.infer<
  typeof insertAdminAuthCredentialsSchema
>;
export type AdminAuthCredentials = typeof adminAuthCredentialsTable.$inferSelect;
export type AdminAuthLoginAttempt = typeof adminAuthLoginAttemptsTable.$inferSelect;
