import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { MOODS, moodMeta, type MoodValue } from "@/lib/moods";
import { Navbar } from "@/components/navbar";
import { MoodPicker } from "@/components/mood-picker";
import { WeeklyChart } from "@/components/weekly-chart";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

type Entry = {
  id: string;
  mood: MoodValue;
  note: string;
  created_at: string;
  updated_at: string;
};

const entrySchema = z.object({
  mood: z.enum(["happy", "okay", "sad", "anxious", "angry"]),
  note: z.string().min(3, "Write at least 3 characters"),
});

function Dashboard() {
  const { session, loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login", replace: true });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <DashboardContent userId={user!.id} />
      </main>
    </div>
  );
}

function DashboardContent({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["entries", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mood_entries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Entry[];
    },
  });

  const [mood, setMood] = useState<MoodValue | null>(null);
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState<Entry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: async () => {
      const parsed = entrySchema.parse({ mood, note });
      const { error } = await supabase
        .from("mood_entries")
        .insert({ ...parsed, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mood saved!");
      setMood(null);
      setNote("");
      qc.invalidateQueries({ queryKey: ["entries", userId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mood_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Entry deleted");
      qc.invalidateQueries({ queryKey: ["entries", userId] });
      setDeletingId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-sm text-muted-foreground">{greeting}.</p>
        <h1 className="font-display text-4xl sm:text-5xl">How are you feeling?</h1>
      </motion.div>

      {/* Logger */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="rounded-3xl border bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6"
      >
        <MoodPicker value={mood} onChange={setMood} />
        <div className="mt-4 space-y-3">
          <Textarea
            placeholder="One line about your day…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-20 resize-none bg-background/50 text-base"
            maxLength={280}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">{note.length}/280</span>
            <Button
              onClick={() => create.mutate()}
              disabled={!mood || note.length < 3 || create.isPending}
              size="lg"
              className="rounded-full px-6"
            >
              {create.isPending ? "Saving…" : "Save mood"}
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Chart */}
      <WeeklyChart entries={entries} />

      {/* History */}
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-2xl">Your entries</h2>
          <span className="text-xs text-muted-foreground">{entries.length} total</span>
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card/40 p-10 text-center">
            <p className="font-display text-xl">No entries yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Save your first mood above to start your board.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {entries.map((e) => (
                <EntryCard
                  key={e.id}
                  entry={e}
                  onEdit={() => setEditing(e)}
                  onDelete={() => setDeletingId(e.id)}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>

      <EditDialog
        entry={editing}
        onClose={() => setEditing(null)}
        onSaved={() => qc.invalidateQueries({ queryKey: ["entries", userId] })}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && remove.mutate(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEE, MMM d");
}

function EntryCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: Entry;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const m = moodMeta(entry.mood);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="group flex items-start gap-4 rounded-2xl border bg-card/80 p-4 backdrop-blur transition-colors hover:bg-card"
    >
      <div
        className="flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl"
        style={{
          backgroundColor: `color-mix(in oklab, ${m.color} 35%, var(--card))`,
        }}
        aria-hidden
      >
        {m.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-sm font-medium">{m.label}</p>
          <p className="shrink-0 text-xs text-muted-foreground">
            {dayLabel(entry.created_at)} · {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
          </p>
        </div>
        <p className="mt-1 text-foreground/90">{entry.note}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
            aria-label="Entry actions"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 size-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 size-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.li>
  );
}

function EditDialog({
  entry,
  onClose,
  onSaved,
}: {
  entry: Entry | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const form = useForm<z.infer<typeof entrySchema>>({
    resolver: zodResolver(entrySchema),
    values: entry ? { mood: entry.mood, note: entry.note } : undefined,
  });

  const update = useMutation({
    mutationFn: async (data: z.infer<typeof entrySchema>) => {
      if (!entry) return;
      const { error } = await supabase
        .from("mood_entries")
        .update({ mood: data.mood, note: data.note })
        .eq("id", entry.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Entry updated");
      onSaved();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={!!entry} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Edit entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((d) => update.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {MOODS.map((m) => {
              const active = form.watch("mood") === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => form.setValue("mood", m.value, { shouldValidate: true })}
                  className="flex flex-col items-center gap-1 rounded-xl border p-2 transition-all"
                  style={
                    active
                      ? {
                          backgroundColor: `color-mix(in oklab, ${m.color} 30%, var(--card))`,
                          borderColor: m.color,
                        }
                      : undefined
                  }
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-[10px]">{m.label}</span>
                </button>
              );
            })}
          </div>
          <Textarea {...form.register("note")} className="min-h-24" />
          {form.formState.errors.note && (
            <p className="text-xs text-destructive">{form.formState.errors.note.message}</p>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
