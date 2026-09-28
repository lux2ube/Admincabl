import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  ArrowLeft,
  Check,
  FileText,
  Globe2,
  LoaderCircle,
  Package,
  Search,
  ShieldCheck,
} from 'lucide-react';
import {
  getGetAdminDashboardQueryKey,
  getListAdminRowsQueryKey,
  useCreateAdminRow,
  useListAdminRows,
  useUpdateAdminRow,
} from '@workspace/api-client-react';
import type { ProductRequiredAttributeStatus } from '@/components/product-specifications-section';
import { ProductCategoriesSection } from '@/components/product-categories-section';

type Row = Record<string, unknown>;

type ProductValues = {
  brand: string;
  product_name: string;
  SKU: string;
  brand_id: string;
  slug: string;
  regular_price: string;
  discount_price: string;
  quantity: string;
  short_description: string;
  product_description: string;
  product_weight: string;
  product_note: string;
  seo_title: string;
  meta_description: string;
  published: boolean;
};

type ProductEditorPageProps = {
  productId?: string;
  renderRelatedRecords?: (
    row: Row,
    onRequiredAttributesChange: (status: ProductRequiredAttributeStatus) => void,
    categorySelection: { selectedCategoryIds: string[]; categoryDirty: boolean },
  ) => ReactNode;
};

const blankProduct = (): ProductValues => ({
  brand: '',
  product_name: '',
  SKU: '',
  brand_id: '',
  slug: '',
  regular_price: '',
  discount_price: '',
  quantity: '0',
  short_description: '',
  product_description: '',
  product_weight: '',
  product_note: '',
  seo_title: '',
  meta_description: '',
  published: false,
});

function productCreationNotice() {
  const params = new URLSearchParams(window.location.search);
  const messages: string[] = [];
  if (params.get('publishDeferred') === '1') {
    messages.push('Draft created. Add the required product features, then publish it from this workspace.');
  }
  if (params.get('categoryWarning') === '1') {
    messages.push('The product was created, but one or more category links need attention in the category section.');
  } else if (params.get('created') === '1' && params.get('publishDeferred') !== '1') {
    messages.push('Product created. Categories are selected above; you can now add images and specifications.');
  }
  return messages.join(' ');
}

function valuesFromRow(row: Row): ProductValues {
  return {
    brand: String(row.brand ?? ''),
    product_name: String(row.product_name ?? ''),
    SKU: String(row.SKU ?? ''),
    brand_id: String(row.brand_id ?? ''),
    slug: String(row.slug ?? ''),
    regular_price: String(row.regular_price ?? ''),
    discount_price: row.discount_price == null ? '' : String(row.discount_price),
    quantity: String(row.quantity ?? '0'),
    short_description: String(row.short_description ?? ''),
    product_description: String(row.product_description ?? ''),
    product_weight: row.product_weight == null ? '' : String(row.product_weight),
    product_note: String(row.product_note ?? ''),
    seo_title: String(row.seo_title ?? ''),
    meta_description: String(row.meta_description ?? ''),
    published: row.published === true || row.published === 'true',
  };
}

function fieldValues(values: ProductValues, published: boolean) {
  const payload: Record<string, unknown> = {
    brand: values.brand.trim(),
    product_name: values.product_name.trim(),
    SKU: values.SKU.trim(),
    brand_id: values.brand_id || null,
    regular_price: Number(values.regular_price),
    discount_price: values.discount_price.trim() ? Number(values.discount_price) : null,
    quantity: Number(values.quantity),
    short_description: values.short_description.trim() || null,
    product_description: values.product_description,
    product_weight: values.product_weight.trim() ? Number(values.product_weight) : null,
    product_note: values.product_note.trim() || null,
    seo_title: values.seo_title.trim() || null,
    meta_description: values.meta_description.trim() || null,
    published,
  };
  const slug = values.slug.trim().toLowerCase().replace(/\s+/g, '-');
  if (slug) payload.slug = slug;
  return payload;
}

