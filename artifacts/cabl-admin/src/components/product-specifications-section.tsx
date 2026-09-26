import { useMemo, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, LoaderCircle, Plus, X } from 'lucide-react';
import {
  getGetAdminDashboardQueryKey,
  getListAdminRowsQueryKey,
  useCreateAdminRow,
  useDeleteAdminRow,
  useListAdminRows,
  useUpdateAdminRow,
} from '@workspace/api-client-react';

type Row = Record<string, unknown>;
type AttributeDefinition = Row & {
  id: string;
  attribute_name: string;
  type: string;
  unit?: string | null;
  is_active?: boolean;
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

function encodeAttributeValue(type: string, value: string): { values?: Record<string, unknown>; error?: string } {
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
  return { values: { value_text: trimmed, value_number: null, value_boolean: null } };
}

function AttributeValueInput({
  type,
  value,
  onChange,
  id,
}: {
  type: string;
  value: string;
  onChange: (value: string) => void;
  id: string;
}) {
  const className = 'focus-ring h-12 min-w-0 w-full rounded-2xl border border-border bg-background/80 px-3 text-sm font-medium shadow-sm outline-none transition-colors focus:border-accent';
  if (type === 'boolean') {
    return (
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={className} dir="rtl">
        <option value="">اختر قيمة</option>
        <option value="true">نعم</option>
        <option value="false">لا</option>
      </select>
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
    />
  );
}

function SpecificationRow({
  row,
  attribute,
  saving,
  removing,
  onSave,
  onRemove,
}: {
  row: Row;
  attribute: AttributeDefinition;
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
      <label htmlFor={id} className="flex min-h-12 min-w-0 items-center rounded-2xl border border-border bg-background/75 px-3 text-sm font-semibold shadow-sm" dir="auto">
        <span className="truncate">{attribute.attribute_name || String(row.attribute_id ?? 'مواصفة')}</span>
      </label>
      <div className="relative min-w-0">
        <AttributeValueInput type={attribute.type} value={value} onChange={setValue} id={id} />
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
            disabled={saving}
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

export function ProductSpecificationsSection({ productId }: { productId: string }) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newAttributeId, setNewAttributeId] = useState('');
  const [newValue, setNewValue] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const relationParams = useMemo(() => ({ filterColumn: 'product_id', filterValue: productId, limit: 100, offset: 0 }), [productId]);
  const attributeParams = useMemo(() => ({ limit: 100, offset: 0 }), []);
  const productAttributesQuery = useListAdminRows('product_attributes', relationParams, {
    query: { queryKey: getListAdminRowsQueryKey('product_attributes', relationParams) },
  });
  const attributesQuery = useListAdminRows('attributes', attributeParams, {
    query: { queryKey: getListAdminRowsQueryKey('attributes', attributeParams) },
  });
  const createRow = useCreateAdminRow();
  const updateRow = useUpdateAdminRow();
  const deleteRow = useDeleteAdminRow();
  const rows = (productAttributesQuery.data?.rows ?? []) as Row[];
  const attributes = (attributesQuery.data?.rows ?? []) as AttributeDefinition[];
  const attributesById = useMemo(() => new Map(attributes.map((attribute) => [String(attribute.id), attribute])), [attributes]);
  const attachedIds = new Set(rows.map((row) => String(row.attribute_id)));
  const availableAttributes = attributes
    .filter((attribute) => attribute.is_active !== false && !attachedIds.has(String(attribute.id)))
    .sort((left, right) => left.attribute_name.localeCompare(right.attribute_name, 'ar'));
  const selectedAttribute = availableAttributes.find((attribute) => String(attribute.id) === newAttributeId);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: getListAdminRowsQueryKey('product_attributes') });
    void queryClient.invalidateQueries({ queryKey: getListAdminRowsQueryKey('attributes') });
    void queryClient.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
  };

  const saveExisting = (row: Row, value: string) => {
    const attribute = attributesById.get(String(row.attribute_id));
    if (!attribute) {
      setError('تعذر العثور على تعريف هذه المواصفة.');
      return;
    }
    const encoded = encodeAttributeValue(attribute.type, value);
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
    const encoded = encodeAttributeValue(selectedAttribute.type, newValue);
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
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold text-secondary-foreground" data-testid="text-product-specification-count">
          {rows.length}
        </span>
      </div>

      {productAttributesQuery.isLoading || attributesQuery.isLoading ? (
        <div className="space-y-2" aria-label="تحميل المواصفات">
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-12 w-full" />
        </div>
      ) : productAttributesQuery.isError || attributesQuery.isError ? (
        <p className="rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-xs font-semibold text-destructive" role="alert">
          تعذر تحميل مواصفات المنتج.
        </p>
      ) : rows.length === 0 && !adding ? (
        <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          لا توجد مواصفات لهذا المنتج بعد.
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
              <div className="relative min-w-0">
                {selectedAttribute ? (
                  <>
                    <AttributeValueInput
                      type={selectedAttribute.type}
                      value={newValue}
                      onChange={setNewValue}
                      id="input-new-product-attribute-value"
                    />
                    {selectedAttribute.unit && selectedAttribute.type !== 'boolean' && (
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
                  disabled={createRow.isPending}
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

      {error && <p className="mt-3 rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs font-semibold text-destructive" role="alert" data-testid="status-product-attribute-error">{error}</p>}
      {notice && !error && <p className="mt-3 text-xs font-semibold text-secondary-foreground" role="status" data-testid="status-product-attribute-notice">{notice}</p>}

      {!adding && availableAttributes.length > 0 && (
        <button
          type="button"
          data-testid="button-add-product-attribute"
          onClick={() => {
            setAdding(true);
            setError('');
            setNotice('');
          }}
          className="focus-ring mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-secondary px-4 text-sm font-bold text-secondary-foreground transition-colors hover:bg-secondary/80"
          dir="rtl"
        >
          <Plus size={18} />
          إضافة مواصفة
        </button>
      )}
      {!adding && availableAttributes.length === 0 && rows.length > 0 && (
        <p className="mt-4 text-xs text-muted-foreground" dir="rtl">تمت إضافة كل المواصفات النشطة لهذا المنتج.</p>
      )}
    </section>
  );
}