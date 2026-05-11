"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductTable from "@/components/productos/ProductTable";
import ProductForm from "@/components/productos/ProductForm";
import type { Producto } from "@/lib/types";

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchProductos = useCallback(async () => {
    const res = await fetch("/api/productos");
    if (res.ok) setProductos(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchProductos(); }, [fetchProductos]);

  const pedirCount = productos.filter((p) => p.pedir).length;
  const bajoCount = productos.filter((p) => p.stock_actual <= p.stock_minimo).length;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" /> Stock
          </h1>
          {(pedirCount > 0 || bajoCount > 0) && (
            <p className="text-sm text-amber-600 mt-1">
              {bajoCount > 0 && `${bajoCount} producto(s) con stock bajo`}
              {bajoCount > 0 && pedirCount > 0 && " · "}
              {pedirCount > 0 && `${pedirCount} marcado(s) para pedir`}
            </p>
          )}
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" /> Agregar
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <ProductTable productos={productos} onRefresh={fetchProductos} />
      )}

      <ProductForm open={showForm} onClose={() => setShowForm(false)} onSaved={fetchProductos} />
    </div>
  );
}
