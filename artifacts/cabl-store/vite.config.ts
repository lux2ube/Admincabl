import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

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
    h1: 'شحن أوضح. يوم أسهل.',
    description: 'تسوق منتجات الشحن والطاقة والإكسسوارات من كتالوج CABL، مع أسعار ومخزون وخيارات شحن مأخوذة من المتجر.',
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
      const canonical = `${mountedPath()}${page.route === '/' ? '' : page.route}`;
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
        .replace('</head>', `<link rel="canonical" href="${escapeSeoHtml(canonical)}" /><meta property="og:title" content="${escapeSeoHtml(page.title)}" /><meta property="og:description" content="${escapeSeoHtml(page.description)}" /><meta property="og:url" content="${escapeSeoHtml(canonical)}" /><meta property="og:locale" content="ar_YE" /><meta property="og:site_name" content="CABL" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${escapeSeoHtml(page.title)}" /><meta name="twitter:description" content="${escapeSeoHtml(page.description)}" /><script type="application/ld+json">${schema}</script></head>`)
        .replace('<div id="root"></div>', `<div id="root"><main><h1>${escapeSeoHtml(page.h1)}</h1><p>${escapeSeoHtml(page.description)}</p></main></div>`);
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    seoHtmlPlugin(),
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
        ]
      : []),
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
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
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
