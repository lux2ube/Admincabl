import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { ArrowLeft, ArrowRight, BookOpen as BookOpenIcon, Check, ChevronLeft, FlaskConical, Headphones, MapPin as MapPinIcon, MessageCircle as MessageCircleIcon, Package, RefreshCcw, Search as SearchIcon, ShieldCheck, Smartphone, Truck, Zap } from 'lucide-react';
import { getGetStoreSeoQueryKey, getGetStoreOrderQueryKey, getListStoreOrdersQueryKey, useCreateStoreOrder, useGetStoreOrder, useGetStoreSeo, useListStoreOrders } from '@workspace/api-client-react';
import type { StoreOrderInput, StoreProduct } from '@workspace/api-client-react';
import { useStore } from '@/lib/store';
import { brandCategoryPath, brandPath, productPath } from '@/lib/store-routes';
import { setSeoHead } from '@/lib/seo-head';
import { Breadcrumbs, CTASection, CatalogError, CatalogToolbar, LoadingCatalog, PageHeading } from '@/components/page-parts';
import { CartLine, ProductGrid, QuantityControl } from '@/components/catalog-ui';
import { EditorialSection, FAQList, InfoCards, ProductEditorial } from '@/pages/content-pages';

function SEO({ type, slug }: { type: 'home' | 'category' | 'brand' | 'product'; slug?: string }) {
  const [location, navigate] = useLocation();
  const params = slug ? { type, slug } : { type };
  const { data } = useGetStoreSeo(params, { query: { queryKey: getGetStoreSeoQueryKey(params), enabled: true, staleTime: 60_000 } });
  useEffect(() => {
    if (!data) return;
    if (slug && data.slug && data.slug !== slug) {
      const redirectPath = type === 'product'
        ? data.canonicalPath
        : type === 'category'
          ? `/category/${data.slug}`
          : `/brand/${data.slug}`;
      if (location !== redirectPath) navigate(redirectPath);
      return;
    }
    setSeoHead({
      title: data.title,
      description: data.description,
      canonicalPath: data.canonicalPath,
      indexable: data.indexable,
      image: Array.isArray(data.jsonLd?.image) ? String(data.jsonLd.image[0]) : typeof data.jsonLd?.image === 'string' ? data.jsonLd.image : undefined,
      jsonLd: (() => {
        if (!data.breadcrumbs.length || data.entityType === 'home') return data.jsonLd;
        const primary = { ...data.jsonLd };
        delete primary['@context'];
        return {
          '@context': 'https://schema.org',
          '@graph': [
            primary,
            {
              '@type': 'BreadcrumbList',
              itemListElement: data.breadcrumbs.map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: item.name,
                item: item.path,
              })),
            },
          ],
        };
      })(),
    });
  }, [data, location, navigate, type]);
  return null;
}

function StaticSEO({ title, description, canonicalPath, indexable = true }: { title: string; description: string; canonicalPath?: string; indexable?: boolean }) {
  useEffect(() => {
    setSeoHead({ title: `${title} | CABL`, description, canonicalPath, indexable });
  }, [title, description, canonicalPath, indexable]);
  return null;
}

function NoIndex() {
  return <StaticSEO title="CABL" description="صفحة تنقل داخل متجر CABL." indexable={false} />;
}

function ProductImage({ product, className = '' }: { product: StoreProduct; className?: string }) {
  return <img className={className} src={product.images?.[0]} alt={product.productName} data-testid={`img-detail-${product.id}`}/>;
}

function LegacyHomePage() {
  const { catalog, isLoading, isError } = useStore();
  const [, navigate] = useLocation();
  const products = catalog?.products || [];
  const featured = useMemo(() => [...products].sort((a, b) => Number(Boolean(b.discountPrice)) - Number(Boolean(a.discountPrice))).slice(0, 8), [products]);
  const categories = useMemo(() => Array.from(new Map(products.filter((item) => item.category).map((item) => [item.category!.slug, item.category!])).values()).slice(0, 3), [products]);
  const brands = useMemo(() => Array.from(new Set(products.map((item) => item.brand))).slice(0, 5), [products]);
  const heroProduct = products[0];
  return <><SEO type="home"/><section className="hero"><div className="container hero-inner"><div className="hero-copy reveal"><span className="eyebrow">CABL / اليمن</span><h1>اتصالك. <span>طاقتك.</span><br/>على طريقتك.</h1><p>إكسسوارات تقنية منتقاة بعناية، بأسعار واضحة وتوصيل يعتمد عليه إلى كل مدن اليمن.</p><div className="hero-actions"><Link href="/search" className="button button-primary" data-testid="link-hero-shop">تسوّق الكتالوج <ArrowLeft size={17}/></Link><Link href="/orders" className="button button-quiet" data-testid="link-hero-orders">تتبع طلبك</Link></div></div><div className="hero-art reveal">{heroProduct ? <ProductImage product={heroProduct}/> : <div className="hero-fallback"><Zap size={70}/></div>}<div className="hero-badge"><i/> مختارات تصلح للاستخدام اليومي</div></div></div></section><section className="trust-row"><div className="container trust-grid"><div className="trust-item"><ShieldCheck/><div><strong>اختيارات موثوقة</strong><span>بيانات المنتج كما هي</span></div></div><div className="trust-item"><Truck/><div><strong>توصيل داخل اليمن</strong><span>اختر الطريقة الأنسب لك</span></div></div><div className="trust-item"><Package/><div><strong>تجربة شراء واضحة</strong><span>تأكيد ومتابعة بعد الطلب</span></div></div></div></section><section className="section"><div className="container"><div className="section-heading"><div><span className="eyebrow">من الكتالوج</span><h2>قطع تستحق مكاناً في حقيبتك</h2><p>كل منتج هنا قادم من مخزون CABL المنشور.</p></div><Link href="/search" data-testid="link-featured-all">رؤية الكل <ArrowLeft size={15}/></Link></div>{isLoading ? <LoadingCatalog/> : isError ? <CatalogError retry={() => window.location.reload()}/> : <ProductGrid products={featured}/>}</div></section><section className="editorial-choice"><div className="container"><div className="editorial-heading"><span className="eyebrow">ابدأ من المشكلة</span><h2>قطعة مناسبة تبدأ بسؤال واضح</h2><p>اختر المسار الأقرب لاستخدامك، ثم راجع البيانات قبل الشراء.</p></div><div className="choice-grid"><Link href="/solutions/slow-car-charging"><Zap/><strong>الشحن البطيء في السيارة</strong><span>حل عملي للشاحن والكابل والحرارة</span></Link><Link href="/blog/best-power-bank-yemen"><BookOpenIcon/><strong>أحتاج طاقة احتياطية</strong><span>دليل اختيار باور بانك مناسب</span></Link><Link href="/locations/yemen"><MapPinIcon/><strong>أين يصل طلبي؟</strong><span>راجع خيارات الشحن والتوصيل</span></Link></div></div></section><section className="brand-strip"><div className="container"><div className="section-heading"><div><span className="eyebrow">العلامات المتاحة</span><h2>أسماء نعرفها</h2></div><Link href="/search?view=brands" data-testid="link-brands-all">كل العلامات <ArrowLeft size={15}/></Link></div><div className="brand-list">{brands.map((brand) => <Link href={`/brand/${products.find((product) => product.brand === brand)?.brandSlug || brand.toLowerCase()}`} className="brand-pill" key={brand} data-testid={`link-brand-${brand}`}>{brand}</Link>)}</div></div></section><section className="category-band"><div className="container"><div className="section-heading"><div><span className="eyebrow">اختر ما تحتاجه</span><h2>طريق أقصر للقطعة المناسبة</h2></div></div><div className="category-grid">{categories.map((category, index) => <Link href={`/category/${category.slug}`} className="category-tile" key={category.slug} data-testid={`link-category-${category.slug}`}><span><strong>0{index + 1}</strong></span><h3>{category.name}</h3><p>تصفح المنتجات المتاحة</p>{index === 0 ? <Zap size={36}/> : index === 1 ? <Smartphone size={34}/> : <Headphones size={35}/>}</Link>)}</div></div></section><section className="home-editorial-links"><div className="container"><div><span className="eyebrow">محتوى CABL</span><h2>أسئلة صغيرة قبل قرار أكبر</h2><p>دليل الشراء والسياسات والمواصفات في مكان واحد.</p></div><div className="inline-link-list"><Link href="/about">من نحن <ArrowLeft size={14}/></Link><Link href="/lab">مركز المواصفات <ArrowLeft size={14}/></Link><Link href="/faq">الأسئلة الشائعة <ArrowLeft size={14}/></Link><Link href="/return-policy">الإرجاع والاستبدال <ArrowLeft size={14}/></Link></div></div></section><CTASection/></>;
}

