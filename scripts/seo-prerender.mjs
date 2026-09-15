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
    h1: "شواحن وتوصيلات وخوازن طاقة في اليمن",
    description: "تسوّق شواحن الجوال وتوصيلات الشحن وخوازن الطاقة وإكسسوارات التقنية في اليمن، مع أسعار وتوافر وخيارات شحن واضحة من كتالوج CABL.",
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

function mountedPath(routePath) {
  const normalized = routePath.startsWith("/") ? routePath : `/${routePath}`;
  return normalized === basePath || normalized.startsWith(`${basePath}/`)
    ? normalized
    : `${basePath}${normalized === "/" ? "" : normalized}`;
}

function absoluteUrl(routePath) {
  return mountedPath(routePath) || "/";
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

function breadcrumbJsonLd(page, canonicalPath) {
  const items = page.breadcrumbs?.length
    ? page.breadcrumbs
    : [{ name: "الرئيسية", path: "/" }, { name: page.h1, path: canonicalPath }];
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

function pageJsonLd(page, canonicalPath, entity = null) {
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
    breadcrumbJsonLd(page, canonicalPath),
  ];
  if (entity?.products?.length) {
    graph.push({
      "@type": "ItemList",
      name: `منتجات ${page.h1}`,
      numberOfItems: entity.products.length,
      itemListElement: entity.products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: product.productName,
        url: absoluteUrl(entity.productPath(product)),
      })),
    });
  }
  if (entity?.type === "brand-category" && entity.brandName) {
    graph.push({ "@type": "Brand", name: entity.brandName, url: absoluteUrl(entity.brandPath) });
  }
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

