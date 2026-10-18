'use client';

import { useMemo } from 'react';
import { Toast, toast } from '@heroui/react';

type ToastOptions = {
  actionLabel?: string;
  onAction?: () => void;
};

function show(kind: 'success' | 'danger', message: string, options?: ToastOptions) {
  const notify = kind === 'success' ? toast.success : toast.danger;
  if (!options?.actionLabel || !options.onAction) {
    notify(message);
    return;
  }
  const onAction = options.onAction;
  let id = '';
  id = notify(message, {
    actionProps: {
      children: options.actionLabel,
      onPress: () => {
        onAction();
        toast.close(id);
      },
    },
  });
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toast.Provider className="z-[300]" placement="bottom end" width={320} />
    </>
  );
}

export function useToast() {
  return useMemo(
    () => ({
      success: (message: string, options?: ToastOptions) => show('success', message, options),
      error: (message: string, options?: ToastOptions) => show('danger', message, options),
    }),
    [],
  );
}
