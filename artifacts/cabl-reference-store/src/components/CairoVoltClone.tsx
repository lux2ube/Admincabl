import { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'wouter';
import { useStore } from '@/lib/StoreContext';
import { useCreateStoreOrder } from '@workspace/api-client-react';

import homeMarkup from '@/reference/home.html?raw';
import guideMarkup from '@/reference/guide-category.html?raw';
import brandMarkup from '@/reference/brand.html?raw';
import productMarkup from '@/reference/product.html?raw';
import checkoutMarkup from '@/reference/checkout.html?raw';

type ClonePage = 'home' | 'power-banks' | 'anker' | 'product' | 'checkout';

const legacyProductAliases: Record<string, string> = {
  'anker-powercore-10000': 'bawr-bnk-anker-bsah-10-000mah',
  'anker-zolo-a110e-20000': 'bawr-bnk-anker-bsah-20-000mah-30w',
};

const markupByPage: Record<ClonePage, string> = {
  home: homeMarkup,
  'power-banks': guideMarkup,
  anker: brandMarkup,
  product: productMarkup,
  checkout: checkoutMarkup,
};

const sharedHeaderMarkup = homeMarkup.match(/<header\b[^>]*>[\s\S]*?<\/header>/i)?.[0] || '';
const sharedFooterMarkup = homeMarkup.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/i)?.[0] || '';

function normalizeSharedChrome(markup: string) {
  return markup
    .replace(/<header\b[^>]*>[\s\S]*?<\/header>/i, sharedHeaderMarkup)
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/i, sharedFooterMarkup);
}

