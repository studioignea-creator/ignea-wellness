"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMXN } from "@/lib/currency";
import type { MetodoPago, Moneda } from "@/lib/types";

const SERVICIOS = [
  "Barras de Access 60 min",
  "Barras de Access 90 min",
  "Access Facelift",
  "Reiki 60 min",
  "Reiki 30 min",
  "Masaje Holístico",
  "Masaje Bioenergético",
  "Masaje Relajante",
  "Limpieza Facial Profunda",
  "Cuencos Terapéuticos",
  "Péndulo Hebreo",
  "Proceso Corporal",
  "Paquete 3 sesiones",
  "Paquete 5 sesiones",
  "Paquete 10 sesiones",
  "Otro",
];

const METODOS: { value: MetodoPago; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "transferencia", label: "Transferencia" },
];

interface Item {
  servicio: string;
  servicio_custom: string;
  monto: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  prefill?: { cliente?: string; servicio?: string; calendly_event_uuid?: string };
}

const itemVacio = (): Item => ({ servicio: "", servicio_custom: "", monto: "" });

export default function SaleForm({ open, onClose, onSaved, prefill }: Props) {
  const [cliente, setCliente] = useState(prefill?.cliente ?? "");
  const [items, setItems] = useState<Item[]>([
    { servicio: prefill?.servicio ?? "", servicio_custom: "", monto: "" }
  ]);
  const [moneda, setMoneda] = useState<Moneda>("MXN");
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("efectivo");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset form every time the dialog opens — avoids stale data from previous session
  useEffect(() => {
    if (open) {
      setCliente(prefill?.cliente ?? "");
      setItems([{ servicio: prefill?.servicio ?? "", servicio_custom: "", monto: "" }]);
      setMoneda("MXN");
      setMetodoPago("efectivo");
      setNotas("");
      setSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const total = items.reduce((s, i) => s + (parseFloat(i.monto) || 0), 0);

  function updateItem(idx: number, field: keyof Item, value: string) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  function addItem() {
    setItems(prev => [...prev, itemVacio()]);
  }

  function removeItem(idx: number) {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!cliente.trim()) { toast.error("Escribe el nombre de la clienta"); return; }

    const itemsValidos = items.map(i => ({
      servicio: i.servicio === "Otro" ? i.servicio_custom : i.servicio,
      monto: parseFloat(i.monto) || 0,
    }));

    if (itemsValidos.some(i => !i.servicio.trim())) { toast.error("Selecciona un servicio en cada línea"); return; }
    if (itemsValidos.some(i => i.monto <= 0)) { toast.error("Ingresa un monto válido en cada línea"); return; }

    setSaving(true);
    try {
      const servicioResumen = itemsValidos.length === 1
        ? itemsValidos[0].servicio
        : `${itemsValidos.length} servicios`;

      const res = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_nombre: cliente,
          servicio: servicioResumen,
          monto: total,
          moneda,
          metodo_pago: metodoPago,
          notas: notas || null,
          calendly_event_uuid: prefill?.calendly_event_uuid ?? null,
          es_paquete: itemsValidos.some(i => i.servicio.toLowerCase().includes("paquete")),
          items: itemsValidos,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Venta registrada");
      onSaved();
      onClose();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ color: "#49517e" }}>Registrar venta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Cliente */}
          <div className="space-y-1">
            <Label style={{ color: "#49517e" }}>Cliente</Label>
            <Input placeholder="Nombre de la clienta" value={cliente} onChange={e => setCliente(e.target.value)} />
          </div>

          {/* Líneas de servicios */}
          <div className="space-y-2">
            <Label style={{ color: "#49517e" }}>Servicios</Label>

            {items.map((item, idx) => (
              <div key={idx} className="rounded-xl p-3 space-y-2" style={{ background: "#f5f5f8" }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: "#84719b" }}>
                    Servicio {items.length > 1 ? idx + 1 : ""}
                  </span>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <Select value={item.servicio} onValueChange={v => updateItem(idx, "servicio", v)}>
                  <SelectTrigger className="bg-white border-0" style={{ boxShadow: "0 0 0 1px #d4e1e2" }}>
                    <SelectValue placeholder="Selecciona un servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICIOS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>

                {item.servicio === "Otro" && (
                  <Input placeholder="Describe el servicio" value={item.servicio_custom}
                    onChange={e => updateItem(idx, "servicio_custom", e.target.value)}
                    className="bg-white border-0" style={{ boxShadow: "0 0 0 1px #d4e1e2" }} />
                )}

                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: "#84719b" }}>{moneda === "MXN" ? "$" : "USD"}</span>
                  <Input type="number" min={0} placeholder="0" value={item.monto}
                    onChange={e => updateItem(idx, "monto", e.target.value)}
                    className="bg-white border-0" style={{ boxShadow: "0 0 0 1px #d4e1e2" }} />
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" size="sm" className="w-full border-dashed"
              style={{ borderColor: "#84719b", color: "#84719b" }} onClick={addItem}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Agregar otro servicio
            </Button>
          </div>

          {/* Total */}
          {items.length > 1 && (
            <div className="rounded-xl px-4 py-3 flex justify-between items-center"
              style={{ background: "linear-gradient(135deg, #f5d9d6, #d4e1e2)" }}>
              <span className="text-sm font-medium" style={{ color: "#49517e" }}>Total</span>
              <span className="text-lg font-bold" style={{ color: "#49517e" }}>
                {moneda === "MXN" ? formatMXN(total) : `$${total.toFixed(2)} USD`}
              </span>
            </div>
          )}

          {/* Moneda */}
          <div className="space-y-1">
            <Label style={{ color: "#49517e" }}>Moneda</Label>
            <div className="flex gap-2 h-10">
              {(["MXN", "USD"] as Moneda[]).map(m => (
                <button key={m} type="button" onClick={() => setMoneda(m)}
                  className="flex-1 rounded-lg text-sm font-medium transition-colors"
                  style={{ background: moneda === m ? "#84719b" : "#f5f5f8", color: moneda === m ? "white" : "#84719b" }}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Método de pago */}
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

          {/* Notas */}
          <div className="space-y-1">
            <Label style={{ color: "#49517e" }}>Notas (opcional)</Label>
            <Input placeholder="Descuento, observaciones..." value={notas} onChange={e => setNotas(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="text-white border-0"
            style={{ background: "linear-gradient(135deg, #84719b, #49517e)" }}>
            {saving ? "Guardando..." : total > 0 ? `Registrar ${moneda === "MXN" ? formatMXN(total) : `$${total.toFixed(2)}`}` : "Registrar venta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
