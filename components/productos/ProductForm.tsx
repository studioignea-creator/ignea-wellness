"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Producto } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Partial<Producto>;
}

const UNIDADES = ["unidad", "ml", "g", "litro", "caja"];

export default function ProductForm({ open, onClose, onSaved, initial }: Props) {
  const [form, setForm] = useState({
    marca: initial?.marca ?? "",
    nombre: initial?.nombre ?? "",
    stock_actual: initial?.stock_actual ?? 0,
    stock_minimo: initial?.stock_minimo ?? 1,
    unidad: initial?.unidad ?? "unidad",
    notas: initial?.notas ?? "",
  });
  const [saving, setSaving] = useState(false);

  const isEdit = !!initial?.id;

  async function handleSave() {
    if (!form.marca.trim() || !form.nombre.trim()) {
      toast.error("Completa marca y nombre");
      return;
    }
    setSaving(true);
    try {
      const url = isEdit ? `/api/productos/${initial!.id}` : "/api/productos";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success(isEdit ? "Producto actualizado" : "Producto agregado");
      onSaved();
      onClose();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  function set(field: string, value: string | number) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar producto" : "Agregar producto"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Marca</Label>
              <Input value={form.marca} onChange={(e) => set("marca", e.target.value)} placeholder="doTerra" />
            </div>
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input value={form.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="On Guard 15ml" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Stock actual</Label>
              <Input type="number" min={0} value={form.stock_actual} onChange={(e) => set("stock_actual", +e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Stock mínimo</Label>
              <Input type="number" min={0} value={form.stock_minimo} onChange={(e) => set("stock_minimo", +e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Unidad</Label>
              <Select value={form.unidad} onValueChange={(v) => set("unidad", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNIDADES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Notas (opcional)</Label>
            <Input value={form.notas ?? ""} onChange={(e) => set("notas", e.target.value)} placeholder="Proveedor, link, etc." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
