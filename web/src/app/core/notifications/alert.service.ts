import { Injectable, inject } from '@angular/core';
import Swal, {
  type SweetAlertCustomClass,
  type SweetAlertOptions,
  type SweetAlertResult,
} from 'sweetalert2';
import { ALERT_DEFAULT_OPTIONS } from './alert.tokens';

function readCssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function mergeCustomClass(...parts: (SweetAlertCustomClass | undefined)[]): SweetAlertCustomClass {
  return parts.reduce<SweetAlertCustomClass>((acc, p) => (p ? { ...acc, ...p } : acc), {});
}

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly injectedDefaults = inject(ALERT_DEFAULT_OPTIONS, { optional: true }) ?? {};

  merge(opts: SweetAlertOptions): SweetAlertOptions {
    const accent = readCssVar('--bc-color-accent', '#1e5f8f');
    const surface = readCssVar('--bc-color-surface', '#ffffff');
    const text = readCssVar('--bc-color-text', '#151922');
    const muted = readCssVar('--bc-color-muted', '#6b7280');

    const themeClasses: SweetAlertCustomClass = {
      popup: 'bc-swal-popup',
      confirmButton: 'bc-swal-btn bc-swal-btn--primary',
      cancelButton: 'bc-swal-btn bc-swal-btn--muted',
      denyButton: 'bc-swal-btn bc-swal-btn--primary',
    };

    const theme: SweetAlertOptions = {
      confirmButtonColor: accent,
      cancelButtonColor: muted,
      denyButtonColor: accent,
      background: surface,
      color: text,
      customClass: themeClasses,
    };

    const injected = this.injectedDefaults;
    const mergedCustom =
      typeof injected.customClass === 'object' && injected.customClass !== null
        ? mergeCustomClass(themeClasses, injected.customClass as SweetAlertCustomClass)
        : themeClasses;

    return {
      ...theme,
      ...injected,
      ...opts,
      customClass:
        typeof opts.customClass === 'object' && opts.customClass !== null
          ? mergeCustomClass(mergedCustom, opts.customClass as SweetAlertCustomClass)
          : mergedCustom,
    } as SweetAlertOptions;
  }

  fire(opts: SweetAlertOptions): Promise<SweetAlertResult> {
    return Swal.fire(this.merge(opts));
  }

  async error(text: string, title = 'Error'): Promise<void> {
    await this.fire({
      icon: 'error',
      title,
      text,
      confirmButtonText: 'Aceptar',
    });
  }

  /** Resuelve `true` si el usuario pulsa «Reintentar». */
  async errorWithRetry(text: string, title = 'Error'): Promise<boolean> {
    const r = await this.fire({
      icon: 'error',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: 'Reintentar',
      cancelButtonText: 'Cerrar',
    });
    return r.isConfirmed === true;
  }

  async confirmDanger(options: {
    title: string;
    text: string;
    confirmText?: string;
    cancelText?: string;
  }): Promise<boolean> {
    const danger = readCssVar('--bc-color-danger', '#c62828');
    const r = await this.fire({
      icon: 'warning',
      title: options.title,
      text: options.text,
      showCancelButton: true,
      confirmButtonText: options.confirmText ?? 'Eliminar',
      cancelButtonText: options.cancelText ?? 'Cancelar',
      confirmButtonColor: danger,
    });
    return r.isConfirmed === true;
  }

  async info(text: string, title?: string): Promise<void> {
    await this.fire({
      icon: 'info',
      title: title ?? 'Información',
      text,
      confirmButtonText: 'Aceptar',
    });
  }

  async success(text: string, title = 'Listo'): Promise<void> {
    await this.fire({
      icon: 'success',
      title,
      text,
      confirmButtonText: 'Aceptar',
    });
  }

  toastSuccess(message: string): void {
    void this.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3200,
      timerProgressBar: true,
      icon: 'success',
      title: message,
    });
  }
}
