import toast, { Toaster as ToastComponent, ToastOptions } from 'react-hot-toast';

export const showToast = {
  success: (message: string, options?: ToastOptions) =>
    toast.success(message, options),
  error: (message: string, options?: ToastOptions) =>
    toast.error(message, options),
  info: (message: string, options?: ToastOptions) =>
    toast(message, { icon: 'ℹ️', ...options }),
  loading: (message: string, options?: ToastOptions) =>
    toast.loading(message, options),
  dismiss: (id: string) => toast.dismiss(id),
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => toast.promise(promise, messages),
};

export { ToastComponent as Toaster };