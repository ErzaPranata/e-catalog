import { Link } from 'react-router-dom';
import { HomeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-100">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-900">Page Not Found</h2>
        <p className="mt-2 text-gray-600">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            to="/"
            className="btn-primary flex items-center gap-2"
          >
            <HomeIcon className="h-5 w-5" />
            Go Home
          </Link>
          <Link
            to="/products"
            className="btn-outline flex items-center gap-2"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}