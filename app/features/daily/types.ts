import type { CategoryCode } from "~/common/types/daily";
import type { DailyRecord as DbDailyRecord, DailyNote as DbDailyNote, Memo as DbMemo } from "~/features/daily/queries";
import type { DailyPlan as DbDailyPlan } from "~/features/plan/queries";

export interface UICategory {
  code: string;
  label: string;
  icon: string | null;
  color?: string | null;
  isCustom: boolean;
  isActive: boolean;
  hasDuration?: boolean;
  sort_order?: number;
  subcodes?: Array<{ code: string; name: string; }>;
}

export interface DailyRecordUI {
  id: string;
  date: string;
  category_code: CategoryCode;
  duration_minutes?: number | null;
  comment: string | null;
  subcode: string | null;
  is_public: boolean;
  linked_plan_id: string | null;
  memos?: MemoUI[];
  created_at?: string;
  updated_at?: string;
  profile_id: string;
  is_bookmarked?: boolean;
  evidence_url?: string | null;
  memo?: string | null;
}

export interface DailyNoteUI extends Omit<DbDailyNote, "date" | "created_at" | "updated_at"> {
  id: string;
  date: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

export interface MemoUI {
  id: string;
  record_id: string | null;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface DailyPlanUI {
  id: string;
  profile_id: string;
  plan_date: string;
  duration?: number;
  comment: string | null;
  subcode: string | null;
  category_code: string;
  is_completed: boolean;
  created_at?: string;
  updated_at?: string;
  linked_weekly_task_id: string | null;
}

export interface DailyPageLoaderData {
  today: string;
  records: DailyRecordUI[];
  dailyNotes: DailyNoteUI[];
  plansForBanner: DailyPlanUI[];
  markedDates: string[];
  profileId: string;
  categories: UICategory[];
}

export interface AddFormState {
  category_code: string;
  duration: string;
  comment: string;
  is_public: boolean;
}

export const initialAddFormState: AddFormState = {
  category_code: "",
  duration: "",
  comment: "",
  is_public: false
};

export interface MonthlyDayRecord {
  date: string; // YYYY-MM-DD
  records: DailyRecordUI[];
  dailyNote: string | null;
  memos: MemoUI[];
} 