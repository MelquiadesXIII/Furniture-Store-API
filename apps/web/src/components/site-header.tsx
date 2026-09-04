import Link from "next/link";
import { getSession } from "@/lib/session";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import { ChairMark } from "@/components/furniture-marks";

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-ink"
        >
          <ChairMark className="h-6 w-6 text-accent" />
          Furnistore
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {session ? (
            <LogoutButton />
          ) : (
            <Link
              href="/login"
              className="rounded-sm border border-hairline px-3 py-1.5 text-sm text-ink-muted transition-colors hover:border-accent hover:text-accent"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
