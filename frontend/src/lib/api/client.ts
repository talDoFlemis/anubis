import axios, { type AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export class ApiError extends Error {
  status: number;
  legacyErrors: Record<string, string> | null;

  constructor(status: number, message: string, legacyErrors: Record<string, string> | null = null) {
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
    .map(([field, fieldValue]) => [field, normalizeMessage(fieldValue)] as const)
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

export const apiClient = axios.create({
  baseURL: `${API_URL}/v1`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Transform Axios errors into our domain ApiError
apiClient.interceptors.response.use(
  response => response,
  (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    const { message, legacyErrors } = parseErrorBody(error.response?.data);
    throw new ApiError(status, message, legacyErrors);
  },
);

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
