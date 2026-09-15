import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    'BASE_PATH environment variable is required but was not provided.',
  );
}

const devSeoPages: Record<string, { title: string; h1: string; description: string }> = {
  '/': {
    title: 'CABL | منتجات الشحن والطاقة والإكسسوارات',
    h1: 'شواحن وتوصيلات وخوازن طاقة في اليمن',
    description: 'تسوّق شواحن الجوال وتوصيلات الشحن وخوازن الطاقة وإكسسوارات التقنية في اليمن، مع أسعار وتوافر وخيارات شحن واضحة من كتالوج CABL.',
  },
  '/chargers': {
    title: 'شواحن الجوال والشحن السريع في اليمن | CABL',
    h1: 'الشواحن',
    description: 'قارن شواحن الجوال وUSB-C وPD المتاحة في كتالوج CABL داخل اليمن.',
  },
  '/cables': {
    title: 'كابلات وتوصيلات الشحن في اليمن | CABL',
    h1: 'توصيلات الشحن',
    description: 'استكشف توصيلات الشحن المنشورة في CABL حسب USB-C وLightning والقدرة.',
  },
  '/power-banks': {
    title: 'خوازن الطاقة والباور بانك في اليمن | CABL',
    h1: 'خوازن الطاقة',
    description: 'قارن خوازن الطاقة والباور بانك المتاحة في اليمن من كتالوج CABL.',
  },
  '/guides': {
    title: 'أدلة شراء الشحن والطاقة والإكسسوارات في اليمن | CABL',
    h1: 'أدلة شراء مبنية على الكتالوج',
    description: 'أدلة CABL العملية لاختيار الشواحن والتوصيلات وخوازن الطاقة والملحقات.',
  },
  '/guides/chargers-yemen': {
    title: 'شواحن الجوال والشحن السريع في اليمن | CABL',
    h1: 'شواحن جوال وشحن سريع في اليمن',
    description: 'دليل اختيار شواحن الجوال وUSB-C وPD المتاحة في كتالوج CABL.',
  },
  '/guides/charging-cables-yemen': {
    title: 'كابلات وتوصيلات الشحن في اليمن | CABL',
    h1: 'كابلات وتوصيلات شحن في اليمن',
    description: 'دليل اختيار توصيلات الشحن المنشورة في CABL.',
  },
  '/guides/power-banks-yemen': {
    title: 'خوازن الطاقة والباور بانك في اليمن | CABL',
    h1: 'خوازن طاقة وباور بانك في اليمن',
    description: 'دليل اختيار خوازن الطاقة حسب السعة والقدرة والمنافذ.',
  },
  '/guides/hubs-adapters-yemen': {
    title: 'وصلات USB-C والمحاور والملحقات في اليمن | CABL',
    h1: 'وصلات USB-C ومحاور وملحقات الأجهزة في اليمن',
    description: 'دليل اختيار محاور USB-C والوصلات والملحقات المنشورة في CABL.',
  },
  '/guides/travel-car-charging-yemen': {
    title: 'شواحن السيارة وملحقات السفر في اليمن | CABL',
    h1: 'شواحن سيارة وملحقات سفر في اليمن',
    description: 'دليل اختيار شواحن السيارة وملحقات السفر المنشورة في CABL.',
  },
  '/guides/wireless-earbuds-yemen': {
    title: 'سماعات الأذن اللاسلكية في اليمن | Soundcore | CABL',
    h1: 'سماعات أذن لاسلكية في اليمن',
    description: 'دليل مقارنة سماعات الأذن اللاسلكية المنشورة في CABL.',
  },
  '/guides/wireless-microphones-yemen': {
    title: 'الميكروفونات اللاسلكية في اليمن | Hollyland | CABL',
    h1: 'ميكروفونات لاسلكية لصناع المحتوى في اليمن',
    description: 'دليل مقارنة الميكروفونات اللاسلكية المنشورة في CABL.',
  },
  '/locations/yemen': {
    title: 'التوصيل داخل اليمن | CABL',
    h1: 'راجع خيارات الشحن حسب محافظتك',
    description: 'راجع خيارات الشحن الحالية قبل تأكيد طلبك إلى المحافظة التي تختارها.',
  },
  '/about': {
    title: 'من نحن | CABL',
    h1: 'من نحن',
    description: 'تعرف على CABL وطريقة اختيار المنتجات وخدمة العملاء في اليمن.',
  },
  '/shipping': {
    title: 'الشحن والتوصيل داخل اليمن | CABL',
    h1: 'الشحن والتوصيل داخل اليمن',
    description: 'معلومات الشحن والتوصيل داخل اليمن من CABL، مع مراجعة الرسوم والمدة في checkout.',
  },
  '/return-policy': {
    title: 'سياسة الإرجاع والاستبدال | CABL',
    h1: 'سياسة الإرجاع والاستبدال',
    description: 'راجع شروط الإرجاع والاستبدال في CABL قبل تأكيد طلبك.',
  },
};

function escapeSeoHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

type DevProduct = {
  slug: string;
  brand: string;
  brandSlug: string | null;
  productName: string;
  sku: string;
  regularPrice: number;
  discountPrice: number | null;
  quantity: number;
  shortDescription: string | null;
  productDescription: string | null;
  category: { name: string; slug: string } | null;
  images: string[];
  shippingOptions: Array<{ name: string; charge: number; free: boolean; estimatedDays: number | null }>;
  specifications?: {
    attributes?: Array<{ label: string; value: string | number | boolean | null; values?: string[]; unit: string | null }>;
  };
};

type DevSeoPage = {
  route: string;
  title: string;
  h1: string;
  description: string;
  indexable?: boolean;
  breadcrumbs?: Array<{ name: string; path: string }>;
  jsonLd?: Record<string, unknown>;
  product?: DevProduct;
};

const apiOrigin = (process.env.SEO_PRERENDER_API_URL || `http://127.0.0.1:${process.env.API_PORT || '8080'}`).replace(/\/api\/?$/, '');
let devCatalogPromise: Promise<DevProduct[]> | null = null;

async function getDevCatalog() {
  if (!devCatalogPromise) {
    devCatalogPromise = fetch(`${apiOrigin}/api/store/catalog`)
      .then(async (response) => {
        if (!response.ok) return [];
        const payload = await response.json() as { products?: DevProduct[] };
        return Array.isArray(payload.products) ? payload.products : [];
      })
      .catch(() => []);
  }
  return devCatalogPromise;
}

async function getDevProduct(slug: string) {
  const products = await getDevCatalog();
  return products.find((product) => product.slug === slug);
}

async function getDevProductSeo(slug: string) {
  try {
    const response = await fetch(`${apiOrigin}/api/store/seo?type=product&slug=${encodeURIComponent(slug)}`);
    if (!response.ok) return null;
    return await response.json() as {
      title: string;
      h1: string;
      description: string;
      canonicalPath: string;
      indexable: boolean;
      breadcrumbs: Array<{ name: string; path: string }>;
      jsonLd: Record<string, unknown>;
    };
  } catch {
    return null;
  }
}

function renderLoadingShell(page: DevSeoPage) {
  const product = page.product;
  const productDetails = product
    ? `<section class="cabl-loading-product" aria-label="بيانات المنتج">
        ${product.images?.[0] ? `<img src="${escapeSeoHtml(product.images[0])}" alt="${escapeSeoHtml(product.productName)}" width="320" height="320" />` : ''}
        <div><p><strong>العلامة:</strong> ${escapeSeoHtml(product.brand)} · <strong>القسم:</strong> ${escapeSeoHtml(product.category?.name || 'المنتجات')}</p>
        <p><strong>SKU:</strong> <span dir="ltr">${escapeSeoHtml(product.sku)}</span> · <strong>السعر:</strong> ${escapeSeoHtml(String(product.discountPrice ?? product.regularPrice))} USD · <strong>الحالة:</strong> ${product.quantity > 0 ? 'متوفر حسب الكتالوج الحالي' : 'غير متوفر حالياً'}</p>
        ${product.shortDescription || product.productDescription ? `<p>${escapeSeoHtml(product.shortDescription || product.productDescription || '')}</p>` : ''}
        ${product.specifications?.attributes?.length ? `<ul>${product.specifications.attributes.map((attribute) => `<li>${escapeSeoHtml(attribute.label)}: ${escapeSeoHtml(String(attribute.value ?? (attribute.values?.join('، ') || 'غير منشور')))}${attribute.unit ? ` ${escapeSeoHtml(attribute.unit)}` : ''}</li>`).join('')}</ul>` : ''}
        ${product.shippingOptions?.length ? `<p><strong>خيارات الشحن:</strong> ${product.shippingOptions.map((option) => escapeSeoHtml(option.name)).join('، ')}</p>` : ''}
        </div>
      </section>`
    : '';
  return `<div class="cabl-loading-shell" role="status" aria-live="polite">
    <div class="cabl-loading-brand" aria-label="CABL اليمن">
      <span class="cabl-loading-mark" aria-hidden="true">C</span>
      <span class="cabl-loading-wordmark">CABL <b>اليمن</b></span>
    </div>
    <div class="cabl-loading-line" aria-hidden="true"><i></i></div>
    <p class="cabl-loading-status">جارٍ تجهيز المتجر</p>
    <h1>${escapeSeoHtml(page.h1)}</h1>
    <p class="cabl-loading-description">${escapeSeoHtml(page.description)}</p>
    ${productDetails}
    <noscript>فعّل JavaScript لفتح متجر CABL وتصفح المنتجات.</noscript>
  </div>`;
}

