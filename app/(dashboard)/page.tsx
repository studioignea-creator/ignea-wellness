import { TrendingUp, AlertTriangle, Calendar, Sparkles, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMXN } from "@/lib/currency";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import MensajeAmor from "@/components/dashboard/MensajeAmor";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const supabase = createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);
  const monthName = now.toLocaleDateString("es-MX", { month: "long", year: "numeric" });

  const SISTEMA_DESDE = "2026-05-01";

  const [weekVentas, monthVentas, todayCitas, allProductos, pendientesQ] = await Promise.all([
    supabase.from("ventas").select("monto, moneda, metodo_pago").gte("created_at", weekStart.toISOString()).lte("created_at", todayEnd.toISOString()),
    supabase.from("ventas").select("monto, moneda").gte("created_at", monthStart.toISOString()).lte("created_at", monthEnd.toISOString()).eq("moneda", "MXN"),
    supabase.from("calendly_cache").select("calendly_uuid, start_time, end_time, invitee_name, event_type_name, status").gte("start_time", todayStart.toISOString()).lte("start_time", todayEnd.toISOString()).eq("status", "active").order("start_time"),
    supabase.from("productos").select("nombre, marca, stock_actual, stock_minimo"),
    supabase.from("calendly_cache")
      .select("calendly_uuid, invitee_name, start_time")
      .eq("status", "active")
      .gte("start_time", SISTEMA_DESDE)
      .lt("end_time", now.toISOString())
      .is("asistio", null),
  ]);

  const weekMXN = (weekVentas.data ?? []).filter((v) => v.moneda === "MXN").reduce((s, v) => s + v.monto, 0);
  const weekCount = (weekVentas.data ?? []).length;
  const monthTotal = (monthVentas.data ?? []).reduce((s, v) => s + v.monto, 0);

  const byMethod = (weekVentas.data ?? []).reduce<Record<string, number>>((acc, v) => {
    if (v.moneda !== "MXN") return acc;
    acc[v.metodo_pago] = (acc[v.metodo_pago] ?? 0) + v.monto;
    return acc;
  }, {});

  const lowStockProducts = (allProductos.data ?? []).filter(p => p.stock_actual <= p.stock_minimo);

  const pendientesCitas = pendientesQ.data ?? [];

  return { weekMXN, weekCount, monthTotal, monthName, byMethod, todayCitas: todayCitas.data ?? [], lowStockProducts, pendientesCitas };
}

const METODO_LABEL: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
};

export default async function DashboardPage() {
  const data = await getDashboardData();
  const now = new Date();

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #84719b, #49517e)" }}>
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "#49517e" }}>Ignea Wellness</h1>
          <p className="text-xs capitalize" style={{ color: "#84719b" }}>
            {now.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
      </div>

      <MensajeAmor />

      {/* Alerta pendientes de confirmar */}
      {data.pendientesCitas.length > 0 && (
        <Link href="/agenda">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 transition-opacity hover:opacity-80"
            style={{ background: "#fff8f5", border: "1px solid #f5d9d6" }}>
            <AlertCircle className="h-4 w-4 shrink-0" style={{ color: "#c0555a" }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "#c0555a" }}>
                {data.pendientesCitas.length} cita{data.pendientesCitas.length !== 1 ? "s" : ""} sin confirmar asistencia
              </p>
              <p className="text-xs truncate" style={{ color: "#84719b" }}>
                {data.pendientesCitas.slice(0, 2).map(c => c.invitee_name ?? "Sin nombre").join(", ")}
                {data.pendientesCitas.length > 2 ? ` +${data.pendientesCitas.length - 2} más` : ""}
              </p>
            </div>
            <span className="text-xs shrink-0" style={{ color: "#c0555a" }}>→ Confirmar</span>
          </div>
        </Link>
      )}

      {/* Week Revenue */}
      <div className="rounded-xl p-5 mb-4 text-white" style={{ background: "linear-gradient(135deg, #49517e 0%, #84719b 100%)" }}>
        <p className="text-sm opacity-80 mb-1">Ingresos de la semana</p>
        <p className="text-4xl font-bold">{formatMXN(data.weekMXN)}</p>
        <p className="text-sm opacity-75 mt-1">{data.weekCount} venta{data.weekCount !== 1 ? "s" : ""}</p>
        {Object.keys(data.byMethod).length > 0 && (
          <div className="flex gap-4 mt-3 flex-wrap border-t border-white/20 pt-3">
            {Object.entries(data.byMethod).map(([m, v]) => (
              <div key={m} className="text-xs opacity-80">
                {METODO_LABEL[m]}: <strong>{formatMXN(v)}</strong>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Month total */}
      <Card className="mb-4 border-0" style={{ background: "#d4e1e2" }}>
        <CardContent className="pt-5 pb-4 flex items-center gap-3">
          <TrendingUp className="h-5 w-5" style={{ color: "#49517e" }} />
          <div>
            <p className="text-xs capitalize" style={{ color: "#84719b" }}>{data.monthName}</p>
            <p className="text-2xl font-bold" style={{ color: "#49517e" }}>{formatMXN(data.monthTotal)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Today appointments */}
      <Card className="mb-4 border-0" style={{ background: "#f5d9d6" }}>
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: "#49517e" }}>
            <Calendar className="h-4 w-4" />
            Citas de hoy ({data.todayCitas.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          {data.todayCitas.length === 0 ? (
            <p className="text-sm" style={{ color: "#84719b" }}>Sin citas agendadas hoy</p>
          ) : (
            <div className="space-y-2">
              {data.todayCitas.map((c) => (
                <div key={c.calendly_uuid} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium" style={{ color: "#49517e" }}>
                      {new Date(c.start_time).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {c.invitee_name && <span className="ml-2" style={{ color: "#84719b" }}>{c.invitee_name}</span>}
                  </div>
                  {c.event_type_name && (
                    <span className="text-xs" style={{ color: "#84719b" }}>{c.event_type_name}</span>
                  )}
                </div>
              ))}
            </div>
          )}
          <Link href="/agenda">
            <Button variant="outline" size="sm" className="mt-3 w-full border-0 text-white text-xs" style={{ background: "#84719b" }}>
              Ver agenda completa
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Low stock */}
      {data.lowStockProducts.length > 0 && (
        <Card className="border-0" style={{ background: "#bfd8d2" }}>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: "#49517e" }}>
              <AlertTriangle className="h-4 w-4" style={{ color: "#e4a691" }} />
              Stock bajo ({data.lowStockProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="space-y-1">
              {data.lowStockProducts.map((p) => (
                <div key={p.nombre} className="flex justify-between text-sm" style={{ color: "#49517e" }}>
                  <span>{p.nombre}</span>
                  <span className="font-medium">{p.stock_actual} / {p.stock_minimo} mín</span>
                </div>
              ))}
            </div>
            <Link href="/productos">
              <Button variant="outline" size="sm" className="mt-3 w-full border-0 text-white text-xs" style={{ background: "#49517e" }}>
                Gestionar stock
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
