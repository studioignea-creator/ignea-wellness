"use client";

import { useState } from "react";
import { CheckCircle, Undo2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMXN } from "@/lib/currency";

interface Paquete {
  id: string;
  cliente_nombre: string;
  servicio: string;
  sesiones_total: number;
  sesiones_usadas: number;
  monto_total: number;
  moneda: string;
  metodo_pago: string | null;
  notas: string | null;
  estado: "activo" | "completado";
  created_at: string;
}

interface Props {
  paquete: Paquete;
  onUso: () => void;
  onDeshacer: () => void;
}

export default function PaqueteCard({ paquete: p, onUso, onDeshacer }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const pct = p.sesiones_total > 0 ? Math.round((p.sesiones_usadas / p.sesiones_total) * 100) : 0;
  const restantes = p.sesiones_total - p.sesiones_usadas;
  const completado = p.estado === "completado";

  const fecha = new Date(p.created_at).toLocaleDateString("es-MX", {
    day: "numeric", month: "short", year: "numeric",
  });

  async function handleUso() {
    setConfirming(true);
    await onUso();
    setConfirming(false);
  }

  return (
    <div className="rounded-2xl border overflow-hidden transition-all"
      style={{
        borderColor: completado ? "#bfd8d2" : "#e8e8f0",
        background: completado ? "#f0faf8" : "#fff",
      }}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold" style={{ color: "#49517e" }}>{p.cliente_nombre}</span>
              {completado && (
                <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: "#bfd8d2", color: "#2d6b53" }}>
                  <CheckCircle className="h-3 w-3" /> Completado
                </span>
              )}
            </div>
            <p className="text-xs mt-0.5" style={{ color: "#84719b" }}>{p.servicio}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold" style={{ color: "#49517e" }}>
              {p.moneda === "MXN" ? formatMXN(p.monto_total) : `$${p.monto_total} USD`}
            </p>
            <p className="text-xs" style={{ color: "#84719b" }}>{fecha}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-medium" style={{ color: "#49517e" }}>
              {p.sesiones_usadas} / {p.sesiones_total} sesiones
            </span>
            <span className="text-xs" style={{ color: completado ? "#2d6b53" : "#84719b" }}>
              {completado ? "¡Completado!" : `${restantes} restante${restantes !== 1 ? "s" : ""}`}
            </span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#e8e8f0" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: completado
                  ? "linear-gradient(90deg, #5a9c7e, #bfd8d2)"
                  : pct >= 80
                    ? "linear-gradient(90deg, #e4a691, #84719b)"
                    : "linear-gradient(90deg, #84719b, #49517e)",
              }} />
          </div>
          {/* Dots de sesiones */}
          <div className="flex gap-1.5 mt-2">
            {Array.from({ length: p.sesiones_total }).map((_, i) => (
              <div key={i} className="h-2 flex-1 rounded-full transition-colors"
                style={{ background: i < p.sesiones_usadas ? "#84719b" : "#e8e8f0" }} />
            ))}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2 items-center">
          {!completado && (
            <Button size="sm" onClick={handleUso} disabled={confirming}
              className="flex-1 text-white border-0 text-xs"
              style={{ background: "linear-gradient(135deg, #84719b, #49517e)" }}>
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              {confirming ? "Guardando..." : "Marcar sesión usada"}
            </Button>
          )}
          {p.sesiones_usadas > 0 && (
            <Button size="sm" variant="ghost" onClick={() => setExpanded(e => !e)}
              className="shrink-0 text-xs" style={{ color: "#84719b" }}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Expanded: opciones extra */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: "#f0f0f5" }}>
          {p.notas && (
            <p className="text-xs mb-3 italic" style={{ color: "#84719b" }}>{p.notas}</p>
          )}
          <div className="flex gap-2">
            {p.sesiones_usadas > 0 && !completado && (
              <button onClick={onDeshacer}
                className="flex items-center gap-1 text-xs underline"
                style={{ color: "#b0aabe" }}>
                <Undo2 className="h-3 w-3" /> Deshacer última sesión
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
