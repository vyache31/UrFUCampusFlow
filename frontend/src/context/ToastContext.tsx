import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { ToastType } from '../components/common/Toast/Toast';
import Toast from '../components/common/Toast/Toast';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  showConfirm?: boolean;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  onCancel?: () => void;
}

interface ToastContextValue {
  showToast: (options: {
    message: string;
    type: ToastType;
    duration?: number;
    showConfirm?: boolean;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    onCancel?: () => void;
  }) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showConfirm: (options: {
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
  }) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback(({
    message,
    type,
    duration = 6000,
    showConfirm = false,
    onConfirm,
    confirmText = 'ОК',
    cancelText = 'Отмена',
    onCancel,
  }: {
    message: string;
    type: ToastType;
    duration?: number;
    showConfirm?: boolean;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    onCancel?: () => void;
  }) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, {
      id,
      message,
      type,
      duration,
      showConfirm,
      onConfirm,
      confirmText,
      cancelText,
      onCancel,
    }]);
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'success', duration });
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'error', duration });
  }, [showToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'info', duration });
  }, [showToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'warning', duration });
  }, [showToast]);

  const showConfirm = useCallback(({
    message,
    onConfirm,
    onCancel,
    confirmText = 'Да',
    cancelText = 'Нет',
  }: {
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
  }) => {
    showToast({
      message,
      type: 'info',
      showConfirm: true,
      onConfirm,
      onCancel,
      confirmText,
      cancelText,
      duration: Infinity,
    });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo, showWarning, showConfirm }}>
      {children}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={removeToast}
          showConfirm={toast.showConfirm}
          onConfirm={toast.onConfirm}
          onCancel={toast.onCancel}
          confirmText={toast.confirmText}
          cancelText={toast.cancelText}
        />
      ))}
    </ToastContext.Provider>
  );
};