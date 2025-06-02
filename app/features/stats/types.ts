import type { UICategory } from "~/common/types/daily";
import type { DailyRecordUI, MemoUI } from "~/features/daily/types";

export interface MonthlyDayRecord {
  date: string;
  records: DailyRecordUI[];
  dailyNote: string | null;
  memos: MemoUI[];
}

export interface StatsPageLoaderData {
  profileId: string;
  selectedMonthISO: string;
  monthlyRecordsForDisplay: MonthlyDayRecord[];
  categories: UICategory[];
} 