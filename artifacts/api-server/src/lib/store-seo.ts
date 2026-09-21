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

const categoryCopy: Record<string, { noun: string; search: string; use: string; identity: string }> = {
  chargers: { noun: "شاحن", search: "شاحن", use: "شحن الهواتف والأجهزة المتوافقة للاستخدام اليومي", identity: "شاحن" },
  "charging-cables": { noun: "كابل شحن", search: "كابل", use: "الشحن أو نقل البيانات بين الأجهزة المتوافقة", identity: "كابل شحن" },
  "power-banks": { noun: "باور بانك", search: "باور بانك", use: "توفير طاقة إضافية للجوال أثناء التنقل أو السفر", identity: "باور بانك" },
  "phone-accessories": { noun: "محور أو ملحق للأجهزة", search: "محور USB-C", use: "توسيع المنافذ أو توصيل الملحقات المتوافقة", identity: "محور أو ملحق" },
  "travel-adapters": { noun: "شاحن سيارة أو ملحق سفر", search: "شاحن سيارة", use: "شحن الأجهزة أثناء التنقل", identity: "شاحن سيارة" },
  "wireless-earbuds": { noun: "سماعة أذن لاسلكية", search: "سماعات لاسلكية", use: "الاستماع والمكالمات أثناء الحركة", identity: "سماعة أذن لاسلكية" },
  "wireless-microphones": { noun: "ميكروفون لاسلكي", search: "ميكروفون Hollyland", use: "التسجيل أو صناعة المحتوى حسب التكوين المتاح", identity: "ميكروفون لاسلكي" },
};

function cleanProductText(value: string | null | undefined) {
  return String(value || "")
    .replaceAll("واط", "وات")
    .replace(/\s+/g, " ")
    .trim();
}

