import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUsersApi } from '@/lib/api';
import { AdminUser, ADMIN_ROLE_LABELS } from '@/types';
import { Table, Pagination } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select, Label, FormError } from '@/components/ui/Input';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { showToast } from '@/components/ui/Toast';
import { PlusIcon, PencilIcon, TrashIcon, KeyIcon } from '@heroicons/react/24/outline';

const adminUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER']),
  isActive: z.boolean(),
});

type AdminUserFormData = z.infer<typeof adminUserSchema>;

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<AdminUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', page, search],
    queryFn: () => adminUsersApi.list({ page, limit: 10, search }),
  });

  const createMutation = useMutation({
    mutationFn: (data: AdminUserFormData) => adminUsersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      showToast.success('Admin user created successfully');
      setIsModalOpen(false);
    },
    onError: (error: any) => showToast.error(error.message || 'Failed to create user'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminUserFormData> }) => adminUsersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      showToast.success('Admin user updated successfully');
      setIsModalOpen(false);
    },
    onError: (error: any) => showToast.error(error.message || 'Failed to update user'),
  });

  // const changePasswordMutation = useMutation({
//     mutationFn: ({ id, password }: { id: string; password: string }) => adminUsersApi.changePassword(id, password),
//     onSuccess: () => {
//       showToast.success('Password changed successfully');
//       setIsModalOpen(false);
//     },
//     onError: (error: any) => showToast.error(error.message || 'Failed to change password'),
//   });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminUsersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      showToast.success('Admin user deleted successfully');
      setDeleteConfirm(null);
    },
    onError: (error: any) => showToast.error(error.message || 'Failed to delete user'),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AdminUserFormData>({
    resolver: zodResolver(adminUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'ADMIN',
      isActive: true,
    },
  });

  const openCreateModal = () => {
    setEditingUser(null);
    reset({
      name: '',
      email: '',
      password: '',
      role: 'ADMIN',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    reset({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      isActive: user.isActive,
    });
    setIsModalOpen(true);
  };

  const openChangePasswordModal = (user: AdminUser) => {
    setEditingUser(user);
    reset({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      isActive: user.isActive,
    });
    setIsModalOpen(true);
  };

  const onFormSubmit = (data: AdminUserFormData) => {
    setIsSubmitting(true);
    if (editingUser) {
      const { password, ...updateData } = data;
      if (password) {
        updateMutation.mutate({ id: editingUser.id, data: { ...updateData, password } });
      } else {
        updateMutation.mutate({ id: editingUser.id, data: updateData });
      }
    } else {
      createMutation.mutate(data);
    }
  };

  // const onPasswordSubmit = (data: AdminUserFormData) => {
  //   if (!data.password) {
  //     showToast.error('Password is required');
  //     return;
  //   }
  //   changePasswordMutation.mutate({ id: editingUser!.id, password: data.password });
  // };

  const columns = [
    { key: 'name', header: 'Name', render: (user: AdminUser) => (
      <div>
        <p className="font-medium text-gray-900">{user.name}</p>
        <p className="text-sm text-gray-500">{user.email}</p>
      </div>
    )},
    { key: 'role', header: 'Role', render: (user: AdminUser) => (
      <Badge variant={user.role === 'SUPER_ADMIN' ? 'primary' : user.role === 'ADMIN' ? 'info' : 'gray'}>
        {ADMIN_ROLE_LABELS[user.role]}
      </Badge>
    )},
    { key: 'isActive', header: 'Status', render: (user: AdminUser) => (
      <Badge variant={user.isActive ? 'success' : 'gray'}>
        {user.isActive ? 'Active' : 'Inactive'}
      </Badge>
    )},
    { key: 'createdAt', header: 'Created', render: (user: AdminUser) => user.createdAt },
    {
      key: 'actions',
      header: 'Actions',
      render: (user: AdminUser) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEditModal(user)}
            className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            aria-label="Edit user"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => openChangePasswordModal(user)}
            className="p-1.5 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50"
            aria-label="Change password"
          >
            <KeyIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setDeleteConfirm(user)}
            className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50"
            aria-label="Delete user"
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
          <h1 className="text-2xl font-bold text-gray-900">Admin Users</h1>
          <p className="text-gray-600">Manage administrator accounts</p>
        </div>
        <Button onClick={openCreateModal}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Admin
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="search"
              placeholder="Search users..."
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
        keyExtractor={(u) => u.id}
        isLoading={isLoading}
        emptyMessage="No admin users found"
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
        onClose={() => { setIsModalOpen(false); setEditingUser(null); }}
        title={editingUser ? 'Edit Admin User' : 'Create Admin User'}
        size="md"
      >
        <form onSubmit={handleSubmit(editingUser ? onFormSubmit : onFormSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              {...register('name')}
              id="name"
              placeholder="John Doe"
              error={errors.name?.message}
            />
            <FormError message={errors.name?.message} />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              {...register('email')}
              id="email"
              type="email"
              placeholder="john@example.com"
              error={errors.email?.message}
            />
            <FormError message={errors.email?.message} />
          </div>

          <div>
            <Label htmlFor="password">{editingUser ? 'New Password (leave blank to keep current)' : 'Password *'} </Label>
            <Input
              {...register('password')}
              id="password"
              type="password"
              placeholder={editingUser ? '••••••••' : 'StrongPassword123!'}
              error={errors.password?.message}
            />
            <FormError message={errors.password?.message} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Role *</Label>
              <Select
                {...register('role')}
                id="role"
                error={errors.role?.message}
              >
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
              </Select>
              <FormError message={errors.role?.message} />
            </div>

            <div className="flex items-center pt-6">
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
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingUser(null); }}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
        title="Delete Admin User"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}