import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Nivel presentacional: solo primitivos de shadcn/ui, sin estado ni fetch propios.
export function LoginForm({
  pending,
  errors,
  onSubmit,
}: {
  pending: boolean;
  errors: string[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" className="text-ink-muted">
          Correo electrónico
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="bg-surface-raised"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password" className="text-ink-muted">
          Contraseña
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="bg-surface-raised"
        />
      </div>

      {errors.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm text-brick" role="alert">
          {errors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      )}

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
