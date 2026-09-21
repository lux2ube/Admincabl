import type { StoreSpecifications } from "@workspace/api-zod";

type Breadcrumb = {
  name: string;
  path: string;
};

type SeoResponse = {
  entityType: "home" | "product" | "category" | "brand" | "guide";
  slug: string | null;
  title: string;
  h1: string;
  description: string;
  canonicalPath: string;
  indexable: boolean;
  breadcrumbs: Breadcrumb[];
  jsonLd: Record<string, unknown>;
};

type ProductSeoInput = {
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
  image: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  specifications?: StoreSpecifications;
};

type ProductDescriptionInput = Omit<ProductSeoInput, "slug">;

type CategorySeoInput = {
  slug: string;
  name: string;
  description: string | null;
  seoDescription: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  imagePath: string | null;
  indexable: boolean;
};

type BrandSeoInput = {
  slug: string;
  name: string;
  description: string | null;
  seoDescription: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  imagePath: string | null;
  indexable: boolean;
};

type GuideSeoInput = {
  slug: string;
  title: string;
  h1: string;
  metaDescription: string;
  description: string | null;
  content: string;
  imagePath: string | null;
  canonicalPath: string | null;
  indexable: boolean;
};

export const STORE_BASE_PATH = "/cabl-store";

export function mountedStorePath(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === STORE_BASE_PATH || normalized.startsWith(`${STORE_BASE_PATH}/`)) return normalized;
  return `${STORE_BASE_PATH}${normalized === "/" ? "" : normalized}`;
}

const HOME_TITLE = "CABL | منتجات الشحن والطاقة والإكسسوارات";
const HOME_DESCRIPTION = "تسوق منتجات الشحن والطاقة والإكسسوارات من كتالوج CABL، مع أسعار ومخزون وخيارات شحن مأخوذة من المتجر.";

const categorySeoProfiles: Record<string, { title: string; description: string }> = {
  chargers: {
    title: "شواحن الجوال والشحن السريع في اليمن | CABL",
    description: "قارن شواحن الجوال وUSB-C وPD المتاحة في كتالوج CABL داخل اليمن، مع مواصفات المنتج والسعر والتوافر قبل الطلب.",
  },
  "charging-cables": {
    title: "كابلات وتوصيلات الشحن في اليمن | CABL",
    description: "استكشف توصيلات الشحن المنشورة في CABL حسب USB-C وLightning والقدرة ونقل البيانات عندما تكون هذه القيم موثقة للموديل.",
  },
  "power-banks": {
    title: "خوازن الطاقة والباور بانك في اليمن | CABL",
    description: "قارن خوازن الطاقة والباور بانك المتاحة في اليمن حسب السعة والقدرة والمنافذ والخصائص المنشورة للموديل.",
  },
  "phone-accessories": {
    title: "وصلات ومحاور وملحقات الأجهزة في اليمن | CABL",
    description: "تصفح وصلات ومحاور وملحقات الأجهزة المنشورة في CABL، وقارن المنافذ والقدرة والتوافق والسعر قبل الطلب.",
  },
  "travel-adapters": {
    title: "شواحن السيارة وملحقات السفر في اليمن | CABL",
    description: "قارن شواحن السيارة وملحقات السفر المنشورة في كتالوج CABL حسب القدرة والمنافذ والتوافق والتوافر داخل اليمن.",
  },
  "wireless-earbuds": {
    title: "سماعات الأذن اللاسلكية في اليمن | CABL",
    description: "قارن سماعات الأذن اللاسلكية المنشورة في اليمن حسب الموديل والاستخدام والمكالمات والخصائص المعلنة.",
  },
  "wireless-microphones": {
    title: "الميكروفونات اللاسلكية لصناع المحتوى في اليمن | CABL",
    description: "استكشف الميكروفونات اللاسلكية المنشورة في اليمن، وقارن التكوين والمستقبلات والتوافق قبل الطلب من CABL.",
  },
};

