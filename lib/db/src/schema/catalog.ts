import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  real,
  serial,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const tagsTable = pgTable("tags", {
  id: serial("id").primaryKey(),
  tagName: varchar("tag_name", { length: 255 }).notNull(),
  icon: text("icon"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
});

export const categoriesTable = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  parentId: uuid("parent_id"),
  categoryName: varchar("category_name", { length: 255 }).notNull(),
  categoryDescription: text("category_description"),
  icon: text("icon"),
  imagePath: text("image_path"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
});

export const productsTable = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  brand: varchar("brand", { length: 100 }).notNull().default("Vention"),
  productName: varchar("product_name", { length: 255 }).notNull(),
  sku: varchar("SKU", { length: 255 }).notNull().unique(),
  regularPrice: numeric("regular_price", { precision: 12, scale: 2 }).notNull(),
  discountPrice: numeric("discount_price", { precision: 12, scale: 2 }),
  quantity: integer("quantity").notNull().default(0),
  shortDescription: varchar("short_description", { length: 165 }),
  productDescription: text("product_description"),
  productWeight: numeric("product_weight", { precision: 10, scale: 3 }),
  productNote: varchar("product_note", { length: 255 }),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const productTagsTable = pgTable(
  "product_tags",
  {
    tagId: integer("tag_id").notNull(),
    productId: uuid("product_id").notNull(),
  },
  (table) => [primaryKey({ columns: [table.tagId, table.productId] })],
);

export const productCategoriesTable = pgTable(
  "product_categories",
  {
    categoryId: uuid("category_id").notNull(),
    productId: uuid("product_id").notNull(),
  },
  (table) => [primaryKey({ columns: [table.categoryId, table.productId] })],
);

export const attributesTable = pgTable("attributes", {
  id: uuid("id").defaultRandom().primaryKey(),
  attributeName: varchar("attribute_name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
});

export const attributeValuesTable = pgTable("attribute_values", {
  id: uuid("id").defaultRandom().primaryKey(),
  attributeId: uuid("attribute_id").notNull(),
  attributeValue: varchar("attribute_value", { length: 255 }).notNull(),
  color: varchar("color", { length: 50 }),
});

export const productAttributesTable = pgTable(
  "product_attributes",
  {
    productId: uuid("product_id").notNull(),
    attributeId: uuid("attribute_id").notNull(),
  },
  (table) => [primaryKey({ columns: [table.productId, table.attributeId] })],
);

export const variantsTable = pgTable("variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  variantAttributeValueId: uuid("variant_attribute_value_id"),
  productId: uuid("product_id").notNull(),
});

export const variantValuesTable = pgTable("variant_values", {
  id: uuid("id").defaultRandom().primaryKey(),
  variantId: uuid("variant_id").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }),
  quantity: integer("quantity").notNull().default(0),
});

export const variantAttributeValuesTable = pgTable("variant_attribute_values", {
  id: uuid("id").defaultRandom().primaryKey(),
  variantAttributeValueId: uuid("variant_attribute_value_id"),
  attributeValueId: uuid("attribute_value_id").notNull(),
});

export const galleriesTable = pgTable("galleries", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull(),
  imagePath: text("image_path").notNull(),
  thumbail: boolean("thumbail").notNull().default(false),
  displayOrder: smallint("display_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
});

export const rolesTable = pgTable("roles", {
  id: serial("id").primaryKey(),
  roleName: varchar("role_name", { length: 255 }).notNull(),
  privileges: text("privileges").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
});

export const staffAccountsTable = pgTable("staff_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 100 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash"),
  active: boolean("active").notNull().default(true),
  profileImg: text("profile_img"),
  registeredAt: timestamp("registered_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
});

export const staffRolesTable = pgTable(
  "staff_roles",
  {
    staffId: uuid("staff_id").notNull(),
    roleId: integer("role_id").notNull(),
  },
  (table) => [primaryKey({ columns: [table.staffId, table.roleId] })],
);

export const sellsTable = pgTable("sells", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull(),
  price: real("price").notNull(),
  quantity: smallint("quantity").notNull().default(1),
});

export const cardsTable = pgTable("cards", {
  cardId: uuid("card_id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id"),
});

export const cardItemsTable = pgTable("card_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  cardId: uuid("card_id").notNull(),
  productId: uuid("product_id").notNull(),
  quantity: smallint("quantity").notNull().default(1),
});

