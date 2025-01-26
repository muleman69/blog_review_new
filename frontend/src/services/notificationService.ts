import { toast, ToastOptions } from 'react-toastify';

const defaultOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

class NotificationService {
  static success(message: string, options?: ToastOptions) {
    toast.success(message, { ...defaultOptions, ...options });
  }

  static error(message: string, options?: ToastOptions) {
    toast.error(message, { ...defaultOptions, ...options });
  }

  static info(message: string, options?: ToastOptions) {
    toast.info(message, { ...defaultOptions, ...options });
  }

  static warning(message: string, options?: ToastOptions) {
    toast.warning(message, { ...defaultOptions, ...options });
  }

  static loading(message: string, options?: ToastOptions) {
    return toast.loading(message, { ...defaultOptions, ...options });
  }

  static dismiss(toastId?: number | string) {
    toast.dismiss(toastId);
  }

  static update(toastId: number | string, message: string, type: 'success' | 'error' | 'info' | 'warning') {
    toast.update(toastId, {
      render: message,
      type,
      isLoading: false,
      ...defaultOptions,
    });
  }
}

export default NotificationService; 