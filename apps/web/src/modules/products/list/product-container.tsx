import { getSession } from "@/lib/session";
import { getProducts } from "@/modules/products/api";
import type { Product } from "@/modules/products/types";
import { ProductGrill } from "@/modules/products/list/product-grill";
import { ProductPagination } from "@/modules/products/list/product-pagination";

const PAGE_SIZE = 12;

// Nivel más alto del feature (lo único que importa la página). Interactúa con
// la API: trae la sesión (para saber si mostrar "Comprar" o el gate a /login)
// y el catálogo, y decide qué se renderiza según el resultado.
export async function ProductContainer({
  query,
  page,
}: { query?: string; page?: string } = {}) {
  const isAuthenticated = Boolean(await getSession());

  let products: Product[] = [];
  let loadFailed = false;

  try {
    products = await getProducts();
  } catch {
    loadFailed = true;
  }

  const trimmedQuery = query?.trim() ?? "";
  const visibleProducts = trimmedQuery
    ? products.filter((product) =>
        product.name.toLowerCase().includes(trimmedQuery.toLowerCase()),
      )
    : products;

  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / PAGE_SIZE));
  const requestedPage = Number.parseInt(page ?? "1", 10);
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(1, requestedPage), totalPages)
    : 1;
  const pageProducts = visibleProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <div className="mb-8 border-b border-hairline pb-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Catálogo</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {loadFailed
            ? "No se pudo cargar el catálogo."
            : `${visibleProducts.length} ${visibleProducts.length === 1 ? "pieza disponible" : "piezas disponibles"}`}
        </p>
      </div>

      {loadFailed ? (
        <div className="flex flex-col items-center gap-3 border border-dashed border-hairline py-20 text-center">
          <p className="text-ink-muted">
            Hubo un problema al conectar con el servidor. Intenta de nuevo en un momento.
          </p>
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border border-dashed border-hairline py-20 text-center">
          <p className="text-ink-muted">
            {trimmedQuery
              ? `Sin resultados para "${trimmedQuery}".`
              : "Todavía no hay piezas en el catálogo."}
          </p>
        </div>
      ) : (
        <>
          <ProductGrill products={pageProducts} isAuthenticated={isAuthenticated} />
          {totalPages > 1 && (
            <ProductPagination
              currentPage={currentPage}
              totalPages={totalPages}
              query={trimmedQuery}
            />
          )}
        </>
      )}
    </div>
  );
}
