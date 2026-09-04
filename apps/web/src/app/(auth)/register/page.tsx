import Link from "next/link";
import { AuthShell } from "@/modules/auth/auth-shell";
import { RegisterContainer } from "@/modules/auth/register/register-container";
import loginHero from "@/assets/login-hero.jpg";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Crear cuenta"
      photo={loginHero}
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Iniciar sesión
          </Link>
        </>
      }
    >
      <RegisterContainer />
    </AuthShell>
  );
}
