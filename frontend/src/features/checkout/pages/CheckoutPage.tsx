import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCartStore } from '@/stores/cartStore';
import { ordersApi } from '@/lib/api';
import { formatCurrency } from '@/utils/helpers';
import { showToast } from '@/components/ui/Toast';
import { cn } from '@/utils/helpers';
import { TruckIcon, UserIcon, ChatBubbleLeftRightIcon, ShieldCheckIcon, TagIcon } from '@heroicons/react/24/outline';
import { CheckoutData } from '@/types';

const checkoutSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  notes: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getSubtotal, clearCart } = useCartStore();
  const subtotal = getSubtotal();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: '',
      phone: '',
      address: '',
      notes: '',
    },
  });

  const watchedNotes = watch('notes');

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Your Cart is Empty</h1>
        <p className="mt-2 text-gray-600">Add some products before checking out.</p>
      </div>
    );
  }

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);
    try {
      const checkoutItems = items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      const response = await ordersApi.create({
        items: checkoutItems,
        customerName: data.customerName,
        phone: data.phone,
        address: data.address,
        notes: data.notes,
      });

      clearCart();

      // Open WhatsApp
      const whatsappUrl = response.whatsapp.url;
      const opened = window.open(whatsappUrl, '_blank');

      if (!opened) {
        showToast.error('Popup blocked. Please allow popups for this site.');
      }

      // Show success message with order number
      showToast.success(`Order ${response.order.orderNumber} created! Redirecting to WhatsApp...`);

      // Navigate to success page or show order details
      setTimeout(() => {
        navigate(`/checkout/success?order=${response.order.orderNumber}`);
      }, 2000);
    } catch (error: any) {
      showToast.error(error.message || 'Failed to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Customer Info */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-primary-600" />
                Customer Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="customerName" className="label">Full Name *</label>
                  <input
                    {...register('customerName')}
                    id="customerName"
                    type="text"
                    placeholder="John Doe"
                    className={cn('input', errors.customerName && 'input-error')}
                  />
                  {errors.customerName && (
                    <p className="mt-1 text-sm text-red-600">{errors.customerName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="label">Phone Number *</label>
                  <input
                    {...register('phone')}
                    id="phone"
                    type="tel"
                    placeholder="081234567890"
                    className={cn('input', errors.phone && 'input-error')}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="address" className="label">Delivery Address *</label>
                  <textarea
                    {...register('address')}
                    id="address"
                    rows={3}
                    placeholder="Jl. Contoh No. 123, RT/RW, Kelurahan, Kecamatan, Kota, Provinsi, Kode Pos"
                    className={cn('input', errors.address && 'input-error')}
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="notes" className="label">Notes (Optional)</label>
                  <textarea
                    {...register('notes')}
                    id="notes"
                    rows={2}
                    placeholder="Special delivery instructions, preferred delivery time, etc."
                    className={cn('input', errors.notes && 'input-error')}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {watchedNotes?.length || 0} / 500 characters
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items Review */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary-600" />
                Order Review
              </h2>

              <div className="space-y-3">
                {items.map((item) => {
                  const unitPrice = item.variant?.price ?? item.product.price;
                  const price = typeof unitPrice === 'object' ? unitPrice.min : unitPrice;
                  const lineTotal = price * item.quantity;

                  return (
                    <div key={`${item.productId}-${item.variantId || 'no-variant'}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white flex-shrink-0">
                        {item.product.primaryImage ? (
                          <img src={item.product.primaryImage.url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300"><TagIcon className="h-6 w-6" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                        {item.variant && <p className="text-xs text-gray-500">{item.variant.name}</p>}
                        <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatCurrency(price)}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900 whitespace-nowrap">{formatCurrency(lineTotal)}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn('btn-primary w-full py-4 text-lg', isSubmitting && 'opacity-75')}
              >
                {isSubmitting ? 'Processing...' : 'Place Order & Continue to WhatsApp'}
              </button>

              <p className="mt-3 text-center text-sm text-gray-500">
                By placing this order, you agree to our Terms & Conditions.
              </p>

              <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <ShieldCheckIcon className="h-4 w-4" />
                  Secure
                </span>
                <span className="flex items-center gap-1">
                  <TruckIcon className="h-4 w-4" />
                  Free Shipping
                </span>
              </div>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TruckIcon className="h-5 w-5 text-primary-600" />
              Order Summary
            </h2>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-gray-100 pb-3">
                <dt className="text-gray-600">Subtotal ({items.reduce((sum, i) => sum + i.quantity, 0)} items)</dt>
                <dd className="font-medium text-gray-900">{formatCurrency(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-green-600">
                <dt className="flex items-center gap-1">
                  <TruckIcon className="h-4 w-4" />
                  Shipping
                </dt>
                <dd className="font-medium">Free</dd>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between text-base">
                <dt className="font-semibold text-gray-900">Total</dt>
                <dd className="font-bold text-gray-900 text-lg">{formatCurrency(subtotal)}</dd>
              </div>
            </dl>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-2">
              <p className="text-sm text-gray-700">
                <strong>What happens next:</strong>
              </p>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>We'll create your order</li>
                <li>You'll be redirected to WhatsApp</li>
                <li>Send the pre-filled message to us</li>
                <li>We'll confirm and process your order</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}