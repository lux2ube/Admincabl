import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ExternalLink,
  FlaskConical,
  Headphones,
  MapPin,
  MessageCircle,
  Package,
  RefreshCcw,
  ShieldCheck,
  Truck,
  Zap,
} from 'lucide-react';
import { Link, useParams } from 'wouter';
import type { StoreProduct } from '@workspace/api-client-react';
import { useStore } from '@/lib/store';
import { productPath } from '@/lib/store-routes';
import { setSeoHead } from '@/lib/seo-head';
import { Breadcrumbs, CTASection, CatalogError, LoadingCatalog, PageHeading } from '@/components/page-parts';
import { ProductGrid } from '@/components/catalog-ui';

type Currency = { code: string; ratePerUsd: number; isDefault: boolean };

function PageMeta({ title, description, canonicalPath, indexable = true }: { title: string; description: string; canonicalPath?: string; indexable?: boolean }) {
  useEffect(() => {
    setSeoHead({ title: `${title} | CABL`, description, canonicalPath, indexable });
  }, [title, description, canonicalPath, indexable]);
  return null;
}

export function EditorialSection({ eyebrow, title, children }: { eyebrow?: string; title: string; children: ReactNode }) {
  return (
    <section className="editorial-section">
      <div className="container">
        <div className="editorial-heading">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h2>{title}</h2>
        </div>
        {children}
      </div>
    </section>
  );
}

