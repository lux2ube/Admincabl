import './_group.css';
import { Check, LoaderCircle, Plus, X } from 'lucide-react';
import { useState } from 'react';

type Values = Record<string, string | boolean | null>;

const initial: Values = {
  id: '8d7b7a12-7c9c-4d6b-8b2f-ven001',
  brand: 'Vention',
  product_name: 'Vention USB-C to USB-C Cable 100W',
  SKU: 'CAB-VEN-100W-2M',
  brand_id: 'a1b2c3d4-vention',
  slug: 'vention-usb-c-to-usb-c-cable-100w',
  regular_price: '12.50',
  discount_price: '9.99',
  quantity: '47',
  short_description: 'كابل USB-C إلى USB-C سريع بقدرة تصل إلى 100 واط.',
  product_description: 'كابل Vention USB-C إلى USB-C بطول 2 متر، مصمم للشحن السريع ونقل البيانات بين الهواتف وأجهزة الكمبيوتر المحمولة والأجهزة اللوحية. يدعم Power Delivery بقدرة تصل إلى 100W، مع موصلات متينة وغلاف مرن للاستخدام اليومي. مناسب للشحن ونقل الملفات والفيديو عبر USB 2.0، ويأتي بتصميم عملي يتحمل الثني المتكرر.',
  product_weight: '82',
  product_note: 'تحقق من توافق الشاحن والجهاز مع USB-C PD قبل الاستخدام.',
  published: true,
};

const fieldMeta = [
  ['brand', 'العلامة التجارية', 'text', false],
  ['product_name', 'اسم المنتج', 'text', false],
  ['SKU', 'SKU', 'text', false],
  ['brand_id', 'مرجع العلامة', 'relation', true],
  ['slug', 'الرابط المختصر', 'text', true],
  ['regular_price', 'السعر الأساسي', 'number', false],
  ['discount_price', 'سعر الخصم', 'number', true],
  ['quantity', 'الكمية', 'number', false],
  ['short_description', 'الوصف المختصر', 'text', true],
  ['product_description', 'وصف المنتج', 'text', true],
  ['product_weight', 'الوزن', 'number', true],
  ['product_note', 'ملاحظة المنتج', 'text', true],
  ['published', 'منشور', 'boolean', false],
] as const;

function Field({ name, label, type, nullable, value, update }: {
  name: string; label: string; type: string; nullable: boolean; value: Values[string]; update: (value: Values[string]) => void;
}) {
  const testId = `input-field-${name}`;
  const required = !nullable;
  const heading = <label htmlFor={testId} className="mb-2 flex items-center justify-between text-xs font-bold text-primary"><span>{label}{required && <span className="ml-1 text-accent">*</span>}</span><span className="mono text-[10px] font-normal text-muted-foreground">{type === 'relation' ? 'uuid' : type}</span></label>;
  if (type === 'boolean') return <div className="sm:col-span-1"><span className="mb-2 flex items-center justify-between text-xs font-bold text-primary">{label}<span className="mono text-[10px] font-normal text-muted-foreground">boolean</span></span><button type="button" id={testId} data-testid={testId} aria-pressed={Boolean(value)} onClick={() => update(!value)} className={`focus-ring flex h-12 w-full items-center justify-between rounded-xl border px-3 text-sm font-semibold ${value ? 'border-secondary bg-secondary text-secondary-foreground' : 'border-input bg-background text-foreground'}`}><span>{value ? 'Enabled' : 'Disabled'}</span><span className={`h-5 w-9 rounded-full p-0.5 transition-colors ${value ? 'bg-secondary-foreground' : 'bg-muted-foreground/50'}`}><span className={`block h-4 w-4 rounded-full bg-card transition-transform ${value ? 'translate-x-4' : ''}`} /></span></button></div>;
  if (type === 'relation') return <div className="sm:col-span-1">{heading}<select id={testId} data-testid={testId} value={String(value ?? '')} onChange={e => update(e.target.value)} className="focus-ring h-11 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none"><option value="a1b2c3d4-vention">Vention · a1b2c3d4-vention</option><option value="b7e2-anker">Anker · b7e2-anker</option><option value="">— None —</option></select><p className="mt-1.5 text-[10px] text-muted-foreground">brands.id</p></div>;
  const structured = name === 'product_description';
  return <div className={structured ? 'admin-structured-field sm:col-span-2' : 'sm:col-span-1'}>{heading}{structured ? <><textarea id={testId} data-testid={testId} value={String(value ?? '')} onChange={e => update(e.target.value)} rows={7} spellCheck={false} className="focus-ring w-full resize-y rounded-xl border border-input bg-background px-3 py-3 font-mono text-sm leading-6 outline-none placeholder:text-muted-foreground" /><p className="mt-1.5 text-xs text-muted-foreground">Enter the product description.</p></> : <input id={testId} data-testid={testId} type={type === 'number' ? 'number' : 'text'} value={String(value ?? '')} onChange={e => update(e.target.value)} placeholder={`Enter ${label.toLowerCase()}`} required={required} className="focus-ring h-12 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground" />}</div>;
}

