import type { StoreProduct } from '@workspace/api-client-react';

export const publicCategorySlugs: Record<string, string> = {
  'charging-cables': 'cables',
  'travel-adapters': 'car-accessories',
  'phone-accessories': 'hubs-adapters',
};

export function publicCategorySlug(categorySlug: string | null | undefined) {
  return categorySlug ? publicCategorySlugs[categorySlug] || categorySlug : '';
}

export function brandPath(brandSlug: string) {
  return `/brand/${brandSlug}`;
}

export function brandCategoryPath(brandSlug: string, categorySlug: string) {
  return `/${brandSlug}/${publicCategorySlug(categorySlug)}`;
}

export function productPath(product: Pick<StoreProduct, 'slug' | 'brandSlug' | 'category'>) {
  return product.brandSlug && product.category?.slug
    ? `${brandCategoryPath(product.brandSlug, product.category.slug)}/${product.slug}`
    : `/product/${product.slug}`;
}