export function InfoCards({ items }: { items: Array<{ icon: ReactNode; title: string; text: string; href?: string }> }) {
  return (
    <div className="info-card-grid">
      {items.map((item) => (
        <div className="info-card" key={item.title}>
          <span className="info-card-icon">{item.icon}</span>
          <h3>{item.title}</h3>
          <p>{item.text}</p>
          {item.href && (
            <Link href={item.href} className="text-link">
              اقرأ المزيد <ArrowLeft size={14} />
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

export function FAQList({ items }: { items: Array<{ question: string; answer: string }> }) {
  return (
    <div className="faq-list">
      {items.map((item) => (
        <details className="faq-item" key={item.question}>
          <summary>
            {item.question}
            <ChevronDown size={16} />
          </summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

function EditorialHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="editorial-hero">
      <div className="container">
        <Breadcrumbs items={[{ label: title }]} />
        <div className="editorial-hero-copy">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

function formatCatalogPrice(product: StoreProduct, currencies?: Currency[]) {
  const currency = currencies?.find((item) => item.isDefault) || currencies?.[0];
  return new Intl.NumberFormat('ar-YE', {
    style: 'currency',
    currency: currency?.code || 'USD',
    maximumFractionDigits: 0,
  }).format((product.discountPrice ?? product.regularPrice) * (currency?.ratePerUsd || 1));
}

export function ProductComparisonTable({
  products,
  currencies,
  includeCategory = false,
}: {
  products: StoreProduct[];
  currencies?: Currency[];
  includeCategory?: boolean;
}) {
  return (
    <div className="comparison-table-wrap">
      <table className="comparison-table">
        <thead>
          <tr>
            <th>المنتج</th>
            <th>السعر</th>
            {includeCategory && <th>القسم</th>}
            <th>التوافر</th>
            <th>التفاصيل</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                <strong>{product.productName}</strong>
                <small>{product.brand}</small>
              </td>
              <td>{formatCatalogPrice(product, currencies)}</td>
              {includeCategory && <td>{product.category?.name || 'إكسسوارات'}</td>}
              <td>{product.quantity > 0 ? 'متوفر' : 'نفد حالياً'}</td>
              <td>
                <Link href={productPath(product)} className="text-link">
                  افتح المنتج <ArrowLeft size={14} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RelatedLinks({ links }: { links: Array<{ label: string; href: string; text: string }> }) {
  return (
    <div className="info-card-grid">
      {links.map((link) => (
        <Link className="info-card related-link-card" href={link.href} key={link.href}>
          <BookOpen className="info-card-icon" />
          <h3>{link.label}</h3>
          <p>{link.text}</p>
          <span className="text-link">
            افتح الصفحة <ArrowLeft size={14} />
          </span>
        </Link>
      ))}
    </div>
  );
}

export function AboutPage() {
  const { catalog } = useStore();
  const brands = Array.from(new Set((catalog?.products || []).map((product) => product.brand))).slice(0, 8);
  return (
    <>
      <PageMeta title="من نحن" description="تعرف على CABL وطريقة اختيار المنتجات وخدمة العملاء في اليمن." />
      <EditorialHero
        eyebrow="CABL / اليمن"
        title="من نحن"
        description="متجر إلكتروني يختار إكسسوارات الشحن والطاقة والصوتيات بعناية، ويعرض معلومات الشراء بوضوح للعملاء في اليمن."
      />
      <EditorialSection eyebrow="المهمة" title="اختيار أوضح ليومك">
        <InfoCards
          items={[
            { icon: <ShieldCheck />, title: 'بيانات منتج واضحة', text: 'العلامة والموديل والسعر والتوافر تظهر قبل أن تضيف المنتج إلى السلة.' },
            { icon: <Zap />, title: 'مواصفات مفيدة', text: 'نشرح القدرة والمنافذ والتوافق بلغة عملية، ولا نحوّل رقم الواط إلى وعد غير مؤكد.' },
            { icon: <Truck />, title: 'خطوات شراء مفهومة', text: 'الشحن والدفع والطلب تظهر في نفس المسار قبل التأكيد.' },
            { icon: <MessageCircle />, title: 'متابعة بعد الطلب', text: 'احتفظ برقم الطلب واستخدم صفحة التتبع عند الحاجة.', href: '/orders' },
          ]}
        />
      </EditorialSection>
      <EditorialSection eyebrow="ما الذي نفعله؟" title="محتوى يساعدك قبل الشراء">
        <div className="editorial-copy">
          <p>
            CABL متجر تجزئة مستقل. نعرض العلامة ورقم الموديل كما يردان في الكتالوج المنشور، ونفصل بين وجود المنتج
            في المتجر وبين ادعاء الوكالة أو الضمان المصنّع ما لم تظهر معلومة موثقة في صفحة المنتج.
          </p>
          <p>
            يبدأ الاختيار من الاستخدام الحقيقي: هاتف، راوتر، لابتوب، سيارة، سفر أو صوتيات. بعد ذلك نراجع القدرة
            والمنافذ والتوافق والسعر والتوافر، ثم نترك القرار لك.
          </p>
        </div>
      </EditorialSection>
      <EditorialSection eyebrow="العلامات المتاحة" title="ما ستجده في الكتالوج">
        <div className="brand-list editorial-brand-list">
          {brands.map((brand) => {
            const product = catalog?.products.find((item) => item.brand === brand);
            return (
              <Link
                className="brand-pill"
                href={`/brand/${product?.brandSlug || brand.toLowerCase().replace(/\s+/g, '-')}`}
                key={brand}
              >
                {brand}
              </Link>
            );
          })}
        </div>
      </EditorialSection>
      <EditorialSection eyebrow="المنهج" title="كيف نكتب عن المنتج؟">
        <div className="editorial-copy">
          <p>نبدأ من معلومات المنتج المنشورة، ثم نفصل بين المواصفة المعلنة والتقدير العملي. عندما تكون المعلومة غير متاحة، نذكر ذلك بدلاً من اختراع مدة ضمان أو نتيجة اختبار.</p>
          <ul className="check-list">
            <li><Check size={16} /> المقارنة تعتمد على السعر والتوافق والمنافذ المتاحة.</li>
            <li><Check size={16} /> العيوب والحدود جزء من وصف المنتج، وليست ملاحظة مخفية.</li>
            <li><Check size={16} /> السعر والتوافر الحاليان يُؤخذان من الكتالوج وقت الطلب.</li>
            <li><Check size={16} /> سياسات الشحن والإرجاع هي المرجع النهائي، لا العبارات التسويقية العامة.</li>
          </ul>
        </div>
      </EditorialSection>
      <EditorialSection title="أسئلة يطرحها الناس في الشارع">
        <FAQList
          items={[
            { question: 'هل المنتج الأغلى هو الأفضل؟', answer: 'ليس دائماً. الأفضل هو ما يطابق جهازك وقدرتك وطريقة استخدامك، مع سعر وتوافر مناسبين.' },
            { question: 'هل يمكن معرفة الشاحن المناسب من شكل المنفذ؟', answer: 'الشكل يحدد التوافق الميكانيكي فقط؛ راجع القدرة والبروتوكول والكابل أيضاً.' },
            { question: 'هل أستطيع الطلب بدون معرفة كل المواصفات؟', answer: 'نعم، ابدأ من الاستخدام ثم راجع صفحة المنتج أو دليل الشراء، ولا تؤكد قبل مراجعة التوافق.' },
          ]}
        />
      </EditorialSection>
      <CTASection />
    </>
  );
}

export function ArticlePage() {
  const { catalog } = useStore();
  const products = catalog?.products || [];
  const powerProducts = products.filter((product) => /باور|power|بطارية/i.test(`${product.productName} ${product.shortDescription || ''}`)).slice(0, 5);
  const [device, setDevice] = useState('هاتف');
  const [capacity, setCapacity] = useState('10000');
  const [voltage, setVoltage] = useState('3.7');
  const wattHours = Math.round((Number(capacity) * Number(voltage) / 1000) * 10) / 10;
  const estimatedCharges = device === 'لابتوب' ? Math.max(0.2, wattHours / 55).toFixed(1) : device === 'تابلت' ? Math.max(0.4, wattHours / 30).toFixed(1) : Math.max(0.5, wattHours / 15).toFixed(1);
  return (
    <>
      <PageMeta title="دليل اختيار خوازن الطاقة (Power Bank)" description="دليل CABL لفهم السعة والقدرة والمنافذ قبل شراء خازن طاقة (Power Bank) في اليمن." />
      <EditorialHero eyebrow="دليل شراء" title="كيف تختار خازن طاقة يناسب يومك؟" description="لا تبدأ من رقم mAh وحده. قارن الطاقة والمنافذ والخرج والتوافق مع استخدامك الفعلي في اليمن." />
      <EditorialSection eyebrow="قبل الأرقام" title="لماذا تحتاج باور بانك؟">
        <div className="editorial-copy">
          <p>انقطاع الكهرباء والتنقل الطويل والعمل من الهاتف يجعل الطاقة الاحتياطية جزءاً من اليوم. الاختيار الجيد ليس الأكبر دائماً؛ هو المنتج الذي يناسب جهازك ووزنك ومدة الاستخدام التي تحتاجها.</p>
        </div>
        <div className="numbered-steps">
          <div><b>01</b><h3>حدد الجهاز</h3><p>هاتف، تابلت، راوتر أو لابتوب؟ كل جهاز يحتاج قدرة ومخرجاً مختلفين.</p></div>
          <div><b>02</b><h3>افهم السعة</h3><p>mAh تصف سعة الخلايا، بينما Wh تساعد على مقارنة الطاقة النظرية بين الموديلات.</p></div>
          <div><b>03</b><h3>راجع الخرج</h3><p>طابق USB-C PD أو البروتوكول المطلوب مع الجهاز والكابل قبل الطلب.</p></div>
          <div><b>04</b><h3>احسب الاستخدام</h3><p>اترك هامشاً لفقد التحويل والحرارة، ولا تعتبر عدد الشحنات وعداً ثابتاً.</p></div>
        </div>
      </EditorialSection>
      <EditorialSection eyebrow="من الكتالوج الحالي" title="خمسة اختيارات للمقارنة">
        {powerProducts.length ? <ProductComparisonTable products={powerProducts} currencies={catalog?.currencies} /> : <p className="empty-state">لا توجد منتجات باور بانك مرتبطة حالياً. راجع الكتالوج بعد تحديثه.</p>}
      </EditorialSection>
      <EditorialSection title="اختيار سريع حسب الاستخدام والميزانية">
        <div className="info-card-grid">
          <div className="info-card"><Zap className="info-card-icon" /><h3>استخدام خفيف</h3><p>هاتف واحد وتنقل قصير: راجع الحجم والوزن والمنافذ قبل البحث عن سعة أكبر.</p></div>
          <div className="info-card"><Package className="info-card-icon" /><h3>يوم طويل أو سفر</h3><p>سعة أكبر ومخرج USB-C عمليان، لكن تحقّق من الوزن ومن قدرة الشحن الفعلية.</p></div>
          <div className="info-card"><ShieldCheck className="info-card-icon" /><h3>لابتوب أو راوتر</h3><p>ابحث عن القدرة والبروتوكول المناسبين، ولا تعتمد على mAh وحدها.</p></div>
        </div>
      </EditorialSection>
      <EditorialSection eyebrow="أداة توضيحية" title="احسب الطاقة التقريبية">
        <div className="calculator-card">
          <div className="calculator-fields">
            <label className="form-field"><span>الجهاز</span><select value={device} onChange={(event) => setDevice(event.target.value)}><option>هاتف</option><option>تابلت</option><option>لابتوب</option></select></label>
            <label className="form-field"><span>السعة mAh</span><input type="number" min="1000" value={capacity} onChange={(event) => setCapacity(event.target.value)} /></label>
            <label className="form-field"><span>جهد الخلية التقريبي</span><input type="number" min="1" step="0.1" value={voltage} onChange={(event) => setVoltage(event.target.value)} /></label>
          </div>
          <div className="calculator-result"><strong>{wattHours} Wh</strong><span>طاقة نظرية تقريبية قبل فقد التحويل</span><strong>{estimatedCharges}</strong><span>شحنة مكافئة تقريبية لجهاز {device}</span></div>
        </div>
        <p className="content-disclaimer">هذه أداة تقديرية للتثقيف وليست نتيجة اختبار مخبري. الكفاءة والحرارة والكابل وسلوك الجهاز تغيّر النتيجة.</p>
      </EditorialSection>
      <EditorialSection title="تحذيرات مهمة قبل الدفع">
        <div className="check-list large-checks">
          <div><Check size={18} /> لا تقارن mAh بين تقنيات مختلفة دون تحويلها إلى Wh عندما تكون البيانات متاحة.</div>
          <div><Check size={18} /> لا تفترض أن USB-C يعني شحن لابتوب أو دعم PD.</div>
          <div><Check size={18} /> راجع الصور ورقم الموديل والمنافذ، خصوصاً عند شراء منتج مشابه لمنتج آخر.</div>
          <div><Check size={18} /> عدد الشحنات تقديري ويتأثر بالفقد والجهاز ودرجة الحرارة.</div>
        </div>
      </EditorialSection>
      <EditorialSection title="أسئلة شائعة">
        <FAQList items={[
          { question: 'هل mAh وحدها تكفي للمقارنة؟', answer: 'لا. قارن Wh إن كانت متاحة، ثم راجع قدرة الخرج والمنافذ والوزن والتوافق.' },
          { question: 'هل كل باور بانك يشحن اللابتوب؟', answer: 'لا. يجب أن يذكر المنتج مخرج USB-C PD بقدرة مناسبة، وتحتاج إلى كابل مناسب.' },
          { question: 'هل عدد الشحنات مضمون؟', answer: 'لا. عدد الشحنات تقديري ويتغير حسب فقد التحويل والجهاز والحرارة وطريقة الاستخدام.' },
          { question: 'هل أختار 10,000 أم 20,000 mAh؟', answer: 'اختر حسب مدة الاستخدام والوزن وقدرة الخرج. السعة الأعلى ليست أفضل إن كانت ستبقى في المنزل بسبب حجمها.' },
        ]} />
      </EditorialSection>
      <EditorialSection title="أدلة ذات صلة">
        <RelatedLinks links={[
          { label: 'حلول الشحن اليومية', href: '/solutions/slow-car-charging', text: 'افهم علاقة الكابل والشاحن والحرارة بسرعة الشحن.' },
          { label: 'مركز المواصفات', href: '/lab', text: 'اقرأ الفرق بين المواصفة المنشورة والحساب التوضيحي.' },
          { label: 'الشحن والتوصيل', href: '/shipping', text: 'راجع الخيارات النشطة قبل إرسال الطلب.' },
        ]} />
      </EditorialSection>
      <CTASection />
    </>
  );
}

export function LocationPage() {
  const { catalog, formatPrice } = useStore();
  const { slug = 'yemen' } = useParams<{ slug: string }>();
  const [capacity, setCapacity] = useState('20000');
  const [deviceWh, setDeviceWh] = useState('15');
  const wh = Number(capacity) * 3.7 / 1000;
  const usableWh = wh * 0.8;
  const charges = deviceWh ? Math.max(0, usableWh / Number(deviceWh)).toFixed(1) : '0';
  return (
    <>
      <PageMeta title="التوصيل داخل اليمن" description="معلومات الشحن والتوصيل داخل اليمن من CABL." />
      <EditorialHero eyebrow="التوصيل / اليمن" title="راجع خيارات الشحن حسب محافظتك" description={`راجع خيارات الشحن الحالية قبل تأكيد طلبك إلى ${slug === 'yemen' ? 'المحافظة التي تختارها' : slug}.`}>
        <Link href="/checkout" className="button button-primary">ابدأ طلبك <ArrowLeft size={16} /></Link>
      </EditorialHero>
      <EditorialSection title="خيارات الشحن الحالية">
        <InfoCards items={(catalog?.shippingOptions || []).map((option) => ({ icon: <Truck />, title: option.name, text: `${option.free ? 'بدون رسوم شحن' : `الرسوم الحالية ${formatPrice(option.charge)}`} — المدة التقديرية ${option.estimatedDays ? `${option.estimatedDays} أيام` : 'تؤكد مع الطلب'}.` }))} />
        {!catalog?.shippingOptions?.length && <p className="empty-state">ستظهر خيارات الشحن النشطة بعد إدخال المدينة والعنوان في checkout.</p>}
      </EditorialSection>
      <EditorialSection title="اختيار حل مناسب للتغطية والطاقة">
        <div className="numbered-steps">
          <div><b>01</b><h3>ابدأ من الجهاز</h3><p>الهاتف والتابلت واللابتوب والراوتر لا يحتاجون نفس القدرة أو الكابل.</p></div>
          <div><b>02</b><h3>راجع العنوان</h3><p>أدخل المدينة والعنوان في checkout حتى تظهر طريقة الشحن الأنسب.</p></div>
          <div><b>03</b><h3>قارن الحلول</h3><p>وازن بين السعة والوزن والقدرة، ثم راجع المنتجات المتاحة فعلياً.</p></div>
          <div><b>04</b><h3>أكد التفاصيل</h3><p>راجع السعر والشحن وطريقة الدفع قبل إرسال الطلب.</p></div>
        </div>
      </EditorialSection>
      <EditorialSection eyebrow="حاسبة تقريبية" title="من mAh إلى Wh وعدد الشحنات">
        <div className="calculator-card">
          <div className="calculator-fields">
            <label className="form-field"><span>سعة البطارية mAh</span><input type="number" min="1000" value={capacity} onChange={(event) => setCapacity(event.target.value)} /></label>
            <label className="form-field"><span>استهلاك الجهاز Wh</span><input type="number" min="1" step="0.1" value={deviceWh} onChange={(event) => setDeviceWh(event.target.value)} /></label>
          </div>
          <div className="calculator-result"><strong>{wh.toFixed(1)} Wh</strong><span>طاقة نظرية عند 3.7V</span><strong>{usableWh.toFixed(1)} Wh</strong><span>تقدير قابل للاستخدام بعد فقد التحويل</span><strong>{charges}</strong><span>شحنة مكافئة تقريبية</span></div>
        </div>
        <p className="content-disclaimer">الحاسبة تقريبية. الجهد الفعلي والكفاءة والحمل والحرارة والكابل تغيّر النتيجة، لذلك لا تستخدمها كوعد بعدد شحنات ثابت.</p>
      </EditorialSection>
      <EditorialSection title="إرشادات حسب الجهاز">
        <InfoCards items={[
          { icon: <Zap />, title: 'الهاتف', text: 'طابق قدرة الخرج مع الشاحن والكابل، وراجع دعم الشحن السريع الخاص بهاتفك.' },
          { icon: <Package />, title: 'الراوتر', text: 'تحقق من جهد الراوتر ومقبسه قبل استخدام أي حل طاقة محمول.' },
          { icon: <ShieldCheck />, title: 'اللابتوب', text: 'ابحث عن USB-C PD بقدرة مناسبة، ولا تعتمد على السعة وحدها.' },
          { icon: <Truck />, title: 'قبل الاستلام', text: 'راجع عنوانك وخيار الشحن وسياسة الإرجاع من الروابط الرسمية.' },
        ]} />
      </EditorialSection>
      <EditorialSection title="أسئلة التوصيل">
        <FAQList items={[
          { question: 'كم تستغرق مدة التوصيل؟', answer: 'المدة الظاهرة في checkout تقديرية حسب طريقة الشحن والعنوان، ويؤكد فريق الطلب التفاصيل عند المراجعة.' },
          { question: 'هل الشحن مجاني؟', answer: 'تظهر الرسوم الفعلية من خيارات الشحن النشطة في قاعدة بيانات CABL، ولا نعتمد على حد مجاني مخترع.' },
          { question: 'هل تصلون إلى كل المحافظات؟', answer: 'اختر المدينة والعنوان في الطلب؛ خيارات الشحن الحالية هي المرجع العملي للتغطية.' },
          { question: 'أين أجد شروط الإرجاع؟', answer: 'راجع سياسة الإرجاع والاستبدال قبل التأكيد، واحتفظ برقم الطلب وإثبات الشراء.' },
        ]} />
      </EditorialSection>
      <EditorialSection title="روابط مهمة">
        <RelatedLinks links={[
          { label: 'سياسة الشحن', href: '/shipping', text: 'اعرف كيف تظهر المدة والرسوم وطريقة الدفع.' },
          { label: 'سياسة الإرجاع', href: '/return-policy', text: 'راجع الشروط والخطوات بعد الشراء.' },
          { label: 'الأسئلة الشائعة', href: '/faq', text: 'إجابات عامة عن الطلب والمنتجات.' },
        ]} />
      </EditorialSection>
      <CTASection />
    </>
  );
}

export function SolutionPage() {
  const { catalog } = useStore();
  const products = (catalog?.products || []).filter((product) => /سيارة|car|كابل|شاحن/i.test(`${product.productName} ${product.shortDescription || ''}`)).slice(0, 6);
  return (
    <>
      <PageMeta title="حلول الشحن اليومية" description="حلول CABL لمشاكل الشحن والحرارة والبطارية أثناء الاستخدام اليومي." />
      <EditorialHero eyebrow="حل عملي" title="حل مشكلة الشحن البطيء في السيارة" description="ابدأ من شاحن سيارة USB-C مناسب، وكابل مصنف، واستخدام يقلل الحرارة أثناء الملاحة والتنقل." />
      <EditorialSection eyebrow="افهم المشكلة" title="لماذا يصبح الشحن بطيئاً؟">
        <div className="editorial-copy">
          <p>السرعة لا تعتمد على الشاحن وحده. الجهاز يطلب قدرة محددة، والكابل يحدد ما يمكن نقله، والحرارة قد تجعل الهاتف يخفض القدرة لحماية البطارية.</p>
          <p>محول USB-A قديم قد يشحن هاتفاً حديثاً، لكنه لا يوفّر بالضرورة تفاوض USB-C PD المطلوب للسرعة والاستقرار.</p>
        </div>
      </EditorialSection>
      <EditorialSection title="الحل التقني المقترح">
        <div className="check-list large-checks">
          <div><Check size={18} /> استخدم شاحناً بقدرة تناسب تفاوض هاتفك.</div>
          <div><Check size={18} /> استخدم كابل USB-C مصنفاً للقدرة المطلوبة.</div>
          <div><Check size={18} /> خفّض السطوع وتجنب الشحن اللاسلكي عند ارتفاع الحرارة.</div>
          <div><Check size={18} /> أوقف الشحن إذا استمر الاختناق الحراري.</div>
        </div>
      </EditorialSection>
      <EditorialSection title="قائمة فحص من أربع خطوات">
        <div className="numbered-steps">
          <div><b>01</b><h3>افحص المنفذ</h3><p>حدد USB-C أو USB-A وتأكد من اتجاه الكابل وجودته.</p></div>
          <div><b>02</b><h3>راجع القدرة</h3><p>طابق خرج الشاحن مع ما يقبله الهاتف أو الجهاز.</p></div>
          <div><b>03</b><h3>راقب الحرارة</h3><p>الحرارة العالية أثناء الملاحة والشحن قد تخفض السرعة.</p></div>
          <div><b>04</b><h3>اختبر التغيير</h3><p>غيّر قطعة واحدة في كل مرة حتى تعرف سبب المشكلة.</p></div>
        </div>
      </EditorialSection>
      <EditorialSection title="منتجات موصى بها من الكتالوج">
        {catalog ? <ProductGrid products={products} empty="لا توجد منتجات مرتبطة بهذا الحل حالياً." /> : <LoadingCatalog />}
      </EditorialSection>
      <EditorialSection title="أسئلة شائعة">
        <FAQList items={[
          { question: 'هل USB-A يكفي للهاتف الحديث؟', answer: 'قد يشحن، لكنه لا يوفّر بالضرورة تفاوض USB-C PD المطلوب للسرعة والاستقرار.' },
          { question: 'هل PPS ضروري؟', answer: 'PD هو الأساس، وPPS يفيد بعض أجهزة أندرويد. راجع ما يقبله هاتفك تحديداً.' },
          { question: 'هل الكابل الرخيص هو سبب المشكلة؟', answer: 'قد يكون السبب إذا كان تالفاً أو غير مصنف للقدرة المطلوبة. استبدله بقطعة موثوقة واختبر النتيجة.' },
        ]} />
      </EditorialSection>
      <EditorialSection title="حلول مرتبطة">
        <RelatedLinks links={[
          { label: 'دليل باور بانك', href: '/blog/best-power-bank-yemen', text: 'اختر السعة والقدرة حسب يومك.' },
          { label: 'مركز المواصفات', href: '/lab', text: 'افصل بين المواصفة والحساب والقياس.' },
        ]} />
      </EditorialSection>
      <CTASection />
    </>
  );
}

export function LabPage() {
  const { catalog, isLoading, isError } = useStore();
  const products = catalog?.products || [];
  const groups = useMemo(() => {
    const grouped = new Map<string, StoreProduct[]>();
    products.forEach((product) => {
      const key = product.category?.name || 'إكسسوارات عامة';
      grouped.set(key, [...(grouped.get(key) || []), product]);
    });
    return Array.from(grouped.entries());
  }, [products]);
  return (
    <>
      <PageMeta title="مركز المواصفات" description="مركز CABL لفهم مواصفات المنتجات والحسابات والتوافق قبل الشراء." />
      <EditorialHero eyebrow="CABL LAB" title="مركز المواصفات قبل أن تختار" description="فهرس عملي لبيانات المنتجات المنشورة. نعرض ما يأتي من الكتالوج، ونفصل بين المواصفة المعلنة وأي تقدير توضيحي." />
      <EditorialSection title="منهجية المركز">
        <InfoCards items={[
          { icon: <FlaskConical />, title: 'المصدر أولاً', text: 'القدرة والمنافذ والموديل تبدأ من المعلومات المنشورة للمنتج.' },
          { icon: <Zap />, title: 'الحساب منفصل عن القياس', text: 'أي حساب للطاقة أو عدد الشحنات تقديري، وليس نتيجة اختبار مخبرية.' },
          { icon: <ShieldCheck />, title: 'الحدود واضحة', text: 'لا نضيف ادعاء توافق أو ضمان إذا لم يظهر في بيانات المنتج.' },
        ]} />
      </EditorialSection>
      <EditorialSection title="فهرس المنتجات المنشورة">
        {isLoading ? <LoadingCatalog /> : isError ? <CatalogError retry={() => window.location.reload()} /> : groups.map(([group, groupProducts]) => (
          <div className="lab-group" key={group}>
            <h3>{group}</h3>
            <ProductComparisonTable products={groupProducts} currencies={catalog?.currencies} includeCategory />
          </div>
        ))}
      </EditorialSection>
      <EditorialSection title="ما الذي نعرفه وما الذي لم نقسه؟">
        <div className="editorial-copy">
          <p>العلامة والموديل والسعر والتوافر وأي مواصفات ظاهرة في صفحة المنتج هي بيانات كتالوج. أما الأداء الفعلي، مثل زمن الشحن أو عدد الشحنات أو الحرارة، فلا يُعرض كنتيجة قياس إلا إذا وُجد مصدر قياس موثق.</p>
          <p className="content-disclaimer">عندما لا توجد نتيجة اختبار، نعرض بوضوح: لم يُقَس في هذا المركز. لا نملأ الفراغ بأرقام تسويقية.</p>
        </div>
      </EditorialSection>
      <EditorialSection title="قواعد الحساب">
        <div className="check-list">
          <div><Check size={16} /> Wh = mAh × الجهد ÷ 1000.</div>
          <div><Check size={16} /> الشحنة المكافئة تقدير بعد خصم فقد التحويل، وليست وعداً.</div>
          <div><Check size={16} /> القدرة القصوى لا تعني أن كل جهاز سيستقبلها.</div>
          <div><Check size={16} /> التوافق يحتاج إلى الجهاز والكابل والبروتوكول معاً.</div>
        </div>
      </EditorialSection>
      <CTASection />
    </>
  );
}

export function VerifyPage() {
  const [serial, setSerial] = useState('');
  const [submitted, setSubmitted] = useState(false);
  return (
    <>
      <PageMeta title="التحقق من الضمان" description="راجع بيانات طلبك وشروط الضمان المنشورة لدى CABL." />
      <EditorialHero eyebrow="خدمة ما بعد الشراء" title="التحقق من سجل الضمان" description="أدخل رقم السيريال أو رقم المنتج الموجود على طلبك. لا نعرض نتيجة مصطنعة؛ نستخدم بيانات الطلب والمنتج المنشورة فقط." />
      <EditorialSection title="ابدأ التحقق">
        <form className="lookup-card warranty-form" onSubmit={(event: FormEvent) => { event.preventDefault(); setSubmitted(true); }}>
          <label className="form-field"><span>رقم السيريال أو SKU</span><input value={serial} onChange={(event) => setSerial(event.target.value)} placeholder="مثلاً: CABL-..." required data-testid="input-warranty-serial" /></label>
          <button className="button button-primary" type="submit" data-testid="button-warranty-submit">إرسال للمراجعة <ShieldCheck size={16} /></button>
          {submitted && <div className="notice" role="status">تم تسجيل الرقم للمراجعة. احتفظ برقم طلبك، ثم استخدم صفحة تتبع الطلب لعرض بيانات الشراء وشروط المنتج.</div>}
        </form>
      </EditorialSection>
      <EditorialSection title="ما الذي نتحقق منه؟">
        <InfoCards items={[
          { icon: <Package />, title: 'رقم الطلب', text: 'رقم الطلب يربط المنتج بالشراء الصحيح.', href: '/orders' },
          { icon: <ShieldCheck />, title: 'شروط المنتج', text: 'مدة وشروط الضمان لا تُفترض؛ راجع ما يظهر في صفحة المنتج أو تأكيد الطلب.' },
          { icon: <MessageCircle />, title: 'مشكلة بعد الاستلام', text: 'اكتب وصف المشكلة ورقم الطلب حتى يمكن مراجعتها بوضوح.', href: '/contact' },
        ]} />
      </EditorialSection>
      <EditorialSection title="تنبيه مهم">
        <div className="policy-highlight"><strong>لا تظهر نتيجة اعتماد تلقائية</strong><span>التحقق يحتاج إلى مطابقة بيانات المنتج والطلب والشروط المنشورة. هذه الصفحة لا تنشئ ضماناً جديداً.</span></div>
      </EditorialSection>
      <CTASection />
    </>
  );
}

export function ShippingPage() {
  const { catalog, formatPrice } = useStore();
  return (
    <>
      <PageMeta title="الشحن والتوصيل" description="سياسة الشحن والتوصيل الحالية في متجر CABL داخل اليمن." />
      <EditorialHero eyebrow="سياسة الشحن" title="الشحن والتوصيل" description="تعرف على مناطق التوصيل والمدة والرسوم قبل تأكيد الطلب." />
      <EditorialSection title="مناطق التوصيل">
        <div className="policy-list">
          <p><MapPin size={17} /> نخدم العناوين التي تظهر لها طريقة شحن نشطة في checkout داخل اليمن.</p>
          <p><Check size={17} /> المدينة والعنوان يحددان الخيار المتاح والمدة التقديرية.</p>
          <p><Check size={17} /> لا نعد بتغطية عنوان غير ظاهر في خيارات الشحن الحالية.</p>
        </div>
      </EditorialSection>
      <EditorialSection title="طرق الشحن والرسوم">
        <InfoCards items={(catalog?.shippingOptions || []).map((option) => ({ icon: <Truck />, title: option.name, text: `${option.free ? 'بدون رسوم شحن' : `الرسوم الحالية ${formatPrice(option.charge)}`} — ${option.estimatedDays ? `المدة التقديرية ${option.estimatedDays} أيام` : 'المدة تؤكد مع الطلب'}.` }))} />
        {!catalog?.shippingOptions?.length && <p className="empty-state">تظهر الطرق والرسوم النشطة في checkout بعد إدخال بيانات العنوان.</p>}
      </EditorialSection>
      <EditorialSection title="المدة والتكلفة والدفع">
        <div className="policy-grid">
          <div><strong>المدة التقديرية</strong><p>تظهر بجانب طريقة الشحن قبل إرسال الطلب.</p></div>
          <div><strong>الرسوم</strong><p>تظهر من قاعدة بيانات الشحن وبالعملة المختارة للعرض.</p></div>
          <div><strong>الدفع</strong><p>تظهر طرق الدفع النشطة في checkout، ولا يتم إخفاء الخيار غير المتاح.</p></div>
        </div>
      </EditorialSection>
      <EditorialSection title="قبل التأكيد">
        <div className="numbered-steps">
          <div><b>01</b><h3>راجع العنوان</h3><p>اكتب المدينة والعنوان بوضوح.</p></div>
          <div><b>02</b><h3>قارن الخيارات</h3><p>اختر المدة والرسوم المناسبة.</p></div>
          <div><b>03</b><h3>راجع سياسة الإرجاع</h3><p>اعرف الشروط قبل الإرسال.</p></div>
          <div><b>04</b><h3>احتفظ بالرقم</h3><p>بعد إرسال الطلب، احفظ رقم الطلب للتتبع.</p></div>
        </div>
      </EditorialSection>
      <EditorialSection title="أسئلة الشحن">
        <FAQList items={[
          { question: 'هل تصلون إلى عنواني؟', answer: 'أدخل المدينة والعنوان في checkout؛ الخيار النشط الظاهر هناك هو المرجع العملي للتغطية.' },
          { question: 'هل الرسوم ثابتة؟', answer: 'قد تختلف حسب العنوان وطريقة الشحن. اعتمد على القيمة الظاهرة قبل تأكيد الطلب.' },
          { question: 'هل يمكن تغيير العنوان بعد الإرسال؟', answer: 'تواصل ببيانات الطلب قبل بدء التجهيز؛ إمكانية التعديل تعتمد على حالة الطلب.' },
        ]} />
      </EditorialSection>
      <CTASection />
    </>
  );
}

export function ReturnPage() {
  return (
    <>
      <PageMeta title="سياسة الإرجاع والاستبدال" description="الشروط والخطوات العامة للإرجاع والاستبدال في CABL." />
      <EditorialHero eyebrow="خدمة ما بعد الشراء" title="سياسة الإرجاع والاستبدال" description="راجع حالة المنتج والطلب قبل طلب الإرجاع، واحتفظ برقم الطلب وإثبات الشراء." />
      <EditorialSection title="قبل طلب الإرجاع">
        <div className="policy-highlight"><strong>الأهلية حسب الشروط المنشورة للمنتج والطلب</strong><span>تختلف الأهلية بحسب حالة المنتج وطريقة الشراء. لا تعتبر هذه الصفحة موافقة تلقائية.</span></div>
      </EditorialSection>
      <EditorialSection title="شروط الإرجاع">
        <div className="check-list">
          <div><Check size={16} /> المنتج بحالته الأصلية وغير مستخدم.</div>
          <div><Check size={16} /> التغليف والملحقات والكتيبات موجودة.</div>
          <div><Check size={16} /> رقم الطلب أو إثبات الشراء متوفر.</div>
          <div><Check size={16} /> لا يوجد تلف بسبب سوء الاستخدام أو التعديل.</div>
          <div><Check size={16} /> وصف المشكلة وصور الحالة مرفقة عند الحاجة.</div>
        </div>
      </EditorialSection>
      <EditorialSection title="خطوات الإرجاع والاستبدال">
        <div className="numbered-steps">
          <div><b>01</b><h3>راجع الطلب</h3><p>افتح تفاصيل الطلب وتحقق من المنتج.</p></div>
          <div><b>02</b><h3>اكتب المشكلة</h3><p>احتفظ بصور واضحة ووصف مختصر.</p></div>
          <div><b>03</b><h3>أرسل المراجعة</h3><p>استخدم بيانات الطلب حتى يمكن مطابقة المنتج.</p></div>
          <div><b>04</b><h3>انتظر القرار</h3><p>تؤكد الأهلية والخطوة التالية بعد مراجعة البيانات.</p></div>
        </div>
      </EditorialSection>
      <EditorialSection title="المنتجات المعيبة أو المختلفة">
        <div className="editorial-copy">
          <p>إذا وصل المنتج تالفاً أو مختلفاً عن الطلب، اذكر ذلك مباشرة مع رقم الطلب. احتفظ بالتغليف ولا تعدّل المنتج قبل المراجعة.</p>
          <p>بعد انتهاء فترة الإرجاع، تُراجع الحالة وفق شروط المنتج والضمان المنشورة. لا نعرض مدة أو نتيجة غير موجودة في الشروط الحالية.</p>
        </div>
      </EditorialSection>
      <EditorialSection title="أسئلة الإرجاع">
        <FAQList items={[
          { question: 'هل الإرجاع متاح لكل المنتجات؟', answer: 'تحدد الأهلية حالة المنتج وشروط الطلب. راجع الصفحة والتأكيد قبل الشراء.' },
          { question: 'متى أحصل على المبلغ؟', answer: 'لا نعد بمدة ثابتة هنا؛ تُحدد الخطوة التالية بعد قبول الحالة ومراجعة طريقة الدفع.' },
          { question: 'ماذا أحتاج عند التواصل؟', answer: 'رقم الطلب، اسم المنتج أو SKU، وصف المشكلة، وصور واضحة عند الحاجة.' },
        ]} />
      </EditorialSection>
      <CTASection />
    </>
  );
}

export function FAQPage() {
  const orderItems = [
    { question: 'كيف أقوم بالطلب؟', answer: 'تصفح الكتالوج، أضف المنتجات للسلة، أدخل بيانات العنوان واختر الشحن والدفع ثم أكد الطلب.' },
    { question: 'هل يمكن تعديل الطلب بعد إرساله؟', answer: 'استخدم رقم الطلب وتواصل عبر مسار الدعم المتاح قبل بدء التجهيز؛ إمكانية التعديل تعتمد على حالة الطلب.' },
    { question: 'كم تستغرق مدة التوصيل؟', answer: 'المدة التقديرية تظهر بجانب خيار الشحن، وقد تتغير بعد مراجعة المدينة والعنوان.' },
    { question: 'هل يمكنني تتبع طلبي؟', answer: 'نعم. افتح صفحة تتبع الطلب وأدخل البريد ورقم الهاتف المستخدمين عند الشراء.' },
  ];
  const productItems = [
    { question: 'هل المنتجات أصلية؟', answer: 'نعرض العلامة والموديل كما في بيانات المنتج. راجع الوصف والصور وشروط الضمان والإرجاع قبل التأكيد.' },
    { question: 'كيف أعرف أن الشاحن مناسب؟', answer: 'طابق المنفذ والقدرة والبروتوكول والكابل مع جهازك، ولا تعتمد على شكل المنفذ وحده.' },
    { question: 'هل أستطيع استخدام عملة أخرى؟', answer: 'نعم للعرض فقط؛ تظل حسابات الكتالوج والطلب بالدولار داخلياً كما هو موضح في الأسعار.' },
  ];
  const afterSaleItems = [
    { question: 'ما طرق الدفع المتاحة؟', answer: 'طرق الدفع النشطة تظهر في checkout من قاعدة بيانات CABL، مع تعليمات كل طريقة قبل إرسال الطلب.' },
    { question: 'ماذا أفعل إذا وصل المنتج بمشكلة؟', answer: 'احتفظ برقم الطلب وصور المنتج والتغليف، ثم راجع سياسة الإرجاع وسجل المشكلة بوضوح.' },
    { question: 'هل يوجد ضمان لكل منتج؟', answer: 'لا نفترض مدة ضمان. راجع ما يظهر في صفحة المنتج أو تأكيد الطلب وشروط الضمان المنشورة.' },
  ];
  return (
    <>
      <PageMeta title="الأسئلة الشائعة" description="إجابات CABL عن الطلب والشحن والضمان والمنتجات والدفع." />
      <EditorialHero eyebrow="مساعدة سريعة" title="الأسئلة الشائعة" description="إجابات مباشرة على أكثر الأسئلة التي تظهر قبل وبعد شراء إكسسواراتك." />
      <EditorialSection title="الطلب والتوصيل"><FAQList items={orderItems} /></EditorialSection>
      <EditorialSection title="المنتجات والتوافق"><FAQList items={productItems} /></EditorialSection>
      <EditorialSection title="الدفع وما بعد الشراء"><FAQList items={afterSaleItems} /></EditorialSection>
      <EditorialSection title="أسئلة من الشارع">
        <FAQList items={[
          { question: 'هل أحتاج إلى أغلى كابل؟', answer: 'تحتاج إلى كابل مصنف للقدرة والبروتوكول المطلوبين، لا إلى أعلى سعر بالضرورة.' },
          { question: 'هل الشحن السريع يضر البطارية؟', answer: 'استخدم شاحناً وكابلاً مناسبين، وراقب الحرارة. الجهاز ينظم القدرة ضمن ما يدعمه عادة.' },
          { question: 'هل أستطيع الطلب من الهاتف؟', answer: 'نعم، المسار نفسه متاح من المتصفح: كتالوج، سلة، checkout، ثم تتبع الطلب.' },
        ]} />
      </EditorialSection>
      <EditorialSection title="ما زلت تحتاج مساعدة؟">
        <div className="help-banner"><MessageCircle size={24} /><div><h3>ابدأ من بيانات طلب واضحة</h3><p>تصفح الكتالوج أو افتح صفحة تتبع الطلب، وستجد المعلومات المطلوبة في نفس المسار.</p></div><Link href="/orders" className="button button-primary">تتبع طلبك <ArrowLeft size={16} /></Link></div>
      </EditorialSection>
      <CTASection />
    </>
  );
}

export function ContactPage() {
  return (
    <>
      <PageMeta title="تواصل معنا" description="تواصل مع CABL حول الطلبات والمنتجات وخدمة ما بعد الشراء." />
      <EditorialHero eyebrow="CABL / خدمة العملاء" title="تواصل معنا" description="نساعدك من خلال بيانات الطلب والمنتج حتى تكون الإجابة مرتبطة بعملية شراء واضحة." />
      <EditorialSection title="مسارات الخدمة">
        <InfoCards items={[
          { icon: <Package />, title: 'عن طلب موجود', text: 'أدخل البريد ورقم الهاتف في صفحة التتبع لعرض الطلب.', href: '/orders' },
          { icon: <BookOpen />, title: 'قبل الشراء', text: 'اقرأ المواصفات ودليل الشراء قبل إضافة المنتج للسلة.', href: '/blog/best-power-bank-yemen' },
          { icon: <RefreshCcw />, title: 'إرجاع أو استبدال', text: 'راجع الشروط والخطوات قبل إرسال طلب المراجعة.', href: '/return-policy' },
          { icon: <ShieldCheck />, title: 'تحقق من الضمان', text: 'استخدم رقم السيريال أو SKU مع بيانات طلبك.', href: '/verify' },
        ]} />
      </EditorialSection>
      <EditorialSection title="كيف تكتب طلب مساعدة مفيداً؟">
        <div className="check-list large-checks">
          <div><Check size={18} /> اذكر رقم الطلب إن كان موجوداً.</div>
          <div><Check size={18} /> اكتب اسم المنتج أو SKU.</div>
          <div><Check size={18} /> صف المشكلة ووقت ظهورها.</div>
          <div><Check size={18} /> أرفق صور التغليف أو المنتج عند الحاجة.</div>
          <div><Check size={18} /> لا ترسل بيانات دفع سرية أو كلمات مرور.</div>
        </div>
      </EditorialSection>
      <EditorialSection title="قنوات ومعلومات التواصل">
        <div className="editorial-copy">
          <p>استخدم مسار الطلب أو صفحة السياسة المرتبطة بمشكلتك حتى تصل المراجعة إلى المعلومات الصحيحة. لا نضع رقماً أو بريداً أو ساعات عمل غير منشورة في قاعدة بيانات CABL.</p>
          <p>إذا لم يكن لديك طلب، ابدأ من صفحة المنتج أو دليل الشراء واكتب اسم المنتج والمعلومة التي تريد التأكد منها.</p>
        </div>
      </EditorialSection>
      <EditorialSection title="أسئلة متكررة">
        <FAQList items={[
          { question: 'أين أجد بيانات المنتج؟', answer: 'في صفحة المنتج، أسفل السعر والتوافر والمواصفات.' },
          { question: 'أين أجد بيانات الشحن والدفع؟', answer: 'في صفحة checkout وقسم السياسات، قبل تأكيد الطلب.' },
          { question: 'كيف أتابع بعد الشراء؟', answer: 'من صفحة تتبع الطلب باستخدام البريد ورقم الهاتف.' },
        ]} />
      </EditorialSection>
      <CTASection />
    </>
  );
}

export function HomeImportedSections({ products }: { products: StoreProduct[] }) {
  const recommendations = products.slice(0, 4);
  const categoryLinks = Array.from(new Map(products.filter((product) => product.category).map((product) => [product.category!.slug, product.category!])).values()).slice(0, 5);
  return (
    <>
      <EditorialSection eyebrow="اختر المشكلة أولاً" title="ما الذي تريد حله اليوم؟">
        <div className="info-card-grid">
          {[
            ['شحن الهاتف ببطء', 'ابدأ من قدرة الشاحن والكابل والحرارة.', '/solutions/slow-car-charging', <Zap />],
            ['انقطاع الكهرباء', 'قارن باور بانك أو حل طاقة يناسب مدة الاستخدام.', '/blog/best-power-bank-yemen', <Package />],
            ['كابل لا يعمل', 'راجع المنفذ والتصنيف والتوافق قبل الاستبدال.', '/lab', <ShieldCheck />],
            ['صوتيات يومية', 'اختر السماعة أو الملحق حسب الاستخدام الحقيقي.', '/search?view=brands', <Headphones />],
            ['طلب وشحن', 'راجع الرسوم والمدة قبل تأكيد السلة.', '/shipping', <Truck />],
          ].map(([title, text, href, icon]) => <Link className="info-card" href={href as string} key={title as string}><span className="info-card-icon">{icon}</span><h3>{title as string}</h3><p>{text as string}</p><span className="text-link">ابدأ من هنا <ArrowLeft size={14} /></span></Link>)}
        </div>
      </EditorialSection>
      <EditorialSection eyebrow="أربع عائلات" title="منتجات تخدم يومك، لا مجرد أرقام">
        <div className="info-card-grid">
          {[
            ['الطاقة الاحتياطية', 'حلول للهواتف والراوتر والتنقل، مع شرح السعة والقدرة.', categoryLinks[0] ? `/category/${categoryLinks[0].slug}` : '/search'],
            ['الشحن والكابلات', 'منفذ صحيح، قدرة مناسبة، وكابل لا يختنق عند الاستخدام.', categoryLinks[1] ? `/category/${categoryLinks[1].slug}` : '/search'],
            ['الصوتيات', 'اختيارات للاستخدام اليومي والعمل والسفر حسب المتاح.', categoryLinks[2] ? `/category/${categoryLinks[2].slug}` : '/search'],
            ['الإكسسوارات', 'قطع صغيرة تحل مشكلة محددة دون تعقيد.', '/search'],
          ].map(([title, text, href]) => <Link className="info-card" href={href} key={title}><h3>{title}</h3><p>{text}</p><span className="text-link">استكشف <ArrowLeft size={14} /></span></Link>)}
        </div>
      </EditorialSection>
      <EditorialSection eyebrow="اقتراح سريع" title="قل لنا احتياجك">
        <div className="editorial-copy"><p>ابدأ من جهازك ومدة استخدامك وميزانيتك، ثم افتح تفاصيل المنتج لمراجعة التوافق والتوافر. لا نختار بالنيابة عنك ولا نعرض توصية منفصلة عن الكتالوج.</p></div>
        {recommendations.length ? <ProductGrid products={recommendations} empty="لا توجد توصيات حالياً." /> : <p className="empty-state">لا توجد منتجات منشورة حالياً.</p>}
      </EditorialSection>
      <EditorialSection title="ما الذي يساعدك قبل الشراء؟">
        <InfoCards items={[
          { icon: <ShieldCheck />, title: 'المعلومة قبل الزينة', text: 'العلامة والموديل والسعر والتوافر تظهر قبل الإضافة إلى السلة.' },
          { icon: <FlaskConical />, title: 'الحدود مكتوبة', text: 'نوضح ما نعرفه وما لم يُقَس بدلاً من أرقام غير موثقة.' },
          { icon: <Truck />, title: 'الشحن في نفس المسار', text: 'تظهر خيارات الشحن والدفع في checkout قبل إرسال الطلب.' },
        ]} />
      </EditorialSection>
      <EditorialSection title="أدلة تساعدك على الاختيار">
        <RelatedLinks links={[
          { label: 'اختيار باور بانك', href: '/blog/best-power-bank-yemen', text: 'mAh وWh والقدرة والمنافذ في دليل واحد.' },
          { label: 'حل الشحن البطيء', href: '/solutions/slow-car-charging', text: 'افهم دور الشاحن والكابل والحرارة.' },
          { label: 'مركز المواصفات', href: '/lab', text: 'اقرأ البيانات المنشورة والحسابات التوضيحية.' },
        ]} />
      </EditorialSection>
      <EditorialSection title="العلامات والأقسام المتاحة">
        <div className="brand-list editorial-brand-list">{categoryLinks.map((category) => <Link className="brand-pill" href={`/category/${category.slug}`} key={category.slug}>{category.name}</Link>)}</div>
      </EditorialSection>
      <EditorialSection title="أسئلة سريعة">
        <FAQList items={[
          { question: 'من أين أبدأ إذا لم أعرف اسم المنتج؟', answer: 'ابدأ من المشكلة أو الجهاز، ثم استخدم الفئات ودليل الشراء للوصول إلى المنتج.' },
          { question: 'هل كل ما يظهر متوفر؟', answer: 'التوافر مرتبط بالكمية المنشورة وقت التصفح، ويعاد التحقق عند الإضافة والطلب.' },
          { question: 'هل السعر يشمل الشحن؟', answer: 'السعر يظهر للمنتج، وتظهر رسوم الشحن بعد اختيار العنوان والطريقة في checkout.' },
        ]} />
      </EditorialSection>
    </>
  );
}

export function CollectionEditorial({
  mode,
  name,
  products,
}: {
  mode: 'category' | 'brand';
  name: string;
  products: StoreProduct[];
}) {
  const isBrand = mode === 'brand';
  const audio = products.filter((product) => /سماعة|audio|head|ear|speaker/i.test(`${product.productName} ${product.shortDescription || ''}`)).slice(0, 4);
  return (
    <EditorialSection eyebrow={isBrand ? 'دليل العلامة' : 'دليل القسم'} title={`كيف تختار من ${name}؟`}>
      <div className="editorial-copy">
        <p>{isBrand ? `راجع موديلات ${name} من الكتالوج الحالي بحسب الاستخدام والقدرة والتوافر، ولا تفترض أن كل منتج من العلامة يملك نفس المواصفات.` : `هذا القسم يجمع منتجات ${name}. ابدأ من الاستخدام والمنافذ والقدرة، ثم قارن المنتجات المتاحة فعلياً قبل الطلب.`}</p>
      </div>
      <div className="numbered-steps">
        <div><b>01</b><h3>حدد الاستخدام</h3><p>هاتف، سفر، سيارة، عمل أو صوتيات؟ الاستخدام يضيق الاختيار.</p></div>
        <div><b>02</b><h3>اقرأ المواصفات</h3><p>راجع الموديل والمنافذ والقدرة والملحقات بدلاً من الاسم التجاري فقط.</p></div>
        <div><b>03</b><h3>قارن المتاح</h3><p>قارن السعر والتوافر والقيود بين المنتجات المنشورة.</p></div>
      </div>
      <EditorialSection eyebrow={isBrand ? 'مختارات صوتية' : 'مقارنة عملية'} title={isBrand ? `اختيارات صوتية من ${name}` : `مقارنة منتجات ${name}`}>
        {isBrand && audio.length ? <ProductComparisonTable products={audio} /> : products.length ? <ProductComparisonTable products={products.slice(0, 6)} /> : <p className="empty-state">لا توجد منتجات منشورة في هذه المجموعة حالياً.</p>}
      </EditorialSection>
      <EditorialSection title="تحذيرات القراءة والشراء">
        <div className="check-list">
          <div><Check size={16} /> الاسم أو الصورة لا يكفيان لإثبات القدرة أو التوافق.</div>
          <div><Check size={16} /> راجع رقم الموديل والمنافذ والملحقات في صفحة المنتج.</div>
          <div><Check size={16} /> لا تعتبر التقدير العملي نتيجة اختبار مخبري.</div>
          <div><Check size={16} /> افحص التوافر وسياسة الشحن والإرجاع قبل التأكيد.</div>
        </div>
      </EditorialSection>
      <EditorialSection title="أسئلة هذه المجموعة">
        <FAQList items={[
          { question: 'كيف أختار بين موديلين متشابهين؟', answer: 'قارن الاستخدام، القدرة، المنافذ، الحجم، التوافر والسعر من صفحات المنتج.' },
          { question: 'هل كل منتجات العلامة متاحة للشحن؟', answer: 'التغطية والخيار الفعلي يظهران في checkout بعد إدخال العنوان.' },
          { question: 'أين أقرأ شروط الإرجاع؟', answer: 'افتح سياسة الإرجاع قبل الطلب، واحتفظ برقم الطلب وإثبات الشراء.' },
        ]} />
      </EditorialSection>
      <EditorialSection title="روابط مرتبطة">
        <RelatedLinks links={[
          { label: 'دليل الشراء', href: '/blog/best-power-bank-yemen', text: 'قارن السعة والقدرة حسب الاستخدام.' },
          { label: 'الشحن', href: '/shipping', text: 'راجع الرسوم والمدة قبل التأكيد.' },
          { label: 'الإرجاع', href: '/return-policy', text: 'اعرف الشروط والخطوات بعد الشراء.' },
        ]} />
      </EditorialSection>
    </EditorialSection>
  );
}

export function ProductEditorial({ product }: { product: StoreProduct }) {
  const { catalog } = useStore();
  const related = (catalog?.products || []).filter((item) => item.id !== product.id && (item.category?.slug === product.category?.slug || item.brand === product.brand)).slice(0, 4);
  return (
    <>
      <EditorialSection eyebrow="تفاصيل الاستخدام" title="الخلاصة العملية">
        <div className="product-editorial-grid">
          <div><h3>ما الذي نعرفه؟</h3><p>{product.shortDescription || product.productDescription || 'بيانات أساسية منشورة في كتالوج CABL.'}</p></div>
          <div><h3>لمن يناسب؟</h3><p>يناسب الاستخدام الذي يطابق منافذه وقدرته وتوافقه. راجع جهازك قبل الدفع.</p></div>
          <div><h3>ما الذي يجب مراجعته؟</h3><p>طابق المنفذ والقدرة والتوافق مع جهازك، ثم راجع التوافر والضمان والإرجاع الحاليين.</p></div>
          <div><h3>الشحن والدفع</h3><p>تظهر خيارات الشحن والدفع النشطة في checkout قبل إرسال الطلب.</p></div>
        </div>
      </EditorialSection>
      <EditorialSection title="المواصفات والتوافق">
        <div className="comparison-table-wrap"><table className="comparison-table"><tbody>
          <tr><th>العلامة</th><td>{product.brand}</td></tr>
          <tr><th>الموديل / SKU</th><td dir="ltr">{product.sku}</td></tr>
          <tr><th>القسم</th><td>{product.category?.name || 'إكسسوارات'}</td></tr>
          <tr><th>الحالة</th><td>{product.quantity > 0 ? 'متوفر حسب الكمية المنشورة' : 'غير متوفر حالياً'}</td></tr>
          <tr><th>البيانات المختبرة</th><td>لم تُعرض نتيجة اختبار مخبري مستقلة في هذه الصفحة.</td></tr>
        </tbody></table></div>
        <p className="content-disclaimer">المواصفات المعلنة لا تضمن الأداء نفسه مع كل جهاز. التوافق يحتاج إلى الجهاز والكابل والبروتوكول والحرارة.</p>
      </EditorialSection>
      <EditorialSection title="نقاط القوة والحدود">
        <div className="info-card-grid">
          <div className="info-card"><Check className="info-card-icon" /><h3>نقطة قوة</h3><p>العلامة والموديل والتوافر والسعر معروضة قبل الإضافة إلى السلة.</p></div>
          <div className="info-card"><ShieldCheck className="info-card-icon" /><h3>حد يجب معرفته</h3><p>لا نعد بسرعة أو عدد شحنات أو مدة ضمان غير موجودة في البيانات المنشورة.</p></div>
        </div>
      </EditorialSection>
      <EditorialSection title="الشحن والدفع والإرجاع">
        <div className="editorial-copy"><p>راجع خيارات الشحن وطرق الدفع في checkout بعد إدخال العنوان. راجع أيضاً سياسة الإرجاع والاستبدال قبل تأكيد الطلب.</p></div>
        <div className="inline-actions"><Link href="/shipping" className="button button-secondary">سياسة الشحن <ArrowLeft size={16} /></Link><Link href="/return-policy" className="button button-secondary">سياسة الإرجاع <ArrowLeft size={16} /></Link></div>
      </EditorialSection>
      <EditorialSection title="منتجات ذات صلة">
        {related.length ? <ProductGrid products={related} empty="لا توجد منتجات مرتبطة حالياً." /> : <p className="empty-state">لا توجد منتجات مرتبطة منشورة حالياً.</p>}
      </EditorialSection>
      <EditorialSection title="أسئلة عن هذا المنتج">
        <FAQList items={[
          { question: 'هل القدرة المعلنة تعني أن جهازي سيشحن بنفس السرعة؟', answer: 'لا. الجهاز والكابل والبروتوكول والحرارة تحدد القدرة الفعلية.' },
          { question: 'هل المنتج متوفر الآن؟', answer: product.quantity > 0 ? `نعم، الكمية المنشورة حالياً ${product.quantity} قطعة.` : 'غير متوفر حالياً حسب الكمية المنشورة.' },
          { question: 'أين أجد السعر النهائي؟', answer: 'السعر الحالي يظهر في الصفحة والسلة، وتضاف رسوم الشحن عند اختيار طريقة الشحن.' },
          { question: 'هل توجد مراجعات؟', answer: 'لا نعرض مراجعات مصطنعة. ستظهر فقط المراجعات المسجلة في مصدر البيانات عند توفرها.' },
        ]} />
      </EditorialSection>
    </>
  );
}