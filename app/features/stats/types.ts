import type { CategoryCode, UICategory } from "~/common/types/daily";
import type { 
  CategoryDistribution,
  ActivityHeatmap,
  CategorySummary,
  StatsCache,
  SummaryInsights,
  TimeOfDayDistribution,
  SubcodeDistribution,
  GoalCompletionStats as GoalCompletionStatsFromQuery,
  getComparisonStats,
  DetailedCategorySummary,
} from "./queries";
import type { DailyPlan } from "~/features/plan/queries";
import type { Database } from "database.types";

export interface DailyRecordUI {
  id: string;
  date: string;
  comment: string | null;
  category_code: CategoryCode;
  subcode: string | null;
  duration_minutes?: number | null;
  created_at?: string;
  updated_at?: string;
  profile_id: string;
  linked_plan_id: string | null;
  is_public: boolean;
  is_bookmarked?: boolean;
  evidence_url?: string | null;
  memo?: string | null;
  memos?: MemoUI[];
}

export interface MemoUI {
  id: string;
  title: string;
  content: string;
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

export interface SharedLinkSettings {
  allow_export?: boolean;
  include_summary?: boolean;
  include_subcode_distribution?: boolean;
  include_heatmap?: boolean;
  include_comparison?: boolean;
  include_goals?: boolean;
  include_records_list?: boolean;
  include_notes?: boolean;
}

export interface SharedLink {
  id: string;
  token: string;
  created_at: string | Date;
  profile_id: string;
  page_type: 'summary' | 'advanced' | 'category' | 'records';
  period: string;
  is_public: boolean;
  settings?: SharedLinkSettings;
  updated_at?: string | Date;
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
  currentMonthGoalStats: GoalCompletionStatsFromQuery;
  prevMonthGoalStats: GoalCompletionStatsFromQuery;
  summaryInsights: SummaryInsights;
  locale: string;
  sharedLink: SharedLink | null;
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

export interface GoalAchievementStats {
  totalPlans: number;
  completedPlans: number;
  completionRate: number;
  longestStreak: number;
  uncheckedPlans: { plan: DailyPlan; category?: UICategory }[];
  categoryCompletion: Record<string, { total: number; completed: number; rate: number; category: UICategory }>;
}

export interface CategoryPageLoaderData {
  profileId: string;
  categories: UICategory[];
  detailedSummary: DetailedCategorySummary[];
  selectedMonthISO: string;
  goalStats: GoalAchievementStats;
  sharedLink: SharedLink | null;
}

export interface RecordsPageLoaderData {
  profileId: string;
  categories: UICategory[];
  monthlyData: MonthlyDayRecord[];
  startDate: string;
  endDate: string;
  sharedLink: SharedLink | null;
} 