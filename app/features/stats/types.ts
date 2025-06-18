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
  getComparisonStats,
} from "./queries";
import type { DailyPlan } from "~/features/plan/queries";
import type { Database } from "database.types";

export interface DailyRecordUI {
  id: string;
  date: string;
  comment: string | null;
  category_code: CategoryCode | null;
  subcode: string | null;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
  profile_id: string;
  linked_plan_id: string | null;
  is_bookmarked: boolean;
  evidence_url: string | null;
  memo: string | null;
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

export interface SharedLink {
  id: string;
  token: string;
  created_at: string;
  profile_id: string;
  page_type: 'summary' | 'advanced' | 'category';
  period: string;
  is_public: boolean;
  settings?: unknown; // JSONB field
  updated_at?: string;
  // Page-specific settings from the form, make them optional
  allow_export?: boolean;
  include_summary?: boolean;
  include_subcode_distribution?: boolean;
  include_heatmap?: boolean;
  include_comparison?: boolean;
  include_goals?: boolean;
}

export type SharedLinkInsert = Omit<SharedLink, 'id' | 'created_at' | 'updated_at' | 'token'>;

export interface SummaryPageLoaderData {
  profileId: string;
  selectedMonthISO: string;
  categoryDistribution: CategoryDistribution[];
  subcodeDistribution: SubcodeDistribution[];
  categories: UICategory[];
  timeOfDayDistribution: TimeOfDayDistribution;
  prevMonthCategoryDistribution: {
    category_code: string;
    count: number;
    duration: number;
  }[];
  currentMonthGoalStats: GoalCompletionStats;
  prevMonthGoalStats: GoalCompletionStats;
  summaryInsights: SummaryInsights;
  locale: string;
  sharedLink: SharedLink | null;
  yearlyCategoryHeatmapData: Record<CategoryCode, HeatmapData[]>;
  categoryDistribution: CategoryDistribution[];
  comparisonStats: {
    monthly: { time: any, records: any },
    weekly: { time: any, records: any }
  };
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
  date: string;
  intensity: number;
  categories: Record<CategoryCode, number>;
  total: number;
}

export interface AdvancedPageLoaderData {
  profileId: string;
  categories: UICategory[];
  currentYear: number;
  yearlyCategoryHeatmapData: Record<CategoryCode, HeatmapData[]>;
  categoryDistribution: CategoryDistribution[];
  comparisonStats: {
    monthly: { time: any, records: any },
    weekly: { time: any, records: any }
  };
  sharedLink: SharedLink | null;
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
  // GoalCompletionStats, // Temporarily commented out to avoid conflict
} from "./queries"; 

export interface ShareableStatsData {
  // ... existing code ...
} 

export interface GoalCompletionStats {
  totalPlans: number;
  completedPlans: number;
  completionRate: number;
  total_goals: number;
  completed_goals: number;
} 