function mountedPath() {
  return basePath.replace(/\/+$/, '');
}

async function devSeoPage(originalUrl: string): Promise<DevSeoPage> {
  const requestedPath = new URL(originalUrl, 'http://localhost').pathname;
  const mount = mountedPath();
  const route = requestedPath.startsWith(mount)
    ? requestedPath.slice(mount.length) || '/'
    : requestedPath;
  if (devSeoPages[route]) return { ...devSeoPages[route], route };
  const parts = route.split('/').filter(Boolean);
  if (parts[0] === 'brand' && parts[1]) {
    const name = parts[1].replaceAll('-', ' ');
    return { route, title: `منتجات ${name} في اليمن | CABL`, h1: `منتجات ${name}`, description: `تصفح منتجات ${name} المنشورة في كتالوج CABL داخل اليمن.` };
  }
  const productSlug = parts[0] === 'product' && parts[1]
    ? parts[1]
    : parts.length === 3
      ? parts[2]
      : null;
  if (productSlug) {
    const product = await getDevProduct(productSlug);
    if (!product) {
      return {
        route,
        title: 'المنتج غير موجود | CABL',
        h1: 'المنتج غير موجود',
        description: 'لم نجد هذا المنتج ضمن المنتجات المنشورة في كتالوج CABL.',
        indexable: false,
      };
    }
    const seo = await getDevProductSeo(product.slug);
    return {
      route,
      title: seo?.title || `${product.productName} | CABL`,
      h1: seo?.h1 || product.productName,
      description: seo?.description || `${product.productName} من كتالوج CABL داخل اليمن.`,
      breadcrumbs: seo?.breadcrumbs,
      jsonLd: seo?.jsonLd,
      indexable: seo?.indexable ?? true,
      product,
    };
  }
  if (parts.length === 2 && !['category', 'guides', 'blog', 'locations', 'solutions'].includes(parts[0])) {
    const category = parts[1].replaceAll('-', ' ');
    const brand = parts[0].replaceAll('-', ' ');
    return { route, title: `${category} من ${brand} في اليمن | CABL`, h1: `${category} من ${brand}`, description: `تصفح منتجات ${category} من ${brand} المنشورة في كتالوج CABL.` };
  }
  if (parts[0] === 'category' && parts[1]) {
    const name = parts[1].replaceAll('-', ' ');
    return { route, title: `${name} في اليمن | CABL`, h1: name, description: `منتجات ${name} المنشورة في كتالوج CABL داخل اليمن.` };
  }
  return { route, title: 'CABL | منتجات الشحن والطاقة والإكسسوارات', h1: 'CABL في اليمن', description: 'كتالوج CABL لمنتجات الشحن والطاقة والإكسسوارات داخل اليمن.' };
}