function validateProduct(values: ProductValues): string | null {
  if (!values.product_name.trim()) return 'Enter a product name.';
  if (!values.brand.trim()) return 'Enter a brand name.';
  if (!values.SKU.trim()) return 'Enter a SKU.';

  const price = Number(values.regular_price);
  if (!Number.isFinite(price) || price <= 0) return 'Enter a regular price greater than zero.';

  const quantity = Number(values.quantity);
  if (!Number.isInteger(quantity) || quantity < 0) return 'Enter a whole-number stock quantity of zero or more.';

  if (values.discount_price.trim()) {
    const discount = Number(values.discount_price);
    if (!Number.isFinite(discount) || discount < 0) return 'Enter a valid discount price.';
    if (discount > price) return 'The discount price cannot be higher than the regular price.';
  }

  if (values.product_weight.trim()) {
    const weight = Number(values.product_weight);
    if (!Number.isFinite(weight) || weight < 0) return 'Enter a valid product weight.';
  }

  if (values.short_description.length > 165) return 'Keep the short description within 165 characters.';
  if (values.product_note.length > 255) return 'Keep the product note within 255 characters.';
  if (values.seo_title.length > 255) return 'Keep the SEO title within 255 characters.';
  if (values.meta_description.length > 320) return 'Keep the meta description within 320 characters.';
  return null;
}

