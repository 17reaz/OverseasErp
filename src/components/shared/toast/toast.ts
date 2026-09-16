// =====================================================
// GLOBAL TOAST
// =====================================================

export type ToastType =
  | "success"
  | "error"
  | "info"
  | "warning";
export interface ToastAction {
  label: string;
  onClick: () => void;
}
export interface ToastOptions {
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
  action?: ToastAction;   // toast er vitorer button
  dismissible?: boolean;
}

type ToastListener = (
  toast: ToastOptions,
) => void;

const listeners =
  new Set<ToastListener>();

function notify(
  toast: ToastOptions,
) {
  listeners.forEach(
    (listener) => {
      listener(toast);
    },
  );
}

export const toast = {

  success(
    title: string,
    description?: string,
  ) {
    notify({
      title,
      description,
      type: "success",
    });
  },

  error(
    title: string,
    description?: string,
  ) {
    notify({
      title,
      description,
      type: "error",
    });
  },

  info(
    title: string,
    description?: string,
  ) {
    notify({
      title,
      description,
      type: "info",
    });
  },

  warning(
    title: string,
    description?: string,
  ) {
    notify({
      title,
      description,
      type: "warning",
    });
  },

  subscribe(
    listener: ToastListener,
  ) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
   show(options: ToastOptions) {
    notify(options);
  },

};