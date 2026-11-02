import { Link } from 'react-router-dom';
import { useCartStore } from '@/stores/cartStore';
import { formatCurrency } from '@/utils/helpers';
import { TrashIcon, PlusIcon, MinusIcon, TagIcon } from '@heroicons/react/24/outline';

export function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, getSubtotal, getTotalItems } = useCartStore();
  const totalItems = getTotalItems();
  const subtotal = getSubtotal();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <TagIcon className="mx-auto h-16 w-16 text-gray-300" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Your Cart is Empty</h1>
          <p className="mt-2 text-gray-600">Looks like you haven't added any products yet.</p>
          <Link to="/products" className="mt-6 btn-primary inline-flex">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart ({totalItems})</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => {
                    const unitPrice = item.variant?.price ?? item.product.price;
                    const price = typeof unitPrice === 'object' ? unitPrice.min : unitPrice;
                    const lineTotal = price * item.quantity;
                    const maxStock = item.variant?.stock ?? item.product.stock;

                    return (
                      <tr key={`${item.productId}-${item.variantId || 'no-variant'}`} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                              {item.product.primaryImage ? (
                                <img
                                  src={item.product.primaryImage.url}
                                  alt={item.product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  <TagIcon className="h-8 w-8" />
                                </div>
                              )}
                            </div>
                            <div>
                              <Link
                                to={`/products/${item.product.slug}`}
                                className="font-medium text-gray-900 hover:text-primary-600"
                              >
                                {item.product.name}
                              </Link>
                              {item.variant && (
                                <p className="text-sm text-gray-500">{item.variant.name}</p>
                              )}
                              <p className="text-sm text-gray-500">SKU: {item.variant?.sku ?? item.product.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-900 font-medium">
                          {formatCurrency(price)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center border border-gray-300 rounded-lg w-32">
                            <button
                              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Decrease quantity"
                            >
                              <MinusIcon className="h-5 w-5" />
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const val = Math.max(1, Math.min(maxStock, parseInt(e.target.value) || 1));
                                updateQuantity(item.productId, item.variantId, val);
                              }}
                              className="w-12 text-center border-x border-gray-300 focus:outline-none"
                              min="1"
                              max={maxStock}
                              aria-label="Quantity"
                            />
                            <button
                              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                              disabled={item.quantity >= maxStock}
                              className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Increase quantity"
                            >
                              <PlusIcon className="h-5 w-5" />
                            </button>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">Max: {maxStock}</p>
                        </td>
                        <td className="px-4 py-4 text-gray-900 font-medium">
                          {formatCurrency(lineTotal)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => removeItem(item.productId, item.variantId)}
                            className="text-gray-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                            aria-label={`Remove ${item.product.name}`}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {items.length > 1 && (
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={clearCart}
                  className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <TrashIcon className="h-4 w-4" />
                  Clear Cart
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Subtotal ({totalItems} items)</dt>
                <dd className="font-medium text-gray-900">{formatCurrency(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-green-600">
                <dt>Shipping</dt>
                <dd className="font-medium">Free</dd>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between text-base">
                <dt className="font-semibold text-gray-900">Total</dt>
                <dd className="font-bold text-gray-900">{formatCurrency(subtotal)}</dd>
              </div>
            </dl>

            <Link
              to="/checkout"
              className="mt-6 btn-primary w-full py-3 text-lg"
            >
              Proceed to Checkout
            </Link>

            <p className="mt-4 text-center text-xs text-gray-500">
              Shipping and taxes calculated at checkout.
            </p>
          </div>

          <div className="mt-4 bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-medium text-gray-900 mb-3">Continue Shopping</h3>
            <Link to="/products" className="btn-outline w-full">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}