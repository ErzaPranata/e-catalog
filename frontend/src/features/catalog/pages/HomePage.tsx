import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi, productsApi } from '@/lib/api';
import { Category, ProductListItem } from '@/types';
import { ProductCard } from './components/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

export function HomePage() {
  const { data: categories, isLoading: categoriesLoading, isError: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list({ includeInactive: false }),
  });

  const { data: featuredProducts, isError: productsError } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productsApi.list({ limit: 8, sortBy: 'createdAt', sortOrder: 'desc' }),
  });

  const hasError = categoriesError || productsError;

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Discover Amazing Products
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-primary-100">
              Find the best deals on electronics, fashion, home essentials, and more.
              Fast shipping and easy returns.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/products"
                className="bg-white text-primary-600 px-6 py-3 text-base font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
        </div>
        {hasError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <ExclamationCircleIcon className="h-6 w-6 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Unable to load categories</p>
              <p className="text-sm text-red-600">Backend server may not be running. Please start the backend server.</p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories?.map((category: Category) => (
            <Link
              key={category.id}
              to={`/products?category=${category.slug}`}
              className="group card p-6 text-center hover:shadow-md transition-shadow"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900">{category.name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {category._count?.products || 0} products
              </p>
            </Link>
          ))}
          {categoriesLoading && [...Array(10)].map((_, i) => (
            <div key={i} className="card p-6 text-center animate-pulse">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-xl" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto" />
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
          <Link
            to="/products"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            View All →
          </Link>
        </div>
        {hasError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <ExclamationCircleIcon className="h-6 w-6 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Unable to load products</p>
              <p className="text-sm text-red-600">Backend server may not be running. Please start the backend server.</p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts?.data ? (
            featuredProducts.data.map((product: ProductListItem) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            [...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)
          )}
        </div>
      </section>
    </div>
  );
}