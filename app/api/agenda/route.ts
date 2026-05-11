import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchCalendlyEvents } from "@/lib/calendly";

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ?? new Date().toISOString().split("T")[0];
  const to = searchParams.get("to") ?? new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("calendly_cache")
    .select("*")
    .gte("start_time", from)
    .lte("start_time", to + "T23:59:59Z")
    .order("start_time");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.CALENDLY_PAT || !process.env.CALENDLY_USER_URI) {
    return NextResponse.json({ error: "Calendly no configurado" }, { status: 503 });
  }

  const now = new Date();
  const minStart = new Date(now.getTime() - 7 * 86400000).toISOString();
  const maxStart = new Date(now.getTime() + 30 * 86400000).toISOString();

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
