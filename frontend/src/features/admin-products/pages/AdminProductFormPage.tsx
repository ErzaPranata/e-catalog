import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, productVariantsApi, productImagesApi, categoriesApi } from '@/lib/api';
import { ProductVariant, ProductImage } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { showToast } from '@/components/ui/Toast';
import { cn } from '@/utils/helpers';
import { formatCurrency } from '@/utils/helpers';
import { Button } from '@/components/ui/Button';
import { Input, Label, FormError, Textarea, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { uploadsApi } from '@/lib/api';
import {
  PlusIcon, PencilIcon, TrashIcon, PhotoIcon, CubeIcon, TagIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

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

const variantSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  sku: z.string().min(1, 'SKU is required').max(60),
  price: z.number().min(0, 'Price must be positive'),
  stock: z.number().min(0, 'Stock cannot be negative').optional(),
  attributes: z.record(z.any()).default({}),
  isActive: z.boolean(),
});

type VariantFormData = z.infer<typeof variantSchema>;

export function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [activeTab, setActiveTab] = useState<'general' | 'variants' | 'images'>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [deleteVariantConfirm, setDeleteVariantConfirm] = useState<ProductVariant | null>(null);
  const [deleteImageConfirm, setDeleteImageConfirm] = useState<ProductImage | null>(null);
  const [selectedVariantForImages, setSelectedVariantForImages] = useState<string | null>(null); // null = product-level images

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: () => categoriesApi.list({ includeInactive: false }),
  });

  // Fetch product if editing
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['adminProduct', id],
    queryFn: () => productsApi.adminGet(id!),
    enabled: isEditing,
  });

  // Fetch variants
  const { data: variants, isLoading: variantsLoading } = useQuery({
    queryKey: ['productVariants', id],
    queryFn: () => productVariantsApi.list(id!),
    enabled: isEditing,
  });

  // Fetch images - product-level or variant-specific
  const { data: images, isLoading: imagesLoading } = useQuery({
    queryKey: ['productImages', id, selectedVariantForImages],
    queryFn: () => selectedVariantForImages 
      ? productImagesApi.listByVariant(selectedVariantForImages)
      : productImagesApi.list(id!),
    enabled: isEditing,
  });

  // Mutations
  const productMutation = useMutation<
    any,
    Error,
    { id: string; data: ProductFormData } | ProductFormData
  >({
    mutationFn: async (variables) => {
      if (isEditing) {
        const v = variables as { id: string; data: ProductFormData };
        return productsApi.adminUpdate(v.id, v.data);
      } else {
        const v = variables as ProductFormData;
        return productsApi.adminCreate(v);
      }
    },
    onSuccess: (newProduct: any) => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      showToast.success(isEditing ? 'Product updated successfully' : 'Product created successfully');
      if (!isEditing) {
        navigate(`/admin/products/${newProduct.id}/edit`);
      }
      setIsSubmitting(false);
    },
    onError: (error: any) => {
      showToast.error(error.message || 'Failed to save product');
      setIsSubmitting(false);
    },
  });

  const variantMutation = useMutation<
    any,
    Error,
    { id: string; data: VariantFormData } | VariantFormData
  >({
    mutationFn: async (variables) => {
      if (editingVariant) {
        const v = variables as { id: string; data: VariantFormData };
        return productVariantsApi.update(v.id, v.data);
      } else {
        const v = variables as VariantFormData;
        return productVariantsApi.create(id!, v);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productVariants', id] });
      showToast.success(editingVariant ? 'Variant updated' : 'Variant created');
      setVariantModalOpen(false);
      setEditingVariant(null);
    },
    onError: (error: any) => showToast.error(error.message || 'Failed to save variant'),
  });

  const deleteVariantMutation = useMutation({
    mutationFn: (variantId: string) => productVariantsApi.delete(variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productVariants', id] });
      showToast.success('Variant deleted');
      setDeleteVariantConfirm(null);
    },
    onError: (error: any) => showToast.error(error.message || 'Failed to delete variant'),
  });

  const imageMutation = useMutation({
    mutationFn: async (files: File[]) => {
      // Upload files first
      const uploadResults = await uploadsApi.uploadProductImages(files, id!, selectedVariantForImages || undefined);
      
      // Save image metadata to database
      const createPromises = uploadResults.map((result, index) => 
        productImagesApi.create(id!, {
          imageUrl: result.url,
          storagePath: result.storagePath,
          altText: files[index].name,
          sortOrder: index,
          variantId: selectedVariantForImages || undefined,
        })
      );
      
      await Promise.all(createPromises);
      return uploadResults;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productImages', id, selectedVariantForImages] });
      showToast.success('Images uploaded and saved');
    },
    onError: (error: any) => showToast.error(error.message || 'Failed to upload images'),
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) => productImagesApi.delete(imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productImages', id] });
      showToast.success('Image deleted');
      setDeleteImageConfirm(null);
    },
    onError: (error: any) => showToast.error(error.message || 'Failed to delete image'),
  });

  // const reorderImagesMutation = useMutation({
