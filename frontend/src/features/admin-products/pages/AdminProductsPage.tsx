import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, categoriesApi } from '@/lib/api';
import { Product, CreateProductDto, UpdateProductDto } from '@/types';
import { Table, Pagination } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Label, FormError, Textarea, Select } from '@/components/ui/Input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { showToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/utils/helpers';
import { PlusIcon, PencilIcon, TrashIcon, PhotoIcon, CubeIcon } from '@heroicons/react/24/outline';

const productSchema = z.object({
  categoryId: z.string().uuid('Please select a category'),
  name: z.string().min(1, 'Name is required').max(200),
  slug: z.string().min(1, 'Slug is required').max(220).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  sku: z.string().min(1, 'SKU is required').max(60),
  description: z.string().optional(),
  basePrice: z.number().min(0, 'Price must be positive'),
  stock: z.number().min(0, 'Stock cannot be negative').optional(),
  isPublished: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

export function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: () => categoriesApi.adminList({ limit: 1000 }).then(res => res.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['adminProducts', page, search],
    queryFn: () => productsApi.adminList({ page, limit: 10, search }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateProductDto) => productsApi.adminCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      showToast.success('Product created successfully');
      setIsModalOpen(false);
    },
    onError: (error: any) => showToast.error(error.message || 'Failed to create product'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductDto }) => productsApi.adminUpdate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      showToast.success('Product updated successfully');
      setIsModalOpen(false);
    },
    onError: (error: any) => showToast.error(error.message || 'Failed to update product'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.adminDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      showToast.success('Product deleted/archived successfully');
      setDeleteConfirm(null);
    },
    onError: (error: any) => showToast.error(error.message || 'Failed to delete product'),
  });

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      categoryId: '',
      name: '',
      slug: '',
      sku: '',
      description: '',
      basePrice: 0,
      stock: 0,
      isPublished: false,
    },
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue('name', value);
    if (!editingProduct) {
      setValue('slug', generateSlug(value));
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    reset({
      categoryId: categories?.[0]?.id || '',
      name: '',
      slug: '',
      sku: '',
      description: '',
      basePrice: 0,
      stock: 0,
      isPublished: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = async (product: Product) => {
    // Fetch full product details
    const fullProduct = await productsApi.adminGet(product.id);
    setEditingProduct(fullProduct);
    reset({
      categoryId: fullProduct.categoryId,
      name: fullProduct.name,
      slug: fullProduct.slug,
      sku: fullProduct.sku,
      description: fullProduct.description || '',
      basePrice: Number(fullProduct.basePrice),
      stock: fullProduct.stock,
      isPublished: fullProduct.isPublished,
    });
    setIsModalOpen(true);
  };

  const onFormSubmit = (data: ProductFormData) => {
    setIsSubmitting(true);
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    { key: 'image', header: 'Image', render: (product: Product) => (
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
        {product.images?.[0] ? (
          <img src={product.images[0].imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <PhotoIcon className="w-full h-full text-gray-300 flex items-center justify-center" />
        )}
      </div>
    )},
    { key: 'name', header: 'Product', render: (product: Product) => (
      <div>
        <p className="font-medium text-gray-900 truncate max-w-xs">{product.name}</p>
        <p className="text-xs text-gray-500">SKU: {product.sku}</p>
        <p className="text-xs text-gray-400">ID: {product.id.slice(0, 8)}...</p>
      </div>
    )},
    {key: 'category', header: 'Category', render: (product: Product) => (
      <span className="text-gray-600">{product.category?.name || '-'}</span>
    )},
    { key: 'price', header: 'Price', render: (product: Product) => {
      const price = product.price;
      if (price && typeof price === 'object' && 'min' in price && 'max' in price) {
        return `${formatCurrency(price.min)} - ${formatCurrency(price.max)}`;
      }
      return formatCurrency(price as number);
    }},
    { key: 'stock', header: 'Stock', render: (product: Product) => (
      <div className="flex flex-col gap-0.5">
        {product.hasVariants ? (
          <>
            <span className="font-medium text-gray-900">
              Total: {product.stock}
            </span>
            <span className="text-xs text-gray-500">({product.variants?.length || 0} variants)</span>
          </>
        ) : (
          <span className={product.stock > 0 ? 'font-medium text-green-600' : 'font-medium text-red-600'}>
            {product.stock}
          </span>
        )}
      </div>
    )},
    { key: 'variants', header: 'Variants', render: (product: Product) => (
      <div className="max-w-xs">
        {product.hasVariants && product.variants && product.variants.length > 0 ? (
          <div className="space-y-1">
            {product.variants.slice(0, 3).map((v) => (
              <div key={v.id} className="flex items-center gap-1.5 text-xs">
                <span className="font-medium text-gray-900 truncate">{v.name}</span>
                <span className="text-gray-500">({v.stock})</span>
              </div>
            ))}
            {product.variants.length > 3 && (
              <span className="text-xs text-gray-400">+{product.variants.length - 3} more...</span>
            )}
          </div>
        ) : (
          <Badge variant="gray">None</Badge>
        )}
      </div>
    )},
    { key: 'status', header: 'Status', render: (product: Product) => (
      <Badge variant={product.isPublished ? 'success' : 'gray'}>
        {product.isPublished ? 'Published' : 'Draft'}
      </Badge>
    )},
    {
      key: 'actions',
      header: 'Actions',
      render: (product: Product) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEditModal(product)}
            className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            aria-label="Edit product"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <a
            href={`/admin/products/${product.id}/edit`}
            className="p-1.5 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50"
            aria-label="Manage images"
          >
            <PhotoIcon className="h-5 w-5" />
          </a>
          <a
            href={`/admin/products/${product.id}/edit`}
            className="p-1.5 text-gray-500 hover:text-purple-600 rounded-lg hover:bg-purple-50"
            aria-label="Manage variants"
          >
            <CubeIcon className="h-5 w-5" />
          </a>
          <button
            onClick={() => setDeleteConfirm(product)}
            className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50"
            aria-label="Delete product"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <Button onClick={openCreateModal}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="search"
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input pl-10"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Table */}
      <Table
        data={data?.data || []}
        columns={columns}
        keyExtractor={(p) => p.id}
        isLoading={isLoading}
        emptyMessage="No products found"
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone. If the product has orders, it will be archived instead.`}
        confirmText="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />

      {/* Create/Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingProduct(null); }}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="categoryId">Category *</Label>
                <Select
                  {...register('categoryId')}
                  id="categoryId"
                  error={errors.categoryId?.message}
                >
                  <option value="">Select Category</option>
                  {categories?.map((cat: { id: string; name: string }) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </Select>
                <FormError message={errors.categoryId?.message} />
              </div>

              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  {...register('name', { onChange: handleNameChange })}
                  id="name"
                  placeholder="Product Name"
                  error={errors.name?.message}
                />
                <FormError message={errors.name?.message} />
              </div>

              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  {...register('slug')}
                  id="slug"
                  placeholder="product-slug"
                  error={errors.slug?.message}
                />
                <FormError message={errors.slug?.message} />
                <p className="mt-1 text-xs text-gray-500">URL-friendly identifier (auto-generated from name)</p>
              </div>

              <div>
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  {...register('sku')}
                  id="sku"
                  placeholder="PROD-001"
                  error={errors.sku?.message}
                />
                <FormError message={errors.sku?.message} />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="basePrice">Base Price (IDR) *</Label>
                <Input
                  {...register('basePrice', { valueAsNumber: true })}
                  id="basePrice"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  error={errors.basePrice?.message}
                />
                <FormError message={errors.basePrice?.message} />
              </div>

              <div>
                <Label htmlFor="stock">Stock</Label>
                <Input
                  {...register('stock', { valueAsNumber: true })}
                  id="stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  error={errors.stock?.message}
                />
                <FormError message={errors.stock?.message} />
                <p className="mt-1 text-xs text-gray-500">Used when product has no variants</p>
              </div>

              <div className="flex items-center">
                <input
                  {...register('isPublished')}
                  id="isPublished"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <Label htmlFor="isPublished" className="ml-2 mb-0 cursor-pointer">Published</Label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              {...register('description')}
              id="description"
              rows={4}
              placeholder="Product description..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingProduct(null); }}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting || createMutation.isPending || updateMutation.isPending}>
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}