import { useEffect, useState } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { Check, LoaderCircle, X } from 'lucide-react';
import {
  getListAdminRowsQueryKey,
  listAdminRows,
  useCreateAdminRow,
  useUpdateAdminRow,
} from '@workspace/api-client-react';

type Attribute = {
  id: string;
  attribute_name: string;
  type: string;
  is_active?: boolean;
  is_global?: boolean;
  is_filterable?: boolean;
  sort_order?: number;
};

type Assignment = {
  category_id: string;
  attribute_id: string;
  visible?: boolean;
};

type AttributeType = 'text' | 'number' | 'boolean' | 'select' | 'multiselect';

function errorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
      return data.error;
    }
  }
  return error instanceof Error ? error.message : 'تعذر حفظ إعدادات الخاصية. حاول مرة أخرى.';
}

export function ProductAttributeSetup({
  categoryIds,
  attributes,
  assignments,
  ready,
  onReady,
  onCancel,
}: {
  categoryIds: string[];
  attributes: Attribute[];
  assignments: Assignment[];
  ready: boolean;
  onReady: (attributeId: string) => void;
  onCancel: (partiallyCreatedName?: string) => void;
}) {
  const queryClient = useQueryClient();
  const createDefinition = useCreateAdminRow();
  const createOption = useCreateAdminRow();
  const createAssignment = useCreateAdminRow();
  const updateAssignment = useUpdateAdminRow();
  const [categoryId, setCategoryId] = useState(categoryIds[0] ?? '');
  const [mode, setMode] = useState<'create' | 'link'>('create');
  const [existingId, setExistingId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<AttributeType>('text');
  const [unit, setUnit] = useState('');
  const [optionsText, setOptionsText] = useState('');
  const [createdAttribute, setCreatedAttribute] = useState<Attribute | null>(null);
  const [createdOptionValues, setCreatedOptionValues] = useState<string[]>([]);
  const [linkedKey, setLinkedKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const categorySignature = categoryIds.join('|');

  useEffect(() => {
    if (!categoryIds.includes(categoryId)) setCategoryId(categoryIds[0] ?? '');
  }, [categorySignature, categoryId]);

  const categoryQueries = useQueries({
    queries: categoryIds.map((id) => {
      const params = { filterColumn: 'id', filterValue: id, limit: 1, offset: 0 };
      return {
        queryKey: getListAdminRowsQueryKey('categories', params),
        queryFn: ({ signal }: { signal: AbortSignal }) => listAdminRows('categories', params, { signal }),
      };
    }),
  });
  const categoriesReady = categoryIds.length > 0 && categoryQueries.every(
    (query) => !query.isError && !query.isFetching && query.data?.rows.length === 1,
  );
  const categories = categoryIds.map((id, index) => ({
    id,
    name: String(categoryQueries[index]?.data?.rows[0]?.category_name ?? ''),
  }));
  const existingAssignment = assignments.find(
    (item) => String(item.category_id) === categoryId && String(item.attribute_id) === existingId,
  );
  const linkableAttributes = attributes
    .filter((attribute) => attribute.is_active !== false
      && attribute.is_global !== true
      && !assignments.some((item) => String(item.category_id) === categoryId
        && String(item.attribute_id) === String(attribute.id)
        && item.visible !== false))
    .sort((left, right) => left.attribute_name.localeCompare(right.attribute_name, 'ar'));
  const choices = [...new Set(optionsText.split(/[,،\n]/).map((value) => value.trim()).filter(Boolean))];

  const save = async () => {
    if (!categoryId || !categoriesReady || !ready) {
      setError('انتظر تحميل التصنيف والخصائص ثم حاول مرة أخرى.');
      return;
    }
    if (mode === 'link' && !existingId) {
      setError('اختر خاصية موجودة لربطها بهذا التصنيف.');
      return;
    }
    if (mode === 'create' && !createdAttribute) {
      if (!name.trim()) {
        setError('أدخل اسم الخاصية.');
        return;
      }
      if (attributes.some((attribute) => attribute.attribute_name.trim().toLocaleLowerCase() === name.trim().toLocaleLowerCase())) {
        setError('توجد خاصية بهذا الاسم. اختر «ربط خاصية موجودة» بدلًا من إنشاء نسخة ثانية.');
        return;
      }
      if (['select', 'multiselect'].includes(type) && (!choices.length || choices.some((value) => value.length > 255))) {
        setError('أدخل خيارًا واحدًا على الأقل، وأبقِ كل خيار ضمن 255 حرفًا.');
        return;
      }
    }

    setError('');
    setSaving(true);
    let definition = createdAttribute;
    try {
      if (mode === 'create' && !definition) {
        const result = await createDefinition.mutateAsync({
          table: 'attributes',
          data: { values: {
            attribute_name: name.trim(),
            slug: `custom-${crypto.randomUUID()}`,
            type,
            unit: unit.trim() || null,
            is_global: false,
            is_active: true,
            is_filterable: false,
            is_comparable: false,
            sort_order: 0,
          } },
        });
        const row = result.row as Record<string, unknown>;
        if (!row.id) throw new Error('تم إنشاء الخاصية لكن الخادم لم يُرجع معرفها. افتح قائمة الخصائص قبل إعادة المحاولة.');
        definition = {
          id: String(row.id),
          attribute_name: String(row.attribute_name ?? name),
          type: String(row.type ?? type),
          is_filterable: false,
          sort_order: 0,
        };
        setCreatedAttribute(definition);
      }

      const attributeId = mode === 'link' ? existingId : definition?.id;
      if (!attributeId) throw new Error('لم يتم تحديد الخاصية.');
      if (mode === 'create' && ['select', 'multiselect'].includes(type)) {
        for (const value of choices) {
          if (createdOptionValues.includes(value)) continue;
          await createOption.mutateAsync({
            table: 'attribute_values',
            data: { values: { attribute_id: attributeId, attribute_value: value } },
          });
          setCreatedOptionValues((current) => [...current, value]);
        }
      }

      const key = `${categoryId}:${attributeId}`;
      if (linkedKey !== key) {
        const matchingAssignment = mode === 'link' ? existingAssignment : assignments.find(
          (item) => String(item.category_id) === categoryId && String(item.attribute_id) === attributeId,
        );
        if (matchingAssignment?.visible === false) {
          await updateAssignment.mutateAsync({
            table: 'category_attributes',
            id: `category_id=${categoryId}|attribute_id=${attributeId}`,
            data: { values: { visible: true } },
          });
        } else if (!matchingAssignment) {
          await createAssignment.mutateAsync({
            table: 'category_attributes',
            data: { values: {
              category_id: categoryId,
              attribute_id: attributeId,
              visible: true,
              sort_order: Number(definition?.sort_order ?? attributes.find((item) => String(item.id) === attributeId)?.sort_order ?? 0),
              is_required: false,
              is_filterable: Boolean(definition?.is_filterable ?? attributes.find((item) => String(item.id) === attributeId)?.is_filterable),
            } },
          });
        }
        setLinkedKey(key);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getListAdminRowsQueryKey('attributes') }),
        queryClient.invalidateQueries({ queryKey: getListAdminRowsQueryKey('category_attributes') }),
        queryClient.invalidateQueries({ queryKey: getListAdminRowsQueryKey('attribute_values') }),
      ]);
      onReady(attributeId);
    } catch (cause) {
      setError(`${errorMessage(cause)}${definition ? ' تعريف الخاصية محفوظ؛ يمكنك إعادة المحاولة دون إنشاء نسخة ثانية.' : ''}`);
      void queryClient.invalidateQueries({ queryKey: getListAdminRowsQueryKey('attributes') });
      void queryClient.invalidateQueries({ queryKey: getListAdminRowsQueryKey('category_attributes') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-accent/25 bg-card p-4 sm:p-5" dir="rtl" data-testid="panel-category-attribute-setup">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h5 className="text-sm font-extrabold text-primary">إعداد خاصية للتصنيف</h5>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">ستصبح الخاصية متاحة لمنتجات هذا التصنيف فقط، وليست لكل المنتجات.</p>
        </div>
        <button type="button" onClick={() => onCancel(createdAttribute?.attribute_name)} disabled={saving} aria-label="إغلاق إعداد الخاصية" className="focus-ring rounded-lg p-2 text-muted-foreground hover:bg-muted disabled:opacity-50"><X size={17} /></button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => { setMode('create'); setError(''); }} disabled={saving || Boolean(createdAttribute)} className={`focus-ring rounded-lg px-3 py-2 text-xs font-bold ${mode === 'create' ? 'bg-primary text-primary-foreground' : 'border border-border bg-background text-primary'}`}>إنشاء خاصية جديدة</button>
        <button type="button" onClick={() => { setMode('link'); setError(''); }} disabled={saving || Boolean(createdAttribute)} className={`focus-ring rounded-lg px-3 py-2 text-xs font-bold ${mode === 'link' ? 'bg-primary text-primary-foreground' : 'border border-border bg-background text-primary'}`}>ربط خاصية موجودة</button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-bold text-primary">
          التصنيف
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} disabled={saving || !categoriesReady} data-testid="select-attribute-setup-category" className="focus-ring mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-medium disabled:opacity-60">
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name || 'جارٍ تحميل التصنيف…'}</option>)}
          </select>
        </label>
        {mode === 'link' ? (
          <label className="text-xs font-bold text-primary">
            الخاصية الموجودة
            <select value={existingId} onChange={(event) => setExistingId(event.target.value)} disabled={saving} data-testid="select-existing-category-attribute" className="focus-ring mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-medium">
              <option value="">اختر خاصية</option>
              {linkableAttributes.map((attribute) => <option key={attribute.id} value={attribute.id}>{attribute.attribute_name}</option>)}
            </select>
          </label>
        ) : (
          <label className="text-xs font-bold text-primary">
            اسم الخاصية
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={255} disabled={saving || Boolean(createdAttribute)} data-testid="input-new-category-attribute-name" placeholder="مثل: خامة القماش" className="focus-ring mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-medium disabled:opacity-60" />
          </label>
        )}
        {mode === 'create' && (
          <>
            <label className="text-xs font-bold text-primary">
              نوع القيمة
              <select value={type} onChange={(event) => setType(event.target.value as AttributeType)} disabled={saving || Boolean(createdAttribute)} data-testid="select-new-category-attribute-type" className="focus-ring mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-medium disabled:opacity-60">
                <option value="text">نص</option><option value="number">رقم</option><option value="boolean">نعم / لا</option><option value="select">اختيار واحد</option><option value="multiselect">اختيارات متعددة</option>
              </select>
            </label>
            {type !== 'boolean' && (
              <label className="text-xs font-bold text-primary">
                الوحدة (اختياري)
                <input value={unit} onChange={(event) => setUnit(event.target.value)} maxLength={32} disabled={saving || Boolean(createdAttribute)} data-testid="input-new-category-attribute-unit" placeholder="مثل: سم" className="focus-ring mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-medium disabled:opacity-60" />
              </label>
            )}
            {['select', 'multiselect'].includes(type) && (
              <label className="text-xs font-bold text-primary sm:col-span-2">
                الخيارات المسموحة
                <textarea value={optionsText} onChange={(event) => setOptionsText(event.target.value)} disabled={saving || Boolean(createdAttribute)} data-testid="input-new-category-attribute-options" placeholder="أدخل خيارًا في كل سطر" rows={3} className="focus-ring mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium disabled:opacity-60" />
                <span className="mt-1 block font-normal text-muted-foreground">افصل الخيارات بسطر جديد أو بفاصلة.</span>
              </label>
            )}
          </>
        )}
      </div>
      {mode === 'link' && linkableAttributes.length === 0 && <p className="mt-3 text-xs text-muted-foreground">لا توجد خصائص أخرى للربط بهذا التصنيف. أنشئ خاصية جديدة بدلًا من ذلك.</p>}
      {createdAttribute && <p className="mt-3 text-xs font-semibold text-muted-foreground">تم إنشاء تعريف «{createdAttribute.attribute_name}». أكمل الربط هنا؛ لن يُنشأ تعريف مكرر عند إعادة المحاولة.</p>}
      {error && <p className="mt-3 rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs font-semibold text-destructive" role="alert">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => void save()} disabled={saving || !categoriesReady || !ready || (mode === 'link' ? !existingId : !name.trim())} data-testid="button-save-category-attribute-setup" className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground disabled:opacity-50">
          {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />}
          {mode === 'create' ? 'إنشاء وربط الخاصية' : existingAssignment?.visible === false ? 'إظهار الخاصية لهذا التصنيف' : 'ربط الخاصية بالتصنيف'}
        </button>
        <button type="button" onClick={() => onCancel(createdAttribute?.attribute_name)} disabled={saving} className="focus-ring h-10 rounded-xl border border-border px-4 text-xs font-bold text-muted-foreground disabled:opacity-50">إلغاء</button>
      </div>
    </div>
  );
}