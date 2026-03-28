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
  onboardingCompleted: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  onboardingCompleted: boolean;
  mustChangePassword: boolean;
}

export interface CandidateProfile {
  userId: string;
  email: string | null;
  cpf: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  onboardingCompleted: boolean;
  universityOfOrigin: string;
  ira: string | null;
  poscomp: number | null;
  createdAt: string;
  updatedAt: string;
}

function normalizeUser(data: unknown): User {
  const user = data as Record<string, unknown>;

  return {
    id: String(user.id ?? ''),
    email: (user.email as string | null | undefined) ?? null,
    cpf: (user.cpf as string | null | undefined) ?? null,
    firstName: (user.firstName as string | null | undefined) ?? null,
    lastName: (user.lastName as string | null | undefined) ?? null,
    role: String(user.role ?? ''),
    status: String(user.status ?? ''),
    onboardingCompleted: Boolean(user.onboardingCompleted),
    mustChangePassword: Boolean(user.mustChangePassword),
    createdAt: String(user.createdAt ?? ''),
    updatedAt: String(user.updatedAt ?? ''),
  };
}

function normalizeLoginResponse(data: unknown): LoginResponse {
  const login = data as Record<string, unknown>;

  return {
    userId: String(login.userId ?? ''),
    email: (login.email as string | null | undefined) ?? null,
    firstName: (login.firstName as string | null | undefined) ?? null,
    lastName: (login.lastName as string | null | undefined) ?? null,
    role: String(login.role ?? ''),
    status: String(login.status ?? ''),
    onboardingCompleted: Boolean(login.onboardingCompleted),
    mustChangePassword: Boolean(login.mustChangePassword),
  };
}

function normalizeCandidateProfile(data: unknown): CandidateProfile {
  const candidate = data as Record<string, unknown>;

  return {
    userId: String(candidate.userId ?? ''),
    email: (candidate.email as string | null | undefined) ?? null,
    cpf: (candidate.cpf as string | null | undefined) ?? null,
    firstName: (candidate.firstName as string | null | undefined) ?? null,
    lastName: (candidate.lastName as string | null | undefined) ?? null,
    role: String(candidate.role ?? ''),
    status: String(candidate.status ?? ''),
    onboardingCompleted: Boolean(candidate.onboardingCompleted),
    universityOfOrigin: String(candidate.universityOfOrigin ?? ''),
    ira: (candidate.ira as string | null | undefined) ?? null,
    poscomp:
      typeof candidate.poscomp === 'number'
        ? candidate.poscomp
        : candidate.poscomp == null
          ? null
          : Number(candidate.poscomp),
    createdAt: String(candidate.createdAt ?? ''),
    updatedAt: String(candidate.updatedAt ?? ''),
  };
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

export const api = {
  auth: {
    me: async () => normalizeUser(await request('/auth/me')),

    emailLogin: (data: { email: string; password: string }) =>
      request('/auth/provider/email/login', {
        method: 'POST',
        body: data,
      }).then(normalizeLoginResponse),

    emailRegister: (data: EmailRegisterData) =>
      request<void>('/auth/provider/email/register', {
        method: 'POST',
        body: data,
      }),

    googleLogin: (data: { idToken: string }) =>
      request('/auth/provider/google', {
        method: 'POST',
        body: data,
      }).then(normalizeLoginResponse),

    completeCandidateOnboarding: (data: CandidateOnboardingData) =>
      request('/auth/onboarding/candidate', {
        method: 'POST',
        body: data,
      }).then(normalizeUser),

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
      request('/auth/me', { method: 'PATCH', body: data }).then(normalizeUser),

    logout: () => request<void>('/auth/logout', { method: 'POST' }),

    deleteAccount: () => request<void>('/auth/me', { method: 'DELETE' }),
  },
  candidates: {
    me: async () => normalizeCandidateProfile(await request('/candidates/me')),
  },
};
