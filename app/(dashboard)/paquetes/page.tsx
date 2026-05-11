"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PaqueteCard from "@/components/paquetes/PaqueteCard";
import NuevoPaqueteForm from "@/components/paquetes/NuevoPaqueteForm";

type Estado = "activo" | "completado";

export default function PaquetesPage() {
  const [paquetes, setPaquetes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Estado | "todos">("activo");
  const [showForm, setShowForm] = useState(false);

  const fetchPaquetes = useCallback(async () => {
    setLoading(true);
    const params = filtro !== "todos" ? `?estado=${filtro}` : "";
    const res = await fetch(`/api/paquetes${params}`);
    if (res.ok) setPaquetes(await res.json());
    setLoading(false);
  }, [filtro]);

  useEffect(() => { fetchPaquetes(); }, [fetchPaquetes]);

  async function handleUso(id: string, calendlyUuid?: string) {
    const res = await fetch(`/api/paquetes/${id}/uso`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calendly_uuid: calendlyUuid }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }

    if (data.completado) {
      toast.success(`¡Paquete completado! Todas las sesiones han sido usadas ✓`, { duration: 5000 });
    } else {
      toast.success(`Sesión registrada — quedan ${data.sesiones_total - data.sesiones_usadas} sesiones`);
    }
    fetchPaquetes();
  }

  async function handleDeshacer(id: string) {
    const res = await fetch(`/api/paquetes/${id}/uso`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }
    toast.success("Última sesión deshecha");
    fetchPaquetes();
  }

  const activos = paquetes.filter(p => p.estado === "activo").length;
  const completados = paquetes.filter(p => p.estado === "completado").length;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "#49517e" }}>
          <Layers className="h-6 w-6" /> Paquetes
        </h1>
        <Button onClick={() => setShowForm(true)} className="text-white border-0 text-sm"
          style={{ background: "linear-gradient(135deg, #84719b, #49517e)" }}>
          <Plus className="h-4 w-4 mr-1" /> Nuevo
        </Button>
      </div>

      {/* Filtro */}
      <div className="flex gap-1 mb-4">
        {([
          { key: "activo", label: `Activos (${activos})` },
          { key: "completado", label: `Completados (${completados})` },
          { key: "todos", label: "Todos" },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setFiltro(key)}
            className="text-xs px-3 py-1.5 rounded-full transition-colors font-medium"
            style={{
              background: filtro === key ? "#84719b" : "#f5f5f8",
              color: filtro === key ? "white" : "#84719b",
            }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : paquetes.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: "#f5f5f8" }}>
          <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" style={{ color: "#84719b" }} />
          <p className="text-sm font-medium" style={{ color: "#84719b" }}>
            {filtro === "activo" ? "Sin paquetes activos" : "Sin paquetes aquí"}
          </p>
          {filtro === "activo" && (
            <p className="text-xs mt-1" style={{ color: "#b0aabe" }}>
              Crea uno al registrar una venta de paquete
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {paquetes.map(p => (
            <PaqueteCard
              key={p.id}
              paquete={p}
              onUso={() => handleUso(p.id)}
              onDeshacer={() => handleDeshacer(p.id)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <NuevoPaqueteForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchPaquetes(); }}
        />
      )}
    </div>
  );
}
