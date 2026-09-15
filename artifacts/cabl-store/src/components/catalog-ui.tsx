import { useState } from 'react';
import { Link } from 'wouter';
import { Heart, ShoppingBag, ArrowUpLeft, Plus, Minus, Trash2, Package, Scale } from 'lucide-react';
import type { StoreProduct } from '@workspace/api-client-react';
import { useStore } from '@/lib/store';
import { productPath } from '@/lib/store-routes';

export function ProductCard({ product, compact = false, compareSelected = false, onToggleCompare }: { product: StoreProduct; compact?: boolean; compareSelected?: boolean; onToggleCompare?: (productId: string) => void }) {
  const { formatPrice, favorites, toggleFavorite, addToCart } = useStore();
  const [added, setAdded] = useState(false);
  const price = product.discountPrice ?? product.regularPrice;
  const discount = product.discountPrice !== null && product.discountPrice < product.regularPrice
    ? Math.round((1 - product.discountPrice / product.regularPrice) * 100)
    : 0;
  const handleAddToCart = () => {
    addToCart(product.id);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };
  return <article className={`product-card ${compact ? 'compact' : ''} reveal`} data-testid={`card-product-${product.id}`}>
    <div className="product-visual"><Link href={productPath(product)} data-testid={`link-product-${product.id}`}><CatalogProductImage product={product}/></Link>{discount > 0 && <span className="discount-badge">-{discount}%</span>}<button className={`favorite-toggle ${favorites.includes(product.id) ? 'is-favorite' : ''}`} onClick={() => toggleFavorite(product.id)} aria-label={favorites.includes(product.id) ? 'إزالة من المفضلة' : 'إضافة للمفضلة'} title={favorites.includes(product.id) ? 'إزالة من المفضلة' : 'إضافة للمفضلة'} data-testid={`button-favorite-${product.id}`}><Heart size={17} fill={favorites.includes(product.id) ? 'currentColor' : 'none'}/></button>{onToggleCompare && <button className={`compare-toggle ${compareSelected ? 'is-selected' : ''}`} onClick={() => onToggleCompare(product.id)} aria-pressed={compareSelected} data-testid={`button-compare-${product.id}`}><Scale size={14}/><span>{compareSelected ? 'مضاف' : 'قارن'}</span></button>}<Link href={productPath(product)} className="quick-view" data-testid={`link-quick-view-${product.id}`}>التفاصيل <ArrowUpLeft size={15}/></Link></div>
    <div className="product-copy"><span className="product-brand">{product.brand}</span><Link href={productPath(product)} className="product-title" data-testid={`text-product-name-${product.id}`}>{product.productName}</Link>{product.shortDescription && <p>{product.shortDescription}</p>}<div className="product-decision-meta"><span className={`product-stock ${product.quantity > 0 ? 'is-available' : 'is-unavailable'}`}><i />{product.quantity > 0 ? 'متوفر' : 'غير متوفر'}</span>{product.productNote && <span className="product-note" title={product.productNote}>{product.productNote}</span>}</div><div className="product-meta"><div><strong data-testid={`text-price-${product.id}`}>{formatPrice(price)}</strong>{discount > 0 && <del>{formatPrice(product.regularPrice)}</del>}</div><button className={`add-button${added ? ' is-success' : ''}`} onClick={handleAddToCart} disabled={product.quantity < 1} aria-live="polite" data-testid={`button-add-cart-${product.id}`}><ShoppingBag size={16}/><span>{added ? 'تمت الإضافة' : product.quantity > 0 ? 'أضف للسلة' : 'نفد'}</span></button></div></div>
  </article>;
}

function CatalogProductImage({ product }: { product: StoreProduct }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = product.images?.[0];
  if (!image || imageFailed) {
    return <span className="catalog-image-fallback" role="img" aria-label={product.productName}><Package size={42} /></span>;
  }
  return <img src={image} alt={product.productName} loading="lazy" onError={() => setImageFailed(true)} data-testid={`img-product-${product.id}`} />;
}

export function ProductGrid({ products, empty = 'لا توجد منتجات مطابقة حالياً.', compareIds, onToggleCompare }: { products: StoreProduct[]; empty?: string; compareIds?: string[]; onToggleCompare?: (productId: string) => void }) {
  return products.length ? <div className="product-grid">{products.map((product) => <ProductCard product={product} key={product.id} compareSelected={compareIds?.includes(product.id)} onToggleCompare={onToggleCompare}/>)}</div> : <div className="empty-state"><div className="empty-icon"><ShoppingBag size={28}/></div><h3>{empty}</h3><p>جرّب تغيير الفلاتر أو العودة لكل المنتجات.</p><Link href="/search" className="button button-primary" data-testid="link-empty-search">استعرض الكتالوج</Link></div>;
}

export function QuantityControl({ value, onChange, testId }: { value: number; onChange: (value: number) => void; testId: string }) {
  return <div className="quantity-control" data-testid={testId}><button onClick={() => onChange(value - 1)} aria-label="إنقاص الكمية" data-testid={`${testId}-decrease`}><Minus size={14}/></button><span>{value}</span><button onClick={() => onChange(value + 1)} aria-label="زيادة الكمية" data-testid={`${testId}-increase`}><Plus size={14}/></button></div>;
}

export function CartLine({ product, quantity }: { product: StoreProduct; quantity: number }) {
  const { formatPrice, updateCart, removeFromCart } = useStore();
  const image = product.images?.[0];
  return <article className="cart-line" data-testid={`row-cart-${product.id}`}>
    <Link className="cart-line-visual" href={productPath(product)} data-testid={`link-cart-product-${product.id}`}>
      {image ? <img src={image} alt={product.productName}/> : <span className="catalog-image-fallback" role="img" aria-label={product.productName}><Package size={34}/></span>}
      <span>في السلة</span>
    </Link>
    <div className="cart-line-copy">
      <span className="cart-line-brand">{product.brand}</span>
      <Link href={productPath(product)} data-testid={`link-cart-product-name-${product.id}`}>{product.productName}</Link>
      <div className="cart-line-price"><strong>{formatPrice((product.discountPrice ?? product.regularPrice) * quantity)}</strong><small>{formatPrice(product.discountPrice ?? product.regularPrice)} للقطعة</small></div>
    </div>
    <div className="cart-line-actions">
      <QuantityControl value={quantity} onChange={(value) => updateCart(product.id, value)} testId={`quantity-${product.id}`}/>
      <button className="remove-button" onClick={() => removeFromCart(product.id)} aria-label={`حذف ${product.productName} من السلة`} data-testid={`button-remove-${product.id}`}><Trash2 size={16}/><span>حذف</span></button>
    </div>
  </article>;
}
