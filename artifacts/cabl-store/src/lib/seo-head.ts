export type SeoHead = {
  title: string;
  description: string;
  canonicalPath?: string;
  indexable?: boolean;
  jsonLd?: Record<string, unknown>;
  image?: string;
};

const arabicBrandNames: Record<string, string> = {
  anker: "أنكر",
  baseus: "بيسوس",
  ugreen: "يوجرين",
  vention: "فينتشن",
  soundcore: "ساوندكور",
  hollyland: "هوليلاند",
};

export function arabicBrandDisplayName(value: string) {
  let localized = value;
  for (const [brand, arabicName] of Object.entries(arabicBrandNames)) {
    localized = localized.replace(new RegExp(`\\b${brand}\\b`, "gi"), arabicName);
  }
  return localized;
}

export function arabicSeoTitle(value: string) {
  let localized = value
    .replace(/\bCABL(?:\s*STORE)?\b/gi, "كابل ستور")
    .replace(/\bwireless\s+earbuds?\b/gi, "سماعات أذن لاسلكية")
    .replace(/\bwireless\s+microphones?\b/gi, "ميكروفونات لاسلكية")
    .replace(/\bwireless\b/gi, "لاسلكي")
    .replace(/\bpower\s*bank\b/gi, "باور بانك")
    .replace(/\bfast\s+charge\b/gi, "الشحن السريع")
    .replace(/\bproducts?\b/gi, "منتجات")
    .replace(/\bchargers?\b/gi, "شواحن")
    .replace(/\bcables?\b/gi, "كابلات")
    .replace(/\baccessories\b/gi, "إكسسوارات")
    .replace(/\bin Yemen\b/gi, "في اليمن")
    .replace(/\bNexode\b/gi, "نيكسود")
    .replace(/\bLARK\b/gi, "لارك")
    .replace(/\bCombo\b/gi, "كومبو")
    .replace(/\bAir\b/gi, "إير")
    .replace(/\bUno\b/gi, "أونو")
    .replace(/\bHDMI\b/gi, "إتش دي إم آي")
    .replace(/\bLED\b/gi, "ليد")
    .replace(/\bUSB-C\b/gi, "يو إس بي-سي")
    .replace(/\bUSB-A\b/gi, "يو إس بي-إيه")
    .replace(/\bUSB\b/gi, "يو إس بي")
    .replace(/\bLightning\b/gi, "لايتنينغ")
    .replace(/\bPD\b/gi, "توصيل الطاقة")
    .replace(/(\d+)\s*-\s*in\s*-\s*(\d+)/gi, "$1 في $2")
    .replace(/(\d[\d,.]*)\s*W\b/gi, "$1 وات")
    .replace(/(\d[\d,.]*)\s*mAh\b/gi, "$1 مللي أمبير");
  localized = arabicBrandDisplayName(localized);
  const parts = localized
    .split(/\s*\|\s*/)
    .map((part) => part.trim())
    .filter((part) => part && !/^(?:CABL|CABL\s*STORE|كابل ستور|متجر كابل ستور)$/iu.test(part));
  return `${parts.join(" | ") || "متجر إلكترونيات في اليمن"} | كابل ستور`;
}

function basePath() {
  return import.meta.env.BASE_URL.replace(/\/$/, '');
}

export function canonicalUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const mount = basePath();
  const mountedPath = normalizedPath === mount || normalizedPath.startsWith(`${mount}/`)
    ? normalizedPath
    : `${mount}${normalizedPath === '/' ? '' : normalizedPath}`;
  return `${window.location.origin}${mountedPath || '/'}`;
}

export function absoluteJsonLd(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.startsWith('/') ? canonicalUrl(value) : value;
  }
  if (Array.isArray(value)) return value.map(absoluteJsonLd);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, absoluteJsonLd(item)]));
  }
  return value;
}

function currentRoutePath() {
  const path = window.location.pathname;
  const prefix = basePath();
  return prefix && path.startsWith(prefix) ? path.slice(prefix.length) || '/' : path;
}

function setMeta(attribute: 'name' | 'property', key: string, value: string) {
  let element = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = value;
}

function setLink(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement('link');
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
}

export function setSeoHead({ title, description, canonicalPath = currentRoutePath(), indexable = true, jsonLd, image }: SeoHead) {
  const localizedTitle = arabicSeoTitle(title);
  document.title = localizedTitle;
  setMeta('name', 'description', description);
  setMeta('name', 'robots', indexable ? 'index, follow' : 'noindex, follow');
  setMeta('property', 'og:title', localizedTitle);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', canonicalUrl(canonicalPath));
  setMeta('property', 'og:site_name', 'كابل ستور');
  setMeta('name', 'twitter:title', localizedTitle);
  setMeta('name', 'twitter:description', description);
  if (image) {
    setMeta('property', 'og:image', image);
  } else {
    document.querySelector('meta[property="og:image"]')?.remove();
  }
  setLink('canonical', canonicalUrl(canonicalPath));

  const existingJsonLd = document.getElementById('cabl-seo-jsonld');
  if (jsonLd) {
    const script = (existingJsonLd as HTMLScriptElement | null) || document.createElement('script');
    script.id = 'cabl-seo-jsonld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLd);
    if (!existingJsonLd) document.head.appendChild(script);
  } else {
    existingJsonLd?.remove();
  }
}