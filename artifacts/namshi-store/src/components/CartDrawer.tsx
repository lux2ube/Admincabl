import { useEffect } from 'react';
import { useStore } from '../lib/StoreContext';
import { X, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

export function CartDrawer() {
  const { cart, cartQuantities, addToCart, removeFromCart, cartOpen, setCartOpen, formatMoney, cartTotal } = useStore();
  useEffect(() => {
    if (!cartOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCartOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cartOpen, setCartOpen]);

  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setCartOpen(false)}></div>
      <div role="dialog" aria-modal="true" aria-label="سلة المشتريات" className="relative w-full max-w-[420px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
        
        <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <h2 className="font-display font-black text-2xl text-[#0a1220] flex items-center gap-3">
            سلة المشتريات
            <span className="bg-slate-100 text-slate-600 text-sm py-1 px-3 rounded-full font-bold">{cart.length}</span>
          </h2>
          <button aria-label="إغلاق السلة" onClick={() => setCartOpen(false)} className="touch-target bg-slate-50 text-slate-500 rounded-full hover:bg-slate-100 hover:text-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 md:p-6 flex flex-col gap-4 bg-[#f8f9fb]">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 h-full text-center">
              <div className="w-24 h-24 bg-white shadow-sm rounded-full flex items-center justify-center text-slate-300 mb-6">
                <ShoppingBag size={40} />
              </div>
              <h3 className="font-display font-bold text-xl text-[#0a1220] mb-2">السلة فارغة</h3>
              <p className="text-slate-500 font-semibold text-sm max-w-[220px]">
                لم تقم بإضافة أي منتجات إلى السلة بعد.
              </p>
              <button 
                onClick={() => setCartOpen(false)}
                className="mt-8 cab-btn-secondary bg-white px-8 py-3 rounded-full font-bold text-slate-700 hover:text-blue-600 border border-slate-200 transition-colors"
              >
                العودة للتسوق
              </button>
            </div>
          ) : (
            cart.map(product => {
              const quantity = cartQuantities[product.id] ?? 1;
              return (
                <div key={product.id} className="flex gap-4 p-4 bg-white border border-slate-200 rounded-3xl relative group hover:border-blue-200 transition-colors shadow-sm">
                  <div className="w-24 h-24 bg-[#f8f9fb] rounded-2xl overflow-hidden border border-slate-100 flex-shrink-0 flex items-center justify-center p-3">
                    <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div className="flex flex-col flex-1 py-1">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1.5">{product.brand}</span>
                    <h4 className="font-display font-bold text-sm text-[#0a1220] line-clamp-2 mb-3 leading-snug">{product.name}</h4>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="font-display font-black text-lg text-[#0a1220]">{formatMoney(product.price * quantity)}</span>
                      
                      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
                        <button 
                          onClick={() => addToCart(product, quantity + 1)}
                          aria-label={`زيادة كمية ${product.name}`}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-[#0a1220] hover:bg-white rounded-lg shadow-sm"
                          disabled={quantity >= Math.min(product.quantity, 99)}
                        >
                          <Plus size={14} />
                        </button>
                        <span className="font-bold text-sm w-6 text-center">{quantity}</span>
                        <button 
                          onClick={() => removeFromCart(product.id)}
                          aria-label={quantity > 1 ? `تقليل كمية ${product.name}` : `إزالة ${product.name} من السلة`}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-red-600 hover:bg-white rounded-lg shadow-sm"
                        >
                          {quantity > 1 ? <Minus size={14} /> : <X size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-5 md:p-6 border-t border-slate-200 bg-white shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-end mb-6">
              <span className="font-bold text-slate-500 text-sm">المجموع الفرعي</span>
              <span className="font-display font-black text-2xl text-[#0a1220]">{formatMoney(cartTotal)}</span>
            </div>
            <Link 
              href="/checkout"
              onClick={() => setCartOpen(false)}
              className="w-full bg-[#0a1220] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors shadow-lg active:scale-[0.98] text-lg"
            >
              إتمام الطلب <ArrowRight size={20} className="rotate-180" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}