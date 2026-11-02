import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import {
  HomeIcon,
  CubeIcon,
  ShoppingBagIcon,
  TicketIcon,
  Cog6ToothIcon,
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api';

export function AdminLayout() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const isAdminOrSuper = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore errors
    } finally {
      logout();
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
    { name: 'Categories', href: '/admin/categories', icon: CubeIcon },
    { name: 'Products', href: '/admin/products', icon: ShoppingBagIcon },
    { name: 'Orders', href: '/admin/orders', icon: TicketIcon },
    { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
    ...(isAdminOrSuper ? [{ name: 'Users', href: '/admin/users', icon: UsersIcon }] : []),
  ];

  // Navigation items are used in the mobile sidebar inline

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="hidden lg:block lg:w-auto flex-1 lg:flex-none" />

          <div className="flex items-center gap-4 lg:ml-auto">
            <div className="relative">
              <button
                className="flex items-center gap-2 cursor-pointer select-none"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <svg className="h-5 w-5 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</p>
                </div>
              </button>

              {isMobileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        </header>

        <div className="flex flex-1">
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Desktop sidebar - visible on lg+ screens */}
          <aside className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:bg-white lg:border-r lg:border-gray-200 lg:flex lg:flex-col transition-all duration-200 ${
            isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
          }`}>
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
              {!isSidebarCollapsed && <h1 className="text-xl font-bold text-gray-900">E-Catalog Admin</h1>}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isSidebarCollapsed ? (
                  <ChevronRightIcon className="h-5 w-5" />
                ) : (
                  <ChevronLeftIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto" aria-label="Desktop navigation">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={'flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg transition-colors ' + (isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')}
                    aria-current={isActive ? 'page' : undefined}
                    title={isSidebarCollapsed ? item.name : undefined}
                  >
                    <Icon className="h-6 w-6 flex-shrink-0" aria-hidden="true" />
                    {!isSidebarCollapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors ${isSidebarCollapsed ? 'justify-center' : ''}`}
                  title={isSidebarCollapsed ? 'Logout' : undefined}
                >
                  <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {!isSidebarCollapsed && <span>Logout</span>}
                </button>
              </div>
            </nav>
          </aside>

          {/* Mobile sidebar - only visible on mobile */}
          <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transition-transform duration-200 flex flex-col lg:hidden" style={{ transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)' }} aria-label="Mobile sidebar">
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-900">E-Catalog Admin</h1>
            </div>
            <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto" aria-label="Mobile navigation">
              {[
                { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
                { name: 'Categories', href: '/admin/categories', icon: CubeIcon },
                { name: 'Products', href: '/admin/products', icon: ShoppingBagIcon },
                { name: 'Orders', href: '/admin/orders', icon: TicketIcon },
                { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
                { name: 'Users', href: '/admin/users', icon: UsersIcon },
              ].filter(item => item.name !== 'Users' || isAdminOrSuper).map((item) => {
                const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={'flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg transition-colors ' + (isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-6 w-6 flex-shrink-0" aria-hidden="true" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </nav>
          </aside>

          <main className={`flex-1 p-4 sm:p-6 lg:p-8 transition-all duration-200 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
            <Outlet />
          </main>
        </div>
      </div>
  );
}

export default AdminLayout;