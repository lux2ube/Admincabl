import './_group.css';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  CircleHelp,
  FileText,
  Globe2,
  Package,
  Search,
  Settings2,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

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

const initialValues: ProductValues = {
  brand: 'Vention',
  product_name: 'Vention USB-C to USB-C Cable 100W',
  SKU: 'CAB-VEN-100W-2M',
  brand_id: 'a1b2c3d4-vention',
  slug: 'vention-usb-c-to-usb-c-cable-100w',
  regular_price: '12.50',
  discount_price: '9.99',
  quantity: '47',
  short_description: 'كابل USB-C إلى USB-C سريع بقدرة تصل إلى 100 واط.',
  product_description:
    'كابل Vention USB-C إلى USB-C بطول 2 متر، مصمم للشحن السريع ونقل البيانات بين الهواتف وأجهزة الكمبيوتر المحمولة والأجهزة اللوحية. يدعم Power Delivery بقدرة تصل إلى 100W، مع موصلات متينة وغلاف مرن للاستخدام اليومي. مناسب للشحن ونقل الملفات والفيديو عبر USB 2.0، ويأتي بتصميم عملي يتحمل الثني المتكرر.',
  product_weight: '82',
  product_note: 'تحقق من توافق الشاحن والجهاز مع USB-C PD قبل الاستخدام.',
  seo_title: 'كابل Vention USB-C إلى USB-C بقدرة 100 واط | CABL',
  meta_description:
    'اشترِ كابل Vention USB-C بطول 2 متر وقدرة شحن تصل إلى 100 واط. مناسب للهواتف والأجهزة اللوحية والكمبيوتر المحمول.',
  published: true,
};

const initialSpecs = [
  { id: 1, name: 'القدرة القصوى', value: '100', unit: 'W' },
  { id: 2, name: 'الطول', value: '2', unit: 'm' },
  { id: 3, name: 'يدعم الفيديو', value: 'لا', unit: '' },
];

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  hint?: string;
  icon: typeof FileText;
};