function RelatedSection({ label, table, detail }: { label: string; table: string; detail: string }) {
  return <section className="rounded-2xl border border-border bg-muted/20 p-4" data-testid={`related-section-products-${table}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><h4 className="text-sm font-extrabold text-primary">{label}</h4><p className="mt-1 text-xs text-muted-foreground">{table} · 1 linked record</p></div><button type="button" className="focus-ring inline-flex h-9 items-center gap-2 rounded-lg bg-secondary px-3 text-xs font-bold text-secondary-foreground"><Plus size={14} /> Add linked record</button></div><div className="mt-4 rounded-xl border border-border bg-card px-3 py-3 text-xs text-primary">{detail}<button type="button" className="float-right text-muted-foreground"><X size={15} /></button></div></section>;
}

function Specifications({ values }: { values: Values }) {
  const [spec, setSpec] = useState('100');
  return <section className="rounded-2xl border border-border bg-background/55 p-4 sm:p-5" data-testid="section-product-specifications"><div className="mb-4 flex items-start justify-between gap-3"><div><p className="mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Product details</p><h4 className="mt-1 text-base font-extrabold text-primary" dir="rtl">المواصفات</h4></div><span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold text-secondary-foreground">3</span></div><div className="space-y-2" dir="rtl"><div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2"><label className="flex min-h-12 min-w-0 items-center rounded-2xl border border-border bg-background/75 px-3 text-sm font-semibold">القدرة القصوى</label><div className="relative"><input value={spec} onChange={e => setSpec(e.target.value)} className="focus-ring h-12 min-w-0 w-full rounded-2xl border border-border bg-background/80 px-3 text-sm font-medium shadow-sm outline-none" /><span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[11px] font-semibold text-muted-foreground">W</span></div><button type="button" className="focus-ring flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground"><X size={20} /></button></div><div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2"><label className="flex min-h-12 items-center rounded-2xl border border-border bg-background/75 px-3 text-sm font-semibold">الطول</label><div className="relative"><input defaultValue="2" className="focus-ring h-12 w-full rounded-2xl border border-border bg-background/80 px-3 text-sm font-medium shadow-sm outline-none" /><span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[11px] font-semibold text-muted-foreground">m</span></div><button type="button" className="focus-ring flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground"><X size={20} /></button></div><div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2"><label className="flex min-h-12 items-center rounded-2xl border border-border bg-background/75 px-3 text-sm font-semibold">يدعم الفيديو</label><select defaultValue="false" className="focus-ring h-12 w-full rounded-2xl border border-border bg-background/80 px-3 text-sm font-medium shadow-sm outline-none"><option value="false">لا</option><option value="true">نعم</option></select><button type="button" className="focus-ring flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground"><X size={20} /></button></div></div><button type="button" className="focus-ring mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-secondary px-4 text-sm font-bold text-secondary-foreground"><Plus size={18} /> إضافة مواصفة</button></section>;
}

export function Current() {
  const [values, setValues] = useState<Values>(initial);
  const update = (name: string, value: Values[string]) => setValues(current => ({ ...current, [name]: value }));
  return <div className="cabl-noise min-h-screen bg-background p-0 sm:p-5"><div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/50 p-0 sm:items-center sm:p-5"><div role="dialog" aria-modal="true" aria-labelledby="row-dialog-title" className="max-h-[94dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-3xl"><div className="sticky top-0 z-10 flex items-start justify-between border-b border-border bg-card/95 px-6 py-5 backdrop-blur"><div><p className="mono text-[10px] uppercase tracking-[.18em] text-accent">edit record</p><h2 id="row-dialog-title" className="mt-1 text-xl font-extrabold tracking-[-.03em]">Update المنتجات</h2><p className="mt-1 text-sm text-muted-foreground">13 editable fields · generated values stay protected · primary keys stay fixed</p></div><button aria-label="Close record dialog" className="focus-ring flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted"><X size={17} /></button></div><form onSubmit={e => e.preventDefault()} className="space-y-5 p-6"><div className="grid gap-5 sm:grid-cols-2">{fieldMeta.map(([name, label, type, nullable]) => <Field key={name} name={name} label={label} type={type} nullable={nullable} value={values[name]} update={value => update(name, value)} />)}</div><section className="space-y-4 border-t border-border pt-5" aria-label="Related records"><div><p className="mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Relationships</p><h3 className="mt-1 text-base font-extrabold text-primary">Related records</h3><p className="mt-1 text-sm text-muted-foreground">Manage linked records here without leaving this form.</p></div><div className="space-y-3"><RelatedSection label="تصنيفات المنتج" table="product_categories" detail="إكسسوارات الشحن · category_id: cat-cables" /><RelatedSection label="وسوم المنتج" table="product_tags" detail="USB-C · tag_id: 12" /><Specifications values={values} /><RelatedSection label="المتغيرات" table="variants" detail="No linked records yet." /></div></section><div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end"><button type="button" className="focus-ring h-11 rounded-xl border border-border px-5 text-sm font-bold text-primary hover:bg-muted">Cancel</button><button type="submit" className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary/90"><Check size={14} />Save changes</button></div></form></div></div></div>;
}