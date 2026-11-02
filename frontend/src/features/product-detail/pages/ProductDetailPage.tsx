import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import { ProductVariant } from '@/types';
import { ProductDetailSkeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/utils/helpers';
import { useCartStore } from '@/stores/cartStore';
import { showToast } from '@/components/ui/Toast';
import { cn } from '@/utils/helpers';
import { ShoppingCartIcon, PlusIcon, MinusIcon, TagIcon, TruckIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCartStore();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getBySlug(slug!),
    enabled: !!slug,
  });

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Product Not Found</h2>
        <p className="mt-2 text-gray-600">The product you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  const hasVariants = product.hasVariants;
  const inStock = hasVariants
    ? (selectedVariant?.stock ?? 0) > 0
    : product.stock > 0;
  const currentPrice = hasVariants
    ? selectedVariant?.price ?? (typeof product.price === 'object' ? product.price.min : product.price)
    : product.basePrice;
  const currentStock = hasVariants
    ? selectedVariant?.stock ?? 0
    : product.stock;

  const handleAddToCart = () => {
    if (!inStock) {
      showToast.error('Product is out of stock');
      return;
    }

    addItem(product, selectedVariant || undefined, quantity);
    showToast.success(`${product.name} added to cart`);
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity < 1) return;
    if (newQuantity > currentStock) {
      showToast.error(`Only ${currentStock} items available`);
      return;
    }
    setQuantity(newQuantity);
  };

  // Reset variant selection when product changes
  if (hasVariants && product.variants.length > 0 && !selectedVariant) {
    setSelectedVariant(product.variants[0]);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm" aria-label="Breadcrumb">
        <a href="/" className="text-gray-500 hover:text-gray-700">Home</a>
        <span className="text-gray-400">/</span>
        <a href="/products" className="text-gray-500 hover:text-gray-700">Products</a>
        <span className="text-gray-400">/</span>
        {product.category && (
          <>
            <a
              href={`/products?category=${product.category.slug}`}
              className="text-gray-500 hover:text-gray-700"
            >
              {product.category.name}
            </a>
            <span className="text-gray-400">/</span>
          </>
        )}
        <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 relative">
            {product.images.length > 0 ? (
              <>
                <img
                  src={product.images[activeImageIndex].url}
                  alt={product.images[activeImageIndex].alt || `${product.name} - Image ${activeImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                {product.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {product.images.map((_image: any, index: number) => (
                      <button
                        key={index}
                        onClick={() => setActiveImageIndex(index)}
                        className={cn(
                          'w-2 h-2 rounded-full transition-all',
                          index === activeImageIndex
                            ? 'bg-white'
                            : 'bg-white/50 hover:bg-white/75'
                        )}
                        aria-label={`View image ${index + 1}`}
                        aria-current={index === activeImageIndex}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <TagIcon className="h-24 w-24" />
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((image: any, index: number) => (
                <button
                  key={image.id}
                  onClick={() => setActiveImageIndex(index)}
                  className={cn(
                    'relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all',
                    index === activeImageIndex
                      ? 'border-primary-500'
                      : 'border-transparent hover:border-gray-300'
                  )}
                  aria-label={`View image ${index + 1}`}
                  aria-current={index === activeImageIndex}
                >
                  <img
                    src={image.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            {product.category && (
              <a
                href={`/products?category=${product.category.slug}`}
                className="text-sm text-primary-600 hover:underline"
              >
                {product.category.name}
              </a>
            )}
            <h1 className="mt-2 text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="mt-2 text-sm text-gray-500">SKU: {product.sku}</p>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-4 flex-wrap">
            <span className="text-3xl font-bold text-gray-900">{formatCurrency(currentPrice)}</span>
            {hasVariants && product.variants.length > 1 && (
              <span className="text-gray-500 self-center">
                ({formatCurrency((typeof product.price === 'object' ? product.price.min : product.basePrice))} - {formatCurrency(typeof product.price === 'object' ? product.price.max : product.basePrice)})
              </span>
            )}
            {product.basePrice > currentPrice && !hasVariants && (
              <span className="text-xl text-gray-400 line-through">{formatCurrency(product.basePrice)}</span>
            )}
          </div>

          {/* Variant Selection */}
          {hasVariants && product.variants.length > 0 && (
            <fieldset className="space-y-3 border-t border-b border-gray-100 py-6">
              <legend className="text-sm font-medium text-gray-900">Select Variant</legend>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant: ProductVariant) => (
                  <button
                    key={variant.id}
                    onClick={() => {
                      setSelectedVariant(variant);
                      setQuantity(1);
                    }}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all',
                      selectedVariant?.id === variant.id
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300',
                      !variant.isActive || variant.stock === 0 && 'opacity-50 cursor-not-allowed'
                    )}
                    disabled={!variant.isActive || variant.stock === 0}
                    aria-pressed={selectedVariant?.id === variant.id}
                  >
                    {variant.name}
                    {variant.stock > 0 && (
                      <span className="ml-2 text-xs text-gray-500">({variant.stock})</span>
                    )}
                    {variant.stock === 0 && (
                      <span className="ml-2 text-xs text-red-500">(Out of Stock)</span>
                    )}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {/* Quantity Selector */}
          <div className="space-y-3">
            <label htmlFor="quantity" className="text-sm font-medium text-gray-900">Quantity</label>
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="p-3 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Decrease quantity"
                >
                  <MinusIcon className="h-5 w-5" />
                </button>
                <input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(currentStock, parseInt(e.target.value) || 1));
                    setQuantity(val);
                  }}
                  className="w-16 text-center border-x border-gray-300 focus:outline-none"
                  min="1"
                  max={currentStock}
                  aria-label="Quantity"
                />
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= currentStock}
                  className="p-3 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Increase quantity"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
              <span className="text-sm text-gray-500">
                Available: <span className="font-medium">{currentStock}</span>
              </span>
            </div>
          </div>

          {/* Add to Cart */}
          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className={cn(
                'btn-primary w-full py-4 text-lg font-medium',
                !inStock && 'bg-gray-300 cursor-not-allowed'
              )}
            >
              <ShoppingCartIcon className="h-6 w-6 mr-2" />
              {inStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>

          {/* Features */}
          <div className="border-t border-gray-100 pt-6 grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center gap-2 p-4">
              <TruckIcon className="h-8 w-8 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">Free Shipping</span>
              <span className="text-xs text-gray-500">Orders over Rp 500k</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4">
              <ShieldCheckIcon className="h-8 w-8 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">Quality Guaranteed</span>
              <span className="text-xs text-gray-500">Verified products</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4">
              <TagIcon className="h-8 w-8 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">Easy Returns</span>
              <span className="text-xs text-gray-500">30-day return policy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
        <div className="prose prose-gray max-w-none bg-white p-6 rounded-xl border border-gray-100">
          {product.description ? (
            <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
          ) : (
            <p className="text-gray-500">No description available.</p>
          )}
        </div>
      </div>
    </div>
  );
}