import { useCallback, useEffect, useRef, useState } from 'react';
import { CloseIcon } from '../Icons/Icons';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

const TOAST_ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
};

const DEFAULT_DURATION_MS = 8000;

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: (id: string) => void;
  showConfirm?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const Toast = ({
  id,
  message,
  type,
  duration = DEFAULT_DURATION_MS,
  onClose,
  showConfirm = false,
  onConfirm,
  onCancel,
  confirmText = 'ОК',
  cancelText = 'Отмена',
}: ToastProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearTimer();
    if (showConfirm) return;
    timerRef.current = setTimeout(() => onClose(id), duration);
  }, [clearTimer, duration, id, onClose, showConfirm]);

  useEffect(() => {
    if (!isHovered) scheduleClose();
    return clearTimer;
  }, [isHovered, scheduleClose, clearTimer]);

  const handleConfirm = () => {
    onConfirm?.();
    onClose(id);
  };

  const handleCancel = () => {
    onCancel?.();
    onClose(id);
  };

  return (
    <div
      className={`toast toast--${type}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="toast-header">
        <div className="toast-icon">{TOAST_ICONS[type]}</div>
        <button className="toast-close" onClick={() => onClose(id)}>
          <CloseIcon />
        </button>
      </div>
      <div className="toast-body">
        <p className="toast-message">{message}</p>
      </div>
      {showConfirm && (
        <div className="toast-footer toast-footer--double">
          <button className="toast-cancel-btn" onClick={handleCancel}>
            {cancelText}
          </button>
          <button className="toast-confirm-btn" onClick={handleConfirm}>
            {confirmText}
          </button>
        </div>
      )}
    </div>
  );
};

export default Toast;