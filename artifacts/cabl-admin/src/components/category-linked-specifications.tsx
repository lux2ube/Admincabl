import { useEffect, useMemo, useState } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, Check, LoaderCircle } from 'lucide-react';
import {
  getListAdminRowsQueryKey,
  listAdminRows,
  useCreateAdminRow,
  useListAdminRows,
  useUpdateAdminRow,
} from '@workspace/api-client-react';

type Row = Record<string, unknown>;

type SpecificationDefinition = Row & {
  id: string;
  slug: string;
  label: string;
  group_name: string;
  value_type: string;
  unit?: string | null;
  sort_order?: number;
  active?: boolean;
};

type CategoryDefinitionAssignment = Row & {
  category_id: string;
  definition_id: string;
  visible?: boolean;
};

type FieldSource = {
  kind: 'field';
  table: string;
  column: string;
};

type RelatedSource = {
  kind: 'related';
  table: string;
};

type UnsupportedSource = {
  kind: 'unsupported';
};

type SpecificationSource = FieldSource | RelatedSource | UnsupportedSource;

const directFields: Record<string, Omit<FieldSource, 'kind'>> = {
  connector_a: { table: 'cable_specifications', column: 'connector_a' },
  connector_b: { table: 'cable_specifications', column: 'connector_b' },
  length_m: { table: 'cable_specifications', column: 'length_m' },
  data_speed_gbps: { table: 'cable_specifications', column: 'data_speed_gbps' },
  usb_version: { table: 'cable_specifications', column: 'usb_version' },
  e_marker: { table: 'cable_specifications', column: 'e_marker' },
  video_support: { table: 'cable_specifications', column: 'video_support' },
  material: { table: 'cable_specifications', column: 'material' },
  capacity_mah: { table: 'power_bank_specifications', column: 'capacity_mah' },
  energy_wh: { table: 'power_bank_specifications', column: 'energy_wh' },
  input_summary: { table: 'power_bank_specifications', column: 'input_summary' },
  output_summary: { table: 'power_bank_specifications', column: 'output_summary' },
  recharge_time_hours: { table: 'power_bank_specifications', column: 'recharge_time_hours' },
  wireless_charging: { table: 'power_bank_specifications', column: 'wireless_charging' },
  display: { table: 'power_bank_specifications', column: 'display' },
  pass_through_charging: { table: 'power_bank_specifications', column: 'pass_through_charging' },
  input_voltage_v: { table: 'car_charger_specifications', column: 'input_voltage_v' },
  power_distribution: { table: 'car_charger_specifications', column: 'power_distribution' },
  car_compatibility: { table: 'car_charger_specifications', column: 'car_compatibility' },
};

const linkedEditors: Record<string, string> = {
  warranty_months: 'product_warranties',
  dimensions: 'product_dimensions',
  compatibility: 'product_compatibility',
};

function sourceForDefinition(
  definition: SpecificationDefinition,
  definitions: SpecificationDefinition[],
  genericSlugs: Set<string>,
): SpecificationSource {
  const { slug } = definition;
  if (genericSlugs.has(slug)) return { kind: 'unsupported' };
  const directField = directFields[slug];
  if (directField) return { kind: 'field', ...directField };

  if (slug === 'max_power_w') {
    const isCableCategory = definitions.some((item) => item.slug === 'connector_a' || item.slug === 'connector_b');
    return isCableCategory
      ? { kind: 'field', table: 'cable_specifications', column: 'max_power_w' }
      : { kind: 'unsupported' };
  }
  if (slug === 'max_output_w') {
    const isCarChargerCategory = definitions.some((item) =>
      ['input_voltage_v', 'power_distribution', 'car_compatibility'].includes(item.slug),
    );
    return isCarChargerCategory
      ? { kind: 'field', table: 'car_charger_specifications', column: 'max_output_w' }
      : { kind: 'field', table: 'power_bank_specifications', column: 'max_output_w' };
  }
  if (definition.value_type === 'multiselect' || linkedEditors[slug]) {
    return { kind: 'related', table: linkedEditors[slug] ?? 'product_compatibility' };
  }
  return { kind: 'unsupported' };
}

