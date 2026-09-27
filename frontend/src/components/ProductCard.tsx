import { Link } from 'react-router-dom';
import type { ProductListItem } from '../types';

interface ProductCardProps {
  product: ProductListItem;
  onAddToCart: (productId: number) => void;
  inStock: boolean;
}

export function ProductCard({ product, onAddToCart, inStock }: ProductCardProps) {
  const imageUrl = product.imageUrl
    ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${product.imageUrl}`
    : 'https://via.placeholder.com/300x200?text=No+Image';

  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
      <Link to={`/product/${product.id}`} className="block aspect-[4/3] relative">
        <img
          src={imageUrl}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />
        {!inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              Нет в наличии
            </span>
          </div>
        )}
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[2.5rem]">
          <Link to={`/product/${product.id}`} className="hover:text-pink-600 transition-colors">
            {product.title}
          </Link>
        </h3>
        <p className="text-sm text-gray-500 mb-2 line-clamp-2 flex-1">{product.description || 'Описание отсутствует'}</p>
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-lg font-bold text-pink-600">{product.price.toLocaleString('ru-RU')} ₽</span>
          <button
            onClick={() => onAddToCart(product.id)}
            disabled={!inStock}
            className="px-3 py-1.5 text-sm font-medium text-white bg-pink-600 rounded-lg hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-500 transition-colors"
          >
            В корзину
          </button>
        </div>
      </div>
    </article>
  );
}