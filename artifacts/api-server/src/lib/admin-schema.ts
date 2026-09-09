export type AdminColumnType = "text" | "number" | "boolean" | "date" | "uuid" | "json" | "array";

export type AdminColumn = {
  key: string;
  label: string;
  type: AdminColumnType;
  nullable: boolean;
  primaryKey: boolean;
  generated: boolean;
  references: string | null;
};

export type AdminRelation = {
  column: string;
  targetTable: string;
  targetColumn: string;
  kind: "belongs_to" | "has_many" | "many_to_many" | "parent";
  label: string;
};

export type AdminTable = {
  key: string;
  label: string;
  group: string;
  primaryKey: string;
  columns: AdminColumn[];
  relations: AdminRelation[];
};

const column = (
  key: string,
  label: string,
  type: AdminColumnType,
  options: Partial<Pick<AdminColumn, "nullable" | "primaryKey" | "generated" | "references">> = {},
): AdminColumn => ({
  key,
  label,
  type,
  nullable: options.nullable ?? true,
  primaryKey: options.primaryKey ?? false,
  generated: options.generated ?? false,
  references: options.references ?? null,
});

const id = (key = "id", label = "المعرّف"): AdminColumn =>
  column(key, label, key === "id" ? "uuid" : "text", { nullable: false, primaryKey: true, generated: true });
const serialId = (): AdminColumn => column("id", "المعرّف", "number", { nullable: false, primaryKey: true, generated: true });
const created = (): AdminColumn => column("created_at", "تاريخ الإنشاء", "date", { generated: true });
const updated = (): AdminColumn => column("updated_at", "آخر تحديث", "date", { generated: true });
const relation = (
  columnName: string,
  targetTable: string,
  targetColumn: string,
  kind: AdminRelation["kind"],
  label: string,
): AdminRelation => ({ column: columnName, targetTable, targetColumn, kind, label });

