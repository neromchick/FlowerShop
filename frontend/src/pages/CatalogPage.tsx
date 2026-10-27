import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { catalogApi } from '../api';
import type { Category, ProductListItem, ProductQuery } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Pagination } from '../components/Pagination';
import { useCart } from '../contexts/CartContext';
import { Search, X } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Свежие коллекции' },
  { value: 'price_asc', label: 'По возрастанию цены' },
  { value: 'price_desc', label: 'По убыванию цены' },
];

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const { addItem } = useCart();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const categoryId = searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!, 10) : undefined;
  const search = searchParams.get('search') || undefined;
  const sort = searchParams.get('sort') || 'newest';

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await catalogApi.getCategories();
      setCategories(data);
    } catch {
      setError('Не удалось загрузить категории');
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query: ProductQuery = {
        page,
        pageSize: 12,
        categoryId,
        search,
        sort,
      };
      const { data } = await catalogApi.getProducts(query);
      setProducts(data.items);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch {
      setError('Не удалось загрузить товары');
      setProducts([]);
      setTotalPages(0);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, categoryId, search, sort]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleFilterChange = (key: string, value: string | number | undefined) => {
    const params = new URLSearchParams(searchParams);
    if (value === undefined || value === '' || (typeof value === 'number' && value === 0)) {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange('search', searchInput.trim() || undefined);
  };

  const clearSearch = () => {
    setSearchInput('');
    handleFilterChange('search', undefined);
  };

  return (
    <div className="space-y-8">
      {/* Editorial Hero Intro */}
      <div className="border-b border-zinc-200/80 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">Каталог</span>
            <span className="text-zinc-300">/</span>
            <span className="font-mono text-xs text-[#2E3A2F]">Сезонная поставка</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950">
            Авторские букеты & композиции
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Поиск букета..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-[#F7F7F5] hover:bg-zinc-100 focus:bg-white border border-zinc-200 rounded-md pl-9 pr-8 py-1.5 text-xs font-normal w-48 sm:w-60 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
            />
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2.5 text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Sort Selector */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="bg-[#F7F7F5] hover:bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer transition-colors"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Category Pills (Horizontal scrollable row) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => handleFilterChange('categoryId', undefined)}
          className={`px-4 py-1.5 rounded-full text-xs transition-colors shrink-0 ${
            categoryId === undefined
              ? 'bg-zinc-900 text-white font-medium'
              : 'bg-[#F7F7F5] hover:bg-zinc-200 text-zinc-700'
          }`}
        >
          Все букеты
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleFilterChange('categoryId', cat.id)}
            className={`px-4 py-1.5 rounded-full text-xs transition-colors shrink-0 ${
              categoryId === cat.id
                ? 'bg-zinc-900 text-white font-medium'
                : 'bg-[#F7F7F5] hover:bg-zinc-200 text-zinc-700'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Error notification */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-md" role="alert">
          {error}
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="aspect-[4/5] rounded-lg bg-[#F7F7F5] animate-pulse" />
              <div className="h-4 bg-zinc-100 rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-zinc-100 rounded w-1/2 animate-pulse" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 border border-zinc-200 rounded-lg bg-[#F7F7F5]/50">
          <p className="text-zinc-600 text-sm font-medium mb-1">Ничего не найдено</p>
          <p className="text-zinc-400 text-xs font-mono">
            Попробуйте сбросить фильтры или изменить поисковый запрос
          </p>
          {(categoryId !== undefined || search) && (
            <button
              onClick={() => {
                setSearchInput('');
                setSearchParams(new URLSearchParams());
              }}
              className="mt-4 px-4 py-1.5 text-xs text-zinc-900 border border-zinc-300 rounded-md hover:bg-zinc-100 transition-colors"
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>НАЙДЕНО: {totalCount} ПОЗИЦИЙ</span>
            <span>СТРАНИЦА {page} ИЗ {totalPages}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={(prod) => addItem(prod)}
                inStock={product.stockQuantity > 0}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pt-8 border-t border-zinc-200">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => handleFilterChange('page', p)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
