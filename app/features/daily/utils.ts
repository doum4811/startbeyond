import { DateTime } from "luxon";
import type { UICategory } from "~/common/types/daily";

export const MAX_MINUTES_PER_DAY = 60 * 24;

export function getToday(): string {
  return DateTime.now().toISODate();
}

export function getCategoryColor(category: UICategory | undefined, code?: string): string {
  if (category) {
    if (category.isCustom && category.color) {
      return category.color;
    }
    const map: Record<string, string> = {
      EX: "text-orange-500", BK: "text-green-600", ML: "text-orange-600",
      EM: "text-purple-500", ST: "text-yellow-500", WK: "text-teal-700",
      HB: "text-pink-500", SL: "text-cyan-600", RT: "text-blue-500"
    };
    return map[category.code] || "text-gray-500";
  }
  if (code) {
    const map: Record<string, string> = {
      EX: "text-orange-500", BK: "text-green-600", ML: "text-orange-600",
      EM: "text-purple-500", ST: "text-yellow-500", WK: "text-teal-700",
      HB: "text-pink-500", SL: "text-cyan-600", RT: "text-blue-500"
    };
    return map[code] || "text-gray-500";
  }
  return "text-gray-500";
}

export const isValidCategoryCode = (code: string, activeCategories: UICategory[]): boolean => {
  return activeCategories.some(c => c.code === code && c.isActive);
}; 