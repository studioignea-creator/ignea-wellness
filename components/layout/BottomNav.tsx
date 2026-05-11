"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, DollarSign, Calendar, Layers, BarChart2 } from "lucide-react";

const TABS = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/ventas", label: "Ventas", icon: DollarSign },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/paquetes", label: "Paquetes", icon: Layers },
  { href: "/analiticas", label: "Stats", icon: BarChart2 },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t" style={{ background: "#fff", borderColor: "#d4e1e2" }}>
      <div className="flex h-16">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors relative"
              style={{ color: active ? "#49517e" : "#84719b" }}
            >
              <Icon className="h-5 w-5" />
              <span style={{ fontWeight: active ? 600 : 400, fontSize: "10px" }}>{label}</span>
              {active && <span className="absolute bottom-0 h-0.5 w-8 rounded-t-full" style={{ background: "#84719b" }} />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
