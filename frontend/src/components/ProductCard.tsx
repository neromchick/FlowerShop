import type { ProductListItem } from '../types';
import { Plus } from 'lucide-react';

interface ProductCardProps {
  product: ProductListItem;
  onAddToCart: (product: ProductListItem) => void;
  inStock: boolean;
}

export function ProductCard({ product, onAddToCart, inStock }: ProductCardProps) {
  const imageUrl = product.imageUrl
    ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${product.imageUrl}`
    : 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80';

  return (
    <article className="flex flex-col group">
      {/* Photo Container: aspect-[4/5] */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-[#F7F7F5] border border-zinc-200/80">
        <img
          src={imageUrl}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {!inStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-700 bg-white px-3 py-1 rounded border border-zinc-300">
              Лист ожидания
            </span>
          </div>
        )}

        {/* Category micro-tag */}
        <div className="absolute top-2.5 left-2.5">
          <span className="font-mono text-[10px] uppercase tracking-wider bg-white/90 backdrop-blur-sm text-zinc-600 px-2 py-0.5 rounded border border-zinc-200/60 shadow-xs">
            {product.categoryName || 'Букет'}
          </span>
        </div>
      </div>

      {/* Info Block below photo */}
      <div className="pt-3 flex flex-col gap-1.5 flex-1">
        {/* Title */}
        <h3 className="text-sm font-medium text-zinc-950 truncate" title={product.title}>
          {product.title}
        </h3>

        {/* Micro-badges: height, freshness */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="bg-zinc-100 text-zinc-600 font-mono text-[11px] px-1.5 py-0.5 rounded">
            Высота ~45 см
          </span>
          <span className="bg-zinc-100 text-[#2E3A2F] font-mono text-[11px] px-1.5 py-0.5 rounded">
            Свежий срез
          </span>
        </div>

        {/* Price and quick action */}
        <div className="flex items-center justify-between pt-1.5 mt-auto">
          <div className="flex items-baseline gap-1">
            <span className="text-base font-semibold text-zinc-950 font-mono">
              {product.price.toLocaleString('ru-RU')}
            </span>
            <span className="text-xs text-zinc-500 font-mono">₽</span>
          </div>

          <button
            onClick={() => onAddToCart(product)}
            disabled={!inStock}
            className="w-9 h-9 rounded-md border border-zinc-200 flex items-center justify-center text-zinc-900 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Добавить в корзину"
            aria-label={`Добавить в корзину ${product.title}`}
          >
            <Plus className="w-4 h-4 stroke-[2]" />
          </button>
        </div>
      </div>
    </article>
  );
}
