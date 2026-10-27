import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';

export function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, isLoaded, total } = useCart();

  const isEmpty = items.length === 0;

  if (!isLoaded) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-zinc-200/80 pb-6 flex items-baseline justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">Корзина</span>
            <span className="text-zinc-300">/</span>
            <span className="font-mono text-xs text-[#2E3A2F]">Ваш заказ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950">
            Выбранные букеты
          </h1>
        </div>

        {!isEmpty && (
          <button
            onClick={() => clearCart()}
            className="text-xs text-zinc-500 hover:text-zinc-900 underline underline-offset-4 transition-colors"
          >
            Очистить корзину
          </button>
        )}
      </div>

      {isEmpty ? (
        <div className="text-center py-24 border border-zinc-200 rounded-lg bg-[#F7F7F5]/50 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-4 text-zinc-400">
            <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
          </div>
          <h2 className="text-base font-medium text-zinc-900 mb-1">Ваша корзина пуста</h2>
          <p className="text-xs font-mono text-zinc-500 mb-6">
            Выберите авторский букет или монокомпозицию из нашего каталога
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors"
          >
            <span>В каталог</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Items List (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {items.map((item) => {
              const imageUrl = item.imageUrl
                ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${item.imageUrl}`
                : 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=400&q=80';

              const maxStock = item.stockQuantity > 0 ? item.stockQuantity : 99;
              const lineTotal = (item.price || 0) * item.quantity;

              return (
                <div
                  key={item.productId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-[#F7F7F5] border border-zinc-200/80 gap-4"
                >
                  {/* Photo & Title */}
                  <div className="flex items-center gap-4">
                    <img
                      src={imageUrl}
                      alt={item.title}
                      className="w-18 h-22 sm:w-20 sm:h-24 object-cover rounded-md bg-white border border-zinc-200/60 shrink-0"
                    />
                    <div>
                      <h3 className="text-sm font-medium text-zinc-950 mb-1">{item.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                        <span>{item.price?.toLocaleString('ru-RU')} ₽ / шт.</span>
                        {item.stockQuantity <= 5 && item.stockQuantity > 0 && (
                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">
                            Осталось {item.stockQuantity} шт.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Controls & Price */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-0 border-zinc-200">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-zinc-300 rounded-md bg-white">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-zinc-950 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Уменьшить количество"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-mono font-medium text-zinc-950">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= maxStock}
                        className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-zinc-950 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Увеличить количество"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="text-right min-w-[80px]">
                      <span className="font-mono text-sm font-semibold text-zinc-950">
                        {lineTotal.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-1.5 text-zinc-400 hover:text-red-700 transition-colors"
                      title="Удалить"
                      aria-label="Удалить позицию"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary (4 cols) */}
          <div className="lg:col-span-4">
            <div className="bg-[#F7F7F5] border border-zinc-200/80 rounded-lg p-6 sticky top-24 space-y-6">
              <h2 className="text-base font-semibold text-zinc-950 tracking-tight pb-3 border-b border-zinc-200">
                Сводка заказа
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Стоимость букетов</span>
                  <span className="font-mono font-medium text-zinc-950">
                    {total.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Доставка курьером</span>
                  <span className="font-mono text-[#2E3A2F] font-medium">Бесплатно</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Подкормка Кризал + открытка</span>
                  <span className="font-mono text-[#2E3A2F] font-medium">0 ₽ (в подарок)</span>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200 flex justify-between items-baseline">
                <span className="text-sm font-semibold text-zinc-950">Итого к оплате</span>
                <span className="text-xl font-bold font-mono text-zinc-950">
                  {total.toLocaleString('ru-RU')} ₽
                </span>
              </div>

              <Link
                to="/checkout"
                className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs tracking-tight rounded-md flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <span>Оформить доставку</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="pt-2 text-center">
                <p className="text-[11px] font-mono text-zinc-400">
                  ● Пришлем реальное фото букета до выезда курьера
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