function localizeLinks(markup: string) {
  const base = import.meta.env.BASE_URL;
  const localized = markup.replaceAll('__CABLVOLT_BASE__', base);
  return localized
    .replaceAll(`src="${base}`, `src="${base}cairovolt/`)
    .replaceAll(`poster="${base}`, `poster="${base}cairovolt/`)
    .replaceAll(`url(${base}`, `url(${base}cairovolt/`)
    .replace(/srcset="\/images\//g, `srcset="${base}cairovolt/images/`)
    .replace(/,\s*\/images\//g, `, ${base}cairovolt/images/`);
}

function formatCatalogPrice(value: number, formatMoney: (amount: number) => string) {
  return formatMoney(value);
}

export function CairoVoltClone({ page }: { page: ClonePage }) {
  const [location, setLocation] = useLocation();
  const rootRef = useRef<HTMLDivElement>(null);
  const {
    products,
    addToCart,
    cartItemCount,
    cart,
    cartQuantities,
    cartTotal,
    formatMoney,
    shippingOptions,
    paymentMethods,
    clearCart,
  } = useStore();
  const createOrder = useCreateStoreOrder();

  const markup = useMemo(() => localizeLinks(normalizeSharedChrome(markupByPage[page])), [page]);
  const activeProduct = useMemo(() => {
    const routeSlug = location.split('/').filter(Boolean).pop()?.split('#')[0] || '';
    const requestedSlug = legacyProductAliases[routeSlug] || routeSlug;

    return products.find((product) => product.slug === requestedSlug)
      || products.find((product) => product.brandSlug === 'anker')
      || products[0];
  }, [location, products]);

  const hydrateProductContent = () => {
    const root = rootRef.current;
    if (!root || page !== 'product' || !activeProduct) return;

    const price = activeProduct.discountPrice ?? activeProduct.regularPrice;
    const title = activeProduct.productName;
    const productUrl = `${import.meta.env.BASE_URL}${activeProduct.brandSlug}/${activeProduct.category?.slug || 'products'}/${activeProduct.slug}`;

    const heading = root.querySelector('h1');
    if (heading) heading.textContent = title;

    root.querySelectorAll('meta[itemprop="name"], meta[property="og:title"]').forEach((meta) => {
      meta.setAttribute('content', title);
    });
    root.querySelectorAll('meta[itemprop="description"], meta[name="description"], meta[property="og:description"]').forEach((meta) => {
      meta.setAttribute('content', activeProduct.shortDescription || activeProduct.productDescription || title);
    });
    root.querySelectorAll('meta[itemprop="price"]').forEach((meta) => {
      meta.setAttribute('content', String(price));
    });
    root.querySelectorAll('a[href*="/anker/power-banks/anker-"], a[href*="/anker/power-banks/anker-zolo"]').forEach((link) => {
      link.setAttribute('href', productUrl);
    });

    const priceText = formatCatalogPrice(price, formatMoney);
    root.querySelectorAll('span').forEach((span) => {
      const text = span.textContent?.trim() || '';
      if (/^(1,730|1,959|1730|1959)\s*(جنيه|ج\.م)?$/.test(text)) {
        span.textContent = priceText;
      }
    });

    const stockText = activeProduct.quantity > 0 ? 'متوفر' : 'غير متوفر';
    root.querySelectorAll('[class*="animate-pulse"]').forEach((badge) => {
      const parent = badge.parentElement;
      if (parent?.textContent?.includes('متوفر')) {
        parent.lastChild?.replaceWith(document.createTextNode(` ${stockText}`));
      }
    });

    const image = activeProduct.images.find((path) => !path.startsWith('http'));
    if (image) {
      root.querySelectorAll('article img').forEach((img) => {
        img.setAttribute('src', image);
        img.setAttribute('alt', title);
      });
    }
  };

  const hydrateCatalogLinks = () => {
    const root = rootRef.current;
    if (!root || page === 'product' || page === 'checkout') return;

    const candidates = Array.from(root.querySelectorAll<HTMLAnchorElement>('a[href*="/power-banks/"], a[href*="/wall-chargers/"], a[href*="/cables/"], a[href*="/car-chargers/"], a[href*="/accessories/"], a[href*="/soundcore/"]'))
      .filter((link) => link.querySelector('img') && link.querySelector('p[class*="line-clamp"]') && !link.getAttribute('href')?.includes('#'));
    const uniqueLinks = candidates.filter((link, index, all) => all.findIndex((item) => item === link) === index);

    const availableProducts = page === 'anker'
      ? products.filter((product) => product.brandSlug === 'anker')
      : page === 'power-banks'
        ? products.filter((product) => product.productName.includes('باور بنك') || product.category?.slug.includes('power-bank'))
        : products;

    uniqueLinks.slice(0, availableProducts.length).forEach((link, index) => {
      const product = availableProducts[index];
      const categorySlug = product.category?.slug || 'products';
      link.setAttribute('href', `${import.meta.env.BASE_URL}${product.brandSlug}/${categorySlug}/${product.slug}`);

      const titleNode = link.querySelector<HTMLElement>('p, h3, h4');
      if (titleNode && titleNode.textContent?.trim()) titleNode.textContent = product.productName;

      const priceNode = Array.from(link.querySelectorAll<HTMLElement>('span')).find((node) =>
        /ج\.م|جنيه|ريال|USD|\d/.test(node.textContent || ''),
      );
      if (priceNode) priceNode.textContent = formatCatalogPrice(product.discountPrice ?? product.regularPrice, formatMoney);
    });
  };

  const hydrateCheckout = () => {
    const root = rootRef.current;
    if (!root || page !== 'checkout') return;

    const summaryHeading = Array.from(root.querySelectorAll('h2')).find((heading) => heading.textContent?.trim() === 'ملخص الطلب');
    const summary = summaryHeading?.parentElement;
    const row = summary?.querySelector<HTMLElement>('.flex.justify-between.py-2.border-b');
    if (row) {
      const names = cart.map((product) => `${product.productName} x${cartQuantities[product.id] ?? 1}`).join('، ');
      const price = formatCatalogPrice(cartTotal, formatMoney);
      row.innerHTML = `<span>${names || 'عربة التسوق فارغة'}</span><span class="font-bold">${price}</span>`;
    }

    if (summary) {
      const subtotalRow = Array.from(summary.querySelectorAll<HTMLElement>('.flex.justify-between')).find((item) =>
        item.textContent?.includes('المجموع الفرعي'),
      );
      if (subtotalRow?.lastElementChild) subtotalRow.lastElementChild.textContent = formatCatalogPrice(cartTotal, formatMoney);
    }

    const form = root.querySelector<HTMLFormElement>('form');
    if (!form) return;
    form.onsubmit = (event) => {
      event.preventDefault();
      const values = new FormData(form);
      const fullName = String(values.get('customerName') || '').trim();
      const phoneNumber = String(values.get('phone') || '').trim();
      const addressLine1 = String(values.get('address') || '').trim();
      const city = String(values.get('city') || '').trim();
      const nameParts = fullName.split(/\s+/).filter(Boolean);
      const shippingId = shippingOptions[0]?.id;
      const paymentMethodId = paymentMethods[0]?.id;

      if (!fullName || !phoneNumber || !addressLine1 || !city || !shippingId || !paymentMethodId || cart.length === 0) {
        let error = form.querySelector<HTMLElement>('[data-order-error]');
        if (!error) {
          error = document.createElement('p');
          error.dataset.orderError = 'true';
          error.className = 'text-red-600 font-bold text-sm mt-3';
          form.prepend(error);
        }
        error.textContent = cart.length === 0 ? 'أضف منتجًا إلى السلة أولاً.' : 'يرجى استكمال بيانات الشحن.';
        return;
      }

      createOrder.mutate({
        data: {
          customer: {
            firstName: nameParts[0] || 'عميل',
            lastName: nameParts.slice(1).join(' ') || 'CABL',
            email: `${phoneNumber.replace(/[^\d]/g, '') || 'customer'}@orders.cabl.store`,
            phoneNumber,
          },
          address: {
            addressLine1,
            addressLine2: null,
            postalCode: null,
            country: 'مصر',
            city,
            phoneNumber,
          },
          items: cart.map((product) => ({
            productId: product.id,
            quantity: cartQuantities[product.id] ?? 1,
          })),
          shippingId,
          paymentMethodId,
          paymentReference: null,
          couponCode: null,
        },
      }, {
        onSuccess: (order) => {
          clearCart();
          const main = root.querySelector('main');
          if (main) {
            main.innerHTML = `<div class="container mx-auto px-4 py-20 text-center" dir="rtl"><h1 class="text-3xl font-bold mb-4">تم تأكيد طلبك بنجاح</h1><p class="text-lg">رقم الطلب: ${order.id}</p><p class="mt-2">الإجمالي: ${formatMoney(order.total)}</p></div>`;
          }
        },
        onError: (error: Error) => {
          let message = form.querySelector<HTMLElement>('[data-order-error]');
          if (!message) {
            message = document.createElement('p');
            message.dataset.orderError = 'true';
            message.className = 'text-red-600 font-bold text-sm mt-3';
            form.prepend(message);
          }
          message.textContent = error.message || 'تعذر تأكيد الطلب.';
        },
      });
    };
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const cartButton = root.querySelector<HTMLButtonElement>('[aria-label="سلة المشتريات"]');
    if (cartButton) {
      const badge = cartButton.querySelector('span');
      if (badge) badge.textContent = String(cartItemCount);
      cartButton.onclick = () => setLocation('/checkout');
    }

    const addButtons = root.querySelectorAll<HTMLButtonElement>('[data-add-to-cart="true"]');
    addButtons.forEach((button) => {
      button.onclick = () => {
        if (activeProduct) addToCart(activeProduct);
      };
    });

    hydrateProductContent();
    hydrateCatalogLinks();
    hydrateCheckout();

    root.querySelectorAll<HTMLAnchorElement>('a[href^="tel:"]').forEach((link) => {
      link.setAttribute('rel', 'nofollow');
    });

    return () => {
      if (cartButton) cartButton.onclick = null;
      addButtons.forEach((button) => {
        button.onclick = null;
      });
    };
  }, [
    activeProduct,
    addToCart,
    cart,
    cartItemCount,
    cartQuantities,
    cartTotal,
    clearCart,
    createOrder,
    formatMoney,
    markup,
    paymentMethods,
    products,
    setLocation,
    shippingOptions,
  ]);

  useEffect(() => {
    const title = rootRef.current?.querySelector('h1')?.textContent?.trim();
    if (title) document.title = title;
    window.scrollTo(0, 0);
  }, [page]);

  return (
    <div
      ref={rootRef}
      className="cairovolt-clone min-h-screen"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}