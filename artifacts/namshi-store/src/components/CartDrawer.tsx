import { useStore } from '../lib/StoreContext';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Link } from 'wouter';

export function CartDrawer() {
  const { cart, cartQuantities, addToCart, removeFromCart, cartOpen, setCartOpen, formatMoney, cartTotal } = useStore();

  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setCartOpen(false)}></div>
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
        
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-display font-extrabold text-xl text-slate-900 flex items-center gap-2">
            <ShoppingBag size={20} className="text-blue-600" />
            سلة المشتريات
          </h2>
          <button onClick={() => setCartOpen(false)} className="p-2 bg-slate-50 text-slate-500 rounded-full hover:bg-slate-100 hover:text-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 h-full text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                <ShoppingBag size={32} />
              </div>
              <h3 className="font-display font-bold text-lg text-slate-800 mb-2">السلة فارغة</h3>
              <p className="text-slate-500 font-semibold text-sm max-w-[200px]">
                لم تقم بإضافة أي منتجات إلى السلة بعد.
              </p>
              <button 
                onClick={() => setCartOpen(false)}
                className="mt-6 font-bold text-blue-600 hover:text-blue-800 underline underline-offset-4"
              >
                العودة للتسوق
              </button>
            </div>
          ) : (
            cart.map(product => {
              const quantity = cartQuantities[product.id] ?? 1;
              return (
                <div key={product.id} className="flex gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl relative group">
                  <div className="w-20 h-20 bg-white rounded-xl overflow-hidden border border-slate-100 flex-shrink-0 flex items-center justify-center p-2">
                    <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{product.brand}</span>
                    <h4 className="font-display font-bold text-sm text-slate-800 line-clamp-2 mb-2 leading-snug">{product.name}</h4>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="font-bold text-blue-600">{formatMoney(product.price * quantity)}</span>
                      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-1">
                        <button 
                          onClick={() => addToCart(product, quantity + 1)} 
                          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded"
                          disabled={quantity >= Math.min(product.quantity, 99)}
                        >
                          <Plus size={14} />
                        </button>
                        <span className="font-bold text-xs w-4 text-center">{quantity}</span>
                        <button 
                          onClick={() => removeFromCart(product.id)} 
                          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-red-600 hover:bg-slate-50 rounded"
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
          <div className="p-5 border-t border-slate-100 bg-white">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-slate-600">المجموع الفرعي:</span>
              <span className="font-display font-extrabold text-xl text-slate-900">{formatMoney(cartTotal)}</span>
            </div>
            <Link 
              href="/checkout"
              onClick={() => setCartOpen(false)}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
            >
              إتمام الطلب
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
