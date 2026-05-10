"use client";

import { useEffect, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api";
import type { Job } from "@/types/job";
import Link from "next/link";

type CalEvent = {
  jobId: number;
  opportunityId: string;
  customerName: string;
  service: string;
  type: "scheduled" | "due";
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDateKey(dateStr: string): string {
  return dateStr.slice(0, 10);
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<Job[]>("/jobs")
      .then((data) => setJobs(Array.isArray(data) ? data : []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const eventMap = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const job of jobs) {
      const push = (dateStr: string | undefined, type: CalEvent["type"]) => {
        if (!dateStr) return;
        const key = toDateKey(dateStr);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({
          jobId: job.id ?? 0,
          opportunityId: job.opportunity_id ?? String(job.id ?? ""),
          customerName: job.customer_name ?? "",
          service: job.service || job.scope_of_work || "",
          type,
        });
      };
      push((job as any).scheduled_date, "scheduled");
      push((job as any).due_date, "due");
    }
    return map;
  }, [jobs]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  }

  function dayKey(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const selectedEvents = selectedDate ? (eventMap.get(selectedDate) ?? []) : [];

  const upcomingEvents = useMemo(() => {
    const todayTs = new Date(todayKey).getTime();
    const results: Array<{ key: string; events: CalEvent[] }> = [];
    for (const [key, evts] of eventMap.entries()) {
      if (new Date(key).getTime() >= todayTs) {
        results.push({ key, events: evts });
      }
    }
    results.sort((a, b) => a.key.localeCompare(b.key));
    return results.slice(0, 10);
  }, [eventMap, todayKey]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-semibold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground mt-1">Job schedule dates and upcoming deadlines</p>
          </div>
          <CalendarDays className="h-8 w-8 text-muted-foreground" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar grid */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <CardTitle className="text-lg">
                {MONTH_NAMES[month]} {year}
              </CardTitle>
              <div className="flex gap-1">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-lg hover:bg-muted transition"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelectedDate(todayKey); }}
                  className="px-3 py-1 text-sm rounded-lg hover:bg-muted transition font-medium"
                >
                  Today
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-lg hover:bg-muted transition"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {loading ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                  Loading calendar…
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-7 mb-1">
                    {WEEKDAYS.map((d) => (
                      <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDayOfWeek }, (_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const day = i + 1;
                      const key = dayKey(day);
                      const events = eventMap.get(key) ?? [];
                      const isToday = key === todayKey;
                      const isSelected = key === selectedDate;
                      const hasScheduled = events.some((e) => e.type === "scheduled");
                      const hasDue = events.some((e) => e.type === "due");
                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDate(isSelected ? null : key)}
                          className={`relative min-h-[56px] rounded-lg border-2 p-1.5 text-left transition text-sm font-medium
                            ${isSelected ? "border-primary bg-primary/10" : isToday ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/50"}
                          `}
                        >
                          <span className={`block text-xs font-semibold ${isToday ? "text-primary" : ""}`}>{day}</span>
                          <div className="flex gap-0.5 mt-1 flex-wrap">
                            {hasScheduled && (
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            )}
                            {hasDue && (
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            )}
                          </div>
                          {events.length > 0 && (
                            <span className="absolute bottom-1 right-1 text-[10px] text-muted-foreground font-normal">
                              {events.length}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Scheduled date</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /> Due date</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Right panel: day detail + upcoming */}
          <div className="space-y-4">
            {selectedDate && (
              <Card>
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base">
                    {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                      weekday: "long", month: "long", day: "numeric",
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {selectedEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No events on this day.</p>
                  ) : (
                    <ul className="space-y-3">
                      {selectedEvents.map((ev, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Badge
                            className={`shrink-0 text-[10px] mt-0.5 ${ev.type === "scheduled" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" : "bg-red-100 text-red-800 hover:bg-red-100"}`}
                          >
                            {ev.type === "scheduled" ? "Scheduled" : "Due"}
                          </Badge>
                          <div className="min-w-0">
                            <Link
                              href={`/opportunity/${ev.jobId}`}
                              className="text-sm font-medium hover:text-primary transition truncate block"
                            >
                              {ev.customerName}
                            </Link>
                            {ev.service && (
                              <p className="text-xs text-muted-foreground truncate">{ev.service}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base">Upcoming</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : upcomingEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No upcoming scheduled or due dates. Set dates on opportunities to see them here.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {upcomingEvents.map(({ key, events }) => (
                      <li key={key}>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">
                          {new Date(key + "T12:00:00").toLocaleDateString("en-US", {
                            month: "short", day: "numeric", weekday: "short",
                          })}
                        </p>
                        <ul className="space-y-1.5">
                          {events.map((ev, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full shrink-0 ${ev.type === "scheduled" ? "bg-blue-500" : "bg-red-500"}`} />
                              <Link
                                href={`/opportunity/${ev.jobId}`}
                                className="text-sm hover:text-primary transition truncate"
                              >
                                {ev.customerName}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
