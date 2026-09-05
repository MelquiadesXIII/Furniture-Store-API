import { apiFetch } from "@/lib/api/client";
import type { Result } from "@/lib/result";
import type { AuthResult } from "@/modules/auth/types";

export function login(email: string, password: string): Promise<Result<AuthResult>> {
  return apiFetch<AuthResult>("/api/Authentication/Login", {
    method: "POST",
    body: { email, password },
  });
}

export function register(
  name: string,
  emailAddress: string,
  password: string,
): Promise<Result<AuthResult>> {
  return apiFetch<AuthResult>("/api/Authentication/Register", {
    method: "POST",
    body: { name, emailAddress, password },
  });
}
