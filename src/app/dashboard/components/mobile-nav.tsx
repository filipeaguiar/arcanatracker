"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CreditCard, FileText, Repeat } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-bottom-nav">
      <Link href="/dashboard" title="Início" className={pathname === "/dashboard" ? "active" : ""}>
        <Home size={24} />
      </Link>
      <Link href="/dashboard/cards" title="Cartões" className={pathname?.startsWith("/dashboard/cards") ? "active" : ""}>
        <CreditCard size={24} />
      </Link>
      <Link href="/dashboard/invoices" title="Faturas" className={pathname?.startsWith("/dashboard/invoices") ? "active" : ""}>
        <FileText size={24} />
      </Link>
      <Link href="/dashboard/subscriptions" title="Assinaturas" className={pathname?.startsWith("/dashboard/subscriptions") ? "active" : ""}>
        <Repeat size={24} />
      </Link>
    </nav>
  );
}
