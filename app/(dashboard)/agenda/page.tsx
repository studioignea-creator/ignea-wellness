"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, RefreshCw, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import WeekView from "@/components/agenda/WeekView";
import type { CalendlyEvent } from "@/lib/types";

export default function AgendaPage() {
  const [events, setEvents] = useState<CalendlyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingHistory, setSyncingHistory] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  const fetchEvents = useCallback(async () => {
    const res = await fetch("/api/agenda");
    if (res.ok) setEvents(await res.json());
    setLoading(false);
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meses: 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Sincronizado — ${data.synced} cita(s)`);
      fetchEvents();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al sincronizar";
      if (msg.includes("no configurado")) {
        toast.error("Calendly no configurado — agrega CALENDLY_PAT en .env.local");
      } else {
        toast.error(msg);
      }
    } finally {
      setSyncing(false);
    }
  }

  async function handleSyncHistory() {
    setSyncingHistory(true);
    toast.info("Importando historial completo, esto puede tardar un momento...");
    try {
      const res = await fetch("/api/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meses: 6 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Historial importado — ${data.synced} cita(s) encontradas`);
      fetchEvents();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al importar historial");
    } finally {
      setSyncingHistory(false);
    }
  }

  useEffect(() => {
    fetchEvents();
    const handleVisibility = () => { if (!document.hidden) fetchEvents(); };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchEvents]);

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "#49517e" }}>
          <Calendar className="h-6 w-6" /> Agenda
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSyncHistory} disabled={syncingHistory || syncing}
            style={{ borderColor: "#d4e1e2", color: "#84719b" }}>
            <History className={`h-3.5 w-3.5 mr-1 ${syncingHistory ? "animate-spin" : ""}`} />
            {syncingHistory ? "Importando..." : "Historial"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing || syncingHistory}
            style={{ borderColor: "#d4e1e2", color: "#84719b" }}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar"}
          </Button>
        </div>
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

      <p className="text-xs text-center mt-6" style={{ color: "#84719b" }}>
        Usa &quot;Historial&quot; para importar los últimos 6 meses · &quot;Sincronizar&quot; para actualizar recientes
      </p>
    </div>
  );
}
