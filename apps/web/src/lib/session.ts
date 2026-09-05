import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session-constants";

export async function getSession(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

// El token de sesión es el JWT tal cual lo emite la API. Se decodifica el
// payload (sin verificar firma, aquí solo se usa para mostrar datos en la UI;
// la API sigue siendo quien valida el token en cada request protegido).
export async function getSessionUser(): Promise<{ email: string } | null> {
  const token = await getSession();
  if (!token) return null;

  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const email = claims.email ?? claims.sub;
    return typeof email === "string" ? { email } : null;
  } catch {
    return null;
  }
}
