import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(input: string | Date): string {
  const date = input instanceof Date ? input : new Date(input);
  const formatter = new Intl.RelativeTimeFormat("ko", { numeric: "auto" });
  const ranges = {
    years: 3600 * 24 * 365,
    months: 3600 * 24 * 30,
    weeks: 3600 * 24 * 7,
    days: 3600 * 24,
    hours: 3600,
    minutes: 60,
    seconds: 1,
  };

  const secondsElapsed = (date.getTime() - Date.now()) / 1000;
  const absSecondsElapsed = Math.abs(secondsElapsed);

  for (const key in ranges) {
    const range = ranges[key as keyof typeof ranges];
    if (absSecondsElapsed >= range) {
      const delta = secondsElapsed / range;
      return formatter.format(Math.round(delta), key as keyof typeof ranges);
    }
  }

  return "방금 전";
}
