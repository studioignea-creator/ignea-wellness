"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SaleForm from "@/components/ventas/SaleForm";
import SalesList from "@/components/ventas/SalesList";
import SalesTotals from "@/components/ventas/SalesTotals";
import type { Venta } from "@/lib/types";

export default function VentasPage() {
  const searchParams = useSearchParams();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [metodoFilter, setMetodoFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);

  const prefill = {
    cliente: searchParams.get("cliente") ?? undefined,
    servicio: searchParams.get("servicio") ?? undefined,
    calendly_event_uuid: searchParams.get("calendly_uuid") ?? undefined,
  };

  useEffect(() => {
    if (prefill.cliente || prefill.servicio) setShowForm(true);
  }, []); // eslint-disable-line

  const fetchVentas = useCallback(async () => {
    const params = new URLSearchParams();
    if (metodoFilter && metodoFilter !== "all") params.set("metodo", metodoFilter);
    const res = await fetch(`/api/ventas?${params}`);
    if (res.ok) setVentas(await res.json());
    setLoading(false);
  }, [metodoFilter]);

  useEffect(() => { fetchVentas(); }, [fetchVentas]);

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="h-6 w-6" /> Ventas
        </h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nueva venta
        </Button>
      </div>

      <SalesTotals ventas={ventas} />

      <div className="mb-4">
        <Select value={metodoFilter} onValueChange={setMetodoFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos los métodos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="efectivo">Efectivo</SelectItem>
            <SelectItem value="tarjeta">Tarjeta</SelectItem>
            <SelectItem value="transferencia">Transferencia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <SalesList ventas={ventas} onRefresh={fetchVentas} />
      )}

      <SaleForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={fetchVentas}
        prefill={prefill}
      />
    </div>
  );
}