const publicCategoryAliases: Record<string, string> = {
  "charging-cables": "cables",
  "travel-adapters": "car-accessories",
  "phone-accessories": "hubs-adapters",
};

export function publicCategorySlug(slug: string) {
  return publicCategoryAliases[slug] || slug;
}

export function publicCategoryPath(slug: string | null) {
  return mountedStorePath(slug ? `/category/${slug}` : "/categories/");
}

export function brandPublicPath(slug: string) {
  return mountedStorePath(`/brand/${slug}`);
}

export function brandCategoryPublicPath(brandSlug: string, categorySlug: string) {
  return mountedStorePath(`/${brandSlug}/${publicCategorySlug(categorySlug)}`);
}

export function productPublicPath({
  brandSlug,
  categorySlug,
  productSlug,
}: {
  brandSlug?: string | null;
  categorySlug?: string | null;
  productSlug: string;
}) {
  return brandSlug && categorySlug
    ? mountedStorePath(`${brandCategoryPublicPath(brandSlug, categorySlug)}/${productSlug}`)
    : mountedStorePath(`/product/${productSlug}`);
}

const arabicLetters = new Map([
  ["ا", "a"], ["ب", "b"], ["ت", "t"], ["ث", "th"], ["ج", "j"], ["ح", "h"], ["خ", "kh"],
  ["د", "d"], ["ذ", "th"], ["ر", "r"], ["ز", "z"], ["س", "s"], ["ش", "sh"], ["ص", "s"],
  ["ض", "d"], ["ط", "t"], ["ظ", "z"], ["ع", "a"], ["غ", "gh"], ["ف", "f"], ["ق", "q"],
  ["ك", "k"], ["ل", "l"], ["م", "m"], ["ن", "n"], ["ه", "h"], ["و", "w"], ["ي", "y"],
  ["ة", "h"], ["ء", "a"], ["ئ", "y"], ["ؤ", "w"], ["ى", "a"],
]);

