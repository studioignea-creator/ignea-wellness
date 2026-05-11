import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const periodo = searchParams.get("periodo") ?? "mes"; // "semana" | "mes" | "trimestre"

  const now = new Date();
  let desde: Date;

  if (periodo === "semana") {
    desde = new Date(now);
    desde.setDate(now.getDate() - 7);
  } else if (periodo === "trimestre") {
    desde = new Date(now);
    desde.setMonth(now.getMonth() - 3);
  } else {
    desde = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const [ventas, citas] = await Promise.all([
    supabase.from("ventas").select("*").gte("created_at", desde.toISOString()).order("created_at"),
    supabase.from("calendly_cache").select("*").gte("start_time", desde.toISOString()).order("start_time"),
  ]);

  const ventasData = ventas.data ?? [];
  const citasData = citas.data ?? [];

  // ── Financiero ──────────────────────────────────
  const totalMXN = ventasData.filter(v => v.moneda === "MXN").reduce((s, v) => s + v.monto, 0);
  const totalUSD = ventasData.filter(v => v.moneda === "USD").reduce((s, v) => s + v.monto, 0);
  const ticketPromedio = ventasData.length > 0 ? totalMXN / ventasData.filter(v => v.moneda === "MXN").length : 0;

  // ── Por servicio ────────────────────────────────
  const porServicio: Record<string, { count: number; total: number }> = {};
  for (const v of ventasData.filter(v => v.moneda === "MXN")) {
    if (!porServicio[v.servicio]) porServicio[v.servicio] = { count: 0, total: 0 };
    porServicio[v.servicio].count++;
    porServicio[v.servicio].total += v.monto;
  }

  // ── Por método de pago ──────────────────────────
  const porMetodo: Record<string, number> = {};
  for (const v of ventasData.filter(v => v.moneda === "MXN")) {
    porMetodo[v.metodo_pago] = (porMetodo[v.metodo_pago] ?? 0) + v.monto;
  }

  // ── Ingresos por semana (últimas 8 semanas) ──────
  const semanas: Record<string, number> = {};
  for (const v of ventasData.filter(v => v.moneda === "MXN")) {
    const d = new Date(v.created_at);
    const monday = new Date(d);
    monday.setDate(d.getDate() - d.getDay() + 1);
    const key = monday.toISOString().split("T")[0];
    semanas[key] = (semanas[key] ?? 0) + v.monto;
  }

  // ── Calendly analytics ──────────────────────────
  const agendadas = citasData.filter(c => c.status === "active").length;
  const canceladas = citasData.filter(c => c.status === "canceled").length;
  const asistieron = citasData.filter(c => c.asistio === true).length;
  const noAsistieron = citasData.filter(c => c.asistio === false).length;

  // % cierre automático: citas con venta registrada
  const calendlyUuidsConVenta = new Set(ventasData.map(v => v.calendly_event_uuid).filter(Boolean));
  const citasConVenta = citasData.filter(c => calendlyUuidsConVenta.has(c.calendly_uuid)).length;
  const totalCitas = agendadas + canceladas;
  const pctCierre = totalCitas > 0 ? Math.round((citasConVenta / agendadas) * 100) : 0;

  // Citas por tipo de servicio
  const citasPorTipo: Record<string, number> = {};
  for (const c of citasData.filter(c => c.status === "active")) {
    const tipo = c.event_type_name ?? "Otro";
    citasPorTipo[tipo] = (citasPorTipo[tipo] ?? 0) + 1;
  }

  // Citas por semana
  const citasSemana: Record<string, { agendadas: number; canceladas: number }> = {};
  for (const c of citasData) {
    const d = new Date(c.start_time);
    const monday = new Date(d);
    monday.setDate(d.getDate() - d.getDay() + 1);
    const key = monday.toISOString().split("T")[0];
    if (!citasSemana[key]) citasSemana[key] = { agendadas: 0, canceladas: 0 };
    if (c.status === "active") citasSemana[key].agendadas++;
    else citasSemana[key].canceladas++;
  }

  // Clientes nuevos vs recurrentes
  const emailCount: Record<string, number> = {};
  for (const c of citasData.filter(c => c.invitee_email)) {
    emailCount[c.invitee_email] = (emailCount[c.invitee_email] ?? 0) + 1;
  }
  const clientesNuevos = Object.values(emailCount).filter(n => n === 1).length;
  const clientesRecurrentes = Object.values(emailCount).filter(n => n > 1).length;

  return NextResponse.json({
    financiero: { totalMXN, totalUSD, ticketPromedio, totalVentas: ventasData.length },
    porServicio: Object.entries(porServicio)
      .map(([servicio, d]) => ({ servicio, ...d }))
      .sort((a, b) => b.total - a.total),
    porMetodo: Object.entries(porMetodo).map(([metodo, total]) => ({ metodo, total })),
    semanas: Object.entries(semanas)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([semana, total]) => ({ semana, total })),
    calendly: {
      agendadas, canceladas, asistieron, noAsistieron,
      citasConVenta, pctCierre, citasPorTipo,
      citasSemana: Object.entries(citasSemana)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([semana, d]) => ({ semana, ...d })),
      clientesNuevos, clientesRecurrentes,
    },
  });
}
