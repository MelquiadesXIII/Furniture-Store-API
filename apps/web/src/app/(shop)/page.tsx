import { ProductContainer } from "@/modules/products/list/product-container";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  return <ProductContainer query={q} page={page} />;
}
