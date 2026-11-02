import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { Order, OrderStatus, PaymentStatus, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS } from '@/types';
import { Table, Pagination } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { showToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate, formatRelativeTime } from '@/utils/helpers';
import {
  MagnifyingGlassIcon, XMarkIcon, EyeIcon, ArrowsUpDownIcon, ArrowPathIcon, ExclamationCircleIcon as AlertCircleIcon, CreditCardIcon
} from '@heroicons/react/24/outline';

const statusOptions = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const paymentStatusOptions = [
  { value: 'UNPAID', label: 'Unpaid' },
  { value: 'PAID', label: 'Paid' },
  { value: 'REFUNDED', label: 'Refunded' },
];

export function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | ''>('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [paymentStatusModalOpen, setPaymentStatusModalOpen] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('CONFIRMED');
  const [newPaymentStatus, setNewPaymentStatus] = useState<PaymentStatus>('PAID');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['adminOrders', page, search, statusFilter, paymentStatusFilter, sortBy, sortOrder],
    queryFn: () => ordersApi.adminList({
      page,
      limit: 10,
      search: search || undefined,
      status: statusFilter || undefined,
      paymentStatus: paymentStatusFilter || undefined,
      sortBy,
      sortOrder,
    }),
    staleTime: 30000, // 30 seconds for admin data
  });

  // Debug: log errors
  if (isError) {
    console.error('Admin orders fetch error:', error);
    showToast.error(`Failed to load orders: ${error?.message || 'Unknown error'}`);
  }

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => ordersApi.adminUpdateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      showToast.success('Order status updated');
      setStatusModalOpen(false);
    },
    onError: (error: any) => showToast.error(error.message || 'Failed to update status'),
  });

  const updatePaymentStatusMutation = useMutation({
    mutationFn: ({ id, paymentStatus }: { id: string; paymentStatus: PaymentStatus }) => ordersApi.adminUpdatePaymentStatus(id, paymentStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      showToast.success('Payment status updated');
      setPaymentStatusModalOpen(false);
    },
    onError: (error: any) => showToast.error(error.message || 'Failed to update payment status'),
  });

  const hasActiveFilters = search || statusFilter || paymentStatusFilter;

  const openStatusModal = (order: Order) => {
    setUpdatingOrder(order);
    setNewStatus(
      order.status === 'PENDING' ? 'CONFIRMED' :
      order.status === 'CONFIRMED' ? 'PROCESSING' :
      order.status === 'PROCESSING' ? 'SHIPPED' :
      order.status === 'SHIPPED' ? 'COMPLETED' : 'CONFIRMED'
    );
    setStatusModalOpen(true);
  };

  const openPaymentStatusModal = (order: Order) => {
    setUpdatingOrder(order);
    setNewPaymentStatus(order.paymentStatus === 'UNPAID' ? 'PAID' : 'UNPAID');
    setPaymentStatusModalOpen(true);
  };

  const columns = [
    { key: 'orderNumber', header: 'Order #', render: (order: Order) => (
      <div>
        <p className="font-medium text-gray-900">{order.orderNumber}</p>
        <p className="text-xs text-gray-500">{formatRelativeTime(order.createdAt)}</p>
      </div>
    )},
    { key: 'customer', header: 'Customer', render: (order: Order) => (
      <div>
        <p className="font-medium text-gray-900">{order.customerName}</p>
        <p className="text-sm text-gray-500">{order.phone}</p>
      </div>
    )},
    { key: 'items', header: 'Items', render: (order: Order) => (
      <div className="text-sm text-gray-600">
        {order.items.length} item(s)
        {order.items.map(item => (
          <p key={item.id} className="text-xs truncate max-w-xs">
            {item.quantity}x {item.productName}{item.variantName ? ` (${item.variantName})` : ''}
          </p>
        ))}
      </div>
    )},
    { key: 'total', header: 'Total', render: (order: Order) => (
      <span className="font-medium text-gray-900">{formatCurrency(Number(order.total))}</span>
    )},
    { key: 'status', header: 'Status', render: (order: Order) => (
      <Badge variant={ORDER_STATUS_COLORS[order.status] as any}>
        {ORDER_STATUS_LABELS[order.status]}
      </Badge>
    )},
    { key: 'paymentStatus', header: 'Payment', render: (order: Order) => (
      <Badge variant={PAYMENT_STATUS_COLORS[order.paymentStatus] as any}>
        {PAYMENT_STATUS_LABELS[order.paymentStatus]}
      </Badge>
    )},
    { key: 'createdAt', header: 'Date', render: (order: Order) => formatDate(order.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      render: (order: Order) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openStatusModal(order)}
            className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            aria-label="Change status"
          >
            <ArrowsUpDownIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => openPaymentStatusModal(order)}
            className="p-1.5 text-gray-500 hover:text-green-600 rounded-lg hover:bg-green-50"
            aria-label="Change payment status"
            title="Payment Status"
          >
            <CreditCardIcon className="h-5 w-5" />
          </button>
          <a
            href={`/admin/orders/${order.id}`}
            className="p-1.5 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50"
            aria-label="View details"
          >
            <EyeIcon className="h-5 w-5" />
          </a>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage customer orders</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['adminOrders'] })}
            disabled={isLoading}
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircleIcon className="h-6 w-6 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-medium">Failed to load orders</p>
            <p className="text-sm text-red-600">{error?.message || 'Unknown error'}</p>
            <Button variant="outline" className="mt-2" onClick={() => queryClient.invalidateQueries({ queryKey: ['adminOrders'] })}>
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="search"
              placeholder="Search order #, customer, phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input pl-10"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>

          <div className="flex gap-2">
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as OrderStatus); setPage(1); }}
              className="w-40"
            >
              <option value="">All Status</option>
              {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </Select>

            <Select
              value={paymentStatusFilter}
              onChange={(e) => { setPaymentStatusFilter(e.target.value as PaymentStatus); setPage(1); }}
              className="w-40"
            >
              <option value="">All Payment</option>
              {paymentStatusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </Select>

            <Select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split(':');
                setSortBy(newSortBy);
                setSortOrder(newSortOrder as 'asc' | 'desc');
                setPage(1);
              }}
              className="w-48"
            >
              <option value="createdAt:desc">Newest First</option>
              <option value="createdAt:asc">Oldest First</option>
              <option value="orderNumber:asc">Order # (A-Z)</option>
              <option value="orderNumber:desc">Order # (Z-A)</option>
              <option value="total:asc">Total (Low-High)</option>
              <option value="total:desc">Total (High-Low)</option>
            </Select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); setPaymentStatusFilter(''); setPage(1); }}
              className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <XMarkIcon className="h-4 w-4" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <Table
        data={data?.data || []}
        columns={columns}
        keyExtractor={(o) => o.id}
        isLoading={isLoading}
        emptyMessage="No orders found"
      />

      {/* Pagination */}
      {data && data.meta.totalPages > 1 && (
        <Pagination
          currentPage={data.meta.page}
          totalPages={data.meta.totalPages}
          onPageChange={setPage}
          totalItems={data.meta.total}
          pageSize={data.meta.limit}
        />
      )}

      {/* Status Update Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => { setStatusModalOpen(false); setUpdatingOrder(null); }}
        title="Update Order Status"
        size="md"
      >
        {updatingOrder && (
          <div className="space-y-4">
            <p className="text-gray-600">Current status: <span className="font-medium">{ORDER_STATUS_LABELS[updatingOrder.status]}</span></p>
            <div>
              <label className="label">New Status</label>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
              >
                {statusOptions
                  .filter(opt => opt.value !== updatingOrder.status)
                  .map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => { setStatusModalOpen(false); setUpdatingOrder(null); }}>
                Cancel
              </Button>
              <Button onClick={() => updatingOrder && updateStatusMutation.mutate({ id: updatingOrder.id, status: newStatus })} loading={updateStatusMutation.isPending}>
                Update Status
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Status Update Modal */}
      <Modal
        isOpen={paymentStatusModalOpen}
        onClose={() => { setPaymentStatusModalOpen(false); setUpdatingOrder(null); }}
        title="Update Payment Status"
        size="md"
      >
        {updatingOrder && (
          <div className="space-y-4">
            <p className="text-gray-600">Current payment status: <span className="font-medium">{PAYMENT_STATUS_LABELS[updatingOrder.paymentStatus]}</span></p>
            <div>
              <label className="label">New Payment Status</label>
              <Select
                value={newPaymentStatus}
                onChange={(e) => setNewPaymentStatus(e.target.value as PaymentStatus)}
              >
                {paymentStatusOptions
                  .filter(opt => opt.value !== updatingOrder.paymentStatus)
                  .map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => { setPaymentStatusModalOpen(false); setUpdatingOrder(null); }}>
                Cancel
              </Button>
              <Button onClick={() => updatingOrder && updatePaymentStatusMutation.mutate({ id: updatingOrder.id, paymentStatus: newPaymentStatus })} loading={updatePaymentStatusMutation.isPending}>
                Update Payment Status
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}