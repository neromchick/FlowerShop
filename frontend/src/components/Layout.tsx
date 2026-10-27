import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { ShoppingBag, User as UserIcon, Shield, LogOut, CheckCircle2 } from 'lucide-react';

export function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { itemCount, toastMessage } = useCart();

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-950 font-sans selection:bg-zinc-900 selection:text-white">
      {/* Toast Notification in Linear style */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-zinc-900 text-white text-xs px-4 py-3 rounded-lg shadow-xl border border-zinc-800 flex items-center gap-3 max-w-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-normal tracking-tight">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Sticky Header */}
      <header className="h-16 sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-zinc-200">
        <nav className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-12 flex items-center justify-between" aria-label="Main navigation">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-baseline gap-2 group">
              <span className="text-base font-semibold tracking-tight text-zinc-950 uppercase group-hover:text-zinc-700 transition-colors">
                FlowerShop
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-1 pl-4 border-l border-zinc-200">
              <Link
                to="/"
                className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                  location.pathname === '/' ? 'text-zinc-950 font-semibold' : 'text-zinc-500 hover:text-zinc-950'
                }`}
              >
                Коллекции
              </Link>
            </div>
          </div>

          {/* Right items: Cart, Auth */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Cart Button with text */}
            <Link
              to="/cart"
              className="relative px-3 py-2 rounded-md hover:bg-zinc-100 transition-colors text-zinc-900 flex items-center gap-2 text-sm font-medium"
              aria-label="Корзина"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.75]" />
              <span className="hidden sm:inline">Корзина</span>
              {itemCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-mono font-medium text-white bg-zinc-900 rounded-full">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Auth Profile / Login */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className={`p-2 rounded-md transition-colors ${
                    location.pathname === '/profile'
                      ? 'bg-zinc-100 text-zinc-950'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                  }`}
                  title={user.fullName}
                  aria-label="Личный кабинет"
                >
                  <UserIcon className="w-5 h-5 stroke-[1.75]" />
                </Link>

                {user.role === 'Admin' && (
                  <Link
                    to="/admin/categories"
                    className="p-2 rounded-md text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
                    title="Административная панель"
                    aria-label="Админка"
                  >
                    <Shield className="w-5 h-5 stroke-[1.75]" />
                  </Link>
                )}

                <button
                  onClick={logout}
                  className="p-2 rounded-md text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
                  title="Выйти"
                  aria-label="Выйти"
                >
                  <LogOut className="w-4 h-4 stroke-[1.75]" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-xs font-medium uppercase tracking-wider text-zinc-600 hover:text-zinc-950 transition-colors"
                >
                  Войти
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 text-xs font-medium tracking-tight text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors"
                >
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-12 py-8">
        <Outlet />
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-zinc-200 bg-[#F7F7F5] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold tracking-tight text-zinc-950 uppercase">
              FlowerShop
            </span>
            <span className="font-mono text-[10px] text-zinc-400">· EST. 2026</span>
          </div>
          <p className="font-mono text-xs text-zinc-400 text-center sm:text-right">
            Цветочный бутик в стиле Editorial Minimal · Свежесть каждого цветка
          </p>
        </div>
      </footer>
    </div>
  );
}
