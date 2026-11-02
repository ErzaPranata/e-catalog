import { Link } from 'react-router-dom';
import { ShoppingCartIcon, TagIcon } from '@heroicons/react/24/outline';
import { ProductListItem } from '@/types';
import { formatCurrency } from '@/utils/helpers';
import { cn } from '@/utils/helpers';

interface ProductCardProps {
  product: ProductListItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const price = typeof product.price === 'object' 
    ? `${formatCurrency(product.price.min)} - ${formatCurrency(product.price.max)}`
    : formatCurrency(product.price);

  const hasVariants = product.hasVariants;
  const inStock = product.stock > 0;

  return (
    <article className="card flex flex-col group">
      <Link
        to={`/products/${product.slug}`}
        className="relative aspect-square overflow-hidden bg-gray-50"
        aria-label={`View ${product.name}`}
      >
        {product.primaryImage ? (
          <img
            src={product.primaryImage.url}
            alt={product.primaryImage.alt || product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <TagIcon className="h-12 w-12" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasVariants && (
            <span className="px-2 py-1 text-xs font-medium bg-white/90 text-gray-900 rounded-full shadow-sm backdrop-blur-sm">
              Variants
            </span>
          )}
          {!inStock && (
            <span className="px-2 py-1 text-xs font-medium bg-red-600 text-white rounded-full shadow-sm">
              Out of Stock
            </span>
          )}
        </div>

        {/* Quick Add to Cart */}
        <div className="absolute bottom-2 left-2 right-2 translate-y-full opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          <Link
            to={`/products/${product.slug}`}
            className="btn-primary w-full justify-center"
            onClick={(e) => e.preventDefault()}
          >
            <ShoppingCartIcon className="h-4 w-4 mr-2" />
            View Details
          </Link>
        </div>
      </Link>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/products/${product.slug}`} className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
              {product.name}
            </h3>
          </Link>
          {product.category && (
            <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
              {product.category.name}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">{price}</span>
          {product.basePrice !== product.price && !hasVariants && (
            <span className="text-sm text-gray-400 line-through">{formatCurrency(product.basePrice)}</span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className={cn('text-xs font-medium', inStock ? 'text-green-600' : 'text-red-600')}>
            {inStock ? `In Stock (${product.stock})` : 'Out of Stock'}
          </span>
        </div>
      </div>
    </article>
  );
}