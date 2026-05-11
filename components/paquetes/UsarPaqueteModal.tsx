"use client";

import { useState, useEffect } from "react";
import { Layers, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
}

interface Props {
  open: boolean;
  onClose: () => void;
  clienteNombre: string | null;
  calendlyUuid: string;
  onUsado: () => void;
}

export default function UsarPaqueteModal({ open, onClose, clienteNombre, calendlyUuid, onUsado }: Props) {
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [loading, setLoading] = useState(false);
  const [usando, setUsando] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const params = new URLSearchParams({ estado: "activo" });
    if (clienteNombre) params.set("cliente", clienteNombre.split(" ")[0]); // match by first name
    fetch(`/api/paquetes?${params}`)
      .then(r => r.json())
      .then(data => { setPaquetes(Array.isArray(data) ? data : []); })
      .finally(() => setLoading(false));
  }, [open, clienteNombre]);

  async function handleUsar(paqueteId: string) {
    setUsando(paqueteId);
    const res = await fetch(`/api/paquetes/${paqueteId}/uso`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calendly_uuid: calendlyUuid }),
    });
    setUsando(null);
    if (res.ok) {
      const data = await res.json();
      onUsado();
      onClose();
      // Small delay to let parent show the toast
      if (data.completado) {
        setTimeout(() => alert(`¡Paquete de ${clienteNombre} completado! Todas las sesiones fueron usadas.`), 100);
      }
    }
  }

  const restantes = (p: Paquete) => p.sesiones_total - p.sesiones_usadas;
  const pct = (p: Paquete) => Math.round((p.sesiones_usadas / p.sesiones_total) * 100);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle style={{ color: "#49517e" }}>
            <Layers className="inline h-4 w-4 mr-2" />
            Usar sesión de paquete
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-2 py-2">
            {[...Array(2)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : paquetes.length === 0 ? (
          <div className="text-center py-8" style={{ color: "#84719b" }}>
            <Layers className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Sin paquetes activos{clienteNombre ? ` para ${clienteNombre}` : ""}</p>
            <p className="text-xs mt-1" style={{ color: "#b0aabe" }}>Crea uno desde la sección Paquetes</p>
          </div>
        ) : (
          <div className="space-y-2 py-1">
            {paquetes.map(p => (
              <div key={p.id} className="rounded-xl border p-3" style={{ borderColor: "#d4e1e2" }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#49517e" }}>{p.cliente_nombre}</p>
                    <p className="text-xs" style={{ color: "#84719b" }}>{p.servicio}</p>
                  </div>
                  <p className="text-xs shrink-0 font-medium" style={{ color: "#49517e" }}>
                    {restantes(p)} / {p.sesiones_total} restantes
                  </p>
                </div>

                <div className="h-1.5 rounded-full mb-2.5" style={{ background: "#e8e8f0" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct(p)}%`, background: "#84719b" }} />
                </div>

                <Button size="sm" className="w-full text-white border-0 text-xs"
                  style={{ background: "linear-gradient(135deg, #84719b, #49517e)" }}
                  disabled={usando === p.id}
                  onClick={() => handleUsar(p.id)}>
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                  {usando === p.id ? "Registrando..." : "Usar sesión de este paquete"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
