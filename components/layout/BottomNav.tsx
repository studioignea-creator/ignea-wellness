"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, DollarSign, Calendar, Package } from "lucide-react";

const TABS = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/ventas", label: "Ventas", icon: DollarSign },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/productos", label: "Stock", icon: Package },
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
              className="flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors"
              style={{ color: active ? "#49517e" : "#84719b" }}
            >
              <Icon className="h-5 w-5" />
              <span style={{ fontWeight: active ? 600 : 400 }}>{label}</span>
              {active && <span className="absolute bottom-0 h-0.5 w-8 rounded-t-full" style={{ background: "#84719b" }} />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
