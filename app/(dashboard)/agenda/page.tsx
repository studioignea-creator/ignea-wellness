"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import WeekView from "@/components/agenda/WeekView";
import type { CalendlyEvent } from "@/lib/types";

export default function AgendaPage() {
  const [events, setEvents] = useState<CalendlyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const fetchEvents = useCallback(async () => {
    const res = await fetch("/api/agenda");
    if (res.ok) setEvents(await res.json());
    setLoading(false);
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/agenda", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Sincronizado — ${data.synced} cita(s)`);
      setLastSync(new Date());
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

  useEffect(() => {
    fetchEvents();
    const handleVisibility = () => { if (!document.hidden) fetchEvents(); };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchEvents]);

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6" /> Agenda
        </h1>
        <div className="flex items-center gap-2">
          {lastSync && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              Sync: {lastSync.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${syncing ? "animate-spin" : ""}`} />
            Sincronizar
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
        <WeekView events={events} />
      )}

      <p className="text-xs text-muted-foreground text-center mt-6">
        Las citas se obtienen de Calendly. Toca "Sincronizar" para actualizar.
      </p>
    </div>
  );
}
