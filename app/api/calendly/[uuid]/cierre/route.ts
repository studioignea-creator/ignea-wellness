import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest, { params }: { params: { uuid: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { asistio, notas_cierre } = await req.json();

  const { data, error } = await supabase
    .from("calendly_cache")
    .update({ asistio, notas_cierre: notas_cierre ?? null })
    .eq("calendly_uuid", params.uuid)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
