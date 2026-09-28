import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, FolderTree, LoaderCircle, RefreshCw, Search } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getListAdminRowsQueryKey,
  useCreateAdminRow,
  useDeleteAdminRow,
  useListAdminRows,
} from '@workspace/api-client-react';

type Row = Record<string, unknown>;

export function ProductCategoriesSection({
  productId,
  selectedCategoryIds,
  onSelectedCategoryIdsChange,
  onDirtyChange,
  onSaveComplete,
  disabled = false,
}: {
  productId?: string;
  selectedCategoryIds: string[];
  onSelectedCategoryIdsChange: (ids: string[]) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onSaveComplete?: () => void;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [sectionError, setSectionError] = useState('');
  const [sectionNotice, setSectionNotice] = useState('');
  const [persistedCategoryIds, setPersistedCategoryIds] = useState<string[]>([]);
  const initializedProductId = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const categoryParams = useMemo(() => ({
    search: search.trim() || undefined,
    limit: 100,
    offset: 0,
  }), [search]);
  const relationParams = useMemo(() => ({
    filterColumn: 'product_id',
    filterValue: productId ?? '',
    limit: 100,
    offset: 0,
  }), [productId]);
  const categoriesQuery = useListAdminRows('categories', categoryParams, {
    query: { queryKey: getListAdminRowsQueryKey('categories', categoryParams) },
  });
  const relationsQuery = useListAdminRows('product_categories', relationParams, {
    query: {
      enabled: Boolean(productId),
      queryKey: getListAdminRowsQueryKey('product_categories', relationParams),
    },
  });
  const createRelation = useCreateAdminRow();
  const deleteRelation = useDeleteAdminRow();
  const categories = (categoriesQuery.data?.rows ?? []) as Row[];
  const linkedCategoryIds = useMemo(
    () => (relationsQuery.data?.rows ?? []).map((row) => String(row.category_id ?? '')).filter(Boolean),
    [relationsQuery.data?.rows],
  );
  const selectedSet = useMemo(() => new Set(selectedCategoryIds), [selectedCategoryIds]);

  useEffect(() => {
    if (
      !productId
      || relationsQuery.isFetching
      || relationsQuery.isError
      || initializedProductId.current === productId
    ) return;

    const persistedIds = [...new Set(linkedCategoryIds)];
    const params = new URLSearchParams(window.location.search);
    const categoryDraftIds = params.has('categoryDraft')
      ? String(params.get('categoryDraft') ?? '').split(',').filter(Boolean)
      : null;
    onSelectedCategoryIdsChange(categoryDraftIds ?? persistedIds);
    setPersistedCategoryIds(persistedIds);
    initializedProductId.current = productId;
    if (categoryDraftIds !== null) {
      setSectionError('Some category changes did not finish. Review this selection and save it again.');
    }
  }, [linkedCategoryIds, onSelectedCategoryIdsChange, productId, relationsQuery.isError, relationsQuery.isFetching]);

  const toggleCategory = (categoryId: string) => {
    setSectionError('');
    setSectionNotice('');
    const next = selectedSet.has(categoryId)
      ? selectedCategoryIds.filter((id) => id !== categoryId)
      : [...selectedCategoryIds, categoryId];
    onSelectedCategoryIdsChange(next);
    if (!productId) return;
    setSectionNotice('Category changes are staged. Save them when the selection is ready.');
  };

  const isLoading = categoriesQuery.isLoading || Boolean(productId && relationsQuery.isLoading);
  const isSaving = disabled || createRelation.isPending || deleteRelation.isPending;
  const hasCategoryError = categoriesQuery.isError || Boolean(productId && relationsQuery.isError);
  const categorySelectionDirty = productId
    ? persistedCategoryIds.length !== selectedCategoryIds.length
      || persistedCategoryIds.some((id) => !selectedSet.has(id))
    : selectedCategoryIds.length > 0;

  useEffect(() => {
    onDirtyChange?.(Boolean(categorySelectionDirty));
  }, [categorySelectionDirty, onDirtyChange]);

  const saveCategoryChanges = () => {
    if (!productId || !categorySelectionDirty) return;
    setSectionError('');
    setSectionNotice('');
    const operations = [
      ...selectedCategoryIds
        .filter((id) => !persistedCategoryIds.includes(id))
        .map((categoryId) => ({
          kind: 'add' as const,
          categoryId,
          promise: createRelation.mutateAsync({
            table: 'product_categories',
            data: { values: { product_id: productId, category_id: categoryId } },
          }),
        })),
      ...persistedCategoryIds
        .filter((id) => !selectedSet.has(id))
        .map((categoryId) => ({
          kind: 'remove' as const,
          categoryId,
          promise: deleteRelation.mutateAsync({
            table: 'product_categories',
            id: `category_id=${categoryId}|product_id=${productId}`,
          }),
        })),
    ];

    Promise.allSettled(operations.map((operation) => operation.promise)).then((results) => {
      const nextPersistedIds = new Set(persistedCategoryIds);
      let failed = 0;
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          failed += 1;
          return;
        }
        const operation = operations[index];
        if (operation.kind === 'add') nextPersistedIds.add(operation.categoryId);
        else nextPersistedIds.delete(operation.categoryId);
      });
      setPersistedCategoryIds([...nextPersistedIds]);
      if (failed) {
        setSectionError(`${failed} category change${failed === 1 ? '' : 's'} failed. The saved links were not fully changed.`);
        updateCategoryDraftSearch(selectedCategoryIds);
      } else {
        setSectionNotice('Category changes saved. Attribute options will follow these categories.');
        updateCategoryDraftSearch(null);
        onSaveComplete?.();
      }
      void queryClient.invalidateQueries({ queryKey: getListAdminRowsQueryKey('product_categories', relationParams) });
    });
  };

  function updateCategoryDraftSearch(draftIds: string[] | null) {
    const url = new URL(window.location.href);
    if (draftIds === null) {
      url.searchParams.delete('categoryDraft');
      url.searchParams.delete('categoryWarning');
    } else {
      url.searchParams.set('categoryDraft', draftIds.join(','));
    }
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }

  return (
    <section className="cabl-card overflow-hidden" data-testid="section-product-categories">
      <div className="border-b border-border bg-[hsl(var(--secondary)/.28)] px-5 py-5 md:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
              <FolderTree size={18} />
            </span>
            <div>
              <p className="mono text-[9px] font-semibold uppercase tracking-[.16em] text-accent">Required setup</p>
              <h2 className="mt-1 text-base font-extrabold tracking-[-.02em] text-primary">Product categories</h2>
              <p className="mt-1.5 max-w-2xl text-xs leading-5 text-muted-foreground">
                Select every category that describes this product. These choices control the attribute picker below.
              </p>
            </div>
          </div>
          <span className="mono shrink-0 rounded-full bg-card px-2.5 py-1 text-[10px] font-bold text-primary" data-testid="text-product-category-count">
            {selectedCategoryIds.length} selected
          </span>
        </div>
        <div className="relative mt-5 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            data-testid="input-product-category-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search category records"
            className="focus-ring h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-xs outline-none placeholder:text-muted-foreground focus:border-accent"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-2 p-5 sm:grid-cols-2" aria-label="Loading categories">
          <div className="skeleton h-14 rounded-xl" />
          <div className="skeleton h-14 rounded-xl" />
          <div className="skeleton h-14 rounded-xl" />
          <div className="skeleton h-14 rounded-xl" />
        </div>
      ) : hasCategoryError ? (
        <div className="m-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-xs font-semibold text-destructive" role="alert">
          <span>Categories could not be loaded. Existing category links remain untouched.</span>
          <button
            type="button"
            data-testid="button-retry-product-categories"
            onClick={() => {
              void categoriesQuery.refetch();
              if (productId) void relationsQuery.refetch();
            }}
            className="focus-ring inline-flex h-8 items-center gap-1.5 rounded-lg border border-destructive/30 px-2.5 text-[10px] font-bold hover:bg-destructive/10"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      ) : categories.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <FolderTree size={21} className="mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm font-bold text-primary">No category records found</p>
          <p className="mt-1.5 text-xs text-muted-foreground">Clear the search or add categories before creating this product.</p>
        </div>
      ) : (
        <div className="grid gap-2 p-5 sm:grid-cols-2">
          {categories.map((category) => {
            const id = String(category.id);
            const checked = selectedSet.has(id);
            return (
              <label
                key={id}
                data-testid={`option-product-category-${id}`}
                className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors ${checked ? 'border-accent/50 bg-accent/10' : 'border-border bg-card hover:bg-muted/50'} ${isSaving ? 'pointer-events-none opacity-65' : ''}`}
              >
                <input
                  type="checkbox"
                  data-testid={`checkbox-product-category-${id}`}
                  checked={checked}
                  disabled={isSaving}
                  onChange={() => toggleCategory(id)}
                  className="h-4 w-4 accent-[hsl(var(--accent))]"
                />
                <span className="min-w-0 flex-1" dir="auto">
                  <span className="block truncate text-sm font-bold text-primary">{String(category.category_name ?? id)}</span>
                  <span className="mono mt-0.5 block truncate text-[9px] text-muted-foreground">{String(category.slug ?? id)}</span>
                </span>
                {checked && <Check size={16} className="shrink-0 text-accent" />}
              </label>
            );
          })}
        </div>
      )}

      {selectedCategoryIds.length === 0 && !isLoading && !hasCategoryError && (
        <p className="mx-5 mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs font-semibold text-amber-900" role="status" data-testid="status-product-category-required">
          {productId
            ? 'No categories are assigned. Add a category to enable category-specific product attributes.'
            : 'Choose at least one category before the first save.'}
        </p>
      )}
      {sectionError && <p className="mx-5 mb-5 rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-xs font-semibold text-destructive" role="alert" data-testid="status-product-category-error">{sectionError}</p>}
      {sectionNotice && !sectionError && (
        <p className="mx-5 mb-5 flex items-center gap-2 text-xs font-semibold text-secondary-foreground" role="status" data-testid="status-product-category-notice">
          <Check size={14} /> {sectionNotice}
        </p>
      )}
      {productId && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
          <p className="flex items-center gap-2 text-[10px] leading-4 text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Category links are saved separately from product fields.
          </p>
          {categorySelectionDirty && (
            <button
              type="button"
              data-testid="button-save-product-categories"
              onClick={saveCategoryChanges}
              disabled={isSaving}
              className="focus-ring inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-[10px] font-bold text-primary-foreground disabled:opacity-60"
            >
              {isSaving && <LoaderCircle size={13} className="animate-spin" />}
              Save category changes
            </button>
          )}
        </div>
      )}
    </section>
  );
}