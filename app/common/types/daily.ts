export type CategoryCode = 'EX' | 'BK' | 'WK' | 'ST' | 'HB' | 'EM' | 'SL' | 'ML' | 'RT';

export interface Category {
  code: CategoryCode;
  icon: string;
  label: string;
  hasDuration: boolean;
  sort_order?: number;
}

export const CATEGORIES: Record<CategoryCode, Category> = {
  EX: { code: 'EX', icon: '🏃', label: 'Exercise', hasDuration: true, sort_order: 1 },
  BK: { code: 'BK', icon: '📚', label: 'Reading', hasDuration: true, sort_order: 2 },
  WK: { code: 'WK', icon: '📋', label: 'Work', hasDuration: true, sort_order: 3 },
  ST: { code: 'ST', icon: '🧠', label: 'Study', hasDuration: true, sort_order: 4 },
  HB: { code: 'HB', icon: '🎨', label: 'Hobby', hasDuration: true, sort_order: 5 },
  EM: { code: 'EM', icon: '😊', label: 'Emotion', hasDuration: false, sort_order: 6 },
  SL: { code: 'SL', icon: '😴', label: 'Sleep', hasDuration: true, sort_order: 7 },
  ML: { code: 'ML', icon: '🍽️', label: 'Meal', hasDuration: true, sort_order: 8 },
  RT: { code: 'RT', icon: '🔁', label: 'Routine', hasDuration: true, sort_order: 9 },
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
  subcode?: string;
  created_at: string;
  updated_at: string;
}

export interface UICategory {
  code: string; // Can be a CategoryCode or a custom user-defined code
  label: string;
  icon: string | null; // User-defined categories might not have an icon initially, or it could be an emoji
  color?: string | null; // For user-defined categories, to store custom colors
  isCustom: boolean; // To distinguish between predefined CATEGORIES and user_categories
  isActive: boolean; // Reflects user preference from settings
  hasDuration?: boolean; // Inherited from base Category if not custom, or set for custom
  sort_order?: number; // For ordering in UI, considering both default and custom
} 