import { motion } from "framer-motion";
import { MOODS, type MoodValue } from "@/lib/moods";
import { cn } from "@/lib/utils";

type Props = {
  value: MoodValue | null;
  onChange: (m: MoodValue) => void;
};

export function MoodPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3">
      {MOODS.map((m) => {
        const active = value === m.value;
        return (
          <motion.button
            key={m.value}
            type="button"
            whileTap={{ scale: 0.9 }}
            whileHover={{ y: -3 }}
            onClick={() => onChange(m.value)}
            className={cn(
              "group flex flex-col items-center gap-1 rounded-2xl border bg-card/70 p-3 transition-all sm:p-4",
              active
                ? "border-transparent shadow-lg ring-2 ring-offset-2 ring-offset-background"
                : "border-border hover:bg-card",
            )}
            style={
              active
                ? ({
                    backgroundColor: `color-mix(in oklab, ${m.color} 28%, var(--card))`,
                    boxShadow: `0 10px 30px -10px ${m.color}`,
                    // @ts-expect-error css var
                    "--tw-ring-color": m.color,
                  } as React.CSSProperties)
                : undefined
            }
          >
            <motion.span
              animate={active ? { scale: [1, 1.25, 1], rotate: [0, -8, 8, 0] } : { scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-3xl sm:text-4xl"
            >
              {m.emoji}
            </motion.span>
            <span className="text-xs font-medium text-foreground/80">{m.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
