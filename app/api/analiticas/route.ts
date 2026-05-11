import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const now = new Date();

  let desde: Date;
  let hasta: Date;
  if (searchParams.get("desde") && searchParams.get("hasta")) {
    desde = new Date(searchParams.get("desde")!);
    hasta = new Date(searchParams.get("hasta")!);
    hasta.setHours(23, 59, 59, 999);
  } else {
    const dias = parseInt(searchParams.get("dias") ?? "30");
    desde = new Date(now.getTime() - dias * 86400000);
    hasta = now;
  }

  const desdeDate = desde.toISOString().split("T")[0];

  const hastaDate = hasta.toISOString().split("T")[0];

  const [ventas, citas, gastosQ] = await Promise.all([
    supabase.from("ventas").select("*").gte("created_at", desde.toISOString()).lte("created_at", hasta.toISOString()).order("created_at"),
    supabase.from("calendly_cache").select("*").gte("start_time", desde.toISOString()).lte("start_time", hasta.toISOString()).order("start_time", { ascending: false }),
    supabase.from("gastos").select("*").gte("fecha", desdeDate).lte("fecha", hastaDate).order("fecha", { ascending: false }),
  ]);

  const ventasData = ventas.data ?? [];
  const citasData = citas.data ?? [];
  const gastosData = gastosQ.data ?? [];

  // ── Gastos ──────────────────────────────────────────────
  const totalGastos = gastosData.reduce((s: number, g: { monto: number }) => s + Number(g.monto), 0);
  const porCategoriaGastos: Record<string, number> = {};
  for (const g of gastosData) {
    porCategoriaGastos[g.categoria] = (porCategoriaGastos[g.categoria] ?? 0) + Number(g.monto);
  }

  // ── Financiero ──────────────────────────────────────────
  const ventasMXN = ventasData.filter(v => v.moneda === "MXN");
  const ventasUSD = ventasData.filter(v => v.moneda === "USD");
  const totalMXN = ventasMXN.reduce((s, v) => s + v.monto, 0);
  const totalUSD = ventasUSD.reduce((s, v) => s + v.monto, 0);
  const ticketPromedio = ventasMXN.length > 0 ? totalMXN / ventasMXN.length : 0;

  // ── Por servicio ────────────────────────────────────────
  const porServicio: Record<string, { count: number; total: number }> = {};
  for (const v of ventasMXN) {
    if (!porServicio[v.servicio]) porServicio[v.servicio] = { count: 0, total: 0 };
    porServicio[v.servicio].count++;
    porServicio[v.servicio].total += v.monto;
  }

  // ── Por método de pago ──────────────────────────────────
  const porMetodo: Record<string, number> = {};
  for (const v of ventasMXN) {
    porMetodo[v.metodo_pago] = (porMetodo[v.metodo_pago] ?? 0) + v.monto;
  }

  // ── Ingresos por semana ─────────────────────────────────
  const semanas: Record<string, number> = {};
  for (const v of ventasMXN) {
    const d = new Date(v.created_at);
    const monday = new Date(d);
    monday.setDate(d.getDate() - d.getDay() + 1);
    const key = monday.toISOString().split("T")[0];
    semanas[key] = (semanas[key] ?? 0) + v.monto;
  }

  // ── Citas por semana ────────────────────────────────────
  const citasSemana: Record<string, { agendadas: number; canceladas: number; asistidas: number }> = {};
  for (const c of citasData) {
    const d = new Date(c.start_time);
    const monday = new Date(d);
    monday.setDate(d.getDate() - d.getDay() + 1);
    const key = monday.toISOString().split("T")[0];
    if (!citasSemana[key]) citasSemana[key] = { agendadas: 0, canceladas: 0, asistidas: 0 };
    if (c.status === "active") citasSemana[key].agendadas++;
    else citasSemana[key].canceladas++;
    if (c.asistio === true) citasSemana[key].asistidas++;
  }

  // ── Citas por día de semana ─────────────────────────────
  const porDiaSemana = [0, 0, 0, 0, 0, 0, 0]; // Dom-Sáb
  for (const c of citasData.filter((c: { status: string }) => c.status === "active")) {
    const day = new Date(c.start_time).getDay();
    porDiaSemana[day]++;
  }

  // ── Citas por hora ──────────────────────────────────────
  const porHora: Record<number, number> = {};
  for (const c of citasData.filter((c: { status: string }) => c.status === "active")) {
    const h = new Date(c.start_time).getHours();
    porHora[h] = (porHora[h] ?? 0) + 1;
  }

  // ── Calendly KPIs ───────────────────────────────────────
  const agendadas = citasData.filter((c: { status: string }) => c.status === "active").length;
  const canceladas = citasData.filter((c: { status: string }) => c.status === "canceled").length;
  const asistieron = citasData.filter((c: { asistio: boolean }) => c.asistio === true).length;
  const noAsistieron = citasData.filter((c: { asistio: boolean }) => c.asistio === false).length;
  const sinConfirmar = agendadas - asistieron - noAsistieron;

  const calendlyUuidsConVenta = new Set(ventasData.map((v: { calendly_event_uuid: string }) => v.calendly_event_uuid).filter(Boolean));
  const citasConVenta = citasData.filter((c: { calendly_uuid: string }) => calendlyUuidsConVenta.has(c.calendly_uuid)).length;
  const pctCierre = agendadas > 0 ? Math.round((citasConVenta / agendadas) * 100) : 0;
  const pctAsistencia = (asistieron + noAsistieron) > 0 ? Math.round((asistieron / (asistieron + noAsistieron)) * 100) : 0;
  const pctCancelacion = (agendadas + canceladas) > 0 ? Math.round((canceladas / (agendadas + canceladas)) * 100) : 0;

  // ── Clientes nuevos vs recurrentes ──────────────────────
  const emailCount: Record<string, number> = {};
  for (const c of citasData.filter((c: { invitee_email: string }) => c.invitee_email)) {
    emailCount[c.invitee_email] = (emailCount[c.invitee_email] ?? 0) + 1;
  }

  // ── Lista completa de citas ─────────────────────────────
  const citasLista = citasData.map((c: Record<string, unknown>) => ({
    calendly_uuid: c.calendly_uuid,
    start_time: c.start_time,
    end_time: c.end_time,
    status: c.status,
    invitee_name: c.invitee_name,
    invitee_email: c.invitee_email,
    event_type_name: c.event_type_name,
    asistio: c.asistio,
    tieneVenta: calendlyUuidsConVenta.has(c.calendly_uuid as string),
  }));

  return NextResponse.json({
    financiero: { totalMXN, totalUSD, ticketPromedio, totalVentas: ventasData.length },
    gastos: {
      total: totalGastos,
      porCategoria: Object.entries(porCategoriaGastos).map(([categoria, total]) => ({ categoria, total })),
    },
    porServicio: Object.entries(porServicio)
      .map(([servicio, d]) => ({ servicio, ...d }))
      .sort((a, b) => b.total - a.total),
    porMetodo: Object.entries(porMetodo).map(([metodo, total]) => ({ metodo, total })),
    semanas: Object.entries(semanas)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([semana, total]) => ({ semana, total })),
    calendly: {
      agendadas, canceladas, asistieron, noAsistieron, sinConfirmar,
      citasConVenta, pctCierre, pctAsistencia, pctCancelacion,
      citasSemana: Object.entries(citasSemana)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([semana, d]) => ({ semana, ...d })),
      porDiaSemana: porDiaSemana.map((count, i) => ({
        dia: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][i],
        count,
      })),
      porHora: Object.entries(porHora)
        .map(([h, count]) => ({ hora: `${h.padStart(2, "0")}:00`, count }))
        .sort((a, b) => a.hora.localeCompare(b.hora)),
      clientesNuevos: Object.values(emailCount).filter(n => n === 1).length,
      clientesRecurrentes: Object.values(emailCount).filter(n => n > 1).length,
      citasLista,
    },
  });
}