function InputField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  maxLength,
  placeholder,
  dir = 'auto',
  step,
  min,
  note,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  dir?: 'auto' | 'ltr' | 'rtl';
  step?: string;
  min?: string;
  note?: string;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-primary">
        <span>{label}{required && <span className="ml-1 text-accent">*</span>}</span>
        {note && <span className="text-[10px] font-medium text-muted-foreground">{note}</span>}
      </label>
      <input
        id={id}
        data-testid={`input-${id}`}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        dir={dir}
        step={step}
        min={min}
        className="focus-ring h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/65 focus:border-accent"
      />
    </div>
  );
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
  rows,
  maxLength,
  note,
  helper,
  large = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  maxLength?: number;
  note?: string;
  helper?: string;
  large?: boolean;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-primary">
        <span>{label}</span>
        {note && <span className="text-[10px] font-medium text-muted-foreground">{note}</span>}
      </label>
      <textarea
        id={id}
        data-testid={`textarea-${id}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        maxLength={maxLength}
        dir="auto"
        className={`focus-ring w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm leading-7 text-foreground outline-none transition-colors placeholder:text-muted-foreground/65 focus:border-accent ${large ? 'min-h-[260px] sm:min-h-[320px]' : 'min-h-[92px]'}`}
      />
      {helper && <p className="mt-1.5 text-[10px] leading-4 text-muted-foreground">{helper}</p>}
    </div>
  );
}

function EditorCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`cabl-card rounded-2xl p-5 md:p-6 ${className}`}>{children}</section>;
}

function SectionHeading({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  icon: typeof Package;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
        <Icon size={17} />
      </span>
      <div>
        <p className="mono text-[9px] font-semibold uppercase tracking-[.16em] text-muted-foreground">{eyebrow}</p>
        <h2 className="mt-1 text-base font-extrabold tracking-[-.02em] text-primary">{title}</h2>
        {description && <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

function apiErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
      return data.error;
    }
  }
  return 'The product was not saved. Check the values and try again.';
}

export function ProductEditorPage({ productId, renderRelatedRecords }: ProductEditorPageProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<ProductValues>(blankProduct);
  const [savedValues, setSavedValues] = useState<ProductValues>(blankProduct);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState(productCreationNotice);
  const [priceIntent, setPriceIntent] = useState<boolean | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categoryDirty, setCategoryDirty] = useState(false);
  const [isSavingNewCategories, setIsSavingNewCategories] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const [requiredStatus, setRequiredStatus] = useState<ProductRequiredAttributeStatus & { productId?: string }>({
    ready: !productId,
    missing: [],
    productId,
  });
  useEffect(() => {
    setNotice(productId ? productCreationNotice() : '');
  }, [productId]);
  const currentRequiredStatus = requiredStatus.productId === productId
    ? requiredStatus
    : { ready: !productId, missing: [] };
  const updateRequiredStatus = useCallback(
    (status: ProductRequiredAttributeStatus) => setRequiredStatus((current) => {
      const unchanged = current.productId === productId
        && current.ready === status.ready
        && current.missing.length === status.missing.length
        && current.missing.every((name, index) => name === status.missing[index]);
      return unchanged ? current : { ...status, productId };
    }),
    [productId],
  );

  const productParams = useMemo(() => ({
    filterColumn: 'id',
    filterValue: productId ?? '',
    limit: 1,
    offset: 0,
  }), [productId]);
  const productQuery = useListAdminRows('products', productParams, {
    query: {
      enabled: Boolean(productId),
      queryKey: getListAdminRowsQueryKey('products', productParams),
    },
  });
  const brandParams = useMemo(() => ({
    search: brandSearch.trim() || undefined,
    limit: 100,
    offset: 0,
  }), [brandSearch]);
  const brandsQuery = useListAdminRows('brands', brandParams, {
    query: { queryKey: getListAdminRowsQueryKey('brands', brandParams) },
  });
  const createRow = useCreateAdminRow();
  const createCategoryRelation = useCreateAdminRow();
  const updateRow = useUpdateAdminRow();
  const isPending = createRow.isPending || updateRow.isPending || createCategoryRelation.isPending || isSavingNewCategories;
  const productRow = ((productQuery.data?.rows ?? []) as Row[])[0];
  const brands = (brandsQuery.data?.rows ?? []) as Row[];
  const isDirty = JSON.stringify(values) !== JSON.stringify(savedValues) || categoryDirty;

  useEffect(() => {
    if (!productId) {
      const empty = blankProduct();
      setValues(empty);
      setSavedValues(empty);
      setSelectedCategoryIds([]);
      return;
    }
    if (productRow) {
      const next = valuesFromRow(productRow);
      setValues(next);
      setSavedValues(next);
    }
  }, [productId, productRow?.id, productRow?.updated_at]);

  const updateValue = <K extends keyof ProductValues>(key: K, value: ProductValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setFormError('');
    setNotice('');
  };

  const updateSelectedCategoryIds = useCallback((ids: string[]) => {
    setSelectedCategoryIds((current) => (
      current.length === ids.length && current.every((id, index) => id === ids[index]) ? current : ids
    ));
    setFormError('');
  }, []);

  const leaveEditor = () => {
    if (isDirty && !window.confirm('Discard your unsaved product changes?')) return;
    setLocation('/table/products');
  };

  const refreshProductData = () => {
    void queryClient.invalidateQueries({ queryKey: getListAdminRowsQueryKey('products') });
    void queryClient.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
  };

  const saveProduct = (published: boolean) => {
    const shouldPublish = Boolean(productId && published);
    if (shouldPublish && categoryDirty) {
      setFormError('Save the category changes before publishing so the product uses the selected categories.');
      return;
    }
    if (shouldPublish && !currentRequiredStatus.ready) {
      setFormError('تعذر التحقق من المواصفات المطلوبة. انتظر اكتمال التحميل ثم حاول النشر مرة أخرى.');
      return;
    }
    if (shouldPublish && currentRequiredStatus.missing.length > 0) {
      setFormError(`أكمل المواصفات المطلوبة قبل النشر: ${currentRequiredStatus.missing.join('، ')}`);
      return;
    }
    const validationError = validateProduct(values);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    if (!productId && !values.brand_id.trim()) {
      setFormError('Select a brand record before saving the product.');
      return;
    }
    if (!productId && !selectedCategoryIds.length) {
      setFormError('Select at least one category before saving the product.');
      return;
    }
    setFormError('');
    setNotice('');
    setPriceIntent(published);
    const payload = fieldValues(values, shouldPublish);
    const onError = (error: unknown) => {
      setPriceIntent(null);
      setFormError(apiErrorMessage(error));
    };

    if (!productId) {
      createRow.mutate(
        { table: 'products', data: { values: payload } },
        {
          onSuccess: (result) => {
            const saved = valuesFromRow(result.row as Row);
            setValues(saved);
            setSavedValues(saved);
            refreshProductData();
            const id = String((result.row as Row).id ?? '');
            if (!id) {
              setFormError('The product was created, but the API did not return its ID. Reopen the product list to continue editing.');
              setIsSavingNewCategories(false);
              setPriceIntent(null);
              return;
            }
            setIsSavingNewCategories(true);
            Promise.allSettled(selectedCategoryIds.map((categoryId) => createCategoryRelation.mutateAsync({
              table: 'product_categories',
              data: { values: { product_id: id, category_id: categoryId } },
            }))).then((results) => {
              const failed = results.some((item) => item.status === 'rejected');
              const params = new URLSearchParams({ created: '1' });
              if (published) params.set('publishDeferred', '1');
              if (failed) {
                params.set('categoryWarning', '1');
                params.set('categoryDraft', selectedCategoryIds.join(','));
              }
              setLocation(`/table/products/${encodeURIComponent(id)}/edit?${params.toString()}`);
              setIsSavingNewCategories(false);
              setPriceIntent(null);
            });
          },
          onError,
        },
      );
      return;
    }

    updateRow.mutate(
      { table: 'products', id: productId, data: { values: payload } },
      {
        onSuccess: (result) => {
          const saved = valuesFromRow(result.row as Row);
          setValues(saved);
          setSavedValues(saved);
          setNotice(`${shouldPublish ? 'Product published and changes saved.' : 'Draft saved.'}${categoryDirty ? ' Category changes are still pending above.' : ''}`);
          refreshProductData();
          setPriceIntent(null);
        },
        onError,
      },
    );
  };

  if (productId && productQuery.isLoading) {
    return <div className="page-enter space-y-4" data-testid="page-product-editor-loading">
      <div className="skeleton h-10 w-64" />
      <div className="skeleton h-40 w-full rounded-2xl" />
      <div className="skeleton h-72 w-full rounded-2xl" />
    </div>;
  }

  if (productId && (productQuery.isError || !productRow)) {
    return <div className="page-enter mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6" data-testid="page-product-editor-error">
      <h1 className="text-lg font-extrabold text-primary">Product could not be loaded</h1>
      <p className="mt-2 text-sm text-muted-foreground">The product may have been removed, or the admin API could not be reached.</p>
      <button type="button" onClick={() => setLocation('/table/products')} className="focus-ring mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground">
        <ArrowLeft size={14} /> Back to products
      </button>
    </div>;
  }

  const fallbackTitle = values.product_name.trim() ? `${values.product_name.trim()} | CABL` : 'Product title';
  const fallbackDescription = values.short_description.trim()
    || values.product_description.trim()
    || 'Add a short product description to preview how this listing can appear in search.';
  const displayedTitle = values.seo_title.trim() || fallbackTitle;
  const displayedDescription = values.meta_description.trim() || fallbackDescription;

  return (
    <div className="page-enter mx-auto max-w-[1440px] space-y-6" data-testid="page-product-editor">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">
            <button type="button" onClick={leaveEditor} className="focus-ring hover:text-accent">Products</button>
            <span aria-hidden="true">/</span><span>{productId ? 'Edit product' : 'New product'}</span>
          </div>
          <p className="mono text-[9px] uppercase tracking-[.18em] text-accent">Product workspace</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-[-.04em] text-primary md:text-3xl">
              {productId ? 'Edit product' : 'Create product'}
            </h1>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${values.published ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${values.published ? 'bg-accent' : 'bg-muted-foreground'}`} />
              {values.published ? 'Published' : 'Draft'}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">
            Write clear product information, review search appearance, and choose when the listing goes live.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <ShieldCheck size={14} className="text-accent" />
          <span>Catalog prices are stored in USD.</span>
        </div>
      </section>

      {notice && <div role="status" data-testid="status-product-saved" className="rounded-xl border border-secondary bg-secondary/50 px-4 py-3 text-xs font-semibold text-secondary-foreground">{notice}</div>}
      {formError && <div role="alert" data-testid="status-product-form-error" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive">{formError}</div>}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          saveProduct(Boolean(productId));
        }}
        className="space-y-5"
        data-testid="form-product-editor"
      >
        <ProductCategoriesSection
          productId={productId}
          selectedCategoryIds={selectedCategoryIds}
          onSelectedCategoryIdsChange={updateSelectedCategoryIds}
          onDirtyChange={setCategoryDirty}
          onSaveComplete={() => setNotice('')}
          disabled={isPending}
        />
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <EditorCard>
              <SectionHeading
                eyebrow="01 · Product information"
                title="Product information"
                description="Keep the product name, brand, and SKU consistent with the catalog."
                icon={Package}
              />
              <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                <InputField id="product-name" label="Product name" value={values.product_name} onChange={(value) => updateValue('product_name', value)} required maxLength={255} />
                <InputField id="product-sku" label="SKU" value={values.SKU} onChange={(value) => updateValue('SKU', value)} required maxLength={255} dir="ltr" />
                <div className="space-y-3 sm:col-span-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="min-w-0">
                      <label htmlFor="product-brand-search" className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-primary">
                        <span>Find a brand</span>
                        {brandsQuery.isFetching && <span className="text-[10px] font-medium text-muted-foreground">Loading…</span>}
                      </label>
                      <input
                        id="product-brand-search"
                        data-testid="input-product-brand-search"
                        type="search"
                        value={brandSearch}
                        onChange={(event) => setBrandSearch(event.target.value)}
                        placeholder="Search brand records"
                        className="focus-ring h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none placeholder:text-muted-foreground focus:border-accent"
                      />
                    </div>
                    <div className="min-w-0">
                      <label htmlFor="product-brand-id" className="mb-2 block text-xs font-bold text-primary">
                        Brand record{!productId && <span className="ml-1 text-accent">*</span>}
                      </label>
                      <select
                        id="product-brand-id"
                        data-testid="select-product-brand"
                        value={values.brand_id}
                        onChange={(event) => {
                          const brandId = event.target.value;
                          const selected = brands.find((brand) => String(brand.id) === brandId);
                          setValues((current) => ({
                            ...current,
                            brand_id: brandId,
                            ...(selected?.brand_name ? { brand: String(selected.brand_name) } : {}),
                          }));
                          setFormError('');
                        }}
                        className="focus-ring h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:border-accent"
                      >
                        <option value="">Select a brand record</option>
                        {values.brand_id && !brands.some((brand) => String(brand.id) === values.brand_id) && (
                          <option value={values.brand_id}>Current linked brand · {values.brand || values.brand_id}</option>
                        )}
                        {brands.map((brand) => <option key={String(brand.id)} value={String(brand.id)}>{String(brand.brand_name ?? brand.id)}</option>)}
                      </select>
                    </div>
                  </div>
                  {values.brand_id ? (
                    <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground" role="status" data-testid="text-linked-brand-name">
                      Product brand name follows the selected record: <strong className="text-primary">{values.brand}</strong>
                    </p>
                  ) : (
                    <InputField
                      id="product-brand"
                      label="Brand name"
                      value={values.brand}
                      onChange={(value) => updateValue('brand', value)}
                      required
                      maxLength={100}
                      note={productId ? 'This existing product is not linked to a brand record. Choose one above to link it.' : 'Choose a brand record above to create a linked product.'}
                    />
                  )}
                  {brandsQuery.isError && (
                    <p className="flex flex-wrap items-center gap-2 text-[10px] font-semibold text-destructive" role="alert">
                      <span>Brand records could not be loaded.</span>
                      <button type="button" onClick={() => void brandsQuery.refetch()} className="underline underline-offset-2">Retry</button>
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <InputField
                    id="product-slug"
                    label="Product URL slug"
                    value={values.slug}
                    onChange={(value) => updateValue('slug', value)}
                    maxLength={180}
                    dir="ltr"
                    note={values.slug.trim() ? `${values.slug.length} / 180` : productId ? 'Blank keeps the current URL' : 'Generated when the product is first saved'}
                    placeholder={productId ? 'Existing product URL' : 'Generated from product name and SKU'}
                  />
                </div>
              </div>
            </EditorCard>

            <EditorCard>
              <SectionHeading
                eyebrow="02 · Product copy"
                title="Product description"
                description="Separate the short catalog summary from the full product details."
                icon={FileText}
              />
              <div className="space-y-5">
                <TextAreaField
                  id="product-short-description"
                  label="Short description"
                  value={values.short_description}
                  onChange={(value) => updateValue('short_description', value)}
                  rows={3}
                  maxLength={165}
                  note={`${values.short_description.length} / 165`}
                  helper="A concise summary used on catalog cards and as a search fallback."
                />
                <TextAreaField
                  id="product-long-description"
                  label="Full product description"
                  value={values.product_description}
                  onChange={(value) => updateValue('product_description', value)}
                  rows={10}
                  large
                  note={`${values.product_description.length.toLocaleString()} characters`}
                  helper="Use paragraphs to explain compatibility, included items, and verified product details."
                />
              </div>
            </EditorCard>
          </div>

          <aside className="space-y-5">
            <EditorCard>
              <SectionHeading
                eyebrow="03 · Pricing & stock"
                title="Pricing and inventory"
                description="Check the catalog price and available quantity before publishing."
                icon={Package}
              />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <InputField id="product-price" label="Regular price (USD)" value={values.regular_price} onChange={(value) => updateValue('regular_price', value)} type="number" step="0.01" min="0.01" required dir="ltr" />
                <InputField id="product-discount-price" label="Discount price (USD)" value={values.discount_price} onChange={(value) => updateValue('discount_price', value)} type="number" step="0.01" min="0" dir="ltr" />
                <InputField id="product-quantity" label="Quantity in stock" value={values.quantity} onChange={(value) => updateValue('quantity', value)} type="number" step="1" min="0" required dir="ltr" />
                <InputField id="product-weight" label="Product weight" value={values.product_weight} onChange={(value) => updateValue('product_weight', value)} type="number" step="0.001" min="0" dir="ltr" />
              </div>
              <div className="mt-4 border-t border-border pt-4">
                <TextAreaField
                  id="product-note"
                  label="Product note"
                  value={values.product_note}
                  onChange={(value) => updateValue('product_note', value)}
                  rows={3}
                  maxLength={255}
                  note={`${values.product_note.length} / 255`}
                  helper="Optional note shown with this catalog product."
                />
              </div>
            </EditorCard>

            <EditorCard>
              <SectionHeading
                eyebrow="04 · Search appearance"
                title="SEO and meta"
                description="Custom values override the storefront's generated search metadata."
                icon={Search}
              />
              <div className="space-y-4">
                <InputField
                  id="product-seo-title"
                  label="SEO title"
                  value={values.seo_title}
                  onChange={(value) => updateValue('seo_title', value)}
                  maxLength={255}
                  note={`${values.seo_title.length} / 60`}
                  placeholder={values.product_name || 'Search result title'}
                />
                <div className="h-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <div className={`h-full rounded-full ${values.seo_title.length <= 60 ? 'bg-accent' : 'bg-amber-500'}`} style={{ width: `${Math.min((values.seo_title.length / 60) * 100, 100)}%` }} />
                </div>
                <TextAreaField
                  id="product-meta-description"
                  label="Meta description"
                  value={values.meta_description}
                  onChange={(value) => updateValue('meta_description', value)}
                  rows={4}
                  maxLength={320}
                  note={`${values.meta_description.length} / 160`}
                  helper="Recommended length: about 120–160 characters. Leave blank to use the generated description."
                />
                <div className="h-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <div className={`h-full rounded-full ${values.meta_description.length <= 160 ? 'bg-accent' : 'bg-amber-500'}`} style={{ width: `${Math.min((values.meta_description.length / 160) * 100, 100)}%` }} />
                </div>
              </div>
            </EditorCard>

            <EditorCard>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Globe2 size={15} className="text-accent" />
                  <h2 className="text-xs font-extrabold text-primary">Search result preview</h2>
                </div>
                <span className="mono text-[8px] uppercase tracking-[.12em] text-muted-foreground">Google preview</span>
              </div>
              <div className="rounded-xl border border-border bg-background p-3.5">
                <p className="mono truncate text-[9px] text-muted-foreground">
                  CABL storefront / {values.slug.trim() || 'product-url'}
                </p>
                <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-[#1a5e27]" dir="auto">{displayedTitle}</p>
                <p className="mt-1.5 line-clamp-3 text-[11px] leading-5 text-muted-foreground" dir="auto">{displayedDescription}</p>
              </div>
              <p className="mt-3 text-[10px] leading-4 text-muted-foreground">
                {values.seo_title.trim() && values.meta_description.trim()
                  ? 'The storefront will use both custom values.'
                  : 'Missing custom values fall back to catalog copy and generated product metadata.'}
              </p>
            </EditorCard>

            <div className="flex items-start gap-2 rounded-xl border border-border bg-card px-4 py-3 text-[10px] leading-4 text-muted-foreground">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-accent" />
              <span>Search title and description are optional. Existing product pages keep their generated SEO when these fields are blank.</span>
            </div>
          </aside>
        </div>

        <div className="sticky bottom-0 z-20 -mx-4 flex flex-col-reverse gap-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:flex-row sm:justify-end md:-mx-10 md:px-10">
          {productId && (
            <button type="button" onClick={() => saveProduct(false)} disabled={isPending} data-testid="button-save-product-draft" className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 text-xs font-bold text-primary hover:bg-muted disabled:opacity-60">
              {isPending && priceIntent === false && <LoaderCircle size={14} className="animate-spin" />}
              Save as draft
            </button>
          )}
          <button type="submit" disabled={isPending} data-testid="button-publish-product" className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {isPending && priceIntent !== null && priceIntent === Boolean(productId) ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />}
            {!productId ? 'Create product draft' : values.published ? 'Save and publish changes' : 'Save and publish'}
          </button>
          <button type="button" onClick={leaveEditor} className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-primary">
            <ArrowLeft size={14} /> Cancel
          </button>
        </div>
      </form>

      {productId && productRow && renderRelatedRecords && (
        <div className="space-y-4" id="product-relationships">
          <div className="max-w-2xl">
            <p className="mono text-[9px] uppercase tracking-[.16em] text-accent">05 · Catalog connections</p>
            <h2 className="mt-1 text-lg font-extrabold tracking-[-.025em] text-primary">Categories, images, and specifications</h2>
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">Manage this product’s linked catalog records without changing its core product fields.</p>
          </div>
          {renderRelatedRecords(productRow, updateRequiredStatus, { selectedCategoryIds, categoryDirty })}
        </div>
      )}

      {!productId && (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-xs leading-5 text-muted-foreground">
          Save the product once to add its categories, tags, gallery images, and specifications.
        </div>
      )}
    </div>
  );
}