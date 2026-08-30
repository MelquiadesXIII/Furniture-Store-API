import { ProductCard } from "@/modules/products/list/product-card";
import type { Product } from "@/modules/products/types";

export function ProductGrill({
  products,
  isAuthenticated,
}: {
  products: Product[];
  isAuthenticated: boolean;
}) {
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} isAuthenticated={isAuthenticated} />
      ))}
    </ul>
  );
}
