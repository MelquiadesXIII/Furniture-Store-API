import { NextResponse } from "next/server";
import { register } from "@/modules/auth/api";
import { ApiError } from "@/lib/api/client";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session-constants";

export async function POST(request: Request) {
  const { name, emailAddress, password } = await request.json();

  try {
    const result = await register(name, emailAddress, password);

    if (!result.token) {
      return NextResponse.json({ errors: ["No se pudo crear la cuenta."] }, { status: 502 });
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
