import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '@/lib/api';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '@/types';
import { Table, Pagination } from '@/components/ui/Table';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Label, FormError, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { showToast } from '@/components/ui/Toast';
import { PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1, 'Slug is required').max(120).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  isActive: z.boolean(),
  sortOrder: z.number().min(0),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['adminCategories', page, search],
    queryFn: () => categoriesApi.adminList({ page, limit: 10, search }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCategoryDto) => categoriesApi.adminCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      showToast.success('Category created successfully');
      setIsModalOpen(false);
    },
    onError: (error: any) => showToast.error(error.message || 'Failed to create category'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryDto }) => categoriesApi.adminUpdate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      showToast.success('Category updated successfully');
      setIsModalOpen(false);
    },
    onError: (error: any) => showToast.error(error.message || 'Failed to update category'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.adminDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      showToast.success('Category deleted successfully');
      setDeleteConfirm(null);
    },
    onError: (error: any) => showToast.error(error.message || 'Failed to delete category'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => categoriesApi.adminUpdate(id, { isActive }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      showToast.success(variables.isActive ? 'Category activated' : 'Category deactivated');
    },
    onError: (error: any) => showToast.error(error.message || 'Failed to update category'),
  });

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      isActive: true,
      sortOrder: 0,
    },
  });

  // Auto-generate slug from name
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
    if (!editingCategory) {
      setValue('slug', generateSlug(value));
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    reset({
      name: '',
      slug: '',
      description: '',
      isActive: true,
      sortOrder: 0,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    reset({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      isActive: category.isActive,
      sortOrder: category.sortOrder,
    });
    setIsModalOpen(true);
  };

  const onFormSubmit = (data: CategoryFormData) => {
    setIsSubmitting(true);
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    { key: 'name', header: 'Name', render: (cat: Category) => (
      <div>
        <p className="font-medium text-gray-900">{cat.name}</p>
        <p className="text-sm text-gray-500">{cat.slug}</p>
      </div>
    )},
    { key: 'description', header: 'Description', render: (cat: Category) => (
      <p className="text-gray-600 truncate max-w-xs">{cat.description || '-'}</p>
    )},
    { key: 'isActive', header: 'Status', render: (cat: Category) => (
      <Badge variant={cat.isActive ? 'success' : 'gray'}>
        {cat.isActive ? 'Active' : 'Inactive'}
      </Badge>
    )},
    { key: 'sortOrder', header: 'Sort Order', render: (cat: Category) => cat.sortOrder },
    { key: 'products', header: 'Products', render: (cat: Category) => cat._count?.products ?? 0 },
    {
      key: 'actions',
      header: 'Actions',
      render: (cat: Category) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEditModal(cat)}
            className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            aria-label="Edit category"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => toggleActiveMutation.mutate({ id: cat.id, isActive: !cat.isActive })}
            disabled={toggleActiveMutation.isPending}
            className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${
              cat.isActive
                ? 'text-green-600 hover:text-green-700'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            aria-label={cat.isActive ? 'Deactivate category' : 'Activate category'}
            title={cat.isActive ? 'Deactivate' : 'Activate'}
          >
            {cat.isActive ? (
              <CheckCircleIcon className="h-5 w-5" />
            ) : (
              <XCircleIcon className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={() => setDeleteConfirm(cat)}
            className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50"
            aria-label="Delete category"
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
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Manage product categories</p>
        </div>
        <Button onClick={openCreateModal}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="search"
              placeholder="Search categories..."
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
        keyExtractor={(cat) => cat.id}
        isLoading={isLoading}
        emptyMessage="No categories found"
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCategory(null); }}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        size="md"
      >
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              {...register('name', { onChange: handleNameChange })}
              id="name"
              placeholder="Electronics"
              error={errors.name?.message}
            />
            <FormError message={errors.name?.message} />
          </div>

          <div>
            <Label htmlFor="slug">Slug *</Label>
            <Input
              {...register('slug')}
              id="slug"
              placeholder="electronics"
              error={errors.slug?.message}
            />
            <FormError message={errors.slug?.message} />
            <p className="mt-1 text-xs text-gray-500">URL-friendly identifier (auto-generated from name)</p>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              {...register('description')}
              id="description"
              rows={3}
              placeholder="Category description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                {...register('sortOrder', { valueAsNumber: true })}
                id="sortOrder"
                type="number"
                min="0"
                error={errors.sortOrder?.message}
              />
            </div>

            <div className="flex items-center">
              <input
                {...register('isActive')}
                id="isActive"
                type="checkbox"
                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <Label htmlFor="isActive" className="ml-2 mb-0 cursor-pointer">Active</Label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingCategory(null); }}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}