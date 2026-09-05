import Link from "next/link";
import { Suspense } from "react";
import { getSessionUser } from "@/lib/session";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { SearchBar } from "@/components/search-bar";
import { ChairMark } from "@/components/furniture-marks";

export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/75">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-display text-lg font-semibold tracking-tight text-ink"
        >
          <ChairMark className="h-6 w-6 text-accent" />
          Furnistore
        </Link>

        <div className="flex flex-1 justify-center">
          <Suspense fallback={<div className="h-8 w-full max-w-md" />}>
            <SearchBar />
          </Suspense>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <ThemeToggle />
          {user ? (
            <UserMenu email={user.email} />
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
