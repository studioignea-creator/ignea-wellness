"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppointmentCard from "./AppointmentCard";
import type { CalendlyEvent } from "@/lib/types";

interface Props {
  events: CalendlyEvent[];
}

const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function getWeekDays(offset: number): Date[] {
  const now = new Date();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - now.getDay() + offset * 7);
  sunday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

export default function WeekView({ events }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());

  const days = getWeekDays(weekOffset);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDate = days[selectedDay];
  const dayEvents = events.filter((e) => {
    const d = new Date(e.start_time);
    return (
      d.getFullYear() === selectedDate.getFullYear() &&
      d.getMonth() === selectedDate.getMonth() &&
      d.getDate() === selectedDate.getDate()
    );
  }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const monthLabel = days[3].toLocaleDateString("es-MX", { month: "long", year: "numeric" });

  function eventsOnDay(day: Date) {
    return events.filter((e) => {
      const d = new Date(e.start_time);
      return d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate();
    }).length;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset((o) => o - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium capitalize">{monthLabel}</span>
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset((o) => o + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {days.map((day, i) => {
          const isToday = day.getTime() === today.getTime();
          const isSelected = i === selectedDay;
          const count = eventsOnDay(day);
          return (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className={`flex flex-col items-center py-2 rounded-lg transition-colors ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >
              <span className="text-xs">{DAYS_ES[i]}</span>
              <span className={`text-sm font-semibold ${isToday && !isSelected ? "text-primary" : ""}`}>
                {day.getDate()}
              </span>
              {count > 0 && (
                <span className={`h-1.5 w-1.5 rounded-full mt-0.5 ${isSelected ? "bg-primary-foreground" : "bg-primary"}`} />
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {dayEvents.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">Sin citas este día</p>
        ) : (
          dayEvents.map((e) => <AppointmentCard key={e.calendly_uuid} event={e} />)
        )}
      </div>
    </div>
  );
}
