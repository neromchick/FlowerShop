import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { orderApi, authApi } from '../api';
import type { CreateOrderRequest } from '../types';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, clearCart, isLoaded, total } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [callRecipientFirst, setCallRecipientFirst] = useState(false);

  const [formData, setFormData] = useState<CreateOrderRequest>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deliveryAddress: '',
    items: [],
    recipientName: '',
    recipientPhone: '',
    greetingCardText: '',
  });

  useEffect(() => {
    if (user) {
      authApi.getProfile().then(({ data }) => {
        setFormData((prev) => ({
          ...prev,
          customerName: data.fullName,
          customerPhone: data.phone || '',
          customerEmail: data.email,
        }));
      }).catch(() => {});
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError('Корзина пуста');
      return;
    }

    setSubmitting(true);

    const payload: CreateOrderRequest = {
      ...formData,
      deliveryAddress: callRecipientFirst
        ? `[Уточнить адрес у получателя по звонку] ${formData.deliveryAddress || ''}`.trim()
        : formData.deliveryAddress,
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    };

    try {
      const { data } = await orderApi.createOrder(payload);
      await clearCart();
      navigate(`/checkout/success/${data.id}`);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Ошибка при оформлении заказа');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-24 border border-zinc-200 rounded-lg bg-[#F7F7F5]/50 max-w-md mx-auto">
        <h2 className="text-base font-semibold text-zinc-950 mb-1">Корзина пуста</h2>
        <p className="text-xs font-mono text-zinc-500 mb-6">
          Перед оформлением заказа выберите букет в каталоге
        </p>
        <Link
          to="/"
          className="px-5 py-2 text-xs font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors"
        >
          Перейти в каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-zinc-200/80 pb-6 flex items-baseline justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link to="/cart" className="flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-zinc-400 hover:text-zinc-700">
              <ArrowLeft className="w-3 h-3" />
              <span>Корзина</span>
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="font-mono text-xs text-[#2E3A2F]">Оформление доставки</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950">
            Детали заказа
          </h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-md" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10" noValidate>
        {/* Left Columns (Form) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Customer Contacts */}
          <div className="bg-[#F7F7F5] border border-zinc-200/80 rounded-lg p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-950 font-mono pb-2 border-b border-zinc-200">
              1. Данные заказчика
            </h2>

            <div className="space-y-3">
              <div>
                <label htmlFor="customerName" className="block text-xs font-medium text-zinc-700 mb-1">
                  Ваше имя <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                  placeholder="Константин"
                  className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="customerPhone" className="block text-xs font-medium text-zinc-700 mb-1">
                    Телефон <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    id="customerPhone"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    required
                    placeholder="+7 (999) 000-00-00"
                    className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>

                <div>
                  <label htmlFor="customerEmail" className="block text-xs font-medium text-zinc-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="customerEmail"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Delivery & Recipient */}
          <div className="bg-[#F7F7F5] border border-zinc-200/80 rounded-lg p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-950 font-mono pb-2 border-b border-zinc-200">
              2. Доставка & Получатель
            </h2>

            {/* Toggle: Don't know exact address */}
            <label className="flex items-center gap-2.5 cursor-pointer bg-white p-3 rounded-md border border-zinc-200">
              <input
                type="checkbox"
                checked={callRecipientFirst}
                onChange={(e) => setCallRecipientFirst(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              />
              <span className="text-xs text-zinc-800">
                Не знаю точный адрес — уточнить у получателя по звонку
              </span>
            </label>

            {!callRecipientFirst && (
              <div>
                <label htmlFor="deliveryAddress" className="block text-xs font-medium text-zinc-700 mb-1">
                  Адрес доставки <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="deliveryAddress"
                  name="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={handleChange}
                  required={!callRecipientFirst}
                  rows={2}
                  placeholder="Город, улица, дом, квартира / офис"
                  className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label htmlFor="recipientName" className="block text-xs font-medium text-zinc-700 mb-1">
                  Имя получателя (если это подарок)
                </label>
                <input
                  type="text"
                  id="recipientName"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleChange}
                  placeholder="Елена"
                  className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label htmlFor="recipientPhone" className="block text-xs font-medium text-zinc-700 mb-1">
                  Телефон получателя
                </label>
                <input
                  type="tel"
                  id="recipientPhone"
                  name="recipientPhone"
                  value={formData.recipientPhone}
                  onChange={handleChange}
                  placeholder="+7 (999) 000-00-00"
                  className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
            </div>

            {/* Free Postcard Textarea */}
            <div>
              <label htmlFor="greetingCardText" className="block text-xs font-medium text-zinc-700 mb-1">
                + Текст для бесплатной открытки
              </label>
              <textarea
                id="greetingCardText"
                name="greetingCardText"
                value={formData.greetingCardText}
                onChange={handleChange}
                rows={2}
                placeholder="С днем рождения! Пусть каждый день будет наполнен радостью..."
                className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400"
              />
            </div>
          </div>
        </div>

        {/* Right Columns (Order summary & action) */}
        <div className="lg:col-span-5">
          <div className="bg-[#F7F7F5] border border-zinc-200/80 rounded-lg p-6 sticky top-24 space-y-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-950 font-mono pb-2 border-b border-zinc-200">
              Состав заказа ({items.length})
            </h2>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between items-center text-xs">
                  <div className="max-w-[200px] truncate">
                    <span className="font-medium text-zinc-950 block truncate">{item.title}</span>
                    <span className="font-mono text-zinc-500 text-[11px]">
                      {item.quantity} × {item.price?.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-zinc-950">
                    {((item.price || 0) * item.quantity).toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-zinc-200 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>Доставка</span>
                <span className="font-mono text-[#2E3A2F]">0 ₽ (курьером)</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Подкормка Кризал</span>
                <span className="font-mono text-[#2E3A2F]">Бесплатно</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-zinc-200">
                <span className="text-sm font-semibold text-zinc-950">К оплате</span>
                <span className="text-xl font-bold font-mono text-zinc-950">
                  {total.toLocaleString('ru-RU')} ₽
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs rounded-md transition-colors disabled:opacity-50"
            >
              {submitting ? 'Оформление заказа...' : `Подтвердить заказ на ${total.toLocaleString('ru-RU')} ₽`}
            </button>

            {/* Trust badge */}
            <div className="pt-2 text-[11px] font-mono text-zinc-500 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[#2E3A2F]">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Фото букета перед отправкой в мессенджер</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-500">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>100% гарантия свежести цветов</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