export const shippingsTable = pgTable("shippings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
  iconPath: text("icon_path"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
});

export const productShippingsTable = pgTable(
  "product_shippings",
  {
    productId: uuid("product_id").notNull(),
    shippingId: integer("shipping_id").notNull(),
    shipCharge: numeric("ship_charge", { precision: 12, scale: 2 }).notNull().default("0"),
    free: boolean("free").notNull().default(false),
    estimatedDays: numeric("estimated_days", { precision: 5, scale: 1 }),
  },
  (table) => [primaryKey({ columns: [table.productId, table.shippingId] })],
);

export const orderStatusesTable = pgTable("order_statuses", {
  id: serial("id").primaryKey(),
  statusName: varchar("status_name", { length: 255 }).notNull(),
  color: varchar("color", { length: 50 }),
  privacy: varchar("privacy", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
});

export const couponsTable = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 255 }).notNull().unique(),
  couponDescription: text("coupon_description"),
  discountValue: numeric("discount_value", { precision: 12, scale: 2 }),
  timesUsed: integer("times_used").notNull().default(0),
  maxUsage: integer("max_usage"),
  couponStartDate: timestamp("coupon_start_date", { withTimezone: true }),
  couponEndDate: timestamp("coupon_end_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
});

export const customersTable = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 255 }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  active: boolean("active").notNull().default(true),
  registeredAt: timestamp("registered_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const paymentMethodsTable = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  accountName: varchar("account_name", { length: 255 }),
  accountNumber: varchar("account_number", { length: 255 }),
  instructions: text("instructions"),
  iconKey: varchar("icon_key", { length: 50 }).notNull().default("wallet"),
  requiresTransactionReference: boolean("requires_transaction_reference").notNull().default(false),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const customerAddressesTable = pgTable("customer_addresses", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id").notNull(),
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  postalCode: varchar("postal_code", { length: 255 }),
  country: varchar("country", { length: 255 }),
  city: varchar("city", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 255 }),
});

export const ordersTable = pgTable("orders", {
  id: varchar("id", { length: 50 }).primaryKey(),
  couponId: integer("coupon_id"),
  customerId: uuid("customer_id"),
  paymentMethodId: integer("payment_method_id"),
  paymentReference: varchar("payment_reference", { length: 255 }),
  paymentStatus: varchar("payment_status", { length: 50 }).notNull().default("awaiting_payment"),
  paymentSubmittedAt: timestamp("payment_submitted_at", { withTimezone: true }),
  paymentVerifiedAt: timestamp("payment_verified_at", { withTimezone: true }),
  orderStatusId: integer("order_status_id"),
  orderApprovedAt: timestamp("order_approved_at", { withTimezone: true }),
  orderDeliveredCarrierDate: timestamp("order_delivered_carrier_date", { withTimezone: true }),
  orderDeliveredCustomerDate: timestamp("order_delivered_customer_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const orderItemsTable = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull(),
  orderId: varchar("order_id", { length: 50 }),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  shippingId: integer("shipping_id"),
});

export const productCouponsTable = pgTable(
  "product_coupons",
  {
    couponId: uuid("coupon_id").notNull(),
    productId: uuid("product_id").notNull(),
  },
  (table) => [primaryKey({ columns: [table.couponId, table.productId] })],
);

export const notificationsTable = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id"),
  title: varchar("title", { length: 100 }).notNull(),
  content: text("content"),
  seen: boolean("seen").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  receiveTime: timestamp("receive_time", { withTimezone: true }),
  notificationExpiryDate: date("notification_expiry_date"),
});

export const slideshowsTable = pgTable("slideshows", {
  id: uuid("id").defaultRandom().primaryKey(),
  destinationUrl: text("destination_url"),
  imageUrl: text("image_url").notNull(),
  clicks: smallint("clicks").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
});

export type CatalogTableName =
  | "tags"
  | "product_tags"
  | "categories"
  | "product_categories"
  | "products"
  | "variants"
  | "variant_values"
  | "variant_attribute_values"
  | "attribute_values"
  | "product_attributes"
  | "attributes"
  | "galleries"
  | "staff_accounts"
  | "staff_roles"
  | "roles"
  | "sells"
  | "card_items"
  | "cards"
  | "product_shippings"
  | "shippings"
  | "orders"
  | "order_items"
  | "order_statuses"
  | "coupons"
  | "product_coupons"
  | "customers"
  | "customer_addresses"
  | "notifications"
  | "slideshows";