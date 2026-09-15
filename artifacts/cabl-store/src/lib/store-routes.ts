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