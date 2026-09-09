import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  ChevronDown,
  CircleCheck,
  ClipboardList,
  Download,
  Landmark,
  Heart,
  Menu,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Truck,
  WifiOff,
  X,
  Wallet,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import {
  createStoreOrder,
  getStoreSeo,
  getStoreOrder,
  listStoreOrders,
  subscribeNewsletter,
  type StoreOrder,
  type StorePaymentMethod,
  type StoreProduct,
  type StoreShippingOption,
  type StoreCurrency,
  type StoreSeoResponse,
  type GetStoreCatalogQueryResult,
} from '@workspace/api-client-react';

type Product = {
  id: string;
  slug: string;
  brand: string;
  brandSlug: string | null;
  name: string;
  regularPrice: number;
  discountPrice: number | null;
  price: number;
  color: string;
  description: string;
  note?: string | null;
  category: { id: string; name: string; slug: string } | null;
  image: string;
  sku: string;
  warranty?: string;
  tag?: string;
  quantity: number;
  shippingOptions: StoreShippingOption[];
};

type StoreRoute =
  | { kind: 'home' }
  | { kind: 'product'; slug: string }
  | { kind: 'category'; slug: string }
  | { kind: 'brand'; slug: string }
  | { kind: 'search'; query: string };

type SearchSuggestion = {
  kind: 'product' | 'category' | 'brand';
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  image?: string;
};

function readStoreRoute(): StoreRoute {
  const basePath = import.meta.env.BASE_URL.replace(/\/+$/, '');
  const pathname = window.location.pathname.startsWith(basePath)
    ? window.location.pathname.slice(basePath.length)
    : window.location.pathname;
  const path = pathname.replace(/^\/+|\/+$/g, '');
  const segments = path.split('/').filter(Boolean);
  const slug = segments[1];
  if (segments[0] === 'product' && slug) return { kind: 'product', slug };
  if (segments[0] === 'category' && slug) return { kind: 'category', slug };
  if (segments[0] === 'brand' && slug) return { kind: 'brand', slug };
  if (segments[0] === 'search') return { kind: 'search', query: new URLSearchParams(window.location.search).get('q') ?? '' };
  return { kind: 'home' };
}

const asset = (name: string) => `${import.meta.env.BASE_URL}images/${name}`;
const CACHED_CATALOG_KEY = 'cabl-catalog-v1';
const PENDING_ORDERS_KEY = 'cabl-pending-orders-v1';
const FLOATING_POSITIONS_KEY = 'cabl-floating-positions-v3';
const DEFAULT_CURRENCIES: StoreCurrency[] = [
  { code: 'YER', name: 'ريال يمني', ratePerUsd: 535, isDefault: true },
  { code: 'NYER', name: 'ريال يمني جديد', ratePerUsd: 1572, isDefault: false },
  { code: 'SAR', name: 'ريال سعودي', ratePerUsd: 3.83, isDefault: false },
];
const WHATSAPP_URL = 'https://wa.me/967771106977?text=' + encodeURIComponent('مرحبًا CABL، أريد مساعدة في اختيار المنتجات المناسبة لي.');
const HOME_TITLE = 'CABL | شاحن جوال أصلي وسريع في اليمن';
const HOME_DESCRIPTION = 'اشترِ شاحن جوال أصلي وسريع، شاحن Type-C وPD وGaN، شاحن آيفون وسامسونج وباور بانك من CABL مع توصيل داخل اليمن.';
const GLOBAL_SEARCH_KEYWORDS = [
  'شواحن', 'شاحن جوال', 'شاحن تلفون', 'شواحن تلفونات', 'شاحن سريع', 'شاحن أصلي', 'شاحن سامسونج', 'Samsung',
  'شاحن آيفون', 'iPhone', 'شاحن تايب سي', 'Type-C', 'شاحن يو إس بي', 'USB', 'شاحن 20 واط', 'شاحن 25 واط',
  'شاحن 30 واط', 'شاحن 45 واط', 'شاحن 65 واط', 'شاحن 100 واط', 'شاحن جان', 'GaN', 'شاحن بي دي', 'PD',
  'شاحن سامسونج الأصلي', 'شاحن آيفون الأصلي', 'شواحن سريعة', 'وصلات شحن', 'وصلة شحن', 'وصلات تايب سي',
  'وصلة تايب سي', 'وصلة يو إس بي', 'وصلة تايب سي إلى تايب سي', 'Type-C to Type-C', 'وصلة شحن سريع',
  'وصلات شحن سريعة', 'وصلة 60 واط', 'وصلة 100 واط', 'وصلة 240 واط', 'خازن', 'خازن شحن', 'خازن متنقل',
  'Power Bank', 'خازن 10000', 'خازن 20000', 'خازن 30000', 'خازن 30 واط', 'شاحن سيارة', 'شاحن سيارة سريع',
  'شاحن سيارة يو إس بي', 'شاحن سيارة تايب سي', 'شاحن لاسلكي', 'شاحن وايرلس', 'Wireless', 'شاحن ماج سيف',
  'MagSafe', 'شاحن 3 في 1', 'شواحن ووصلات', 'اكسسوارات جوال', 'اكسسوارات موبايل', 'اكسسوارات آيفون',
  'اكسسوارات سامسونج', 'بيسوس', 'Baseus', 'منتجات بيسوس', 'شواحن بيسوس', 'وصلات بيسوس', 'فينشن', 'Vention',
  'منتجات فينشن', 'شواحن فينشن', 'وصلات فينشن', 'يوقرين', 'UGREEN', 'منتجات يوقرين', 'شواحن يوقرين',
  'وصلات يوقرين', 'انكر', 'Anker', 'منتجات انكر', 'شواحن انكر', 'وصلات انكر', 'شواحن أصلية', 'وصلات أصلية',
  'اكسسوارات جوال أصلية', 'شراء شاحن', 'شراء وصلة', 'شراء خازن', 'متجر شواحن', 'متجر اكسسوارات جوال',
  'متجر إلكترونيات', 'شواحن اليمن', 'شواحن ووصلات اليمن', 'اكسسوارات جوال اليمن', 'متجر إلكترونيات اليمن',
  'CABL اليمن',
];

const dedupeKeywords = (keywords: string[]) => [...new Set(keywords.filter(Boolean))];

const SEARCH_REPLACEMENTS: Array<[RegExp, string]> = [
  [/يو\s*إس\s*بي|يو\s*اس\s*بي|يو اس بي/gi, 'usb'],
  [/تايب\s*سي|تايبسي|تايب-سي/gi, 'type c'],
  [/آيفون|ايفون/gi, 'iphone'],
  [/سامسونج|سامسنغ/gi, 'samsung'],
  [/وايرلس|ويرلس/gi, 'wireless'],
  [/جان/gi, 'gan'],
  [/بي\s*دي/gi, 'pd'],
  [/باور\s*بانك|باوربانك/gi, 'power bank'],
];

function normalizeSearch(value: string) {
  return SEARCH_REPLACEMENTS.reduce((normalized, [pattern, replacement]) => normalized.replace(pattern, replacement), value)
    .toLocaleLowerCase('ar-YE')
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[-_/.,،]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshteinDistance(left: string, right: string) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = row[0];
    row[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const above = row[rightIndex];
      row[rightIndex] = left[leftIndex - 1] === right[rightIndex - 1]
        ? diagonal
        : Math.min(diagonal + 1, above + 1, row[rightIndex - 1] + 1);
      diagonal = above;
    }
  }
  return row[right.length];
}

function productSearchText(product: Product) {
  return normalizeSearch(`${product.brand} ${product.name} ${product.category?.name ?? ''} ${product.sku} ${product.color} ${product.description}`);
}

function matchesProductSearch(product: Product, query: string) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return true;
  const productText = productSearchText(product);
  const productTokens = productText.split(' ');
  return normalizedQuery.split(' ').every((token) => (
    productText.includes(token)
    || productTokens.some((productToken) => token.length > 2 && levenshteinDistance(token, productToken) <= 1)
  ));
}

function matchesSearchText(value: string, query: string) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return true;
  const normalizedValue = normalizeSearch(value);
  return normalizedQuery.split(' ').every((token) => normalizedValue.includes(token));
}

function productKind(product: Pick<Product, 'name' | 'color' | 'description' | 'category'>) {
  const text = `${product.name} ${product.color} ${product.description} ${product.category?.name ?? ''}`.toLowerCase();
  if (text.includes('باور') || text.includes('power bank') || text.includes('خازن')) return 'powerbank';
  if (text.includes('كابل') || text.includes('وصلة') || text.includes('cable') || text.includes('lightning')) return 'cable';
  if (text.includes('سيارة') || text.includes('car')) return 'car';
  if (text.includes('محور') || text.includes('hub') || text.includes('حامل')) return 'accessory';
  if (text.includes('لاسلكي') || text.includes('wireless') || text.includes('magsafe')) return 'wireless';
  return 'charger';
}

