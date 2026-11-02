import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { DashboardStats, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, formatCurrency, OrderStatus } from '@/types';
import { cn } from '@/utils/helpers';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import {
  CubeIcon,
  ShoppingBagIcon,
  TicketIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';

const statCards = [
  { name: 'Active Products', key: 'activeProducts', icon: ShoppingBagIcon, color: 'text-primary-600 bg-primary-100' },
  { name: 'Active Categories', key: 'activeCategories', icon: CubeIcon, color: 'text-green-600 bg-green-100' },
  { name: 'New Orders', key: 'newOrders', icon: TicketIcon, color: 'text-yellow-600 bg-yellow-100' },
  { name: 'Processing', key: 'processingOrders', icon: TruckIcon, color: 'text-blue-600 bg-blue-100' },
];

export function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => ordersApi.adminGetDashboardStats(),
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your store performance</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.key} className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {isLoading ? <Skeleton className="w-20 h-8" /> : (stats?.[stat.key as keyof DashboardStats] ?? 0)}
                </p>
              </div>
              <div className={cn('p-3 rounded-xl', stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}

        {/* Additional stat cards for completed orders and low stock */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed Orders</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {isLoading ? <Skeleton className="w-20 h-8" /> : (stats?.completedOrders ?? 0)}
              </p>
            </div>
            <div className="p-3 rounded-xl text-purple-600 bg-purple-100">
              <CheckCircleIcon className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {isLoading ? <Skeleton className="w-20 h-8" /> : (stats?.lowStockProducts?.length ?? 0)}
              </p>
            </div>
            <div className="p-3 rounded-xl text-red-600 bg-red-100">
              <ExclamationTriangleIcon className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders & Low Stock */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-primary-600" />
              Recent Orders
            </h2>
            <a href="/admin/orders" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              View All
            </a>
          </div>
          <div className="divide-y divide-gray-100">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-3/4 h-4" />
                    <Skeleton className="w-1/2 h-3" />
                  </div>
                  <Skeleton className="w-20 h-6" />
                </div>
              ))
            ) : stats?.recentOrders.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">No recent orders</div>
            ) : (
              stats?.recentOrders.map((order: { id: string; orderNumber: string; customerName: string; total: number; status: OrderStatus; createdAt: string; itemCount: number }) => (
                <div key={order.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{order.orderNumber}</p>
                    <p className="text-sm text-gray-500 truncate">{order.customerName}</p>
                  </div>
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(order.total)}</span>
                    <Badge variant={ORDER_STATUS_COLORS[order.status]}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                    <span className="text-sm text-gray-500">{order.itemCount} items</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              Low Stock Alert
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="px-6 py-4">
                  <Skeleton className="w-1/2 h-4" />
                  <Skeleton className="w-1/4 h-3 mt-1" />
                </div>
              ))
            ) : stats?.lowStockProducts.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
                <p className="mt-2">All products well stocked!</p>
              </div>
            ) : (
              stats?.lowStockProducts.map((product: { id: string; name: string; sku: string; stock: number; hasVariants: boolean; variants: { id: string; name: string; stock: number }[] }) => (
                <div key={product.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                    </div>
                    {product.hasVariants ? (
                      <div className="text-right">
                        <p className="font-medium text-red-600">
                          {product.variants.filter(v => v.stock <= 10).length} variants low
                        </p>
                      </div>
                    ) : (
                      <span className="font-medium text-red-600">{product.stock} left</span>
                    )}
                  </div>
                  {product.hasVariants && product.variants.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {product.variants
                        .filter(v => v.stock <= 10 && v.stock > 0)
                        .slice(0, 3)
                        .map((variant) => (
                          <Badge key={variant.id} variant="danger" className="text-xs">
                            {variant.name}: {variant.stock}
                          </Badge>
                        ))}
                      {product.variants.filter(v => v.stock <= 10).length > 3 && (
                        <Badge variant="gray" className="text-xs">
                          +{product.variants.filter(v => v.stock <= 10).length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <a href="/admin/products/new" className="btn-outline flex flex-col items-center gap-2 p-4 hover:bg-primary-50 hover:border-primary-200">
            <ShoppingBagIcon className="h-8 w-8 text-primary-600" />
            <span className="font-medium">Add Product</span>
          </a>
          <a href="/admin/categories" className="btn-outline flex flex-col items-center gap-2 p-4">
            <CubeIcon className="h-8 w-8 text-green-600" />
            <span className="font-medium">Manage Categories</span>
          </a>
          <a href="/admin/orders" className="btn-outline flex flex-col items-center gap-2 p-4">
            <TicketIcon className="h-8 w-8 text-yellow-600" />
            <span className="font-medium">View Orders</span>
          </a>
          <a href="/admin/settings" className="btn-outline flex flex-col items-center gap-2 p-4">
            <ArrowTrendingUpIcon className="h-8 w-8 text-blue-600" />
            <span className="font-medium">Store Settings</span>
          </a>
        </div>
      </div>
    </div>
  );
}