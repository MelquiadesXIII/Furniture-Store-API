import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