function seoHtmlPlugin() {
  return {
    name: 'cabl-seo-html',
    async transformIndexHtml(html: string, context: { originalUrl?: string }) {
      const page = await devSeoPage(context.originalUrl || '/');
      const relativeCanonical = `${mountedPath()}${page.route === '/' ? '' : page.route}`;
      const origin = process.env.PUBLIC_SITE_ORIGIN
        || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : '');
      const canonical = `${origin}${relativeCanonical}`;
      const schema = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebPage',
            '@id': canonical,
            name: page.title,
            description: page.description,
            url: canonical,
            inLanguage: 'ar-YE',
          },
          ...(page.jsonLd ? [page.jsonLd] : []),
          ...(page.breadcrumbs?.length ? [{
            '@type': 'BreadcrumbList',
            itemListElement: page.breadcrumbs.map((item, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: item.name,
              item: `${origin}${item.path}`,
            })),
          }] : []),
        ],
      });
      return html
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeSeoHtml(page.title)}</title>`)
        .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${escapeSeoHtml(page.description)}" />`)
        .replace(/<meta name="robots" content="[^"]*"\s*\/?>/, `<meta name="robots" content="${page.indexable === false ? 'noindex, follow' : 'index, follow'}" />`)
        .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/g, '')
        .replace(/<meta property="og:[^"]*"[^>]*\/?>/g, '')
        .replace(/<meta name="twitter:[^"]*"[^>]*\/?>/g, '')
        .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '')
        .replace('</head>', `<link rel="canonical" href="${escapeSeoHtml(canonical)}" /><meta property="og:title" content="${escapeSeoHtml(page.title)}" /><meta property="og:description" content="${escapeSeoHtml(page.description)}" /><meta property="og:url" content="${escapeSeoHtml(canonical)}" /><meta property="og:locale" content="ar_YE" /><meta property="og:site_name" content="CABL" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${escapeSeoHtml(page.title)}" /><meta name="twitter:description" content="${escapeSeoHtml(page.description)}" /><script type="application/ld+json">${schema}</script><style>
          :root { color-scheme: light; font-family: Arial, "IBM Plex Sans Arabic", sans-serif; background: #f7faff; }
          * { box-sizing: border-box; }
          body { margin: 0; min-width: 320px; background: linear-gradient(145deg, #f7faff 0%, #edf5ff 100%); color: #14213d; }
          .cabl-loading-shell { min-height: 100vh; padding: 28px 24px 36px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
          .cabl-loading-brand { display: inline-flex; align-items: center; gap: 10px; direction: ltr; }
          .cabl-loading-mark { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 14px; background: #1757ee; color: #fff; font-size: 24px; font-weight: 800; box-shadow: 0 10px 24px #1757ee2e; }
          .cabl-loading-wordmark { color: #14213d; font-size: 20px; font-weight: 800; letter-spacing: .04em; }
          .cabl-loading-wordmark b { margin-left: 5px; color: #11a9c4; font-size: 12px; letter-spacing: 0; }
          .cabl-loading-line { width: min(190px, 55vw); height: 4px; margin: 32px 0 18px; overflow: hidden; border-radius: 99px; background: #d8e7fb; }
          .cabl-loading-line i { display: block; width: 42%; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #1757ee, #11c2db); animation: cabl-loading 1.25s ease-in-out infinite; }
          .cabl-loading-status { margin: 0; color: #50709b; font-size: 13px; font-weight: 700; }
          .cabl-loading-shell h1 { max-width: 620px; margin: 18px 0 8px; color: #14213d; font-size: clamp(22px, 5vw, 34px); line-height: 1.35; }
          .cabl-loading-description { max-width: 560px; margin: 0; color: #7184a0; font-size: 14px; line-height: 1.9; }
          .cabl-loading-product { width: min(760px, 100%); display: grid; grid-template-columns: minmax(140px, 220px) 1fr; gap: 24px; margin-top: 24px; padding: 18px; border: 1px solid #dbe8f8; border-radius: 20px; background: #fff; text-align: right; line-height: 1.8; }
          .cabl-loading-product img { width: 100%; height: auto; aspect-ratio: 1; object-fit: contain; border-radius: 14px; background: #f6f9fe; }
          .cabl-loading-product p { margin: 0 0 10px; color: #526b8d; font-size: 13px; }
          .cabl-loading-product ul { margin: 0; padding-right: 18px; color: #526b8d; font-size: 13px; }
          @media (max-width: 620px) { .cabl-loading-product { grid-template-columns: 1fr; } .cabl-loading-product img { max-width: 220px; margin: auto; } }
          .cabl-loading-shell noscript { max-width: 560px; margin-top: 22px; color: #b05d35; font-size: 12px; line-height: 1.7; }
          @keyframes cabl-loading { 0% { transform: translateX(145%); } 45%, 65% { transform: translateX(70%); } 100% { transform: translateX(-145%); } }
          @media (prefers-reduced-motion: reduce) { .cabl-loading-line i { animation: none; margin-left: 29%; } }
        </style></head>`)
        .replace('<div id="root"></div>', `<div id="root">${renderLoadingShell(page)}</div>`);
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    seoHtmlPlugin(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    hmr: false,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
