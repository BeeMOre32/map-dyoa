/**
 * 폼 액션 훅
 * 서버 액션 실행 및 에러 처리, 로딩 상태를 통합 관리
 */

'use client';

import { useCallback, useState } from 'react';
import { ActionResult } from '@/types/api-response';

interface UseFormActionOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  onSettled?: () => void;
}

/**
 * 서버 액션 호출 및 상태 관리
 */
export function useFormAction<T extends Record<string, any>, R = null>(
  action: (data: T) => Promise<ActionResult<R>>,
  options?: UseFormActionOptions<R>,
) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (data: T): Promise<ActionResult<R>> => {
      setIsPending(true);
      setError(null);

      try {
        const result = await action(data);

        if (result.success) {
          options?.onSuccess?.(result.data);
        } else {
          setError(result.error);
          options?.onError?.(result.error);
        }

        options?.onSettled?.();
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : '알 수 없는 오류가 발생했습니다.';
        setError(errorMessage);
        options?.onError?.(errorMessage);
        options?.onSettled?.();

        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsPending(false);
      }
    },
    [action, options],
  );

  const resetError = useCallback(() => setError(null), []);

  return {
    submit,
    isPending,
    error,
    resetError,
  };
}
