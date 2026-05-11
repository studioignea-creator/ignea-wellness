import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const estado = searchParams.get("estado"); // "activo" | "completado" | null (todos)
  const cliente = searchParams.get("cliente");

  let query = supabase
    .from("paquetes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (estado) query = query.eq("estado", estado);
  if (cliente) query = query.ilike("cliente_nombre", `%${cliente}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { cliente_nombre, servicio, sesiones_total, monto_total, moneda, metodo_pago, notas } = body;

  if (!cliente_nombre || !servicio || !sesiones_total || monto_total == null) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("paquetes")
    .insert({
      user_id: user.id,
      cliente_nombre,
      servicio,
      sesiones_total: parseInt(String(sesiones_total)),
      sesiones_usadas: 0,
      monto_total,
      moneda: moneda ?? "MXN",
      metodo_pago: metodo_pago ?? null,
      notas: notas ?? null,
      estado: "activo",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
