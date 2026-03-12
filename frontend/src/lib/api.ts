const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export class ApiError extends Error {
  status: number;
  errors: Record<string, string> | null;

  constructor(
    status: number,
    message: string,
    errors: Record<string, string> | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  emailOrPasswordInvalid: 'Email ou senha invalidos',
  emailAlreadyExists: 'Este email ja esta cadastrado',
  'needLoginViaProvider:google':
    'Este email esta vinculado ao Google. Use o login com Google.',
  invalidHash: 'Link invalido ou expirado',
  incorrectOldPassword: 'Senha atual incorreta',
};

function parseErrorBody(body: unknown): {
  message: string;
  errors: Record<string, string> | null;
} {
  if (!body || typeof body !== 'object') {
    return { message: 'Erro desconhecido', errors: null };
  }

  const obj = body as Record<string, unknown>;

  // Shape 1: NestJS default { message: string | string[], error: string, statusCode: number }
  if ('message' in obj && obj.message) {
    const msg = Array.isArray(obj.message)
      ? obj.message.join('. ')
      : String(obj.message);
    return { message: msg, errors: null };
  }

  // Shape 2: Custom app { status: number, errors: { field: "code" } }
  if ('errors' in obj && obj.errors && typeof obj.errors === 'object') {
    const errorEntries = Object.entries(obj.errors as Record<string, string>);
    const errors = obj.errors as Record<string, string>;
    const translatedMessages = errorEntries.map(
      ([, code]) => ERROR_MESSAGES[code] ?? code,
    );
    return {
      message: translatedMessages.join('. '),
      errors,
    };
  }

  return { message: 'Erro desconhecido', errors: null };
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;

  const response = await fetch(`${API_URL}/v1${endpoint}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const rawBody = await response.json().catch(() => null);
    const { message, errors } = parseErrorBody(rawBody);
    throw new ApiError(response.status, message, errors);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  provider: string;
  socialId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface LoginResponse {
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
}

export const api = {
  auth: {
    me: () => request<User>('/auth/me'),

    emailLogin: (data: { email: string; password: string }) =>
      request<LoginResponse>('/auth/email/login', {
        method: 'POST',
        body: data,
      }),

    emailRegister: (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    }) => request<void>('/auth/email/register', { method: 'POST', body: data }),

    googleLogin: (data: { idToken: string }) =>
      request<LoginResponse>('/auth/google/login', {
        method: 'POST',
        body: data,
      }),

    confirmEmail: (data: { hash: string }) =>
      request<void>('/auth/email/confirm', { method: 'POST', body: data }),

    confirmNewEmail: (data: { hash: string }) =>
      request<void>('/auth/email/confirm/new', { method: 'POST', body: data }),

    forgotPassword: (data: { email: string }) =>
      request<void>('/auth/forgot/password', { method: 'POST', body: data }),

    resetPassword: (data: { hash: string; password: string }) =>
      request<void>('/auth/reset/password', { method: 'POST', body: data }),

    update: (data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
      oldPassword?: string;
    }) => request<User>('/auth/me', { method: 'PATCH', body: data }),

    logout: () => request<void>('/auth/logout', { method: 'POST' }),

    deleteAccount: () => request<void>('/auth/me', { method: 'DELETE' }),
  },
};
