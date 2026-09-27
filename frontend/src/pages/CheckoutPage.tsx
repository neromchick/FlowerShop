import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi, cartApi, authApi } from '../api';
import type { CreateOrderRequest, CartItem } from '../types';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { items: localItems, clearCart, isLoaded } = useCart();
  const [serverItems, setServerItems] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isLoggedIn = !!user;

  const [formData, setFormData] = useState<CreateOrderRequest>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deliveryAddress: '',
    items: [],
  });

  useEffect(() => {
    if (isLoaded && !authLoading) {
      if (isLoggedIn) {
        loadServerCart();
        loadProfile();
      } else {
        prepareLocalItems();
      }
    }
  }, [isLoaded, authLoading, isLoggedIn]);

  const loadServerCart = async () => {
    try {
      const { data } = await cartApi.getCart();
      setServerItems(data);
      prepareServerItems(data);
    } catch {
      setError('Не удалось загрузить корзину');
    }
  };

  const loadProfile = async () => {
    try {
      const { data } = await authApi.getProfile();
      setFormData((prev) => ({
        ...prev,
        customerName: data.fullName,
        customerPhone: data.phone || '',
        customerEmail: data.email,
      }));
    } catch {}
  };

  const prepareLocalItems = () => {
    const items = localItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));
    setFormData((prev) => ({ ...prev, items }));
  };

  const prepareServerItems = (items: CartItem[]) => {
    const orderItems = items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));
    setFormData((prev) => ({ ...prev, items: orderItems }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const { data } = await orderApi.createOrder(formData);
      if (isLoggedIn) {
        await cartApi.clearCart();
      } else {
        clearCart();
      }
      navigate(`/checkout/success/${data.id}`);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Ошибка при оформлении заказа');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded || (isLoggedIn && serverItems.length === 0)) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
      </div>
    );
  }

  const items = isLoggedIn ? serverItems : localItems;
  const isEmpty = items.length === 0;

  if (isEmpty) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">Корзина пуста</h1>
        <p className="mt-2 text-gray-500">Добавьте товары перед оформлением заказа.</p>
      </div>
    );
  }

  const subtotal = items.reduce((sum, item) => {
    const serverItem = serverItems.find((si) => si.productId === item.productId);
    const price = serverItem?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Оформление заказа</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Контактная информация</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                Имя <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
            <div>
              <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                Телефон <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="customerPhone"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleChange}
                required
                placeholder="+7 (XXX) XXX-XX-XX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="customerEmail"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Адрес доставки</h2>
          <div>
            <label htmlFor="deliveryAddress" className="block text-sm font-medium text-gray-700 mb-1">
              Адрес <span className="text-red-500">*</span>
            </label>
            <textarea
              id="deliveryAddress"
              name="deliveryAddress"
              value={formData.deliveryAddress}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Город, улица, дом, квартира, подъезд, этаж..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Состав заказа</h2>
          <div className="space-y-3">
            {items.map((item) => {
              const serverItem = serverItems.find((si) => si.productId === item.productId);
              const title = serverItem?.title || `Товар #${item.productId}`;
              const price = serverItem?.price || 0;
              const lineTotal = price * item.quantity;
              return (
                <div key={item.productId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    {serverItem?.imageUrl && (
                      <img
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${serverItem.imageUrl}`}
                        alt={title}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{title}</p>
                      <p className="text-sm text-gray-500">{item.quantity} × {price.toLocaleString('ru-RU')} ₽</p>
                    </div>
                  </div>
                  <span className="font-medium text-gray-900">{lineTotal.toLocaleString('ru-RU')} ₽</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-lg font-bold">
            <span>Итого</span>
            <span>{subtotal.toLocaleString('ru-RU')} ₽</span>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 text-white bg-pink-600 rounded-lg font-medium hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Оформление...' : `Оплатить ${subtotal.toLocaleString('ru-RU')} ₽`}
          </button>
        </div>
      </form>
    </div>
  );
}