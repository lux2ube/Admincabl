import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const distDir = path.resolve(root, "dist/public");
const apiBase = (process.env.SEO_PRERENDER_API_URL || "http://127.0.0.1:8080/api").replace(/\/$/, "");
const basePath = (process.env.BASE_PATH || "/cabl-store/").replace(/\/+$/, "");

const guidePages = {
  "/guides/chargers-yemen": {
    title: "شواحن الجوال والشحن السريع في اليمن | CABL",
    h1: "شواحن جوال وشحن سريع في اليمن",
    description: "قارن شواحن الجوال وUSB-C وPD المتاحة في كتالوج CABL داخل اليمن، مع مواصفات المنتج والسعر والتوافر قبل الطلب.",
    terms: "شاحن سريع، شاحن USB-C، شاحن PD، شاحن آيفون، شاحن سامسونج",
  },
  "/guides/charging-cables-yemen": {
    title: "كابلات وتوصيلات الشحن في اليمن | USB-C وLightning | CABL",
    h1: "كابلات وتوصيلات شحن في اليمن",
    description: "استكشف توصيلات الشحن المنشورة في CABL حسب USB-C وLightning والطول ونقل البيانات والقدرة، مع السعر والتوافر الحالي.",
    terms: "كيبل شحن، كابل USB-C، كيبل آيفون، كابل Lightning، وصلة شحن سريعة",
  },
  "/guides/power-banks-yemen": {
    title: "خوازن الطاقة والباور بانك في اليمن | CABL",
    h1: "خوازن طاقة وباور بانك في اليمن",
    description: "قارن خوازن الطاقة والباور بانك المتاحة في اليمن حسب السعة والقدرة والمنافذ والشحن أثناء الاستخدام من كتالوج CABL.",
    terms: "خازن طاقة، باور بانك أصلي، باور بانك سريع، باور بانك USB-C",
  },
  "/guides/hubs-adapters-yemen": {
    title: "وصلات USB-C والمحاور والملحقات في اليمن | CABL",
    h1: "وصلات USB-C ومحاور وملحقات الأجهزة في اليمن",
    description: "تصفح محاور USB-C والوصلات والملحقات المنشورة في CABL، وقارن المنافذ والقدرة والتوافق والسعر قبل الطلب داخل اليمن.",
    terms: "محور USB-C، وصلة USB-C، USB-C hub، وصلة لابتوب، محول جوال",
  },
  "/guides/travel-car-charging-yemen": {
    title: "شواحن السيارة وملحقات السفر في اليمن | CABL",
    h1: "شواحن سيارة وملحقات سفر في اليمن",
    description: "قارن شواحن السيارة وملحقات السفر المنشورة في كتالوج CABL حسب القدرة والمنافذ وتوافق السيارة والتوافر داخل اليمن.",
    terms: "شاحن سيارة، شاحن جوال للسيارة، شاحن سريع للسيارة، محول سفر",
  },
  "/guides/wireless-earbuds-yemen": {
    title: "سماعات الأذن اللاسلكية في اليمن | Soundcore | CABL",
    h1: "سماعات أذن لاسلكية في اليمن",
    description: "قارن سماعات الأذن اللاسلكية المنشورة من Soundcore في اليمن حسب الموديل والاستخدام والمكالمات والخصائص المعلنة.",
    terms: "سماعات بلوتوث، سماعات Soundcore، سماعة أذن للمكالمات، R50i",
  },
  "/guides/wireless-microphones-yemen": {
    title: "الميكروفونات اللاسلكية لصناع المحتوى في اليمن | CABL",
    h1: "ميكروفونات لاسلكية لصناع المحتوى في اليمن",
    description: "استكشف ميكروفونات Hollyland اللاسلكية المنشورة في اليمن، وقارن التكوين والمستقبلات والتوافق قبل الطلب من CABL.",
    terms: "مايك لاسلكي، ميكروفون Hollyland، مايك لصانع محتوى، مايك للجوال",
  },
};

