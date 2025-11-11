import { ToastType } from '../types/toast';

// This will be set by the App component
let toastHandler: ((type: ToastType, message: string, duration?: number) => void) | null = null;

export const setToastHandler = (handler: (type: ToastType, message: string, duration?: number) => void) => {
  toastHandler = handler;
};

export const showErrorToast = (message: string, duration?: number) => {
  if (toastHandler) {
    toastHandler('error', message, duration);
  } else {
    console.error(message);
  }
};

export const showSuccessToast = (message: string, duration?: number) => {
  if (toastHandler) {
    toastHandler('success', message, duration);
  } else {
    console.log(message);
  }
};

export const showWarningToast = (message: string, duration?: number) => {
  if (toastHandler) {
    toastHandler('warning', message, duration);
  } else {
    console.warn(message);
  }
};

export const showInfoToast = (message: string, duration?: number) => {
  if (toastHandler) {
    toastHandler('info', message, duration);
  } else {
    console.info(message);
  }
};

export const handleApiError = (error: unknown, context?: string): string => {
  let message = 'An unexpected error occurred';
  
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }
  
  if (context) {
    message = `${context}: ${message}`;
  }
  
  showErrorToast(message);
  return message;
};
