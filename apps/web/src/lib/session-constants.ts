export const SESSION_COOKIE = "session";

// Coincide con la expiración fija de 1h del JWT que emite la API (no hay refresh token).
export const SESSION_MAX_AGE = 60 * 60;

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};
