const ERROR_TRANSLATIONS: Record<string, string> = {
  "Email already exists": "Ese correo ya está registrado.",
  "Invalid Credentials": "Correo o contraseña incorrectos.",
  "Invalid Payload": "Revisa los datos ingresados.",
  "Email needs to be confirmed.": "Confirma tu correo antes de iniciar sesión.",
};

const FALLBACK = "No se pudo completar la operación. Intenta de nuevo.";

export function translateAuthError(message: string): string {
  const translation = ERROR_TRANSLATIONS[message];

  if (!translation) {
    console.warn(`[auth] mensaje de error sin traducir: "${message}"`);
    return FALLBACK;
  }

  return translation;
}
