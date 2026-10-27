import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../api';
import type { OrderSummary, OrderDetail } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { User, Phone, Mail, Edit3, Check, X, Package, Shield, Calendar, MapPin } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  New: 'Новый',
  Processing: 'В обработке',
  Shipped: 'В пути',
  Delivered: 'Доставлен',
  Cancelled: 'Отменён',
};

const STATUS_CLASSES: Record<string, string> = {
  New: 'bg-zinc-100 text-zinc-800 border-zinc-200',
  Processing: 'bg-amber-50 text-amber-800 border-amber-200',
  Shipped: 'bg-blue-50 text-blue-800 border-blue-200',
  Delivered: 'bg-[#2E3A2F]/10 text-[#2E3A2F] border-[#2E3A2F]/20',
  Cancelled: 'bg-zinc-100 text-zinc-400 border-zinc-200 line-through',
};

export function ProfilePage() {
  const { user, refreshUser, updateProfile } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadOrders();
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      setEditFullName(user.fullName || '');
      setEditPhone(user.phone || '');
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      const { data } = await orderApi.getMyOrders();
      setOrders(data);
    } catch {
      setError('Не удалось загрузить историю заказов');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = () => {
    setEditFullName(user?.fullName || '');
    setEditPhone(user?.phone || '');
    setIsEditing(true);
    setSaveSuccess(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim()) return;

    setSaveLoading(true);
    setError(null);
    try {
      await updateProfile({
        fullName: editFullName.trim(),
        phone: editPhone.trim() || undefined,
      });
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError('Ошибка при сохранении профиля');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleViewOrder = async (orderId: number) => {
    try {
      const { data } = await orderApi.getMyOrder(orderId);
      if (data) setSelectedOrder(data);
    } catch {
      setError('Не удалось загрузить детали заказа');
    }
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
  };

  return (
    <div className="space-y-8">
      {/* Page Title & User Header */}
      <div className="border-b border-zinc-200/80 pb-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">Кабинет</span>
            <span className="text-zinc-300">/</span>
            <span className="font-mono text-xs text-[#2E3A2F]">Управление профилем</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950">
            {user?.fullName || 'Личный профиль'}
          </h1>
        </div>

        {/* Note: Customer badge is hidden completely per requirement #7. Only Admin badge is shown if user is Admin */}
        {user?.role === 'Admin' && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 text-white rounded-md text-xs font-mono">
            <Shield className="w-3.5 h-3.5" />
            <span>Администратор</span>
          </div>
        )}
      </div>

      {saveSuccess && (
        <div className="bg-[#2E3A2F]/10 border border-[#2E3A2F]/20 text-[#2E3A2F] text-xs px-4 py-2.5 rounded-md flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Данные профиля успешно обновлены</span>
        </div>
      )}

      {/* Profile Info Card (with Edit capability) */}
      <div className="bg-[#F7F7F5] border border-zinc-200/80 rounded-lg p-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 mb-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-950 font-mono">
            Данные клиента
          </h2>

          {!isEditing && (
            <button
              onClick={handleStartEdit}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-700 hover:text-zinc-950 font-medium px-2.5 py-1 rounded border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Редактировать</span>
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Полное имя
              </label>
              <input
                type="text"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Телефон
              </label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+7 (XXX) XXX-XX-XX"
                className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={saveLoading}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
              >
                {saveLoading ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 text-xs text-zinc-600 hover:text-zinc-900 border border-zinc-200 rounded-md bg-white hover:bg-zinc-50 transition-colors"
              >
                Отмена
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-zinc-400 font-mono uppercase text-[10px] block">Имя</span>
                <p className="font-medium text-zinc-950 mt-0.5">{user?.fullName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-zinc-400 font-mono uppercase text-[10px] block">Email</span>
                <p className="font-medium text-zinc-950 mt-0.5">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-zinc-400 font-mono uppercase text-[10px] block">Телефон</span>
                <p className="font-medium text-zinc-950 mt-0.5">{user?.phone || 'Не указан'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Orders Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-950 font-mono">
          История доставок
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-md" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-18 bg-[#F7F7F5] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 border border-zinc-200 rounded-lg bg-[#F7F7F5]/50 flex flex-col items-center">
            <Package className="w-8 h-8 text-zinc-300 mb-2 stroke-[1.5]" />
            <p className="text-sm font-medium text-zinc-800">У вас пока нет оформленных заказов</p>
            <p className="text-xs font-mono text-zinc-400 mt-1 mb-4">
              Выберите букет в каталоге, и мы быстро доставим его получателю
            </p>
            <Link
              to="/"
              className="px-4 py-2 bg-zinc-900 text-white text-xs rounded-md hover:bg-zinc-800 transition-colors"
            >
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#F7F7F5] border-b border-zinc-200 text-zinc-500 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3 text-left">Заказ</th>
                    <th className="px-4 py-3 text-left">Дата</th>
                    <th className="px-4 py-3 text-left">Статус</th>
                    <th className="px-4 py-3 text-left">Сумма</th>
                    <th className="px-4 py-3 text-left">Адрес</th>
                    <th className="px-4 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/80">
                  {orders.map((order) => {
                    const statusClass = STATUS_CLASSES[order.status] || 'bg-zinc-100 text-zinc-800';
                    const statusLabel = STATUS_LABELS[order.status] || order.status;

                    return (
                      <tr key={order.id} className="hover:bg-[#F7F7F5]/60 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-medium text-zinc-950">
                          #{order.id}
                        </td>
                        <td className="px-4 py-3.5 text-zinc-600 font-mono">
                          {new Date(order.orderDate).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono border ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono font-semibold text-zinc-950">
                          {order.totalAmount.toLocaleString('ru-RU')} ₽
                        </td>
                        <td className="px-4 py-3.5 text-zinc-600 max-w-[200px] truncate" title={order.deliveryAddress}>
                          {order.deliveryAddress}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => handleViewOrder(order.id)}
                            className="text-zinc-600 hover:text-zinc-950 font-medium underline underline-offset-4"
                          >
                            Детали
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-zinc-200 max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
              <div>
                <span className="font-mono text-xs text-zinc-400 uppercase">Спецификация заказа</span>
                <h3 className="text-base font-semibold text-zinc-950 font-mono">
                  #{selectedOrder.id} · {STATUS_LABELS[selectedOrder.status] || selectedOrder.status}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700"
                aria-label="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-zinc-600">
                <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>{selectedOrder.deliveryAddress}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-600">
                <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="font-mono">
                  {new Date(selectedOrder.orderDate).toLocaleString('ru-RU')}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="border border-zinc-200 rounded-md divide-y divide-zinc-200 bg-[#F7F7F5]/50">
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-zinc-950 block">{item.productTitleSnapshot}</span>
                    <span className="font-mono text-zinc-500 text-[11px]">
                      {item.quantity} шт. × {item.unitPrice.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-zinc-950">
                    {item.lineTotal.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-between items-baseline border-t border-zinc-200">
              <span className="text-xs font-semibold text-zinc-950 uppercase font-mono">Итого</span>
              <span className="text-lg font-bold font-mono text-zinc-950">
                {selectedOrder.totalAmount.toLocaleString('ru-RU')} ₽
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
