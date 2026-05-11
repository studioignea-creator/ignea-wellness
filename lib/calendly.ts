import { CalendlyEvent } from "./types";

const BASE = "https://api.calendly.com";
const PAT = process.env.CALENDLY_PAT!;
const USER_URI = process.env.CALENDLY_USER_URI!;

async function calendlyFetch(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${PAT}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Calendly ${res.status}: ${path}`);
  return res.json();
}

export async function fetchCalendlyEvents(
  minStart: string,
  maxStart: string
): Promise<CalendlyEvent[]> {
  const params = new URLSearchParams({
    user: USER_URI,
    min_start_time: minStart,
    max_start_time: maxStart,
    status: "active",
    count: "100",
  });

  const data = await calendlyFetch(`/scheduled_events?${params}`);
  const events: CalendlyEvent[] = [];

  for (const ev of data.collection ?? []) {
    const uuid = ev.uri.split("/scheduled_events/")[1];
    let invitee_name: string | null = null;
    let invitee_email: string | null = null;

    try {
      const inv = await calendlyFetch(`/scheduled_events/${uuid}/invitees`);
      const first = inv.collection?.[0];
      if (first) {
        invitee_name = first.name ?? null;
        invitee_email = first.email ?? null;
      }
    } catch {
      // invitee fetch failed — continue without it
    }

    events.push({
      calendly_uuid: uuid,
      start_time: ev.start_time,
      end_time: ev.end_time,
      status: ev.status,
      invitee_name,
      invitee_email,
      event_type_name: ev.name ?? null,
      location: ev.location?.join_url ?? ev.location?.location ?? null,
      synced_at: new Date().toISOString(),
    });
  }

  return events;
}