function CategorySpecificationField({
  definition,
  source,
  existingRow,
  onSave,
}: {
  definition: SpecificationDefinition;
  source: FieldSource;
  existingRow?: Row;
  onSave: (source: FieldSource, existingRow: Row | undefined, value: unknown) => Promise<void>;
}) {
  const displayLabel = definition.slug === 'connector_a'
    ? 'المنفذ الأول (الموصل A)'
    : definition.slug === 'connector_b'
      ? 'المنفذ الثاني (الموصل B)'
      : definition.label;
  const initialValue = existingRow?.[source.column] === null || existingRow?.[source.column] === undefined
    ? ''
    : String(existingRow[source.column]);
  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setValue(initialValue);
    setError('');
  }, [initialValue, definition.id]);

  const save = async () => {
    setError('');
    let encoded: unknown = value.trim() || null;
    if (definition.value_type === 'number' && value.trim()) {
      const number = Number(value);
      if (!Number.isFinite(number)) {
        setError('أدخل رقمًا صالحًا.');
        return;
      }
      encoded = number;
    } else if (definition.value_type === 'boolean') {
      encoded = value === '' ? null : value === 'true';
    }
    if (!existingRow && encoded === null) return;

    setIsSaving(true);
    try {
      await onSave(source, existingRow, encoded);
    } catch {
      setError('تعذر حفظ هذه المواصفة.');
    } finally {
      setIsSaving(false);
    }
  };

  const changed = value !== initialValue;
  const inputClassName = 'focus-ring h-11 min-w-0 w-full rounded-xl border border-border bg-background px-3 text-sm font-medium outline-none focus:border-accent disabled:opacity-60';

  return (
    <div className="rounded-xl border border-border bg-background/70 p-3" dir="rtl">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={`category-spec-${definition.id}`} className="text-xs font-bold text-primary" dir="auto">
          {displayLabel}
          {definition.unit && definition.value_type !== 'boolean' && (
            <span className="ms-1 font-medium text-muted-foreground">({definition.unit})</span>
          )}
        </label>
        {changed && (
          <button
            type="button"
            aria-label={`حفظ ${displayLabel}`}
            data-testid={`button-save-category-spec-${definition.slug}`}
            onClick={save}
            disabled={isSaving}
            className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
          >
            {isSaving ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />}
          </button>
        )}
      </div>
      {definition.value_type === 'boolean' ? (
        <select
          id={`category-spec-${definition.id}`}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className={`${inputClassName} mt-2`}
          dir="rtl"
        >
          <option value="">غير محدد</option>
          <option value="true">نعم</option>
          <option value="false">لا</option>
        </select>
      ) : (
        <input
          id={`category-spec-${definition.id}`}
          type={definition.value_type === 'number' ? 'number' : 'text'}
          step={definition.value_type === 'number' ? 'any' : undefined}
          inputMode={definition.value_type === 'number' ? 'decimal' : undefined}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className={`${inputClassName} mt-2`}
          dir="auto"
          autoComplete="off"
        />
      )}
      {error && <p role="alert" className="mt-2 text-[10px] font-semibold text-destructive">{error}</p>}
    </div>
  );
}