const staticPages = {
  "/": {
    title: "CABL | منتجات الشحن والطاقة والإكسسوارات",
    h1: "شحن أوضح. يوم أسهل.",
    description: "تسوق منتجات الشحن والطاقة والإكسسوارات من كتالوج CABL، مع أسعار ومخزون وخيارات شحن مأخوذة من المتجر.",
  },
  "/guides": {
    title: "أدلة شراء الشحن والطاقة والإكسسوارات في اليمن | CABL",
    h1: "أدلة شراء مبنية على الكتالوج",
    description: "أدلة CABL العملية لاختيار الشواحن والتوصيلات وخوازن الطاقة والملحقات والصوتيات من المنتجات المنشورة في اليمن.",
  },
  "/about": { title: "من نحن | CABL", h1: "من نحن", description: "تعرف على CABL وطريقة اختيار المنتجات وخدمة العملاء في اليمن." },
  "/shipping": { title: "الشحن والتوصيل داخل اليمن | CABL", h1: "الشحن والتوصيل داخل اليمن", description: "معلومات الشحن والتوصيل داخل اليمن من CABL، مع مراجعة الرسوم والمدة في checkout." },
  "/return-policy": { title: "سياسة الإرجاع والاستبدال | CABL", h1: "سياسة الإرجاع والاستبدال", description: "راجع شروط الإرجاع والاستبدال في CABL قبل تأكيد طلبك." },
  "/faq": { title: "الأسئلة الشائعة عن CABL والمنتجات | CABL", h1: "الأسئلة الشائعة", description: "إجابات عملية عن المنتجات والأسعار والتوافر والشحن والطلبات في CABL اليمن." },
  "/contact": { title: "تواصل مع CABL في اليمن | CABL", h1: "تواصل معنا", description: "تواصل مع CABL للاستفسار عن المنتجات والطلب والشحن داخل اليمن." },
  "/locations/yemen": { title: "التوصيل داخل اليمن | CABL", h1: "راجع خيارات الشحن حسب محافظتك", description: "راجع خيارات الشحن الحالية قبل تأكيد طلبك إلى المحافظة التي تختارها." },
  "/solutions/slow-car-charging": { title: "حل مشكلة الشحن البطيء في السيارة | CABL", h1: "حل مشكلة الشحن البطيء في السيارة", description: "افهم علاقة الشاحن والكابل والحرارة بسرعة الشحن أثناء التنقل في اليمن." },
  "/lab": { title: "مركز مواصفات المنتجات | CABL", h1: "مركز المواصفات قبل أن تختار", description: "فهرس CABL العملي لبيانات المنتجات المنشورة والحسابات التوضيحية والتوافق قبل الشراء." },
  "/verify": { title: "التحقق من بيانات المنتج | CABL", h1: "تحقق من بيانات المنتج", description: "راجع رقم الموديل والبيانات المنشورة قبل الشراء من CABL." },
};

const categoryAliases = {
  "charging-cables": "cables",
  "phone-accessories": "hubs-adapters",
  "travel-adapters": "car-accessories",
};

function publicCategoryPath(slug) {
  return `/${categoryAliases[slug] || slug}`;
}

function absoluteUrl(routePath) {
  return `${basePath}${routePath === "/" ? "" : routePath}` || "/";
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function absoluteJsonLd(value) {
  if (typeof value === "string") return value.startsWith("/") ? absoluteUrl(value) : value;
  if (Array.isArray(value)) return value.map(absoluteJsonLd);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, absoluteJsonLd(item)]));
  return value;
}

