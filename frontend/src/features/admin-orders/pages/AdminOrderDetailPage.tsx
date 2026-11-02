import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { Order, OrderStatus, PaymentStatus, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS, formatCurrency } from '@/types';
import { formatDate, formatRelativeTime } from '@/utils/helpers';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Input';
import { showToast } from '@/components/ui/Toast';
import { cn } from '@/utils/helpers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon, UserIcon, PhoneIcon, MapPinIcon, ChatBubbleLeftRightIcon,
  TruckIcon, CheckCircleIcon, ClockIcon, XCircleIcon, CreditCardIcon,
  ArrowsUpDownIcon, EyeIcon, PrinterIcon
} from '@heroicons/react/24/outline';

export function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['adminOrder', id],
    queryFn: () => ordersApi.adminGet(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => ordersApi.adminUpdateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      showToast.success('Order status updated');
    },
    onError: (error: any) => showToast.error(error.message || 'Failed to update status'),
  });

  const updatePaymentStatusMutation = useMutation({
    mutationFn: ({ id, paymentStatus }: { id: string; paymentStatus: PaymentStatus }) => ordersApi.adminUpdatePaymentStatus(id, paymentStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      showToast.success('Payment status updated');
    },
    onError: (error: any) => showToast.error(error.message || 'Failed to update payment status'),
  });

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>('CONFIRMED');
  const [paymentStatusModalOpen, setPaymentStatusModalOpen] = useState(false);
  const [newPaymentStatus, setNewPaymentStatus] = useState<PaymentStatus>('PAID');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900">Order Not Found</h1>
        <Button onClick={() => window.history.back()} variant="outline" className="mt-4">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Orders
        </Button>
      </div>
    );
  }

  const statusOptions: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
  const paymentStatusOptions: PaymentStatus[] = ['UNPAID', 'PAID', 'REFUNDED'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            aria-label="Back to orders"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order {order.orderNumber}</h1>
            <p className="text-gray-600">{formatRelativeTime(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <PrinterIcon className="h-5 w-5 mr-2" />
            Print
          </Button>
          <a href="/admin/orders" className="btn-secondary">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to List
          </a>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-500">Status:</span>
          <Badge variant={ORDER_STATUS_COLORS[order.status] as any}>
            {ORDER_STATUS_LABELS[order.status]}
          </Badge>
          <button
            onClick={() => { setNewStatus(
              order.status === 'PENDING' ? 'CONFIRMED' :
              order.status === 'CONFIRMED' ? 'PROCESSING' :
              order.status === 'PROCESSING' ? 'SHIPPED' :
              order.status === 'SHIPPED' ? 'COMPLETED' : 'CONFIRMED'
            ); setStatusModalOpen(true); }}
            className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            aria-label="Change status"
          >
            <ArrowsUpDownIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-500">Payment:</span>
          <Badge variant={PAYMENT_STATUS_COLORS[order.paymentStatus] as any}>
            {PAYMENT_STATUS_LABELS[order.paymentStatus]}
          </Badge>
          <button
            onClick={() => { setNewPaymentStatus(order.paymentStatus === 'UNPAID' ? 'PAID' : 'UNPAID'); setPaymentStatusModalOpen(true); }}
            className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            aria-label="Change payment status"
          >
            <CreditCardIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-primary-600" />
              Customer Information
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Name</dt>
                <dd className="font-medium text-gray-900">{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="font-medium text-gray-900">{order.phone}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-gray-500">Address</dt>
                <dd className="font-medium text-gray-900 whitespace-pre-line">{order.address}</dd>
              </div>
              {order.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-gray-500">Notes</dt>
                  <dd className="font-medium text-gray-900">{order.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary-600" />
              Order Items ({order.items.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variant</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {item.product?.images?.[0] ? (
                              <img src={item.product.images[0].imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">📦</div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.productName}</p>
                            <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {item.variantName ? (
                          <span className="text-sm text-gray-600">{item.variantName}</span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-900">{item.quantity}</td>
                      <td className="px-4 py-4 text-right text-sm text-gray-900">{formatCurrency(Number(item.unitPrice))}</td>
                      <td className="px-4 py-4 text-right font-medium text-gray-900">{formatCurrency(Number(item.lineTotal))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <dl className="space-y-3">
              <div className="flex justify-between border-b border-gray-100 pb-3">
                <dt className="text-gray-600">Subtotal ({order.items.reduce((sum, i) => sum + i.quantity, 0)} items)</dt>
                <dd className="font-medium text-gray-900">{formatCurrency(Number(order.subtotal))}</dd>
              </div>
              <div className="flex justify-between text-green-600">
                <dt className="flex items-center gap-1">
                  <TruckIcon className="h-4 w-4" />
                  Shipping
                </dt>
                <dd className="font-medium">Free</dd>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between text-lg">
                <dt className="font-semibold text-gray-900">Total</dt>
                <dd className="font-bold text-gray-900">{formatCurrency(Number(order.total))}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Meta */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Order Number</dt>
                <dd className="font-medium text-gray-900">{order.orderNumber}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Created</dt>
                <dd className="font-medium text-gray-900">{formatDate(order.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Updated</dt>
                <dd className="font-medium text-gray-900">{formatDate(order.updatedAt)}</dd>
              </div>
            </dl>
          </div>

          {/* Status Timeline */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Timeline</h2>
            <div className="space-y-4">
              {[
                { status: 'PENDING', label: 'Order Placed', icon: ClockIcon, time: order.createdAt },
                { status: 'CONFIRMED', label: 'Confirmed', icon: CheckCircleIcon, time: order.status !== 'PENDING' ? order.updatedAt : null },
                { status: 'PROCESSING', label: 'Processing', icon: TruckIcon, time: ['PROCESSING', 'SHIPPED', 'COMPLETED'].includes(order.status) ? order.updatedAt : null },
                { status: 'SHIPPED', label: 'Shipped', icon: TruckIcon, time: ['SHIPPED', 'COMPLETED'].includes(order.status) ? order.updatedAt : null },
                { status: 'COMPLETED', label: 'Completed', icon: CheckCircleIcon, time: order.status === 'COMPLETED' ? order.updatedAt : null },
                { status: 'CANCELLED', label: 'Cancelled', icon: XCircleIcon, time: order.status === 'CANCELLED' ? order.updatedAt : null },
              ].map((step, index) => (
                <div key={step.status} className={cn('flex items-start gap-3', order.status === step.status ? 'text-primary-600' : 'text-gray-400')}>
                  <div className="relative flex-shrink-0">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', order.status === step.status ? 'bg-primary-600' : 'bg-gray-200')}>
                      <step.icon className={cn('h-5 w-5', order.status === step.status ? 'text-white' : 'text-gray-500')} />
                    </div>
                    {index < 5 && <div className="absolute left-3.5 top-8 bottom-0 w-0.5 bg-gray-200" />}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className={cn('font-medium', order.status === step.status ? 'text-gray-900' : 'text-gray-600')}>
                      {step.label}
                    </p>
                    {step.time && (
                      <p className="text-xs text-gray-500">{formatDate(step.time)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Actions</h2>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setStatusModalOpen(true)}
            >
              <ArrowsUpDownIcon className="h-5 w-5 mr-2" />
              Change Status
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setPaymentStatusModalOpen(true)}
            >
              <CreditCardIcon className="h-5 w-5 mr-2" />
              Update Payment Status
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
            >
              <EyeIcon className="h-5 w-5 mr-2" />
              View Customer WhatsApp
            </Button>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Update Order Status"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Current: <span className="font-medium">{ORDER_STATUS_LABELS[order.status]}</span></p>
          <Select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
          >
            {statusOptions.filter(s => s !== order.status).map(opt => (
              <option key={opt} value={opt}>{ORDER_STATUS_LABELS[opt]}</option>
            ))}
          </Select>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setStatusModalOpen(false)}>Cancel</Button>
            <Button onClick={() => updateStatusMutation.mutate({ id: order.id, status: newStatus })} loading={updateStatusMutation.isPending}>
              Update
            </Button>
          </div>
        </div>
      </Modal>

      {/* Payment Status Modal */}
      <Modal
        isOpen={paymentStatusModalOpen}
        onClose={() => setPaymentStatusModalOpen(false)}
        title="Update Payment Status"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Current: <span className="font-medium">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</span></p>
          <Select
            value={newPaymentStatus}
            onChange={(e) => setNewPaymentStatus(e.target.value as PaymentStatus)}
          >
            {paymentStatusOptions.filter(s => s !== order.paymentStatus).map(opt => (
              <option key={opt} value={opt}>{PAYMENT_STATUS_LABELS[opt]}</option>
            ))}
          </Select>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setPaymentStatusModalOpen(false)}>Cancel</Button>
            <Button onClick={() => updatePaymentStatusMutation.mutate({ id: order.id, paymentStatus: newPaymentStatus })} loading={updatePaymentStatusMutation.isPending}>
              Update
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}