const tables: AdminTable[] = [
  {
    key: "products", label: "المنتجات", group: "الكتالوج", primaryKey: "id",
    columns: [
      id(), column("brand", "العلامة التجارية", "text", { nullable: false }), column("product_name", "اسم المنتج", "text", { nullable: false }), column("SKU", "SKU", "text", { nullable: false }),
      column("brand_id", "مرجع العلامة", "uuid", { references: "brands.id" }), column("slug", "الرابط المختصر", "text"),
      column("regular_price", "السعر الأساسي", "number", { nullable: false }), column("discount_price", "سعر الخصم", "number"),
      column("quantity", "الكمية", "number", { nullable: false }), column("short_description", "الوصف المختصر", "text"),
      column("product_description", "وصف المنتج", "text"), column("product_weight", "الوزن", "number"),
      column("product_note", "ملاحظة المنتج", "text"), column("published", "منشور", "boolean", { nullable: false }), created(), updated(),
    ],
    relations: [
      relation("id", "product_categories", "product_id", "has_many", "تصنيفات المنتج"),
      relation("brand_id", "brands", "id", "belongs_to", "العلامة التجارية"),
      relation("id", "product_tags", "product_id", "has_many", "وسوم المنتج"),
      relation("id", "product_attributes", "product_id", "has_many", "خصائص المنتج"),
      relation("id", "variants", "product_id", "has_many", "المتغيرات"),
      relation("id", "galleries", "product_id", "has_many", "معرض الصور"),
      relation("id", "product_shippings", "product_id", "has_many", "خيارات الشحن"),
      relation("id", "order_items", "product_id", "has_many", "عناصر الطلبات"),
    ],
  },
  {
    key: "categories", label: "التصنيفات", group: "الكتالوج", primaryKey: "id",
    columns: [
      id(), column("parent_id", "التصنيف الأب", "uuid", { references: "categories.id" }), column("category_name", "اسم التصنيف", "text", { nullable: false }),
      column("slug", "الرابط المختصر", "text"), column("category_description", "الوصف", "text"), column("icon", "الأيقونة", "text"), column("image_path", "مسار الصورة", "text"),
      column("seo_title", "عنوان SEO", "text"), column("meta_description", "وصف محركات البحث", "text"), column("seo_description", "وصف SEO", "text"),
      column("seo_indexable", "قابل للفهرسة", "boolean", { nullable: false }),
      column("active", "نشط", "boolean", { nullable: false }), created(), updated(),
    ],
    relations: [
      relation("parent_id", "categories", "id", "parent", "التصنيف الأب"),
      relation("id", "product_categories", "category_id", "has_many", "منتجات التصنيف"),
    ],
  },
  {
    key: "brands", label: "العلامات التجارية", group: "الكتالوج", primaryKey: "id",
    columns: [
      id(), column("brand_name", "اسم العلامة", "text", { nullable: false }), column("slug", "الرابط المختصر", "text", { nullable: false }),
      column("description", "الوصف", "text"), column("image_path", "الصورة", "text"),
      column("seo_title", "عنوان SEO", "text"), column("meta_description", "وصف محركات البحث", "text"), column("seo_description", "وصف SEO", "text"),
      column("seo_indexable", "قابل للفهرسة", "boolean", { nullable: false }), created(), updated(),
    ],
    relations: [
      relation("id", "products", "brand_id", "has_many", "منتجات العلامة"),
    ],
  },
  {
    key: "seo_guides", label: "أدلة الشراء", group: "المحتوى", primaryKey: "id",
    columns: [
      id(), column("slug", "الرابط المختصر", "text", { nullable: false }), column("title", "عنوان الصفحة", "text", { nullable: false }),
      column("h1", "العنوان الرئيسي", "text", { nullable: false }), column("meta_description", "وصف محركات البحث", "text", { nullable: false }),
      column("description", "المقدمة", "text"), column("content", "المحتوى", "text", { nullable: false }), column("image_path", "الصورة", "text"),
      column("canonical_path", "المسار الأساسي", "text"), column("seo_indexable", "قابل للفهرسة", "boolean", { nullable: false }),
      column("published", "منشور", "boolean", { nullable: false }), column("published_at", "تاريخ النشر", "date"), created(), updated(),
    ],
    relations: [],
  },
  {
    key: "seo_redirects", label: "تحويلات SEO", group: "المحتوى", primaryKey: "id",
    columns: [
      id(), column("from_path", "المسار القديم", "text", { nullable: false }), column("to_path", "المسار الجديد", "text", { nullable: false }),
      column("status_code", "رمز التحويل", "number", { nullable: false }), column("active", "نشط", "boolean", { nullable: false }), created(), updated(),
    ],
    relations: [],
  },
  {
    key: "tags", label: "الوسوم", group: "الكتالوج", primaryKey: "id",
    columns: [serialId(), column("tag_name", "اسم الوسم", "text", { nullable: false }), column("icon", "الأيقونة", "text"), created(), updated()],
    relations: [relation("id", "product_tags", "tag_id", "has_many", "منتجات الوسم")],
  },
  {
    key: "product_categories", label: "ربط المنتجات بالتصنيفات", group: "العلاقات", primaryKey: "category_id,product_id",
    columns: [column("category_id", "التصنيف", "uuid", { nullable: false, primaryKey: true, references: "categories.id" }), column("product_id", "المنتج", "uuid", { nullable: false, primaryKey: true, references: "products.id" })],
    relations: [relation("category_id", "categories", "id", "belongs_to", "التصنيف"), relation("product_id", "products", "id", "belongs_to", "المنتج")],
  },
  {
    key: "product_tags", label: "ربط المنتجات بالوسوم", group: "العلاقات", primaryKey: "tag_id,product_id",
    columns: [column("tag_id", "الوسم", "number", { nullable: false, primaryKey: true, references: "tags.id" }), column("product_id", "المنتج", "uuid", { nullable: false, primaryKey: true, references: "products.id" })],
    relations: [relation("tag_id", "tags", "id", "belongs_to", "الوسم"), relation("product_id", "products", "id", "belongs_to", "المنتج")],
  },
  {
    key: "attributes", label: "الخصائص", group: "الكتالوج", primaryKey: "id",
    columns: [id(), column("attribute_name", "اسم الخاصية", "text", { nullable: false }), created(), updated()],
    relations: [relation("id", "attribute_values", "attribute_id", "has_many", "قيم الخاصية"), relation("id", "product_attributes", "attribute_id", "has_many", "منتجات الخاصية")],
  },
  {
    key: "attribute_values", label: "قيم الخصائص", group: "الكتالوج", primaryKey: "id",
    columns: [id(), column("attribute_id", "الخاصية", "uuid", { nullable: false, references: "attributes.id" }), column("attribute_value", "القيمة", "text", { nullable: false }), column("color", "اللون", "text")],
    relations: [relation("attribute_id", "attributes", "id", "belongs_to", "الخاصية"), relation("id", "variant_attribute_values", "attribute_value_id", "has_many", "قيم المتغيرات")],
  },
  {
    key: "product_attributes", label: "ربط المنتجات بالخصائص", group: "العلاقات", primaryKey: "product_id,attribute_id",
    columns: [column("product_id", "المنتج", "uuid", { nullable: false, primaryKey: true, references: "products.id" }), column("attribute_id", "الخاصية", "uuid", { nullable: false, primaryKey: true, references: "attributes.id" })],
    relations: [relation("product_id", "products", "id", "belongs_to", "المنتج"), relation("attribute_id", "attributes", "id", "belongs_to", "الخاصية")],
  },
  {
    key: "variants", label: "متغيرات المنتجات", group: "الكتالوج", primaryKey: "id",
    columns: [id(), column("variant_attribute_value_id", "رابط قيمة المتغير", "uuid"), column("product_id", "المنتج", "uuid", { nullable: false, references: "products.id" })],
    relations: [relation("product_id", "products", "id", "belongs_to", "المنتج"), relation("id", "variant_values", "variant_id", "has_many", "قيم المتغير")],
  },
  {
    key: "variant_values", label: "قيم المتغيرات", group: "الكتالوج", primaryKey: "id",
    columns: [id(), column("variant_id", "المتغير", "uuid", { nullable: false, references: "variants.id" }), column("price", "السعر", "number"), column("quantity", "الكمية", "number", { nullable: false })],
    relations: [relation("variant_id", "variants", "id", "belongs_to", "المتغير")],
  },
  {
    key: "variant_attribute_values", label: "قيم خصائص المتغيرات", group: "العلاقات", primaryKey: "id",
    columns: [id(), column("variant_attribute_value_id", "رابط المتغير", "uuid"), column("attribute_value_id", "قيمة الخاصية", "uuid", { nullable: false, references: "attribute_values.id" })],
    relations: [relation("attribute_value_id", "attribute_values", "id", "belongs_to", "قيمة الخاصية")],
  },
  {
    key: "galleries", label: "معارض الصور", group: "الكتالوج", primaryKey: "id",
    columns: [id(), column("product_id", "المنتج", "uuid", { nullable: false, references: "products.id" }), column("image_path", "مسار الصورة", "text", { nullable: false }), column("thumbail", "صورة مصغرة", "boolean", { nullable: false }), column("display_order", "ترتيب العرض", "number", { nullable: false }), created(), updated()],
    relations: [relation("product_id", "products", "id", "belongs_to", "المنتج")],
  },
  {
    key: "shippings", label: "طرق الشحن", group: "الشحن", primaryKey: "id",
    columns: [serialId(), column("name", "اسم الشحن", "text", { nullable: false }), column("active", "نشط", "boolean", { nullable: false }), column("icon_path", "الأيقونة", "text"), created(), updated()],
    relations: [relation("id", "product_shippings", "shipping_id", "has_many", "شحن المنتجات"), relation("id", "order_items", "shipping_id", "has_many", "شحن الطلبات")],
  },
  {
    key: "product_shippings", label: "شحن المنتجات", group: "العلاقات", primaryKey: "product_id,shipping_id",
    columns: [column("product_id", "المنتج", "uuid", { nullable: false, primaryKey: true, references: "products.id" }), column("shipping_id", "طريقة الشحن", "number", { nullable: false, primaryKey: true, references: "shippings.id" }), column("ship_charge", "رسوم الشحن", "number", { nullable: false }), column("free", "مجاني", "boolean", { nullable: false }), column("estimated_days", "الأيام المتوقعة", "number")],
    relations: [relation("product_id", "products", "id", "belongs_to", "المنتج"), relation("shipping_id", "shippings", "id", "belongs_to", "طريقة الشحن")],
  },
  {
    key: "payment_methods", label: "طرق الدفع", group: "المبيعات", primaryKey: "id",
    columns: [serialId(), column("name", "اسم الطريقة", "text", { nullable: false }), column("description", "الوصف", "text"), column("account_name", "اسم الحساب", "text"), column("account_number", "رقم الحساب", "text"), column("instructions", "التعليمات", "text"), column("icon_key", "رمز الأيقونة", "text", { nullable: false }), column("requires_transaction_reference", "تتطلب رقم العملية", "boolean", { nullable: false }), column("active", "نشط", "boolean", { nullable: false }), column("sort_order", "الترتيب", "number", { nullable: false }), created(), updated()],
    relations: [relation("id", "orders", "payment_method_id", "has_many", "الطلبات")],
  },
  {
    key: "customers", label: "العملاء", group: "العملاء", primaryKey: "id",
    columns: [id(), column("first_name", "الاسم الأول", "text", { nullable: false }), column("last_name", "اسم العائلة", "text", { nullable: false }), column("phone_number", "رقم الهاتف", "text"), column("email", "البريد الإلكتروني", "text", { nullable: false }), column("active", "نشط", "boolean", { nullable: false }), column("registered_at", "تاريخ التسجيل", "date"), created()],
    relations: [relation("id", "customer_addresses", "customer_id", "has_many", "العناوين"), relation("id", "orders", "customer_id", "has_many", "الطلبات"), relation("id", "cards", "customer_id", "has_many", "السلال")],
  },
  {
    key: "customer_addresses", label: "عناوين العملاء", group: "العملاء", primaryKey: "id",
    columns: [id(), column("customer_id", "العميل", "uuid", { nullable: false, references: "customers.id" }), column("address_line1", "العنوان", "text", { nullable: false }), column("address_line2", "العنوان الإضافي", "text"), column("postal_code", "الرمز البريدي", "text"), column("country", "الدولة", "text"), column("city", "المدينة", "text"), column("phone_number", "الهاتف", "text")],
    relations: [relation("customer_id", "customers", "id", "belongs_to", "العميل")],
  },
  {
    key: "orders", label: "الطلبات", group: "المبيعات", primaryKey: "id",
    columns: [column("id", "رقم الطلب", "text", { nullable: false, primaryKey: true }), column("coupon_id", "القسيمة", "number", { references: "coupons.id" }), column("customer_id", "العميل", "uuid", { references: "customers.id" }), column("payment_method_id", "طريقة الدفع", "number", { references: "payment_methods.id" }), column("payment_reference", "رقم العملية", "text"), column("payment_status", "حالة الدفع", "text", { nullable: false }), column("payment_submitted_at", "تاريخ إرسال الدفع", "date"), column("payment_verified_at", "تاريخ اعتماد الدفع", "date"), column("order_status_id", "حالة الطلب", "number", { references: "order_statuses.id" }), column("order_approved_at", "تاريخ الاعتماد", "date"), column("order_delivered_carrier_date", "تاريخ التسليم لشركة الشحن", "date"), column("order_delivered_customer_date", "تاريخ تسليم العميل", "date"), created()],
    relations: [relation("customer_id", "customers", "id", "belongs_to", "العميل"), relation("payment_method_id", "payment_methods", "id", "belongs_to", "طريقة الدفع"), relation("order_status_id", "order_statuses", "id", "belongs_to", "الحالة"), relation("coupon_id", "coupons", "id", "belongs_to", "القسيمة"), relation("id", "order_items", "order_id", "has_many", "عناصر الطلب")],
  },
  {
    key: "order_items", label: "عناصر الطلبات", group: "المبيعات", primaryKey: "id",
    columns: [id(), column("product_id", "المنتج", "uuid", { nullable: false, references: "products.id" }), column("order_id", "رقم الطلب", "text", { references: "orders.id" }), column("price", "السعر", "number", { nullable: false }), column("quantity", "الكمية", "number", { nullable: false }), column("shipping_id", "الشحن", "number", { references: "shippings.id" })],
    relations: [relation("product_id", "products", "id", "belongs_to", "المنتج"), relation("order_id", "orders", "id", "belongs_to", "الطلب"), relation("shipping_id", "shippings", "id", "belongs_to", "الشحن")],
  },
  {
    key: "order_statuses", label: "حالات الطلبات", group: "المبيعات", primaryKey: "id",
    columns: [serialId(), column("status_name", "اسم الحالة", "text", { nullable: false }), column("color", "اللون", "text"), column("privacy", "الخصوصية", "text"), created(), updated()],
    relations: [relation("id", "orders", "order_status_id", "has_many", "الطلبات")],
  },
  {
    key: "coupons", label: "القسائم", group: "المبيعات", primaryKey: "id",
    columns: [serialId(), column("code", "رمز القسيمة", "text", { nullable: false }), column("coupon_description", "الوصف", "text"), column("discount_value", "قيمة الخصم", "number"), column("times_used", "مرات الاستخدام", "number", { nullable: false }), column("max_usage", "الحد الأقصى", "number"), column("coupon_start_date", "بداية القسيمة", "date"), column("coupon_end_date", "نهاية القسيمة", "date"), created(), updated()],
    relations: [relation("id", "orders", "coupon_id", "has_many", "الطلبات"), relation("id", "product_coupons", "coupon_id", "has_many", "منتجات القسيمة")],
  },
  {
    key: "product_coupons", label: "ربط المنتجات بالقسائم", group: "العلاقات", primaryKey: "coupon_id,product_id",
    columns: [column("coupon_id", "القسيمة", "uuid", { nullable: false, primaryKey: true, references: "coupons.id" }), column("product_id", "المنتج", "uuid", { nullable: false, primaryKey: true, references: "products.id" })],
    relations: [relation("coupon_id", "coupons", "id", "belongs_to", "القسيمة"), relation("product_id", "products", "id", "belongs_to", "المنتج")],
  },
  {
    key: "cards", label: "السلال", group: "المبيعات", primaryKey: "card_id",
    columns: [id("card_id", "معرّف السلة"), column("customer_id", "العميل", "uuid", { references: "customers.id" })],
    relations: [relation("customer_id", "customers", "id", "belongs_to", "العميل"), relation("card_id", "card_items", "card_id", "has_many", "عناصر السلة")],
  },
  {
    key: "card_items", label: "عناصر السلال", group: "المبيعات", primaryKey: "id",
    columns: [id(), column("card_id", "السلة", "uuid", { nullable: false, references: "cards.card_id" }), column("product_id", "المنتج", "uuid", { nullable: false, references: "products.id" }), column("quantity", "الكمية", "number", { nullable: false })],
    relations: [relation("card_id", "cards", "card_id", "belongs_to", "السلة"), relation("product_id", "products", "id", "belongs_to", "المنتج")],
  },
  {
    key: "sells", label: "سجل المبيعات", group: "المبيعات", primaryKey: "id",
    columns: [id(), column("product_id", "المنتج", "uuid", { nullable: false, references: "products.id" }), column("price", "السعر", "number", { nullable: false }), column("quantity", "الكمية", "number", { nullable: false })],
    relations: [relation("product_id", "products", "id", "belongs_to", "المنتج")],
  },
  {
    key: "roles", label: "الأدوار", group: "الموظفون", primaryKey: "id",
    columns: [serialId(), column("role_name", "اسم الدور", "text", { nullable: false }), column("privileges", "الصلاحيات", "array", { nullable: false }), created(), updated()],
    relations: [relation("id", "staff_roles", "role_id", "has_many", "موظفو الدور")],
  },
  {
    key: "staff_accounts", label: "حسابات الموظفين", group: "الموظفون", primaryKey: "id",
    columns: [id(), column("first_name", "الاسم الأول", "text", { nullable: false }), column("last_name", "اسم العائلة", "text", { nullable: false }), column("phone_number", "الهاتف", "text"), column("email", "البريد الإلكتروني", "text", { nullable: false }), column("active", "نشط", "boolean", { nullable: false }), column("profile_img", "صورة الملف", "text"), column("registered_at", "تاريخ التسجيل", "date"), updated()],
    relations: [relation("id", "staff_roles", "staff_id", "has_many", "أدوار الموظف")],
  },
  {
    key: "staff_roles", label: "ربط الموظفين بالأدوار", group: "العلاقات", primaryKey: "staff_id,role_id",
    columns: [column("staff_id", "الموظف", "uuid", { nullable: false, primaryKey: true, references: "staff_accounts.id" }), column("role_id", "الدور", "number", { nullable: false, primaryKey: true, references: "roles.id" })],
    relations: [relation("staff_id", "staff_accounts", "id", "belongs_to", "الموظف"), relation("role_id", "roles", "id", "belongs_to", "الدور")],
  },
  {
    key: "notifications", label: "الإشعارات", group: "النظام", primaryKey: "id",
    columns: [id(), column("account_id", "الحساب", "uuid"), column("title", "العنوان", "text", { nullable: false }), column("content", "المحتوى", "text"), column("seen", "تمت المشاهدة", "boolean", { nullable: false }), created(), column("receive_time", "وقت الاستلام", "date"), column("notification_expiry_date", "تاريخ الانتهاء", "date")],
    relations: [],
  },
  {
    key: "slideshows", label: "الشرائح", group: "المحتوى", primaryKey: "id",
    columns: [id(), column("destination_url", "الرابط", "text"), column("image_url", "رابط الصورة", "text", { nullable: false }), column("clicks", "النقرات", "number", { nullable: false }), created(), updated()],
    relations: [],
  },
  {
    key: "quote_requests", label: "طلبات العملاء", group: "التواصل", primaryKey: "id",
    columns: [serialId(), column("customer_name", "اسم العميل", "text", { nullable: false }), column("phone", "الهاتف", "text", { nullable: false }), column("business_name", "الجهة", "text"), column("notes", "الملاحظات", "text"), column("items", "العناصر", "json", { nullable: false }), column("status", "الحالة", "text", { nullable: false }), created()],
    relations: [],
  },
  {
    key: "newsletter_subscriptions", label: "اشتراكات البريد", group: "التواصل", primaryKey: "id",
    columns: [serialId(), column("email", "البريد الإلكتروني", "text", { nullable: false }), created()],
    relations: [],
  },
];

export const adminTables = tables;
export const adminTableMap = new Map(tables.map((table) => [table.key, table]));

export const adminGroups = ["الكتالوج", "العلاقات", "الشحن", "العملاء", "المبيعات", "الموظفون", "المحتوى", "التواصل", "النظام"];