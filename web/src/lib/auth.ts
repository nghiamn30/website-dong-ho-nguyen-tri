export interface Role {
  code: string;
  name: string;
}

export interface CurrentUser {
  id: string;
  employeeCode: string;
  name: string;
  roles: Role[];
  permissions: string[];
  defaultPath: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: string;
  user: CurrentUser;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";

export function createApiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

export function clearAccessToken() {
  // The access token is stored in a server-set HttpOnly cookie.
  // Client code cannot and should not read or overwrite it.
}

async function readError(response: Response) {
  try {
    const body = (await response.json()) as {
      message?: string | string[];
      code?: string;
    };
    const message = Array.isArray(body.message)
      ? body.message.join("\n")
      : body.message;
    return {
      message: message ?? "Yêu cầu không thành công.",
      code: body.code,
    };
  } catch {
    return {
      message: "Yêu cầu không thành công.",
      code: undefined,
    };
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  if (!headers.has("Content-Type") && options.body && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(createApiUrl(path), {
    ...options,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const error = await readError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as T;
}

export async function apiRequestBlob(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);

  const response = await fetch(createApiUrl(path), {
    ...options,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const error = await readError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return {
    blob: await response.blob(),
    filename: parseContentDispositionFilename(
      response.headers.get("Content-Disposition"),
    ),
  };
}

export async function login(employeeCode: string, password: string) {
  const result = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ employeeCode, password }),
  });

  return result;
}

export function getCurrentUser() {
  return apiRequest<CurrentUser>("/auth/me");
}

export async function logout() {
  try {
    await apiRequest<{ success: true }>("/auth/logout", {
      method: "POST",
    });
  } finally {
    clearAccessToken();
  }
}

function parseContentDispositionFilename(value: string | null) {
  if (!value) {
    return undefined;
  }

  const filenameMatch = value.match(/filename="([^"]+)"/);
  return filenameMatch?.[1];
}
