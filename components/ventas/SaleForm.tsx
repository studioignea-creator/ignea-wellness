"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  prefill?: {
    cliente?: string;
    servicio?: string;
    calendly_event_uuid?: string;
  };
}

export default function SaleForm({ open, onClose, onSaved, prefill }: Props) {
  const [form, setForm] = useState({
    cliente_nombre: prefill?.cliente ?? "",
    servicio: prefill?.servicio ?? "",
    servicio_custom: "",
    monto: "",
    moneda: "MXN" as Moneda,
    metodo_pago: "efectivo" as MetodoPago,
    notas: "",
    calendly_event_uuid: prefill?.calendly_event_uuid ?? null,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (prefill) {
      setForm((f) => ({
        ...f,
        cliente_nombre: prefill.cliente ?? f.cliente_nombre,
        servicio: prefill.servicio ?? f.servicio,
        calendly_event_uuid: prefill.calendly_event_uuid ?? f.calendly_event_uuid,
      }));
    }
  }, [prefill]);

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSave() {
    const servicio = form.servicio === "Otro" ? form.servicio_custom : form.servicio;
    if (!form.cliente_nombre.trim() || !servicio.trim() || !form.monto) {
      toast.error("Completa cliente, servicio y monto");
      return;
    }
    const monto = parseFloat(form.monto);
    if (isNaN(monto) || monto <= 0) {
      toast.error("Monto inválido");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_nombre: form.cliente_nombre,
          servicio,
          monto,
          moneda: form.moneda,
          metodo_pago: form.metodo_pago,
          notas: form.notas || null,
          calendly_event_uuid: form.calendly_event_uuid,
          es_paquete: servicio.toLowerCase().includes("paquete"),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Venta registrada");
      onSaved();
      onClose();
    } catch {
      toast.error("Error al guardar la venta");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar venta</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Cliente</Label>
            <Input
              placeholder="Nombre de la clienta"
              value={form.cliente_nombre}
              onChange={(e) => set("cliente_nombre", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label>Servicio</Label>
            <Select value={form.servicio} onValueChange={(v) => set("servicio", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un servicio" />
              </SelectTrigger>
              <SelectContent>
                {SERVICIOS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.servicio === "Otro" && (
              <Input
                className="mt-2"
                placeholder="Describe el servicio"
                value={form.servicio_custom}
                onChange={(e) => set("servicio_custom", e.target.value)}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Monto</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={form.monto}
                onChange={(e) => set("monto", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Moneda</Label>
              <div className="flex gap-1 h-10">
                {(["MXN", "USD"] as Moneda[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => set("moneda", m)}
                    className={`flex-1 rounded-md border text-sm font-medium transition-colors ${form.moneda === m ? "bg-primary text-primary-foreground border-primary" : "border-input bg-background hover:bg-accent"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Método de pago</Label>
            <div className="flex gap-1 h-10">
              {METODOS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("metodo_pago", value)}
                  className={`flex-1 rounded-md border text-sm font-medium transition-colors ${form.metodo_pago === value ? "bg-primary text-primary-foreground border-primary" : "border-input bg-background hover:bg-accent"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label>Notas (opcional)</Label>
            <Input
              placeholder="Observaciones, descuento, etc."
              value={form.notas}
              onChange={(e) => set("notas", e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Registrar venta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
