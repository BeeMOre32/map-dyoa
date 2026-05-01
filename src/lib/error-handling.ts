import { ZodError } from 'zod';
import { log } from 'next-axiom';
import { ErrorCode } from '@/types/api-response';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export function getErrorMessage(error: unknown): {
  message: string;
  code: string;
} {
  if (error instanceof ZodError) {
    return {
      message: error.issues[0]?.message ?? '입력값을 확인해주세요.',
      code: 'VALIDATION_ERROR',
    };
  }

  if (error instanceof ValidationError) {
    return {
      message: error.message,
      code: 'VALIDATION_ERROR',
    };
  }

  if (error instanceof NotFoundError) {
    return {
      message: error.message,
      code: 'NOT_FOUND',
    };
  }

  if (error instanceof BadRequestError) {
    return {
      message: error.message,
      code: 'VALIDATION_ERROR',
    };
  }

  if (error instanceof UnauthorizedError) {
    return {
      message: error.message,
      code: 'UNAUTHORIZED',
    };
  }

  if (error instanceof ForbiddenError) {
    return {
      message: error.message,
      code: 'FORBIDDEN',
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message || '알 수 없는 오류가 발생했습니다.',
      code: 'SERVER_ERROR',
    };
  }

  return {
    message: '알 수 없는 오류가 발생했습니다.',
    code: 'SERVER_ERROR',
  };
}

export function logError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  log.error(`[${context}] ${message}`, { error: String(error) });
}
