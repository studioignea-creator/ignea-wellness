"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import StockBadge from "./StockBadge";
import ProductForm from "./ProductForm";
import type { Producto } from "@/lib/types";

interface Props {
  productos: Producto[];
  onRefresh: () => void;
}

export default function ProductTable({ productos, onRefresh }: Props) {
  const [editing, setEditing] = useState<Producto | null>(null);

  async function togglePedir(p: Producto) {
    const res = await fetch(`/api/productos/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pedir: !p.pedir }),
    });
    if (res.ok) onRefresh();
  }

  async function updateStock(p: Producto, val: number) {
    const res = await fetch(`/api/productos/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock_actual: val }),
    });
    if (res.ok) {
      toast.success("Stock actualizado");
      onRefresh();
    }
  }

  async function handleDelete(p: Producto) {
    if (!confirm(`¿Eliminar ${p.nombre}?`)) return;
    const res = await fetch(`/api/productos/${p.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Producto eliminado");
      onRefresh();
    }
  }

  if (productos.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>No hay productos registrados.</p>
        <p className="text-sm mt-1">Agrega uno con el botón de arriba.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {productos.map((p) => (
          <div
            key={p.id}
            className={`flex items-center gap-3 rounded-lg border p-4 ${p.stock_actual <= p.stock_minimo ? "border-amber-200 bg-amber-50" : "bg-card"}`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{p.nombre}</span>
                <span className="text-xs text-muted-foreground">{p.marca}</span>
                <StockBadge actual={p.stock_actual} minimo={p.stock_minimo} />
              </div>
              {p.notas && <p className="text-xs text-muted-foreground mt-0.5">{p.notas}</p>}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                min={0}
                defaultValue={p.stock_actual}
                className="w-14 h-8 rounded border border-input bg-background px-2 text-sm text-center"
                onBlur={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val !== p.stock_actual) updateStock(p, val);
                }}
              />
              <span className="text-xs text-muted-foreground">{p.unidad}</span>

              <Button
                size="icon"
                variant={p.pedir ? "default" : "outline"}
                className="h-8 w-8"
                title={p.pedir ? "Marcado para pedir" : "Marcar para pedir"}
                onClick={() => togglePedir(p)}
              >
                <ShoppingCart className="h-3.5 w-3.5" />
              </Button>

              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(p)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(p)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <ProductForm
          open={!!editing}
          onClose={() => setEditing(null)}
          onSaved={onRefresh}
          initial={editing}
        />
      )}
    </>
  );
}
