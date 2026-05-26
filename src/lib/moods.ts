export const MOODS = [
  { value: "happy", label: "Happy", emoji: "😄", color: "var(--mood-happy)" },
  { value: "okay", label: "Okay", emoji: "😐", color: "var(--mood-okay)" },
  { value: "sad", label: "Sad", emoji: "😢", color: "var(--mood-sad)" },
  { value: "anxious", label: "Anxious", emoji: "😰", color: "var(--mood-anxious)" },
  { value: "angry", label: "Angry", emoji: "😡", color: "var(--mood-angry)" },
] as const;

export type MoodValue = (typeof MOODS)[number]["value"];

export const moodMeta = (m: string) =>
  MOODS.find((x) => x.value === m) ?? MOODS[1];
