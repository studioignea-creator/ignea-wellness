import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { calendly_uuid, notas } = body;

  const { data: paquete, error: fetchError } = await supabase
    .from("paquetes")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !paquete) {
    return NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 });
  }
  if (paquete.estado !== "activo") {
    return NextResponse.json({ error: "Paquete ya completado" }, { status: 400 });
  }
  if (paquete.sesiones_usadas >= paquete.sesiones_total) {
    return NextResponse.json({ error: "Todas las sesiones ya fueron usadas" }, { status: 400 });
  }

  const nuevasUsadas = paquete.sesiones_usadas + 1;
  const nuevoEstado = nuevasUsadas >= paquete.sesiones_total ? "completado" : "activo";

  const [usoResult, updateResult] = await Promise.all([
    supabase.from("paquete_usos").insert({
      paquete_id: params.id,
      user_id: user.id,
      calendly_uuid: calendly_uuid ?? null,
      notas: notas ?? null,
    }),
    supabase
      .from("paquetes")
      .update({ sesiones_usadas: nuevasUsadas, estado: nuevoEstado })
      .eq("id", params.id),
  ]);

  if (usoResult.error) return NextResponse.json({ error: usoResult.error.message }, { status: 500 });
  if (updateResult.error) return NextResponse.json({ error: updateResult.error.message }, { status: 500 });

  return NextResponse.json({
    sesiones_usadas: nuevasUsadas,
    sesiones_total: paquete.sesiones_total,
    estado: nuevoEstado,
    completado: nuevoEstado === "completado",
  });
}

// Deshacer último uso
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: paquete } = await supabase
    .from("paquetes").select("*").eq("id", params.id).eq("user_id", user.id).single();

  if (!paquete || paquete.sesiones_usadas === 0) {
    return NextResponse.json({ error: "No hay sesiones que deshacer" }, { status: 400 });
  }

  const { data: lastUso } = await supabase
    .from("paquete_usos")
    .select("id")
    .eq("paquete_id", params.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (lastUso) await supabase.from("paquete_usos").delete().eq("id", lastUso.id);

  const nuevasUsadas = paquete.sesiones_usadas - 1;
  await supabase.from("paquetes").update({ sesiones_usadas: nuevasUsadas, estado: "activo" }).eq("id", params.id);

  return NextResponse.json({ sesiones_usadas: nuevasUsadas, sesiones_total: paquete.sesiones_total });
}
