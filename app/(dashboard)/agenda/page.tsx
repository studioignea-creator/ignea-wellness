"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Calendar, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import WeekView from "@/components/agenda/WeekView";
import type { CalendlyEvent } from "@/lib/types";

const SISTEMA_DESDE = new Date("2026-05-01T00:00:00");

export default function AgendaPage() {
  const [events, setEvents] = useState<CalendlyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [pendientesOpen, setPendientesOpen] = useState(true);
  const fullSyncDone = useRef(false);

  const pendientes = events.filter(e =>
    e.status === "active" &&
    new Date(e.start_time) >= SISTEMA_DESDE &&
    new Date(e.end_time) < new Date() &&
    (e.asistio === null || e.asistio === undefined)
  );

  const fetchEvents = useCallback(async () => {
    const res = await fetch("/api/agenda");
    if (res.ok) setEvents(await res.json());
    setLoading(false);
  }, []);

  const syncCalendly = useCallback(async (meses: number) => {
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
  }, [fetchEvents]);

  // Al abrir: carga DB local inmediatamente, luego sincroniza 1 mes en background
  useEffect(() => {
    fetchEvents().then(() => {
      setSyncing(true);
      syncCalendly(1).finally(() => setSyncing(false));
    });
  }, [fetchEvents, syncCalendly]);

  // Cuando navega a semanas pasadas > 4 semanas, jala historial completo automáticamente
  useEffect(() => {
    if (weekOffset < -4 && !fullSyncDone.current) {
      fullSyncDone.current = true;
      setSyncing(true);
      syncCalendly(6).finally(() => setSyncing(false));
    }
  }, [weekOffset, syncCalendly]);

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

      {/* Banner pendientes de confirmar */}
      {!loading && pendientes.length > 0 && (
        <div className="rounded-2xl mb-5 overflow-hidden" style={{ border: "1px solid #f5d9d6" }}>
          <button
            className="w-full flex items-center gap-2 px-4 py-3 text-left"
            style={{ background: "#fff8f5" }}
            onClick={() => setPendientesOpen(o => !o)}
          >
            <AlertCircle className="h-4 w-4 shrink-0" style={{ color: "#c0555a" }} />
            <span className="text-sm font-semibold flex-1" style={{ color: "#c0555a" }}>
              {pendientes.length} cita{pendientes.length !== 1 ? "s" : ""} sin confirmar asistencia
            </span>
            {pendientesOpen ? <ChevronUp className="h-4 w-4" style={{ color: "#c0555a" }} /> : <ChevronDown className="h-4 w-4" style={{ color: "#c0555a" }} />}
          </button>
          {pendientesOpen && (
            <div className="divide-y" style={{ borderColor: "#f5d9d6" }}>
              {pendientes.map(e => {
                const fecha = new Date(e.start_time);
                return (
                  <div key={e.calendly_uuid} className="px-4 py-2.5 flex items-center gap-3" style={{ background: "#fff" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#49517e" }}>
                        {e.invitee_name ?? "Sin nombre"}
                      </p>
                      <p className="text-xs truncate" style={{ color: "#84719b" }}>
                        {e.event_type_name ?? "—"} · {fecha.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })} {fecha.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {e.tiene_venta ? (
                      <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: "#bfd8d2", color: "#49517e" }}>
                        ${e.monto_venta?.toLocaleString()} {e.moneda_venta}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: "#f5d9d6", color: "#c0555a" }}>
                        Sin pago
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <WeekView events={events} weekOffset={weekOffset} setWeekOffset={setWeekOffset} onRefresh={fetchEvents} />
      )}
    </div>
  );
}
