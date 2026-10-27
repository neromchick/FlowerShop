import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { AlertCircle } from 'lucide-react';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, googleLogin } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 8) {
      setError('Пароль должен содержать не менее 8 символов.');
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      navigate('/');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (idToken: string) => {
    setError('');
    setLoading(true);
    try {
      await googleLogin(idToken);
      navigate('/');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Ошибка регистрации через Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="bg-[#F7F7F5] border border-zinc-200/80 rounded-lg p-8 shadow-xs">
        <div className="text-center mb-6">
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            Новый клиент
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-950 mt-1">
            Создать аккаунт
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5 rounded-md mb-5 flex items-center gap-2" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign-in */}
        <div className="mb-5">
          <GoogleSignInButton
            text="signup_with"
            onSuccess={handleGoogleSuccess}
            onError={(msg) => setError(msg)}
          />

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-mono">
              <span className="bg-[#F7F7F5] px-3 text-zinc-400">или заполните форму</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="fullName" className="block text-xs font-medium text-zinc-700 mb-1">
              Полное имя
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              autoComplete="name"
              placeholder="Анна Смирнова"
              className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-zinc-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              placeholder="name@example.com"
              className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
            />
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1">
              <label htmlFor="password" className="block text-xs font-medium text-zinc-700">
                Пароль
              </label>
              <span className="font-mono text-[10px] text-zinc-400">мин. 8 символов</span>
            </div>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="••••••••"
              className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs font-medium text-zinc-700 mb-1">
              Телефон (необязательно)
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+7 (999) 000-00-00"
              className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 mt-2 text-xs font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Создание аккаунта...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-zinc-950 font-medium hover:underline underline-offset-4">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
