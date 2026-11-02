import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShoppingCartIcon, MagnifyingGlassIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { cn } from '@/utils/helpers';

export function PublicLayout() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { getTotalItems } = useCartStore();
  const cartCount = getTotalItems();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2" aria-label="E-Catalog Home">
              <svg
                className="h-8 w-8 text-primary-600"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span className="text-xl font-bold text-gray-900">E-Catalog</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/products"
                className={cn(
                  'text-sm font-medium transition-colors',
                  location.pathname.startsWith('/products')
                    ? 'text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                Products
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {/* Search Button (Mobile) */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                aria-label="Search"
                aria-expanded={isSearchOpen}
              >
                <MagnifyingGlassIcon className="h-6 w-6" />
              </button>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                aria-label={`Shopping cart, ${cartCount} items`}
              >
                <ShoppingCartIcon className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center text-xs font-medium text-white bg-red-600 rounded-full">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              {/* Admin Link */}
              <Link
                to="/admin/login"
                className="hidden md:block px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Admin
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          {isSearchOpen && (
            <div className="md:hidden pb-4">
              <form action="/products" method="GET" className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="search"
                  name="search"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
              </form>
            </div>
          )}

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <nav className="flex flex-col gap-2">
                <Link
                  to="/products"
                  className={cn(
                    'px-3 py-2 text-base font-medium rounded-lg',
                    location.pathname.startsWith('/products')
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Products
                </Link>
                <Link
                  to="/admin/login"
                  className="px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin Login
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">E-Catalog</h3>
              <p className="text-sm leading-relaxed">
                Your trusted online catalog for quality products at great prices.
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Quick Links</h4>
              <nav className="space-y-2">
                <Link to="/products" className="text-sm hover:text-white transition-colors">
                  All Products
                </Link>
                <Link to="/cart" className="text-sm hover:text-white transition-colors">
                  Cart
                </Link>
              </nav>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Categories</h4>
              <nav className="space-y-2">
                <Link to="/products?category=electronics" className="text-sm hover:text-white transition-colors">
                  Electronics
                </Link>
                <Link to="/products?category=fashion" className="text-sm hover:text-white transition-colors">
                  Fashion
                </Link>
                <Link to="/products?category=home-living" className="text-sm hover:text-white transition-colors">
                  Home & Living
                </Link>
              </nav>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Contact</h4>
              <address className="text-sm not-italic leading-relaxed space-y-2">
                <p>Jl. Contoh No. 123, Jakarta</p>
                <p>
                  <a href="tel:+6281234567890" className="hover:text-white transition-colors">
                    +62 812 3456 7890
                  </a>
                </p>
                <p>
                  <a href="mailto:info@ecatalog.com" className="hover:text-white transition-colors">
                    info@ecatalog.com
                  </a>
                </p>
              </address>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} E-Catalog. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}