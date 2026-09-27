import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cartApi } from '../api';
import type { CartItem, CartLine } from '../types';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const { items: localItems, updateQuantity, removeItem, clearCart, isLoaded } = useCart();
  const [serverItems, setServerItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = !!user;

  useEffect(() => {
    if (isLoaded && !authLoading) {
      if (isLoggedIn) {
        loadServerCart();
      } else {
        setLoading(false);
      }
    }
  }, [isLoaded, authLoading, isLoggedIn]);

  const loadServerCart = async () => {
    try {
      const { data } = await cartApi.getCart();
      setServerItems(data);
    } catch {
      setError('Не удалось загрузить корзину');
    } finally {
      setLoading(false);
    }
  };

  const getItems = () => (isLoggedIn ? serverItems : localItems);
  const getItemDetails = (item: CartLine | CartItem) => {
    if ('title' in item) return item;
    const serverItem = serverItems.find((si) => si.productId === item.productId);
    return serverItem || { ...item, title: '', price: 0, stockQuantity: 0 };
  };

  const items = getItems();
  const isEmpty = items.length === 0;

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    if (isLoggedIn) {
      const item = serverItems.find((si) => si.productId === productId);
      if (item && quantity <= item.stockQuantity) {
        updateQuantity(productId, quantity);
      }
    } else {
      updateQuantity(productId, quantity);
    }
  };

  const handleRemove = (productId: number) => {
    if (isLoggedIn) {
      removeItem(productId);
      loadServerCart();
    } else {
      removeItem(productId);
    }
  };

  const handleClear = () => {
    if (isLoggedIn) {
      cartApi.clearCart().then(() => loadServerCart());
    } else {
      clearCart();
    }
  };

  const subtotal = items.reduce((sum, item) => {
    const details = getItemDetails(item);
    return sum + details.price * item.quantity;
  }, 0);

  if (!isLoaded || (isLoggedIn && loading)) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Корзина</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
          {error}
        </div>
      )}

      {isEmpty ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h2 className="mt-2 text-lg font-medium text-gray-900">Корзина пуста</h2>
          <p className="mt-1 text-gray-500">Добавьте товары из каталога, чтобы оформить заказ.</p>
          <Link to="/" className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors">
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Товар</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Цена</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Количество</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => {
                    const details = getItemDetails(item);
                    const lineTotal = details.price * item.quantity;
                    const inStock = details.stockQuantity >= item.quantity;

                    return (
                      <tr key={item.productId} className={!inStock ? 'bg-red-50' : ''}>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={details.imageUrl
                                ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${details.imageUrl}`
                                : 'https://via.placeholder.com/60x60?text=No+Image'}
                              alt={details.title}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div>
                              <Link to={`/product/${item.productId}`} className="font-medium text-gray-900 hover:text-pink-600">
                                {details.title}
                              </Link>
                              {!inStock && (
                                <p className="text-sm text-red-600">Доступно: {details.stockQuantity} шт.</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-900">
                          {details.price.toLocaleString('ru-RU')} ₽
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                              disabled={item.quantity <= 1 || !inStock}
                              className="p-1.5 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Уменьшить количество"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="w-10 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                              disabled={!inStock || item.quantity >= details.stockQuantity}
                              className="p-1.5 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Увеличить количество"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-medium text-gray-900">
                          {lineTotal.toLocaleString('ru-RU')} ₽
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => handleRemove(item.productId)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Итого</h2>
              {items.length > 1 && (
                <button
                  onClick={handleClear}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Очистить корзину
                </button>
              )}
            </div>
            <div className="space-y-2 text-gray-700">
              <div className="flex justify-between">
                <span>Подытог</span>
                <span>{subtotal.toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Доставка</span>
                <span>Рассчитывается при оформлении</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-bold text-gray-900">
                <span>Итого</span>
                <span>{subtotal.toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
            <Link
              to="/checkout"
              className="mt-6 w-full py-3 px-4 text-center text-white bg-pink-600 rounded-lg font-medium hover:bg-pink-700 transition-colors inline-block"
            >
              Оформить заказ
            </Link>
          </div>
        </>
      )}
    </div>
  );
}