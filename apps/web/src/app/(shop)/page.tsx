import { ProductContainer } from "@/modules/products/list/product-container";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <ProductContainer query={q} />;
}
