export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus =
  | 'UNPAID'
  | 'PAID'
  | 'REFUNDED'
  | 'NOT_APPLICABLE';

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  storagePath: string | null;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
  variantId?: string | null; // Link to variant for variant-specific images
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  price: number;
  stock: number;
  attributes?: Record<string, any> | null;
  isActive: boolean;
  images?: ProductImage[]; // Variant-specific images
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  basePrice: number;
  price?: { min: number; max: number } | number;
  stock: number;
  hasVariants: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  category: Pick<Category, 'id' | 'name' | 'slug'>;
  images: ProductImage[];
  variants: ProductVariant[];
  primaryImage: { url: string; alt: string | null } | null;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  basePrice: number;
  price: { min: number; max: number } | number;
  stock: number;
  hasVariants: boolean;
  category: Pick<Category, 'id' | 'name' | 'slug'>;
  primaryImage: { url: string; alt: string | null } | null;
  isPublished: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  createdAt: string;
  product?: { id: string; name: string; images: ProductImage[] };
  variant?: { id: string; name: string };
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  notes: string | null;
  subtotal: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSettings {
  id: string;
  storeName: string;
  storeDescription: string | null;
  whatsappNumber: string;
  currency: string;
  storeAddress: string | null;
  announcement: string | null;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  product: ProductListItem;
  variant?: ProductVariant;
}

export interface CheckoutData {
  items: {
    productId: string;
    variantId?: string;
    quantity: number;
  }[];
  customerName: string;
  phone: string;
  address: string;
  notes?: string;
}

export interface CheckoutResponse {
  order: Order;
  whatsapp: {
    url: string;
    message: string;
  };
}

export interface DashboardStats {
  activeProducts: number;
  activeCategories: number;
  newOrders: number;
  processingOrders: number;
  completedOrders: number;
  lowStockProducts: LowStockProduct[];
  recentOrders: RecentOrder[];
}

export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  stock: number;
  hasVariants: boolean;
  variants: { id: string; name: string; stock: number }[];
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  itemCount: number;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Menunggu',
  CONFIRMED: 'Dikonfirmasi',
  PROCESSING: 'Diproses',
  SHIPPED: 'Dikirim',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'primary'> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PROCESSING: 'info',
  SHIPPED: 'primary',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: 'Belum Bayar',
  PAID: 'Sudah Bayar',
  REFUNDED: 'Dikembalikan',
  NOT_APPLICABLE: 'Tidak Berlaku',
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'primary'> = {
  UNPAID: 'warning',
  PAID: 'success',
  REFUNDED: 'info',
  NOT_APPLICABLE: 'gray',
};

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
};

// DTO Types for Forms
export interface CreateCategoryDto {
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CreateProductDto {
  categoryId: string;
  name: string;
  slug: string;
  sku: string;
  description?: string;
  basePrice: number;
  stock?: number;
  isPublished?: boolean;
}

export interface UpdateProductDto {
  categoryId?: string;
  name?: string;
  slug?: string;
  sku?: string;
  description?: string;
  basePrice?: number;
  stock?: number;
  isPublished?: boolean;
}

export interface UpdateSettingsDto {
  storeName?: string;
  storeDescription?: string;
  whatsappNumber?: string;
  currency?: string;
  storeAddress?: string;
  announcement?: string;
}

export interface CreateVariantDto {
  name: string;
  sku: string;
  price: number;
  stock?: number;
  attributes?: Record<string, any>;
  isActive?: boolean;
}

export interface UpdateVariantDto {
  name?: string;
  sku?: string;
  price?: number;
  stock?: number;
  attributes?: Record<string, any>;
  isActive?: boolean;
}

// Utility function
export const formatCurrency = (amount: number, currency = 'IDR'): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
};