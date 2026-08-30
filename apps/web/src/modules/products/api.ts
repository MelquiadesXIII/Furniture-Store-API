import { apiFetch } from "@/lib/api/client";
import type { Product } from "@/modules/products/types";

// El catálogo es público (se ve antes de iniciar sesión), así que el token es opcional.
export function getProducts(token?: string | null) {
  return apiFetch<Product[]>("/api/Products", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}
