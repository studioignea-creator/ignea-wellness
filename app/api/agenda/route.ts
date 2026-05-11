import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchCalendlyEvents } from "@/lib/calendly";

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  // Default: 6 months back to 2 months ahead — covers full history + upcoming
  const defaultFrom = new Date(Date.now() - 180 * 86400000).toISOString().split("T")[0];
  const defaultTo = new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0];
  const from = searchParams.get("from") ?? defaultFrom;
  const to = searchParams.get("to") ?? defaultTo;

  const [eventsResult, ventasResult] = await Promise.all([
    supabase.from("calendly_cache").select("*").gte("start_time", from).lte("start_time", to + "T23:59:59Z").order("start_time"),
    supabase.from("ventas").select("calendly_event_uuid, monto, moneda").not("calendly_event_uuid", "is", null),
  ]);

  if (eventsResult.error) return NextResponse.json({ error: eventsResult.error.message }, { status: 500 });

  const ventasMap = new Map(
    (ventasResult.data ?? []).map(v => [v.calendly_event_uuid, { monto: v.monto, moneda: v.moneda }])
  );

  const events = (eventsResult.data ?? []).map(e => ({
    ...e,
    tiene_venta: ventasMap.has(e.calendly_uuid),
    monto_venta: ventasMap.get(e.calendly_uuid)?.monto ?? null,
    moneda_venta: ventasMap.get(e.calendly_uuid)?.moneda ?? null,
  }));

  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.CALENDLY_PAT || !process.env.CALENDLY_USER_URI) {
    return NextResponse.json({ error: "Calendly no configurado" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const mesesAtras = body.meses ?? 1;

  const now = new Date();
  const minStart = new Date(now.getTime() - mesesAtras * 30 * 86400000).toISOString();
  const maxStart = new Date(now.getTime() + 60 * 86400000).toISOString();

  try {
    const events = await fetchCalendlyEvents(minStart, maxStart);

    if (events.length > 0) {
      const { error } = await supabase.from("calendly_cache").upsert(events, {
        onConflict: "calendly_uuid",
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ synced: events.length });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
