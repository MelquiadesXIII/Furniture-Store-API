import Link from "next/link";
import { AuthShell } from "@/modules/auth/auth-shell";
import { LoginContainer } from "@/modules/auth/login/login-container";
import loginHero from "@/assets/login-hero.jpg";

export default function LoginPage() {
  return (
    <AuthShell
      title="Iniciar sesión"
      photo={loginHero}
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="font-medium text-accent hover:underline">
            Crear cuenta
          </Link>
        </>
      }
    >
      <LoginContainer />
    </AuthShell>
  );
}
