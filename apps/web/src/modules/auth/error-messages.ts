const ERROR_TRANSLATIONS: Record<string, string> = {
  "Email already exists": "Ese correo ya está registrado.",
  "Invalid Credentials": "Correo o contraseña incorrectos.",
  "Invalid Payload": "Revisa los datos ingresados.",
};

export function translateAuthError(message: string): string {
  return ERROR_TRANSLATIONS[message] ?? message;
}
