import type { CategoryCode, UICategory } from "~/common/types/daily";
import type { 
  CategoryDistribution,
  ActivityHeatmap,
  CategorySummary,
  StatsCache,
  SummaryInsights,
  TimeOfDayDistribution,
  SubcodeDistribution,
  GoalCompletionStats,
} from "./queries";

export interface DailyRecordUI {
  id: string;
  date: string;
  category_code: CategoryCode;
  duration?: number;
  comment: string | null;
  subcode: string | null;
  is_public: boolean;
  linked_plan_id: string | null;
  created_at?: string;
  updated_at?: string;
  memos: MemoUI[];
}

export interface MemoUI {
  id: string;
  record_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at?: string;
}

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

export interface SummaryPageLoaderData {
  profileId: string;
  selectedMonthISO: string;
  categoryDistribution: CategoryDistribution[];
  subcodeDistribution: SubcodeDistribution[];
  categories: UICategory[];
  timeOfDayDistribution: TimeOfDayDistribution;
  prevMonthCategoryDistribution: CategoryDistribution[];
  currentMonthGoalStats: GoalCompletionStats;
  prevMonthGoalStats: GoalCompletionStats;
}

export interface ShareSettings {
  showCategoryDistribution: boolean;
  showTimeAnalysis: boolean;
  showActivityHeatmap: boolean;
  showCategorySummary: boolean;
}

export interface CategoryPageShareSettings {
  showSummary: boolean;
  showActivityTrend: boolean;
  showGoalProgress: boolean;
}

// Type for individual heatmap data points, used in CategoryHeatmapGrid and AdvancedPage mock data
export interface HeatmapData {
  date: string; // YYYY-MM-DD
  intensity: number; // Value determining color, e.g., activity count or duration
  categories: Record<CategoryCode, number>; // Activity count/value for each category on this day
  total: number; // Total activities/value for this day across relevant categories
}

export interface AdvancedPageLoaderData {
  profileId: string | null; 
  categories: UICategory[]; 
  currentYear: number;
  yearlyCategoryHeatmapData: Record<CategoryCode, HeatmapData[]>;
  categoryDistribution: CategoryDistribution[];
}

export namespace Route {
  export interface ComponentProps {
    loaderData: {
      categoryDistribution: CategoryDistribution[];
      activityHeatmap: ActivityHeatmap[];
      categorySummary: CategorySummary;
    };
  }
}

export type {
  CategoryDistribution,
  ActivityHeatmap,
  CategorySummary,
  StatsCache,
  SummaryInsights,
  TimeOfDayDistribution,
  SubcodeDistribution,
  GoalCompletionStats,
} from "./queries"; 