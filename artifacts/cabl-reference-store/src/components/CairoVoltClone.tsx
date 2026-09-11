import { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'wouter';
import { useStore } from '@/lib/StoreContext';

import homeMarkup from '@/reference/home.html?raw';
import guideMarkup from '@/reference/guide-category.html?raw';
import brandMarkup from '@/reference/brand.html?raw';
import productMarkup from '@/reference/product.html?raw';
import checkoutMarkup from '@/reference/checkout.html?raw';

type ClonePage = 'home' | 'power-banks' | 'anker' | 'product' | 'checkout';

const markupByPage: Record<ClonePage, string> = {
  home: homeMarkup,
  'power-banks': guideMarkup,
  anker: brandMarkup,
  product: productMarkup,
  checkout: checkoutMarkup,
};

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

export function CairoVoltClone({ page }: { page: ClonePage }) {
  const [location, setLocation] = useLocation();
  const rootRef = useRef<HTMLDivElement>(null);
  const { products, addToCart, cartItemCount } = useStore();

  const markup = useMemo(() => localizeLinks(markupByPage[page]), [page]);
  const activeProduct = useMemo(() => {
    const requestedSlug = location.endsWith('anker-powercore-10000')
      ? 'bawr-bnk-anker-bsah-10-000mah'
      : location.endsWith('anker-zolo-a110e-20000')
        ? 'bawr-bnk-anker-zolo-a110e-20-000mah'
        : '';

    return products.find((product) => product.slug === requestedSlug)
      || products.find((product) => product.brandSlug === 'anker')
      || products[0];
  }, [location, products]);

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

    root.querySelectorAll<HTMLAnchorElement>('a[href^="tel:"]').forEach((link) => {
      link.setAttribute('rel', 'nofollow');
    });

    return () => {
      if (cartButton) cartButton.onclick = null;
      addButtons.forEach((button) => {
        button.onclick = null;
      });
    };
  }, [activeProduct, addToCart, cartItemCount, setLocation, markup]);

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