export type CategoryCode = 'EX' | 'BK' | 'WK' | 'ST' | 'HB' | 'EM' | 'SL' | 'ML' | 'RT';

export interface Category {
  code: CategoryCode;
  icon: string;
  label: string;
  hasDuration: boolean;
}

export const CATEGORIES: Record<CategoryCode, Category> = {
  EX: { code: 'EX', icon: '🏃', label: 'Exercise', hasDuration: true },
  BK: { code: 'BK', icon: '📚', label: 'Reading', hasDuration: true },
  WK: { code: 'WK', icon: '📋', label: 'Work', hasDuration: true },
  ST: { code: 'ST', icon: '🧠', label: 'Study', hasDuration: true },
  HB: { code: 'HB', icon: '🎨', label: 'Hobby', hasDuration: true },
  EM: { code: 'EM', icon: '😊', label: 'Emotion', hasDuration: false },
  SL: { code: 'SL', icon: '😴', label: 'Sleep', hasDuration: true },
  ML: { code: 'ML', icon: '🍽️', label: 'Meal', hasDuration: true },
  RT: { code: 'RT', icon: '🔁', label: 'Routine', hasDuration: true },
};

export interface DailyRecord {
  id: string;
  category_code: CategoryCode;
  duration?: number;
  unit?: string;
  comment?: string;
  longMemo?: string;
  subcode?: string;
  public: boolean;
  type: 'record' | 'plan';
  linked_plan_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DailyPlan {
  id: string;
  category_code: CategoryCode;
  duration?: number;
  unit?: string;
  comment?: string;
  created_at: string;
  updated_at: string;
} 