"use client";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, startOfDay, subDays } from "date-fns";
import { MOODS, moodMeta } from "@/lib/moods";

type Entry = { mood: string; created_at: string };

const SCORE: Record<string, number> = {
  angry: 1,
  anxious: 2,
  sad: 2,
  okay: 3,
  happy: 5,
};

export function WeeklyChart({ entries }: { entries: Entry[] }) {
  const data = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => startOfDay(subDays(new Date(), 6 - i)));
    return days.map((d) => {
      const dayEntries = entries.filter(
        (e) => startOfDay(new Date(e.created_at)).getTime() === d.getTime(),
      );
      // Most recent mood that day, else null
      const last = dayEntries[0];
      return {
        day: format(d, "EEE"),
        score: last ? SCORE[last.mood] ?? 0 : 0,
        mood: last?.mood ?? null,
        color: last ? moodMeta(last.mood).color : "var(--muted)",
        emoji: last ? moodMeta(last.mood).emoji : "·",
      };
    });
  }, [entries]);

  return (
    <div className="rounded-2xl border bg-card/80 p-5 backdrop-blur">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-2xl">This week</h2>
        <span className="text-xs text-muted-foreground">Last 7 days</span>
      </div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} className="text-xs" />
            <YAxis hide domain={[0, 5]} />
            <Tooltip
              cursor={{ fill: "color-mix(in oklab, var(--foreground) 6%, transparent)" }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(_v, _n, p) => {
                const mood = (p?.payload as { mood: string | null })?.mood;
                return [mood ? moodMeta(mood).label : "No entry", "Mood"];
              }}
            />
            <Bar dataKey="score" radius={[8, 8, 4, 4]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {MOODS.map((m) => (
          <div key={m.value} className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: m.color }}
              aria-hidden
            />
            {m.label}
          </div>
        ))}
      </div>
    </div>
  );
}
