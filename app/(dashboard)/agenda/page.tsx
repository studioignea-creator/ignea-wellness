"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import WeekView from "@/components/agenda/WeekView";
import type { CalendlyEvent } from "@/lib/types";

export default function AgendaPage() {
  const [events, setEvents] = useState<CalendlyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const fullSyncDone = useRef(false);

  const fetchEvents = useCallback(async () => {
    const res = await fetch("/api/agenda");
    if (res.ok) setEvents(await res.json());
    setLoading(false);
  }, []);

  async function syncCalendly(meses: number) {
    try {
      const res = await fetch("/api/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meses }),
      });
      if (res.ok) await fetchEvents();
    } catch {
      // silent — background sync failure doesn't block UX
    }
  }

  // Al abrir: carga DB local inmediatamente, luego sincroniza 1 mes en background
  useEffect(() => {
    fetchEvents().then(() => {
      setSyncing(true);
      syncCalendly(1).finally(() => setSyncing(false));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cuando navega a semanas pasadas > 4 semanas, jala historial completo automáticamente
  useEffect(() => {
    if (weekOffset < -4 && !fullSyncDone.current) {
      fullSyncDone.current = true;
      setSyncing(true);
      syncCalendly(6).finally(() => setSyncing(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset]);

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "#49517e" }}>
          <Calendar className="h-6 w-6" /> Agenda
        </h1>
        {syncing && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "#84719b" }}>
            <RefreshCw className="h-3 w-3 animate-spin" />
            Actualizando...
          </div>
        )}
        {!syncing && (
          <Button variant="ghost" size="sm" style={{ color: "#84719b" }}
            onClick={() => { setSyncing(true); syncCalendly(6).finally(() => setSyncing(false)); }}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Actualizar
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <WeekView events={events} weekOffset={weekOffset} setWeekOffset={setWeekOffset} />
      )}
    </div>
  );
}
