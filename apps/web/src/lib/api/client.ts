const API_BASE_URL = process.env.API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("API_BASE_URL no está configurada (ver apps/web/.env.example)");
}

export class ApiError extends Error {
  status: number;
  errors: string[];

  constructor(status: number, errors: string[]) {
    super(errors[0] ?? `Error de la API (${status})`);
    this.status = status;
    this.errors = errors;
  }
}

type ApiFetchInit = Omit<RequestInit, "body"> & { body?: unknown };

export async function apiFetch<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const { body, headers, ...rest } = init;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errors: string[] = data?.errors ?? [data?.title ?? `Error de la API (${res.status})`];
    throw new ApiError(res.status, errors);
  }

  return data as T;
}
