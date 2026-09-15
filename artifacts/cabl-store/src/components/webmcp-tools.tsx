import { useEffect } from 'react';
import { getStoreCatalog } from '@workspace/api-client-react';
import type { StoreCatalog, StoreProduct } from '@workspace/api-client-react';
import { useStore } from '@/lib/store';

type WebMcpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: Record<string, unknown>, options?: { signal?: AbortSignal }) => unknown | Promise<unknown>;
};

type WebMcpRegistration = {
  registerTool: (tool: WebMcpTool, options?: { signal?: AbortSignal }) => Promise<unknown>;
};

declare global {
  interface Document {
    modelContext?: WebMcpRegistration;
  }
}

function normalize(value: unknown) {
  return typeof value === 'string' ? value.trim().toLocaleLowerCase('ar') : '';
}

function productSummary(product: StoreProduct, currencyCode: string) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.productName,
    brand: product.brand,
    brandSlug: product.brandSlug,
    category: product.category?.name || null,
    categorySlug: product.category?.slug || null,
    sku: product.sku,
    priceUsd: product.discountPrice ?? product.regularPrice,
    displayCurrency: currencyCode,
    inStock: product.quantity > 0,
    quantity: product.quantity,
    shortDescription: product.shortDescription,
    productUrl: product.brandSlug && product.category?.slug
      ? `/${product.brandSlug}/${product.category.slug}/${product.slug}`
      : `/product/${product.slug}`,
  };
}

function findProduct(catalog: StoreCatalog, identifier: string) {
  const normalizedIdentifier = normalize(identifier);
  return catalog.products.find((product) => [
    product.id,
    product.slug,
    product.sku,
    product.productName,
  ].some((value) => normalize(value) === normalizedIdentifier));
}

export function WebMcpTools() {
  const { catalog, currency } = useStore();

  useEffect(() => {
    const modelContext = document.modelContext;
    if (!modelContext) return;

    const controller = new AbortController();
    const register = async () => {
      const loadCatalog = async (signal?: AbortSignal) => {
        if (signal?.aborted) throw new DOMException('Tool execution was cancelled.', 'AbortError');
        return getStoreCatalog(undefined, { signal });
      };

      const tools: WebMcpTool[] = [
        {
          name: 'search-cabl-catalog',
          description: 'Search the published CABL Yemen catalog by product name, brand, category, or stock status. Use this for product discovery before opening a product page.',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Arabic or English product name, model, SKU, or search phrase.' },
              brand: { type: 'string', description: 'Brand name, such as Baseus, Anker, Vention, or Hollyland.' },
              category: { type: 'string', description: 'Category name or category slug.' },
              onlyInStock: { type: 'boolean', description: 'Return only products with a published quantity greater than zero.' },
            },
            additionalProperties: false,
          },
          execute: async (input, options) => {
            const fullCatalog = await loadCatalog(options?.signal);
            const query = normalize(input.query);
            const brand = normalize(input.brand);
            const category = normalize(input.category);
            const onlyInStock = input.onlyInStock === true;
            const products = fullCatalog.products.filter((product) => {
              const searchable = normalize(`${product.productName} ${product.brand} ${product.sku} ${product.shortDescription || ''}`);
              const matchesQuery = !query || searchable.includes(query);
              const matchesBrand = !brand || normalize(product.brand) === brand || normalize(product.brandSlug) === brand;
              const matchesCategory = !category || normalize(product.category?.name) === category || normalize(product.category?.slug) === category;
              return matchesQuery && matchesBrand && matchesCategory && (!onlyInStock || product.quantity > 0);
            });
            return {
              ok: true,
              count: products.length,
              products: products.slice(0, 24).map((product) => productSummary(product, currency?.code || 'YER')),
              truncated: products.length > 24,
            };
          },
        },
        {
          name: 'get-cabl-product-details',
          description: 'Return the published price, availability, category, description, and verified specifications for one CABL product. Identify the product by slug, SKU, ID, or exact name.',
          inputSchema: {
            type: 'object',
            properties: {
              identifier: { type: 'string', description: 'Product slug, SKU, ID, or exact published product name.' },
            },
            required: ['identifier'],
            additionalProperties: false,
          },
          execute: async (input, options) => {
            const fullCatalog = await loadCatalog(options?.signal);
            const product = findProduct(fullCatalog, String(input.identifier || ''));
            if (!product) return { ok: false, error: 'No published product matched that identifier.' };
            return {
              ok: true,
              product: {
                ...productSummary(product, currency?.code || 'YER'),
                description: product.productDescription,
                note: product.productNote,
                images: product.images,
                specifications: product.specifications,
              },
            };
          },
        },
        {
          name: 'get-cabl-store-overview',
          description: 'Return the current published CABL categories, brands, currencies, and shipping and payment options without exposing customer information.',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
          },
          execute: async (input, options) => {
            void input;
            const fullCatalog = await loadCatalog(options?.signal);
            return {
              ok: true,
              categories: fullCatalog.categories.map(({ name, slug, productCount }) => ({ name, slug, productCount })),
              brands: fullCatalog.brands.map(({ name, slug, productCount }) => ({ name, slug, productCount })),
              currencies: fullCatalog.currencies.map(({ code, name, isDefault }) => ({ code, name, isDefault })),
              shippingOptions: fullCatalog.shippingOptions.map(({ name, charge, free, estimatedDays }) => ({ name, charge, free, estimatedDays })),
              paymentMethods: fullCatalog.paymentMethods.map(({ name, description, requiresTransactionReference }) => ({ name, description, requiresTransactionReference })),
            };
          },
        },
      ];

      try {
        await Promise.all(tools.map((tool) => modelContext.registerTool(tool, { signal: controller.signal })));
      } catch (error) {
        if (!controller.signal.aborted) {
          console.debug('WebMCP tools are unavailable in this browser.', error);
        }
      }
    };

    void register();
    return () => controller.abort();
  }, [catalog, currency?.code]);

  return null;
}