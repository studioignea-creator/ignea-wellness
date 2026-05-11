"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Plus, Receipt } from "lucide-react";
import { formatMXN } from "@/lib/currency";
import type { Gasto, CategoriaGasto } from "@/lib/types";

const CATEGORIAS: { value: CategoriaGasto; label: string; color: string }[] = [
  { value: "publicidad",  label: "Publicidad",   color: "#49517e" },
  { value: "renta",       label: "Renta",         color: "#84719b" },
  { value: "suministros", label: "Suministros",   color: "#bfd8d2" },
  { value: "personal",    label: "Personal",      color: "#e4a691" },
  { value: "servicios",   label: "Servicios",     color: "#f5d9d6" },
  { value: "otros",       label: "Otros",         color: "#d4e1e2" },
];

const hoy = () => new Date().toISOString().split("T")[0];

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [fecha, setFecha] = useState(hoy());
  const [categoria, setCategoria] = useState<CategoriaGasto>("publicidad");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");

  // Filter: current month by default
  const now = new Date();
  const primerDia = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const [desde, setDesde] = useState(primerDia);

  const fetchGastos = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/gastos?desde=${desde}`);
    if (res.ok) setGastos(await res.json());
    setLoading(false);
  }, [desde]);

  useEffect(() => { fetchGastos(); }, [fetchGastos]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!monto || isNaN(Number(monto))) return;
    setSaving(true);
    await fetch("/api/gastos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fecha, categoria, descripcion, monto: Number(monto) }),
    });
    setMonto("");
    setDescripcion("");
    setFecha(hoy());
    await fetchGastos();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/gastos/${id}`, { method: "DELETE" });
    setGastos(prev => prev.filter(g => g.id !== id));
  }

  const total = gastos.reduce((s, g) => s + Number(g.monto), 0);

  const porCategoria = CATEGORIAS.map(cat => ({
    ...cat,
    total: gastos.filter(g => g.categoria === cat.value).reduce((s, g) => s + Number(g.monto), 0),
  })).filter(c => c.total > 0);

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-5" style={{ color: "#49517e" }}>Gastos</h1>

      {/* Form */}
      <form onSubmit={handleAdd} className="rounded-2xl p-4 mb-6 space-y-3"
        style={{ background: "#f5f5f8", border: "1px solid #d4e1e2" }}>
        <p className="text-sm font-semibold" style={{ color: "#49517e" }}>Registrar gasto</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs" style={{ color: "#84719b" }}>Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} required
              className="w-full rounded-lg px-3 py-2 text-sm border-0 outline-none"
              style={{ background: "#fff", boxShadow: "0 0 0 1px #d4e1e2", color: "#49517e" }} />
          </div>
          <div className="space-y-1">
            <label className="text-xs" style={{ color: "#84719b" }}>Monto (MXN)</label>
            <input type="number" min="0" step="0.01" placeholder="0.00" value={monto}
              onChange={e => setMonto(e.target.value)} required
              className="w-full rounded-lg px-3 py-2 text-sm border-0 outline-none"
              style={{ background: "#fff", boxShadow: "0 0 0 1px #d4e1e2", color: "#49517e" }} />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs" style={{ color: "#84719b" }}>Categoría</label>
          <select value={categoria} onChange={e => setCategoria(e.target.value as CategoriaGasto)} required
            className="w-full rounded-lg px-3 py-2 text-sm border-0 outline-none appearance-none"
            style={{ background: "#fff", boxShadow: "0 0 0 1px #d4e1e2", color: "#49517e" }}>
            {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs" style={{ color: "#84719b" }}>Descripción (opcional)</label>
          <input type="text" placeholder="ej. Renta mayo, aceites de masaje..." value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm border-0 outline-none"
            style={{ background: "#fff", boxShadow: "0 0 0 1px #d4e1e2", color: "#49517e" }} />
        </div>

        <button type="submit" disabled={saving}
          className="w-full rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-opacity"
          style={{ background: "#84719b", color: "#fff", opacity: saving ? 0.6 : 1 }}>
          <Plus className="h-4 w-4" />
          {saving ? "Guardando..." : "Agregar gasto"}
        </button>
      </form>

      {/* Filtro desde */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold" style={{ color: "#49517e" }}>
          Total: <span style={{ color: "#84719b" }}>{formatMXN(total)}</span>
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "#84719b" }}>Desde</span>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
            className="rounded-lg px-2 py-1 text-xs border-0 outline-none"
            style={{ background: "#f5f5f8", boxShadow: "0 0 0 1px #d4e1e2", color: "#49517e" }} />
        </div>
      </div>

      {/* Resumen por categoría */}
      {porCategoria.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {porCategoria.map(cat => (
            <div key={cat.value} className="rounded-xl px-3 py-2.5 flex items-center gap-2"
              style={{ background: cat.color, opacity: 0.9 }}>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/80">{cat.label}</p>
                <p className="text-sm font-bold text-white">{formatMXN(cat.total)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : gastos.length === 0 ? (
        <div className="text-center py-12 rounded-2xl" style={{ background: "#f5f5f8" }}>
          <Receipt className="h-8 w-8 mx-auto mb-2" style={{ color: "#d4e1e2" }} />
          <p className="text-sm" style={{ color: "#84719b" }}>Sin gastos registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {gastos.map(g => {
            const cat = CATEGORIAS.find(c => c.value === g.categoria);
            return (
              <div key={g.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: "#fff", border: "1px solid #e8e8f0" }}>
                <div className="h-2 w-2 rounded-full shrink-0" style={{ background: cat?.color ?? "#84719b" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#49517e" }}>
                    {g.descripcion || cat?.label}
                  </p>
                  <p className="text-xs" style={{ color: "#84719b" }}>
                    {cat?.label} · {new Date(g.fecha + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <p className="text-sm font-bold shrink-0" style={{ color: "#49517e" }}>{formatMXN(Number(g.monto))}</p>
                <button onClick={() => handleDelete(g.id)}
                  className="p-1.5 rounded-lg transition-colors hover:opacity-70 shrink-0"
                  style={{ color: "#c0555a" }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="h-24" />
    </div>
  );
}
