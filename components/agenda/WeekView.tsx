"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppointmentCard from "./AppointmentCard";
import type { CalendlyEvent } from "@/lib/types";

interface Props {
  events: CalendlyEvent[];
  weekOffset: number;
  setWeekOffset: (fn: (o: number) => number) => void;
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

export default function WeekView({ events, weekOffset, setWeekOffset }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = getWeekDays(weekOffset);
  const todayInWeek = days.findIndex(d => d.getTime() === today.getTime());

  // When week changes: if current week → select today; else → select Monday
  const [selectedDay, setSelectedDay] = useState(todayInWeek >= 0 ? todayInWeek : 1);

  useEffect(() => {
    const newDays = getWeekDays(weekOffset);
    const todayIdx = newDays.findIndex(d => d.getTime() === today.getTime());
    setSelectedDay(todayIdx >= 0 ? todayIdx : 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset]);

  const selectedDate = days[selectedDay] ?? days[1];
  const dayEvents = events
    .filter((e) => {
      const d = new Date(e.start_time);
      return (
        d.getFullYear() === selectedDate.getFullYear() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getDate() === selectedDate.getDate()
      );
    })
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const monthLabel = days[3].toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  const isPastWeek = weekOffset < 0;
  const isCurrentWeek = weekOffset === 0;

  function eventsOnDay(day: Date) {
    return events.filter((e) => {
      const d = new Date(e.start_time);
      return d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate();
    }).length;
  }

  return (
    <div>
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset(o => o - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium capitalize" style={{ color: "#49517e" }}>{monthLabel}</span>
          {!isCurrentWeek && (
            <button
              onClick={() => setWeekOffset(() => 0)}
              className="text-xs px-2 py-0.5 rounded-full transition-colors"
              style={{ background: "#f5d9d6", color: "#49517e" }}
            >
              Hoy
            </button>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset(o => o + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {isPastWeek && (
        <div className="text-xs text-center mb-3 px-3 py-1.5 rounded-lg"
          style={{ background: "#f5f5f8", color: "#84719b" }}>
          Historial — semana pasada
        </div>
      )}

      {/* Day strip */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {days.map((day, i) => {
          const isToday = day.getTime() === today.getTime();
          const isSelected = i === selectedDay;
          const count = eventsOnDay(day);
          const isPast = day < today && !isToday;
          return (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className="flex flex-col items-center py-2 rounded-lg transition-colors"
              style={{
                background: isSelected ? "#84719b" : isToday ? "#f5d9d6" : "transparent",
                color: isSelected ? "white" : isToday ? "#49517e" : isPast ? "#b0aabe" : "#49517e",
              }}
            >
              <span className="text-xs">{DAYS_ES[i]}</span>
              <span className="text-sm font-semibold">{day.getDate()}</span>
              {count > 0 && (
                <span className="h-1.5 w-1.5 rounded-full mt-0.5"
                  style={{ background: isSelected ? "white" : "#84719b" }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Day label + count */}
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays className="h-4 w-4" style={{ color: "#84719b" }} />
        <span className="text-sm font-medium capitalize" style={{ color: "#49517e" }}>
          {selectedDate.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
        </span>
        {dayEvents.length > 0 && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
            style={{ background: "#d4e1e2", color: "#49517e" }}>
            {dayEvents.length} cita{dayEvents.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Events list */}
      <div className="space-y-2">
        {dayEvents.length === 0 ? (
          <div className="text-center py-10 rounded-xl" style={{ background: "#f5f5f8" }}>
            <p className="text-sm" style={{ color: "#84719b" }}>Sin citas este día</p>
            {isPastWeek && (
              <p className="text-xs mt-1" style={{ color: "#b0aabe" }}>
                Si esperabas ver citas aquí, toca &quot;Historial&quot; arriba para importarlas
              </p>
            )}
          </div>
        ) : (
          dayEvents.map((e) => <AppointmentCard key={e.calendly_uuid} event={e} />)
        )}
      </div>
    </div>
  );
}
