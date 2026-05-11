"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MetodoPago, Moneda } from "@/lib/types";

const SERVICIOS_PAQUETE = [
  "Paquete 3 sesiones",
  "Paquete 5 sesiones",
  "Paquete 10 sesiones",
  "Paquete personalizado",
];

const METODOS: { value: MetodoPago; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "transferencia", label: "Transferencia" },
];

function detectSesiones(servicio: string): number {
  const m = servicio.match(/(\d+)\s*sesiones?/i);
  return m ? parseInt(m[1]) : 5;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  prefill?: { cliente?: string };
}

export default function NuevoPaqueteForm({ open, onClose, onSaved, prefill }: Props) {
  const [cliente, setCliente] = useState(prefill?.cliente ?? "");
  const [servicio, setServicio] = useState("");
  const [sesiones, setSesiones] = useState(5);
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState<Moneda>("MXN");
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("efectivo");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);

  function onServicioChange(v: string) {
    setServicio(v);
    setSesiones(detectSesiones(v));
  }

  async function handleSave() {
    if (!cliente.trim()) { toast.error("Escribe el nombre de la clienta"); return; }
    if (!servicio) { toast.error("Selecciona el servicio"); return; }
    if (!monto || parseFloat(monto) <= 0) { toast.error("Ingresa el monto del paquete"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/paquetes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_nombre: cliente,
          servicio,
          sesiones_total: sesiones,
          monto_total: parseFloat(monto),
          moneda,
          metodo_pago: metodoPago,
          notas: notas || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Paquete creado y activo");
      onSaved();
      onClose();
    } catch {
      toast.error("Error al crear el paquete");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle style={{ color: "#49517e" }}>Nuevo paquete</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1">
            <Label style={{ color: "#49517e" }}>Clienta</Label>
            <Input placeholder="Nombre" value={cliente} onChange={e => setCliente(e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label style={{ color: "#49517e" }}>Tipo de paquete</Label>
            <Select value={servicio} onValueChange={onServicioChange}>
              <SelectTrigger className="bg-white border-0" style={{ boxShadow: "0 0 0 1px #d4e1e2" }}>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {SERVICIOS_PAQUETE.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label style={{ color: "#49517e" }}>Número de sesiones</Label>
            <Input type="number" min={1} max={50} value={sesiones}
              onChange={e => setSesiones(parseInt(e.target.value) || 1)} />
          </div>

          <div className="space-y-1">
            <Label style={{ color: "#49517e" }}>Monto total pagado</Label>
            <div className="flex gap-2">
              <div className="flex gap-1 h-10 shrink-0">
                {(["MXN", "USD"] as Moneda[]).map(m => (
                  <button key={m} type="button" onClick={() => setMoneda(m)}
                    className="px-3 rounded-lg text-xs font-medium transition-colors"
                    style={{ background: moneda === m ? "#84719b" : "#f5f5f8", color: moneda === m ? "white" : "#84719b" }}>
                    {m}
                  </button>
                ))}
              </div>
              <Input type="number" min={0} placeholder="0" value={monto} onChange={e => setMonto(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label style={{ color: "#49517e" }}>Método de pago</Label>
            <div className="flex gap-2 h-10">
              {METODOS.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => setMetodoPago(value)}
                  className="flex-1 rounded-lg text-sm font-medium transition-colors"
                  style={{ background: metodoPago === value ? "#84719b" : "#f5f5f8", color: metodoPago === value ? "white" : "#84719b" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label style={{ color: "#49517e" }}>Notas (opcional)</Label>
            <Input placeholder="Observaciones..." value={notas} onChange={e => setNotas(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="text-white border-0"
            style={{ background: "linear-gradient(135deg, #84719b, #49517e)" }}>
            {saving ? "Creando..." : "Crear paquete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
