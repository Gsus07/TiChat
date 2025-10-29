export type AlertType = 'success' | 'error' | 'warning' | 'info';

export function showAlert(message: string, type: AlertType = 'info', duration: number = 5000): void {
  if (typeof window === 'undefined') return;

  const globalFn = (window as any).showGlobalNotification;
  if (typeof globalFn === 'function') {
    globalFn(message, type, duration);
    return;
  }

  // Fallback to custom event if provider isn't hydrated yet
  const event = new CustomEvent('showNotification', {
    detail: { id: '', message, type, duration }
  });
  window.dispatchEvent(event);
}

export const alertSuccess = (message: string, duration?: number) => showAlert(message, 'success', duration ?? 5000);
export const alertError = (message: string, duration?: number) => showAlert(message, 'error', duration ?? 6000);
export const alertWarning = (message: string, duration?: number) => showAlert(message, 'warning', duration ?? 5000);
export const alertInfo = (message: string, duration?: number) => showAlert(message, 'info', duration ?? 4000);