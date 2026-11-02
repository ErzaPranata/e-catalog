import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsApi, categoriesApi } from '@/lib/api';
import { ProductListItem, Category } from '@/types';
import { ProductCard } from './components/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Table';
import { cn } from '@/utils/helpers';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  Bars3Icon,
  XMarkIcon as CloseIcon,
} from '@heroicons/react/24/outline';

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc');
  const [inStock, setInStock] = useState(searchParams.get('inStock') === 'true');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  const page = Number(searchParams.get('page')) || 1;
  const limit = 12;

  // Fetch categories for filter
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: () => categoriesApi.list({ includeInactive: false }),
  });

  // Build query params
  const queryParams = {
    page,
    limit,
    search: search || undefined,
    category: selectedCategory || undefined,
    minPrice: priceRange.min ? Number(priceRange.min) : undefined,
    maxPrice: priceRange.max ? Number(priceRange.max) : undefined,
    sortBy,
    sortOrder,
    inStock: inStock || undefined,
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', queryParams],
    queryFn: () => productsApi.list(queryParams),
    placeholderData: (previousData) => previousData,
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (selectedCategory) params.set('category', selectedCategory);
    if (priceRange.min) params.set('minPrice', priceRange.min);
    if (priceRange.max) params.set('maxPrice', priceRange.max);
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);
    if (inStock) params.set('inStock', 'true');
    if (page > 1) params.set('page', page.toString());
    setSearchParams(params, { replace: true });
  }, [search, selectedCategory, priceRange, sortBy, sortOrder, inStock, page, setSearchParams]);

  const setPage = (newPage: number): void => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params, { replace: true });
  };

  const hasActiveFilters = search || selectedCategory || priceRange.min || priceRange.max || inStock;

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    setInStock(false);
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        <p className="mt-1 text-gray-600">
          {data?.meta.total || 0} products found
        </p>
      </div>

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <ExclamationCircleIcon className="h-6 w-6 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-medium">Unable to load products</p>
            <p className="text-sm text-red-600">Backend server may not be running. Please start the backend server.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className={cn('lg:w-64 flex-shrink-0', showFilters ? 'block' : 'lg:block hidden')}>
          <div className="bg-white rounded-xl border border-gray-100 p-4 sticky top-24">
            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden w-full flex items-center justify-between px-4 py-2 mb-4 text-gray-900 font-medium"
            >
              <span className="flex items-center gap-2">
                <FunnelIcon className="h-5 w-5" />
                Filters
              </span>
              {showFilters ? <CloseIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
            </button>

            {/* Search */}
            <div className="mb-6">
              <label htmlFor="search" className="label">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
                  placeholder="Search products..."
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <label className="label">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                className="input"
                disabled={categoriesLoading}
              >
                <option value="">All Categories</option>
                {categories?.map((cat: Category) => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
              {categoriesLoading && <p className="mt-1 text-xs text-gray-500">Loading categories...</p>}
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <label className="label">Price Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="input w-full"
                  min="0"
                  step="1000"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="input w-full"
                  min="0"
                  step="1000"
                />
              </div>
            </div>

            {/* In Stock */}
            <div className="mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => { setInStock(e.target.checked); setPage(1); }}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">In Stock Only</span>
              </label>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center justify-center gap-1"
              >
                <XMarkIcon className="h-4 w-4" />
                Clear All Filters
              </button>
            )}
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="hidden lg:flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <label htmlFor="sort" className="text-sm text-gray-600">Sort by:</label>
              <select
                id="sort"
                value={`${sortBy}:${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split(':');
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder as 'asc' | 'desc');
                  setPage(1);
                }}
                className="input w-48"
              >
                <option value="createdAt:desc">Newest</option>
                <option value="createdAt:asc">Oldest</option>
                <option value="name:asc">Name (A-Z)</option>
                <option value="name:desc">Name (Z-A)</option>
                <option value="basePrice:asc">Price (Low to High)</option>
                <option value="basePrice:desc">Price (High to Low)</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <XMarkIcon className="h-4 w-4" />
                Clear Filters
              </button>
            )}
          </div>

          {/* Mobile Toolbar */}
          <div className="lg:hidden flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-outline flex items-center gap-2"
            >
              <FunnelIcon className="h-5 w-5" />
              Filters
              {hasActiveFilters && (
                <span className="bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {[
                    search && 1,
                    selectedCategory && 1,
                    priceRange.min && 1,
                    priceRange.max && 1,
                    inStock && 1,
                  ].filter(Boolean).length}
                </span>
              )}
            </button>
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split(':');
                setSortBy(newSortBy);
                setSortOrder(newSortOrder as 'asc' | 'desc');
                setPage(1);
              }}
              className="input w-40"
            >
              <option value="createdAt:desc">Newest</option>
              <option value="createdAt:asc">Oldest</option>
              <option value="name:asc">Name (A-Z)</option>
              <option value="name:desc">Name (Z-A)</option>
              <option value="basePrice:asc">Price (Low to High)</option>
              <option value="basePrice:desc">Price (High to Low)</option>
            </select>
          </div>

          {/* Products */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(12)].map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : isError ? (
            <div className="text-center py-16">
              <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Failed to load products</h3>
              <p className="mt-2 text-gray-600">Backend server may not be running.</p>
            </div>
          ) : data?.data.length === 0 ? (
            <div className="text-center py-16">
              <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
              <p className="mt-2 text-gray-600">
                Try adjusting your filters or search terms
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 btn-outline"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {data.data.map((product: ProductListItem) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {data.meta.totalPages > 1 && (
                <Pagination
                  currentPage={data.meta.page}
                  totalPages={data.meta.totalPages}
                  onPageChange={setPage}
                  totalItems={data.meta.total}
                  pageSize={data.meta.limit}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}