async function getJson(endpoint) {
  try {
    const response = await fetch(`${apiBase}${endpoint}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function pageJsonLd(page, canonicalPath, extra = []) {
  const graph = [
    {
      "@type": "WebPage",
      "@id": absoluteUrl(canonicalPath),
      name: page.title,
      description: page.description,
      url: absoluteUrl(canonicalPath),
      inLanguage: "ar-YE",
    },
    ...(page.jsonLd ? [absoluteJsonLd(page.jsonLd)] : []),
    ...extra,
  ];
  return { "@context": "https://schema.org", "@graph": graph };
}

function faqJsonLd(page) {
  return {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `كيف أختار ${page.h1}؟`,
        acceptedAnswer: { "@type": "Answer", text: "ابدأ من الاستخدام والمنفذ والقدرة، ثم راجع صفحة الموديل المحدد والبيانات المنشورة قبل الطلب." },
      },
      {
        "@type": "Question",
        name: "هل السعر والتوافر ثابتان؟",
        acceptedAnswer: { "@type": "Answer", text: "السعر والتوافر مأخوذان من الكتالوج الحالي ويعاد التحقق منهما عند الإضافة والطلب." },
      },
    ],
  };
}

function renderBody(page, routePath, entity = null) {
  const links = [
    `<a href="${escapeHtml(absoluteUrl("/guides"))}">أدلة الشراء</a>`,
    `<a href="${escapeHtml(absoluteUrl("/search"))}">الكتالوج</a>`,
    `<a href="${escapeHtml(absoluteUrl("/shipping"))}">الشحن والتوصيل</a>`,
  ].join(" · ");
  const details = entity?.product
    ? `<p><strong>العلامة:</strong> ${escapeHtml(entity.product.brand)} · <strong>SKU:</strong> ${escapeHtml(entity.product.sku)} · <strong>الحالة:</strong> ${entity.product.quantity > 0 ? "متوفر حسب الكتالوج الحالي" : "غير متوفر حالياً"}</p>`
    : "";
  const terms = page.terms ? `<p><strong>موضوعات مرتبطة:</strong> ${escapeHtml(page.terms)}</p>` : "";
  return `<header><a href="${escapeHtml(absoluteUrl("/"))}">CABL اليمن</a><nav>${links}</nav></header><main><p>دليل CABL في اليمن</p><h1>${escapeHtml(page.h1)}</h1><p>${escapeHtml(page.description)}</p>${details}${terms}<h2>معلومات قبل الطلب</h2><p>راجع المواصفات والتوافق والسعر والتوافر في صفحة المنتج، ثم أدخل العنوان في checkout لرؤية خيارات الشحن الحالية.</p><h2>أسئلة شائعة</h2><details><summary>كيف أختار المنتج المناسب؟</summary><p>ابدأ من الاستخدام والمنفذ والقدرة، ثم راجع بيانات الموديل المحدد.</p></details><details><summary>هل التوافر مضمون؟</summary><p>التوافر مرتبط بالكمية المنشورة وقت التصفح ويعاد التحقق عند الطلب.</p></details></main><footer><a href="${escapeHtml(absoluteUrl("/about"))}">عن CABL</a> · <a href="${escapeHtml(absoluteUrl("/contact"))}">تواصل معنا</a></footer>`;
}

function withSeo(indexHtml, page, routePath, entity = null) {
  const canonicalPath = page.canonicalPath || routePath;
  const canonical = absoluteUrl(canonicalPath);
  const schema = page.entityType === "guide" || page.terms
    ? pageJsonLd(page, canonicalPath, [faqJsonLd(page)])
    : pageJsonLd(page, canonicalPath);
  let html = indexHtml
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${escapeHtml(page.description)}" />`)
    .replace(/<meta name="robots" content="[^"]*"\s*\/?>/, `<meta name="robots" content="${page.indexable === false ? "noindex, follow" : "index, follow"}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/g, "")
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "")
    .replace("</head>", `<meta property="og:title" content="${escapeHtml(page.title)}" /><meta property="og:description" content="${escapeHtml(page.description)}" /><meta property="og:url" content="${escapeHtml(canonical)}" /><meta property="og:locale" content="ar_YE" /><meta property="og:site_name" content="CABL" /><link rel="canonical" href="${escapeHtml(canonical)}" /><script type="application/ld+json">${JSON.stringify(schema)}</script></head>`)
    .replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${renderBody(page, routePath, entity)}</div>`);
  return html;
}

async function main() {
  const indexHtml = await fs.readFile(path.join(distDir, "index.html"), "utf8");
  const routes = new Map(Object.entries(staticPages).map(([routePath, page]) => [routePath, { ...page, canonicalPath: routePath }]));
  for (const [routePath, page] of Object.entries(guidePages)) routes.set(routePath, { ...page, canonicalPath: routePath, entityType: "guide" });

  const catalog = await getJson("/store/catalog");
  for (const category of new Map((catalog?.products || []).filter((product) => product.category).map((product) => [product.category.slug, product.category])) .values()) {
    const seo = await getJson(`/store/seo?type=category&slug=${encodeURIComponent(category.slug)}`);
    const routePath = publicCategoryPath(category.slug);
    routes.set(routePath, { ...(seo || {}), title: seo?.title || `${category.name} في اليمن | CABL`, h1: seo?.h1 || category.name, description: seo?.description || `منتجات ${category.name} المنشورة في كتالوج CABL داخل اليمن.`, canonicalPath: routePath });
    routes.set(`/category/${category.slug}`, { ...(seo || {}), title: seo?.title || `${category.name} في اليمن | CABL`, h1: seo?.h1 || category.name, description: seo?.description || `منتجات ${category.name} المنشورة في كتالوج CABL داخل اليمن.`, canonicalPath: routePath });
  }
  for (const brand of new Map((catalog?.products || []).map((product) => [product.brandSlug, product.brand])).entries()) {
    const [brandSlug, brandName] = brand;
    const seo = await getJson(`/store/seo?type=brand&slug=${encodeURIComponent(brandSlug)}`);
    routes.set(`/brand/${brandSlug}`, { ...(seo || {}), title: seo?.title || `منتجات ${brandName} في اليمن | CABL`, h1: seo?.h1 || `منتجات ${brandName}`, description: seo?.description || `تصفح منتجات ${brandName} المنشورة في كتالوج CABL داخل اليمن.`, canonicalPath: `/brand/${brandSlug}` });
  }
  const brandCategories = new Map();
  for (const product of catalog?.products || []) {
    if (!product.brandSlug || !product.category?.slug) continue;
    const key = `${product.brandSlug}/${product.category.slug}`;
    brandCategories.set(key, product);
  }
  for (const product of brandCategories.values()) {
    const routePath = `/${product.brandSlug}${publicCategoryPath(product.category.slug)}`;
    const categoryName = product.category.name;
    const brandName = product.brand;
    routes.set(routePath, {
      title: `${categoryName} من ${brandName} في اليمن | CABL`,
      h1: `${categoryName} من ${brandName}`,
      description: `تصفح منتجات ${categoryName} من ${brandName} المنشورة في كتالوج CABL داخل اليمن، وقارن السعر والتوافر قبل الطلب.`,
      canonicalPath: routePath,
    });
  }
  for (const product of catalog?.products || []) {
    const seo = await getJson(`/store/seo?type=product&slug=${encodeURIComponent(product.slug)}`);
    const routePath = `/${product.brandSlug}${publicCategoryPath(product.category?.slug)}/${product.slug}`;
    routes.set(routePath, { ...(seo || {}), title: seo?.title || `${product.productName} | CABL`, h1: seo?.h1 || product.productName, description: seo?.description || `${product.productName} من كتالوج CABL داخل اليمن.`, canonicalPath: routePath, entityType: "product", product });
  }

  for (const [routePath, page] of routes) {
    const outputPath = routePath === "/"
      ? path.join(distDir, "index.html")
      : path.join(distDir, routePath.replace(/^\/+/, ""), "index.html");
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, withSeo(indexHtml, page, routePath, page.product ? page : null));
  }
  console.log(`SEO pre-rendered ${routes.size} public routes`);
}

main().catch((error) => {
  console.error("SEO pre-render failed:", error);
  process.exitCode = 1;
});