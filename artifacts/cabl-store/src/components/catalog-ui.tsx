import { Link } from 'wouter';
import { Heart, ShoppingBag, ArrowUpLeft, Star, Plus, Minus, Trash2 } from 'lucide-react';
import type { StoreProduct } from '@workspace/api-client-react';
import { useStore } from '@/lib/store';

export function ProductCard({ product, compact = false }: { product: StoreProduct; compact?: boolean }) {
  const { formatPrice, favorites, toggleFavorite, addToCart } = useStore();
  const price = product.discountPrice ?? product.regularPrice;
  const discount = product.discountPrice ? Math.round((1 - product.discountPrice / product.regularPrice) * 100) : 0;
  return <article className={`product-card ${compact ? 'compact' : ''} reveal`} data-testid={`card-product-${product.id}`}>
    <div className="product-visual"><Link href={`/product/${product.slug}`} data-testid={`link-product-${product.id}`}><img src={product.images?.[0]} alt={product.productName} loading="lazy" data-testid={`img-product-${product.id}`}/></Link>{discount > 0 && <span className="discount-badge">-{discount}%</span>}<button className={`favorite-toggle ${favorites.includes(product.id) ? 'is-favorite' : ''}`} onClick={() => toggleFavorite(product.id)} aria-label="إضافة للمفضلة" data-testid={`button-favorite-${product.id}`}><Heart size={17} fill={favorites.includes(product.id) ? 'currentColor' : 'none'}/></button><Link href={`/product/${product.slug}`} className="quick-view" data-testid={`link-quick-view-${product.id}`}>التفاصيل <ArrowUpLeft size={15}/></Link></div>
    <div className="product-copy"><span className="product-brand">{product.brand}</span><Link href={`/product/${product.slug}`} className="product-title" data-testid={`text-product-name-${product.id}`}>{product.productName}</Link>{product.shortDescription && <p>{product.shortDescription}</p>}<div className="product-meta"><div><strong data-testid={`text-price-${product.id}`}>{formatPrice(price)}</strong>{product.discountPrice && <del>{formatPrice(product.regularPrice)}</del>}</div><button className="add-button" onClick={() => addToCart(product.id)} disabled={product.quantity < 1} data-testid={`button-add-cart-${product.id}`}><ShoppingBag size={16}/><span>{product.quantity > 0 ? 'أضف للسلة' : 'نفد'}</span></button></div></div>
  </article>;
}

export function ProductGrid({ products, empty = 'لا توجد منتجات مطابقة حالياً.' }: { products: StoreProduct[]; empty?: string }) {
  return products.length ? <div className="product-grid">{products.map((product) => <ProductCard product={product} key={product.id}/>)}</div> : <div className="empty-state"><div className="empty-icon"><ShoppingBag size={28}/></div><h3>{empty}</h3><p>جرّب تغيير الفلاتر أو العودة لكل المنتجات.</p><Link href="/search" className="button button-primary" data-testid="link-empty-search">استعرض الكتالوج</Link></div>;
}

export function QuantityControl({ value, onChange, testId }: { value: number; onChange: (value: number) => void; testId: string }) {
  return <div className="quantity-control" data-testid={testId}><button onClick={() => onChange(value - 1)} aria-label="إنقاص الكمية" data-testid={`${testId}-decrease`}><Minus size={14}/></button><span>{value}</span><button onClick={() => onChange(value + 1)} aria-label="زيادة الكمية" data-testid={`${testId}-increase`}><Plus size={14}/></button></div>;
}

export function CartLine({ product, quantity }: { product: StoreProduct; quantity: number }) {
  const { formatPrice, updateCart, removeFromCart } = useStore();
  return <div className="cart-line" data-testid={`row-cart-${product.id}`}><img src={product.images?.[0]} alt={product.productName}/><div className="cart-line-copy"><Link href={`/product/${product.slug}`} data-testid={`link-cart-product-${product.id}`}>{product.productName}</Link><span>{product.brand}</span><strong>{formatPrice((product.discountPrice ?? product.regularPrice) * quantity)}</strong></div><QuantityControl value={quantity} onChange={(value) => updateCart(product.id, value)} testId={`quantity-${product.id}`}/><button className="remove-button" onClick={() => removeFromCart(product.id)} aria-label="حذف المنتج" data-testid={`button-remove-${product.id}`}><Trash2 size={17}/></button></div>;
}

export function RatingLine() { return <div className="rating-line" aria-label="تقييم المنتج"><span className="stars"><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14}/></span><span>اختيار موثوق من مجتمع CABL</span></div>; }