function SectionHeading({ eyebrow, title, hint, icon: Icon }: SectionHeadingProps) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
        <Icon size={17} strokeWidth={1.8} />
      </span>
      <div>
        <p className="mono text-[9px] font-medium uppercase tracking-[.18em] text-muted-foreground">{eyebrow}</p>
        <h2 className="mt-1 text-[17px] font-extrabold leading-tight tracking-[-.025em] text-primary">{title}</h2>
        {hint && <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

function FieldLabel({
  htmlFor,
  children,
  note,
  required = false,
}: {
  htmlFor: string;
  children: ReactNode;
  note?: string;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-2 flex items-center justify-between gap-2 text-[12px] font-bold text-primary">
      <span>{children}{required && <span className="ml-1 text-accent">*</span>}</span>
      {note && <span className="text-[10px] font-medium text-muted-foreground">{note}</span>}
    </label>
  );
}

function Input({
  id,
  value,
  onChange,
  type = 'text',
  dir,
  placeholder,
  className = '',
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  dir?: 'rtl' | 'ltr';
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      type={type}
      dir={dir}
      placeholder={placeholder}
      className={`focus-ring h-11 w-full rounded-xl border border-input bg-background px-3.5 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/65 focus:border-accent ${className}`}
    />
  );
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-border bg-card p-5 shadow-[0_3px_14px_rgba(19,67,67,.035)] sm:p-6 ${className}`}>{children}</section>;
}

export function Professional() {
  const [values, setValues] = useState(initialValues);
  const [specs, setSpecs] = useState(initialSpecs);
  const [category, setCategory] = useState('إكسسوارات الشحن');
  const [tag, setTag] = useState('USB-C');
  const [statusMessage, setStatusMessage] = useState('');
  const [activeNav, setActiveNav] = useState('المنتجات');

  const update = (key: keyof ProductValues, value: string | boolean) => {
    setValues((current) => ({ ...current, [key]: value }));
    setStatusMessage('');
  };
  const titleLength = values.seo_title.length;
  const metaLength = values.meta_description.length;
  const ready = useMemo(() => {
    const quantity = Number(values.quantity);
    return Number(values.regular_price) > 0
      && values.quantity.trim().length > 0
      && Number.isFinite(quantity)
      && quantity >= 0
      && titleLength > 0
      && titleLength <= 60
      && metaLength > 0
      && metaLength <= 160;
  }, [values.regular_price, values.quantity, titleLength, metaLength]);

  const saveDraft = () => {
    update('published', false);
    setStatusMessage('تم حفظ المنتج كمسودة. يمكنك متابعة التحرير قبل النشر.');
  };
  const publish = () => {
    if (!ready) {
      setStatusMessage('أكمل السعر والكمية وعنوان ووصف البحث قبل نشر المنتج.');
      return;
    }
    update('published', true);
    setStatusMessage('تم نشر المنتج. المعلومات جاهزة للظهور في المتجر.');
  };

  return (
    <div className="cabl-noise min-h-[100dvh] bg-background text-foreground">
      <div className="flex min-h-[100dvh]">
        <aside className="hidden w-[218px] shrink-0 border-r border-sidebar-border bg-sidebar px-4 py-5 lg:flex lg:flex-col">
          <div className="flex items-center gap-3 px-2 pb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-[14px] font-extrabold tracking-[-.06em] text-primary-foreground">C</div>
            <div>
              <p className="text-[17px] font-extrabold tracking-[-.05em] text-primary">CABL</p>
              <p className="text-[10px] font-semibold text-muted-foreground">Yemen · Admin</p>
            </div>
          </div>
          <p className="mono mb-2 px-3 text-[9px] uppercase tracking-[.18em] text-muted-foreground">Workspace</p>
          <nav className="space-y-1" aria-label="لوحة الإدارة">
            {[
              { label: 'نظرة عامة', icon: Settings2 },
              { label: 'المنتجات', icon: Package },
              { label: 'التصنيفات', icon: Tag },
              { label: 'الطلبات', icon: FileText },
            ].map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => setActiveNav(label)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-bold transition-colors ${activeNav === label ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted/70 hover:text-primary'}`}
              >
                <Icon size={16} strokeWidth={1.8} />
                {label}
                {label === 'المنتجات' && <span className="ml-auto rounded-md bg-card px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">128</span>}
              </button>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl border border-sidebar-border bg-background/65 p-3.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span className="text-[11px] font-bold text-primary">كتالوج المتجر</span>
            </div>
            <p className="mt-2 text-[10px] leading-4 text-muted-foreground">تحقق من تفاصيل المنتج قبل أن يراه العملاء.</p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
            <div className="mx-auto flex min-h-[62px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-7">
              <div className="flex min-w-0 items-center gap-3">
                <button type="button" aria-label="العودة إلى المنتجات" onClick={() => setStatusMessage('أنت في محرر المنتجات.')} className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-primary">
                  <ArrowLeft size={16} />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">
                    <span>الكتالوج</span><span className="text-border">/</span><span>المنتجات</span><span className="text-border">/</span><span className="truncate text-primary">تحرير المنتج</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs font-extrabold text-primary sm:text-sm">محرر المنتج</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-bold sm:inline-flex ${values.published ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${values.published ? 'bg-accent' : 'bg-muted-foreground'}`} />
                  {values.published ? 'منشور' : 'مسودة'}
                </span>
                <button type="button" onClick={saveDraft} className="focus-ring hidden h-9 rounded-xl border border-border bg-card px-3 text-[11px] font-bold text-primary hover:bg-muted sm:block">حفظ كمسودة</button>
                <button type="button" onClick={publish} className="focus-ring flex h-9 items-center gap-2 rounded-xl bg-primary px-3.5 text-[11px] font-bold text-primary-foreground transition-colors hover:bg-primary/90 sm:px-4">
                  <Check size={14} /> نشر المنتج
                </button>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-[1440px] px-4 pb-28 pt-6 sm:px-7 sm:pt-8 lg:px-9">
            <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="mono text-[9px] uppercase tracking-[.18em] text-accent">Product workspace</p>
                <h1 className="mt-2 text-[25px] font-extrabold tracking-[-.045em] text-primary sm:text-[31px]">تحديث المنتج</h1>
                <p className="mt-1.5 max-w-2xl text-[12px] leading-5 text-muted-foreground">أدخل بيانات دقيقة، اكتب وصفاً واضحاً، ثم راجع ظهور المنتج قبل نشره.</p>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <ShieldCheck size={14} className="text-accent" />
                <span>آخر حفظ محلياً · جميع الحقول قابلة للتحرير</span>
              </div>
            </div>

            {statusMessage && (
              <div role="status" className={`mb-5 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-xs leading-5 ${statusMessage.startsWith('أكمل') ? 'border-amber-300/70 bg-amber-50 text-amber-900' : 'border-border bg-secondary/60 text-secondary-foreground'}`}>
                <CircleHelp size={15} className="mt-0.5 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="space-y-5">
                <Card>
                  <SectionHeading eyebrow="01 · Product information" title="معلومات المنتج" hint="استخدم اسماً ومواصفات تساعد العميل على معرفة ما سيشتريه." icon={Package} />
                  <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel htmlFor="product-name" required>اسم المنتج</FieldLabel>
                      <Input id="product-name" value={values.product_name} onChange={(value) => update('product_name', value)} dir="rtl" />
                    </div>
                    <div>
                      <FieldLabel htmlFor="brand-name" required>العلامة التجارية</FieldLabel>
                      <Input id="brand-name" value={values.brand} onChange={(value) => update('brand', value)} dir="rtl" />
                    </div>
                    <div>
                      <FieldLabel htmlFor="sku" required>رمز المنتج (SKU)</FieldLabel>
                      <Input id="sku" value={values.SKU} onChange={(value) => update('SKU', value)} className="mono tracking-wide" />
                    </div>
                    <div>
                      <FieldLabel htmlFor="brand-id" note="brands.id">مرجع العلامة</FieldLabel>
                      <div className="relative">
                        <select id="brand-id" value={values.brand_id} onChange={(event) => update('brand_id', event.target.value)} className="focus-ring h-11 w-full appearance-none rounded-xl border border-input bg-background px-3.5 text-[12px] text-foreground outline-none focus:border-accent">
                          <option value="a1b2c3d4-vention">Vention · a1b2c3d4-vention</option>
                          <option value="b7e2-anker">Anker · b7e2-anker</option>
                          <option value="">— بدون علامة —</option>
                        </select>
                        <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <SectionHeading eyebrow="02 · Product copy" title="وصف المنتج" hint="مساحة كتابة مريحة للتفاصيل الكاملة، مع عدّاد أحرف يساعدك على تحرير النص." icon={FileText} />
                  <div className="space-y-5">
                    <div>
                      <FieldLabel htmlFor="short-description" note={`${values.short_description.length} حرف`}>الوصف المختصر</FieldLabel>
                      <textarea
                        id="short-description"
                        value={values.short_description}
                        onChange={(event) => update('short_description', event.target.value)}
                        dir="rtl"
                        rows={3}
                        className="focus-ring min-h-[88px] w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-[13px] leading-7 text-foreground outline-none transition-colors focus:border-accent"
                      />
                      <p className="mt-1.5 text-[10px] text-muted-foreground">جملة واحدة تلخص الفائدة الأساسية للمنتج.</p>
                    </div>
                    <div>
                      <FieldLabel htmlFor="full-description" note={`${values.product_description.length} حرف`}>الوصف الكامل</FieldLabel>
                      <div className="overflow-hidden rounded-xl border border-input bg-background focus-within:border-accent focus-within:ring-2 focus-within:ring-ring/20">
                        <div className="flex items-center justify-between border-b border-border bg-muted/35 px-3.5 py-2">
                          <span className="text-[10px] font-semibold text-muted-foreground">وصف واضح ومفيد للعميل</span>
                          <span className="mono text-[9px] text-muted-foreground">AR · RTL</span>
                        </div>
                        <textarea
                          id="full-description"
                          value={values.product_description}
                          onChange={(event) => update('product_description', event.target.value)}
                          dir="rtl"
                          rows={9}
                          className="min-h-[230px] w-full resize-y bg-transparent px-4 py-4 text-[14px] leading-[2.05] text-foreground outline-none sm:min-h-[260px] sm:px-5"
                        />
                      </div>
                      <p className="mt-2 text-[10px] leading-4 text-muted-foreground">اذكر التوافق وطريقة الاستخدام بوضوح، وتجنب الوعود غير المؤكدة.</p>
                    </div>
                  </div>
                </Card>

                <Card>
                  <SectionHeading eyebrow="03 · Catalog links" title="التصنيفات والارتباطات" hint="اربط المنتج بالتصنيف والوسم المناسبين." icon={Tag} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel htmlFor="category">تصنيفات المنتج</FieldLabel>
                      <div className="relative">
                        <select id="category" value={category} onChange={(event) => setCategory(event.target.value)} className="focus-ring h-11 w-full appearance-none rounded-xl border border-input bg-background px-3.5 text-[12px] outline-none focus:border-accent">
                          <option>إكسسوارات الشحن</option><option>كابلات</option><option>ملحقات الهواتف</option>
                        </select>
                        <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      </div>
                      <p className="mt-1.5 text-[10px] text-muted-foreground">product_categories · category_id: cat-cables</p>
                    </div>
                    <div>
                      <FieldLabel htmlFor="product-tag">وسوم المنتج</FieldLabel>
                      <div className="relative">
                        <select id="product-tag" value={tag} onChange={(event) => setTag(event.target.value)} className="focus-ring h-11 w-full appearance-none rounded-xl border border-input bg-background px-3.5 text-[12px] outline-none focus:border-accent">
                          <option>USB-C</option><option>شحن سريع</option><option>Vention</option>
                        </select>
                        <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      </div>
                      <p className="mt-1.5 text-[10px] text-muted-foreground">product_tags · tag_id: 12</p>
                    </div>
                    <div className="sm:col-span-2">
                      <FieldLabel htmlFor="variants">المتغيرات</FieldLabel>
                      <div id="variants" className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-3.5">
                        <span className="text-[11px] text-muted-foreground">لا توجد متغيرات مرتبطة بهذا المنتج.</span>
                        <span className="mono text-[9px] text-muted-foreground">variants · 0</span>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <SectionHeading eyebrow="04 · Product details" title="المواصفات" hint="حقائق المنتج كما تظهر ضمن تفاصيله." icon={Settings2} />
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold text-secondary-foreground">{specs.length}</span>
                  </div>
                  <div className="space-y-2.5" dir="rtl">
                    {specs.map((spec) => (
                      <div key={spec.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_42px] gap-2">
                        <input aria-label="اسم المواصفة" value={spec.name} onChange={(event) => setSpecs((items) => items.map((item) => item.id === spec.id ? { ...item, name: event.target.value } : item))} className="focus-ring min-w-0 rounded-xl border border-input bg-background px-3 py-2.5 text-[12px] outline-none" />
                        <div className="flex min-w-0 overflow-hidden rounded-xl border border-input bg-background focus-within:border-accent">
                          <input aria-label="قيمة المواصفة" value={spec.value} onChange={(event) => setSpecs((items) => items.map((item) => item.id === spec.id ? { ...item, value: event.target.value } : item))} className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[12px] outline-none" />
                          {spec.unit && <span className="flex items-center border-l border-border px-2.5 text-[10px] font-semibold text-muted-foreground">{spec.unit}</span>}
                        </div>
                        <span aria-hidden="true" className="flex h-10 items-center justify-center rounded-xl border border-border bg-muted/30 text-muted-foreground"><span className="h-1 w-1 rounded-full bg-current shadow-[0_4px_0_currentColor,0_-4px_0_currentColor]" /></span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <aside className="space-y-5 xl:sticky xl:top-[82px]">
                <Card>
                  <SectionHeading eyebrow="05 · Pricing & stock" title="السعر والمخزون" hint="التحقق من توفر المنتج وسعره قبل النشر." icon={Package} />
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <FieldLabel htmlFor="regular-price" required>السعر الأساسي</FieldLabel>
                        <div className="relative">
                          <Input id="regular-price" type="number" value={values.regular_price} onChange={(value) => update('regular_price', value)} className="pl-12 tabular-nums" />
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">USD</span>
                        </div>
                      </div>
                      <div>
                        <FieldLabel htmlFor="discount-price">سعر الخصم</FieldLabel>
                        <div className="relative">
                          <Input id="discount-price" type="number" value={values.discount_price} onChange={(value) => update('discount_price', value)} className="pl-12 tabular-nums" />
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">USD</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <FieldLabel htmlFor="quantity" required>الكمية المتاحة</FieldLabel>
                      <div className="relative">
                        <Input id="quantity" type="number" value={values.quantity} onChange={(value) => update('quantity', value)} className="pl-16 tabular-nums" />
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground">قطعة</span>
                      </div>
                      <p className="mt-1.5 text-[10px] text-muted-foreground">{Number(values.quantity) > 0 ? `متوفر · ${values.quantity} في المخزون` : 'غير متوفر حالياً'}</p>
                    </div>
                    <div className="border-t border-border pt-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <FieldLabel htmlFor="weight">الوزن</FieldLabel>
                          <div className="relative">
                            <Input id="weight" type="number" value={values.product_weight} onChange={(value) => update('product_weight', value)} className="pl-10 tabular-nums" />
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">g</span>
                          </div>
                        </div>
                        <div className="flex flex-col justify-end pb-1">
                          <span className="mb-2 text-[10px] font-bold text-primary">حالة النشر</span>
                          <button type="button" aria-pressed={values.published} onClick={() => update('published', !values.published)} className={`focus-ring flex h-11 items-center justify-between rounded-xl border px-3 text-[11px] font-bold ${values.published ? 'border-secondary bg-secondary/55 text-secondary-foreground' : 'border-border bg-muted/40 text-muted-foreground'}`}>
                            {values.published ? 'منشور' : 'مسودة'}
                            <span className={`relative h-[18px] w-8 rounded-full transition-colors ${values.published ? 'bg-accent' : 'bg-muted-foreground/50'}`}>
                              <span className={`absolute top-[3px] h-3 w-3 rounded-full bg-card transition-transform ${values.published ? 'left-[17px]' : 'left-[3px]'}`} />
                            </span>
                          </button>
                        </div>
                      </div>
                      <div className="mt-4">
                        <FieldLabel htmlFor="product-note">ملاحظة المنتج</FieldLabel>
                        <textarea id="product-note" value={values.product_note} onChange={(event) => update('product_note', event.target.value)} dir="rtl" rows={2} className="focus-ring min-h-[74px] w-full resize-y rounded-xl border border-input bg-background px-3.5 py-3 text-[11px] leading-6 outline-none focus:border-accent" />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <SectionHeading eyebrow="06 · Search appearance" title="محركات البحث" hint="عنوان ووصف واضحان لنتائج البحث." icon={Search} />
                  <div className="space-y-4">
                    <div>
                      <FieldLabel htmlFor="slug" note="الرابط المختصر">رابط المنتج</FieldLabel>
                      <div className="flex overflow-hidden rounded-xl border border-input bg-background focus-within:border-accent">
                        <span className="flex shrink-0 items-center border-r border-border bg-muted/35 px-2.5 text-[9px] text-muted-foreground">cabl.ye /</span>
                        <input id="slug" value={values.slug} onChange={(event) => update('slug', event.target.value)} dir="ltr" className="mono min-w-0 flex-1 bg-transparent px-2.5 py-2.5 text-[10px] text-foreground outline-none" />
                      </div>
                    </div>
                    <div>
                      <FieldLabel htmlFor="seo-title" note={`${titleLength} / 60`}>عنوان SEO</FieldLabel>
                      <Input id="seo-title" value={values.seo_title} onChange={(value) => update('seo_title', value)} dir="rtl" />
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted"><span className={`block h-full rounded-full ${titleLength > 60 ? 'bg-destructive' : 'bg-accent'}`} style={{ width: `${Math.min(titleLength / 60 * 100, 100)}%` }} /></div>
                    </div>
                    <div>
                      <FieldLabel htmlFor="meta-description" note={`${metaLength} / 160`}>وصف Meta</FieldLabel>
                      <textarea id="meta-description" value={values.meta_description} onChange={(event) => update('meta_description', event.target.value)} dir="rtl" rows={4} className="focus-ring min-h-[104px] w-full resize-y rounded-xl border border-input bg-background px-3.5 py-3 text-[11px] leading-6 outline-none focus:border-accent" />
                      <div className="mt-1.5 flex items-center justify-between text-[9px] text-muted-foreground"><span>يفضل أن يكون موجزاً ومفيداً.</span><span className={metaLength > 160 ? 'font-bold text-destructive' : ''}>{metaLength} / 160</span></div>
                    </div>
                  </div>
                </Card>

                <Card className="border-accent/20 bg-[#f5faf8]">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[11px] font-extrabold text-primary"><Globe2 size={15} className="text-accent" /> معاينة نتيجة البحث</div>
                    <span className="mono text-[8px] uppercase tracking-[.13em] text-muted-foreground">Google preview</span>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-card px-3.5 py-3.5">
                    <p dir="ltr" className="truncate text-left text-[10px] text-[#445b52]">cabl.ye › {values.slug || 'رابط-المنتج'}</p>
                    <h3 dir="rtl" className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-6 text-[#17693d]">{values.seo_title || 'عنوان المنتج في نتائج البحث'}</h3>
                    <p dir="rtl" className="mt-1.5 line-clamp-3 text-[10px] leading-[1.75] text-[#3e4b46]">{values.meta_description || 'أضف وصفاً تعريفياً ليظهر هنا ضمن نتائج البحث.'}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[9px] text-muted-foreground">
                    <span>المعاينة تتحدث أثناء التحرير</span>
                    <span className="flex items-center gap-1"><span className={`h-1.5 w-1.5 rounded-full ${ready ? 'bg-accent' : 'bg-amber-500'}`} />{ready ? 'جاهز للنشر' : 'بحاجة إلى مراجعة'}</span>
                  </div>
                </Card>
              </aside>
            </div>
          </main>

          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 py-3 backdrop-blur sm:px-7">
            <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
              <div className="hidden items-center gap-2 text-[10px] text-muted-foreground sm:flex">
                <span className={`h-1.5 w-1.5 rounded-full ${ready ? 'bg-accent' : 'bg-amber-500'}`} />
                {ready ? 'السعر والمخزون وبيانات البحث مكتملة' : 'أكمل بيانات النشر المطلوبة'}
              </div>
              <div className="ml-auto flex w-full gap-2 sm:w-auto">
                <button type="button" onClick={saveDraft} className="focus-ring h-10 flex-1 rounded-xl border border-border bg-card px-4 text-[11px] font-bold text-primary hover:bg-muted sm:flex-none">حفظ كمسودة</button>
                <button type="button" onClick={publish} className="focus-ring flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[11px] font-bold text-primary-foreground hover:bg-primary/90 sm:flex-none">
                  <Check size={14} /> {values.published ? 'حفظ ونشر التغييرات' : 'نشر المنتج'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}