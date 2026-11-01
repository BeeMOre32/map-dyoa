'use client';

import { Button, Modal } from '@heroui/react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  message,
  confirmLabel = '삭제',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen
      onOpenChange={(next) => {
        if (!next && !isLoading) onCancel();
      }}
    >
      <Modal.Backdrop
        variant="blur"
        className="bg-slate-900/40 dark:bg-slate-950/60"
        isDismissable={!isLoading}
        isKeyboardDismissDisabled={isLoading}
      >
        <Modal.Container placement="center" size="sm">
          <Modal.Dialog className="max-w-xs border border-slate-100 dark:border-slate-800">
            <Modal.Body className="gap-5">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
                  <AlertTriangle className="h-6 w-6 text-red-500 dark:text-red-400" />
                </div>
                <p className="text-sm font-bold leading-relaxed text-slate-700 dark:text-slate-200">
                  {message}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="secondary"
                  onPress={onCancel}
                  isDisabled={isLoading}
                >
                  취소
                </Button>
                <Button
                  className="flex-1"
                  variant="danger"
                  onPress={onConfirm}
                  isDisabled={isLoading}
                >
                  {isLoading ? '처리 중...' : confirmLabel}
                </Button>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
