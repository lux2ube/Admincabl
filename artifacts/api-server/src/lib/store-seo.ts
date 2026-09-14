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
};

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

const categoryPublicPaths: Record<string, string> = {
  chargers: "chargers",
  "charging-cables": "cables",
  cables: "cables",
  "power-banks": "power-banks",
  "wireless-chargers": "wireless-chargers",
  "car-chargers": "car-accessories",
  "car-accessories": "car-accessories",
  "phone-accessories": "hubs-adapters",
  "hubs-adapters": "hubs-adapters",
};

export function publicCategoryPath(slug: string | null) {
  return slug ? `/${categoryPublicPaths[slug] ?? slug}` : "/categories/";
}

export function brandPublicPath(slug: string) {
  return `/${slug}`;
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
    ? `${brandPublicPath(brandSlug)}${publicCategoryPath(categorySlug)}/${productSlug}`
    : `/product/${productSlug}`;
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

function productDescription(input: ProductSeoInput, displayName: string) {
  const detail = input.shortDescription || input.productDescription;
  const base = detail ? `${displayName}: ${detail}` : `${displayName} من كتالوج CABL.`;
  return `${base} راجع المواصفات والسعر والتوافر قبل الطلب داخل اليمن.`;
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
  const displayName = productDisplayName(input.brand, input.productName);
  const description = productDescription(input, displayName);
  const canonicalPath = productPublicPath({
    brandSlug: input.brandSlug,
    categorySlug: input.categorySlug,
    productSlug: input.slug,
  });
  const categoryPath = publicCategoryPath(input.categorySlug);
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
      { name: categoryName, path: categoryPath },
      { name: input.productName, path: canonicalPath },
    ]),
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Product",
      name: input.productName,
      description,
      sku: input.sku,
      url: canonicalPath,
      ...(input.image ? { image: [input.image] } : {}),
       brand: { "@type": "Brand", name: input.brand, url: `/${input.brandSlug}` },
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
  const canonicalPath = input.canonicalPath || `/guide/${input.slug}`;
  const description = input.metaDescription || input.description || input.title;

  return {
    entityType: "guide",
    slug: input.slug,
    title: input.title,
    h1: input.h1,
    description,
    canonicalPath,
    indexable: input.indexable,
    breadcrumbs: breadcrumbs([{ name: "أدلة الشراء", path: "/guides/" }, { name: input.h1, path: canonicalPath }]),
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