"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import type { Venta } from "@/lib/types";

interface Props {
  ventas: Venta[];
  onRefresh: () => void;
}

const METODO_LABEL: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
};

const METODO_VARIANT: Record<string, "success" | "default" | "secondary"> = {
  efectivo: "success",
  tarjeta: "default",
  transferencia: "secondary",
};

function groupByDate(ventas: Venta[]) {
  const groups: Record<string, Venta[]> = {};
  for (const v of ventas) {
    const date = new Date(v.created_at).toLocaleDateString("es-MX", {
      weekday: "long", day: "numeric", month: "long",
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(v);
  }
  return groups;
}

export default function SalesList({ ventas, onRefresh }: Props) {
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta venta?")) return;
    setDeleting(id);
    const res = await fetch(`/api/ventas/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Venta eliminada");
      onRefresh();
    } else {
      toast.error("Error al eliminar");
    }
    setDeleting(null);
  }

  if (ventas.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>No hay ventas registradas.</p>
        <p className="text-sm mt-1">Toca &quot;+ Nueva venta&quot; para empezar.</p>
      </div>
    );
  }

  const groups = groupByDate(ventas);

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([date, items]) => {
        const dayTotal = items.reduce((s, v) => s + (v.moneda === "MXN" ? v.monto : 0), 0);
        return (
          <div key={date}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground capitalize">{date}</h3>
              <span className="text-sm font-semibold">{formatCurrency(dayTotal, "MXN")}</span>
            </div>
            <div className="space-y-2">
              {items.map((v) => (
                <div key={v.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{v.cliente_nombre}</span>
                      <Badge variant={METODO_VARIANT[v.metodo_pago]} className="text-xs">
                        {METODO_LABEL[v.metodo_pago]}
                      </Badge>
                      {v.es_paquete && <Badge variant="outline" className="text-xs">Paquete</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{v.servicio}</p>
                    {v.notas && <p className="text-xs text-muted-foreground italic">{v.notas}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold text-sm">{formatCurrency(v.monto, v.moneda)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(v.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    disabled={deleting === v.id}
                    onClick={() => handleDelete(v.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
