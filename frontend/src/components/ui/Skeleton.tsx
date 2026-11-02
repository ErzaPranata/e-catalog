import { cn } from '@/utils/helpers';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
}: SkeletonProps) {
  const baseStyles = 'animate-pulse bg-gray-200 rounded';

  const variantStyles = {
    text: 'h-4 w-full',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="card flex flex-col">
      <div className="aspect-square w-full">
        <Skeleton variant="rectangular" className="w-full h-full" />
      </div>
      <div className="p-4 space-y-3 flex-1">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2" />
        <Skeleton variant="text" className="w-1/3" />
        <Skeleton variant="text" className="w-full h-10" />
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="aspect-[4/3] w-full">
        <Skeleton variant="rectangular" className="w-full h-full" />
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton variant="text" className="w-3/4 h-8" />
          <Skeleton variant="text" className="w-32 h-10" />
        </div>
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-1/2" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton variant="rectangular" className="h-24" />
          <Skeleton variant="rectangular" className="h-24" />
          <Skeleton variant="rectangular" className="h-24" />
        </div>
        <div className="space-y-3">
          <Skeleton variant="text" className="w-full" />
          <Skeleton variant="text" className="w-full" />
          <Skeleton variant="text" className="w-full" />
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }) {
  return (
    <tr>
      {[...Array(columns)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton variant="text" className="w-3/4" />
        </td>
      ))}
    </tr>
  );
}