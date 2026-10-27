import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, ArrowLeft, LogOut } from 'lucide-react';

const adminNavLinks = [
  { path: '/admin/categories', label: 'Категории' },
  { path: '/admin/products', label: 'Товары' },
  { path: '/admin/orders', label: 'Заказы' },
];

export function AdminLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-950 font-sans">
      <header className="h-16 sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-zinc-200">
        <nav className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-12 flex items-center justify-between" aria-label="Admin navigation">
          <div className="flex items-center gap-6">
            <Link to="/admin/categories" className="flex items-baseline gap-2">
              <span className="text-base font-semibold tracking-tight text-zinc-950 uppercase">
                FlowerShop
              </span>
              <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#2E3A2F]" />
                ADMIN
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-1 pl-4 border-l border-zinc-200">
              {adminNavLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider rounded-md transition-colors ${
                    location.pathname === link.path
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-zinc-400 hidden sm:inline">
              {user?.fullName}
            </span>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-700 hover:text-zinc-950 border border-zinc-200 rounded-md bg-[#F7F7F5] hover:bg-zinc-100 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>В магазин</span>
            </Link>

            <button
              onClick={logout}
              className="p-1.5 text-zinc-400 hover:text-zinc-950 transition-colors"
              title="Выйти"
              aria-label="Выйти"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-12 py-8">
        <Outlet />
      </main>
    </div>
  );
}