function RelatedSpecificationLink({
  definition,
  table,
}: {
  definition: SpecificationDefinition;
  table: string;
}) {
  const openRelatedEditor = () => {
    document
      .querySelector(`[data-testid="related-section-products-${table}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/70 p-3" dir="rtl">
      <span className="text-xs font-bold text-primary" dir="auto">{definition.label}</span>
      <button
        type="button"
        onClick={openRelatedEditor}
        className="focus-ring inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 text-[10px] font-bold text-muted-foreground hover:bg-muted"
      >
        <ArrowDown size={13} />
        إدارة القيمة
      </button>
    </div>
  );
}

export function CategoryLinkedSpecifications({
  productId,
  categoryIds,
  genericAttributeSlugs,
}: {
  productId: string;
  categoryIds: string[];
  genericAttributeSlugs: string[];
}) {
  const queryClient = useQueryClient();
  const createRow = useCreateAdminRow();
  const updateRow = useUpdateAdminRow();
  const categorySignature = categoryIds.join('|');
  const genericSignature = genericAttributeSlugs.join('|');
  const categoryIdList = useMemo(() => categoryIds, [categorySignature]);
  const genericSlugs = useMemo(() => new Set(genericAttributeSlugs), [genericSignature]);
  const definitionsParams = useMemo(() => ({ limit: 100, offset: 0 }), []);
  const definitionsQuery = useListAdminRows('specification_definitions', definitionsParams, {
    query: {
      enabled: categoryIdList.length > 0,
      queryKey: getListAdminRowsQueryKey('specification_definitions', definitionsParams),
    },
  });
  const assignmentQueries = useQueries({
    queries: categoryIdList.map((categoryId) => {
      const params = { filterColumn: 'category_id', filterValue: categoryId, limit: 100, offset: 0 };
      return {
        queryKey: getListAdminRowsQueryKey('category_specification_definitions', params),
        queryFn: () => listAdminRows('category_specification_definitions', params),
      };
    }),
  });

  const allDefinitions = (definitionsQuery.data?.rows ?? []) as SpecificationDefinition[];
  const allAssignments = assignmentQueries.flatMap((query) =>
    ((query.data as { rows?: Row[] } | undefined)?.rows ?? []) as CategoryDefinitionAssignment[],
  );
  const definitionById = new Map(allDefinitions.map((definition) => [String(definition.id), definition]));
  const linkedDefinitions = Array.from(new Map(
    allAssignments
      .filter((assignment) => assignment.visible !== false && categoryIds.includes(String(assignment.category_id)))
      .map((assignment) => definitionById.get(String(assignment.definition_id)))
      .filter((definition): definition is SpecificationDefinition => Boolean(definition && definition.active !== false))
      .map((definition) => [String(definition.id), definition]),
  ).values()).sort((left, right) =>
    (left.sort_order ?? 0) - (right.sort_order ?? 0) || left.label.localeCompare(right.label, 'ar'),
  );
  const displayedDefinitions = linkedDefinitions.filter((definition) => !genericSlugs.has(definition.slug));
  const resolvedSources = displayedDefinitions.map((definition) => ({
    definition,
    source: sourceForDefinition(definition, linkedDefinitions, genericSlugs),
  }));
  const tableKeys = Array.from(new Set(
    resolvedSources.flatMap(({ source }) => source.kind === 'field' ? [source.table] : []),
  ));
  const valueQueries = useQueries({
    queries: tableKeys.map((table) => {
      const params = { filterColumn: 'product_id', filterValue: productId, limit: 10, offset: 0 };
      return {
        queryKey: getListAdminRowsQueryKey(table, params),
        queryFn: () => listAdminRows(table, params),
        enabled: Boolean(productId),
      };
    }),
  });
  const rowsByTable = new Map(tableKeys.map((table, index) => [
    table,
    (((valueQueries[index]?.data as { rows?: Row[] } | undefined)?.rows ?? []) as Row[]),
  ]));
  const isLoading = definitionsQuery.isFetching
    || assignmentQueries.some((query) => query.isFetching)
    || valueQueries.some((query) => query.isFetching);
  const hasError = definitionsQuery.isError
    || assignmentQueries.some((query) => query.isError)
    || valueQueries.some((query) => query.isError);

  const saveValue = async (source: FieldSource, existingRow: Row | undefined, value: unknown) => {
    if (existingRow?.id) {
      await updateRow.mutateAsync({
        table: source.table,
        id: String(existingRow.id),
        data: { values: { [source.column]: value } },
      });
    } else {
      await createRow.mutateAsync({
        table: source.table,
        data: { values: { product_id: productId, [source.column]: value } },
      });
    }
    await queryClient.invalidateQueries({ queryKey: getListAdminRowsQueryKey(source.table) });
  };

  if (!categoryIdList.length || (!isLoading && !hasError && !linkedDefinitions.length)) return null;
  return (
    <div className="mt-5 border-t border-border pt-4" data-testid="category-linked-specifications">
      <div className="mb-3">
        <h4 className="text-sm font-extrabold text-primary" dir="rtl">خصائص مرتبطة بالتصنيف</h4>
        <p className="mt-1 text-[11px] leading-5 text-muted-foreground" dir="rtl">
          تظهر المواصفات المعرفة للتصنيف المحدد، وتُحفظ القيم في جداولها الحالية.
        </p>
      </div>
      {isLoading ? (
        <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground" role="status">
          جارٍ تحميل مواصفات التصنيف…
        </p>
      ) : hasError ? (
        <p className="rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-3 text-xs font-semibold text-destructive" role="alert">
          تعذر تحميل مواصفات هذا التصنيف. لم يتم إخفاء القيم المحفوظة.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {resolvedSources.map(({ definition, source }) => {
            if (source.kind === 'related') {
              return <RelatedSpecificationLink key={definition.id} definition={definition} table={source.table} />;
            }
            if (source.kind === 'unsupported') {
              return (
                <div key={definition.id} className="rounded-xl border border-dashed border-border px-3 py-3 text-xs text-muted-foreground" dir="rtl">
                  <span className="font-bold text-primary">{definition.label}</span>
                  <span className="ms-2">تتم إدارتها من المواصفات العامة.</span>
                </div>
              );
            }
            const existingRow = rowsByTable.get(source.table)?.find((row) => String(row.product_id) === productId);
            return (
              <CategorySpecificationField
                key={`${definition.id}:${source.table}:${source.column}`}
                definition={definition}
                source={source}
                existingRow={existingRow}
                onSave={saveValue}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}