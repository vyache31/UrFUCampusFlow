import { useEffect, useState, useRef } from 'react';
import { CloseIcon } from '../Icons/Icons';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

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
  duration = 8000, 
  onClose, 
  showConfirm = false, 
  onConfirm, 
  onCancel,
  confirmText = 'ОК',
  cancelText = 'Отмена'
}: ToastProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!showConfirm && !isHovered) {
      timerRef.current = setTimeout(() => {
        onClose(id);
      }, duration);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [id, duration, onClose, showConfirm, isHovered]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!showConfirm) {
      timerRef.current = setTimeout(() => {
        onClose(id);
      }, duration);
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose(id);
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose(id);
  };

  return (
    <div 
      className={`toast toast--${type}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="toast-header">
        <div className="toast-icon">{getIcon()}</div>
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