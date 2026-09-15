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

function renderLoadingShell(page: { h1: string; description: string }) {
  return `<div class="cabl-loading-shell" role="status" aria-live="polite">
    <div class="cabl-loading-brand" aria-label="CABL اليمن">
      <span class="cabl-loading-mark" aria-hidden="true">C</span>
      <span class="cabl-loading-wordmark">CABL <b>اليمن</b></span>
    </div>
    <div class="cabl-loading-line" aria-hidden="true"><i></i></div>
    <p class="cabl-loading-status">جارٍ تجهيز المتجر</p>
    <h1>${escapeSeoHtml(page.h1)}</h1>
    <p class="cabl-loading-description">${escapeSeoHtml(page.description)}</p>
    <noscript>فعّل JavaScript لفتح متجر CABL وتصفح المنتجات.</noscript>
  </div>`;
}

function mountedPath() {
  return basePath.replace(/\/+$/, '');
}

function devSeoPage(originalUrl: string) {
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
  if (parts.length === 3) {
    const name = parts[2].replaceAll('-', ' ');
    return { route, title: `${name} | CABL`, h1: name, description: `${name} من كتالوج CABL داخل اليمن. راجع المواصفات والتوافر قبل الطلب.` };
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
    transformIndexHtml(html: string, context: { originalUrl?: string }) {
      const page = devSeoPage(context.originalUrl || '/');
      const relativeCanonical = `${mountedPath()}${page.route === '/' ? '' : page.route}`;
      const origin = process.env.PUBLIC_SITE_ORIGIN
        || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : '');
      const canonical = `${origin}${relativeCanonical}`;
      const schema = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: page.title,
        description: page.description,
        url: canonical,
        inLanguage: 'ar-YE',
      });
      return html
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeSeoHtml(page.title)}</title>`)
        .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${escapeSeoHtml(page.description)}" />`)
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
