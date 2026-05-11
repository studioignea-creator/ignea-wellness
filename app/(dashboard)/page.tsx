import { Flame, TrendingUp, AlertTriangle, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMXN } from "@/lib/currency";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const supabase = createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [todayVentas, monthVentas, todayCitas, lowStock] = await Promise.all([
    supabase.from("ventas").select("monto, moneda, metodo_pago").gte("created_at", todayStart.toISOString()).lte("created_at", todayEnd.toISOString()),
    supabase.from("ventas").select("monto, moneda").gte("created_at", monthStart.toISOString()).eq("moneda", "MXN"),
    supabase.from("calendly_cache").select("calendly_uuid, start_time, end_time, invitee_name, event_type_name, status").gte("start_time", todayStart.toISOString()).lte("start_time", todayEnd.toISOString()).eq("status", "active").order("start_time"),
    supabase.from("productos").select("nombre, marca, stock_actual, stock_minimo").filter("stock_actual", "lte", "stock_minimo" as unknown as number),
  ]);

  const todayMXN = (todayVentas.data ?? []).filter((v) => v.moneda === "MXN").reduce((s, v) => s + v.monto, 0);
  const todayCount = (todayVentas.data ?? []).length;
  const monthTotal = (monthVentas.data ?? []).reduce((s, v) => s + v.monto, 0);

  const byMethod = (todayVentas.data ?? []).reduce<Record<string, number>>((acc, v) => {
    if (v.moneda !== "MXN") return acc;
    acc[v.metodo_pago] = (acc[v.metodo_pago] ?? 0) + v.monto;
    return acc;
  }, {});

  return {
    todayMXN,
    todayCount,
    monthTotal,
    byMethod,
    todayCitas: todayCitas.data ?? [],
    lowStockProducts: lowStock.data ?? [],
  };
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
      <div className="flex items-center gap-2 mb-6">
        <Flame className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold">Ignea Wellness</h1>
          <p className="text-xs text-muted-foreground capitalize">
            {now.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
      </div>

      {/* Today Revenue */}
      <Card className="mb-4 bg-primary text-primary-foreground">
        <CardContent className="pt-6">
          <p className="text-sm opacity-80">Hoy</p>
          <p className="text-4xl font-bold mt-1">{formatMXN(data.todayMXN)}</p>
          <p className="text-sm opacity-80 mt-1">{data.todayCount} venta{data.todayCount !== 1 ? "s" : ""}</p>
          {Object.keys(data.byMethod).length > 0 && (
            <div className="flex gap-3 mt-3 flex-wrap">
              {Object.entries(data.byMethod).map(([m, v]) => (
                <div key={m} className="text-xs opacity-80">
                  {METODO_LABEL[m]}: <strong>{formatMXN(v)}</strong>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Month total */}
      <Card className="mb-4">
        <CardContent className="pt-6 flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Este mes (MXN)</p>
            <p className="text-2xl font-bold">{formatMXN(data.monthTotal)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Today appointments */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Citas de hoy ({data.todayCitas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.todayCitas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin citas agendadas hoy</p>
          ) : (
            <div className="space-y-2">
              {data.todayCitas.map((c) => (
                <div key={c.calendly_uuid} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">
                      {new Date(c.start_time).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {c.invitee_name && <span className="text-muted-foreground ml-2">{c.invitee_name}</span>}
                  </div>
                  {c.event_type_name && (
                    <span className="text-xs text-muted-foreground">{c.event_type_name}</span>
                  )}
                </div>
              ))}
            </div>
          )}
          <Link href="/agenda">
            <Button variant="outline" size="sm" className="mt-3 w-full">Ver agenda completa</Button>
          </Link>
        </CardContent>
      </Card>

      {/* Low stock alert */}
      {data.lowStockProducts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              Stock bajo ({data.lowStockProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {data.lowStockProducts.map((p) => (
                <div key={p.nombre} className="flex justify-between text-sm text-amber-800">
                  <span>{p.nombre}</span>
                  <span className="font-medium">{p.stock_actual} / {p.stock_minimo} mín</span>
                </div>
              ))}
            </div>
            <Link href="/productos">
              <Button variant="outline" size="sm" className="mt-3 w-full border-amber-300 text-amber-800 hover:bg-amber-100">
                Gestionar stock
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