export function slugify(value: string) {
  return [...value.toLocaleLowerCase("ar-YE")]
    .map((character) => arabicLetters.get(character) ?? character)
    .join("")
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

export function productSlug(productName: string, sku: string, storedSlug?: string | null) {
  return storedSlug || `${slugify(productName) || "product"}-${slugify(sku) || "item"}`.slice(0, 180);
}

function productDisplayName(brand: string, productName: string) {
  return productName.toLocaleLowerCase("ar-YE").includes(brand.toLocaleLowerCase("ar-YE"))
    ? productName
    : `${brand} ${productName}`;
}

const arabicBrandNames: Record<string, string> = {
  anker: "أنكر",
  baseus: "بيسوس",
  ugreen: "يوجرين",
  vention: "فينتشن",
  soundcore: "ساوندكور",
  hollyland: "هوليلاند",
};

const categoryCopy: Record<string, { noun: string; search: string; use: string }> = {
  chargers: { noun: "شاحن", search: "شاحن", use: "شحن الهواتف والأجهزة المتوافقة للاستخدام اليومي" },
  "charging-cables": { noun: "كابل شحن", search: "كابل", use: "الشحن أو نقل البيانات بين الأجهزة المتوافقة" },
  "power-banks": { noun: "باور بانك", search: "باور بانك", use: "توفير طاقة إضافية للجوال أثناء التنقل أو السفر" },
  "phone-accessories": { noun: "محور أو ملحق للأجهزة", search: "محور USB-C", use: "توسيع المنافذ أو توصيل الملحقات المتوافقة" },
  "travel-adapters": { noun: "شاحن سيارة أو ملحق سفر", search: "شاحن سيارة", use: "شحن الأجهزة أثناء التنقل" },
  "wireless-earbuds": { noun: "سماعة أذن لاسلكية", search: "سماعات لاسلكية", use: "الاستماع والمكالمات أثناء الحركة" },
  "wireless-microphones": { noun: "ميكروفون لاسلكي", search: "ميكروفون Hollyland", use: "التسجيل أو صناعة المحتوى حسب التكوين المتاح" },
};

function cleanProductText(value: string | null | undefined) {
  return String(value || "")
    .replaceAll("واط", "وات")
    .replace(/\s+/g, " ")
    .trim();
}

function arabicBrandName(brand: string, brandSlug: string) {
  return arabicBrandNames[brandSlug.toLowerCase()] || brand;
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return Number.isInteger(value) ? String(value) : String(value).replace(/\.0+$/, "");
}

function specificationHighlights(input: ProductDescriptionInput) {
  const specifications = input.specifications;
  if (!specifications) return [];
  const highlights: string[] = [];
  const powerBank = specifications.powerBank;
  const cable = specifications.cable;
  const carCharger = specifications.carCharger;

  if (powerBank?.capacityMah) highlights.push(`سعة ${formatNumber(powerBank.capacityMah)} مللي أمبير`);
  if (powerBank?.maxOutputW) highlights.push(`قدرة إخراج تصل إلى ${formatNumber(powerBank.maxOutputW)} وات`);
  if (powerBank?.wirelessCharging === true) highlights.push("شحن لاسلكي");
  if (powerBank?.display === true) highlights.push("شاشة لعرض حالة الشحن");
  if (cable?.connectorA && cable?.connectorB) highlights.push(`موصل ${cable.connectorA} إلى ${cable.connectorB}`);
  if (cable?.lengthM) highlights.push(`طول ${formatNumber(cable.lengthM)} متر`);
  if (cable?.maxPowerW) highlights.push(`يدعم قدرة تصل إلى ${formatNumber(cable.maxPowerW)} وات`);
  if (cable?.dataSpeedGbps) highlights.push(`نقل بيانات بسرعة تصل إلى ${formatNumber(cable.dataSpeedGbps)} جيجابت/ثانية`);
  if (cable?.material) highlights.push(`مصنوع من ${cable.material}`);
  if (carCharger?.maxOutputW) highlights.push(`قدرة خرج تصل إلى ${formatNumber(carCharger.maxOutputW)} وات`);
  if (specifications.maxPowerW && !highlights.some((item) => item.includes("قدرة"))) {
    highlights.push(`قدرة تصل إلى ${formatNumber(specifications.maxPowerW)} وات`);
  }
  if (specifications.ports.length) {
    highlights.push(`${specifications.ports.length} ${specifications.ports.length === 1 ? "منفذ" : "منافذ"}`);
  }
  if (specifications.protocols.length) {
    highlights.push(`يدعم ${specifications.protocols.slice(0, 2).map((protocol) => protocol.name).join(" و")}`);
  }
  return highlights.slice(0, 5);
}

function compatibilityText(input: ProductDescriptionInput) {
  const specifications = input.specifications;
  const names = specifications?.compatibility?.map((item) => item.name).filter(Boolean) || [];
  if (names.length) return `ومناسب لـ${names.slice(0, 3).join(" و")}.`;
  if (specifications?.cable?.connectorA && specifications.cable.connectorB) {
    return `ويعمل مع الأجهزة التي تستخدم ${specifications.cable.connectorA} و${specifications.cable.connectorB}.`;
  }
  if (specifications?.carCharger) return "ومناسب للاستخدام في السيارة عندما يتوافق منفذ السيارة مع مواصفات الشاحن.";
  return "";
}

function keywordPhrase(input: ProductDescriptionInput, brandArabic: string, category: { noun: string; search: string }) {
  const power = input.specifications?.maxPowerW
    || input.specifications?.powerBank?.maxOutputW
    || input.specifications?.cable?.maxPowerW
    || input.specifications?.carCharger?.maxOutputW;
  const powerPhrase = power ? ` ${formatNumber(power)} وات` : "";
  return `${category.search} ${brandArabic}${powerPhrase}`.trim();
}

export function buildProductDescription(input: ProductDescriptionInput) {
  const brandArabic = arabicBrandName(input.brand, input.brandSlug);
  const category = categoryCopy[input.categorySlug || ""] || { noun: "منتج", search: "منتج", use: "الاستخدام اليومي" };
  const displayName = cleanProductText(productDisplayName(brandArabic, input.productName));
  const detail = cleanProductText(input.productDescription || input.shortDescription);
  const highlights = specificationHighlights(input);
  const keyword = keywordPhrase(input, brandArabic, category);
  const featureSentence = highlights.length
    ? `وتتضمن مواصفاته ${highlights.join("، ")}.`
    : "";
  const sourceDetail = detail
    ? `${detail.replace(/[.!؟]+$/, "")}.`
    : `وهو مناسب لمن يحتاج ${category.use}.`;
  const differentiator = highlights[0]
    ? `وتمنح هذه الميزة ${category.noun} استخداماً عملياً في ${category.use}.`
    : "";
  const compatibility = compatibilityText(input);
  const warranty = input.specifications?.warrantyMonths
    ? `يتوفر ضمان لمدة ${formatNumber(input.specifications.warrantyMonths)} شهراً${input.specifications.warrantyNote ? `، ${cleanProductText(input.specifications.warrantyNote)}` : ""}.`
    : input.specifications?.warrantyNote
      ? `${cleanProductText(input.specifications.warrantyNote)}.`
      : "";

  return [
    `${displayName} هو ${category.noun} من ${brandArabic} (${cleanProductText(input.brand)})، وموديل مناسب لمن يحتاج ${category.use}.`,
    sourceDetail,
    featureSentence,
    compatibility,
    differentiator,
    `إذا كنت تبحث عن ${keyword} في اليمن، يتوفر هذا المنتج عبر متجر كابل، مع عرض السعر والتوافر الحاليين في صفحة المنتج.`,
    warranty,
  ].filter(Boolean).join(" ");
}

function productMetaDescription(fullDescription: string) {
  const normalized = cleanProductText(fullDescription);
  if (normalized.length <= 160) return normalized;
  const shortened = normalized.slice(0, 157).replace(/\s+\S*$/, "").trim();
  return `${shortened}...`;
}

function breadcrumbs(items: Breadcrumb[]) {
  return [{ name: "الرئيسية", path: "/" }, ...items];
}

export function buildHomeSeo(): SeoResponse {
  return {
    entityType: "home",
    slug: null,
    title: HOME_TITLE,
    h1: "شحن أوضح. يوم أسهل.",
    description: HOME_DESCRIPTION,
    canonicalPath: "/",
    indexable: true,
    breadcrumbs: [{ name: "الرئيسية", path: "/" }],
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "/#organization",
      name: "CABL",
          url: "/",
           description: "متجر إلكترونيات ومنتجات شحن وطاقة من كتالوج CABL.",
        },
        {
          "@type": "WebSite",
          "@id": "/#website",
          name: "CABL",
          url: "/",
          inLanguage: "ar-YE",
          publisher: { "@id": "/#organization" },
        },
        {
          "@type": "Store",
          "@id": "/#store",
          name: "CABL منتجات الشحن والطاقة",
          url: "/",
           description: "كتالوج CABL لمنتجات الشحن والطاقة والإكسسوارات.",
        },
      ],
    },
  };
}

