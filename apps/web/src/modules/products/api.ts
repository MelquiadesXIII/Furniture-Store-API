import { apiFetch } from "@/lib/api/client";
import type { Result } from "@/lib/result";
import type { Product } from "@/modules/products/types";

export function getProducts(): Promise<Result<Product[]>> {
  return apiFetch<Product[]>("/api/Products");
}
