import { useMemo, useState, useEffect } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { Check, LoaderCircle, Plus, X } from 'lucide-react';
import {
  getGetAdminDashboardQueryKey,
  getListAdminRowsQueryKey,
  listAdminRows,
  useCreateAdminRow,
  useDeleteAdminRow,
  useListAdminRows,
  useUpdateAdminRow,
} from '@workspace/api-client-react';
import { ProductAttributeSetup } from '@/components/product-attribute-setup';
import { CategoryLinkedSpecifications } from '@/components/category-linked-specifications';

type Row = Record<string, unknown>;
type AttributeDefinition = Row & {
  id: string;
  attribute_name: string;
  type: string;
  unit?: string | null;
  is_global?: boolean;
  is_active?: boolean;
  sort_order?: number;
};
type CategoryAttributeAssignment = Row & {
  category_id: string;
  attribute_id: string;
  visible?: boolean;
  sort_order?: number;
  is_required?: boolean;
};
type ProductAttributeOption = {
  value: string;
};
type AttributeOptionState = {
  options: ProductAttributeOption[];
  ready: boolean;
  error?: string;
};
export type ProductRequiredAttributeStatus = {
  ready: boolean;
  missing: string[];
};

const rowValue = (row: Row, attribute: AttributeDefinition) => {
  if (attribute.type === 'number') return String(row.value_number ?? row.value_text ?? '');
  if (attribute.type === 'boolean') {
    if (row.value_boolean !== null && row.value_boolean !== undefined) return String(row.value_boolean);
    return String(row.value_text ?? '');
  }
  if (row.value_text !== null && row.value_text !== undefined) return String(row.value_text);
  if (row.value_number !== null && row.value_number !== undefined) return String(row.value_number);
  if (row.value_boolean !== null && row.value_boolean !== undefined) return String(row.value_boolean);
  return '';
};

function encodeAttributeValue(
  type: string,
  value: string,
  allowedOptions: ProductAttributeOption[] = [],
): { values?: Record<string, unknown>; error?: string } {
  const trimmed = value.trim();
  if (!trimmed) return { error: 'أدخل قيمة للمواصفة قبل الحفظ.' };
  if (type === 'number') {
    const number = Number(trimmed);
    if (!Number.isFinite(number)) return { error: 'أدخل رقمًا صالحًا.' };
    return { values: { value_text: null, value_number: number, value_boolean: null } };
  }
  if (type === 'boolean') {
    if (trimmed !== 'true' && trimmed !== 'false') return { error: 'اختر نعم أو لا.' };
    return { values: { value_text: null, value_number: null, value_boolean: trimmed === 'true' } };
  }
  if (type === 'select' && !allowedOptions.some((option) => option.value === trimmed)) {
    return { error: 'اختر قيمة من الخيارات المحددة لهذه المواصفة.' };
  }
  if (type === 'multiselect') {
    const selected = [...new Set(trimmed.split(',').map((part) => part.trim()).filter(Boolean))];
    if (!selected.length) return { error: 'اختر قيمة واحدة على الأقل.' };
    if (selected.some((value) => !allowedOptions.some((option) => option.value === value))) {
      return { error: 'اختر القيم من الخيارات المحددة لهذه المواصفة.' };
    }
    return { values: { value_text: selected.join(', '), value_number: null, value_boolean: null } };
  }
  return { values: { value_text: trimmed, value_number: null, value_boolean: null } };
}