//     mutationFn: (imageIds: string[]) => productImagesApi.reorder(id!, imageIds),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['productImages', id] });
//     },
//   });

  const setPrimaryImageMutation = useMutation({
    mutationFn: (imageId: string) => productImagesApi.setPrimary(id!, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productImages', id] });
    },
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

  const { register: variantRegister, handleSubmit: variantHandleSubmit, reset: variantReset, formState: { errors: variantErrors } } = useForm<VariantFormData>({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      name: '',
      sku: '',
      price: 0,
      stock: 0,
      attributes: {},
      isActive: true,
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
    if (!product) {
      setValue('slug', generateSlug(value));
    }
  };

  // Populate form when editing
  useEffect(() => {
    if (product) {
      reset({
        categoryId: product.categoryId,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        description: product.description || '',
        basePrice: Number(product.basePrice),
        stock: product.stock,
        isPublished: product.isPublished,
      });
    }
  }, [product, reset]);

  const onProductSubmit = (data: ProductFormData) => {
    setIsSubmitting(true);
    if (isEditing) {
      productMutation.mutate({ id: id!, data });
    } else {
      productMutation.mutate(data);
    }
  };

  const openVariantModal = (variant?: ProductVariant) => {
    if (variant) {
      setEditingVariant(variant);
      variantReset({
        name: variant.name,
        sku: variant.sku,
        price: Number(variant.price),
        stock: variant.stock,
        attributes: variant.attributes || {},
        isActive: variant.isActive,
      });
    } else {
      setEditingVariant(null);
      variantReset({
        name: '',
        sku: '',
        price: 0,
        stock: 0,
        attributes: {},
        isActive: true,
      });
    }
    setVariantModalOpen(true);
  };

  const onVariantSubmit = (data: VariantFormData) => {
    // Auto-generate attributes from variant name (e.g., "Red - L" -> { color: "Red", size: "L" })
    const attributes: Record<string, string> = {};
    const nameParts = data.name.split(' - ').map(part => part.trim());
    if (nameParts.length >= 2) {
      // Assume format: "Color - Size" or "Color - Storage - RAM" etc.
      const keys = ['color', 'size', 'storage', 'ram', 'material'];
      nameParts.forEach((part, index) => {
        const key = keys[index] || `attribute${index + 1}`;
        attributes[key] = part;
      });
    }

    const submitData = { ...data, attributes };

    if (editingVariant) {
      variantMutation.mutate({ id: editingVariant.id, data: submitData });
    } else if (id) {
      variantMutation.mutate(submitData);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const fileArray = Array.from(files);
    try {
      await imageMutation.mutateAsync(fileArray);
      e.target.value = '';
    } finally {
      setIsUploading(false);
    }
  };

  // const handleReorderImages = (imageIds: string[]) => {
  //   reorderImagesMutation.mutate(imageIds);
  // };

  const handleSetPrimary = (imageId: string) => {
    setPrimaryImageMutation.mutate(imageId);
  };

  const handleDeleteImage = (image: ProductImage) => {
    setDeleteImageConfirm(image);
  };

  if (isEditing && productLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-6">
              <Skeleton className="w-1/2 h-6" />
              <Skeleton className="w-full h-10 mt-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isEditing && !product) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900">Product Not Found</h1>
        <Button onClick={() => navigate('/admin/products')} variant="outline" className="mt-4">
          Back to Products
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Product' : 'Create Product'}</h1>
          <p className="text-gray-600">{isEditing ? 'Update product details' : 'Add a new product to your catalog'}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/admin/products')}>
            Back to List
          </Button>
          <Button onClick={() => handleSubmit(onProductSubmit)()} loading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onProductSubmit)} className="space-y-6">
        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <nav className="flex border-b border-gray-100" aria-label="Product tabs">
            {[
              { id: 'general', label: 'General', icon: TagIcon },
              { id: 'variants', label: 'Variants', icon: CubeIcon },
              { id: 'images', label: 'Images', icon: PhotoIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                )}
                aria-selected={activeTab === tab.id}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>

          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="p-6 space-y-6">
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
                      {categories?.map((cat) => (
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
                    <Label htmlFor="stock">Stock *</Label>
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
            </div>
          )}

          {/* Variants Tab */}
          {activeTab === 'variants' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Product Variants</h3>
                {id && (
                  <Button onClick={() => openVariantModal()} size="sm">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Variant
                  </Button>
                )}
              </div>

              {variantsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : variants?.length === 0 ? (
                <div className="text-center py-12">
                  <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h4 className="mt-2 text-lg font-medium text-gray-900">No variants yet</h4>
                  <p className="mt-1 text-gray-500">Add variants for different options like size, color, etc.</p>
                  {id && (
                    <Button onClick={() => openVariantModal()} className="mt-4">
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add First Variant
                    </Button>
                  )}
                </div>
              ) : (
                <Table
                  data={variants || []}
                  columns={[
                    { key: 'name', header: 'Name', render: (v: ProductVariant) => v.name },
                    { key: 'sku', header: 'SKU', render: (v: ProductVariant) => v.sku },
                    { key: 'price', header: 'Price', render: (v: ProductVariant) => formatCurrency(Number(v.price)) },
                    { key: 'stock', header: 'Stock', render: (v: ProductVariant) => (
                      <span className={cn('font-medium', v.stock > 0 ? 'text-green-600' : 'text-red-600')}>
                        {v.stock}
                      </span>
                    )},
                    { key: 'attributes', header: 'Attributes', render: (v: ProductVariant) => (
                      <span className="text-sm text-gray-500">
                        {v.attributes ? Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(', ') : '-'}
                      </span>
                    )},
                    { key: 'isActive', header: 'Status', render: (v: ProductVariant) => (
                      <Badge variant={v.isActive ? 'success' : 'gray'}>
                        {v.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    )},
                    {
                      key: 'actions',
                      header: 'Actions',
                      render: (v: ProductVariant) => (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openVariantModal(v)}
                            className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                            aria-label="Edit variant"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setDeleteVariantConfirm(v)}
                            className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                            aria-label="Delete variant"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ),
                    },
                  ]}
                  keyExtractor={(v) => v.id}
                  isLoading={false}
                  emptyMessage="No variants"
                />
              )}
            </div>
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedVariantForImages 
                    ? `Images for "${variants?.find(v => v.id === selectedVariantForImages)?.name || 'Variant'}"`
                    : 'Product Images (General)'
                  }
                </h3>
                <div className="flex items-center gap-4">
                  {/* Variant Selector */}
                  {variants && variants.length > 0 && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">View images for:</label>
                      <select
                        value={selectedVariantForImages || ''}
                        onChange={(e) => {
                          setSelectedVariantForImages(e.target.value || null);
                        }}
                        className="input w-56"
                      >
                        <option value="">General (Product-level)</option>
                        {variants.map((v) => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {/* Upload Button */}
                  {id && (
                    <label className="btn-outline cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                      <PhotoIcon className="h-5 w-5 mr-1" />
                      Upload Images
                    </label>
                  )}
                </div>
              </div>

              {imagesLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-square bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : images?.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                  <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h4 className="mt-2 text-lg font-medium text-gray-900">No images yet</h4>
                  <p className="mt-1 text-gray-500">Upload product images to showcase your product</p>
                  {id && (
                    <label className="mt-4 btn-outline inline-block cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                      <PhotoIcon className="h-4 w-4 mr-1" />
                      Upload Images
                    </label>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images?.map((image, index) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={image.imageUrl}
                          alt={image.altText || ''}
                          className="w-full h-full object-cover"
                        />
                        {image.isPrimary && (
                          <div className="absolute top-2 left-2">
                            <Badge variant="primary" className="text-xs">
                              <CheckIcon className="h-3 w-3 mr-1" />
                              Primary
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 justify-center p-2">
                        {!image.isPrimary && (
                          <button
                            onClick={() => handleSetPrimary(image.id)}
                            className="p-1.5 bg-white/90 text-gray-600 hover:text-primary-600 rounded-lg backdrop-blur-sm"
                            aria-label="Set as primary"
                          >
                            <CheckIcon className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteImage(image)}
                          className="p-1.5 bg-white/90 text-gray-600 hover:text-red-600 rounded-lg backdrop-blur-sm"
                          aria-label="Delete image"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-500">Order: {index + 1}</span>
                        <span className="text-xs text-gray-400">{image.sortOrder}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </form>

      {/* Variant Modal */}
      <Modal
        isOpen={variantModalOpen}
        onClose={() => { setVariantModalOpen(false); setEditingVariant(null); }}
        title={editingVariant ? 'Edit Variant' : 'Add Variant'}
        size="md"
      >
        <form onSubmit={variantHandleSubmit(onVariantSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="variantName">Name *</Label>
            <Input
              {...variantRegister('name')}
              id="variantName"
              placeholder="e.g., Red - Large"
              error={variantErrors.name?.message}
            />
            <FormError message={variantErrors.name?.message} />
          </div>

          <div>
            <Label htmlFor="variantSku">SKU *</Label>
            <Input
              {...variantRegister('sku')}
              id="variantSku"
              placeholder="PROD-001-RED-L"
              error={variantErrors.sku?.message}
            />
            <FormError message={variantErrors.sku?.message} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="variantPrice">Price (IDR) *</Label>
              <Input
                {...variantRegister('price', { valueAsNumber: true })}
                id="variantPrice"
                type="number"
                min="0"
                step="100"
                placeholder="0"
                error={variantErrors.price?.message}
              />
              <FormError message={variantErrors.price?.message} />
            </div>

            <div>
              <Label htmlFor="variantStock">Stock *</Label>
              <Input
                {...variantRegister('stock', { valueAsNumber: true })}
                id="variantStock"
                type="number"
                min="0"
                placeholder="0"
                error={variantErrors.stock?.message}
              />
              <FormError message={variantErrors.stock?.message} />
            </div>
          </div>

          <div className="flex items-center">
            <input
              {...variantRegister('isActive')}
              id="variantIsActive"
              type="checkbox"
              className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <Label htmlFor="variantIsActive" className="ml-2 mb-0 cursor-pointer">Active</Label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => { setVariantModalOpen(false); setEditingVariant(null); }}>
              Cancel
            </Button>
            <Button type="submit" loading={variantMutation.isPending}>
              {editingVariant ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Variant Confirm */}
      <ConfirmDialog
        isOpen={!!deleteVariantConfirm}
        onClose={() => setDeleteVariantConfirm(null)}
        onConfirm={() => deleteVariantConfirm && deleteVariantMutation.mutate(deleteVariantConfirm.id)}
        title="Delete Variant"
        message={`Are you sure you want to delete "${deleteVariantConfirm?.name}"?`}
        confirmText="Delete"
        variant="danger"
        loading={deleteVariantMutation.isPending}
      />

      {/* Delete Image Confirm */}
      <ConfirmDialog
        isOpen={!!deleteImageConfirm}
        onClose={() => setDeleteImageConfirm(null)}
        onConfirm={() => deleteImageConfirm && deleteImageMutation.mutate(deleteImageConfirm.id)}
        title="Delete Image"
        message={`Are you sure you want to delete this image?`}
        confirmText="Delete"
        variant="danger"
        loading={deleteImageMutation.isPending}
      />
    </div>
  );
}