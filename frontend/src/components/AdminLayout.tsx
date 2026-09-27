import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const adminNavLinks = [
  { path: '/admin/categories', label: 'Категории' },
  { path: '/admin/products', label: 'Товары' },
  { path: '/admin/orders', label: 'Заказы' },
];

export function AdminLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Admin navigation">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/admin/categories" className="text-xl font-bold text-pink-600 hover:text-pink-700 transition-colors">
                🌸 FlowerShop Admin
              </Link>
              <div className="hidden md:ml-8 md:flex md:space-x-4">
                {adminNavLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === link.path
                        ? 'bg-pink-50 text-pink-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Администратор: {user?.fullName}</span>
              <Link
                to="/"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                На сайт
              </Link>
              <button
                onClick={logout}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Выйти
              </button>
            </div>
          </div>
        </nav>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}