function withoutPowerMentions(value: string) {
  return cleanProductText(value)
    .replace(/(?:بقدرة|قدرة|حتى)\s*\d+(?:\.\d+)?\s*(?:W|وات)\b/gi, "")
    .replace(/\b\d+(?:\.\d+)?\s*(?:W|وات)\b/gi, "")
    .replace(/\s*\/\s*(?=[،,.؛]|$)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sourceFeatureText(input: ProductDescriptionInput, identity: string) {
  const productNames = new Set([
    cleanProductText(input.productName).toLocaleLowerCase("ar-YE"),
    cleanProductText(identity).toLocaleLowerCase("ar-YE"),
  ]);
  const identityPrefixes = [
    identity,
    withoutPowerMentions(input.productName),
    withoutPowerMentions(input.productName).split(/\s+/).slice(0, 3).join(" "),
  ]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  for (const source of [input.productDescription, input.shortDescription]) {
    let detail = withoutPowerMentions(cleanProductText(source)
      .replace(/منتج منشور من CABL مع توصيل داخل اليمن\.?/gi, "")
      .replace(/راجع بيانات الموديل والتوافر قبل الطلب\.?/gi, "")
      .replace(/راجع بيانات المنتج والتوافر قبل الطلب\.?/gi, "")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[.!؟]+$/, "")
      .trim());
    for (const prefix of identityPrefixes) {
      if (detail.toLocaleLowerCase("ar-YE").startsWith(prefix.toLocaleLowerCase("ar-YE"))) {
        detail = detail.slice(prefix.length).replace(/^[\s،:؛—-]*(?:هو|هي)?[\s،:؛—-]*/u, "").trim();
        break;
      }
    }
    if (detail && !productNames.has(detail.toLocaleLowerCase("ar-YE")) && detail.length > 8) return detail;
  }
  return "";
}

function sourceFeatureSentence(detail: string, input: ProductDescriptionInput) {
  let feature = detail;
  const specifications = input.specifications;
  feature = feature.replace(/^و+\s*/u, "");
  if (specifications?.ports.length) {
    feature = feature
      .replace(/\s*(?:و|،)?\s*(?:واحد|اثنان|اثنين|ثلاثة|أربعة|خمسة|ستة|سبعة|ثمانية|تسعة|عشرة|\d+)\s+منافذ?/g, "")
      .replace(/\s*(?:و|،)?\s*منفذ واحد/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  if (specifications?.cable && /^USB-C\s+إلى\s+USB-C/i.test(feature)) return "";
  if (specifications?.cable?.dataSpeedGbps && /^و?\s*نقل بيانات/u.test(feature)) return "";
  if (!feature || feature.length <= 8) return "";

  if (/كابل\s+USB-C.*قابل للسحب/i.test(feature) && input.categorySlug === "chargers") {
    return "ويتميز بكابل USB-C مدمج قابل للسحب، مما يقلل الحاجة إلى حمل كابل منفصل.";
  }
  if (/^(?:إلى|الى)\s/u.test(feature)) return "";
  if (/^و?\s*تقنية\s+/u.test(feature)) {
    return `ويأتي بتقنية ${feature.replace(/^و?\s*تقنية\s+/u, "").replace(/[.!؟]+$/, "")}.`;
  } else if (/^(?:منفذ|منفذين|ثلاثة منافذ|أربعة منافذ)(?:\s|$)/u.test(feature)) {
    return specifications?.ports.length
      ? ""
      : `ويضم ${feature.replace(/،\s*يدعم/u, "، ويدعم").replace(/[.!؟]+$/, "")}.`;
  } else if (/^نقل بيانات(?:\s|$)/u.test(feature)) {
    return `ويدعم ${feature.replace(/^نقل بيانات/u, "نقل البيانات").replace(/[.!؟]+$/, "")}.`;
  } else if (/^مع\s+/u.test(feature)) {
    return `ويأتي ${feature.replace(/[.!؟]+$/, "")}.`;
  }
  return `ويأتي ب${feature.replace(/[.!؟]+$/, "")}.`;
}

function arabicBrandName(brand: string, brandSlug: string) {
  return arabicBrandNames[brandSlug.toLowerCase()] || brand;
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return Number.isInteger(value) ? String(value) : String(value).replace(/\.0+$/, "");
}

function categoryIdentity(input: ProductDescriptionInput, category: { identity: string }) {
  const name = withoutPowerMentions(cleanProductText(input.productName));
  const markers: Record<string, string[]> = {
    chargers: ["شاحن", "طقم شحن"],
    "charging-cables": ["كابل", "كيبل"],
    "power-banks": ["باور", "خازن"],
    "phone-accessories": ["محور", "وصلة", "محول"],
    "travel-adapters": ["شاحن سيارة", "محول سفر"],
    "wireless-earbuds": ["سماعة"],
    "wireless-microphones": ["ميكروفون", "مايك"],
  };
  const categoryMarkers = markers[input.categorySlug || ""] || [];
  return categoryMarkers.some((marker) => name.toLocaleLowerCase("ar-YE").includes(marker))
    ? name
    : `${category.identity} ${name}`.trim();
}

function countLabel(count: number, singular: string, plural: string) {
  if (count === 1) return "منفذاً واحداً";
  if (count === 2) return "منفذين";
  if (count === 3) return "ثلاثة منافذ";
  if (count === 4) return "أربعة منافذ";
  if (count <= 10) return `${count} ${plural}`;
  return `${count} منفذاً`;
}

function productPurpose(categorySlug: string | null) {
  switch (categorySlug) {
    case "chargers":
      return "شحن الهواتف والأجهزة اللوحية المتوافقة للاستخدام اليومي";
    case "charging-cables":
      return "شحن الأجهزة المتوافقة ونقل البيانات بينها";
    case "power-banks":
      return "توفير طاقة إضافية للجوال أثناء التنقل أو السفر";
    case "phone-accessories":
      return "توسيع منافذ الجهاز وتوصيل الملحقات المتوافقة";
    case "travel-adapters":
      return "شحن الأجهزة أثناء التنقل بالسيارة";
    case "wireless-earbuds":
      return "الاستماع والمكالمات أثناء التنقل";
    case "wireless-microphones":
      return "التسجيل وصناعة المحتوى حسب التكوين المتاح";
    default:
      return "الاستخدام اليومي";
  }
}

function relatedSpecificationSentences(input: ProductDescriptionInput, categorySlug: string | null) {
  const specifications = input.specifications;
  if (!specifications) return [];
  const sentences: string[] = [];
  const protocols = specifications.protocols.slice(0, 3).map((protocol) => protocol.name).filter(Boolean);
  const protocolText = protocols.join(" و");
  if (specifications.ports.length && protocols.length && !(specifications.cable?.connectorA && specifications.cable?.connectorB)) {
    const count = countLabel(specifications.ports.length, "منفذ", "منافذ");
    const reason = (categorySlug === "chargers" || categorySlug === "travel-adapters") && specifications.ports.length > 1
      ? "ما يجعله مناسباً لشحن أكثر من جهاز باستخدام شاحن واحد"
      : "لتوفير شحن متوافق مع الأجهزة التي تدعم هذه المعايير";
    sentences.push(`يضم ${count} ويدعم ${protocolText}، ${reason}.`);
  } else if (specifications.ports.length) {
    sentences.push(`يضم ${countLabel(specifications.ports.length, "منفذاً", "منافذ")}.`);
  } else if (protocols.length && !(specifications.cable?.connectorA && specifications.cable?.connectorB)) {
    sentences.push(`يدعم ${protocols.join(" و")}.`);
  }

  const powerBank = specifications.powerBank;
  if (powerBank?.capacityMah) {
    const capacity = `تبلغ سعته ${formatNumber(powerBank.capacityMah)} مللي أمبير`;
    if (powerBank.wirelessCharging === true) {
      sentences.push(`${capacity} ويدعم الشحن اللاسلكي، ما يوفر طاقة إضافية بمرونة أكبر أثناء التنقل.`);
    } else if (powerBank.display === true) {
      sentences.push(`${capacity} ويضم شاشة لعرض حالة الشحن، لتسهيل متابعة الطاقة المتبقية.`);
    } else {
      sentences.push(`${capacity}، ما يوفر طاقة إضافية للجوال أثناء التنقل.`);
    }
  }

  const cable = specifications.cable;
  if (cable?.connectorA && cable.connectorB) {
    const connector = `يأتي بموصل ${cable.connectorA} إلى ${cable.connectorB}`;
    if (cable.dataSpeedGbps) {
      sentences.push(`${connector} ويدعم نقل البيانات بسرعة تصل إلى ${formatNumber(cable.dataSpeedGbps)} جيجابت/ثانية${protocols.length ? `، كما يدعم ${protocolText}` : ""}.`);
    } else if (cable.lengthM) {
      sentences.push(`${connector} بطول ${formatNumber(cable.lengthM)} متر${protocols.length ? `، كما يدعم ${protocolText}` : ""}.`);
    } else {
      sentences.push(`${connector}${protocols.length ? `، كما يدعم ${protocolText}` : ""}.`);
    }
  }
  return sentences;
}

function compatibilityText(input: ProductDescriptionInput) {
  const specifications = input.specifications;
  const names = specifications?.compatibility?.map((item) => item.name).filter(Boolean) || [];
  if (names.length) return `ويعمل مع الأجهزة التالية: ${names.slice(0, 3).join(" و")}.`;
  if (specifications?.cable?.connectorA && specifications.cable.connectorB) {
    return `ويعمل مع الأجهزة التي تستخدم موصلَي ${specifications.cable.connectorA} و${specifications.cable.connectorB}.`;
  }
  if (specifications?.carCharger) return "ويمكن استخدامه في السيارة عندما يتوافق منفذها مع مواصفات الشاحن.";
  return "";
}

function keywordPhrase(input: ProductDescriptionInput, brandArabic: string, category: { noun: string; search: string }) {
  const search = category.search.toLocaleLowerCase("ar-YE");
  const brandNames = [input.brand, brandArabic].map((value) => value.toLocaleLowerCase("ar-YE"));
  return brandNames.some((brandName) => search.includes(brandName))
    ? category.search
    : `${category.search} ${brandArabic}`.trim();
}

export function buildProductDescription(input: ProductDescriptionInput) {
  const brandArabic = arabicBrandName(input.brand, input.brandSlug);
  const category = categoryCopy[input.categorySlug || ""] || { noun: "منتج", search: "منتج", use: "الاستخدام اليومي", identity: "منتج" };
  const displayName = categoryIdentity(input, category);
  const detail = sourceFeatureText(input, displayName);
  const keyword = keywordPhrase(input, brandArabic, category);
  const purpose = productPurpose(input.categorySlug);
  const relatedSpecifications = relatedSpecificationSentences(input, input.categorySlug);
  const sourceFeature = detail ? sourceFeatureSentence(detail, input) : "";
  const compatibility = compatibilityText(input);
  const warrantyNote = cleanProductText(input.specifications?.warrantyNote);
  const warrantyMonths = input.specifications?.warrantyMonths;
  const warrantyNoteRepeatsDuration = Boolean(
    warrantyNote && warrantyMonths && new RegExp(`${formatNumber(warrantyMonths)}\\s*شهر`).test(warrantyNote),
  );
  const warranty = warrantyMonths
    ? `ويشمل هذا الموديل ضماناً لمدة ${formatNumber(warrantyMonths)} شهراً${warrantyNote && !warrantyNoteRepeatsDuration ? `، ${warrantyNote}` : ""}.`
    : warrantyNote
      ? `${warrantyNote}.`
      : "";

  return [
    `${displayName} هو ${category.noun} عملي من ${brandArabic} ${cleanProductText(input.brand)}، ويوفر ${purpose}.`,
    sourceFeature,
    ...relatedSpecifications,
    compatibility,
    `إذا كنت تبحث عن ${keyword} في اليمن، يتوفر هذا الموديل عبر متجر كابل.`,
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