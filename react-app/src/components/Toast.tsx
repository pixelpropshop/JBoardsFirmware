import React, { useEffect, useState } from 'react';
import { Toast as ToastType } from '../types/toast';
import { useToast } from '../contexts/ToastContext';

interface ToastProps {
  toast: ToastType;
}

const Toast: React.FC<ToastProps> = ({ toast }) => {
  const { dismissToast } = useToast();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => dismissToast(toast.id), 300);
      }, toast.duration - 300);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, dismissToast]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => dismissToast(toast.id), 300);
  };

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  }[toast.type];

  const icon = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  }[toast.type];

  return (
    <div
      className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg mb-2 flex items-center justify-between min-w-[300px] max-w-md transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold">{icon}</span>
        <span className="text-sm">{toast.message}</span>
      </div>
      <button
        onClick={handleDismiss}
        className="ml-4 text-white hover:text-gray-200 transition-colors"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
};