function getProductKeywords(product: Product) {
  const text = `${product.name} ${product.color} ${product.description} ${product.category?.name ?? ''}`;
  const kind = productKind(product);
  const keywords = [
    product.name,
    product.brand,
    product.category?.name ?? '',
    product.sku,
    product.color,
    'CABL اليمن',
    'منتجات أصلية',
    'متجر إلكترونيات اليمن',
  ];
  const brandKeywords: Record<string, string[]> = {
    Baseus: ['بيسوس', 'Baseus', 'منتجات بيسوس', 'شواحن بيسوس', 'وصلات بيسوس'],
    Vention: ['فينشن', 'Vention', 'منتجات فينشن', 'شواحن فينشن', 'وصلات فينشن'],
    UGREEN: ['يوقرين', 'UGREEN', 'منتجات يوقرين', 'شواحن يوقرين', 'وصلات يوقرين'],
    Anker: ['انكر', 'Anker', 'منتجات انكر', 'شواحن انكر', 'وصلات انكر'],
  };
  keywords.push(...(brandKeywords[product.brand] ?? []));
  if (kind === 'charger') {
    keywords.push('شواحن', 'شاحن جوال', 'شاحن تلفون', 'شواحن تلفونات', 'شاحن سريع', 'شاحن أصلي', 'شواحن سريعة', 'شراء شاحن', 'متجر شواحن');
  }
  if (kind === 'cable') {
    keywords.push('وصلات شحن', 'وصلة شحن', 'وصلات تايب سي', 'وصلة تايب سي', 'Type-C', 'وصلة يو إس بي', 'USB', 'شراء وصلة', 'وصلات أصلية');
    if (text.toLowerCase().includes('usb-c إلى usb-c') || text.toLowerCase().includes('usb-c to usb-c')) keywords.push('وصلة تايب سي إلى تايب سي', 'Type-C to Type-C');
    if (/\b100w\b|100 واط/i.test(text)) keywords.push('وصلة 100 واط');
    if (/\b60w\b|60 واط/i.test(text)) keywords.push('وصلة 60 واط');
  }
  if (kind === 'powerbank') {
    keywords.push('خازن', 'خازن شحن', 'خازن متنقل', 'Power Bank', 'شراء خازن', 'متجر شواحن');
    if (/10[,.]?000|10000/.test(text)) keywords.push('خازن 10000');
    if (/20[,.]?000|20000/.test(text)) keywords.push('خازن 20000');
    if (/30[,.]?000|30000/.test(text)) keywords.push('خازن 30000');
    if (/30w|30 واط/i.test(text)) keywords.push('خازن 30 واط');
  }
  if (kind === 'car') keywords.push('شاحن سيارة', 'شاحن سيارة سريع', 'شاحن سيارة يو إس بي', 'شاحن سيارة تايب سي');
  if (kind === 'wireless') keywords.push('شاحن لاسلكي', 'شاحن وايرلس', 'Wireless', 'شاحن ماج سيف', 'MagSafe');
  if (kind === 'accessory') keywords.push('شواحن ووصلات', 'اكسسوارات جوال', 'اكسسوارات موبايل', 'اكسسوارات جوال أصلية');
  const wattage = text.match(/(?:\d{2,3})\s*(?:w|واط)/gi) ?? [];
  for (const value of wattage) {
    const watts = value.replace(/\D/g, '');
    keywords.push(`${watts}W`, `${watts} واط`, `شاحن ${watts} واط`);
  }
  if (/gan/i.test(text) || text.includes('جان')) keywords.push('شاحن جان', 'GaN');
  if (/pd/i.test(text) || text.includes('بي دي')) keywords.push('شاحن بي دي', 'PD');
  if (/usb/i.test(text) || text.includes('يو إس بي')) keywords.push('شاحن يو إس بي', 'USB');
  if (/type-c/i.test(text) || text.includes('تايب سي')) keywords.push('شاحن تايب سي', 'Type-C');
  if (/iphone|آيفون|lightning/i.test(text)) keywords.push('شاحن آيفون', 'iPhone', 'شاحن آيفون الأصلي', 'اكسسوارات آيفون');
  if (/samsung|سامسونج/i.test(text)) keywords.push('شاحن سامسونج', 'Samsung', 'شاحن سامسونج الأصلي', 'اكسسوارات سامسونج');
  return dedupeKeywords(keywords);
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type FloatingToolKey = 'whatsapp';
type FloatingPosition = { left: number; top: number };
type FloatingPositions = Partial<Record<FloatingToolKey, FloatingPosition>>;

function productAlt(product: Product) {
  return `${product.name} من ${product.brand}، ${product.category?.name ?? 'منتج شحن'} أصلي في اليمن`;
}

function buildProductWhatsAppUrl(
  product: Product,
  formatMoney: (amountUsd: number) => string,
  shippingOption: StoreShippingOption | null,
) {
  const productUrl = new URL(`${import.meta.env.BASE_URL}product/${product.slug}/`, window.location.origin).toString();
  const shippingSummary = shippingOption
    ? `${shippingOption.free ? 'مجاني' : formatMoney(shippingOption.charge)} · ${shippingOption.estimatedDays ? `${shippingOption.estimatedDays} أيام تقريبًا` : 'يحدد عند تأكيد العنوان'}`
    : 'يحدد عند تأكيد العنوان';
  const message = [
    'مرحبًا CABL، أريد شراء هذا المنتج مباشرة عبر WhatsApp.',
    '',
    `المنتج: ${product.name}`,
    `العلامة: ${product.brand}`,
    `السعر: ${formatMoney(product.price)}`,
    product.sku ? `SKU: ${product.sku}` : '',
    `التوصيل: ${shippingSummary}`,
    `رابط المنتج: ${productUrl}`,
    '',
    'أرجو تأكيد التوفر وتكلفة التوصيل وإتمام الشراء مباشرة.',
  ].filter(Boolean).join('\n');
  return `https://wa.me/967771106977?text=${encodeURIComponent(message)}`;
}

function readCachedCatalog(): GetStoreCatalogQueryResult | null {
  try {
    const saved = window.localStorage.getItem(CACHED_CATALOG_KEY);
    return saved ? JSON.parse(saved) as GetStoreCatalogQueryResult : null;
  } catch {
    return null;
  }
}

function formatMoneyAmount(amountUsd: number, currency: StoreCurrency) {
  const decimals = currency.code === 'SAR' ? 2 : 0;
  const amount = new Intl.NumberFormat('ar-YE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amountUsd * currency.ratePerUsd);
  return `${amount} ${currency.name}`;
}

function readPendingOrders(): Array<Parameters<typeof createStoreOrder>[0]> {
  try {
    const saved = window.localStorage.getItem(PENDING_ORDERS_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readFloatingPositions(): FloatingPositions {
  try {
    const saved = window.localStorage.getItem(FLOATING_POSITIONS_KEY);
    const parsed = saved ? JSON.parse(saved) as FloatingPositions : {};
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.fromEntries(
      (Object.entries(parsed) as Array<[FloatingToolKey, unknown]>).filter(([, value]) => (
        value
        && typeof value === 'object'
        && typeof (value as FloatingPosition).left === 'number'
        && typeof (value as FloatingPosition).top === 'number'
      )),
    ) as FloatingPositions;
  } catch {
    return {};
  }
}

function PaymentMethodIcon({ method }: { method: StorePaymentMethod }) {
  if (method.iconKey === 'bank') return <Landmark size={22} />;
  if (method.iconKey === 'smartphone') return <Smartphone size={22} />;
  if (method.iconKey === 'cash' || !method.requiresTransactionReference) return <Banknote size={22} />;
  if (method.iconKey === 'onecash') return <span className="payment-letter-icon">1</span>;
  return <Wallet size={22} />;
}

function CablLogo({ className = '', showTagline = true }: { className?: string; showTagline?: boolean }) {
  return (
    <span className={`cabl-logo ${className}`} aria-label="CABL">
      <svg className="cabl-logo-mark" viewBox="0 0 96 56" role="img" aria-hidden="true">
        <rect x="8" y="8" width="80" height="40" rx="20" fill="none" stroke="currentColor" strokeWidth="8" />
        <rect x="29" y="23" width="38" height="10" rx="5" fill="currentColor" />
      </svg>
      <span className="cabl-logo-copy">
        <strong>CABL</strong>
        {showTagline && <small>كابل للمنتجات الأصلية الفاخرة</small>}
      </span>
    </span>
  );
}

function ProductPreview({
  product,
  relatedProducts,
  shippingOption,
  formatMoney,
  isFavorite,
  onBack,
  onAddToCart,
  onToggleFavorite,
  onOpenRelatedProduct,
}: {
  product: Product;
  relatedProducts: Product[];
  shippingOption: StoreShippingOption | null;
  formatMoney: (amountUsd: number) => string;
  isFavorite: boolean;
  onBack: () => void;
  onAddToCart: (product: Product) => void;
  onToggleFavorite: (id: string) => void;
  onOpenRelatedProduct: (product: Product) => void;
}) {
  const shippingSummary = shippingOption
    ? `${shippingOption.free ? 'مجاني' : formatMoney(shippingOption.charge)} · ${shippingOption.estimatedDays ? `${shippingOption.estimatedDays} أيام تقريبًا` : 'يحدد عند تأكيد العنوان'}`
    : 'يحدد عند تأكيد العنوان';

  return (
    <section className="product-preview section" aria-label={`تفاصيل ${product.name}`} data-testid="page-product-preview">
      <button className="back-link" type="button" onClick={onBack} data-testid="button-back-products">
        <ArrowRight size={16} /> العودة إلى المنتجات
      </button>
      <div className="product-preview-layout">
        <div className="product-preview-image">
          <img src={product.image} alt={productAlt(product)} width="900" height="980" data-testid={`img-product-preview-${product.id}`} />
        </div>
        <div className="product-preview-copy">
           <span className="eyebrow">
             {product.brandSlug
               ? <a href={`${import.meta.env.BASE_URL}brand/${product.brandSlug}/`}>{product.brand}</a>
               : product.brand}
             {' · '}
             {product.category?.slug
               ? <a href={`${import.meta.env.BASE_URL}category/${product.category.slug}/`}>{product.category.name}</a>
               : product.category?.name ?? '—'}
           </span>
          <h1>{product.name}</h1>
           <div className="product-preview-price">
              <strong>{formatMoney(product.price)}</strong>
              {product.discountPrice !== null && product.discountPrice < product.regularPrice && <del>{formatMoney(product.regularPrice)}</del>}
           </div>
          <p className="product-preview-description">{product.description || product.color}. حل عملي للشحن اليومي، المكتب، والسفر داخل اليمن.</p>
          <div className="product-spec-list">
            <div><span>العلامة</span><strong>{product.brand}</strong></div>
            <div><span>الفئة</span><strong>{product.category?.name ?? '—'}</strong></div>
             <div><span>التوفر</span><strong className={product.quantity > 0 ? 'stock-available' : 'stock-unavailable'}>{product.quantity > 0 ? `متوفر · ${product.quantity} قطعة` : 'غير متوفر حاليًا'}</strong></div>
              <div><span>التوصيل</span><strong>{shippingSummary}</strong></div>
            {product.sku && <div><span>SKU</span><strong>{product.sku}</strong></div>}
            {product.warranty && <div><span>الضمان</span><strong>{product.warranty}</strong></div>}
             {product.note && <div><span>ملاحظة</span><strong>{product.note}</strong></div>}
          </div>
          <div className="product-preview-actions">
             <button className="button-dark" type="button" disabled={product.quantity <= 0} onClick={() => onAddToCart(product)} data-testid={`button-preview-add-${product.id}`}>{product.quantity > 0 ? 'أضف إلى السلة' : 'غير متوفر'}</button>
            <button className={`preview-wish ${isFavorite ? 'active' : ''}`} type="button" onClick={() => onToggleFavorite(product.id)} data-testid={`button-preview-favorite-${product.id}`}>
              <Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} /> {isFavorite ? 'في المفضلة' : 'حفظ للمفضلة'}
            </button>
          </div>
          <div className="product-preview-notes">
            <span><Truck size={16} /> توصيل داخل اليمن</span>
            <span><ShieldCheck size={16} /> منتجات أصلية من {product.brand}</span>
            <span><Sparkles size={16} /> دعم قبل وبعد الشراء</span>
          </div>
        </div>
      </div>
       <section className="product-seo-section" aria-labelledby="product-information-heading">
         <span className="eyebrow">معلومات المنتج</span>
         <h2 id="product-information-heading">قبل شراء {product.name}</h2>
         <p>{product.description || product.color}. راجع العلامة والفئة والتوفر وطريقة التوصيل الظاهرة أعلاه، ثم اختر الكمية المناسبة قبل إضافة المنتج إلى السلة.</p>
         <div className="product-information-grid">
           <div><span>العلامة</span><strong>{product.brand}</strong></div>
           <div><span>الفئة</span><strong>{product.category?.name ?? 'غير محددة'}</strong></div>
           {product.sku && <div><span>رمز المنتج</span><strong dir="ltr">{product.sku}</strong></div>}
           {product.warranty && <div><span>الضمان</span><strong>{product.warranty}</strong></div>}
         </div>
      </section>
       <div className="product-sticky-cta" aria-label={`إضافة ${product.name} إلى السلة`}>
          <div><span>السعر</span><strong>{formatMoney(product.price)}</strong></div>
         <button className="button-dark" type="button" disabled={product.quantity <= 0} onClick={() => onAddToCart(product)} data-testid={`button-sticky-add-${product.id}`}>
           {product.quantity > 0 ? 'أضف إلى السلة' : 'غير متوفر'}
         </button>
       </div>
      {relatedProducts.length > 0 && (
        <section className="related-products" aria-labelledby="related-products-heading">
          <div className="section-header">
            <div>
              <span className="eyebrow">اقتراحات مناسبة</span>
              <h2 id="related-products-heading">منتجات ذات صلة</h2>
            </div>
            <p>منتجات من نفس العلامة أو الفئة لتقارن المواصفات والقدرة قبل الشراء.</p>
          </div>
          <div className="related-product-grid">
            {relatedProducts.map((relatedProduct) => (
              <article className="related-product-card" key={relatedProduct.id}>
                <button type="button" onClick={() => onOpenRelatedProduct(relatedProduct)} aria-label={`عرض ${relatedProduct.name}`}>
                  <img src={relatedProduct.image} alt={productAlt(relatedProduct)} width="500" height="600" loading="lazy" />
                </button>
                <div>
                  <span>{relatedProduct.brand}</span>
                  <h3>{relatedProduct.name}</h3>
                  <strong>{formatMoney(relatedProduct.price)}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

function App() {
  const [catalog, setCatalog] = useState<GetStoreCatalogQueryResult | null>(() => readCachedCatalog());
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [currencyCode, setCurrencyCode] = useState(() => {
    try {
      return window.localStorage.getItem('cabl-currency') ?? 'YER';
    } catch {
      return 'YER';
    }
  });
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(() => (
    window.matchMedia('(display-mode: standalone)').matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  ));
  const [floatingPositions, setFloatingPositions] = useState<FloatingPositions>(() => readFloatingPositions());
  const floatingDragRef = useRef<{
    key: FloatingToolKey;
    startX: number;
    startY: number;
    initialLeft: number;
    initialTop: number;
    moved: boolean;
  } | null>(null);
  const draggedClickRef = useRef<FloatingToolKey | null>(null);
  const [slide, setSlide] = useState(0);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchOpen, setSearchOpen] = useState(false);
  const [route, setRoute] = useState<StoreRoute>(() => readStoreRoute());
  const [seo, setSeo] = useState<StoreSeoResponse | null>(null);
  const [query, setQuery] = useState(() => {
    const initialRoute = readStoreRoute();
    return initialRoute.kind === 'search' ? initialRoute.query : '';
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = window.localStorage.getItem('cabl-favorites');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
    } catch {
      return [];
    }
  });
  const [cart, setCart] = useState<Product[]>([]);
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [lastOrder, setLastOrder] = useState<StoreOrder | null>(null);
  const [shippingId, setShippingId] = useState<number | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [quoteForm, setQuoteForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    addressLine1: '',
    city: '',
    country: 'اليمن',
  });
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [trackingForm, setTrackingForm] = useState({ email: '', phone: '' });
  const [trackingOrders, setTrackingOrders] = useState<Array<{ id: string; status: string; total: number; createdAt: string }>>([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');
  const [trackingDetail, setTrackingDetail] = useState<StoreOrder | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterError, setNewsletterError] = useState('');
  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/store/catalog`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`Catalog request failed with status ${response.status}`);
      }
      const nextCatalog = await response.json() as GetStoreCatalogQueryResult;
      setCatalog(nextCatalog);
      try {
        window.localStorage.setItem(CACHED_CATALOG_KEY, JSON.stringify(nextCatalog));
      } catch {
        // The live catalog remains usable even when storage is unavailable.
      }
    } catch {
      // Keep the cached catalog visible when the network is unavailable.
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    const updateConnection = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    return () => {
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setInstallPrompt(null);
      announce('تم تثبيت تطبيق CABL بنجاح');
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (!catalog?.products?.length || !navigator.serviceWorker.controller) return;
    const urls = catalog.products.flatMap((product) => product.images.map((image) => (
      image.startsWith('http')
        ? image
        : new URL(`${import.meta.env.BASE_URL}${image}`, window.location.href).href
    )));
    navigator.serviceWorker.controller.postMessage({ type: 'CACHE_CATALOG_IMAGES', urls });
  }, [catalog]);

  useEffect(() => {
    const heroCount = Math.min(catalog?.products.length ?? 1, 3);
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % Math.max(heroCount, 1)), 6500);
    return () => window.clearInterval(timer);
  }, [catalog?.products.length]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    window.localStorage.setItem('cabl-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const availableCurrencies = catalog?.currencies?.length ? catalog.currencies : DEFAULT_CURRENCIES;
  const selectedCurrency = availableCurrencies.find((currency) => currency.code === currencyCode)
    ?? availableCurrencies.find((currency) => currency.isDefault)
    ?? DEFAULT_CURRENCIES[0];
  const formatMoney = useCallback((amountUsd: number) => formatMoneyAmount(amountUsd, selectedCurrency), [selectedCurrency]);

  useEffect(() => {
    if (selectedCurrency.code !== currencyCode) setCurrencyCode(selectedCurrency.code);
    try {
      window.localStorage.setItem('cabl-currency', selectedCurrency.code);
    } catch {
      // Currency selection remains active for the current visit if storage is unavailable.
    }
  }, [currencyCode, selectedCurrency]);

  useEffect(() => {
    const syncRouteFromUrl = () => setRoute(readStoreRoute());
    window.addEventListener('popstate', syncRouteFromUrl);
    return () => {
      window.removeEventListener('popstate', syncRouteFromUrl);
    };
  }, []);

  const products = useMemo<Product[]>(() => (catalog?.products ?? []).map((product: StoreProduct) => ({
    id: product.id,
    slug: product.slug,
    brand: product.brand,
    brandSlug: product.brandSlug,
    name: product.productName,
    regularPrice: product.regularPrice,
    discountPrice: product.discountPrice,
    price: product.discountPrice ?? product.regularPrice,
    color: product.shortDescription ?? product.productDescription ?? `منتج أصلي من ${product.brand}`,
    description: product.productDescription ?? product.shortDescription ?? `منتج أصلي من ${product.brand} متوفر في CABL اليمن.`,
    note: product.productNote,
    category: product.category,
    image: product.images[0]
      ? product.images[0].startsWith('http') ? product.images[0] : `${import.meta.env.BASE_URL}${product.images[0]}`
      : '',
    sku: product.sku,
    quantity: product.quantity,
    shippingOptions: product.shippingOptions,
  })), [catalog]);

  const shippingOptions = catalog?.shippingOptions ?? [];
  const selectedShippingId = shippingId ?? shippingOptions[0]?.id ?? null;
  const selectedShippingOption = shippingOptions.find((option) => option.id === selectedShippingId) ?? null;
  const paymentMethods = catalog?.paymentMethods ?? [];
  const selectedPaymentMethodId = paymentMethodId ?? paymentMethods[0]?.id ?? null;
  const selectedPaymentMethod = paymentMethods.find((method) => method.id === selectedPaymentMethodId) ?? null;
  const cartSubtotal = cart.reduce((sum, product) => sum + product.price * (cartQuantities[product.id] ?? 1), 0);
  const cartShipping = selectedShippingOption?.free ? 0 : selectedShippingOption?.charge ?? 0;
  const cartTotal = cartSubtotal + cartShipping;
  const cartItemCount = cart.reduce((sum, product) => sum + (cartQuantities[product.id] ?? 1), 0);

  useEffect(() => {
    if (paymentMethods.length > 0 && paymentMethodId === null) {
      setPaymentMethodId(paymentMethods[0].id);
    }
  }, [paymentMethodId, paymentMethods]);

  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesFilter = activeFilter === 'ALL' || product.category?.id === activeFilter;
      const matchesCategoryRoute = route.kind !== 'category' || product.category?.slug === route.slug;
      const matchesBrandRoute = route.kind !== 'brand' || product.brandSlug === route.slug;
      const matchesQuery = matchesProductSearch(product, query);
      return matchesFilter && matchesCategoryRoute && matchesBrandRoute && matchesQuery;
    });
  }, [activeFilter, products, query, route]);
  const categories = useMemo(() => {
    const categoryMap = new Map<string, { id: string; name: string; slug: string; image: string; count: string }>();
    for (const product of products) {
      if (!product.category || categoryMap.has(product.category.id)) continue;
      categoryMap.set(product.category.id, {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
        image: product.image,
        count: `${products.filter((item) => item.category?.id === product.category?.id).length} منتجات`,
      });
    }
    return [...categoryMap.values()];
  }, [products]);

  const searchSuggestions = useMemo(() => {
    if (!query.trim()) return [];
    const productSuggestions: SearchSuggestion[] = products
      .filter((product) => matchesProductSearch(product, query))
      .slice(0, 4)
      .map((product) => ({
        kind: 'product',
        id: product.id,
        title: product.name,
        subtitle: `${product.brand} · ${formatMoney(product.price)}`,
        slug: product.slug,
        image: product.image,
      }));
    const categorySuggestions: SearchSuggestion[] = categories
      .filter((category) => matchesSearchText(category.name, query))
      .slice(0, 2)
      .map((category) => ({
        kind: 'category',
        id: category.id,
        title: category.name,
        subtitle: `${category.count} · تصفح الفئة`,
        slug: category.slug,
        image: category.image,
      }));
    const brandSuggestions: SearchSuggestion[] = [...new Map(products
      .filter((product) => product.brandSlug && matchesSearchText(product.brand, query))
      .map((product) => [product.brandSlug, product])).values()]
      .slice(0, 2)
      .map((product) => ({
        kind: 'brand',
        id: product.brandSlug as string,
        title: product.brand,
        subtitle: 'تصفح منتجات العلامة',
        slug: product.brandSlug as string,
        image: product.image,
      }));
    return [...productSuggestions, ...categorySuggestions, ...brandSuggestions].slice(0, 6);
  }, [categories, formatMoney, products, query]);

  const filterOptions = useMemo(() => [
    { value: 'ALL', label: 'كل المنتجات' },
    ...categories.map((category) => ({ value: category.id, label: category.name })),
  ], [categories]);

  const brandOptions = useMemo(() => [...new Map(products
    .filter((product) => product.brandSlug)
    .map((product) => [product.brandSlug, { name: product.brand, slug: product.brandSlug as string }]))
    .values()], [products]);

  useEffect(() => {
    if (route.kind === 'category') {
      const category = categories.find((item) => item.slug === route.slug);
      setActiveFilter(category?.id ?? 'ALL');
      setQuery('');
    } else if (route.kind === 'search') {
      setActiveFilter('ALL');
      setQuery(route.query);
      setSearchOpen(true);
    } else {
      setActiveFilter('ALL');
      if (route.kind !== 'home') setQuery('');
      setSearchOpen(false);
    }
  }, [categories, route]);

  const navigateTo = (path: string) => {
    const basePath = import.meta.env.BASE_URL.endsWith('/')
      ? import.meta.env.BASE_URL
      : `${import.meta.env.BASE_URL}/`;
    const nextPath = `${basePath}${path.replace(/^\/+/, '')}`;
    window.history.pushState({}, '', nextPath);
    setRoute(readStoreRoute());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitSearch = () => {
    const trimmedQuery = query.trim();
    navigateTo(trimmedQuery ? `/search?q=${encodeURIComponent(trimmedQuery)}` : '/search');
    scrollTo('discover');
  };

  const categoryIdFor = (...hints: string[]) =>
    categories.find((category) => hints.some((hint) => category.name.includes(hint)))?.id ?? 'ALL';

  const listingH1 = route.kind === 'category'
    ? seo?.h1 ?? categories.find((category) => category.slug === route.slug)?.name ?? 'منتجات CABL'
    : route.kind === 'brand'
      ? seo?.h1 ?? `منتجات ${products.find((product) => product.brandSlug === route.slug)?.brand ?? route.slug}`
      : route.kind === 'search'
        ? seo?.h1 ?? `نتائج البحث عن «${query}»`
        : null;

  const heroes = useMemo(() => products.slice(0, 3).map((product) => ({
    productId: product.id,
    categoryId: product.category?.id ?? 'ALL',
    image: product.image,
    eyebrow: product.category?.name ?? 'CABL',
    title: product.name,
    body: product.color,
    action: 'عرض المنتج',
  })), [products]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const announce = (message: string) => setToast(message);

  const persistFloatingPosition = (key: FloatingToolKey, position: FloatingPosition) => {
    setFloatingPositions((current) => {
      const nextPositions = { ...current, [key]: position };
      try {
        window.localStorage.setItem(FLOATING_POSITIONS_KEY, JSON.stringify(nextPositions));
      } catch {
        // The controls remain movable even when storage is unavailable.
      }
      return nextPositions;
    });
  };

  const handleFloatingPointerDown = (key: FloatingToolKey, event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    floatingDragRef.current = {
      key,
      startX: event.clientX,
      startY: event.clientY,
      initialLeft: rect.left,
      initialTop: rect.top,
      moved: false,
    };
    element.setPointerCapture(event.pointerId);
  };

  const handleFloatingPointerMove = (key: FloatingToolKey, event: React.PointerEvent<HTMLElement>) => {
    const drag = floatingDragRef.current;
    if (!drag || drag.key !== key) return;
    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    if (distance > 5) drag.moved = true;
    if (!drag.moved) return;
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    const nextLeft = Math.max(8, Math.min(window.innerWidth - rect.width - 8, drag.initialLeft + event.clientX - drag.startX));
    const nextTop = Math.max(8, Math.min(window.innerHeight - rect.height - 8, drag.initialTop + event.clientY - drag.startY));
    persistFloatingPosition(key, { left: nextLeft, top: nextTop });
  };

  const handleFloatingPointerUp = (key: FloatingToolKey, event: React.PointerEvent<HTMLElement>) => {
    const drag = floatingDragRef.current;
    if (!drag || drag.key !== key) return;
    if (drag.moved) draggedClickRef.current = key;
    floatingDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const preventDraggedClick = (key: FloatingToolKey, event: React.MouseEvent<HTMLElement>) => {
    if (draggedClickRef.current !== key) return;
    event.preventDefault();
    draggedClickRef.current = null;
  };

  const installApp = async () => {
    if (!installPrompt) {
      announce('افتح قائمة المتصفح واختر إضافة إلى الشاشة الرئيسية');
      return;
    }
    const promptEvent = installPrompt;
    setInstallPrompt(null);
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    announce(choice.outcome === 'accepted' ? 'جاري تثبيت تطبيق CABL' : 'يمكنك تثبيت التطبيق من قائمة المتصفح لاحقًا');
  };

  const flushPendingOrders = async () => {
    if (!navigator.onLine) return;
    const pendingOrders = readPendingOrders();
    if (pendingOrders.length === 0) return;
    const remaining = [...pendingOrders];
    let sentCount = 0;
    while (remaining.length > 0) {
      try {
        await createStoreOrder(remaining[0]);
        remaining.shift();
        sentCount += 1;
      } catch {
        break;
      }
    }
    try {
      if (remaining.length > 0) {
        window.localStorage.setItem(PENDING_ORDERS_KEY, JSON.stringify(remaining));
      } else {
        window.localStorage.removeItem(PENDING_ORDERS_KEY);
      }
    } catch {
      // A later online visit can retry the order if storage is unavailable.
    }
    if (sentCount > 0) {
      announce(`تم إرسال ${sentCount} طلب محفوظ بعد عودة الاتصال`);
      void loadCatalog();
    }
  };

  useEffect(() => {
    window.addEventListener('online', flushPendingOrders);
    void flushPendingOrders();
    return () => window.removeEventListener('online', flushPendingOrders);
  }, []);

  const openProductPreview = (product: Product) => {
    navigateTo(`/product/${product.slug}`);
  };

  const closeProductPreview = () => {
    navigateTo('/');
  };

  const toggleFavorite = (id: string) => {
    setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    announce(favorites.includes(id) ? 'تمت إزالة المنتج من المفضلة' : 'تمت إضافة المنتج إلى المفضلة');
  };

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      announce('هذا المنتج غير متوفر حاليًا');
      return;
    }
    const currentQuantity = cartQuantities[product.id] ?? 0;
    if (currentQuantity >= Math.min(product.quantity, 99)) {
      announce(`المتاح من ${product.name} هو ${product.quantity} فقط`);
      return;
    }
    setCart((current) => current.some((item) => item.id === product.id) ? current : [...current, product]);
    setCartQuantities((current) => ({ ...current, [product.id]: Math.min((current[product.id] ?? 0) + 1, product.quantity, 99) }));
    setCartOpen(true);
    announce(`تمت إضافة ${product.name} إلى القائمة`);
  };

  const removeFromCart = (productId: string) => {
    setCartQuantities((current) => {
      const quantity = current[productId] ?? 1;
      if (quantity > 1) return { ...current, [productId]: quantity - 1 };
      const next = { ...current };
      delete next[productId];
      return next;
    });
    setCart((current) => current.filter((product) => product.id !== productId || (cartQuantities[productId] ?? 1) > 1));
    announce('تم تحديث الكمية');
  };

  const chooseCategory = (filter: string) => {
    setActiveFilter(filter);
    if (filter === 'ALL') {
      navigateTo('/');
    } else {
      const category = categories.find((item) => item.id === filter);
      if (category) navigateTo(`/category/${category.slug}`);
    }
    scrollTo('discover');
  };

  const openQuoteForm = () => {
    setCartOpen(false);
    setWishlistOpen(false);
    setQuoteSubmitted(false);
    setQuoteError('');
    setLastOrder(null);
    setShippingId((current) => current ?? shippingOptions[0]?.id ?? null);
    setPaymentMethodId((current) => current ?? paymentMethods[0]?.id ?? null);
    setPaymentReference('');
    setQuoteOpen(true);
  };

  const submitQuote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuoteSubmitting(true);
    setQuoteError('');

    if (!selectedShippingId) {
      setQuoteError('لا توجد طريقة شحن متاحة حاليًا.');
      setQuoteSubmitting(false);
      return;
    }

    const orderPayload: Parameters<typeof createStoreOrder>[0] = {
        customer: {
          firstName: quoteForm.firstName.trim(),
          lastName: quoteForm.lastName.trim(),
          email: quoteForm.email.trim(),
          phoneNumber: quoteForm.phoneNumber.trim(),
        },
        address: {
          addressLine1: quoteForm.addressLine1.trim(),
          addressLine2: null,
          postalCode: null,
          country: quoteForm.country.trim(),
          city: quoteForm.city.trim(),
          phoneNumber: quoteForm.phoneNumber.trim(),
        },
        items: cart.map((product) => ({ productId: product.id, quantity: cartQuantities[product.id] ?? 1 })),
        shippingId: selectedShippingId,
        paymentMethodId: selectedPaymentMethodId,
        paymentReference: selectedPaymentMethod?.requiresTransactionReference ? paymentReference.trim() || null : null,
        couponCode: null,
    };

    if (!navigator.onLine) {
      try {
        window.localStorage.setItem(PENDING_ORDERS_KEY, JSON.stringify([...readPendingOrders(), orderPayload]));
      } catch {
        setQuoteError('تعذر حفظ الطلب على هذا الجهاز. اتصل بالإنترنت لإرساله الآن.');
        setQuoteSubmitting(false);
        return;
      }
      setLastOrder(null);
      setQuoteSubmitted(true);
      setCart([]);
      setCartQuantities({});
      announce('تم حفظ الطلب وسيُرسل تلقائيًا عند عودة الاتصال');
      setQuoteSubmitting(false);
      return;
    }

    try {
      const order = await createStoreOrder(orderPayload);
      setLastOrder(order);
      setQuoteSubmitted(true);
      setCart([]);
      setCartQuantities({});
      void loadCatalog();
      announce('تم استلام طلب عرض السعر بنجاح');
    } catch (error) {
      setQuoteError(getApiErrorMessage(error));
    } finally {
      setQuoteSubmitting(false);
    }
  };

  const submitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (email.trim()) {
      setNewsletterSubmitting(true);
      setNewsletterError('');
      try {
        await subscribeNewsletter({ email: email.trim() });
        setSubscribed(true);
        announce('تمت إضافتك إلى القائمة');
      } catch (error) {
        setNewsletterError(getApiErrorMessage(error));
      } finally {
        setNewsletterSubmitting(false);
      }
    }
  };

  const favoriteProducts = products.filter((product) => favorites.includes(product.id));
  const selectedProduct = route.kind === 'product'
    ? products.find((product) => product.slug === route.slug) ?? null
    : null;
  const selectedProductId = selectedProduct?.id ?? null;
  const floatingWhatsAppUrl = selectedProduct
    ? buildProductWhatsAppUrl(selectedProduct, formatMoney, selectedShippingOption)
    : WHATSAPP_URL;
  const relatedProducts = useMemo(() => {
    if (!selectedProduct) return [];
    const selectedKind = productKind(selectedProduct);
    return products
      .filter((product) => product.id !== selectedProduct.id)
      .map((product) => {
        let score = 0;
        if (product.brand === selectedProduct.brand) score += 4;
        if (product.category?.id && product.category.id === selectedProduct.category?.id) score += 5;
        if (productKind(product) === selectedKind) score += 3;
        if (product.name.match(/\d{2,3}W/i)?.[0] === selectedProduct.name.match(/\d{2,3}W/i)?.[0]) score += 1;
        return { product, score };
      })
      .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
      .slice(0, 4)
      .map(({ product }) => product);
  }, [products, selectedProduct]);

  useEffect(() => {
    const seoParams = route.kind === 'product' || route.kind === 'category' || route.kind === 'brand'
      ? { type: route.kind, slug: route.slug }
      : { type: 'home' as const };
    let active = true;
    void getStoreSeo(seoParams).then((nextSeo) => {
      if (active) setSeo(nextSeo);
    }).catch(() => {
      if (active) setSeo(null);
    });
    return () => {
      active = false;
    };
  }, [route]);

  useEffect(() => {
    if (!seo) return;
    const pageSeo: StoreSeoResponse = route.kind === 'search'
      ? {
        ...seo,
        title: query.trim() ? `نتائج البحث عن ${query.trim()} | CABL` : 'البحث في متجر CABL',
        h1: query.trim() ? `نتائج البحث عن «${query.trim()}»` : 'البحث في متجر CABL',
        description: 'نتائج البحث داخل كتالوج CABL. صفحات البحث والفلاتر غير قابلة للفهرسة.',
        canonicalPath: '/search',
        indexable: false,
        breadcrumbs: [{ name: 'الرئيسية', path: '/' }, { name: 'البحث', path: '/search' }],
      }
      : seo;
    document.title = pageSeo.title;
    const setMeta = (selector: string, attribute: 'name' | 'property', content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, selector.includes('og:') ? selector.replace('[property="', '').replace('"]', '') : selector.replace('[name="', '').replace('"]', ''));
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };
    setMeta('meta[name="description"]', 'name', pageSeo.description);
    setMeta('meta[name="robots"]', 'name', pageSeo.indexable ? 'index, follow' : 'noindex, follow');
    setMeta('meta[property="og:title"]', 'property', pageSeo.title);
    setMeta('meta[property="og:description"]', 'property', pageSeo.description);
    setMeta('meta[property="og:url"]', 'property', new URL(pageSeo.canonicalPath, window.location.origin).href);
    setMeta('meta[property="og:type"]', 'property', pageSeo.entityType === 'product' ? 'product' : 'website');
    setMeta('meta[name="twitter:title"]', 'name', pageSeo.title);
    setMeta('meta[name="twitter:description"]', 'name', pageSeo.description);
    setMeta('meta[name="keywords"]', 'name', selectedProduct ? getProductKeywords(selectedProduct).join(', ') : GLOBAL_SEARCH_KEYWORDS.join(', '));
    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]') ?? document.head.appendChild(document.createElement('link'));
    canonical.rel = 'canonical';
    canonical.href = new URL(pageSeo.canonicalPath, window.location.origin).href;
    const jsonLd = document.head.querySelector<HTMLScriptElement>('#cabl-seo-jsonld') ?? document.head.appendChild(document.createElement('script'));
    jsonLd.id = 'cabl-seo-jsonld';
    jsonLd.type = 'application/ld+json';
    jsonLd.textContent = JSON.stringify(pageSeo.jsonLd);
  }, [query, route, seo, selectedProduct]);

  const closeQuoteForm = () => {
    setQuoteOpen(false);
    setQuoteSubmitted(false);
    setQuoteError('');
  };

  const updateQuoteField = (field: keyof typeof quoteForm, value: string) => {
    setQuoteForm((current) => ({ ...current, [field]: value }));
  };

  const openTracking = () => {
    setAccountOpen(false);
    setTrackingError('');
    setTrackingOrders([]);
    setTrackingDetail(null);
    setTrackingOpen(true);
  };

  const submitTracking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTrackingLoading(true);
    setTrackingError('');
    try {
      const response = await listStoreOrders({ email: trackingForm.email.trim(), phone: trackingForm.phone.trim() });
      setTrackingOrders(response.orders);
      if (response.orders.length === 0) setTrackingError('لم نجد طلبات بهذه البيانات.');
    } catch (error) {
      setTrackingError(getApiErrorMessage(error));
    } finally {
      setTrackingLoading(false);
    }
  };

  const loadTrackingDetail = async (id: string) => {
    setTrackingLoading(true);
    setTrackingError('');
    try {
      const detail = await getStoreOrder(id, { phone: trackingForm.phone.trim() });
      setTrackingDetail(detail);
    } catch (error) {
      setTrackingError(getApiErrorMessage(error));
    } finally {
      setTrackingLoading(false);
    }
  };

  const getApiErrorMessage = (error: unknown) => {
    if (error && typeof error === 'object' && 'data' in error) {
      const data = (error as { data?: { error?: string } }).data;
      if (data?.error) return data.error;
    }
    return error instanceof Error ? error.message : 'تعذر تنفيذ الطلب. حاول مرة أخرى.';
  };

  return (
    <div className={`site-shell ${selectedProduct ? 'product-page-shell' : ''}`}>
      <header className="main-header" data-testid="header-storefront">
        <div className="header-inner">
          <div className="header-row">
            <button
              className="mobile-menu"
              type="button"
               aria-label="فتح القائمة"
              onClick={() => setMobileMenuOpen((current) => !current)}
              data-testid="button-open-menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <button className="wordmark" type="button" onClick={() => scrollTo('top')} data-testid="button-wordmark">
              <CablLogo />
            </button>
            <div className="header-actions">
              <label className="currency-switcher">
                <span>العملة</span>
                <select
                  value={selectedCurrency.code}
                  onChange={(event) => setCurrencyCode(event.target.value)}
                  aria-label="اختر العملة"
                  data-testid="select-currency"
                >
                  {availableCurrencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>{currency.name}</option>
                  ))}
                </select>
                <small>1 USD = {selectedCurrency.ratePerUsd} {selectedCurrency.name}</small>
              </label>
              <button className="header-action" type="button" onClick={() => setSearchOpen((current) => !current)} aria-label="بحث" data-testid="button-search">
                <Search /><span>بحث</span>
              </button>
              <button className="header-action" type="button" onClick={() => setWishlistOpen(true)} aria-label="المفضلة" data-testid="button-wishlist">
                <Heart /><span>المفضلة</span>
                {favorites.length > 0 && <span className="count-bubble" data-testid="count-wishlist">{favorites.length}</span>}
              </button>
              <button className="header-action" type="button" onClick={() => setCartOpen(true)} aria-label="السلة" data-testid="button-cart">
                <ShoppingBag /><span>السلة</span>
                {cartItemCount > 0 && <span className="count-bubble" data-testid="count-cart">{cartItemCount}</span>}
              </button>
            </div>
          </div>

          <nav className="desktop-nav" aria-label="التنقل الرئيسي" data-testid="nav-main">
            {filterOptions.slice(1).map((filter) => <button type="button" key={filter.value} onClick={() => chooseCategory(filter.value)} data-testid={`nav-category-${filter.value}`}>{filter.label}</button>)}
            <button type="button" onClick={() => chooseCategory('ALL')} data-testid="nav-brands">Baseus و Vention و Anker و UGREEN</button>
            <button type="button" onClick={() => scrollTo('about')} data-testid="nav-about">عن CABL</button>
            <button className="nav-highlight" type="button" onClick={() => scrollTo('discover')} data-testid="nav-sale">تسوق الآن</button>
          </nav>

          {mobileMenuOpen && (
            <nav className="mobile-nav" aria-label="تنقل الهاتف" data-testid="nav-mobile">
              {filterOptions.slice(1).map((filter) => <button type="button" key={filter.value} onClick={() => chooseCategory(filter.value)} data-testid={`mobile-nav-category-${filter.value}`}>{filter.label}</button>)}
              <button type="button" onClick={() => scrollTo('about')} data-testid="mobile-nav-about">عن CABL</button>
              <button className="nav-highlight" type="button" onClick={() => scrollTo('discover')} data-testid="mobile-nav-quote">تسوق الآن</button>
            </nav>
          )}

          {route.kind === 'home' && !selectedProduct && !searchOpen && (
            <button className="quick-search-trigger" type="button" onClick={() => setSearchOpen(true)} data-testid="button-quick-search">
              <Search size={17} aria-hidden="true" />
              <span>ابحث عن منتج أو مواصفة</span>
              <ArrowLeft size={14} aria-hidden="true" />
            </button>
          )}

          {searchOpen && (
            <div className="search-panel" data-testid="panel-search">
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                  placeholder="ابحث عن منتج أو SKU أو مواصفة"
                  aria-label="ابحث عن منتج أو SKU أو مواصفة"
                data-testid="input-search"
              />
               <button className="search-submit" type="button" onClick={submitSearch} aria-label="تنفيذ البحث" data-testid="button-submit-search">
                <Search size={18} />
              </button>
              {query && (
                <div className="search-suggestions" data-testid="search-results-count">
                  <p>{visibleProducts.length} نتيجة للبحث عن «{query}»</p>
                    {searchSuggestions.map((suggestion) => (
                      <button
                        type="button"
                        key={`${suggestion.kind}-${suggestion.id}`}
                        onClick={() => {
                          setSearchOpen(false);
                          if (suggestion.kind === 'product') {
                            const product = products.find((item) => item.id === suggestion.id);
                            if (product) openProductPreview(product);
                          } else {
                            navigateTo(`/${suggestion.kind}/${suggestion.slug}`);
                          }
                        }}
                        data-testid={`search-suggestion-${suggestion.kind}-${suggestion.id}`}
                      >
                        {suggestion.image ? <img src={suggestion.image} alt="" /> : <span className="search-suggestion-icon"><Search size={15} /></span>}
                        <span><strong>{suggestion.title}</strong><small>{suggestion.subtitle}</small></span>
                        <ArrowLeft size={14} />
                      </button>
                    ))}
                    {searchSuggestions.length === 0 && <p className="search-empty">لم نجد تطابقًا مباشرًا. جرّب «USB»، «تايب سي»، «iPhone» أو اسم العلامة التجارية.</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main id="top">
        {selectedProduct ? (
          <ProductPreview
            product={products.find((product) => product.id === selectedProductId) ?? products[0]}
            relatedProducts={relatedProducts}
            shippingOption={selectedShippingOption}
            formatMoney={formatMoney}
            isFavorite={selectedProductId !== null && favorites.includes(selectedProductId)}
            onBack={closeProductPreview}
            onAddToCart={addToCart}
            onToggleFavorite={toggleFavorite}
            onOpenRelatedProduct={openProductPreview}
          />
        ) : (
        <>
        {route.kind === 'home' && <>
        <section className="hero" aria-label="حملات الإلكترونيات" data-testid="section-hero">
          {heroes.length > 0 ? heroes.map((hero, index) => (
            <article className={`hero-frame ${slide === index ? 'active' : ''}`} key={hero.productId} aria-hidden={slide !== index}>
              <img src={hero.image} alt={`${hero.title} من CABL`} width="1440" height="620" fetchPriority="high" data-testid={`img-hero-${index}`} />
              <div className="hero-shade" />
              <div className="hero-copy">
                <span className="eyebrow">{hero.eyebrow}</span>
                {route.kind === 'home' ? <h1>{hero.title}</h1> : <h2>{hero.title}</h2>}
                <p>{hero.body}</p>
                <button className="button-light" type="button" onClick={() => {
                  setActiveFilter(hero.categoryId);
                  openProductPreview(products.find((product) => product.id === hero.productId)!);
                }} data-testid={`button-hero-${index}`}>{hero.action}</button>
              </div>
            </article>
          )) : (
            <div className="hero-frame active">
              <div className="hero-copy">
                <span className="eyebrow">{catalogLoading ? 'جاري تحميل الكتالوج' : 'الكتالوج غير متاح'}</span>
                <h1>{catalogLoading ? 'جاري تحميل المنتجات.' : 'لا توجد منتجات منشورة.'}</h1>
                <p>{catalogLoading ? 'يتم تحميل البيانات من قاعدة البيانات.' : 'أضف منتجات منشورة من لوحة الإدارة لتظهر هنا.'}</p>
              </div>
            </div>
          )}
          {heroes.length > 0 && <div className="hero-controls" data-testid="controls-hero">
            <button className="hero-arrow" type="button" aria-label="Previous product" onClick={() => setSlide((current) => (current - 1 + heroes.length) % heroes.length)} data-testid="button-hero-previous"><ArrowLeft size={17} /></button>
            <div className="hero-dots">
              {heroes.map((hero, index) => (
                <button className={`hero-dot ${slide === index ? 'active' : ''}`} type="button" key={hero.productId} aria-label={`Show product ${index + 1}`} onClick={() => setSlide(index)} data-testid={`button-hero-dot-${index}`} />
              ))}
            </div>
            <button className="hero-arrow" type="button" aria-label="Next product" onClick={() => setSlide((current) => (current + 1) % heroes.length)} data-testid="button-hero-next"><ArrowRight size={17} /></button>
          </div>}
        </section>

         <section className="brand-announcement" aria-label="وكالة Baseus" data-testid="section-brand-announcement">
           <div><span className="eyebrow">شراكة رسمية</span><h2>Baseus<br />في اليمن.</h2></div>
           <p><strong>CABL هو الوكيل الحصري لعلامة Baseus في اليمن.</strong><br />اكتشف الشواحن والكابلات والبطاريات المحمولة الأصلية، مع توصيل داخل اليمن ودعم محلي.</p>
         </section>

        <section className="section" id="categories" data-testid="section-categories">
          <div className="section-header">
            <div>
              <span className="eyebrow">ابدأ من هنا</span>
              <h2>طاقة لخطوتك<br />القادمة.</h2>
            </div>
             <p>خمس فئات من منتجات الشحن والطاقة للاستخدام اليومي، المكتب، والسيارة.</p>
          </div>
          <div className="category-grid">
            {categories.map((category) => (
              <a className="category-tile" href={`${import.meta.env.BASE_URL}category/${category.slug}/`} key={category.id} onClick={(event) => { event.preventDefault(); chooseCategory(category.id); }} data-testid={`card-category-${category.id}`}>
                <img src={category.image} alt={`${category.name} شواحن ومنتجات في اليمن`} width="600" height="600" loading="lazy" data-testid={`img-category-${category.id}`} />
                <span className="category-info">
                  <h3>{category.name}</h3>
                  <span>{category.count} <ChevronDown size={11} /></span>
                </span>
              </a>
            ))}
          </div>
        </section>

        </>}

        <section className="section" id="discover" data-testid="section-discover">
          <div className="section-header">
            <div>
              <span className="eyebrow">مختارة لرفك</span>
                {listingH1 ? <h1>{listingH1}</h1> : <h2>Baseus و Vention و Anker و UGREEN<br />لك.</h2>}
            </div>
             <button className="text-link" type="button" onClick={() => chooseCategory('ALL')} data-testid="button-view-all">عرض كل المنتجات</button>
          </div>
          <div className="product-toolbar">
            <div className="filter-row" role="tablist" aria-label="Product categories">
              {filterOptions.map((filter) => (
                <button className={`filter-button ${activeFilter === filter.value ? 'active' : ''}`} type="button" key={filter.value} onClick={() => chooseCategory(filter.value)} data-testid={`filter-${filter.value.toLowerCase()}`}>{filter.label}</button>
              ))}
            </div>
            <button className="sort-button" type="button" onClick={() => announce('يتم عرض أحدث المنتجات')} data-testid="button-sort">الأحدث <ChevronDown size={13} /></button>
          </div>
           <div className="product-grid" aria-live="polite">
            {visibleProducts.map((product) => (
              <article className="product-card" key={product.id} data-testid={`card-product-${product.id}`}>
                <div className="product-image">
                  <img src={product.image} alt={productAlt(product)} width="800" height="1000" loading="lazy" data-testid={`img-product-${product.id}`} />
                     <a
                     className="image-open-button"
                      href={`${import.meta.env.BASE_URL}product/${product.slug}/`}
                      onClick={(event) => { event.preventDefault(); openProductPreview(product); }}
                     aria-label={`عرض ${product.name}`}
                     data-testid={`button-open-product-${product.id}`}
                    />
                  <button className={`wish-button ${favorites.includes(product.id) ? 'active' : ''}`} type="button" onClick={() => toggleFavorite(product.id)} aria-label={`Save ${product.name}`} data-testid={`button-favorite-${product.id}`}>
                    <Heart size={15} fill={favorites.includes(product.id) ? 'currentColor' : 'none'} />
                  </button>
                  {product.tag && <span className="product-tag">{product.tag}</span>}
                </div>
                <div className="product-details">
                  <div className="product-brand">{product.brand}</div>
                  <div className="product-name">{product.name}</div>
                   <div className="product-price">
                     <strong>{formatMoney(product.price)}</strong>
                     {product.discountPrice !== null && product.discountPrice < product.regularPrice && <del>{formatMoney(product.regularPrice)}</del>}
                   </div>
                   <div className={`product-stock ${product.quantity > 0 ? 'available' : 'unavailable'}`}>
                     {product.quantity > 0 ? <><CircleCheck size={13} /> متوفر</> : 'غير متوفر'}
                   </div>
                   <div className="product-card-actions">
                      <a className="preview-link" href={`${import.meta.env.BASE_URL}product/${product.slug}/`} onClick={(event) => { event.preventDefault(); openProductPreview(product); }} data-testid={`button-preview-product-${product.id}`}>عرض التفاصيل</a>
                      <button className="text-link" type="button" disabled={product.quantity <= 0} onClick={() => addToCart(product)} data-testid={`button-add-product-${product.id}`}>{product.quantity > 0 ? 'أضف إلى السلة' : 'غير متوفر'}</button>
                   </div>
                </div>
              </article>
            ))}
             {visibleProducts.length === 0 && (
               <div className="empty-products empty-products-card" data-testid="empty-product-results">
                 <strong>لم نجد منتجات مطابقة</strong>
                 <p>{query.trim() ? `لا توجد نتائج لعبارة «${query.trim()}».` : 'لا توجد منتجات منشورة في هذه الفئة حاليًا.'}</p>
                 <div className="empty-products-actions">
                   <button className="button-dark" type="button" onClick={() => { setQuery(''); navigateTo('/'); scrollTo('discover'); }} data-testid="button-empty-reset">عرض كل المنتجات</button>
                   {query.trim() && <button className="preview-link" type="button" onClick={() => { setQuery(''); setSearchOpen(true); }} data-testid="button-empty-new-search">بحث جديد</button>}
                 </div>
                 {brandOptions.length > 0 && (
                   <div className="empty-products-links" aria-label="تصفح العلامات التجارية">
                     <span>أو تصفح علامة:</span>
                     {brandOptions.slice(0, 4).map((brand) => <button type="button" key={brand.slug} onClick={() => navigateTo(`/brand/${brand.slug}`)}>{brand.name}</button>)}
                   </div>
                 )}
               </div>
             )}
          </div>
        </section>

          {route.kind === 'home' && <>
          <section className="section campaign-section" id="campaigns" data-testid="section-campaigns">
            <div className="section-header">
              <div>
                <span className="eyebrow">اختياراتنا</span>
                <h2>اشحن<br />لحظتك.</h2>
              </div>
              <p>منتجات Baseus و Vention و Anker و UGREEN الأصلية بمواصفات واضحة لتختار ما يناسب أجهزتك ويومك.</p>
            </div>
            <div className="campaign-grid">
              <article className="campaign-card">
                <img src={asset('vention-powerbank-10k.jpg')} alt="باور بانك وشاحن متنقل أصلي في اليمن" width="800" height="1000" loading="lazy" data-testid="img-campaign-season" />
                <span className="campaign-label"><h3>طاقة<br />أينما ذهبت.</h3><button type="button" onClick={() => chooseCategory(categoryIdFor('باور', 'طاقة'))} data-testid="button-campaign-season">تصفح {categories.find((category) => category.id === categoryIdFor('باور', 'طاقة'))?.name ?? 'الفئة'}</button></span>
              </article>
              <article className="campaign-card">
                <img src={asset('vention-charger-70w.jpg')} alt="شاحن سريع 70W أصلي في اليمن" width="800" height="1000" loading="lazy" data-testid="img-campaign-women" />
                <span className="campaign-label"><h3>حجم صغير،<br />أداء كبير.</h3><button type="button" onClick={() => chooseCategory(categoryIdFor('شاحن', 'شواحن'))} data-testid="button-campaign-women">تصفح {categories.find((category) => category.id === categoryIdFor('شاحن', 'شواحن'))?.name ?? 'الفئة'}</button></span>
              </article>
              <article className="campaign-card">
                <img src={asset('vention-adapter-65w.jpg')} alt="شاحن Type-C للسفر مع توصيل داخل اليمن" width="800" height="1000" loading="lazy" data-testid="img-campaign-men" />
                <span className="campaign-label"><h3>جاهز<br />للسفر.</h3><button type="button" onClick={() => chooseCategory(categoryIdFor('سفر'))} data-testid="button-campaign-men">تصفح {categories.find((category) => category.id === categoryIdFor('سفر'))?.name ?? 'الفئة'}</button></span>
              </article>
            </div>
          </section>

          <section className="section about-section" id="about" aria-label="عن CABL" data-testid="section-about">
            <div className="about-layout">
              <div>
                <span className="eyebrow">عن CABL</span>
                <h2>كابل<br />لليمن.</h2>
              </div>
              <div className="about-copy">
                <p className="about-lead">CABL — الوكيل الحصري لـ Baseus و Vention، مع منتجات Anker للشحن والطاقة داخل اليمن.</p>
                <p>نوفر لك حلولًا عملية للاستخدام اليومي، مع تجربة شراء واضحة ودعم يساعدك في اختيار المنتج المناسب.</p>
              </div>
            </div>
          </section>
          </>}

          <section className="section seo-section" aria-labelledby="seo-heading" data-testid="section-seo-content">
            <div className="section-header">
              <div>
                <span className="eyebrow">دليل الشراء في اليمن</span>
                <h2 id="seo-heading">شاحن جوال أصلي<br />وسريع في اليمن.</h2>
              </div>
              <p>اختر شاحنًا مناسبًا لجهازك من كتالوج CABL، مع مواصفات واضحة وخيارات توصيل داخل اليمن.</p>
            </div>
            <div className="seo-grid">
              <article>
                <h3>شاحن سريع وموثوق</h3>
                <p>لشراء شاحن جوال سريع أو شاحن أصلي بسعر مناسب، قارن القدرة والتوافق والمنفذ قبل الطلب. ستجد شواحن USB وType-C وشواحن PD وGaN للاستخدام اليومي والسفر.</p>
              </article>
              <article>
                <h3>آيفون وسامسونج وUSB-C</h3>
                <p>نوفر حلول شحن للآيفون وسامسونج وهواوي وشاومي، إضافة إلى سلك شاحن وكيبل شاحن وشاحن لاسلكي وشاحن سيارة وباور بانك حسب احتياجك.</p>
              </article>
              <article>
                <h3>توصيل داخل اليمن</h3>
                <p>يمكنك شراء شاحن جوال أونلاين من CABL وطلب التوصيل إلى صنعاء أو عدن أو تعز أو الحديدة أو إب أو حضرموت أو مأرب، بحسب خيارات الشحن المتاحة لعنوانك.</p>
              </article>
            </div>
            <div className="seo-faq" aria-label="أسئلة شائعة عن الشواحن">
              <details>
                <summary>أين أجد شاحن جوال أصلي في اليمن؟</summary>
                <p>تصفح منتجات CABL الأصلية من Baseus وVention وAnker وUGREEN، ثم اختر طريقة الدفع والتوصيل المناسبة داخل اليمن.</p>
              </details>
              <details>
                <summary>ما الشاحن المناسب للطاقة الضعيفة أو الاستخدام اليومي؟</summary>
                <p>يعتمد الاختيار على جهازك وقدرة الشاحن المطلوبة. راجع القدرة بالواط، نوع المنفذ، والتوافق قبل شراء شاحن سريع أو شاحن متنقل.</p>
              </details>
              <details>
                <summary>كم سعر الشاحن في اليمن؟</summary>
                <p>تختلف أسعار الشواحن حسب العلامة والقدرة والمواصفات. يعرض الكتالوج سعر كل منتج بوضوح قبل إتمام الطلب.</p>
              </details>
            </div>
            <nav className="seo-links" aria-label="صفحات الشواحن">
              <a href={`${import.meta.env.BASE_URL}chargers/`}>شواحن الجوال</a>
              <a href={`${import.meta.env.BASE_URL}fast-chargers/`}>الشواحن السريعة</a>
              <a href={`${import.meta.env.BASE_URL}type-c-chargers/`}>شواحن Type-C</a>
              <a href={`${import.meta.env.BASE_URL}iphone-chargers/`}>شواحن الآيفون</a>
              <a href={`${import.meta.env.BASE_URL}samsung-chargers/`}>شواحن سامسونج</a>
              <a href={`${import.meta.env.BASE_URL}car-chargers/`}>شواحن السيارات</a>
              <a href={`${import.meta.env.BASE_URL}wireless-chargers/`}>الشواحن اللاسلكية</a>
              <a href={`${import.meta.env.BASE_URL}charging-cables/`}>وصلات الشحن</a>
              <a href={`${import.meta.env.BASE_URL}power-banks/`}>الباور بانك والخازن المتنقل</a>
              <a href={`${import.meta.env.BASE_URL}phone-accessories/`}>اكسسوارات الجوال</a>
              <a href={`${import.meta.env.BASE_URL}delivery/yemen/`}>التوصيل داخل اليمن</a>
            </nav>
            <details className="seo-keyword-details">
              <summary>عمليات البحث الشائعة عن الشواحن والإكسسوارات في اليمن</summary>
              <div className="seo-keyword-cloud">
                {GLOBAL_SEARCH_KEYWORDS.map((keyword) => <span key={keyword}>{keyword}</span>)}
              </div>
            </details>
          </section>

        <section className="service-band" id="services" aria-label="خدمات المتجر" data-testid="section-services">
          <div className="service-item"><Truck /><span><strong>توصيل داخل اليمن</strong><span>نرتب الشحن إلى مدينتك عند تأكيد الطلب</span></span></div>
          <div className="service-item"><ShieldCheck /><span><strong>منتجات Baseus و Vention و Anker و UGREEN أصلية</strong><span>مواصفات واضحة وضمان عند توفره</span></span></div>
          <div className="service-item"><Sparkles /><span><strong>دعم قبل وبعد الشراء</strong><span>نساعدك في اختيار الحل المناسب</span></span></div>
        </section>

        <section className="section newsletter" data-testid="section-newsletter">
          <h2>خلّ الطاقة<br />مستمرة.</h2>
          <div className="newsletter-right">
            <p>أدخل بريدك لتصلك المنتجات الجديدة والعروض والتحديثات من CABL.</p>
            {subscribed ? (
              <p data-testid="status-subscribed"><strong>تمت إضافتك إلى القائمة.</strong> تابع بريدك الإلكتروني.</p>
            ) : (
              <form className="email-form" onSubmit={submitEmail}>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="بريدك الإلكتروني" aria-label="بريدك الإلكتروني" data-testid="input-newsletter-email" />
                <button type="submit" disabled={newsletterSubmitting} data-testid="button-newsletter-submit">{newsletterSubmitting ? 'جارٍ الحفظ...' : 'اشترك الآن'} <ArrowRight size={14} /></button>
              </form>
            )}
            {newsletterError && <p className="form-error" role="alert" data-testid="error-newsletter">{newsletterError}</p>}
            <p className="signup-note">بإدخال بريدك، توافق على استلام التحديثات التسويقية.</p>
          </div>
        </section>
        </>
        )}
      </main>

      <footer className="footer" data-testid="footer-storefront">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand" lang="ar" dir="rtl">
              <CablLogo className="cabl-logo-footer" />
              <p>منتجات Baseus و Vention و Anker و UGREEN الأصلية للشحن والطاقة، متوفرة للشراء داخل اليمن.</p>
            </div>
            <div className="footer-col"><h4>تصفح</h4>{filterOptions.slice(1).map((filter) => <button type="button" key={filter.value} onClick={() => chooseCategory(filter.value)} data-testid={`footer-category-${filter.value}`}>{filter.label}</button>)}</div>
            <div className="footer-col"><h4>المتجر</h4><button type="button" onClick={() => scrollTo('discover')} data-testid="footer-shortlist">كل المنتجات</button><button type="button" onClick={() => setCartOpen(true)} data-testid="footer-moq">السلة</button><button type="button" onClick={() => setWishlistOpen(true)} data-testid="footer-pricing">المفضلة</button></div>
            <div className="footer-col"><h4>خدمة العملاء</h4><button type="button" onClick={() => scrollTo('about')} data-testid="footer-about">عن CABL</button><button type="button" onClick={() => scrollTo('services')} data-testid="footer-delivery">الشحن والتوصيل</button><button type="button" onClick={() => scrollTo('discover')} data-testid="footer-help">مواصفات المنتجات</button><button type="button" onClick={openTracking} data-testid="footer-track-order">تتبع طلبك</button><button type="button" onClick={openQuoteForm} data-testid="footer-contact">إتمام الطلب</button></div>
            <div className="footer-col"><h4>تابعنا</h4><button type="button" onClick={() => announce('تم نسخ رابط Instagram')} data-testid="footer-instagram">Instagram</button><button type="button" onClick={() => announce('تم نسخ رابط TikTok')} data-testid="footer-tiktok">TikTok</button><button type="button" onClick={() => announce('تم نسخ رابط WhatsApp')} data-testid="footer-whatsapp">WhatsApp</button></div>
          </div>
          <div className="footer-bottom"><span>© 2026 CABL. الوكيل الحصري لـ Baseus و Vention في اليمن · منتجات Anker و UGREEN متوفرة.</span><div className="footer-socials"><button type="button" onClick={() => announce('تم اختيار اليمن')} data-testid="button-country">اليمن <ChevronDown size={12} /></button><button type="button" onClick={() => announce('تم فتح اختيار اللغة')} data-testid="button-language">العربية <ChevronDown size={12} /></button></div></div>
        </div>
      </footer>

      {wishlistOpen && (
        <div className="drawer-backdrop" role="presentation" onClick={() => setWishlistOpen(false)} data-testid="overlay-wishlist">
          <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="المفضلة" onClick={(event) => event.stopPropagation()} data-testid="drawer-wishlist">
            <div className="drawer-header"><h2>المفضلة <span>({favoriteProducts.length})</span></h2><button className="close-button" type="button" onClick={() => setWishlistOpen(false)} aria-label="إغلاق المفضلة" data-testid="button-close-wishlist"><X size={16} /></button></div>
            {favoriteProducts.length === 0 ? (
              <div className="cart-empty"><div><Heart size={29} strokeWidth={1.2} /><p>احفظ المنتجات التي تريد العودة إليها لاحقًا.</p><button className="button-dark" type="button" onClick={() => { setWishlistOpen(false); scrollTo('discover'); }} data-testid="button-browse-wishlist">تصفح المنتجات</button></div></div>
            ) : (
              <div>
                {favoriteProducts.map((product) => (
                  <div className="cart-item" key={product.id}>
                    <img src={product.image} alt={product.name} />
                    <div className="cart-item-info"><button className="remove-item" type="button" onClick={() => toggleFavorite(product.id)} data-testid={`button-remove-wishlist-${product.id}`}>إزالة</button><strong>{product.brand}</strong><span>{product.name}</span><br /><span>{formatMoney(product.price)}</span></div>
                  </div>
                ))}
                <button className="button-dark checkout-button" type="button" onClick={openQuoteForm} data-testid="button-quote-wishlist">إتمام الطلب</button>
              </div>
            )}
          </aside>
        </div>
      )}
      {cartOpen && (
        <div className="drawer-backdrop" role="presentation" onClick={() => setCartOpen(false)} data-testid="overlay-cart">
            <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="قائمة طلب عرض السعر" onClick={(event) => event.stopPropagation()} data-testid="drawer-cart">
            <div className="drawer-header"><h2>السلة <span>({cart.length})</span></h2><button className="close-button" type="button" onClick={() => setCartOpen(false)} aria-label="إغلاق السلة" data-testid="button-close-cart"><X size={16} /></button></div>
            {cart.length === 0 ? (
              <div className="cart-empty"><div><ShoppingBag size={29} strokeWidth={1.2} /><p>أضف المنتجات التي تريد شراءها.</p><button className="button-dark" type="button" onClick={() => { setCartOpen(false); scrollTo('discover'); }} data-testid="button-start-shopping">تصفح المنتجات</button></div></div>
            ) : (
              <>
                <div>
                  {cart.map((product) => {
                    const quantity = cartQuantities[product.id] ?? 1;
                    return (
                      <div className="cart-item" key={product.id}>
                        <img src={product.image} alt={product.name} />
                        <div className="cart-item-info">
                          <button className="remove-item" type="button" onClick={() => {
                            setCart((current) => current.filter((item) => item.id !== product.id));
                            setCartQuantities((current) => { const next = { ...current }; delete next[product.id]; return next; });
                            announce('تم حذف المنتج من السلة');
                          }} data-testid={`button-remove-cart-${product.id}`}>حذف</button>
                          <strong>{product.brand}</strong>
                          <span>{product.name}</span>
                           <b className="cart-line-total">{formatMoney(product.price * quantity)}</b>
                          <div className="quantity-control" aria-label={`كمية ${product.name}`}>
                            <button type="button" onClick={() => addToCart(product)} disabled={quantity >= Math.min(product.quantity, 99)} aria-label="زيادة الكمية"><Plus size={14} /></button>
                            <span>{quantity}</span>
                            <button type="button" onClick={() => removeFromCart(product.id)} aria-label="إنقاص الكمية"><Minus size={14} /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                  <div className="cart-summary" aria-label="ملخص السلة">
                    <div><span>الإجمالي الفرعي</span><strong>{formatMoney(cartSubtotal)}</strong></div>
                    <div><span>التوصيل</span><strong>{cartShipping === 0 ? 'مجاني' : formatMoney(cartShipping)}</strong></div>
                    <div className="cart-summary-total"><span>المجموع</span><strong data-testid="text-cart-total">{formatMoney(cartTotal)}</strong></div>
                  </div>
                  <button className="button-dark checkout-button" type="button" onClick={openQuoteForm} data-testid="button-checkout">إتمام الطلب</button>
              </>
            )}
          </aside>
        </div>
      )}
      {quoteOpen && (
        <div className="modal-backdrop" role="presentation" onClick={closeQuoteForm} data-testid="overlay-quote">
          <section className="quote-modal" role="dialog" aria-modal="true" aria-labelledby="quote-title" onClick={(event) => event.stopPropagation()} data-testid="modal-quote">
            <div className="drawer-header"><h2 id="quote-title">إتمام الطلب</h2><button className="close-button" type="button" onClick={closeQuoteForm} aria-label="إغلاق النموذج" data-testid="button-close-quote"><X size={16} /></button></div>
            {quoteSubmitted ? (
                <div className="quote-success" data-testid="status-quote-submitted">
                  {lastOrder ? <><strong>تم حفظ طلبك بنجاح.</strong><p>رقم الطلب: <strong>{lastOrder.id}</strong></p><p>طريقة الدفع: {lastOrder.paymentMethodName}. حالة الدفع: {lastOrder.paymentStatus === 'cod_pending' ? 'الدفع عند الاستلام' : 'بانتظار مراجعة التحويل'}</p><p>الحالة الحالية: {lastOrder.status}. يمكنك متابعة الشحن من زر تتبع الطلب.</p><div className="product-card-actions"><button className="button-dark" type="button" onClick={openTracking} data-testid="button-track-created-order">تتبع الطلب</button><button className="preview-link" type="button" onClick={closeQuoteForm} data-testid="button-finish-quote">حسنًا</button></div></> : <><strong>تم حفظ طلبك على الجهاز.</strong><p>لا يوجد اتصال حاليًا. سيُرسل الطلب تلقائيًا إلى CABL عند عودة الإنترنت.</p><button className="button-dark" type="button" onClick={closeQuoteForm} data-testid="button-finish-offline-order">حسنًا</button></>}
                </div>
             ) : (
               <form className="quote-form checkout-layout" onSubmit={submitQuote}>
                 <div className="checkout-details">
                    <div className="checkout-heading">
                      <p className="checkout-kicker">CABL · CHECKOUT</p>
                      <h3>تأكيد طلبك</h3>
                      <div className="checkout-steps" aria-label="مراحل إتمام الطلب"><span className="active">1 البيانات</span><span>2 التوصيل</span><span>3 الدفع</span><span>4 تأكيد</span></div>
                      <p className="quote-intro">أدخل البيانات الضرورية فقط. لا تحتاج إلى إنشاء حساب لإتمام الشراء.</p>
                      <div className="checkout-trust"><CircleCheck size={15} /> السعر والتوصيل يظهران قبل التأكيد · دعم WhatsApp متاح</div>
                    </div>
                    <div className="checkout-section"><h4>بيانات العميل</h4><div className="quote-form-grid"><label>الاسم الأول<input required minLength={2} maxLength={100} value={quoteForm.firstName} onChange={(event) => updateQuoteField('firstName', event.target.value)} autoComplete="given-name" data-testid="input-order-first-name" /></label><label>اسم العائلة<input required minLength={2} maxLength={100} value={quoteForm.lastName} onChange={(event) => updateQuoteField('lastName', event.target.value)} autoComplete="family-name" data-testid="input-order-last-name" /></label></div><div className="quote-form-grid"><label>البريد الإلكتروني<input required type="email" maxLength={255} value={quoteForm.email} onChange={(event) => updateQuoteField('email', event.target.value)} autoComplete="email" inputMode="email" data-testid="input-order-email" /></label><label>رقم الهاتف<input required minLength={9} maxLength={13} pattern="(?:\+967|967)?[0-9]{9}" title="أدخل رقم هاتف يمنيًا مكونًا من 9 أرقام" value={quoteForm.phoneNumber} onChange={(event) => updateQuoteField('phoneNumber', event.target.value)} autoComplete="tel" inputMode="tel" placeholder="771234567" data-testid="input-order-phone" /></label></div></div>
                    <div className="checkout-section"><h4>بيانات التوصيل</h4><label>العنوان<input required minLength={3} maxLength={500} value={quoteForm.addressLine1} onChange={(event) => updateQuoteField('addressLine1', event.target.value)} autoComplete="street-address" placeholder="الحي، الشارع، أقرب معلم" data-testid="input-order-address" /></label><label>المدينة<input required minLength={2} maxLength={100} value={quoteForm.city} onChange={(event) => updateQuoteField('city', event.target.value)} autoComplete="address-level2" placeholder="صنعاء، عدن، تعز..." data-testid="input-order-city" /></label><label>طريقة الشحن<select required value={selectedShippingId ?? ''} onChange={(event) => setShippingId(Number(event.target.value))} data-testid="select-order-shipping">{shippingOptions.map((option) => <option key={option.id} value={option.id}>{option.name}{option.free ? ' · مجاني' : ` · ${formatMoney(option.charge)}`}{option.estimatedDays ? ` · ${option.estimatedDays} أيام` : ''}</option>)}</select></label></div>
                   <div className="checkout-section"><h4>طريقة الدفع</h4><label className="payment-select-label"><span>اختر طريقة الدفع</span><select required value={selectedPaymentMethodId ?? ''} onChange={(event) => { setPaymentMethodId(Number(event.target.value)); setPaymentReference(''); }} data-testid="select-payment-method">{paymentMethods.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}</select></label>{selectedPaymentMethod && <div className="payment-instructions" data-testid="payment-instructions"><div className="payment-instructions-title"><span className="payment-method-icon"><PaymentMethodIcon method={selectedPaymentMethod} /></span><strong>{selectedPaymentMethod.name}</strong></div>{selectedPaymentMethod.accountName && <p>اسم الحساب: <b>{selectedPaymentMethod.accountName}</b></p>}{selectedPaymentMethod.accountNumber && <p>رقم الحساب: <b dir="ltr">{selectedPaymentMethod.accountNumber}</b></p>}<p>{selectedPaymentMethod.instructions ?? 'اتبع تعليمات الدفع الظاهرة ثم أكمل الطلب.'}</p>{selectedPaymentMethod.requiresTransactionReference && <label>رقم العملية بعد التحويل<input required value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} maxLength={255} placeholder="أدخل رقم العملية" data-testid="input-payment-reference" /></label>}</div>}</div>
                   {quoteError && <p className="form-error" role="alert" data-testid="error-quote">{quoteError}</p>}
                   <button className="button-dark checkout-submit-mobile" type="submit" disabled={quoteSubmitting || cart.length === 0 || !selectedPaymentMethodId} data-testid="button-submit-quote">{quoteSubmitting ? 'جارٍ حفظ الطلب...' : selectedPaymentMethod?.requiresTransactionReference ? 'تأكيد التحويل وإرسال الطلب' : 'تأكيد الطلب والدفع عند الاستلام'}</button>
                 </div>
                 <aside className="checkout-summary" aria-label="ملخص الطلب">
                   <div className="summary-heading"><p className="checkout-kicker">ORDER SUMMARY</p><h3>ملخص الطلب</h3></div>
                   <div className="summary-items">{cart.length === 0 ? <p className="summary-empty">السلة فارغة</p> : cart.map((product) => <div className="summary-item" key={product.id}><img src={product.image} alt="" /><div><strong>{product.name}</strong><span>{formatMoney(product.price)} · الكمية {cartQuantities[product.id] ?? 1}</span></div><button type="button" onClick={() => removeFromCart(product.id)} aria-label={`حذف ${product.name}`} data-testid={`button-remove-summary-${product.id}`}><X size={14} /></button></div>)}</div>
                   <div className="summary-totals"><div><span>الإجمالي الفرعي</span><b>{formatMoney(cartSubtotal)}</b></div><div><span>رسوم الشحن</span><b>{cartShipping === 0 ? 'مجاني' : formatMoney(cartShipping)}</b></div><div className="summary-total"><strong>الإجمالي</strong><strong>{formatMoney(cartTotal)}</strong></div></div>
                   <button className="button-dark checkout-submit" type="submit" disabled={quoteSubmitting || cart.length === 0 || !selectedPaymentMethodId} data-testid="button-submit-quote-summary">{quoteSubmitting ? 'جارٍ حفظ الطلب...' : 'تأكيد الطلب'}</button>
                 </aside>
               </form>
            )}
          </section>
        </div>
      )}
      {trackingOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setTrackingOpen(false)} data-testid="overlay-tracking">
          <section className="quote-modal" role="dialog" aria-modal="true" aria-labelledby="tracking-title" onClick={(event) => event.stopPropagation()} data-testid="modal-tracking">
            <div className="drawer-header"><h2 id="tracking-title">تتبع طلبك</h2><button className="close-button" type="button" onClick={() => setTrackingOpen(false)} aria-label="إغلاق التتبع"><X size={16} /></button></div>
            <form className="quote-form" onSubmit={submitTracking}>
              <p className="quote-intro">أدخل البريد الإلكتروني ورقم الهاتف المستخدمين عند الطلب لعرض سجل الطلبات وحالة الشحن.</p>
              <label>البريد الإلكتروني<input required type="email" value={trackingForm.email} onChange={(event) => setTrackingForm((current) => ({ ...current, email: event.target.value }))} data-testid="input-tracking-email" /></label>
              <label>رقم الهاتف<input required minLength={5} maxLength={40} value={trackingForm.phone} onChange={(event) => setTrackingForm((current) => ({ ...current, phone: event.target.value }))} data-testid="input-tracking-phone" /></label>
              {trackingError && <p className="form-error" role="alert" data-testid="error-tracking">{trackingError}</p>}
              <button className="button-dark checkout-button" type="submit" disabled={trackingLoading} data-testid="button-submit-tracking">{trackingLoading ? 'جارٍ البحث...' : 'عرض الطلبات'}</button>
            </form>
            {trackingOrders.length > 0 && <div className="tracking-results"><h3>طلباتك</h3>{trackingOrders.map((order) => <button className="tracking-order" key={order.id} type="button" onClick={() => loadTrackingDetail(order.id)}><span><strong>{order.id}</strong><small>{new Date(order.createdAt).toLocaleDateString('ar-YE')}</small></span><span><strong>{formatMoney(order.total)}</strong><small>{order.status}</small></span></button>)}</div>}
             {trackingDetail && <div className="quote-success tracking-detail"><strong>{trackingDetail.id}</strong><p>الحالة: {trackingDetail.status}</p><p>الدفع: {trackingDetail.paymentMethodName} · {trackingDetail.paymentStatus === 'cod_pending' ? 'الدفع عند الاستلام' : 'بانتظار مراجعة التحويل'}</p><p>الإجمالي: {formatMoney(trackingDetail.total)} · الشحن: {formatMoney(trackingDetail.shippingCost)}</p><div>{trackingDetail.items.map((item) => <p key={item.productId}>{item.productName} × {item.quantity}</p>)}</div></div>}
          </section>
        </div>
      )}
      {accountOpen && (
        <div className="drawer-backdrop" role="presentation" onClick={() => setAccountOpen(false)} data-testid="overlay-account">
          <aside className="cart-drawer account-drawer" role="dialog" aria-modal="true" aria-label="الحساب" onClick={(event) => event.stopPropagation()} data-testid="drawer-account">
            <div className="drawer-header"><h2>الحساب</h2><button className="close-button" type="button" onClick={() => setAccountOpen(false)} aria-label="إغلاق الحساب"><X size={16} /></button></div>
            <div className="account-actions">
              <button type="button" onClick={openTracking}><ClipboardList size={18} /><span><strong>تتبع طلباتي</strong><small>اعرض حالة الطلب باستخدام بريدك ورقم هاتفك</small></span><ArrowLeft size={15} /></button>
              <button type="button" onClick={() => { setAccountOpen(false); setWishlistOpen(true); }}><Heart size={18} /><span><strong>المفضلة</strong><small>المنتجات التي حفظتها للعودة إليها لاحقًا</small></span><ArrowLeft size={15} /></button>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer"><FaWhatsapp size={18} /><span><strong>تواصل مع CABL</strong><small>مساعدة قبل وبعد الشراء عبر WhatsApp</small></span><ArrowLeft size={15} /></a>
            </div>
          </aside>
        </div>
      )}
      {isOffline && <div className="offline-badge" role="status" data-testid="status-offline"><WifiOff size={14} /> تعمل دون اتصال · البيانات المحفوظة متاحة</div>}
      <div
        className={`floating-tools${floatingPositions.whatsapp ? ' is-positioned' : ''}`}
        style={floatingPositions.whatsapp ? { left: floatingPositions.whatsapp.left, top: floatingPositions.whatsapp.top } : undefined}
        aria-label="مساعدة وتثبيت التطبيق"
        onPointerDown={(event) => handleFloatingPointerDown('whatsapp', event)}
        onPointerMove={(event) => handleFloatingPointerMove('whatsapp', event)}
        onPointerUp={(event) => handleFloatingPointerUp('whatsapp', event)}
        onPointerCancel={(event) => handleFloatingPointerUp('whatsapp', event)}
        onClick={(event) => preventDraggedClick('whatsapp', event)}
      >
        {!isAppInstalled && <button
          className="install-float"
          type="button"
          onClick={(event) => { preventDraggedClick('whatsapp', event); void installApp(); }}
          aria-label="تثبيت تطبيق CABL"
          title={installPrompt ? 'تثبيت تطبيق CABL' : 'إضافة CABL إلى الشاشة الرئيسية'}
          data-testid="button-install-app"
        >
          <Download size={21} aria-hidden="true" />
          <span className="sr-only">تثبيت التطبيق</span>
        </button>}
        <div
          className="whatsapp-float-wrap"
        >
          <p className="whatsapp-hint">
            {selectedProduct ? 'هل تريد شراء هذا المنتج مباشرة؟ تواصل معنا لتأكيد التفاصيل.' : 'هل تريد مساعدة في اختيار المنتجات المناسبة لك؟ تواصل معنا للشراء المباشر.'}
          </p>
          <a className="whatsapp-float" href={floatingWhatsAppUrl} target="_blank" rel="noreferrer" onClick={(event) => preventDraggedClick('whatsapp', event)} aria-label={selectedProduct ? `شراء ${selectedProduct.name} مباشرة عبر WhatsApp` : 'تواصل معنا عبر WhatsApp للمساعدة في اختيار المنتجات'} title={selectedProduct ? 'شراء مباشر عبر WhatsApp' : 'تواصل معنا عبر WhatsApp'} data-testid="button-whatsapp-float">
            <FaWhatsapp size={28} aria-hidden="true" />
            <span className="sr-only">WhatsApp</span>
          </a>
        </div>
      </div>
      {toast && <div className="toast-message" role="status" data-testid="status-toast">{toast}</div>}
    </div>
  );
}

export default App;