function AttributeValueInput({
  type,
  value,
  onChange,
  id,
  options = [],
  disabled = false,
}: {
  type: string;
  value: string;
  onChange: (value: string) => void;
  id: string;
  options?: ProductAttributeOption[];
  disabled?: boolean;
}) {
  const className = 'focus-ring h-12 min-w-0 w-full rounded-2xl border border-border bg-background/80 px-3 text-sm font-medium shadow-sm outline-none transition-colors focus:border-accent';
  const selectedValues = value.split(',').map((part) => part.trim()).filter(Boolean);
  const visibleOptions = [
    ...options,
    ...selectedValues
      .filter((selected) => !options.some((option) => option.value === selected))
      .map((selected) => ({ value: selected })),
  ];
  if (type === 'boolean') {
    return (
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={className} dir="rtl" disabled={disabled}>
        <option value="">اختر قيمة</option>
        <option value="true">نعم</option>
        <option value="false">لا</option>
      </select>
    );
  }
  if (type === 'select') {
    return (
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={className} dir="rtl" disabled={disabled}>
        <option value="">اختر قيمة</option>
        {visibleOptions.map((option) => <option key={option.value} value={option.value}>{option.value}</option>)}
      </select>
    );
  }
  if (type === 'multiselect') {
    return (
      <div id={id} role="group" aria-label="القيم المتعددة" className="max-h-32 min-h-12 min-w-0 space-y-1 overflow-y-auto rounded-2xl border border-border bg-background/80 p-2">
        {visibleOptions.length ? visibleOptions.map((option) => {
          const checked = selectedValues.includes(option.value);
          return (
            <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-xs font-medium text-foreground hover:bg-muted">
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(event) => {
                  const next = event.target.checked
                    ? [...selectedValues, option.value]
                    : selectedValues.filter((selected) => selected !== option.value);
                  onChange(next.join(', '));
                }}
                className="accent-primary"
              />
              <span dir="auto">{option.value}</span>
            </label>
          );
        }) : <p className="px-1 text-[10px] leading-5 text-muted-foreground">أضف خيارات لهذه الخاصية أولًا.</p>}
      </div>
    );
  }
  return (
    <input
      id={id}
      type={type === 'number' ? 'number' : 'text'}
      step={type === 'number' ? 'any' : undefined}
      inputMode={type === 'number' ? 'decimal' : undefined}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={className}
      dir="auto"
      autoComplete="off"
      disabled={disabled}
    />
  );
}

function SpecificationRow({
  row,
  attribute,
  categoryWarning,
  required,
  optionState,
  saving,
  removing,
  onSave,
  onRemove,
}: {
  row: Row;
  attribute: AttributeDefinition;
  categoryWarning: boolean;
  required: boolean;
  optionState: AttributeOptionState;
  saving: boolean;
  removing: boolean;
  onSave: (row: Row, value: string) => void;
  onRemove: (row: Row, name: string) => void;
}) {
  const initialValue = rowValue(row, attribute);
  const [value, setValue] = useState(initialValue);
  const id = `input-product-attribute-${String(row.id)}`;

  useEffect(() => setValue(initialValue), [row.id, row.value_text, row.value_number, row.value_boolean, attribute.type]);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2" dir="rtl">
      <label htmlFor={id} className="flex min-h-12 min-w-0 flex-col justify-center rounded-2xl border border-border bg-background/75 px-3 py-1 text-sm font-semibold shadow-sm" dir="auto">
        <span className="truncate">{attribute.attribute_name || String(row.attribute_id ?? 'مواصفة')}</span>
        {required && <span className="text-[9px] font-bold leading-4 text-destructive">مطلوبة</span>}
        {categoryWarning && (
          <span className="text-[9px] font-semibold leading-4 text-amber-700">
            خارج تصنيفات المنتج الحالية · القيمة محفوظة
          </span>
        )}
      </label>
      <div className="relative min-w-0">
        <AttributeValueInput
          type={attribute.type}
          value={value}
          onChange={setValue}
          id={id}
          options={optionState.options}
          disabled={!optionState.ready}
        />
        {optionState.error && <span className="mt-1 block text-[9px] font-semibold text-destructive">{optionState.error}</span>}
        {attribute.unit && attribute.type !== 'boolean' && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[11px] font-semibold text-muted-foreground" dir="auto">
            {attribute.unit}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {value !== initialValue && (
          <button
            type="button"
            aria-label={`حفظ ${attribute.attribute_name}`}
            data-testid={`button-save-product-attribute-${String(row.id)}`}
            onClick={() => onSave(row, value)}
            disabled={saving || !optionState.ready}
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
          >
            {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />}
          </button>
        )}
        <button
          type="button"
          aria-label={`إزالة ${attribute.attribute_name}`}
          title="إزالة المواصفة"
          data-testid={`button-remove-product-attribute-${String(row.id)}`}
          onClick={() => onRemove(row, attribute.attribute_name)}
          disabled={removing}
          className="focus-ring flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
        >
          {removing ? <LoaderCircle size={16} className="animate-spin" /> : <X size={20} />}
        </button>
      </div>
    </div>
  );
}

