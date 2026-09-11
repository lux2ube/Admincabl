import { useStore } from '../lib/StoreContext';
import { Link } from 'wouter';
import { ShoppingBag, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createStoreOrder } from '@workspace/api-client-react';

export function Checkout() {
  const { cart, cartQuantities, formatMoney, cartTotal, clearCart, shippingOptions, paymentMethods } = useStore();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    city: 'صنعاء',
    addressLine1: '',
    shippingId: shippingOptions[0]?.id ?? 0,
    paymentMethodId: paymentMethods[0]?.id ?? 0,
    paymentReference: '',
  });

  const selectedPaymentMethod = paymentMethods.find(m => m.id === form.paymentMethodId);
  const selectedShipping = shippingOptions.find(s => s.id === form.shippingId);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      shippingId: current.shippingId || shippingOptions[0]?.id || 0,
      paymentMethodId: current.paymentMethodId || paymentMethods[0]?.id || 0,
    }));
  }, [shippingOptions, paymentMethods]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const nameParts = form.fullName.trim().split(/\s+/).filter(Boolean);
      const firstName = nameParts[0] || 'عميل';
      const lastName = nameParts.slice(1).join(' ') || 'CABL';
      const normalizedPhone = form.phoneNumber.trim();
      const orderEmail = form.email.trim() || `${normalizedPhone.replace(/[^\d]/g, '') || 'customer'}@orders.cabl.store`;

      await createStoreOrder({
        customer: {
          firstName,
          lastName,
          email: orderEmail,
          phoneNumber: normalizedPhone,
        },
        address: {
          addressLine1: form.addressLine1.trim(),
          addressLine2: null,
          postalCode: null,
          country: 'اليمن',
          city: form.city.trim(),
          phoneNumber: normalizedPhone,
        },
        items: cart.map(product => ({
          productId: product.id,
          quantity: cartQuantities[product.id] ?? 1,
        })),
        shippingId: form.shippingId,
        paymentMethodId: form.paymentMethodId,
        paymentReference: selectedPaymentMethod?.requiresTransactionReference ? form.paymentReference.trim() || null : null,
        couponCode: null,
      });

      setSubmitted(true);
      clearCart();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-[#f8f9fb] min-h-screen py-20">
        <div className="container-custom max-w-lg">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 text-center shadow-sm animate-fade-in">
            <div className="w-24 h-24 bg-green-50 text-green-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 size={48} />
            </div>
            <h1 className="font-display font-black text-3xl text-[#0a1220] mb-4">تم تأكيد طلبك بنجاح!</h1>
            <p className="text-slate-600 font-semibold mb-10 leading-relaxed text-lg">
              شكراً لتسوقك من CABL. سيقوم فريقنا بالتواصل معك قريباً لتأكيد موعد التوصيل.
            </p>
            <Link href="/" className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-[#0a1220] px-8 text-lg font-bold text-white shadow-lg transition-all active:scale-[0.98] hover:bg-blue-600 w-full">
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="bg-[#f8f9fb] min-h-screen py-24">
        <div className="container-custom text-center max-w-md mx-auto">
          <div className="w-24 h-24 bg-white shadow-sm rounded-full flex items-center justify-center text-slate-300 mx-auto mb-6">
            <ShoppingBag size={40} />
          </div>
          <h1 className="font-display font-black text-3xl text-[#0a1220] mb-4">عربة التسوق فارغة</h1>
          <p className="text-slate-500 font-semibold mb-8">لم تقم بإضافة أي منتجات لإتمام الطلب.</p>
          <Link href="/" className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-8 text-base font-bold text-slate-700 transition-all active:scale-[0.98] hover:border-slate-300 hover:bg-slate-50 hover:text-[#0a1220]">
            تصفح المنتجات
          </Link>
        </div>
      </div>
    );
  }

  const shippingCost = selectedShipping?.free ? 0 : (selectedShipping?.charge ?? 0);
  const total = cartTotal + shippingCost;

  return (
    <div className="bg-[#f8f9fb] min-h-screen py-12 md:py-16">
      <div className="container-custom max-w-6xl">
        <h1 className="font-display font-black text-3xl md:text-4xl text-[#0a1220] mb-8 md:mb-12 text-center">إتمام الطلب</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl font-bold text-sm mb-8 text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-10 shadow-sm">
            <h2 className="font-display font-bold text-xl text-[#0a1220] mb-8">معلومات الشحن</h2>
            
            <form id="checkout-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700">الاسم الكامل</label>
                <input required value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} type="text" className="w-full border border-slate-200 rounded-2xl px-5 py-4 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-colors font-semibold" placeholder="الاسم" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">رقم الهاتف</label>
                <input required value={form.phoneNumber} onChange={e => setForm({...form, phoneNumber: e.target.value})} type="tel" className="w-full border border-slate-200 rounded-2xl px-5 py-4 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-colors font-semibold" placeholder="77X XXX XXX" dir="ltr" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">البريد الإلكتروني <span className="text-slate-400 font-normal">(اختياري)</span></label>
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} type="email" className="w-full border border-slate-200 rounded-2xl px-5 py-4 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-colors font-semibold" placeholder="email@example.com" dir="ltr" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700">المدينة</label>
                <select value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full border border-slate-200 rounded-2xl px-5 py-4 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-colors font-bold text-slate-700 cursor-pointer">
                  <option>صنعاء</option>
                  <option>عدن</option>
                  <option>تعز</option>
                  <option>إب</option>
                  <option>أخرى</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700">العنوان التفصيلي</label>
                <textarea required value={form.addressLine1} onChange={e => setForm({...form, addressLine1: e.target.value})} rows={2} className="w-full border border-slate-200 rounded-2xl px-5 py-4 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-colors font-semibold" placeholder="الشارع، الحي، أقرب مَعلَم"></textarea>
              </div>

              <div className="space-y-4 md:col-span-2 mt-6 pt-8 border-t border-slate-100">
                <h3 className="font-display font-bold text-lg text-[#0a1220]">طريقة الشحن</h3>
                <div className="grid gap-3">
                  {shippingOptions.map(option => (
                    <label key={option.id} className={`flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition-colors ${form.shippingId === option.id ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" name="shippingId" value={option.id} checked={form.shippingId === option.id} onChange={() => setForm({...form, shippingId: option.id})} className="w-5 h-5 text-blue-600 focus:ring-blue-500" />
                      <div className="flex-1">
                        <span className="block font-bold text-[#0a1220]">{option.name}</span>
                        {option.estimatedDays && <span className="block text-xs font-semibold text-slate-500 mt-1">{option.estimatedDays} أيام</span>}
                      </div>
                      <span className="font-black text-blue-600 bg-white px-3 py-1 rounded-lg border border-blue-100">{option.free ? 'مجاني' : formatMoney(option.charge)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-4 md:col-span-2 mt-6 pt-8 border-t border-slate-100">
                <h3 className="font-display font-bold text-lg text-[#0a1220]">طريقة الدفع</h3>
                <div className="grid gap-3">
                  {paymentMethods.map(method => (
                    <label key={method.id} className={`flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition-colors ${form.paymentMethodId === method.id ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" name="paymentMethodId" value={method.id} checked={form.paymentMethodId === method.id} onChange={() => setForm({...form, paymentMethodId: method.id, paymentReference: ''})} className="w-5 h-5 text-blue-600 focus:ring-blue-500" />
                      <div className="flex-1">
                        <span className="block font-bold text-[#0a1220]">{method.name}</span>
                      </div>
                    </label>
                  ))}
                </div>

                {selectedPaymentMethod?.requiresTransactionReference && (
                  <div className="mt-4 bg-slate-50 p-6 border border-slate-200 rounded-2xl animate-fade-in">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">رقم الحوالة / المرجع</label>
                      <input required value={form.paymentReference} onChange={e => setForm({...form, paymentReference: e.target.value})} type="text" className="w-full border border-slate-300 rounded-xl px-5 py-3 bg-white focus:border-blue-500 outline-none transition-colors font-bold" placeholder="أدخل رقم الحوالة" />
                    </div>
                    {selectedPaymentMethod.instructions && (
                      <p className="mt-4 text-xs text-slate-500 font-semibold leading-relaxed whitespace-pre-wrap bg-white p-4 rounded-xl border border-slate-100">{selectedPaymentMethod.instructions}</p>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-10 shadow-sm sticky top-24">
              <h2 className="font-display font-bold text-xl text-[#0a1220] mb-6">ملخص الطلب</h2>
              
              <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                {cart.map(product => {
                  const quantity = cartQuantities[product.id] ?? 1;
                  return (
                    <div key={product.id} className="flex gap-4 items-center p-3 rounded-2xl border border-slate-100 bg-slate-50">
                      <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center p-2 border border-slate-100 flex-shrink-0">
                        <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-[#0a1220] line-clamp-2 mb-1">{product.name}</h4>
                        <span className="text-xs text-blue-600 font-black">{quantity} × {formatMoney(product.price)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-4 mb-8">
                <div className="flex justify-between text-slate-500 font-bold text-sm">
                  <span>المجموع الفرعي</span>
                  <span className="text-[#0a1220]">{formatMoney(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-bold text-sm">
                  <span>الشحن</span>
                  <span className="text-[#0a1220]">{shippingCost === 0 ? 'مجاني' : formatMoney(shippingCost)}</span>
                </div>
                <div className="flex justify-between text-[#0a1220] font-black text-xl pt-4 border-t border-slate-100">
                  <span>الإجمالي</span>
                  <span>{formatMoney(total)}</span>
                </div>
              </div>

              <button 
                type="submit" 
                form="checkout-form"
                disabled={isSubmitting || !form.shippingId || !form.paymentMethodId}
                className="w-full bg-[#0a1220] text-white font-bold py-5 rounded-2xl flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg active:scale-[0.98] text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'جاري التأكيد...' : 'تأكيد الطلب'}
              </button>
              
              <div className="mt-8 p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-3 text-blue-900 text-xs font-bold leading-relaxed">
                <ShieldCheck size={20} className="text-blue-600 flex-shrink-0" />
                <span>المنتجات أصلية وتخضع لسياسة الضمان والاسترجاع. يتم تأكيد طلبك قبل الشحن.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}