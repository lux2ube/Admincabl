export type SeoHead = {
  title: string;
  description: string;
  canonicalPath?: string;
  indexable?: boolean;
  jsonLd?: Record<string, unknown>;
  image?: string;
};

function basePath() {
  return import.meta.env.BASE_URL.replace(/\/$/, '');
}

export function canonicalUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${window.location.origin}${basePath()}${normalizedPath}`;
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
  document.title = title;
  setMeta('name', 'description', description);
  setMeta('name', 'robots', indexable ? 'index, follow' : 'noindex, follow');
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', canonicalUrl(canonicalPath));
  setMeta('name', 'twitter:title', title);
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