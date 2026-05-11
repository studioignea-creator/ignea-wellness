import { formatMXN } from "@/lib/currency";
import type { Venta } from "@/lib/types";

interface Props {
  ventas: Venta[];
}

function startOf(unit: "week" | "month"): Date {
  const now = new Date();
  if (unit === "week") {
    const d = new Date(now);
    d.setDate(now.getDate() - now.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export default function SalesTotals({ ventas }: Props) {
  const weekStart = startOf("week");
  const monthStart = startOf("month");

  const mxnVentas = ventas.filter((v) => v.moneda === "MXN");
  const weekTotal = mxnVentas.filter((v) => new Date(v.created_at) >= weekStart).reduce((s, v) => s + v.monto, 0);
  const monthTotal = mxnVentas.filter((v) => new Date(v.created_at) >= monthStart).reduce((s, v) => s + v.monto, 0);

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <div className="rounded-lg border bg-card p-4">
        <p className="text-xs text-muted-foreground">Esta semana</p>
        <p className="text-xl font-bold mt-1">{formatMXN(weekTotal)}</p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-xs text-muted-foreground">Este mes</p>
        <p className="text-xl font-bold mt-1">{formatMXN(monthTotal)}</p>
      </div>
    </div>
  );
}