export function buildProductSeo(input: ProductSeoInput): SeoResponse {
  const displayName = cleanProductText(productDisplayName(input.brand, input.productName));
  const fullDescription = buildProductDescription(input);
  const description = productMetaDescription(fullDescription);
  const canonicalPath = productPublicPath({
    brandSlug: input.brandSlug,
    categorySlug: input.categorySlug,
    productSlug: input.slug,
  });
  const categoryPath = input.brandSlug && input.categorySlug
    ? brandCategoryPublicPath(input.brandSlug, input.categorySlug)
    : publicCategoryPath(input.categorySlug);
  const categoryName = input.categoryName || "المنتجات";
  const price = input.discountPrice ?? input.regularPrice;

  return {
    entityType: "product",
    slug: input.slug,
    title: `${displayName} | ${categoryName} | CABL`,
    h1: input.productName,
    description,
    canonicalPath,
    indexable: true,
    breadcrumbs: breadcrumbs([
      { name: input.brand, path: brandPublicPath(input.brandSlug) },
      { name: categoryName, path: categoryPath },
      { name: input.productName, path: canonicalPath },
    ]),
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Product",
      name: input.productName,
      description: fullDescription,
      sku: input.sku,
      url: canonicalPath,
      ...(input.image ? { image: [input.image] } : {}),
        brand: { "@type": "Brand", name: input.brand, url: brandPublicPath(input.brandSlug) },
      offers: {
        "@type": "Offer",
        url: canonicalPath,
        priceCurrency: "USD",
        price,
        availability: input.quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      },
    },
  };
}