function GuidedHomePage() {
  const { catalog, isLoading, isError } = useStore();
  const products = catalog?.products || [];
  const inStockProducts = useMemo(() => products.filter((product) => product.quantity > 0), [products]);
  const categories = useMemo(
    () => Array.from(new Map(products.filter((product) => product.category).map((product) => [product.category!.slug, product.category!])).values()),
    [products],
  );
  const brands = useMemo(
    () => Array.from(new Map(products.map((product) => [product.brandSlug || product.brand.toLowerCase().replace(/\s+/g, '-'), product])).values()),
    [products],
  );
  const heroProduct = inStockProducts[0] || products[0];
  const categoryFor = (matcher: RegExp) => categories.find((category) => matcher.test(`${category.slug} ${category.name}`)) || categories[0];
  const chargerCategory = categoryFor(/charg|شاحن/i);
  const cableCategory = categoryFor(/cable|كابل/i);
  const powerCategory = categoryFor(/power|باور|طاقة/i);

  return (
    <div className="guided-home">
      <SEO type="home" />
      <section className="guided-hero">
        <div className="container guided-hero-inner">
          <div className="guided-hero-copy reveal">
            <span className="eyebrow">CABL / اليمن</span>
            <h1>ابدأ من جهازك.<br /><em>اختر القطعة المناسبة.</em></h1>
            <p>تصفح الكتالوج حسب ما تحتاجه، ثم راجع المنفذ والقدرة والتوافق في صفحة المنتج قبل الإضافة إلى السلة.</p>
            <div className="guided-hero-actions">
              <Link href="/search" className="button button-primary" data-testid="link-home-catalog">افتح الكتالوج <ArrowLeft size={16} /></Link>
              <Link href="/orders" className="button button-quiet" data-testid="link-home-track-order">تتبع طلبك</Link>
            </div>
            <div className="guided-hero-note"><ShieldCheck size={15} /> السعر والتوافر من الكتالوج الحالي</div>
          </div>
          <div className="guided-hero-product reveal">
            {heroProduct ? (
              <Link href={productPath(heroProduct)} className="guided-hero-product-card" data-testid={`link-home-hero-product-${heroProduct.id}`}>
                <span className="guided-hero-index">01 / الكتالوج</span>
                <ProductImage product={heroProduct} className="guided-hero-product-image" />
                <span className="guided-hero-product-label">
                  <span>{heroProduct.brand}</span>
                  <strong>{heroProduct.productName}</strong>
                </span>
              </Link>
            ) : (
              <div className="guided-hero-product-card" data-testid="state-home-hero-empty">
                <Package size={46} color="#1757ee" />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="guided-path" aria-label="خطوات الاختيار">
        <div className="container guided-path-inner">
          <div className="guided-path-intro">
            <span className="eyebrow">مسار الشراء</span>
            <h2>ثلاث خطوات قبل الإضافة</h2>
          </div>
          {[
            ['01', 'حدد القسم', 'شاحن، كابل، طاقة أو ملحق'],
            ['02', 'راجع البيانات', 'المنفذ والقدرة والتوافق'],
            ['03', 'أكمل الطلب', 'السلة ثم العنوان والدفع'],
          ].map(([number, title, text]) => (
            <div className="guided-step" key={number} data-testid={`step-home-purchase-${number}`}>
              <span className="guided-step-number">{number}</span>
              <div><strong>{title}</strong><span>{text}</span></div>
            </div>
          ))}
        </div>
      </section>

      <section className="guided-section">
        <div className="container">
          <div className="guided-section-header">
            <div>
              <span className="eyebrow">اختر من احتياجك</span>
              <h2>أقسام الكتالوج</h2>
              <p>طريق مختصر إلى المنتجات المنشورة والمتاحة حالياً.</p>
            </div>
            <Link href="/search" data-testid="link-home-categories-all">كل المنتجات <ArrowLeft size={15} /></Link>
          </div>
          {isLoading ? (
            <div className="guided-category-grid" data-testid="loading-home-categories">
              {Array.from({ length: 5 }).map((_, index) => <div className="guided-category-card skeleton" key={index} />)}
            </div>
          ) : categories.length ? (
            <div className="guided-category-grid">
              {categories.slice(0, 5).map((category, index) => (
                <Link href={`/category/${category.slug}`} className="guided-category-card" key={category.slug} data-testid={`link-home-category-${category.slug}`}>
                  <span className="guided-category-icon">
                    {index % 4 === 0 ? <Zap size={18} /> : index % 4 === 1 ? <Smartphone size={18} /> : index % 4 === 2 ? <Package size={18} /> : <Truck size={18} />}
                  </span>
                  <strong>{category.name}</strong>
                  <span>استعرض القسم <ArrowLeft size={13} /></span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state" data-testid="empty-home-categories"><h3>ستظهر الأقسام مع تحميل الكتالوج</h3></div>
          )}
        </div>
      </section>

      <section className="guided-section guided-catalog">
        <div className="container">
          <div className="guided-section-header">
            <div>
              <span className="eyebrow">من الكتالوج الحالي</span>
              <h2>منتجات متاحة الآن</h2>
              <p>افتح صفحة المنتج لمراجعة التفاصيل قبل اختيار الكمية.</p>
            </div>
            <Link href="/search" data-testid="link-home-products-all">استعرض الكتالوج <ArrowLeft size={15} /></Link>
          </div>
          {isLoading ? <LoadingCatalog /> : isError ? <CatalogError retry={() => window.location.reload()} /> : <ProductGrid products={inStockProducts.slice(0, 8)} empty="لا توجد منتجات متاحة حالياً." />}
        </div>
      </section>

      <section className="guided-decision">
        <div className="container guided-decision-grid">
          <div className="guided-decision-copy">
            <span className="eyebrow">لو تعرف ما تحتاجه</span>
            <h2>اذهب مباشرة إلى الاستخدام الأقرب.</h2>
            <p>هذه روابط من أقسام الكتالوج، وليست توصيات منفصلة. افتح القسم ثم قارن مواصفات المنتجات المتاحة.</p>
          </div>
          <div className="guided-checklist">
            {[
              { category: chargerCategory, title: 'أحتاج شاحناً', text: 'قدرة ومنافذ تناسب جهازك' },
              { category: cableCategory, title: 'أحتاج كابلاً', text: 'طرفان وطول وتصنيف واضح' },
              { category: powerCategory, title: 'أحتاج طاقة متنقلة', text: 'سعة وقدرة ومنافذ للمقارنة' },
              { category: categories.find((category) => /travel|car|سفر|سيارة/i.test(`${category.slug} ${category.name}`)), title: 'أحتاج ملحق سفر أو سيارة', text: 'اختر من القسم المتاح' },
              ].map(({ category, title, text }, index) => category ? (
              <Link href={`/category/${category.slug}`} className="guided-check" key={`${category.slug}-${index}`} data-testid={`link-home-intent-${index}`}>
                <Check size={17} />
                <span><strong>{title}</strong><br />{text}</span>
                <ArrowLeft size={14} />
              </Link>
            ) : null)}
          </div>
        </div>
      </section>

      <section className="guided-brand-strip">
        <div className="container">
          <div className="guided-section-header">
            <div>
              <span className="eyebrow">العلامات الموجودة في الكتالوج</span>
              <h2>تصفح حسب العلامة</h2>
            </div>
            <Link href="/search?view=brands" data-testid="link-home-brands-all">كل العلامات <ArrowLeft size={15} /></Link>
          </div>
          <div className="guided-brand-list">
            {brands.map((product) => (
              <Link href={brandPath(product.brandSlug || product.brand.toLowerCase().replace(/\s+/g, '-'))} className="guided-brand-link" key={product.brandSlug || product.brand} data-testid={`link-home-brand-${product.brandSlug || product.brand}`}>
                {product.brand}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <EditorialSection eyebrow="قبل تأكيد الطلب" title="معلومات تساعدك على الاختيار">
        <InfoCards items={[
          { icon: <ShieldCheck />, title: 'راجع صفحة المنتج', text: 'طابق الموديل والـSKU والمنافذ والقدرة مع جهازك قبل الإضافة إلى السلة.' },
          { icon: <Zap />, title: 'التوافر قابل للتغير', text: 'الكمية المعروضة من الكتالوج الحالي، ويعاد التحقق منها عند الإضافة والطلب.' },
          { icon: <Truck />, title: 'الشحن يظهر في checkout', text: 'أدخل العنوان واختر طريقة الشحن والدفع قبل إرسال الطلب.' },
          { icon: <RefreshCcw />, title: 'اقرأ سياسة الإرجاع', text: 'راجع الشروط والخطوات في سياسة الإرجاع والاستبدال قبل التأكيد.', href: '/return-policy' },
        ]} />
      </EditorialSection>

      <EditorialSection eyebrow="محتوى CABL" title="اقرأ قبل أن تختار">
        <InfoCards items={[
          { icon: <BookOpenIcon />, title: 'دليل الباور بانك', text: 'قارن السعة والقدرة والمنافذ حسب الاستخدام.', href: '/blog/best-power-bank-yemen' },
          { icon: <FlaskConical />, title: 'مركز المواصفات', text: 'افصل بين البيانات المعلنة والحسابات التوضيحية.', href: '/lab' },
          { icon: <MessageCircleIcon />, title: 'أسئلة الشراء', text: 'راجع الإجابات المختصرة قبل فتح السلة.', href: '/faq' },
        ]} />
      </EditorialSection>

      <EditorialSection title="أسئلة سريعة">
        <FAQList items={[
          { question: 'من أين أبدأ إذا لم أعرف اسم المنتج؟', answer: 'ابدأ من القسم الأقرب لاستخدامك، ثم قارن المواصفات والتوافق في صفحات المنتجات.' },
          { question: 'هل كل ما يظهر في الصفحة متوفر؟', answer: 'التوافر مرتبط بالكمية المنشورة وقت التصفح، ويعاد التحقق عند الإضافة والطلب.' },
          { question: 'هل السعر يشمل الشحن؟', answer: 'السعر المعروض للمنتج، وتظهر رسوم الشحن بعد اختيار العنوان والطريقة في checkout.' },
        ]} />
      </EditorialSection>
    </div>
  );
}

export function HomePage() {
  return <GuidedHomePage />;
}

function BrandStorefrontPage({ slug }: { slug: string }) {
  const { catalog, isLoading, isError } = useStore();
  const [sort, setSort] = useState('featured');
  const products = catalog?.products || [];
  const brandProducts = useMemo(
    () => products.filter((product) => product.brandSlug === slug || product.brand.toLowerCase().replace(/\s+/g, '-') === slug),
    [products, slug],
  );
  const brandName = brandProducts[0]?.brand || slug.replaceAll('-', ' ');
  const categories = useMemo(
    () => Array.from(new Map(
      brandProducts
        .filter((product) => product.category)
        .map((product) => [product.category!.slug, product.category!]),
    ).values()),
    [brandProducts],
  );
  const sorted = useMemo(() => [...brandProducts].sort((a, b) => {
    if (sort === 'price-low') return (a.discountPrice ?? a.regularPrice) - (b.discountPrice ?? b.regularPrice);
    if (sort === 'price-high') return (b.discountPrice ?? b.regularPrice) - (a.discountPrice ?? a.regularPrice);
    return Number(b.quantity > 0) - Number(a.quantity > 0);
  }), [brandProducts, sort]);

  return (
    <>
      <SEO type="brand" slug={slug} />
      <section className="brand-storefront-hero">
        <div className="container">
          <Breadcrumbs items={[{ label: 'العلامات التجارية', href: '/search?view=brands' }, { label: brandName }]} />
          <div className="brand-storefront-copy">
            <span className="eyebrow">استكشف العلامة</span>
            <h1>{brandName}</h1>
            <p>منتجات {brandName} المنشورة حالياً في كتالوج CABL. ابدأ من القسم الأقرب لاستخدامك، ثم راجع الموديل والمواصفات والتوافر قبل الطلب.</p>
            <div className="brand-storefront-actions">
              {categories.slice(0, 3).map((category) => (
                <Link className="button button-secondary" href={brandCategoryPath(slug, category.slug)} key={category.slug}>
                  {category.name}
                </Link>
              ))}
              <Link className="button button-primary" href="/search">كل المنتجات <ArrowLeft size={16} /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="brand-storefront-section">
        <div className="container">
          <div className="brand-storefront-heading">
            <div>
              <span className="eyebrow">تصفح داخل العلامة</span>
              <h2>اختر القسم قبل الموديل</h2>
              <p>روابط إلى الأقسام التي تحتوي على منتجات منشورة من {brandName} فقط.</p>
            </div>
            <span className="brand-product-count">{brandProducts.length} منتج</span>
          </div>
          {categories.length ? (
            <div className="brand-storefront-category-grid">
              {categories.map((category) => {
                const count = brandProducts.filter((product) => product.category?.slug === category.slug).length;
                return (
                  <Link className="brand-storefront-category" href={brandCategoryPath(slug, category.slug)} key={category.slug}>
                    <strong>{category.name}</strong>
                    <span>{count} {count === 1 ? 'منتج' : 'منتجات'} منشورة</span>
                    <ArrowLeft size={16} />
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="empty-state">لا توجد أقسام منشورة لهذه العلامة حالياً.</p>
          )}
        </div>
      </section>

      <EditorialSection eyebrow="من الكتالوج الحالي" title={`منتجات ${brandName}`}>
        {isLoading ? <LoadingCatalog /> : isError ? <CatalogError retry={() => window.location.reload()} /> : (
          <>
            <CatalogToolbar products={sorted} sort={sort} setSort={setSort} />
            <ProductGrid products={sorted} empty={`لا توجد منتجات منشورة من ${brandName} حالياً.`} />
          </>
        )}
      </EditorialSection>

      <EditorialSection eyebrow="طريقة الاختيار" title={`كيف تختار من ${brandName}؟`}>
        <div className="editorial-copy">
          <p>لا تفترض أن كل منتجات العلامة تملك نفس القدرة أو التوافق. ابدأ من الجهاز والاستخدام، ثم قارن الموديل والمنافذ والقدرة والسعر والتوافر في صفحات المنتجات.</p>
        </div>
        <div className="numbered-steps">
          <div><b>01</b><h3>حدد القسم</h3><p>افتح القسم الأقرب لما تريد شراءه بدل مقارنة منتجات مختلفة الوظيفة.</p></div>
          <div><b>02</b><h3>راجع الموديل</h3><p>طابق الاسم ورقم SKU والصورة مع القطعة التي تحتاجها.</p></div>
          <div><b>03</b><h3>افحص التوافق</h3><p>راجع المنفذ والقدرة والكابل والجهاز قبل الإضافة إلى السلة.</p></div>
          <div><b>04</b><h3>أكد الشحن</h3><p>اختر العنوان وطريقة الشحن والدفع في checkout قبل إرسال الطلب.</p></div>
        </div>
      </EditorialSection>

      <EditorialSection title={`قبل طلب منتج من ${brandName}`}>
        <InfoCards items={[
          { icon: <ShieldCheck />, title: 'البيانات أولاً', text: 'العلامة والموديل والسعر والتوافر مأخوذة من الكتالوج الحالي.' },
          { icon: <Zap />, title: 'التوافق مسؤوليتك', text: 'طابق المنافذ والقدرة والبروتوكول مع جهازك، ولا تعتمد على الاسم وحده.' },
          { icon: <Truck />, title: 'الشحن في checkout', text: 'تظهر خيارات الشحن والرسوم والمدة التقديرية بعد إدخال العنوان.' },
          { icon: <RefreshCcw />, title: 'الإرجاع قبل التأكيد', text: 'راجع سياسة الإرجاع والاستبدال واحتفظ برقم الطلب بعد الشراء.', href: '/return-policy' },
        ]} />
      </EditorialSection>

      <EditorialSection title={`أسئلة عن ${brandName}`}>
        <FAQList items={[
          { question: `هل كل منتجات ${brandName} متاحة الآن؟`, answer: 'التوافر مرتبط بالكمية المنشورة لكل موديل، ويعاد التحقق عند الإضافة والطلب.' },
          { question: `كيف أقارن بين موديلات ${brandName}؟`, answer: 'افتح المنتجات من القسم نفسه وقارن الموديل والمواصفات والسعر والتوافر، لا الاسم التجاري فقط.' },
          { question: 'أين أجد خيارات الشحن والإرجاع؟', answer: 'تظهر خيارات الشحن والدفع في checkout، وتفاصيل الإرجاع في سياسة الإرجاع والاستبدال.' },
        ]} />
      </EditorialSection>

      <EditorialSection title="روابط مفيدة">
        <div className="category-related-links">
          <Link href="/shipping"><Truck /><strong>الشحن والتوصيل</strong><span>راجع الرسوم والمدة حسب العنوان.</span><ArrowLeft size={15} /></Link>
          <Link href="/return-policy"><RefreshCcw /><strong>الإرجاع والاستبدال</strong><span>اعرف الشروط والخطوات قبل الطلب.</span><ArrowLeft size={15} /></Link>
          <Link href="/faq"><MessageCircleIcon /><strong>الأسئلة الشائعة</strong><span>إجابات عن الطلب والدفع والتوافق.</span><ArrowLeft size={15} /></Link>
          <Link href="/search"><Package /><strong>كل المنتجات</strong><span>عد إلى الكتالوج الكامل.</span><ArrowLeft size={15} /></Link>
        </div>
      </EditorialSection>
      <CTASection />
    </>
  );
}

function BrandCategoryLinks({ brandSlug, categories }: { brandSlug: string; categories: Array<{ slug: string; name: string }> }) {
  if (!categories.length) return null;
  return (
    <section className="brand-category-nav">
      <div className="container">
        <div className="editorial-heading">
          <span className="eyebrow">تصفح داخل العلامة</span>
          <h2>اختر قسم {brandSlug}</h2>
          <p>صفحة مستقلة لكل علامة وقسم، مع منتجات ومقارنة ونصائح مرتبطة بالاختيار.</p>
        </div>
        <div className="brand-category-nav-grid">
          {categories.map((category) => (
            <Link href={brandCategoryPath(brandSlug, category.slug)} className="brand-category-nav-card" key={category.slug}>
              <strong>{category.name}</strong>
              <span>منتجات {category.name} من هذه العلامة</span>
              <ArrowLeft size={16} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const categorySlugAliases: Record<string, string[]> = {
  cables: ['cables', 'charging-cables'],
  'charging-cables': ['cables', 'charging-cables'],
  'car-accessories': ['car-accessories', 'travel-adapters', 'car-chargers'],
  'travel-adapters': ['car-accessories', 'travel-adapters', 'car-chargers'],
  'phone-accessories': ['phone-accessories', 'hubs-adapters'],
  'hubs-adapters': ['phone-accessories', 'hubs-adapters'],
};

function matchesCategory(product: StoreProduct, categorySlug: string) {
  return categorySlugAliases[categorySlug]?.includes(product.category?.slug || '')
    || product.category?.slug === categorySlug;
}

function guideKeyForCategory(categorySlug: string) {
  if (categorySlug === 'charging-cables') return 'cables';
  if (categorySlug === 'travel-adapters') return 'car-accessories';
  return categorySlug;
}

function BrandCategoryPageView({ brandSlug, categorySlug }: { brandSlug: string; categorySlug: string }) {
  const { catalog, isLoading, isError } = useStore();
  const [sort, setSort] = useState('featured');
  const products = catalog?.products || [];
  const brandProducts = products.filter((product) => product.brandSlug === brandSlug || product.brand.toLowerCase().replace(/\s+/g, '-') === brandSlug);
  const filtered = useMemo(() => brandProducts.filter((product) => matchesCategory(product, categorySlug)), [brandProducts, categorySlug]);
  const sorted = useMemo(() => [...filtered].sort((a, b) => sort === 'price-low'
    ? (a.discountPrice ?? a.regularPrice) - (b.discountPrice ?? b.regularPrice)
    : sort === 'price-high'
      ? (b.discountPrice ?? b.regularPrice) - (a.discountPrice ?? a.regularPrice)
      : 0), [filtered, sort]);
  const brandName = brandProducts[0]?.brand || brandSlug.replaceAll('-', ' ');
  const categoryName = filtered[0]?.category?.name || brandProducts.find((product) => matchesCategory(product, categorySlug))?.category?.name || categorySlug.replaceAll('-', ' ');
  const guideKey = guideKeyForCategory(categorySlug);
  const copy = categoryGuideCopy[guideKey] || {
    eyebrow: 'اختيار داخل العلامة',
    title: `${categoryName} من ${brandName}`,
    description: `تصفح منتجات ${categoryName} من ${brandName} المتاحة حالياً في كتالوج CABL، مع مقارنة البيانات والسعر والتوافر.`,
    selection: `ابدأ من استخدامك، ثم طابق مواصفات ${categoryName} مع جهازك قبل اختيار موديل من ${brandName}.`,
    tips: ['راجع رقم الموديل والبيانات المنشورة قبل الدفع.', 'طابق المنافذ والقدرة والتوافق مع جهازك.', 'قارن السعر والتوافر الحاليين بين المنتجات.', 'راجع الشحن والدفع في checkout قبل تأكيد الطلب.', 'احتفظ برقم الطلب وشروط الإرجاع بعد الشراء.'],
    faqs: [
      { question: `كيف أختار ${categoryName} من ${brandName}؟`, answer: 'ابدأ من الاستخدام، ثم قارن المواصفات والتوافق والسعر والتوافر في صفحات المنتجات.' },
      { question: 'هل كل المنتجات متوفرة؟', answer: 'التوافر مرتبط بالكمية المنشورة وقت التصفح ويعاد التحقق عند الإضافة والطلب.' },
      { question: 'أين أجد الشحن والإرجاع؟', answer: 'راجع الخيارات النشطة في checkout وسياسة الإرجاع قبل تأكيد الطلب.' },
    ],
  };
  const categoryPathSlug = filtered[0]?.category?.slug
    || brandProducts.find((product) => matchesCategory(product, categorySlug))?.category?.slug
    || categorySlug;
  const description = `${categoryName} من ${brandName} في اليمن. قارن المواصفات والسعر والتوافر قبل الطلب من CABL.`;

  return (
    <>
      <StaticSEO title={`${categoryName} ${brandName}`} description={description} canonicalPath={brandCategoryPath(brandSlug, categorySlug)} />
      <div className="category-landing-hero brand-category-hero">
        <div className="container">
          <Breadcrumbs items={[
            { label: 'العلامات', href: `/brand/${brandSlug}` },
            { label: brandName, href: `/brand/${brandSlug}` },
            { label: categoryName },
          ]} />
          <div className="category-landing-copy">
            <span className="eyebrow">{copy.eyebrow}</span>
            <h1>{categoryName} {brandName}</h1>
            <p>{copy.description}</p>
            <div className="category-landing-actions">
              <Link className="button button-secondary" href={brandPath(brandSlug)}>كل منتجات {brandName}</Link>
              <Link className="button button-secondary" href={`/category/${categoryPathSlug}`}>كل {categoryName}</Link>
              <Link className="button button-primary" href="/search">كل المنتجات <ArrowLeft size={16} /></Link>
            </div>
          </div>
        </div>
      </div>
      <EditorialSection eyebrow="من الكتالوج الحالي" title={`${categoryName} من ${brandName}`}>
        {isLoading ? <LoadingCatalog /> : isError ? <CatalogError retry={() => window.location.reload()} /> : <><CatalogToolbar products={sorted} sort={sort} setSort={setSort} /><ProductGrid products={sorted} empty={`لا توجد منتجات منشورة من ${brandName} في قسم ${categoryName} حالياً.`} /></>}
      </EditorialSection>
      <EditorialSection eyebrow="بيانات قابلة للمراجعة" title={`كيف تختار ${categoryName} من ${brandName}؟`}>
        <div className="editorial-copy"><p>{copy.selection}</p></div>
        <div className="numbered-steps category-tip-grid">{copy.tips.map((tip, index) => <div key={tip}><b>{String(index + 1).padStart(2, '0')}</b><p>{tip}</p></div>)}</div>
      </EditorialSection>
      <EditorialSection title="قبل تأكيد الطلب">
        <InfoCards items={[
          { icon: <ShieldCheck />, title: 'بيانات الموديل', text: 'راجع اسم الموديل ورقم SKU والمنافذ والقدرة في صفحة المنتج.' },
          { icon: <Zap />, title: 'التوافق', text: 'طابق المنتج مع الجهاز والكابل والاستخدام، ولا تعتمد على الاسم أو الصورة فقط.' },
          { icon: <Truck />, title: 'الشحن', text: 'اختر المدينة والعنوان في checkout لرؤية خيارات الشحن النشطة.' },
          { icon: <RefreshCcw />, title: 'الإرجاع', text: 'راجع شروط الإرجاع والاستبدال واحتفظ برقم الطلب وإثبات الشراء.' },
        ]} />
      </EditorialSection>
      <EditorialSection title={`أسئلة شائعة عن ${categoryName} ${brandName}`}>
        <FAQList items={copy.faqs} />
      </EditorialSection>
      <EditorialSection title="روابط مرتبطة">
        <div className="category-related-links">
          <Link href={brandPath(brandSlug)}><ArrowRight /><strong>كل منتجات {brandName}</strong><span>تصفح جميع الأقسام المتاحة من هذه العلامة.</span><ArrowLeft size={15} /></Link>
          <Link href={`/category/${categoryPathSlug}`}><Zap /><strong>كل {categoryName}</strong><span>قارن منتجات القسم من العلامات المتاحة.</span><ArrowLeft size={15} /></Link>
          <Link href="/shipping"><Truck /><strong>الشحن والتوصيل</strong><span>راجع الرسوم والمدة حسب العنوان.</span><ArrowLeft size={15} /></Link>
          <Link href="/return-policy"><RefreshCcw /><strong>الإرجاع والاستبدال</strong><span>اعرف الشروط والخطوات قبل الطلب.</span><ArrowLeft size={15} /></Link>
        </div>
      </EditorialSection>
      <CTASection />
    </>
  );
}

const categoryGuideCopy: Record<string, {
  eyebrow: string;
  title: string;
  description: string;
  selection: string;
  tips: string[];
  faqs: Array<{ question: string; answer: string }>;
}> = {
  'power-banks': {
    eyebrow: 'اختيار الطاقة الاحتياطية',
    title: 'باور بانك يناسب يومك',
    description: 'قارن السعة والطاقة والقدرة والمنافذ والوزن والسعر الحالي قبل اختيار باور بانك داخل اليمن.',
    selection: 'ابدأ من الجهاز ومدة الاستخدام، ثم راجع Wh والخرج والتوافق. mAh وحدها لا تحدد عدد الشحنات ولا إمكانية شحن اللابتوب.',
    tips: ['للاستخدام اليومي: راجع فئة 10,000mAh والحجم والوزن وعدد المنافذ.', 'للسفر وانقطاع الكهرباء: قارن 20,000mAh بعد مراجعة Wh والوزن وقواعد السفر.', 'للابتوب: طابق خرج USB-C PD الفعلي مع متطلبات جهازك والكابل.', 'لا تترك البطارية في الشمس أو السيارة الحارة، ولا تعتبر عدد الشحنات وعداً ثابتاً.', 'راجع رقم الموديل والبيانات المطبوعة قبل الدفع.'],
    faqs: [
      { question: 'هل أختار 10,000 أم 20,000mAh؟', answer: 'اختر حسب مدة الاستخدام والوزن وقدرة الخرج. السعة الأعلى ليست أفضل إن كانت ستبقى في المنزل بسبب حجمها.' },
      { question: 'هل كل باور بانك يشحن اللابتوب؟', answer: 'لا. يجب أن يذكر USB-C PD بقدرة مناسبة، مع كابل يدعم القدرة المطلوبة.' },
      { question: 'هل mAh وحدها تكفي للمقارنة؟', answer: 'لا. راجع Wh والقدرة والمنافذ والوزن والتوافق مع جهازك.' },
    ],
  },
  chargers: {
    eyebrow: 'اختيار الشاحن',
    title: 'شاحن مناسب لجهازك',
    description: 'قارن قدرة الشاحن والمنافذ والبروتوكولات والحجم قبل شراء شاحن حائط أو شاحن سريع.',
    selection: 'الشاحن المناسب ليس صاحب الرقم الأكبر. طابق القدرة والبروتوكول مع الجهاز، ثم تأكد من أن الكابل يدعم نفس المسار.',
    tips: ['حدد USB-C أو USB-A وعدد المنافذ التي تحتاجها.', 'راجع USB-C PD أو PPS أو QC كما هو مذكور في صفحة الموديل.', 'القدرة الإجمالية قد تختلف عن قدرة منفذ واحد عند شحن أكثر من جهاز.', 'استخدم كابلاً مصنفاً للقدرة المطلوبة ولا تعتمد على شكل المنفذ وحده.', 'اترك مساحة للحرارة والتهوية ولا تغطِّ الشاحن أثناء الاستخدام.'],
    faqs: [
      { question: 'هل الشاحن الأعلى واطاً يشحن كل الأجهزة بسرعة أكبر؟', answer: 'لا. الجهاز والكابل والبروتوكول والحرارة تحدد القدرة الفعلية.' },
      { question: 'هل USB-C يعني PD؟', answer: 'لا. USB-C شكل منفذ، أما PD فهو بروتوكول شحن يجب أن يذكره المنتج.' },
      { question: 'هل يمكن شحن جهازين معاً؟', answer: 'نعم إذا كان الموديل يدعم ذلك، لكن راجع توزيع القدرة عند استخدام أكثر من منفذ.' },
    ],
  },
  cables: {
    eyebrow: 'اختيار الكابل',
    title: 'كابل شحن لا يحد جهازك',
    description: 'قارن نوع المنفذ والطول وتصنيف القدرة ونقل البيانات قبل إضافة كابل إلى السلة.',
    selection: 'الكابل جزء من سرعة الشحن والتوافق. طابق طرفيه مع الشاحن والجهاز، ثم راجع القدرة أو سرعة البيانات المعلنة للموديل.',
    tips: ['حدد USB-C إلى USB-C أو USB-A إلى USB-C أو Lightning حسب أجهزتك.', 'راجع القدرة بالواط إذا كنت تستخدم شحناً سريعاً أو لابتوباً.', 'لا تعتبر كل كابلات USB-C متساوية في نقل البيانات أو الفيديو.', 'اختر طولاً يناسب مكان الاستخدام دون شد أو ثني حاد.', 'استبدل الكابل عند تلف الغلاف أو ارتفاع الحرارة أو انقطاع الاتصال.'],
    faqs: [
      { question: 'هل كل كابل USB-C يدعم الشحن السريع؟', answer: 'لا. القدرة والتصنيف يختلفان بين الكابلات، ويجب مراجعة بيانات الموديل.' },
      { question: 'هل طول الكابل يؤثر؟', answer: 'قد يؤثر على الراحة والفقد في بعض الاستخدامات؛ الأهم أن يكون الكابل مصنفاً للقدرة المطلوبة.' },
      { question: 'هل الكابل يحدد سرعة البيانات؟', answer: 'نعم. بعض كابلات الشحن لا تدعم نفس سرعات البيانات أو الفيديو.' },
    ],
  },
  'car-accessories': {
    eyebrow: 'الشحن في السيارة',
    title: 'حل شحن عملي أثناء التنقل',
    description: 'قارن شواحن السيارة والكابلات والحوامل حسب منفذ السيارة وقدرة الهاتف والحرارة أثناء القيادة.',
    selection: 'ابدأ من منفذ السيارة والهاتف والكابل، ثم راجع القدرة والحرارة. الشحن أثناء الملاحة يحتاج حلاً متوازناً لا رقماً تسويقياً فقط.',
    tips: ['طابق USB-C PD أو البروتوكول المطلوب مع هاتفك.', 'استخدم كابلاً مصنفاً للقدرة المطلوبة.', 'ثبت الهاتف والحوامل بعيداً عن الحرارة المباشرة قدر الإمكان.', 'خفض السطوع والحرارة قد يساعدان الهاتف على الحفاظ على سرعة الشحن.', 'أوقف الاستخدام إذا ظهرت حرارة غير طبيعية أو انقطاع متكرر.'],
    faqs: [
      { question: 'لماذا يصبح الشحن بطيئاً في السيارة؟', answer: 'قد يكون السبب القدرة أو الكابل أو تفاوض البروتوكول أو الحرارة أثناء الملاحة.' },
      { question: 'هل USB-A يكفي؟', answer: 'قد يشحن الهاتف، لكنه لا يضمن تفاوض USB-C PD أو السرعة التي يدعمها جهازك.' },
      { question: 'هل الحامل اللاسلكي أفضل؟', answer: 'يعتمد على الهاتف والحرارة وطريقة الاستخدام. راجع التوافق ولا تستخدمه عند ارتفاع الحرارة.' },
    ],
  },
  audio: {
    eyebrow: 'اختيار الصوتيات',
    title: 'صوتيات للاستخدام اليومي',
    description: 'قارن السماعات وسماعات الأذن والسبيكرات حسب الاستخدام والاتصال والحجم والبطارية والراحة.',
    selection: 'حدد المكان أولاً: مكالمات، عمل، سفر، غرفة أو تجمع. بعد ذلك راجع نوع الاتصال والبطارية والحجم والملحقات المتاحة.',
    tips: ['للمكالمات: راجع الميكروفونات وطريقة تثبيت السماعة.', 'للسفر: قارن الوزن والبطارية والحجم والعزل إن كان مذكوراً.', 'للسبيكر: راجع الحجم والقدرة وطريقة الاقتران، ولا تفترض مستوى صوت من رقم واحد.', 'تحقق من توافق الهاتف والأنظمة قبل الطلب.', 'راجع ما إذا كانت الملحقات والشاحن ضمن العبوة أو تباع منفصلة.'],
    faqs: [
      { question: 'هل السماعة الأكبر صوتها أفضل؟', answer: 'ليس بالضرورة. الاستخدام والحجم والاتصال والراحة عوامل مهمة أيضاً.' },
      { question: 'هل كل سماعات البلوتوث تعمل مع كل هاتف؟', answer: 'غالباً تتصل عبر Bluetooth، لكن راجع الإصدار والخصائص والتوافق للموديل المحدد.' },
      { question: 'كيف أختار بين سماعة أذن وسبيكر؟', answer: 'اختر حسب الخصوصية والمكان وعدد المستمعين وطريقة الاستخدام اليومية.' },
    ],
  },
};

function CategoryLandingPage({ slug }: { slug: string }) {
  const { catalog, isLoading, isError } = useStore();
  const [sort, setSort] = useState('featured');
  const products = catalog?.products || [];
  const filtered = useMemo(() => products.filter((product) => matchesCategory(product, slug)), [products, slug]);
  const sorted = useMemo(() => [...filtered].sort((a, b) => sort === 'price-low'
    ? (a.discountPrice ?? a.regularPrice) - (b.discountPrice ?? b.regularPrice)
    : sort === 'price-high'
      ? (b.discountPrice ?? b.regularPrice) - (a.discountPrice ?? a.regularPrice)
      : 0), [filtered, sort]);
  const name = filtered[0]?.category?.name || slug.replaceAll('-', ' ');
  const copy = categoryGuideCopy[slug] || {
    eyebrow: 'دليل القسم',
    title: `منتجات ${name} في اليمن`,
    description: `قارن منتجات ${name} المتاحة حالياً في كتالوج CABL، ثم راجع التوافق والسعر والشحن قبل الطلب.`,
    selection: `ابدأ من استخدامك، ثم قارن الموديل والمواصفات والسعر والتوافر بين منتجات ${name}.`,
    tips: ['حدد الاستخدام الأساسي قبل اختيار المنتج.', 'راجع المنافذ والقدرة والتوافق في صفحة الموديل.', 'قارن السعر والتوافر الحاليين، لا الاسم وحده.', 'راجع خيارات الشحن والدفع قبل تأكيد الطلب.', 'احتفظ برقم الطلب وشروط الإرجاع بعد الشراء.'],
    faqs: [
      { question: 'كيف أختار منتجاً من هذا القسم؟', answer: 'ابدأ من الاستخدام، ثم راجع المواصفات والتوافق والسعر والتوافر في صفحة المنتج.' },
      { question: 'هل كل المنتجات متوفرة؟', answer: 'التوافر مرتبط بالكمية المنشورة وقت التصفح ويعاد التحقق عند الإضافة والطلب.' },
      { question: 'أين أجد الشحن والإرجاع؟', answer: 'راجع الخيارات النشطة في checkout وسياسة الإرجاع قبل تأكيد الطلب.' },
    ],
  };
  const brands = Array.from(new Map(filtered.map((product) => [product.brandSlug || product.brand.toLowerCase().replace(/\s+/g, '-'), product.brand])).entries()).slice(0, 6);
  return (
    <>
      <SEO type="category" slug={slug} />
      <div className="category-landing-hero">
        <div className="container">
          <Breadcrumbs items={[{ label: 'الأقسام', href: '/search' }, { label: name }]} />
          <div className="category-landing-copy">
            <span className="eyebrow">{copy.eyebrow}</span>
            <h1>{copy.title}</h1>
            <p>{copy.description}</p>
            <div className="category-landing-actions">
              {brands.map(([brandSlug, brandName]) => <Link className="button button-secondary" href={brandCategoryPath(brandSlug, slug)} key={brandSlug}>تسوق {brandName}</Link>)}
              <Link className="button button-primary" href="/search">كل المنتجات <ArrowLeft size={16} /></Link>
            </div>
          </div>
        </div>
      </div>
      <EditorialSection eyebrow="من الكتالوج الحالي" title={`${name} المتاحة الآن`}>
        {isLoading ? <LoadingCatalog /> : isError ? <CatalogError retry={() => window.location.reload()} /> : <><CatalogToolbar products={sorted} sort={sort} setSort={setSort} /><ProductGrid products={sorted} empty={`لا توجد منتجات منشورة في قسم ${name} حالياً.`} /></>}
      </EditorialSection>
      <EditorialSection eyebrow="كيف تختار؟" title={`دليل اختيار ${name}`}>
        <div className="editorial-copy"><p>{copy.selection}</p></div>
        <div className="numbered-steps category-tip-grid">{copy.tips.map((tip, index) => <div key={tip}><b>{String(index + 1).padStart(2, '0')}</b><p>{tip}</p></div>)}</div>
      </EditorialSection>
      <EditorialSection title="ماذا تراجع قبل الشراء؟">
        <InfoCards items={[
          { icon: <ShieldCheck />, title: 'الموديل والبيانات', text: 'راجع اسم الموديل ورقم SKU والمنافذ والقدرة في صفحة المنتج.' },
          { icon: <Zap />, title: 'التوافق', text: 'طابق المنتج مع الجهاز والكابل والاستخدام، ولا تعتمد على الاسم أو الصورة فقط.' },
          { icon: <Truck />, title: 'الشحن', text: 'اختر المدينة والعنوان في checkout لرؤية خيارات الشحن النشطة.' },
          { icon: <RefreshCcw />, title: 'الإرجاع', text: 'راجع شروط الإرجاع والاستبدال واحتفظ برقم الطلب وإثبات الشراء.' },
        ]} />
      </EditorialSection>
      <EditorialSection title="أسئلة شائعة">
        <FAQList items={copy.faqs} />
      </EditorialSection>
      <EditorialSection title="روابط مرتبطة">
        <div className="category-related-links">
          <Link href="/blog/best-power-bank-yemen"><BookOpenIcon /><strong>دليل الشراء</strong><span>مقارنات عملية قبل اختيار الطاقة والشحن.</span><ArrowLeft size={15} /></Link>
          <Link href="/shipping"><Truck /><strong>الشحن والتوصيل</strong><span>راجع الرسوم والمدة حسب العنوان.</span><ArrowLeft size={15} /></Link>
          <Link href="/return-policy"><RefreshCcw /><strong>الإرجاع والاستبدال</strong><span>اعرف الشروط والخطوات قبل الطلب.</span><ArrowLeft size={15} /></Link>
          <Link href="/lab"><FlaskConical /><strong>مركز المواصفات</strong><span>افصل بين المواصفة والحساب والقياس.</span><ArrowLeft size={15} /></Link>
        </div>
      </EditorialSection>
      <CTASection />
    </>
  );
}

export function CategoryPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  return <CategoryLandingPage slug={slug} />;
}
export function BrandPage() { const { slug = '' } = useParams<{ slug: string }>(); return <BrandStorefrontPage slug={slug}/>; }
export function BrandCategoryPage() {
  const { brandSlug = '', categorySlug = '' } = useParams<{ brandSlug: string; categorySlug: string }>();
  return <BrandCategoryPageView brandSlug={brandSlug} categorySlug={categorySlug} />;
}

export function SearchPage() {
  const { catalog, isLoading, isError, favorites } = useStore();
  const [location, setLocation] = useLocation();
  const query = new URLSearchParams(window.location.search);
  const view = query.get('view') || 'products';
  const [term, setTerm] = useState(query.get('q') || '');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('featured');
  const products = catalog?.products || [];
  const brands = Array.from(new Set(products.map((product) => product.brand)));
  const categories = Array.from(new Map(products.filter((item) => item.category).map((item) => [item.category!.slug, item.category!])).values());
  const result = useMemo(() => [...products.filter((product) => (!term || `${product.productName} ${product.brand} ${product.shortDescription || ''}`.toLowerCase().includes(term.toLowerCase())) && (!brand || product.brand === brand) && (!category || product.category?.slug === category))].sort((a, b) => sort === 'price-low' ? (a.discountPrice ?? a.regularPrice) - (b.discountPrice ?? b.regularPrice) : sort === 'price-high' ? (b.discountPrice ?? b.regularPrice) - (a.discountPrice ?? a.regularPrice) : 0), [products, term, brand, category, sort]);
  const favoriteProducts = useMemo(() => products.filter((product) => favorites.includes(product.id)), [products, favorites]);
  const brandDirectory = useMemo(() => Array.from(new Map(products.map((product) => [product.brandSlug || product.brand.toLowerCase().replace(/\s+/g, '-'), product.brand])).entries()).sort((a, b) => a[1].localeCompare(b[1], 'ar')), [products]);
  const submit = (event: FormEvent) => { event.preventDefault(); setLocation(`/search${term ? `?q=${encodeURIComponent(term)}` : ''}`); };
   if (view === 'brands') return <><NoIndex/><div className="container"><Breadcrumbs items={[{ label: 'العلامات التجارية' }]}/><PageHeading eyebrow="دليل العلامات" title="اختر علامتك المفضلة" description="تصفح المنتجات المنشورة حسب العلامة التجارية."/>{isLoading ? <LoadingCatalog/> : isError ? <CatalogError retry={() => window.location.reload()}/> : <div className="brand-directory">{brandDirectory.map(([slug, name]) => <Link href={`/brand/${slug}`} className="brand-directory-card" key={slug} data-testid={`link-brand-directory-${slug}`}><span className="brand-directory-mark">{name.slice(0, 1)}</span><span><strong>{name}</strong><small>{products.filter((product) => (product.brandSlug || product.brand.toLowerCase().replace(/\s+/g, '-')) === slug).length} منتجات</small></span><ArrowLeft size={17}/></Link>)}</div>}</div></>;
   if (view === 'favorites') return <><NoIndex/><div className="container"><Breadcrumbs items={[{ label: 'المفضلة' }]}/><PageHeading eyebrow="اختياراتك" title="منتجاتك المفضلة" description="المنتجات التي حفظتها على هذا الجهاز تظهر هنا."/>{isLoading ? <LoadingCatalog/> : isError ? <CatalogError retry={() => window.location.reload()}/> : <ProductGrid products={favoriteProducts} empty="لم تحفظ أي منتج بعد."/>}</div></>;
   return <><NoIndex/><div className="container"><Breadcrumbs items={[{ label: 'البحث' }]}/><div className="search-hero"><div><span className="eyebrow">اكتشف بهدوء</span><h1>ابحث عن قطعتك القادمة</h1><p>النتائج تتحدث من كتالوج CABL مباشرة.</p></div><form className="big-search" onSubmit={submit}><input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="مثلاً: شاحن سريع" aria-label="بحث المنتجات" data-testid="input-search"/><button aria-label="تنفيذ البحث" data-testid="button-submit-search"><SearchIcon size={18}/></button></form></div><div className="search-layout"><aside className="filter-panel"><h3>تصفية النتائج</h3><div className="filter-group"><h4>العلامة التجارية</h4>{brands.map((item) => <label className="filter-check" key={item}><input type="radio" name="brand" checked={brand === item} onChange={() => setBrand(brand === item ? '' : item)} data-testid={`input-filter-brand-${item}`}/>{item}</label>)}</div><div className="filter-group"><h4>القسم</h4>{categories.map((item) => <label className="filter-check" key={item.slug}><input type="radio" name="category" checked={category === item.slug} onChange={() => setCategory(category === item.slug ? '' : item.slug)} data-testid={`input-filter-category-${item.slug}`}/>{item.name}</label>)}</div></aside><div>{isLoading ? <LoadingCatalog/> : isError ? <CatalogError retry={() => window.location.reload()}/> : <><CatalogToolbar products={result} sort={sort} setSort={setSort}/><ProductGrid products={result} empty="لم نجد نتائج بهذا الوصف."/></>}</div></div></div></>;
}

function ProductDetailPage({ slug }: { slug: string }) {
  const { catalog, isLoading, isError, formatPrice, addToCart } = useStore();
  const product = catalog?.products.find((item) => item.slug === slug);
  const [imageIndex, setImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  if (isLoading) return <div className="container"><Breadcrumbs items={[{ label: 'المنتج' }]}/><LoadingCatalog/></div>;
  if (isError) return <div className="container"><CatalogError retry={() => window.location.reload()}/></div>;
  if (!product) return <div className="container"><div className="state-panel" style={{ margin: '60px 0' }}><h3>هذا المنتج غير متاح</h3><Link href="/search" className="button button-primary" data-testid="link-product-missing">العودة للكتالوج</Link></div></div>;
  const price = product.discountPrice ?? product.regularPrice;
  return (
    <>
      <SEO type="product" slug={slug}/>
      <div className="container product-detail">
        <Breadcrumbs items={[
          ...(product.brandSlug ? [{ label: product.brand, href: brandPath(product.brandSlug) }] : []),
          ...(product.category ? [{ label: product.category.name, href: `/category/${product.category.slug}` }] : []),
          { label: product.productName },
        ]}/>
        <div className="product-detail-grid">
          <div className="detail-gallery">
            <div className="detail-main-image"><img src={product.images?.[imageIndex] || product.images?.[0]} alt={product.productName} data-testid="img-product-main"/></div>
            <div className="thumb-row">{product.images.map((image, index) => <button className={`thumb ${imageIndex === index ? 'active' : ''}`} key={image} onClick={() => setImageIndex(index)} data-testid={`button-product-thumb-${index}`}><img src={image} alt=""/></button>)}</div>
          </div>
          <div className="detail-info">
            <span className="product-brand">{product.brand}</span>
            <h1>{product.productName}</h1>
            <div className="product-identity"><span>SKU</span><b dir="ltr">{product.sku}</b></div>
            <p className="detail-copy">{product.shortDescription || product.productDescription || 'منتج متاح من كتالوج CABL.'}</p>
            <div className="detail-price"><strong data-testid="text-product-detail-price">{formatPrice(price)}</strong>{product.discountPrice && <del>{formatPrice(product.regularPrice)}</del>}</div>
            <div className="stock-note"><i/>{product.quantity > 0 ? `متوفر الآن — ${product.quantity} قطعة` : 'غير متوفر حالياً'}</div>
            <div className="detail-actions">
              <QuantityControl value={quantity} onChange={(value) => setQuantity(Math.max(1, Math.min(product.quantity || 1, value)))} testId="quantity-detail"/>
              <button className="button button-primary" onClick={() => addToCart(product.id, quantity)} disabled={product.quantity < 1} data-testid="button-detail-add-cart">أضف إلى السلة <Package size={17}/></button>
            </div>
            <div className="detail-facts">
              <div className="fact"><ShieldCheck size={20}/><span>بيانات المنتج موضحة</span></div>
              <div className="fact"><Truck size={20}/><span>خيارات الشحن تظهر في checkout</span></div>
              <div className="fact"><Zap size={20}/><span>التوافر من الكتالوج الحالي</span></div>
              <div className="fact"><Package size={20}/><span>احتفظ برقم الطلب</span></div>
            </div>
            {product.productNote && <div className="detail-note">{product.productNote}</div>}
          </div>
        </div>
        <div className="detail-mobile-purchase">
          <div><strong>{formatPrice(price)}</strong><span>{product.quantity > 0 ? 'متوفر الآن' : 'غير متوفر'}</span></div>
          <button className="button button-primary" onClick={() => addToCart(product.id, quantity)} disabled={product.quantity < 1} data-testid="button-mobile-detail-add-cart">أضف إلى السلة <Package size={17}/></button>
        </div>
        <ProductEditorial product={product}/>
      </div>
    </>
  );
}

export function ProductPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  return <ProductDetailPage slug={slug} />;
}

export function CanonicalProductPage() {
  const { productSlug = '' } = useParams<{ productSlug: string }>();
  return <ProductDetailPage slug={productSlug} />;
}

export function CartPage() {
  const { cartProducts, formatPrice } = useStore();
  const subtotal = cartProducts.reduce((sum, item) => sum + (item.product.discountPrice ?? item.product.regularPrice) * item.quantity, 0);
  return <><NoIndex/><div className="container cart-page"><Breadcrumbs items={[{ label: 'السلة' }]}/><PageHeading title="سلة مشترياتك" description={cartProducts.length ? 'راجع الكميات قبل الانتقال إلى بيانات التوصيل.' : 'السلة هادئة الآن.'}/>{cartProducts.length ? <div className="cart-layout"><div className="cart-panel">{cartProducts.map((item) => <CartLine key={item.product.id} {...item}/>)}</div><aside className="summary-panel"><h2>ملخص السلة</h2><div className="summary-row"><span>المجموع الفرعي</span><b>{formatPrice(subtotal)}</b></div><div className="summary-row"><span>الشحن</span><span>يحسب عند الاختيار</span></div><div className="summary-row total"><span>الإجمالي المتوقع</span><b>{formatPrice(subtotal)}</b></div><Link href="/checkout" className="button button-primary" data-testid="link-checkout">متابعة إلى الدفع <ArrowLeft size={16}/></Link><p className="summary-note">الدفع النهائي يتضمن طريقة الشحن التي تختارها.</p></aside></div> : <div className="empty-state"><div className="empty-icon"><Package size={28}/></div><h3>لم تضف أي منتج بعد</h3><p>ابدأ من الكتالوج، وستظهر اختياراتك هنا.</p><Link href="/search" className="button button-primary" data-testid="link-cart-empty-search">استعرض المنتجات</Link></div>}</div></>;
}

export function CheckoutPage() {
  const { catalog, cartProducts, formatPrice } = useStore();
  const [, setLocation] = useLocation();
  const orderMutation = useCreateStoreOrder();
  const [shippingId, setShippingId] = useState<number | undefined>(catalog?.shippingOptions[0]?.id);
  const [paymentId, setPaymentId] = useState<number | undefined>(catalog?.paymentMethods[0]?.id);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '', addressLine1: '', addressLine2: '', city: '', country: 'اليمن', postalCode: '', paymentReference: '', couponCode: '' });
  const [error, setError] = useState('');
  useEffect(() => {
    if (!shippingId && catalog?.shippingOptions[0]) setShippingId(catalog.shippingOptions[0].id);
    if (!paymentId && catalog?.paymentMethods[0]) setPaymentId(catalog.paymentMethods[0].id);
  }, [catalog, shippingId, paymentId]);
  const selectedShipping = catalog?.shippingOptions.find((item) => item.id === shippingId);
  const subtotal = cartProducts.reduce((sum, item) => sum + (item.product.discountPrice ?? item.product.regularPrice) * item.quantity, 0);
  const shippingCost = selectedShipping?.free ? 0 : selectedShipping?.charge || 0;
  const update = (key: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const submit = (event: FormEvent) => { event.preventDefault(); setError(''); if (!shippingId || !paymentId || !cartProducts.length) { setError('اختر طريقة الشحن والدفع وتأكد من وجود منتج في السلة.'); return; } const payload: StoreOrderInput = { customer: { firstName: form.firstName, lastName: form.lastName, email: form.email, phoneNumber: form.phoneNumber }, address: { addressLine1: form.addressLine1, addressLine2: form.addressLine2 || null, postalCode: form.postalCode || null, country: form.country, city: form.city, phoneNumber: form.phoneNumber || null }, items: cartProducts.map((item) => ({ productId: item.product.id, quantity: item.quantity })), shippingId, paymentMethodId: paymentId, paymentReference: form.paymentReference || null, couponCode: form.couponCode || null }; orderMutation.mutate({ data: payload }, { onSuccess: (order) => setLocation(`/order/${order.id}?phone=${encodeURIComponent(form.phoneNumber)}`), onError: () => setError('لم يتم إرسال الطلب. لم نخفي المشكلة — راجع البيانات وحاول مرة أخرى.') }); };
  if (!cartProducts.length) return <><NoIndex/><div className="container checkout-page"><div className="empty-state"><h3>السلة فارغة</h3><Link href="/search" className="button button-primary" data-testid="link-checkout-empty">العودة للتسوق</Link></div></div></>;
  return <><NoIndex/><div className="container checkout-page"><Breadcrumbs items={[{ label: 'السلة', href: '/cart' }, { label: 'إتمام الشراء' }]}/><PageHeading title="إتمام الشراء" description="أدخل بياناتك كما هي لتأكيد طلب يمكننا متابعته معك."/><form className="checkout-layout" onSubmit={submit}><div className="checkout-panel"><section className="checkout-section"><h2>بيانات العميل</h2><div className="form-grid"><Field label="الاسم الأول" value={form.firstName} onChange={update('firstName')} required/><Field label="اسم العائلة" value={form.lastName} onChange={update('lastName')} required/><Field label="البريد الإلكتروني" type="email" value={form.email} onChange={update('email')} required/><Field label="رقم الهاتف" value={form.phoneNumber} onChange={update('phoneNumber')} required/></div></section><section className="checkout-section"><h2>عنوان التوصيل</h2><div className="form-grid"><Field label="العنوان" value={form.addressLine1} onChange={update('addressLine1')} required full/><Field label="العنوان الإضافي" value={form.addressLine2} onChange={update('addressLine2')} full/><Field label="المدينة" value={form.city} onChange={update('city')} required/><Field label="الدولة" value={form.country} onChange={update('country')} required/><Field label="الرمز البريدي" value={form.postalCode} onChange={update('postalCode')}/></div></section><section className="checkout-section"><h2>طريقة الشحن</h2>{catalog?.shippingOptions.map((option) => <label className={`method-option ${shippingId === option.id ? 'selected' : ''}`} key={option.id}><input type="radio" name="shipping" checked={shippingId === option.id} onChange={() => setShippingId(option.id)} data-testid={`input-shipping-${option.id}`}/><div><strong>{option.name} — {option.free ? 'مجاني' : formatPrice(option.charge)}</strong><span>{option.estimatedDays ? `التقدير: ${option.estimatedDays} أيام` : 'يتم تأكيد المدة مع الطلب'}</span></div></label>)}</section><section className="checkout-section"><h2>طريقة الدفع</h2>{catalog?.paymentMethods.map((method) => <label className={`method-option ${paymentId === method.id ? 'selected' : ''}`} key={method.id}><input type="radio" name="payment" checked={paymentId === method.id} onChange={() => setPaymentId(method.id)} data-testid={`input-payment-${method.id}`}/><div><strong>{method.name}</strong><span>{method.description || method.instructions || 'تفاصيل الدفع تظهر عند اختيار الطريقة.'}</span></div></label>)}{catalog?.paymentMethods.find((method) => method.id === paymentId)?.requiresTransactionReference && <Field label="مرجع التحويل" value={form.paymentReference} onChange={update('paymentReference')} full/>}</section>{error && <div className="notice" role="alert" data-testid="status-checkout-error">{error}</div>}<button className="button button-primary" type="submit" disabled={orderMutation.isPending} data-testid="button-submit-order">{orderMutation.isPending ? 'جارٍ إرسال الطلب...' : 'تأكيد الطلب'}</button></div><aside className="summary-panel"><h2>مراجعة الطلب</h2>{cartProducts.map((item) => <div className="summary-row" key={item.product.id}><span>{item.product.productName} × {item.quantity}</span><b>{formatPrice((item.product.discountPrice ?? item.product.regularPrice) * item.quantity)}</b></div>)}<div className="summary-row"><span>الشحن</span><b>{formatPrice(shippingCost)}</b></div><div className="summary-row total"><span>الإجمالي</span><b>{formatPrice(subtotal + shippingCost)}</b></div><div className="notice">لن يتم خصم أي مبلغ قبل تأكيد تفاصيل طلبك معك.</div></aside></form></div></>;
}

function Field({ label, value, onChange, type = 'text', required = false, full = false }: { label: string; value: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void; type?: string; required?: boolean; full?: boolean }) { return <label className={`form-field ${full ? 'full' : ''}`}><span>{label}</span><input type={type} value={value} onChange={onChange} required={required} data-testid={`input-${label}`}/></label>; }

export function OrdersPage() {
  const { formatPrice } = useStore();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const params = { email, phone };
  const query = useListStoreOrders(params, { query: { enabled: submitted, queryKey: getListStoreOrdersQueryKey(params) } });
  return <><NoIndex/><div className="container orders-page"><Breadcrumbs items={[{ label: 'الطلبات' }]}/><PageHeading title="تتبع طلباتك" description="أدخل البريد ورقم الهاتف المستخدمين عند إتمام الشراء."/><div className="lookup-card"><h2>البحث عن طلب</h2><p>نستخدم بياناتك فقط للتحقق من الطلبات المرتبطة بها.</p><form className="lookup-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}><input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(event) => setEmail(event.target.value)} required data-testid="input-orders-email"/><input placeholder="رقم الهاتف" value={phone} onChange={(event) => setPhone(event.target.value)} required data-testid="input-orders-phone"/><button className="button button-primary" type="submit" data-testid="button-lookup-orders">عرض الطلبات</button></form></div>{submitted && query.isLoading && <LoadingCatalog/>}{submitted && query.isError && <div className="state-panel error-panel"><h3>لم نعثر على الطلبات بهذه البيانات</h3><p>راجع البريد ورقم الهاتف وحاول مرة أخرى.</p></div>}{submitted && query.data?.orders?.length === 0 && <div className="empty-state"><h3>لا توجد طلبات مرتبطة بهذه البيانات</h3><p>يمكنك العودة للمتجر وبدء طلب جديد.</p></div>}{query.data?.orders && query.data.orders.length > 0 && <div className="orders-list">{query.data.orders.map((order) => <div className="order-row" key={order.id} data-testid={`row-order-${order.id}`}><div><strong>طلب #{order.id}</strong><small>{new Date(order.createdAt).toLocaleDateString('ar-YE')}</small></div><span className="status-badge">{order.status}</span><div><strong>{formatPrice(order.total)}</strong><Link href={`/order/${order.id}?phone=${encodeURIComponent(phone)}`} className="button button-quiet" data-testid={`link-order-${order.id}`}>التفاصيل <ChevronLeft size={14}/></Link></div></div>)}</div>}</div></>;
}

export function OrderPage() {
  const { id = '' } = useParams<{ id: string }>();
  const queryPhone = new URLSearchParams(window.location.search).get('phone') || '';
  const { formatPrice } = useStore();
  const [phone, setPhone] = useState(queryPhone);
  const [submitted, setSubmitted] = useState(Boolean(queryPhone));
  const query = useGetStoreOrder(id, { phone }, { query: { enabled: submitted && Boolean(phone), queryKey: getGetStoreOrderQueryKey(id, { phone }) } });
  if (!submitted || !phone) return <><NoIndex/><div className="container orders-page"><div className="lookup-card" style={{ marginTop: 70 }}><h2>تحقق من الطلب #{id}</h2><p>أدخل رقم الهاتف المستخدم عند الطلب لعرض تفاصيله.</p><form className="lookup-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}><input placeholder="رقم الهاتف" value={phone} onChange={(event) => setPhone(event.target.value)} required data-testid="input-order-phone"/><button className="button button-primary" type="submit" data-testid="button-lookup-order">عرض الطلب</button></form></div></div></>;
  if (query.isLoading) return <><NoIndex/><div className="container"><LoadingCatalog/></div></>;
  if (query.isError || !query.data) return <><NoIndex/><div className="container orders-page"><div className="state-panel"><h3>تعذر العثور على هذا الطلب</h3><Link href="/orders" className="button button-primary" data-testid="link-order-retry">العودة لتتبع الطلبات</Link></div></div></>;
  const order = query.data;
  return <><NoIndex/><div className="container confirmation-page"><Breadcrumbs items={[{ label: 'الطلبات', href: '/orders' }, { label: `طلب #${order.id}` }]}/><div className="confirmation-hero"><Check size={40}/><h1>تم استلام طلبك</h1><p>شكراً لثقتك في CABL. احتفظ برقم الطلب للمتابعة.</p><strong data-testid="text-order-id">#{order.id}</strong></div><div className="confirmation-grid"><div className="detail-list"><h2>تفاصيل المنتجات</h2>{order.items.map((item) => <div className="order-item" key={item.productId}><span>{item.productName} × {item.quantity}</span><b>{formatPrice(item.price * item.quantity)}</b></div>)}</div><div className="detail-list"><h2>ملخص الدفع</h2><div className="summary-row"><span>المجموع</span><b>{formatPrice(order.subtotal)}</b></div><div className="summary-row"><span>الشحن</span><b>{formatPrice(order.shippingCost)}</b></div><div className="summary-row total"><span>الإجمالي</span><b>{formatPrice(order.total)}</b></div><div className="notice">حالة الدفع: {order.paymentStatus} · طريقة الدفع: {order.paymentMethodName}</div><Link href="/search" className="button button-primary" data-testid="link-order-continue">متابعة التسوق <ArrowLeft size={16}/></Link></div></div></div></>;
}