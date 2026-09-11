import { useStore } from '@/lib/StoreContext';
import { Link } from 'wouter';
import { ShoppingBag, ShieldCheck, CheckCircle2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCreateStoreOrder } from '@workspace/api-client-react';
import type { StoreOrder } from '@workspace/api-client-react';

export default function Checkout() {
  const { cart, cartQuantities, formatMoney, cartTotal, clearCart, shippingOptions, paymentMethods, updateQuantity } = useStore();
  const [submittedOrder, setSubmittedOrder] = useState<StoreOrder | null>(null);
  const [error, setError] = useState('');
  
  const createOrder = useCreateStoreOrder();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    city: 'صنعاء',
    addressLine1: '',
    shippingId: 0,
    paymentMethodId: 0,
    paymentReference: '',
  });

  useEffect(() => {
    setForm(current => ({
      ...current,
      shippingId: current.shippingId || shippingOptions[0]?.id || 0,
      paymentMethodId: current.paymentMethodId || paymentMethods[0]?.id || 0,
    }));
  }, [shippingOptions, paymentMethods]);

  const selectedPaymentMethod = paymentMethods.find(m => m.id === form.paymentMethodId);
  const selectedShipping = shippingOptions.find(s => s.id === form.shippingId);
  const calculateShippingCost = (shippingId: number) => cart.reduce((sum, product) => {
    const rule = product.shippingOptions.find(option => option.id === shippingId);
    if (!rule || rule.free) return sum;
    return sum + rule.charge * (cartQuantities[product.id] ?? 1);
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const nameParts = form.fullName.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || 'عميل';
    const lastName = nameParts.slice(1).join(' ') || 'CABL';
    const normalizedPhone = form.phoneNumber.trim();
    const orderEmail = form.email.trim() || `${normalizedPhone.replace(/[^\d]/g, '') || 'customer'}@orders.cabl.store`;

    createOrder.mutate({
      data: {
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
      }
    }, {
      onSuccess: (order) => {
        setSubmittedOrder(order);
        clearCart();
      },
      onError: (err: any) => {
        setError(err.message || 'حدث خطأ أثناء تأكيد الطلب. حاول مرة أخرى.');
      }
    });
  };

  if (submittedOrder) {
    return (
      <div className="bg-muted/10 min-h-[80vh] flex items-center justify-center py-20">
        <div className="container mx-auto px-4 max-w-lg">
          <div className="bg-card border rounded-[2.5rem] p-10 text-center shadow-lg animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h1 className="text-3xl font-black mb-4">تم تأكيد طلبك بنجاح!</h1>
            <p className="text-muted-foreground font-bold mb-10 leading-relaxed text-lg">
              تم تسجيل الطلب رقم {submittedOrder.id} بإجمالي {formatMoney(submittedOrder.total)} وحالة {submittedOrder.status}.
            </p>
            <Link href="/" className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-primary px-8 text-lg font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:-translate-y-1 w-full">
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="bg-background min-h-[70vh] flex items-center justify-center py-20">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-32 h-32 bg-muted rounded-[2.5rem] flex items-center justify-center text-muted-foreground mx-auto mb-8 shadow-sm">
            <ShoppingBag className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-black mb-4">عربة التسوق فارغة</h1>
          <p className="text-muted-foreground font-bold mb-8 text-lg">لم تقم بإضافة أي منتجات لإتمام الطلب.</p>
          <Link href="/" className="inline-flex h-14 items-center justify-center rounded-2xl bg-primary px-8 text-base font-bold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all">
            تصفح المنتجات
          </Link>
        </div>
      </div>
    );
  }

  const shippingCost = calculateShippingCost(form.shippingId);
  const total = cartTotal + shippingCost;

  return (
    <div className="bg-muted/10 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl md:text-4xl font-black mb-8 md:mb-12">إتمام الطلب</h1>

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-6 py-4 rounded-2xl font-bold text-sm mb-8">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-7 bg-card border rounded-[2.5rem] p-6 md:p-10 shadow-sm">
            <h2 className="text-xl font-black mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">1</span>
              معلومات الشحن
            </h2>
            
            <form id="checkout-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold">الاسم الكامل</label>
                <input required value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} type="text" className="w-full border rounded-2xl px-5 py-4 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold" placeholder="الاسم" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">رقم الهاتف</label>
                <input required value={form.phoneNumber} onChange={e => setForm({...form, phoneNumber: e.target.value})} type="tel" className="w-full border rounded-2xl px-5 py-4 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-left" placeholder="77X XXX XXX" dir="ltr" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">البريد الإلكتروني <span className="text-muted-foreground font-normal">(اختياري)</span></label>
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} type="email" className="w-full border rounded-2xl px-5 py-4 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-left" placeholder="email@example.com" dir="ltr" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold">المدينة</label>
                <select value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full border rounded-2xl px-5 py-4 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold cursor-pointer">
                  <option>صنعاء</option>
                  <option>عدن</option>
                  <option>تعز</option>
                  <option>إب</option>
                  <option>أخرى</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold">العنوان التفصيلي</label>
                <textarea required value={form.addressLine1} onChange={e => setForm({...form, addressLine1: e.target.value})} rows={2} className="w-full border rounded-2xl px-5 py-4 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold resize-none" placeholder="الشارع، الحي، أقرب مَعلَم"></textarea>
              </div>

              <div className="space-y-4 md:col-span-2 mt-8 pt-8 border-t">
                <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">2</span>
                  طريقة الشحن
                </h3>
                <div className="grid gap-3">
                  {shippingOptions.map(option => (
                    <label key={option.id} className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all ${form.shippingId === option.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}>
                      <input type="radio" name="shippingId" value={option.id} checked={form.shippingId === option.id} onChange={() => setForm({...form, shippingId: option.id})} className="w-5 h-5 text-primary focus:ring-primary" />
                      <div className="flex-1">
                        <span className="block font-black">{option.name}</span>
                        {option.estimatedDays && <span className="block text-xs font-bold text-muted-foreground mt-1">يصل خلال {option.estimatedDays} أيام</span>}
                      </div>
                      <span className="font-black text-primary bg-background px-3 py-1 rounded-lg border shadow-sm">
                        {calculateShippingCost(option.id) === 0 ? 'مجاني' : formatMoney(calculateShippingCost(option.id))}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-4 md:col-span-2 mt-8 pt-8 border-t">
                <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">3</span>
                  طريقة الدفع
                </h3>
                <div className="grid gap-3">
                  {paymentMethods.map(method => (
                    <label key={method.id} className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all ${form.paymentMethodId === method.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}>
                      <input type="radio" name="paymentMethodId" value={method.id} checked={form.paymentMethodId === method.id} onChange={() => setForm({...form, paymentMethodId: method.id, paymentReference: ''})} className="w-5 h-5 text-primary focus:ring-primary" />
                      <div className="flex-1">
                        <span className="block font-black">{method.name}</span>
                        {method.description && <span className="block text-xs font-bold text-muted-foreground mt-1">{method.description}</span>}
                      </div>
                    </label>
                  ))}
                </div>

                {selectedPaymentMethod?.requiresTransactionReference && (
                  <div className="mt-4 bg-muted/30 p-6 border rounded-2xl animate-in fade-in slide-in-from-top-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold">رقم الحوالة / المرجع</label>
                      <input required value={form.paymentReference} onChange={e => setForm({...form, paymentReference: e.target.value})} type="text" className="w-full border rounded-xl px-5 py-3 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-left" placeholder="أدخل رقم المرجع هنا" dir="ltr" />
                    </div>
                    {selectedPaymentMethod.instructions && (
                      <p className="mt-4 text-sm text-primary font-bold leading-relaxed whitespace-pre-wrap bg-primary/10 p-4 rounded-xl">{selectedPaymentMethod.instructions}</p>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-card border rounded-[2.5rem] p-6 md:p-10 shadow-sm sticky top-24">
              <h2 className="text-xl font-black mb-6">ملخص الطلب</h2>
              
              <div className="space-y-4 mb-8 max-h-[40vh] overflow-y-auto pr-2 scrollbar-hide">
                {cart.map(product => {
                  const quantity = cartQuantities[product.id] ?? 1;
                  const price = product.discountPrice ?? product.regularPrice;
                  return (
                    <div key={product.id} className="flex gap-4 items-center p-3 rounded-2xl border bg-background group">
                      <div className="w-20 h-20 bg-muted/50 rounded-xl flex items-center justify-center p-2 flex-shrink-0">
                        <img src={product.images[0]} alt={product.productName} className="w-full h-full object-contain mix-blend-multiply" />
                      </div>
                      <div className="flex-1 py-1">
                        <h4 className="text-sm font-bold line-clamp-2 mb-2 leading-snug">{product.productName}</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-primary font-black">{formatMoney(price)}</span>
                          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                            <button type="button" onClick={() => updateQuantity(product.id, quantity - 1)} className="w-6 h-6 flex items-center justify-center bg-background rounded shadow-sm text-sm font-bold hover:text-destructive">-</button>
                            <span className="text-xs font-black w-4 text-center">{quantity}</span>
                            <button type="button" onClick={() => updateQuantity(product.id, Math.min(product.quantity, quantity + 1))} className="w-6 h-6 flex items-center justify-center bg-background rounded shadow-sm text-sm font-bold hover:text-primary">+</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t pt-6 space-y-4 mb-8">
                <div className="flex justify-between text-muted-foreground font-bold text-sm">
                  <span>المجموع الفرعي ({cart.length} منتجات)</span>
                  <span className="text-foreground">{formatMoney(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground font-bold text-sm">
                  <span>رسوم الشحن</span>
                  <span className="text-foreground">{shippingCost === 0 ? 'مجاني' : formatMoney(shippingCost)}</span>
                </div>
                <div className="flex justify-between text-foreground font-black text-2xl pt-4 border-t">
                  <span>الإجمالي</span>
                  <span className="text-primary">{formatMoney(total)}</span>
                </div>
              </div>

              <button 
                type="submit" 
                form="checkout-form"
                disabled={createOrder.isPending || !form.shippingId || !form.paymentMethodId}
                className="w-full bg-primary text-primary-foreground font-black py-5 rounded-2xl flex items-center justify-center hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25 hover:-translate-y-1 text-lg disabled:opacity-50 disabled:pointer-events-none"
              >
                {createOrder.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    جاري التأكيد...
                  </span>
                ) : 'تأكيد الطلب'}
              </button>
              
              <div className="mt-6 p-4 bg-muted/50 rounded-2xl flex gap-3 text-muted-foreground text-xs font-bold leading-relaxed items-center">
                <ShieldCheck className="w-8 h-8 text-primary flex-shrink-0" />
                <span>راجع المنتجات وخيار الشحن وطريقة الدفع قبل تأكيد الطلب.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
