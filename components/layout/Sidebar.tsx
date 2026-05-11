"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, DollarSign, Calendar, Package, LogOut, Sparkles, BarChart2, Layers, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ventas", label: "Ventas", icon: DollarSign },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/paquetes", label: "Paquetes", icon: Layers },
  { href: "/productos", label: "Stock", icon: Package },
  { href: "/gastos", label: "Gastos", icon: Receipt },
  { href: "/analiticas", label: "Analíticas", icon: BarChart2 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="hidden md:flex w-60 flex-col min-h-screen border-r" style={{ borderColor: "#d4e1e2", background: "#fff" }}>
      <div className="flex items-center gap-3 p-6 border-b" style={{ borderColor: "#d4e1e2" }}>
        <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #84719b, #49517e)" }}>
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: "#49517e" }}>Ignea Wellness</p>
          <p className="text-xs" style={{ color: "#84719b" }}>Studio</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors")}
              style={{ background: active ? "#f5d9d6" : "transparent", color: active ? "#49517e" : "#84719b" }}>
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t" style={{ borderColor: "#d4e1e2" }}>
        <Button variant="ghost" size="sm" className="w-full justify-start" style={{ color: "#84719b" }} onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}
