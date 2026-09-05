import Link from "next/link";
import { Button } from "@/components/ui/button";

function buildHref(page: number, query: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export function ProductPagination({
  currentPage,
  totalPages,
  query,
}: {
  currentPage: number;
  totalPages: number;
  query: string;
}) {
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav className="mt-10 flex items-center justify-center gap-4" aria-label="Paginación">
      {hasPrev ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={buildHref(currentPage - 1, query)}>Anterior</Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Anterior
        </Button>
      )}

      <span className="font-mono text-sm text-ink-muted">
        Página {currentPage} de {totalPages}
      </span>

      {hasNext ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={buildHref(currentPage + 1, query)}>Siguiente</Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Siguiente
        </Button>
      )}
    </nav>
  );
}
