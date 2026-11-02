import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { HomePage } from '@/features/catalog/pages/HomePage';
import { ProductsPage } from '@/features/catalog/pages/ProductsPage';
import { ProductDetailPage } from '@/features/product-detail/pages/ProductDetailPage';
import { CartPage } from '@/features/cart/pages/CartPage';
import { CheckoutPage } from '@/features/checkout/pages/CheckoutPage';
import { NotFoundPage } from '@/components/shared/NotFoundPage';
import { AdminLoginPage } from '@/features/auth/pages/AdminLoginPage';
import { AdminDashboardPage } from '@/features/dashboard/pages/AdminDashboardPage';
import { AdminCategoriesPage } from '@/features/admin-categories/pages/AdminCategoriesPage';
import { AdminProductsPage } from '@/features/admin-products/pages/AdminProductsPage';
import { AdminProductFormPage } from '@/features/admin-products/pages/AdminProductFormPage';
import { AdminOrdersPage } from '@/features/admin-orders/pages/AdminOrdersPage';
import { AdminOrderDetailPage } from '@/features/admin-orders/pages/AdminOrderDetailPage';
import { AdminSettingsPage } from '@/features/admin-settings/pages/AdminSettingsPage';
import { AdminUsersPage } from '@/features/admin-users/pages/AdminUsersPage';
import { useAuthStore } from '@/stores/authStore';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <>{children}</>;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/:slug', element: <ProductDetailPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
    ],
  },
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
  },
  {
    path: '/admin',
    element: (
      <PrivateRoute>
        <AdminLayout />
      </PrivateRoute>
    ),
    children: [
      { path: '', element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboardPage /> },
      { path: 'categories', element: <AdminCategoriesPage /> },
      { path: 'products', element: <AdminProductsPage /> },
      { path: 'products/new', element: <AdminProductFormPage /> },
      { path: 'products/:id/edit', element: <AdminProductFormPage /> },
      { path: 'orders', element: <AdminOrdersPage /> },
      { path: 'orders/:id', element: <AdminOrderDetailPage /> },
      { path: 'settings', element: <AdminSettingsPage /> },
      { path: 'users', element: <AdminUsersPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
], {
  future: {
    v7_relativeSplatPath: true,
  },
});

function App() {
  return <RouterProvider router={router} />;
}

export default App;