export function ProductSpecificationsSection({
  productId,
  selectedCategoryIds,
  categoryDirty = false,
  onRequiredAttributesChange,
}: {
  productId: string;
  selectedCategoryIds?: string[];
  categoryDirty?: boolean;
  onRequiredAttributesChange?: (status: ProductRequiredAttributeStatus) => void;
}) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [newAttributeId, setNewAttributeId] = useState('');
  const [newValue, setNewValue] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const relationParams = useMemo(() => ({ filterColumn: 'product_id', filterValue: productId, limit: 100, offset: 0 }), [productId]);
  const categoryParams = useMemo(() => ({ filterColumn: 'product_id', filterValue: productId, limit: 100, offset: 0 }), [productId]);
  const attributeParams = useMemo(() => ({ limit: 100, offset: 0 }), []);
  const productAttributesQuery = useListAdminRows('product_attributes', relationParams, {
    query: { queryKey: getListAdminRowsQueryKey('product_attributes', relationParams) },
  });
  const productCategoriesQuery = useListAdminRows('product_categories', categoryParams, {
    query: { queryKey: getListAdminRowsQueryKey('product_categories', categoryParams) },
  });
  const attributesQuery = useListAdminRows('attributes', attributeParams, {
    query: { queryKey: getListAdminRowsQueryKey('attributes', attributeParams) },
  });
  const createRow = useCreateAdminRow();
  const updateRow = useUpdateAdminRow();
  const deleteRow = useDeleteAdminRow();
  const rows = (productAttributesQuery.data?.rows ?? []) as Row[];
  const categoryRows = (productCategoriesQuery.data?.rows ?? []) as Row[];
  const attributes = (attributesQuery.data?.rows ?? []) as AttributeDefinition[];
  const assignedCategoryIds = useMemo(
    () => new Set(
      categoryDirty && selectedCategoryIds
        ? selectedCategoryIds
        : categoryRows.map((row) => String(row.category_id ?? '')).filter(Boolean),
    ),
    [categoryDirty, selectedCategoryIds, categoryRows],
  );
  const orderedCategoryIds = useMemo(() => [...assignedCategoryIds].sort(), [assignedCategoryIds]);
  const categoryAssignmentQueries = useQueries({
    queries: orderedCategoryIds.map((categoryId) => {
      const params = { filterColumn: 'category_id', filterValue: categoryId, limit: 100, offset: 0 };
      return {
        queryKey: getListAdminRowsQueryKey('category_attributes', params),
        queryFn: ({ signal }: { signal: AbortSignal }) => listAdminRows('category_attributes', params, { signal }),
      };
    }),
  });
  const categoryAssignmentPageSpecs = categoryAssignmentQueries.flatMap((query, index) => {
    const total = query.data?.total ?? 0;
    const pages = [];
    for (let offset = 100; offset < total; offset += 100) {
      pages.push({ categoryId: orderedCategoryIds[index], offset });
    }
    return pages;
  });
  const categoryAssignmentPageQueries = useQueries({
    queries: categoryAssignmentPageSpecs.map(({ categoryId, offset }) => {
      const params = { filterColumn: 'category_id', filterValue: categoryId, limit: 100, offset };
      return {
        queryKey: getListAdminRowsQueryKey('category_attributes', params),
        queryFn: ({ signal }: { signal: AbortSignal }) => listAdminRows('category_attributes', params, { signal }),
      };
    }),
  });
  const allCategoryAssignmentQueries = [...categoryAssignmentQueries, ...categoryAssignmentPageQueries];
  const categoryAssignmentRows = allCategoryAssignmentQueries.flatMap(
    (query) => (query.data?.rows ?? []) as CategoryAttributeAssignment[],
  );
  const categoryAssignmentLoading = allCategoryAssignmentQueries.some((query) => query.isFetching);
  const categoryAssignmentLoadError = allCategoryAssignmentQueries.some((query) => query.isError);
  const attributesById = useMemo(() => new Map(attributes.map((attribute) => [String(attribute.id), attribute])), [attributes]);
  const assignmentsByAttributeId = useMemo(() => {
    const grouped = new Map<string, CategoryAttributeAssignment[]>();
    for (const assignment of categoryAssignmentRows) {
      const id = String(assignment.attribute_id);
      grouped.set(id, [...(grouped.get(id) ?? []), assignment]);
    }
    return grouped;
  }, [categoryAssignmentRows]);
  const attachedIds = new Set(rows.map((row) => String(row.attribute_id)));
  const matchingAssignments = (attributeId: string) => (assignmentsByAttributeId.get(attributeId) ?? [])
    .filter((assignment) => assignedCategoryIds.has(String(assignment.category_id)) && assignment.visible !== false);
  const attributeSortOrder = (attribute: AttributeDefinition) => {
    const assignedOrders = matchingAssignments(String(attribute.id))
      .map((assignment) => Number(assignment.sort_order))
      .filter(Number.isFinite);
    return assignedOrders.length ? Math.min(...assignedOrders) : Number(attribute.sort_order ?? 0);
  };
  const eligibleAttributes = attributes
    .filter((attribute) => {
      const assignedToProductCategory = attribute.is_global === true
        || matchingAssignments(String(attribute.id)).length > 0;
      return attribute.is_active !== false && assignedToProductCategory;
    })
    .sort((left, right) => attributeSortOrder(left) - attributeSortOrder(right)
      || left.attribute_name.localeCompare(right.attribute_name, 'ar'));
  const availableAttributes = eligibleAttributes.filter((attribute) => !attachedIds.has(String(attribute.id)));
  const selectedAttribute = availableAttributes.find((attribute) => String(attribute.id) === newAttributeId);
  const optionAttributeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const row of rows) {
      const id = String(row.attribute_id ?? '');
      if (['select', 'multiselect'].includes(attributesById.get(id)?.type ?? '')) ids.add(id);
    }
    if (selectedAttribute && ['select', 'multiselect'].includes(selectedAttribute.type)) {
      ids.add(String(selectedAttribute.id));
    }
    return [...ids].filter(Boolean).sort();
  }, [rows, attributesById, selectedAttribute?.id, selectedAttribute?.type]);
  const optionQueries = useQueries({
    queries: optionAttributeIds.map((attributeId) => {
      const params = { filterColumn: 'attribute_id', filterValue: attributeId, limit: 100, offset: 0 };
      return {
        queryKey: getListAdminRowsQueryKey('attribute_values', params),
        queryFn: ({ signal }: { signal: AbortSignal }) => listAdminRows('attribute_values', params, { signal }),
      };
    }),
  });
  const optionPageSpecs = optionQueries.flatMap((query, index) => {
    const total = query.data?.total ?? 0;
    const pages = [];
    for (let offset = 100; offset < total; offset += 100) {
      pages.push({ attributeId: optionAttributeIds[index], offset });
    }
    return pages;
  });
  const optionPageQueries = useQueries({
    queries: optionPageSpecs.map(({ attributeId, offset }) => {
      const params = { filterColumn: 'attribute_id', filterValue: attributeId, limit: 100, offset };
      return {
        queryKey: getListAdminRowsQueryKey('attribute_values', params),
        queryFn: ({ signal }: { signal: AbortSignal }) => listAdminRows('attribute_values', params, { signal }),
      };
    }),
  });
  const optionsByAttributeId = new Map<string, AttributeOptionState>();
  optionAttributeIds.forEach((attributeId, index) => {
    const query = optionQueries[index];
    const pageQueries = optionPageSpecs
      .map((spec, pageIndex) => spec.attributeId === attributeId ? optionPageQueries[pageIndex] : undefined)
      .filter((pageQuery) => pageQuery !== undefined);
    const relatedQueries = [query, ...pageQueries];
    const optionRows = relatedQueries.flatMap((optionQuery) => (optionQuery?.data?.rows ?? []) as Row[]);
    const values = [...new Set(optionRows.map((row) => String(row.attribute_value ?? '')).filter(Boolean))];
    const queryFailed = relatedQueries.some((optionQuery) => optionQuery?.isError);
    const queryPending = relatedQueries.some((optionQuery) => !optionQuery?.data || optionQuery.isFetching);
    optionsByAttributeId.set(attributeId, {
      options: values.map((value) => ({ value })),
      ready: !queryPending && !queryFailed,
      error: queryFailed
        ? 'تعذر تحميل خيارات هذه الخاصية.'
        : undefined,
    });
  });
  const defaultOptionState: AttributeOptionState = { options: [], ready: true };
  const optionStateFor = (attribute?: AttributeDefinition) => {
    if (!attribute || !['select', 'multiselect'].includes(attribute.type)) return defaultOptionState;
    return optionsByAttributeId.get(String(attribute.id)) ?? { options: [], ready: false };
  };
  const requiredAssignmentSignature = categoryAssignmentRows
    .filter((assignment) => assignedCategoryIds.has(String(assignment.category_id))
      && assignment.visible !== false
      && assignment.is_required === true)
    .map((assignment) => String(assignment.attribute_id))
    .sort()
    .join('|');
  const requiredAttributeIds = useMemo(
    () => new Set(requiredAssignmentSignature.split('|').filter(Boolean)),
    [requiredAssignmentSignature],
  );
  const missingRequiredAttributes = useMemo(
    () => [...requiredAttributeIds]
      .filter((attributeId) => {
        const row = rows.find((candidate) => String(candidate.attribute_id) === attributeId);
        const attribute = attributesById.get(attributeId) ?? {
          id: attributeId,
          attribute_name: 'مواصفة مطلوبة',
          type: 'text',
        };
        return !row || !rowValue(row, attribute).trim();
      })
      .map((attributeId) => attributesById.get(attributeId)?.attribute_name ?? 'مواصفة مطلوبة'),
    [requiredAttributeIds, rows, attributesById],
  );
  const incompleteAdminRows = [productAttributesQuery, productCategoriesQuery, attributesQuery].some(
    (query) => query.data && query.data.rows.length < query.data.total,
  );
  const dataReady = !productAttributesQuery.isFetching
    && !productCategoriesQuery.isFetching
    && !attributesQuery.isFetching
    && !categoryAssignmentLoading
    && !productAttributesQuery.isError
    && !productCategoriesQuery.isError
    && !attributesQuery.isError
    && !categoryAssignmentLoadError
    && !incompleteAdminRows;
  const missingRequiredSignature = missingRequiredAttributes.join('\u0000');
  const requiredStatus = useMemo(
    () => ({
      ready: dataReady,
      missing: dataReady ? missingRequiredAttributes : [],
    }),
    [dataReady, missingRequiredSignature],
  );
  useEffect(() => {
    onRequiredAttributesChange?.(requiredStatus);
  }, [onRequiredAttributesChange, requiredStatus]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: getListAdminRowsQueryKey('product_attributes') });
    void queryClient.invalidateQueries({ queryKey: getListAdminRowsQueryKey('attributes') });
    void queryClient.invalidateQueries({ queryKey: getListAdminRowsQueryKey('category_attributes') });
    void queryClient.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
  };

  const saveExisting = (row: Row, value: string) => {
    const attribute = attributesById.get(String(row.attribute_id));
    if (!attribute) {
      setError('تعذر العثور على تعريف هذه المواصفة.');
      return;
    }
    const options = optionStateFor(attribute);
    if (!options.ready) {
      setError(options.error ?? 'انتظر تحميل خيارات هذه الخاصية.');
      return;
    }
    const encoded = encodeAttributeValue(attribute.type, value, options.options);
    if (!encoded.values) {
      setError(encoded.error ?? 'تحقق من قيمة المواصفة.');
      return;
    }
    setError('');
    updateRow.mutate(
      { table: 'product_attributes', id: String(row.id), data: { values: encoded.values } },
      {
        onSuccess: () => {
          setNotice('تم حفظ المواصفة.');
          refresh();
        },
        onError: () => setError('تعذر حفظ المواصفة. لم يتم تغييرها.'),
      },
    );
  };

  const removeExisting = (row: Row, name: string) => {
    if (!window.confirm(`إزالة مواصفة ${name} من المنتج؟`)) return;
    setError('');
    deleteRow.mutate(
      { table: 'product_attributes', id: String(row.id) },
      {
        onSuccess: () => {
          setNotice('تمت إزالة المواصفة.');
          refresh();
        },
        onError: () => setError('تعذر إزالة المواصفة. لم يتم تغييرها.'),
      },
    );
  };

  const addAttribute = () => {
    if (!selectedAttribute) {
      setError('اختر مواصفة أولًا.');
      return;
    }
    const options = optionStateFor(selectedAttribute);
    if (!options.ready) {
      setError(options.error ?? 'انتظر تحميل خيارات هذه الخاصية.');
      return;
    }
    if (['select', 'multiselect'].includes(selectedAttribute.type) && options.options.length === 0) {
      setError('أضف خيارات مسموحة لهذه الخاصية قبل استخدامها.');
      return;
    }
    const encoded = encodeAttributeValue(selectedAttribute.type, newValue, options.options);
    if (!encoded.values) {
      setError(encoded.error ?? 'تحقق من قيمة المواصفة.');
      return;
    }
    setError('');
    createRow.mutate(
      {
        table: 'product_attributes',
        data: {
          values: {
            product_id: productId,
            attribute_id: selectedAttribute.id,
            ...encoded.values,
          },
        },
      },
      {
        onSuccess: () => {
          setAdding(false);
          setNewAttributeId('');
          setNewValue('');
          setNotice('تمت إضافة المواصفة.');
          refresh();
        },
        onError: () => setError('تعذرت إضافة المواصفة. تحقق من عدم وجودها مسبقًا.'),
      },
    );
  };

  return (
    <section className="rounded-2xl border border-border bg-background/55 p-4 sm:p-5" data-testid="section-product-specifications">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Product details</p>
          <h4 className="mt-1 text-base font-extrabold text-primary" dir="rtl">المواصفات</h4>
          <p className="mt-1 max-w-xl text-[11px] leading-5 text-muted-foreground" dir="rtl">
            تظهر خصائص التصنيفات المرتبطة بالمنتج. لا تصبح الخاصية عامة إلا عند تفعيل ذلك صراحةً؛ تغيير التصنيف لا يحذف القيم المحفوظة.
          </p>
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold text-secondary-foreground" data-testid="text-product-specification-count">
          {rows.length}
        </span>
      </div>

      {productAttributesQuery.isFetching
        || productCategoriesQuery.isFetching
        || attributesQuery.isFetching
        || categoryAssignmentLoading ? (
        <div className="space-y-2" aria-label="تحميل المواصفات">
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-12 w-full" />
        </div>
      ) : productAttributesQuery.isError
        || productCategoriesQuery.isError
        || attributesQuery.isError
        || categoryAssignmentLoadError
        || incompleteAdminRows ? (
        <p className="rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-xs font-semibold text-destructive" role="alert">
          تعذر تحميل جميع مواصفات المنتج أو روابط التصنيفات. لم يتم إخفاء القيم المحفوظة.
        </p>
      ) : rows.length === 0 && !adding ? (
        <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          لا توجد مواصفات لهذا المنتج بعد. اختر «إضافة مواصفة» لإعداد خاصية للتصنيف ثم أضف قيمتها هنا.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => {
            const attribute = attributesById.get(String(row.attribute_id));
            const fallback: AttributeDefinition = {
              id: String(row.attribute_id ?? ''),
              attribute_name: String(row.attribute_id ?? 'مواصفة'),
              type: 'text',
            };
            return (
              <SpecificationRow
                key={String(row.id)}
                row={row}
                attribute={attribute ?? fallback}
                categoryWarning={Boolean(attribute && attribute.is_global !== true && matchingAssignments(String(attribute.id)).length === 0)}
                required={requiredAttributeIds.has(String(row.attribute_id))}
                optionState={optionStateFor(attribute ?? fallback)}
                saving={updateRow.isPending}
                removing={deleteRow.isPending}
                onSave={saveExisting}
                onRemove={removeExisting}
              />
            );
          })}

          {adding && (
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2 border-t border-border pt-3" dir="rtl">
              <label htmlFor="select-product-attribute-name" className="sr-only">اسم المواصفة</label>
              <select
                id="select-product-attribute-name"
                data-testid="select-product-attribute-name"
                value={newAttributeId}
                onChange={(event) => {
                  setNewAttributeId(event.target.value);
                  setNewValue('');
                }}
                className="focus-ring h-12 min-w-0 w-full rounded-2xl border border-border bg-background px-3 text-sm font-medium outline-none focus:border-accent"
              >
                <option value="">اختر المواصفة</option>
                {availableAttributes.map((attribute) => (
                  <option key={String(attribute.id)} value={String(attribute.id)}>
                    {attribute.attribute_name}{attribute.unit ? ` · ${attribute.unit}` : ''}
                  </option>
                ))}
              </select>
              {availableAttributes.length === 0 && (
                <p className="col-span-full text-[10px] font-semibold leading-5 text-muted-foreground" dir="rtl">
                  {assignedCategoryIds.size === 0
                    ? 'اربط المنتج بتصنيف أولًا؛ ستظهر هنا الخصائص المرتبطة بذلك التصنيف.'
                    : eligibleAttributes.length === 0
                      ? 'لا توجد خصائص مرتبطة بتصنيفات المنتج. أضف الربط من شاشة «خصائص التصنيفات».'
                      : 'أُضيفت جميع الخصائص المتاحة لهذا المنتج.'}
                </p>
              )}
              <div className="relative min-w-0">
                {selectedAttribute ? (
                  <>
                    <AttributeValueInput
                      type={selectedAttribute.type}
                      value={newValue}
                      onChange={setNewValue}
                      id="input-new-product-attribute-value"
                      options={optionStateFor(selectedAttribute).options}
                      disabled={!optionStateFor(selectedAttribute).ready}
                    />
                    {selectedAttribute.unit && selectedAttribute.type !== 'boolean' && selectedAttribute.type !== 'multiselect' && (
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[11px] font-semibold text-muted-foreground" dir="auto">
                        {selectedAttribute.unit}
                      </span>
                    )}
                  </>
                ) : (
                  <div className="flex h-12 items-center rounded-2xl border border-dashed border-border px-3 text-xs text-muted-foreground">القيمة</div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="حفظ المواصفة الجديدة"
                  data-testid="button-create-product-attribute"
                  onClick={addAttribute}
                  disabled={createRow.isPending
                    || !optionStateFor(selectedAttribute).ready
                    || (['select', 'multiselect'].includes(selectedAttribute?.type ?? '')
                      && optionStateFor(selectedAttribute).options.length === 0)}
                  className="focus-ring flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
                >
                  {createRow.isPending ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />}
                </button>
                <button
                  type="button"
                  aria-label="إلغاء إضافة المواصفة"
                  onClick={() => {
                    setAdding(false);
                    setNewAttributeId('');
                    setNewValue('');
                    setError('');
                  }}
                  className="focus-ring flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <CategoryLinkedSpecifications
        productId={productId}
        categoryIds={orderedCategoryIds}
        genericAttributeSlugs={eligibleAttributes.map((attribute) => String(attribute.slug ?? ''))}
      />

      {setupOpen && (
        <ProductAttributeSetup
          categoryIds={orderedCategoryIds}
          attributes={attributes}
          assignments={categoryAssignmentRows}
          ready={dataReady}
          onReady={(attributeId) => {
            setSetupOpen(false);
            setError('');
            if (attachedIds.has(attributeId)) {
              setNotice('تم ربط الخاصية بالتصنيف. بقيت قيمة المنتج المحفوظة كما هي.');
            } else {
              setNewAttributeId(attributeId);
              setNewValue('');
              setAdding(true);
              setNotice('تم إعداد الخاصية. اختر قيمتها ثم احفظها لهذا المنتج.');
            }
          }}
          onCancel={(partiallyCreatedName) => {
            setSetupOpen(false);
            if (partiallyCreatedName) {
              setNotice(`تم حفظ تعريف «${partiallyCreatedName}» دون إكمال ربطه. يمكنك اختيار «ربط خاصية موجودة» لاحقًا.`);
            }
          }}
        />
      )}

      {dataReady && missingRequiredAttributes.length > 0 && (
        <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs font-semibold text-amber-900" role="status" data-testid="status-required-product-attributes">
          أكمل المواصفات المطلوبة قبل نشر المنتج: {missingRequiredAttributes.join('، ')}
        </p>
      )}
      {error && <p className="mt-3 rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs font-semibold text-destructive" role="alert" data-testid="status-product-attribute-error">{error}</p>}
      {notice && !error && <p className="mt-3 text-xs font-semibold text-secondary-foreground" role="status" data-testid="status-product-attribute-notice">{notice}</p>}

      {!adding && !setupOpen && dataReady && assignedCategoryIds.size > 0 && (
        <div className="mt-4 flex flex-wrap gap-2" dir="rtl">
          <button
            type="button"
            data-testid="button-add-product-attribute"
            onClick={() => {
              if (availableAttributes.length > 0) setAdding(true);
              else setSetupOpen(true);
              setError('');
              setNotice('');
            }}
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-secondary px-4 text-sm font-bold text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            <Plus size={18} />
            إضافة مواصفة
          </button>
          {availableAttributes.length > 0 && (
            <button
              type="button"
              data-testid="button-setup-category-attribute"
              onClick={() => {
                setSetupOpen(true);
                setError('');
                setNotice('');
              }}
              className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-background px-4 text-xs font-bold text-primary hover:bg-muted"
            >
              إنشاء أو ربط خاصية للتصنيف
            </button>
          )}
        </div>
      )}
      {!adding && !setupOpen && dataReady && availableAttributes.length === 0 && (
        <p className="mt-3 text-xs text-muted-foreground" dir="rtl">
          {assignedCategoryIds.size === 0
            ? 'اختر تصنيفًا للمنتج أولًا لتتمكن من إضافة مواصفة.'
            : eligibleAttributes.length === 0
              ? 'لم تُربط خصائص بهذا التصنيف بعد. اضغط «إضافة مواصفة» لإنشاء خاصية أو ربط خاصية موجودة.'
              : 'كل خصائص هذا التصنيف مستخدمة بالفعل. يمكنك إنشاء خاصية جديدة أو ربط خاصية أخرى من زر «إضافة مواصفة».'}
        </p>
      )}
    </section>
  );
}