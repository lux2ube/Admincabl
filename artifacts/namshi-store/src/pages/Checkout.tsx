import { useStore } from '../lib/StoreContext';
import { Link } from 'wouter';
import { ShoppingBag, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
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
      <div className="bg-slate-50 min-h-screen py-20">
        <div className="container-custom max-w-lg">
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-sm animate-fade-in">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h1 className="font-display font-extrabold text-3xl text-slate-900 mb-4">تم تأكيد طلبك بنجاح!</h1>
            <p className="text-slate-600 font-semibold mb-8 leading-relaxed">
              شكراً لتسوقك من CABL. سيقوم فريقنا بالتواصل معك قريباً لتأكيد موعد التوصيل.
            </p>
            <Link href="/" className="inline-block bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-colors">
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="bg-slate-50 min-h-screen py-20">
        <div className="container-custom text-center">
          <h1 className="font-display font-bold text-3xl text-slate-900 mb-4">عربة التسوق فارغة</h1>
          <Link href="/" className="text-blue-600 font-bold hover:underline">تصفح المنتجات</Link>
        </div>
      </div>
    );
  }

  const shippingCost = selectedShipping?.free ? 0 : (selectedShipping?.charge ?? 0);
  const total = cartTotal + shippingCost;

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container-custom">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-slate-500 hover:text-blue-600"><ArrowRight size={24} /></Link>
          <h1 className="font-display font-extrabold text-3xl text-slate-900">إتمام الطلب</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-semibold text-sm mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <h2 className="font-display font-bold text-xl text-slate-900 mb-6">بيانات التوصيل</h2>
            
            <form id="checkout-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700">الاسم الكامل</label>
                <input required value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} type="text" className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-colors" placeholder="الاسم" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">رقم الهاتف</label>
                <input required value={form.phoneNumber} onChange={e => setForm({...form, phoneNumber: e.target.value})} type="tel" className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-colors" placeholder="77X XXX XXX" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">البريد الإلكتروني (اختياري)</label>
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} type="email" className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-colors" placeholder="email@example.com" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700">المدينة</label>
                <select value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-colors">
                  <option>صنعاء</option>
                  <option>عدن</option>
                  <option>تعز</option>
                  <option>إب</option>
                  <option>أخرى</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700">العنوان التفصيلي</label>
                <textarea required value={form.addressLine1} onChange={e => setForm({...form, addressLine1: e.target.value})} rows={2} className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-colors" placeholder="الشارع، الحي، أقرب مَعلَم"></textarea>
              </div>

              <div className="space-y-4 md:col-span-2 mt-4 pt-6 border-t border-slate-100">
                <h3 className="font-display font-bold text-lg text-slate-900">طريقة الشحن</h3>
                {shippingOptions.map(option => (
                  <label key={option.id} className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                    <input type="radio" name="shippingId" value={option.id} checked={form.shippingId === option.id} onChange={() => setForm({...form, shippingId: option.id})} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                    <div className="flex-1">
                      <span className="block font-bold text-sm text-slate-900">{option.name}</span>
                      {option.estimatedDays && <span className="block text-xs text-slate-500 mt-1">{option.estimatedDays} أيام</span>}
                    </div>
                    <span className="font-bold text-blue-600">{option.free ? 'مجاني' : formatMoney(option.charge)}</span>
                  </label>
                ))}
              </div>

              <div className="space-y-4 md:col-span-2 mt-4 pt-6 border-t border-slate-100">
                <h3 className="font-display font-bold text-lg text-slate-900">طريقة الدفع</h3>
                {paymentMethods.map(method => (
                  <label key={method.id} className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                    <input type="radio" name="paymentMethodId" value={method.id} checked={form.paymentMethodId === method.id} onChange={() => setForm({...form, paymentMethodId: method.id, paymentReference: ''})} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                    <div className="flex-1">
                      <span className="block font-bold text-sm text-slate-900">{method.name}</span>
                    </div>
                  </label>
                ))}

                {selectedPaymentMethod?.requiresTransactionReference && (
                  <div className="mt-4 bg-slate-50 p-4 border border-slate-200 rounded-xl animate-fade-in">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">رقم الحوالة / المرجع</label>
                      <input required value={form.paymentReference} onChange={e => setForm({...form, paymentReference: e.target.value})} type="text" className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white focus:border-blue-500 outline-none transition-colors" placeholder="أدخل رقم الحوالة" />
                    </div>
                    {selectedPaymentMethod.instructions && (
                      <p className="mt-3 text-xs text-slate-600 font-semibold leading-relaxed whitespace-pre-wrap">{selectedPaymentMethod.instructions}</p>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>

          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="font-display font-bold text-lg text-slate-900 mb-6 flex items-center gap-2">
              <ShoppingBag size={20} className="text-blue-600" /> ملخص الطلب
            </h3>
            
            <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
              {cart.map(product => {
                const quantity = cartQuantities[product.id] ?? 1;
                return (
                  <div key={product.id} className="flex gap-4 items-center">
                    <img src={product.image} alt={product.name} className="w-16 h-16 object-contain bg-slate-50 rounded-lg p-1 border border-slate-100" />
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{product.name}</h4>
                      <span className="text-xs text-slate-500 font-semibold">{quantity} × {formatMoney(product.price)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3 mb-6">
              <div className="flex justify-between text-slate-600 font-semibold text-sm">
                <span>المجموع الفرعي</span>
                <span>{formatMoney(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-semibold text-sm">
                <span>الشحن</span>
                <span>{shippingCost === 0 ? 'مجاني' : formatMoney(shippingCost)}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-extrabold text-lg pt-3 border-t border-slate-100">
                <span>الإجمالي</span>
                <span>{formatMoney(total)}</span>
              </div>
            </div>

            <button 
              type="submit" 
              form="checkout-form"
              disabled={isSubmitting || !form.shippingId || !form.paymentMethodId}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'جاري التأكيد...' : 'تأكيد الطلب'}
            </button>
            
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 flex gap-3 text-slate-600 text-xs font-semibold leading-relaxed">
              <ShieldCheck size={20} className="text-blue-600 flex-shrink-0" />
              <span>المنتجات أصلية وتخضع لسياسة الضمان والاسترجاع. يتم تأكيد طلبك قبل الشحن.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
