"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, User, DollarSign, CheckCircle, XCircle, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import UsarPaqueteModal from "@/components/paquetes/UsarPaqueteModal";
import type { CalendlyEvent } from "@/lib/types";

interface Props {
  event: CalendlyEvent & { asistio?: boolean | null };
  onRefresh?: () => void;
}

export default function AppointmentCard({ event, onRefresh }: Props) {
  const router = useRouter();
  const [asistio, setAsistio] = useState<boolean | null>(event.asistio ?? null);
  const [confirming, setConfirming] = useState(false);
  const [showPaquete, setShowPaquete] = useState(false);

  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  const duration = Math.round((end.getTime() - start.getTime()) / 60000);
  const time = start.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  const isPast = end < new Date();

  async function confirmarAsistencia(valor: boolean) {
    setConfirming(true);
    try {
      const res = await fetch(`/api/calendly/${event.calendly_uuid}/cierre`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asistio: valor }),
      });
      if (!res.ok) throw new Error();
      setAsistio(valor);
      toast.success(valor ? "Marcada como asistida ✓" : "Marcada como no-show");
      onRefresh?.();
    } catch {
      toast.error("Error al confirmar");
    } finally {
      setConfirming(false);
    }
  }

  function handleRegistrarPago() {
    const params = new URLSearchParams();
    if (event.invitee_name) params.set("cliente", event.invitee_name);
    if (event.event_type_name) params.set("servicio", event.event_type_name);
    params.set("calendly_uuid", event.calendly_uuid);
    router.push(`/ventas?${params}`);
  }

  return (
    <>
      <div className="rounded-xl border p-3 space-y-2.5" style={{
        borderColor: asistio === true ? "#bfd8d2" : asistio === false ? "#f5d9d6" : "#d4e1e2",
        background: asistio === true ? "#f0faf8" : asistio === false ? "#fff5f5" : "#fff",
      }}>
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: "#84719b" }} />
              <span className="text-sm font-semibold" style={{ color: "#49517e" }}>{time}</span>
              <Badge variant="outline" className="text-xs border-0" style={{ background: "#d4e1e2", color: "#49517e" }}>
                {duration} min
              </Badge>
              {asistio === true && <Badge variant="success" className="text-xs">Asistió ✓</Badge>}
              {asistio === false && <Badge variant="danger" className="text-xs">No-show</Badge>}
            </div>
            {event.event_type_name && (
              <p className="text-sm mt-1 font-medium" style={{ color: "#49517e" }}>{event.event_type_name}</p>
            )}
            {event.invitee_name && (
              <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "#84719b" }}>
                <User className="h-3 w-3" />
                {event.invitee_name}
              </div>
            )}
          </div>

          <div className="flex gap-1.5 shrink-0">
            <Button size="sm" variant="outline" className="text-xs h-8 border-0 px-2"
              style={{ background: "#f5f5f8", color: "#84719b" }}
              onClick={() => setShowPaquete(true)}>
              <Layers className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" className="shrink-0 text-xs h-8 border-0 text-white"
              style={{ background: "#84719b" }} onClick={handleRegistrarPago}>
              <DollarSign className="h-3 w-3 mr-1" />
              Pago
            </Button>
          </div>
        </div>

        {/* Confirmación de asistencia — solo para citas pasadas */}
        {isPast && asistio === null && (
          <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: "#d4e1e2" }}>
            <span className="text-xs flex-1" style={{ color: "#84719b" }}>¿Asistió?</span>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-0"
              style={{ background: "#bfd8d2", color: "#49517e" }}
              disabled={confirming} onClick={() => confirmarAsistencia(true)}>
              <CheckCircle className="h-3 w-3" /> Sí
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-0"
              style={{ background: "#f5d9d6", color: "#49517e" }}
              disabled={confirming} onClick={() => confirmarAsistencia(false)}>
              <XCircle className="h-3 w-3" /> No
            </Button>
          </div>
        )}

        {isPast && asistio !== null && (
          <button className="text-xs underline block" style={{ color: "#84719b" }}
            onClick={() => setAsistio(null)}>
            Cambiar respuesta
          </button>
        )}
      </div>

      <UsarPaqueteModal
        open={showPaquete}
        onClose={() => setShowPaquete(false)}
        clienteNombre={event.invitee_name ?? null}
        calendlyUuid={event.calendly_uuid}
        onUsado={() => {
          toast.success("Sesión de paquete registrada");
          onRefresh?.();
        }}
      />
    </>
  );
}
