import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const META_TOKEN = process.env.META_ACCESS_TOKEN;
const META_AD_ACCOUNT = process.env.META_AD_ACCOUNT_ID;

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!META_TOKEN || !META_AD_ACCOUNT) {
    return NextResponse.json({ configured: false });
  }

  const { searchParams } = new URL(req.url);
  const now = new Date();

  let since: string;
  let until: string;
  if (searchParams.get("desde") && searchParams.get("hasta")) {
    since = searchParams.get("desde")!;
    until = searchParams.get("hasta")!;
  } else {
    const dias = parseInt(searchParams.get("dias") ?? "30");
    since = new Date(now.getTime() - dias * 86400000).toISOString().split("T")[0];
    until = now.toISOString().split("T")[0];
  }

  try {
    const fields = "spend,impressions,clicks,reach,cpm,cpc,actions";
    const url = `https://graph.facebook.com/v22.0/${META_AD_ACCOUNT}/insights?fields=${fields}&time_range={"since":"${since}","until":"${until}"}&level=account&access_token=${META_TOKEN}`;

    const res = await fetch(url, { cache: "no-store" });
    const json = await res.json();

    if (json.error) {
      return NextResponse.json({ configured: true, error: json.error.message });
    }

    const d = json.data?.[0] ?? {};

    const spend = parseFloat(d.spend ?? "0");
    const impressions = parseInt(d.impressions ?? "0");
    const clicks = parseInt(d.clicks ?? "0");
    const reach = parseInt(d.reach ?? "0");
    const cpm = parseFloat(d.cpm ?? "0");
    const cpc = parseFloat(d.cpc ?? "0");

    // Intentar sacar leads/resultados de acciones
    const actions: { action_type: string; value: string }[] = d.actions ?? [];
    const leads = actions.find(a => a.action_type === "lead")?.value ?? "0";

    return NextResponse.json({
      configured: true,
      spend,
      impressions,
      clicks,
      reach,
      cpm,
      cpc,
      leads: parseInt(leads),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ configured: true, error: msg });
  }
}
