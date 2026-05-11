"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Legend,
} from "recharts";
import {
  TrendingUp, Users, Target, Calendar, DollarSign,
  Megaphone, CheckCircle, XCircle, Clock, Search,
} from "lucide-react";
import { formatMXN } from "@/lib/currency";
import { Input } from "@/components/ui/input";

const COLORS = ["#84719b", "#49517e", "#bfd8d2", "#e4a691", "#f5d9d6", "#d4e1e2"];
const METODO_LABEL: Record<string, string> = {
  efectivo: "Efectivo", tarjeta: "Tarjeta", transferencia: "Transferencia",
};

const DIAS_OPTS = [
  { value: 7, label: "7 días" },
  { value: 30, label: "30 días" },
  { value: 90, label: "3 meses" },
  { value: 180, label: "6 meses" },
];

const TABS = ["Resumen", "Citas", "Finanzas"] as const;
type Tab = typeof TABS[number];

function KPI({ label, value, sub, color, icon: Icon }: {
  label: string; value: string | number; sub?: string; color: string; icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: color }}>
      <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-white/30 shrink-0">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-white/80 leading-tight">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-white/70 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold mb-3 mt-5" style={{ color: "#49517e" }}>{children}</h2>;
}

function semanaLabel(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function CitaRow({ c, onFilter }: {
  c: {
    calendly_uuid: string; start_time: string; status: string;
    invitee_name: string | null; event_type_name: string | null;
    asistio: boolean | null; tieneVenta: boolean;
  };
  onFilter: (name: string) => void;
}) {
  const fecha = new Date(c.start_time);
  const isPast = fecha < new Date();
  const cancelled = c.status === "canceled";

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
      style={{ background: cancelled ? "#fff5f5" : c.asistio === false ? "#fff8f5" : "#fff", border: "1px solid #e8e8f0" }}>
      <div className="shrink-0 text-center w-10">
        <p className="text-xs font-bold" style={{ color: "#49517e" }}>{fecha.getDate()}</p>
        <p className="text-xs" style={{ color: "#84719b" }}>
          {fecha.toLocaleDateString("es-MX", { month: "short" })}
        </p>
      </div>

      <div className="flex-1 min-w-0">
        <button className="text-sm font-medium truncate text-left hover:underline block"
          style={{ color: "#49517e" }}
          onClick={() => c.invitee_name && onFilter(c.invitee_name)}>
          {c.invitee_name ?? "Sin nombre"}
        </button>
        <p className="text-xs truncate" style={{ color: "#84719b" }}>
          {c.event_type_name ?? "—"} · {fecha.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {cancelled ? (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#f5d9d6", color: "#c0555a" }}>
            Cancelada
          </span>
        ) : isPast && c.asistio === true ? (
          <CheckCircle className="h-4 w-4" style={{ color: "#5a9c7e" }} />
        ) : isPast && c.asistio === false ? (
          <XCircle className="h-4 w-4" style={{ color: "#c0555a" }} />
        ) : isPast ? (
          <Clock className="h-3.5 w-3.5" style={{ color: "#b0aabe" }} />
        ) : (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#d4e1e2", color: "#49517e" }}>
            Próxima
          </span>
        )}
        {c.tieneVenta && (
          <DollarSign className="h-3.5 w-3.5" style={{ color: "#84719b" }} />
        )}
      </div>
    </div>
  );
}

export default function AnaliticasPage() {
  const [dias, setDias] = useState(30);
  const [tab, setTab] = useState<Tab>("Resumen");
  const [data, setData] = useState<any>(null);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Citas filters
  const [citaFiltro, setCitaFiltro] = useState<"todas" | "activas" | "canceladas" | "asistidas" | "noshow">("todas");
  const [busqueda, setBusqueda] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [anaRes, metaRes] = await Promise.all([
      fetch(`/api/analiticas?dias=${dias}`),
      fetch(`/api/meta?periodo=mes`),
    ]);
    if (anaRes.ok) setData(await anaRes.json());
    if (metaRes.ok) setMeta(await metaRes.json());
    setLoading(false);
  }, [dias]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-3">
      {[...Array(5)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
    </div>
  );

  const citasLista: any[] = data?.calendly?.citasLista ?? [];

  const citasFiltradas = citasLista.filter(c => {
    const matchFiltro =
      citaFiltro === "todas" ? true :
        citaFiltro === "activas" ? c.status === "active" :
          citaFiltro === "canceladas" ? c.status === "canceled" :
            citaFiltro === "asistidas" ? c.asistio === true :
              c.asistio === false;
    const matchBusqueda = !busqueda ||
      c.invitee_name?.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.event_type_name?.toLowerCase().includes(busqueda.toLowerCase());
    return matchFiltro && matchBusqueda;
  });

  const costoPorCita = meta?.configured && meta?.spend && data?.calendly?.agendadas
    ? (meta.spend / data.calendly.agendadas).toFixed(2)
    : null;

  const gastosMeta = (meta?.configured && !meta?.error) ? (meta?.spend ?? 0) : 0;
  const gastosOtros = data?.gastos?.total ?? 0;
  const totalGastos = gastosMeta + gastosOtros;
  const ingresosMXN = data?.financiero?.totalMXN ?? 0;
  const gananciaNeta = ingresosMXN - totalGastos;
  const margenPct = ingresosMXN > 0 ? Math.round((gananciaNeta / ingresosMXN) * 100) : 0;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold" style={{ color: "#49517e" }}>Analíticas</h1>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {DIAS_OPTS.map(o => (
            <button key={o.value} onClick={() => setDias(o.value)}
              className="text-xs px-2.5 py-1.5 rounded-md transition-colors font-medium"
              style={{ background: dias === o.value ? "#84719b" : "transparent", color: dias === o.value ? "white" : "#84719b" }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b" style={{ borderColor: "#d4e1e2" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              color: tab === t ? "#49517e" : "#84719b",
              borderBottom: tab === t ? "2px solid #84719b" : "2px solid transparent",
              marginBottom: "-1px",
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* ══════════════════ RESUMEN TAB ══════════════════ */}
      {tab === "Resumen" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <KPI label="Ingresos MXN" value={formatMXN(data?.financiero?.totalMXN ?? 0)}
              sub={`${data?.financiero?.totalVentas ?? 0} ventas`} color="#84719b" icon={DollarSign} />
            <KPI label="Ticket promedio" value={formatMXN(data?.financiero?.ticketPromedio ?? 0)}
              color="#49517e" icon={TrendingUp} />
            <KPI label="Citas agendadas" value={data?.calendly?.agendadas ?? 0}
              sub={`${data?.calendly?.canceladas ?? 0} canceladas`} color="#bfd8d2" icon={Calendar} />
            <KPI label="% Cierre" value={`${data?.calendly?.pctCierre ?? 0}%`}
              sub="citas → venta" color="#e4a691" icon={Target} />
          </div>

          {meta?.configured && meta?.error && (
            <div className="rounded-xl p-3 mt-4 text-xs" style={{ background: "#fff5f5", color: "#c0555a", border: "1px solid #f5d9d6" }}>
              <strong>Meta Ads — error:</strong> {meta.error}
            </div>
          )}

          {meta?.configured && !meta?.error && (
            <>
              <SectionTitle>📣 Meta Ads</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <KPI label="Gasto en ads" value={`$${meta.spend?.toFixed(2) ?? "0"} MXN`} color="#49517e" icon={Megaphone} />
                <KPI label="Costo por cita" value={costoPorCita ? `$${costoPorCita} MXN` : "—"}
                  sub="gasto / citas" color="#84719b" icon={Target} />
                <KPI label="Alcance" value={(meta.reach ?? 0).toLocaleString()} color="#bfd8d2" icon={Users} />
                <KPI label="Clicks" value={(meta.clicks ?? 0).toLocaleString()}
                  sub={`CPM $${meta.cpm?.toFixed(2) ?? 0}`} color="#e4a691" icon={TrendingUp} />
              </div>
            </>
          )}

          {(data?.semanas?.length ?? 0) > 0 && (
            <>
              <SectionTitle>💰 Ingresos por semana</SectionTitle>
              <div className="rounded-xl p-4" style={{ background: "#f5f5f8" }}>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={data.semanas.map((s: any) => ({ ...s, semana: semanaLabel(s.semana) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e8" />
                    <XAxis dataKey="semana" tick={{ fontSize: 11, fill: "#84719b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#84719b" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: any) => formatMXN(Number(v))} labelStyle={{ color: "#49517e" }} />
                    <Bar dataKey="total" fill="#84719b" radius={[4, 4, 0, 0]} name="Ingresos" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="rounded-xl p-4 text-center" style={{ background: "#bfd8d2" }}>
              <p className="text-2xl font-bold" style={{ color: "#49517e" }}>{data?.calendly?.clientesNuevos ?? 0}</p>
              <p className="text-xs mt-1" style={{ color: "#49517e" }}>Clientes nuevas</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: "#f5d9d6" }}>
              <p className="text-2xl font-bold" style={{ color: "#49517e" }}>{data?.calendly?.clientesRecurrentes ?? 0}</p>
              <p className="text-xs mt-1" style={{ color: "#49517e" }}>Clientes recurrentes</p>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════ CITAS TAB ══════════════════ */}
      {tab === "Citas" && (
        <>
          {/* KPIs de citas */}
          <div className="grid grid-cols-2 gap-3">
            <KPI label="Agendadas" value={data?.calendly?.agendadas ?? 0}
              sub={`${data?.calendly?.pctCancelacion ?? 0}% cancelación`} color="#84719b" icon={Calendar} />
            <KPI label="% Asistencia" value={`${data?.calendly?.pctAsistencia ?? 0}%`}
              sub={`${data?.calendly?.asistieron ?? 0} confirmadas`} color="#49517e" icon={CheckCircle} />
            <KPI label="No-show" value={data?.calendly?.noAsistieron ?? 0}
              sub="no asistieron" color="#e4a691" icon={XCircle} />
            <KPI label="% Cierre" value={`${data?.calendly?.pctCierre ?? 0}%`}
              sub={`${data?.calendly?.citasConVenta ?? 0} con venta`} color="#bfd8d2" icon={Target} />
          </div>

          {/* Citas por semana — mejorado */}
          {(data?.calendly?.citasSemana?.length ?? 0) > 0 && (
            <>
              <SectionTitle>📅 Citas por semana</SectionTitle>
              <div className="rounded-xl p-4" style={{ background: "#f5f5f8" }}>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data.calendly.citasSemana.map((s: any) => ({ ...s, semana: semanaLabel(s.semana) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e8" />
                    <XAxis dataKey="semana" tick={{ fontSize: 11, fill: "#84719b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#84719b" }} allowDecimals={false} />
                    <Tooltip
                      labelStyle={{ color: "#49517e", fontWeight: 600 }}
                      contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="agendadas" fill="#84719b" radius={[4, 4, 0, 0]} name="Agendadas" />
                    <Bar dataKey="asistidas" fill="#bfd8d2" radius={[4, 4, 0, 0]} name="Asistidas" />
                    <Bar dataKey="canceladas" fill="#e4a691" radius={[4, 4, 0, 0]} name="Canceladas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {/* Día de la semana más popular */}
          {(data?.calendly?.porDiaSemana?.some((d: any) => d.count > 0)) && (
            <>
              <SectionTitle>📊 Día más popular</SectionTitle>
              <div className="rounded-xl p-4" style={{ background: "#f5f5f8" }}>
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={data.calendly.porDiaSemana} layout="vertical" margin={{ left: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#84719b" }} allowDecimals={false} />
                    <YAxis type="category" dataKey="dia" tick={{ fontSize: 11, fill: "#49517e" }} width={32} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                    <Bar dataKey="count" name="Citas" radius={[0, 4, 4, 0]}>
                      {data.calendly.porDiaSemana.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {/* Lista de citas filtrables */}
          <SectionTitle>🗓 Todas las citas</SectionTitle>

          {/* Barra de filtros */}
          <div className="space-y-2 mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "#84719b" }} />
              <Input
                placeholder="Buscar por cliente o servicio..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="pl-8 text-sm bg-white border-0"
                style={{ boxShadow: "0 0 0 1px #d4e1e2" }}
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {([
                { key: "todas", label: `Todas (${citasLista.length})` },
                { key: "activas", label: `Activas (${citasLista.filter(c => c.status === "active").length})` },
                { key: "canceladas", label: `Canceladas (${citasLista.filter(c => c.status === "canceled").length})` },
                { key: "asistidas", label: `Asistidas (${citasLista.filter(c => c.asistio === true).length})` },
                { key: "noshow", label: `No-show (${citasLista.filter(c => c.asistio === false).length})` },
              ] as const).map(({ key, label }) => (
                <button key={key} onClick={() => setCitaFiltro(key)}
                  className="text-xs px-3 py-1 rounded-full transition-colors"
                  style={{
                    background: citaFiltro === key ? "#84719b" : "#f5f5f8",
                    color: citaFiltro === key ? "white" : "#84719b",
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista */}
          <div className="space-y-1.5">
            {citasFiltradas.length === 0 ? (
              <div className="text-center py-8 rounded-xl" style={{ background: "#f5f5f8" }}>
                <p className="text-sm" style={{ color: "#84719b" }}>Sin resultados</p>
              </div>
            ) : (
              citasFiltradas.map(c => (
                <CitaRow key={c.calendly_uuid} c={c} onFilter={(name) => { setBusqueda(name); }} />
              ))
            )}
          </div>

          {busqueda && (
            <button className="text-xs mt-2 underline block mx-auto" style={{ color: "#84719b" }}
              onClick={() => setBusqueda("")}>
              Limpiar búsqueda
            </button>
          )}
        </>
      )}

      {/* ══════════════════ FINANZAS TAB ══════════════════ */}
      {tab === "Finanzas" && (
        <>
          {/* P&L resumen */}
          <div className="rounded-2xl p-4 mb-4" style={{ background: "#f5f5f8", border: "1px solid #d4e1e2" }}>
            <p className="text-xs font-semibold mb-3" style={{ color: "#84719b" }}>Resumen del período</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: "#49517e" }}>Ingresos</span>
                <span className="font-semibold" style={{ color: "#49517e" }}>{formatMXN(ingresosMXN)}</span>
              </div>
              {gastosMeta > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#84719b" }}>— Publicidad (Meta Ads)</span>
                  <span style={{ color: "#c0555a" }}>−{formatMXN(gastosMeta)}</span>
                </div>
              )}
              {gastosOtros > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#84719b" }}>— Otros gastos</span>
                  <span style={{ color: "#c0555a" }}>−{formatMXN(gastosOtros)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-sm font-bold" style={{ borderColor: "#d4e1e2" }}>
                <span style={{ color: "#49517e" }}>Ganancia neta</span>
                <span style={{ color: gananciaNeta >= 0 ? "#5a9c7e" : "#c0555a" }}>{formatMXN(gananciaNeta)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <KPI label="Total MXN" value={formatMXN(data?.financiero?.totalMXN ?? 0)}
              sub={`${data?.financiero?.totalVentas ?? 0} ventas`} color="#84719b" icon={DollarSign} />
            <KPI label="Margen neto" value={`${margenPct}%`}
              sub="después de gastos" color={margenPct >= 0 ? "#5a9c7e" : "#c0555a"} icon={TrendingUp} />
            <KPI label="Total gastos" value={formatMXN(totalGastos)}
              sub={gastosMeta > 0 ? `Ads: ${formatMXN(gastosMeta)}` : undefined} color="#e4a691" icon={DollarSign} />
            <KPI label="Ticket promedio" value={formatMXN(data?.financiero?.ticketPromedio ?? 0)}
              color="#49517e" icon={TrendingUp} />
            {(data?.financiero?.totalUSD ?? 0) > 0 && (
              <KPI label="Total USD" value={`$${data.financiero.totalUSD.toFixed(2)}`}
                color="#bfd8d2" icon={DollarSign} />
            )}
          </div>

          {(data?.semanas?.length ?? 0) > 0 && (
            <>
              <SectionTitle>💰 Ingresos por semana</SectionTitle>
              <div className="rounded-xl p-4" style={{ background: "#f5f5f8" }}>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data.semanas.map((s: any) => ({ ...s, semana: semanaLabel(s.semana) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e8" />
                    <XAxis dataKey="semana" tick={{ fontSize: 11, fill: "#84719b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#84719b" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: any) => formatMXN(Number(v))} labelStyle={{ color: "#49517e" }} />
                    <Bar dataKey="total" fill="#84719b" radius={[4, 4, 0, 0]} name="Ingresos" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {(data?.porServicio?.length ?? 0) > 0 && (
            <>
              <SectionTitle>💆 Por servicio</SectionTitle>
              <div className="space-y-2">
                {data.porServicio.map((s: any, i: number) => {
                  const pct = Math.round((s.total / (data.financiero.totalMXN || 1)) * 100);
                  return (
                    <div key={s.servicio} className="rounded-lg p-3" style={{ background: "#f5f5f8" }}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-medium" style={{ color: "#49517e" }}>{s.servicio}</span>
                        <div className="text-right">
                          <span className="text-sm font-bold" style={{ color: "#84719b" }}>{formatMXN(s.total)}</span>
                          <span className="text-xs ml-2" style={{ color: "#84719b" }}>{s.count} ses.</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "#d4e1e2" }}>
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                      </div>
                      <p className="text-xs mt-1 text-right" style={{ color: "#b0aabe" }}>{pct}%</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Desglose de gastos */}
          {(totalGastos > 0) && (
            <>
              <SectionTitle>📋 Desglose de gastos</SectionTitle>
              <div className="space-y-2">
                {gastosMeta > 0 && (
                  <div className="flex items-center justify-between rounded-lg px-3 py-2.5"
                    style={{ background: "#f5f5f8" }}>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ background: "#49517e" }} />
                      <span className="text-sm" style={{ color: "#49517e" }}>Meta Ads</span>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: "#c0555a" }}>{formatMXN(gastosMeta)}</span>
                  </div>
                )}
                {(data?.gastos?.porCategoria ?? []).map((g: { categoria: string; total: number }) => (
                  <div key={g.categoria} className="flex items-center justify-between rounded-lg px-3 py-2.5"
                    style={{ background: "#f5f5f8" }}>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ background: "#84719b" }} />
                      <span className="text-sm capitalize" style={{ color: "#49517e" }}>{g.categoria}</span>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: "#c0555a" }}>{formatMXN(g.total)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {(data?.porMetodo?.length ?? 0) > 0 && (
            <>
              <SectionTitle>💳 Método de pago</SectionTitle>
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
        </>
      )}

      <div className="h-20" />
    </div>
  );
}
