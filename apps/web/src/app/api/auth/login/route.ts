import { NextResponse } from "next/server";
import { login } from "@/modules/auth/api";
import { ApiError } from "@/lib/api/client";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session-constants";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  try {
    const result = await login(email, password);

    if (!result.token) {
      return NextResponse.json({ errors: ["No se pudo iniciar sesión."] }, { status: 502 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, result.token, sessionCookieOptions);
    return response;
  } catch (err) {
    const errors = err instanceof ApiError ? err.errors : ["No se pudo conectar con el servidor."];
    const status = err instanceof ApiError ? err.status : 502;
    return NextResponse.json({ errors }, { status });
  }
}
