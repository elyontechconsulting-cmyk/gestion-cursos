import Swal, { type SweetAlertIcon } from 'sweetalert2';
import { mensajeError } from '@/utils/errors';

const isDark = () => document.documentElement.classList.contains('dark');

const base = () =>
  Swal.mixin({
    background: isDark() ? '#14161c' : '#ffffff',
    color: isDark() ? '#e4e4e7' : '#18181b',
    confirmButtonColor: '#4f46e5',
    cancelButtonColor: isDark() ? '#3f3f46' : '#a1a1aa',
    customClass: { popup: 'rounded-2xl' },
    buttonsStyling: true,
    // Los diálogos solo se cierran con sus botones
    allowOutsideClick: false,
    allowEscapeKey: false,
  });

const toastMixin = () =>
  base().mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (t) => {
      t.addEventListener('mouseenter', Swal.stopTimer);
      t.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });

export const notify = {
  toast(title: string, icon: SweetAlertIcon = 'success') {
    return toastMixin().fire({ icon, title });
  },
  success(title: string, text?: string) {
    return toastMixin().fire({ icon: 'success', title, text });
  },
  error(err: unknown, title = 'No se pudo completar') {
    return base().fire({ icon: 'error', title, text: mensajeError(err) });
  },
  info(title: string, text?: string) {
    return base().fire({ icon: 'info', title, text });
  },
  async confirm(opts: { title: string; text?: string; confirmText?: string; cancelText?: string; danger?: boolean; icon?: SweetAlertIcon }): Promise<boolean> {
    const r = await base().fire({
      icon: opts.icon ?? (opts.danger ? 'warning' : 'question'),
      title: opts.title,
      text: opts.text,
      showCancelButton: true,
      confirmButtonText: opts.confirmText ?? 'Confirmar',
      cancelButtonText: opts.cancelText ?? 'Cancelar',
      confirmButtonColor: opts.danger ? '#dc2626' : '#4f46e5',
      reverseButtons: true,
      focusCancel: opts.danger,
    });
    return r.isConfirmed;
  },
  async select(opts: { title: string; options: Record<string, string>; value?: string }): Promise<string | null> {
    const r = await base().fire({
      title: opts.title,
      input: 'select',
      inputOptions: opts.options,
      inputValue: opts.value,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
    });
    return r.isConfirmed ? String(r.value) : null;
  },
  async prompt(opts: { title: string; label?: string; placeholder?: string; required?: boolean }): Promise<string | null> {
    const r = await base().fire({
      title: opts.title,
      input: 'text',
      inputLabel: opts.label,
      inputPlaceholder: opts.placeholder,
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar',
      inputValidator: (v) => (opts.required && !v.trim() ? 'Este campo es obligatorio' : undefined),
    });
    return r.isConfirmed ? String(r.value ?? '') : null;
  },
};