export function buildCategorySeo(input: CategorySeoInput): SeoResponse {
  const canonicalPath = publicCategoryPath(input.slug);
  const keywordProfile = categorySeoProfiles[input.slug];
  const description = input.metaDescription
    || input.seoDescription
    || input.description
    || keywordProfile?.description
    || `${input.name} من كتالوج CABL مع خيارات الشحن المتاحة.`;

  return {
    entityType: "category",
    slug: input.slug,
    title: input.seoTitle || keywordProfile?.title || `${input.name} | CABL`,
    h1: input.name,
    description,
    canonicalPath,
    indexable: input.indexable,
    breadcrumbs: breadcrumbs([{ name: input.name, path: canonicalPath }]),
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: input.name,
      description,
      url: canonicalPath,
      ...(input.imagePath ? { image: [input.imagePath] } : {}),
    },
  };
}

export function buildBrandSeo(input: BrandSeoInput): SeoResponse {
  const canonicalPath = `/brand/${input.slug}`;
  const description = input.metaDescription
    || input.seoDescription
    || input.description
    || `منتجات ${input.name} في اليمن من كتالوج CABL، مع صفحات الموديلات والمواصفات والسعر والتوافر قبل الطلب.`;

  return {
    entityType: "brand",
    slug: input.slug,
    title: input.seoTitle || `منتجات ${input.name} | CABL`,
    h1: `منتجات ${input.name}`,
    description,
    canonicalPath,
    indexable: input.indexable,
    breadcrumbs: breadcrumbs([{ name: input.name, path: canonicalPath }]),
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Brand",
      name: input.name,
      url: canonicalPath,
      ...(input.imagePath ? { image: input.imagePath } : {}),
      description,
    },
  };
}

export function buildGuideSeo(input: GuideSeoInput): SeoResponse {
  const canonicalPath = mountedStorePath((input.canonicalPath || `/guides/${input.slug}`)
    .replace(/^\/cabl-store/, "")
    .replace(/^\/guide\//, "/guides/"));
  const description = input.metaDescription || input.description || input.title;

  return {
    entityType: "guide",
    slug: input.slug,
    title: input.title,
    h1: input.h1,
    description,
    canonicalPath,
    indexable: input.indexable,
    breadcrumbs: breadcrumbs([{ name: "أدلة الشراء", path: "/guides" }, { name: input.h1, path: canonicalPath }]),
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: input.h1,
      description,
      articleBody: input.content,
      url: canonicalPath,
      ...(input.imagePath ? { image: [input.imagePath] } : {}),
       publisher: { "@type": "Organization", name: "CABL", url: "/" },
    },
  };
}

export type { BrandSeoInput, CategorySeoInput, GuideSeoInput, ProductSeoInput, SeoResponse };