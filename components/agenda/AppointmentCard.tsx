"use client";

import { useRouter } from "next/navigation";
import { Clock, User, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CalendlyEvent } from "@/lib/types";

interface Props {
  event: CalendlyEvent;
}

export default function AppointmentCard({ event }: Props) {
  const router = useRouter();

  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  const duration = Math.round((end.getTime() - start.getTime()) / 60000);

  const time = start.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

  function handleRegistrarPago() {
    const params = new URLSearchParams();
    if (event.invitee_name) params.set("cliente", event.invitee_name);
    if (event.event_type_name) params.set("servicio", event.event_type_name);
    params.set("calendly_uuid", event.calendly_uuid);
    router.push(`/ventas?${params}`);
  }

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm font-semibold">{time}</span>
            <Badge variant="outline" className="text-xs">{duration} min</Badge>
          </div>
          {event.event_type_name && (
            <p className="text-sm mt-1 font-medium">{event.event_type_name}</p>
          )}
          {event.invitee_name && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <User className="h-3 w-3" />
              {event.invitee_name}
            </div>
          )}
        </div>
        <Button size="sm" variant="outline" className="shrink-0 text-xs h-8" onClick={handleRegistrarPago}>
          <DollarSign className="h-3 w-3 mr-1" />
          Pago
        </Button>
      </div>
    </div>
  );
}