function renderTextContent(value) {
  return String(value || "")
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph.trim())}</p>`)
    .join("");
}

function productPath(product) {
  return product.brandSlug && product.category?.slug
    ? `/${product.brandSlug}/${product.category.slug}/${product.slug}`
    : `/product/${product.slug}`;
}

function renderProductList(products) {
  if (!Array.isArray(products)) return "";
  if (!products?.length) return `<p class="empty-state">لا توجد منتجات منشورة في هذه المجموعة حالياً.</p>`;
  return `<section aria-labelledby="published-products"><h2 id="published-products">المنتجات المنشورة</h2><ul class="seo-product-list">${products.map((product) => {
    const path = productPath(product);
    const price = product.discountPrice ?? product.regularPrice;
    const description = product.shortDescription || product.productDescription || "بيانات المنتج المنشورة في كتالوج CABL.";
    return `<li><a href="${escapeHtml(absoluteUrl(path))}"><strong>${escapeHtml(product.productName)}</strong></a><span>${escapeHtml(product.brand)} · ${escapeHtml(product.category?.name || "منتج")}</span><p>${escapeHtml(description)}</p><span>${product.quantity > 0 ? "متوفر حسب الكتالوج الحالي" : "غير متوفر حالياً"} · ${escapeHtml(String(price))} USD</span></li>`;
  }).join("")}</ul></section>`;
}

const protectionDisplayLabels = {
  interference: "الحماية من التشويش الكهربائي",
  "ugreen-interference": "الحماية من التشويش الكهربائي",
  "over-current": "الحماية من زيادة التيار",
  overcurrent: "الحماية من زيادة التيار",
  "ugreen-over-current": "الحماية من زيادة التيار",
  "ugreen-overcurrent": "الحماية من زيادة التيار",
  "over-temperature": "الحماية من ارتفاع الحرارة",
  overtemperature: "الحماية من ارتفاع الحرارة",
  overheating: "الحماية من ارتفاع الحرارة",
  "overtemperature-protection": "الحماية من ارتفاع الحرارة",
  "ugreen-over-temperature": "الحماية من ارتفاع الحرارة",
  "ugreen-overtemperature": "الحماية من ارتفاع الحرارة",
  "ugreen-overheating": "الحماية من ارتفاع الحرارة",
  "ugreen-overtemperature-protection": "الحماية من ارتفاع الحرارة",
  "over-voltage": "الحماية من زيادة الجهد",
  overvoltage: "الحماية من زيادة الجهد",
  "ugreen-over-voltage": "الحماية من زيادة الجهد",
  "ugreen-overvoltage": "الحماية من زيادة الجهد",
  "under-voltage": "الحماية من انخفاض الجهد",
  undervoltage: "الحماية من انخفاض الجهد",
  "ugreen-under-voltage": "الحماية من انخفاض الجهد",
  "ugreen-undervoltage": "الحماية من انخفاض الجهد",
  "short-circuit": "الحماية من قصر الدائرة",
  "short-circuit-protection": "الحماية من قصر الدائرة",
  "ugreen-short-circuit": "الحماية من قصر الدائرة",
  "ugreen-short-circuit-protection": "الحماية من قصر الدائرة",
  overpower: "الحماية من زيادة القدرة",
  "ugreen-overpower": "الحماية من زيادة القدرة",
};

function protectionLabel(protection) {
  const slug = String(protection?.slug || "").toLowerCase();
  const name = String(protection?.name || "").toLowerCase();
  return protectionDisplayLabels[slug] || protectionDisplayLabels[name] || protection.name;
}

function renderProductSpecifications(product) {
  const specifications = product?.specifications;
  if (!specifications) return "";
  const rows = [
    ...(specifications.attributes || []).map((attribute) => {
      const value = attribute.value !== null && attribute.value !== undefined
        ? String(attribute.value)
        : attribute.values?.join("، ");
      return value ? `<li><strong>${escapeHtml(attribute.label)}:</strong> ${escapeHtml(value)}${attribute.unit ? ` ${escapeHtml(attribute.unit)}` : ""}</li>` : "";
    }),
    ...(specifications.ports || []).map((port) => `<li><strong>المنفذ ${escapeHtml(port.name)}:</strong> ${escapeHtml(port.type)}${port.maxPowerW ? ` · ${escapeHtml(String(port.maxPowerW))}W` : ""}${port.maxVoltageV ? ` · ${escapeHtml(String(port.maxVoltageV))}V` : ""}${port.maxCurrentA ? ` · ${escapeHtml(String(port.maxCurrentA))}A` : ""}</li>`),
    ...(specifications.protocols || []).map((protocol) => `<li><strong>البروتوكول:</strong> ${escapeHtml(protocol.name)}</li>`),
    ...(specifications.maxPowerW ? [`<li><strong>القدرة القصوى:</strong> ${escapeHtml(String(specifications.maxPowerW))}W</li>`] : []),
    ...(specifications.capabilityLabel ? [`<li><strong>القدرة:</strong> ${escapeHtml(specifications.capabilityLabel)}</li>`] : []),
    ...(specifications.compatibility || []).map((item) => `<li><strong>التوافق:</strong> ${escapeHtml(item.name || item.label || String(item))}</li>`),
    ...(specifications.protections?.length ? [`<li><strong>أنظمة الحماية:</strong> ${specifications.protections.map(protectionLabel).map(escapeHtml).join("، ")}</li>`] : []),
  ].filter(Boolean);
  return rows.length ? `<section><h2>المواصفات المنشورة</h2><ul class="seo-product-specifications">${rows.join("")}</ul></section>` : "";
}

function renderProductShipping(product) {
  const options = product?.shippingOptions || [];
  if (!options.length) return "";
  return `<section><h2>خيارات الشحن المنشورة</h2><ul>${options.map((option) => {
    const charge = option.free ? "مجاني" : `${option.charge} USD`;
    const days = option.estimatedDays ? ` · المدة التقديرية: ${option.estimatedDays} أيام` : "";
    return `<li>${escapeHtml(option.name)} · ${escapeHtml(charge)}${escapeHtml(days)}</li>`;
  }).join("")}</ul></section>`;
}

function renderRelatedProducts(products) {
  if (!products?.length) return "";
  return `<section><h2>منتجات ذات صلة</h2><ul class="seo-product-list">${products.map((product) => {
    const path = productPath(product);
    const price = product.discountPrice ?? product.regularPrice;
    return `<li><a href="${escapeHtml(absoluteUrl(path))}"><strong>${escapeHtml(product.productName)}</strong></a><span>${escapeHtml(product.brand)} · ${escapeHtml(product.category?.name || "منتج")}</span><span>${product.quantity > 0 ? "متوفر حسب الكتالوج الحالي" : "غير متوفر حالياً"} · ${escapeHtml(String(price))} USD</span></li>`;
  }).join("")}</ul></section>`;
}

function renderBody(page, routePath, entity = null) {
  const links = [
    `<a href="${escapeHtml(absoluteUrl("/guides"))}">أدلة الشراء</a>`,
    `<a href="${escapeHtml(absoluteUrl("/search"))}">الكتالوج</a>`,
    `<a href="${escapeHtml(absoluteUrl("/shipping"))}">الشحن والتوصيل</a>`,
  ].join(" · ");
  const entityProducts = entity?.products || (entity?.product ? [entity.product] : null);
  const relatedBrands = (entity?.brands || []).slice(0, 8).map((brand) =>
    `<li><a href="${escapeHtml(absoluteUrl(`/brand/${brand.slug}`))}">${escapeHtml(brand.name)}</a></li>`,
  ).join("");
  const product = entity?.product;
  const productDetails = product
    ? `<section class="seo-product-summary"><h2>بيانات المنتج</h2>${product.images?.[0] ? `<img src="${escapeHtml(product.images[0])}" alt="${escapeHtml(product.productName)}" width="640" height="640" />` : ""}<p><strong>العلامة:</strong> ${product.brandSlug ? `<a href="${escapeHtml(absoluteUrl(`/brand/${product.brandSlug}`))}">${escapeHtml(product.brand)}</a>` : escapeHtml(product.brand)} · <strong>الفئة:</strong> ${product.category?.slug ? `<a href="${escapeHtml(absoluteUrl(`/category/${product.category.slug}`))}">${escapeHtml(product.category.name)}</a>` : "المنتجات"}</p><p><strong>SKU:</strong> <span dir="ltr">${escapeHtml(product.sku)}</span> · <strong>السعر:</strong> ${escapeHtml(String(product.discountPrice ?? product.regularPrice))} USD · <strong>الحالة:</strong> ${product.quantity > 0 ? "متوفر حسب الكتالوج الحالي" : "غير متوفر حالياً"}</p>${product.shortDescription || product.productDescription ? `<p>${escapeHtml(product.shortDescription || product.productDescription)}</p>` : ""}</section>${renderProductSpecifications(product)}${renderProductShipping(product)}`
    : "";
  const guideContent = entity?.type === "guide" && entity.content
    ? `<section><h2>محتوى الدليل</h2>${renderTextContent(entity.content)}</section>`
    : "";
  const categoryLinks = relatedBrands ? `<section><h2>العلامات المتاحة</h2><ul>${relatedBrands}</ul></section>` : "";
  const buyingLinks = `<section><h2>روابط مفيدة قبل الطلب</h2><p><a href="${escapeHtml(absoluteUrl("/about"))}">عن CABL</a> · <a href="${escapeHtml(absoluteUrl("/shipping"))}">الشحن والتوصيل</a> · <a href="${escapeHtml(absoluteUrl("/return-policy"))}">الإرجاع والاستبدال</a></p></section>`;
  return `<header><a href="${escapeHtml(absoluteUrl("/"))}">CABL اليمن</a><nav>${links}</nav></header><main><p>دليل CABL في اليمن</p><h1>${escapeHtml(page.h1)}</h1><p>${escapeHtml(page.description)}</p>${productDetails}${guideContent}${categoryLinks}${renderProductList(entityProducts)}${renderRelatedProducts(entity?.relatedProducts)}<section><h2>معلومات قبل الطلب</h2><p>راجع المواصفات والتوافق والسعر والتوافر في صفحة المنتج، ثم أدخل العنوان في checkout لرؤية خيارات الشحن الحالية.</p></section>${buyingLinks}</main><footer><a href="${escapeHtml(absoluteUrl("/about"))}">عن CABL</a> · <a href="${escapeHtml(absoluteUrl("/contact"))}">تواصل معنا</a></footer>`;
}

function withSeo(indexHtml, page, routePath, entity = null) {
  const canonicalPath = page.canonicalPath || routePath;
  const canonical = absoluteUrl(canonicalPath);
  const schema = pageJsonLd(page, canonicalPath, entity);
  let html = indexHtml
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${escapeHtml(page.description)}" />`)
    .replace(/<meta name="robots" content="[^"]*"\s*\/?>/, `<meta name="robots" content="${page.indexable === false ? "noindex, follow" : "index, follow"}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/g, "")
    .replace(/<meta property="og:[^"]*"[^>]*\/?>/g, "")
    .replace(/<meta name="twitter:[^"]*"[^>]*\/?>/g, "")
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "")
    .replace("</head>", `<meta property="og:title" content="${escapeHtml(page.title)}" /><meta property="og:description" content="${escapeHtml(page.description)}" /><meta property="og:url" content="${escapeHtml(canonical)}" /><meta property="og:locale" content="ar_YE" /><meta property="og:site_name" content="CABL" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${escapeHtml(page.title)}" /><meta name="twitter:description" content="${escapeHtml(page.description)}" /><link rel="canonical" href="${escapeHtml(canonical)}" /><script type="application/ld+json">${JSON.stringify(schema)}</script></head>`)
    .replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${renderBody(page, routePath, entity)}</div>`);
  return html;
}

async function main() {
  const indexHtml = await fs.readFile(path.join(distDir, "index.html"), "utf8");
  const routes = new Map(Object.entries(staticPages).map(([routePath, page]) => [routePath, {
    ...page,
    canonicalPath: mountedPath(routePath),
  }]));

  const catalog = await getJson("/store/catalog");
  for (const routePath of Object.keys(guidePages)) {
    const slug = routePath.split("/").filter(Boolean).at(-1);
    const seo = await getJson(`/store/seo?type=guide&slug=${encodeURIComponent(slug)}`);
    const fallback = guidePages[routePath];
    routes.set(routePath, {
      ...fallback,
      ...(seo || {}),
      title: seo?.title || fallback.title,
      h1: seo?.h1 || fallback.h1,
      description: seo?.description || fallback.description,
      canonicalPath: mountedPath(routePath),
      entityType: "guide",
      entity: { type: "guide", content: seo?.jsonLd?.articleBody || "" },
    });
  }

  const products = catalog?.products || [];
  const categories = new Map(products.filter((product) => product.category).map((product) => [product.category.slug, product.category]));
  for (const category of categories.values()) {
    const seo = await getJson(`/store/seo?type=category&slug=${encodeURIComponent(category.slug)}`);
    const routePath = `/category/${category.slug}`;
    const categoryProducts = products.filter((product) => product.category?.slug === category.slug);
    const brands = Array.from(new Map(categoryProducts.map((product) => [product.brandSlug, { slug: product.brandSlug, name: product.brand }])).values());
    routes.set(routePath, {
      ...(seo || {}),
      title: seo?.title || `${category.name} في اليمن | CABL`,
      h1: seo?.h1 || category.name,
      description: seo?.description || `منتجات ${category.name} المنشورة في كتالوج CABL داخل اليمن.`,
      canonicalPath: mountedPath(routePath),
      entityType: "category",
      entity: { type: "category", products: categoryProducts, brands, productPath, brandPath: (slug) => `/brand/${slug}` },
    });
  }
  for (const brand of new Map(products.map((product) => [product.brandSlug, product.brand])).entries()) {
    const [brandSlug, brandName] = brand;
    const seo = await getJson(`/store/seo?type=brand&slug=${encodeURIComponent(brandSlug)}`);
    const brandProducts = products.filter((product) => product.brandSlug === brandSlug);
    const brands = [];
    const entityCategories = Array.from(new Map(brandProducts.filter((product) => product.category).map((product) => [product.category.slug, product.category])).values());
    routes.set(`/brand/${brandSlug}`, {
      ...(seo || {}),
      title: seo?.title || `منتجات ${brandName} في اليمن | CABL`,
      h1: seo?.h1 || `منتجات ${brandName}`,
      description: seo?.description || `تصفح منتجات ${brandName} المنشورة في كتالوج CABL داخل اليمن.`,
      canonicalPath: mountedPath(`/brand/${brandSlug}`),
      entityType: "brand",
      entity: { type: "brand", products: brandProducts, categories: entityCategories, brands, productPath, brandPath: (slug) => `/brand/${slug}` },
    });
  }
  const brandCategories = new Map();
  for (const product of products) {
    if (!product.brandSlug || !product.category?.slug) continue;
    const key = `${product.brandSlug}/${product.category.slug}`;
    brandCategories.set(key, product);
  }
  for (const product of brandCategories.values()) {
    const routePath = `/${product.brandSlug}/${product.category.slug}`;
    const categoryName = product.category.name;
    const brandName = product.brand;
    const matchingProducts = products.filter((item) => item.brandSlug === product.brandSlug && item.category?.slug === product.category.slug);
    routes.set(routePath, {
      title: `${categoryName} من ${brandName} في اليمن | CABL`,
      h1: `${categoryName} من ${brandName}`,
      description: `تصفح منتجات ${categoryName} من ${brandName} المنشورة في كتالوج CABL داخل اليمن، وقارن السعر والتوافر قبل الطلب.`,
      canonicalPath: mountedPath(routePath),
      entityType: "brand-category",
      entity: {
        type: "brand-category",
        products: matchingProducts,
        brandName,
        brandPath: `/brand/${product.brandSlug}`,
        productPath,
      },
    });
  }
  for (const product of products) {
    const seo = await getJson(`/store/seo?type=product&slug=${encodeURIComponent(product.slug)}`);
    const routePath = productPath(product);
    const relatedProducts = products
      .filter((item) => item.slug !== product.slug && item.category?.slug === product.category?.slug)
      .sort((a, b) => Number(b.brandSlug === product.brandSlug) - Number(a.brandSlug === product.brandSlug))
      .slice(0, 6);
    routes.set(routePath, {
      ...(seo || {}),
      title: seo?.title || `${product.productName} | CABL`,
      h1: seo?.h1 || product.productName,
      description: seo?.description || `${product.productName} من كتالوج CABL داخل اليمن.`,
      canonicalPath: mountedPath(routePath),
      entityType: "product",
      product,
      entity: { type: "product", product, relatedProducts, productPath, brandPath: (slug) => `/brand/${slug}` },
    });
  }

  for (const [routePath, page] of routes) {
    const outputPath = routePath === "/"
      ? path.join(distDir, "index.html")
      : path.join(distDir, routePath.replace(/^\/+/, ""), "index.html");
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, withSeo(indexHtml, page, routePath, page.entity || (page.product ? { type: "product", product: page.product, productPath } : null)));
  }
  console.log(`SEO pre-rendered ${routes.size} public routes`);
}

main().catch((error) => {
  console.error("SEO pre-render failed:", error);
  process.exitCode = 1;
});