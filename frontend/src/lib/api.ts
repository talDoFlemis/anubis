const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export class ApiError extends Error {
  status: number;
  legacyErrors: Record<string, string> | null;

  constructor(
    status: number,
    message: string,
    legacyErrors: Record<string, string> | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.legacyErrors = legacyErrors;
  }
}

export type AuthProvider = 'email' | 'google' | (string & {});

function normalizeProviderName(provider: string): string {
  if (provider === 'google') {
    return 'Google';
  }

  if (provider === 'email') {
    return 'email e senha';
  }

  return provider;
}

export function formatProviderLabel(provider: string): string {
  return normalizeProviderName(provider);
}

function normalizeMessage(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.join('. ');
  }

  return String(value);
}

function normalizeErrors(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const normalizedEntries = Object.entries(value as Record<string, unknown>)
    .map(
      ([field, fieldValue]) => [field, normalizeMessage(fieldValue)] as const,
    )
    .filter((entry): entry is [string, string] => Boolean(entry[1]));

  if (normalizedEntries.length === 0) {
    return null;
  }

  return Object.fromEntries(normalizedEntries);
}

function parseErrorBody(body: unknown): {
  message: string;
  legacyErrors: Record<string, string> | null;
} {
  if (!body || typeof body !== 'object') {
    return { message: 'Erro desconhecido', legacyErrors: null };
  }

  const obj = body as Record<string, unknown>;
  const message = 'message' in obj ? normalizeMessage(obj.message) : null;
  const legacyErrors = 'errors' in obj ? normalizeErrors(obj.errors) : null;

  return {
    message: message ?? 'Erro desconhecido',
    legacyErrors,
  };
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
    const { message, legacyErrors } = parseErrorBody(rawBody);
    throw new ApiError(response.status, message, legacyErrors);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export interface User {
  id: string;
  email: string | null;
  cpf: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  linkedProviders: AuthProvider[];
  onboardingCompleted: boolean;
  mustChangePassword: boolean;
  ownedEmails?: UserOwnedEmail[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface UserOwnedEmail {
  accountId: string | null;
  email: string;
  isPrimary: boolean;
  verifiedAt?: string | null;
}

export interface LoginResponse {
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  linkedProviders: AuthProvider[];
  onboardingCompleted: boolean;
  mustChangePassword: boolean;
}

export interface EmailRegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  cpf: string;
  universityOfOrigin: string;
}

export interface CandidateOnboardingData {
  firstName: string;
  lastName: string;
  cpf: string;
  universityOfOrigin: string;
  ira?: string;
  poscomp?: number;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  cpf?: string;
  password?: string;
  oldPassword?: string;
}

export interface LinkEmailProviderData {
  password: string;
  provider: AuthProvider;
  providerToken?: string;
  ownedEmailAccountId?: string;
}

export const api = {
  auth: {
    me: () => request<User>('/auth/me'),

    emailLogin: (data: { email: string; password: string }) =>
      request<LoginResponse>('/auth/provider/email/login', {
        method: 'POST',
        body: data,
      }),

    emailRegister: (data: EmailRegisterData) =>
      request<void>('/auth/provider/email/register', {
        method: 'POST',
        body: data,
      }),

    googleLogin: (data: { idToken: string }) =>
      request<LoginResponse>('/auth/provider/google/login', {
        method: 'POST',
        body: data,
      }),

    linkGoogleProvider: (data: { idToken: string }) =>
      request<User>('/auth/provider/google/link', {
        method: 'POST',
        body: data,
      }),

    completeCandidateOnboarding: (data: CandidateOnboardingData) =>
      request<User>('/auth/onboarding/candidate', {
        method: 'POST',
        body: data,
      }),

    linkEmailProvider: (data: LinkEmailProviderData) =>
      request<User>('/auth/provider/email/link', {
        method: 'POST',
        body: data,
      }),

    confirmEmail: (data: { hash: string }) =>
      request<void>('/auth/provider/email/confirm', {
        method: 'POST',
        body: data,
      }),

    confirmNewEmail: (data: { hash: string }) =>
      request<void>('/auth/provider/email/confirm/new', {
        method: 'POST',
        body: data,
      }),

    forgotPassword: (data: { email: string }) =>
      request<void>('/auth/provider/email/forgot/password', {
        method: 'POST',
        body: data,
      }),

    resetPassword: (data: { hash: string; password: string }) =>
      request<void>('/auth/provider/email/reset/password', {
        method: 'POST',
        body: data,
      }),

    update: (data: UpdateUserData) =>
      request<User>('/auth/me', { method: 'PATCH', body: data }),

    logout: () => request<void>('/auth/logout', { method: 'POST' }),

    deleteAccount: () => request<void>('/auth/me', { method: 'DELETE' }),
  },
};
