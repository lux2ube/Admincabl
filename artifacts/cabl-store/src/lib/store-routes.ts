import type { StoreProduct } from '@workspace/api-client-react';

export function brandPath(brandSlug: string) {
  return `/brand/${brandSlug}`;
}

export function brandCategoryPath(brandSlug: string, categorySlug: string) {
  return `/${brandSlug}/${categorySlug}`;
}

export function productPath(product: Pick<StoreProduct, 'slug' | 'brandSlug' | 'category'>) {
  return product.brandSlug && product.category?.slug
    ? `${brandCategoryPath(product.brandSlug, product.category.slug)}/${product.slug}`
    : `/product/${product.slug}`;
}

const resizableImageHosts = ['ugreen.com', 'shopify.com'];

export function catalogImageUrl(source: string, width: number) {
  try {
    const url = new URL(source);
    const canResize = resizableImageHosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
    if (!canResize) return source;
    url.searchParams.set('width', String(width));
    return url.toString();
  } catch {
    return source;
  }
}

export function catalogImageSrcSet(source: string, widths = [320, 640, 960]) {
  const resized = widths.map((width) => `${catalogImageUrl(source, width)} ${width}w`).join(', ');
  return resized === `${source} 320w, ${source} 640w, ${source} 960w` ? undefined : resized;
}