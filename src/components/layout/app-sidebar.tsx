"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  PiggyBank,
  Banknote,
  Target,
  CreditCard,
  Receipt,
  TrendingUp,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Cuentas", icon: Wallet },
  { href: "/transactions", label: "Transacciones", icon: ArrowLeftRight },
  { href: "/budget", label: "Presupuesto", icon: PiggyBank },
  { href: "/income", label: "Ingresos", icon: Banknote },
  { href: "/funds", label: "Fondos y metas", icon: Target },
  { href: "/debts", label: "Deudas", icon: CreditCard },
  { href: "/bills", label: "Facturas", icon: Receipt },
  { href: "/net-worth", label: "Patrimonio", icon: TrendingUp },
  { href: "/reports", label: "Reportes", icon: BarChart3 },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r bg-sidebar text-sidebar-foreground md:flex md:flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-sidebar-border/30 px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/95">
            <Image
              src="/brand/oikos-mark.png"
              alt=""
              width={26}
              height={26}
              priority
            />
          </div>
          <span className="font-bold tracking-tight text-lg bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            OIKOS
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 relative group",
                active
                  ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-l-3 border-primary pl-3.5"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-primary/10"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="uppercase tracking-wide text-xs">{label}</span>
              {!active && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-gradient-to-b from-primary to-primary/50 rounded-l-full transition-all duration-200 group-hover:h-6"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="border-t border-sidebar-border/30 p-4">
        <Link
          href="/settings/household"
          className={cn(
            "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 relative group",
            pathname.startsWith("/settings")
              ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-l-3 border-primary pl-3.5"
              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-primary/10"
          )}
        >
          <Settings className="h-5 w-5" />
          <span className="uppercase tracking-wide text-xs">Configuración</span>
        </Link>
      </div>
    </aside>
  );
}
