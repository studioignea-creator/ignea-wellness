"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { TrendingUp, Users, Target, Calendar, DollarSign, Megaphone } from "lucide-react";
import { formatMXN } from "@/lib/currency";

const COLORS = ["#84719b", "#49517e", "#bfd8d2", "#e4a691", "#f5d9d6", "#d4e1e2"];
const METODO_LABEL: Record<string, string> = { efectivo: "Efectivo", tarjeta: "Tarjeta", transferencia: "Transferencia" };

function KPI({ label, value, sub, color, icon: Icon }: {
  label: string; value: string; sub?: string; color: string; icon: React.ElementType
}) {
  return (
    <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: color }}>
      <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-white/30 shrink-0">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="text-xs text-white/80">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-white/70 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold mb-3 mt-6" style={{ color: "#49517e" }}>{children}</h2>;
}

const PERIODO_OPTS = [
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Este mes" },
  { value: "trimestre", label: "Trimestre" },
];

export default function AnaliticasPage() {
  const [periodo, setPeriodo] = useState("mes");
  const [data, setData] = useState<any>(null);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [anaRes, metaRes] = await Promise.all([
      fetch(`/api/analiticas?periodo=${periodo}`),
      fetch(`/api/meta?periodo=${periodo}`),
    ]);
    if (anaRes.ok) setData(await anaRes.json());
    if (metaRes.ok) setMeta(await metaRes.json());
    setLoading(false);
  }, [periodo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const semanaLabel = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  if (loading) return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-3">
      {[...Array(5)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
    </div>
  );

  const pctCancelacion = data?.calendly
    ? Math.round((data.calendly.canceladas / (data.calendly.agendadas + data.calendly.canceladas || 1)) * 100)
    : 0;

  const costoPorCita = meta?.configured && meta?.spend && data?.calendly?.agendadas
    ? (meta.spend / data.calendly.agendadas).toFixed(2)
    : null;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">

      {/* Header + periodo */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold" style={{ color: "#49517e" }}>Analíticas</h1>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {PERIODO_OPTS.map(o => (
            <button
              key={o.value}
              onClick={() => setPeriodo(o.value)}
              className="text-xs px-3 py-1.5 rounded-md transition-colors font-medium"
              style={{
                background: periodo === o.value ? "#84719b" : "transparent",
                color: periodo === o.value ? "white" : "#84719b",
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs financieros */}
      <div className="grid grid-cols-2 gap-3">
        <KPI label="Ingresos MXN" value={formatMXN(data?.financiero?.totalMXN ?? 0)} sub={`${data?.financiero?.totalVentas ?? 0} ventas`} color="#84719b" icon={DollarSign} />
        <KPI label="Ticket promedio" value={formatMXN(data?.financiero?.ticketPromedio ?? 0)} color="#49517e" icon={TrendingUp} />
        <KPI label="Citas agendadas" value={data?.calendly?.agendadas ?? 0} sub={`${data?.calendly?.canceladas ?? 0} canceladas`} color="#bfd8d2" icon={Calendar} />
        <KPI label="% Cierre" value={`${data?.calendly?.pctCierre ?? 0}%`} sub="citas → venta" color="#e4a691" icon={Target} />
      </div>

      {/* Meta Ads */}
      {meta?.configured && !meta?.error && (
        <>
          <SectionTitle>📣 Meta Ads</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <KPI label="Gasto en ads" value={`$${meta.spend?.toFixed(2) ?? "0"} USD`} color="#49517e" icon={Megaphone} />
            <KPI label="Costo por cita" value={costoPorCita ? `$${costoPorCita} USD` : "—"} sub="gasto / citas" color="#84719b" icon={Target} />
            <KPI label="Alcance" value={(meta.reach ?? 0).toLocaleString()} color="#bfd8d2" icon={Users} />
            <KPI label="Clicks" value={(meta.clicks ?? 0).toLocaleString()} sub={`CPM $${meta.cpm?.toFixed(2) ?? 0}`} color="#e4a691" icon={TrendingUp} />
          </div>
        </>
      )}

      {meta?.configured === false && (
        <div className="rounded-xl p-4 mt-4 text-center text-sm" style={{ background: "#f5d9d6", color: "#49517e" }}>
          Conecta Meta Ads agregando <strong>META_ACCESS_TOKEN</strong> y <strong>META_AD_ACCOUNT_ID</strong> en Vercel.
        </div>
      )}

      {/* Ingresos por semana */}
      {(data?.semanas?.length ?? 0) > 0 && (
        <>
          <SectionTitle>💰 Ingresos por semana</SectionTitle>
          <div className="rounded-xl p-4" style={{ background: "#f5f5f8" }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.semanas.map((s: any) => ({ ...s, semana: semanaLabel(s.semana) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e8" />
                <XAxis dataKey="semana" tick={{ fontSize: 11, fill: "#84719b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#84719b" }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatMXN(v)} labelStyle={{ color: "#49517e" }} />
                <Bar dataKey="total" fill="#84719b" radius={[4, 4, 0, 0]} name="Ingresos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Citas: agendadas vs canceladas */}
      {(data?.calendly?.citasSemana?.length ?? 0) > 0 && (
        <>
          <SectionTitle>📅 Citas por semana</SectionTitle>
          <div className="rounded-xl p-4" style={{ background: "#f5f5f8" }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.calendly.citasSemana.map((s: any) => ({ ...s, semana: semanaLabel(s.semana) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e8" />
                <XAxis dataKey="semana" tick={{ fontSize: 11, fill: "#84719b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#84719b" }} />
                <Tooltip labelStyle={{ color: "#49517e" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="agendadas" fill="#84719b" radius={[4, 4, 0, 0]} name="Agendadas" />
                <Bar dataKey="canceladas" fill="#e4a691" radius={[4, 4, 0, 0]} name="Canceladas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Por servicio */}
      {(data?.porServicio?.length ?? 0) > 0 && (
        <>
          <SectionTitle>💆 Ingresos por servicio</SectionTitle>
          <div className="space-y-2">
            {data.porServicio.map((s: any, i: number) => {
              const pct = Math.round((s.total / (data.financiero.totalMXN || 1)) * 100);
              return (
                <div key={s.servicio} className="rounded-lg p-3" style={{ background: "#f5f5f8" }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium" style={{ color: "#49517e" }}>{s.servicio}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold" style={{ color: "#84719b" }}>{formatMXN(s.total)}</span>
                      <span className="text-xs ml-2" style={{ color: "#84719b" }}>{s.count} sesión{s.count !== 1 ? "es" : ""}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "#d4e1e2" }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Método de pago */}
      {(data?.porMetodo?.length ?? 0) > 0 && (
        <>
          <SectionTitle>💳 Por método de pago</SectionTitle>
          <div className="rounded-xl p-4 flex items-center gap-4" style={{ background: "#f5f5f8" }}>
            <PieChart width={120} height={120}>
              <Pie data={data.porMetodo} dataKey="total" nameKey="metodo" cx="50%" cy="50%" outerRadius={55} innerRadius={30}>
                {data.porMetodo.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
            </PieChart>
            <div className="space-y-2 flex-1">
              {data.porMetodo.map((m: any, i: number) => (
                <div key={m.metodo} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span style={{ color: "#49517e" }}>{METODO_LABEL[m.metodo] ?? m.metodo}</span>
                  </div>
                  <span className="font-semibold" style={{ color: "#84719b" }}>{formatMXN(m.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Clientes */}
      <SectionTitle>👥 Clientes</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-4 text-center" style={{ background: "#bfd8d2" }}>
          <p className="text-2xl font-bold" style={{ color: "#49517e" }}>{data?.calendly?.clientesNuevos ?? 0}</p>
          <p className="text-xs mt-1" style={{ color: "#49517e" }}>Clientes nuevas</p>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: "#f5d9d6" }}>
          <p className="text-2xl font-bold" style={{ color: "#49517e" }}>{data?.calendly?.clientesRecurrentes ?? 0}</p>
          <p className="text-xs mt-1" style={{ color: "#49517e" }}>Clientes recurrentes</p>
        </div>
      </div>

      <div className="h-20" />
    </div>
  );
}
