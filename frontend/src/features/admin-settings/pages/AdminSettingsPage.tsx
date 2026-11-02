import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/lib/api';
import { StoreSettings, UpdateSettingsDto } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { showToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input, Label, FormError, Textarea } from '@/components/ui/Input';
import { cn } from '@/utils/helpers';

const settingsSchema = z.object({
  storeName: z.string().min(1, 'Store name is required').max(100),
  storeDescription: z.string().optional(),
  whatsappNumber: z.string().max(30).optional(),
  currency: z.string().max(10).optional(),
  storeAddress: z.string().optional(),
  announcement: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: () => settingsApi.adminGet(),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateSettingsDto) => settingsApi.adminUpdate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
      queryClient.invalidateQueries({ queryKey: ['publicSettings'] });
      showToast.success('Settings updated successfully');
      setIsSubmitting(false);
    },
    onError: (error: any) => {
      showToast.error(error.message || 'Failed to update settings');
      setIsSubmitting(false);
    },
  });

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      storeName: '',
      storeDescription: '',
      whatsappNumber: '',
      currency: 'IDR',
      storeAddress: '',
      announcement: '',
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        storeName: settings.storeName,
        storeDescription: settings.storeDescription || '',
        whatsappNumber: settings.whatsappNumber,
        currency: settings.currency,
        storeAddress: settings.storeAddress || '',
        announcement: settings.announcement || '',
      });
    }
  }, [settings, reset]);

  const onSubmit = (data: SettingsFormData) => {
    setIsSubmitting(true);
    updateMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
        <p className="text-gray-600">Manage your store configuration</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">General Settings</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="storeName">Store Name *</Label>
              <Input
                {...register('storeName')}
                id="storeName"
                placeholder="My Store"
                error={errors.storeName?.message}
              />
              <FormError message={errors.storeName?.message} />
            </div>

            <div>
              <Label htmlFor="storeDescription">Store Description</Label>
              <Textarea
                {...register('storeDescription')}
                id="storeDescription"
                rows={3}
                placeholder="Welcome to our store..."
              />
            </div>

            <div>
              <Label htmlFor="whatsappNumber">WhatsApp Number *</Label>
              <Input
                {...register('whatsappNumber')}
                id="whatsappNumber"
                type="tel"
                placeholder="6281234567890"
                error={errors.whatsappNumber?.message}
              />
              <FormError message={errors.whatsappNumber?.message} />
              <p className="mt-1 text-xs text-gray-500">International format without + or spaces (e.g., 6281234567890)</p>
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input
                {...register('currency')}
                id="currency"
                placeholder="IDR"
                error={errors.currency?.message}
              />
            </div>

            <div>
              <Label htmlFor="storeAddress">Store Address</Label>
              <Textarea
                {...register('storeAddress')}
                id="storeAddress"
                rows={3}
                placeholder="Jl. Contoh No. 123, Jakarta"
              />
            </div>

            <div>
              <Label htmlFor="announcement">Announcement / Banner</Label>
              <Textarea
                {...register('announcement')}
                id="announcement"
                rows={2}
                placeholder="Free shipping for orders over 500k!"
              />
              <p className="mt-1 text-xs text-gray-500">Displayed at the top of the store</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting}>
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}