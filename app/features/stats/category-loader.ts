import { DateTime } from "luxon";
import type { LoaderFunctionArgs } from "react-router";
import { makeSSRClient } from "~/supa-client";
import { getUserCategories, getUserDefaultCodePreferences } from "~/features/settings/queries";
import * as statsQueries from "~/features/stats/queries";
import * as planQueries from "~/features/plan/queries";
import * as dailyQueries from "~/features/daily/queries";
import type { DailyPlan, DailyRecord } from "~/features/plan/queries";
import type { MonthlyGoalRow } from "~/features/plan/queries";
import type { CategoryCode, UICategory } from "~/common/types/daily";
import { CATEGORIES as DEFAULT_CATEGORIES } from "~/common/types/daily";

export interface PlanCompletionStats {
  totalPlans: number;
  completedPlans: number;
  completionRate: number;
}

export interface CategoryLoaderData {
  profileId: string | null;
  month: string;
  monthlySummary: Awaited<ReturnType<typeof statsQueries.calculateDetailedCategorySummary>>;
  monthlyGoals: MonthlyGoalRow[];
  allCategories: UICategory[];
  planCompletionStats: PlanCompletionStats;
  longestStreak: number;
  incompletePlans: DailyPlan[];
}

async function getProfileId(request: Request): Promise<string | null> {
  try {
    const { client } = makeSSRClient(request);
    const { data: { user } } = await client.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.warn("Failed to get profileId in loader:", error);
    return null;
  }
}

export const loader = async ({ request }: LoaderFunctionArgs): Promise<CategoryLoaderData> => {
  const profileId = await getProfileId(request);
  const { client } = makeSSRClient(request);
  const url = new URL(request.url);
  const month = url.searchParams.get("month") || DateTime.now().toFormat("yyyy-MM");
  const monthStart = DateTime.fromFormat(month, "yyyy-MM").startOf("month");
  const startDate = monthStart.toISODate()!;
  const endDate = monthStart.endOf("month").toISODate()!;

  let allCategories: UICategory[] = [];
  let monthlySummary: CategoryLoaderData['monthlySummary'] = [];
  let monthlyGoals: CategoryLoaderData['monthlyGoals'] = [];
  let planCompletionStats: PlanCompletionStats = { totalPlans: 0, completedPlans: 0, completionRate: 0 };
  let longestStreak = 0;
  let incompletePlans: DailyPlan[] = [];

  if (profileId) {
    const [
      userCategoriesDb,
      userDefaultPrefsDb,
      summary,
      goals,
      plans,
    ] = await Promise.all([
      getUserCategories(client, { profileId }),
      getUserDefaultCodePreferences(client, { profileId }),
      statsQueries.calculateDetailedCategorySummary(client, { profileId, startDate, endDate }),
      planQueries.getMonthlyGoalsByMonth(client, { profileId, monthDate: startDate }),
      planQueries.getDailyPlansByPeriod(client, { profileId, startDate, endDate }),
    ]);

    // Build Categories
    const categoriesMap = new Map<CategoryCode, UICategory>();
    Object.values(DEFAULT_CATEGORIES).forEach(cat => {
      categoriesMap.set(cat.code, { ...cat, isCustom: false, isActive: true, color: undefined });
    });
    const defaultPrefs = new Map(userDefaultPrefsDb.map(p => [p.default_category_code, p.is_active]));
    categoriesMap.forEach(cat => {
      const pref = defaultPrefs.get(cat.code);
      if (pref !== undefined) {
        cat.isActive = pref;
      }
    });
    userCategoriesDb.forEach(dbCat => {
      const existing = categoriesMap.get(dbCat.code as CategoryCode);
      if (existing) {
        existing.label = dbCat.label;
        existing.icon = dbCat.icon;
        existing.color = dbCat.color;
        existing.isActive = dbCat.is_active;
        existing.isCustom = true;
      } else {
        categoriesMap.set(dbCat.code as CategoryCode, {
          ...dbCat,
          code: dbCat.code as CategoryCode,
          isCustom: true,
          isActive: dbCat.is_active,
          hasDuration: true,
          sort_order: dbCat.sort_order === null ? undefined : dbCat.sort_order,
        });
      }
    });
    allCategories = Array.from(categoriesMap.values()).filter(c => c.isActive).sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
    
    monthlySummary = summary;
    monthlyGoals = goals;

    // Plan stats
    if (plans.length > 0) {
      const completedPlans = plans.filter(p => p.is_completed);
      
      planCompletionStats = {
        totalPlans: plans.length,
        completedPlans: completedPlans.length,
        completionRate: plans.length > 0 ? Math.round((completedPlans.length / plans.length) * 100) : 0,
      };
      
      incompletePlans = plans.filter(p => !p.is_completed);

      const plansByDate: Record<string, { total: number; completed: number }> = {};
      for (const plan of plans) {
        if (!plan.plan_date) continue;
        if (!plansByDate[plan.plan_date]) {
          plansByDate[plan.plan_date] = { total: 0, completed: 0 };
        }
        plansByDate[plan.plan_date].total++;
        if (plan.is_completed) {
          plansByDate[plan.plan_date].completed++;
        }
      }

      let currentStreak = 0;
      for (let day = monthStart; day <= monthStart.endOf("month"); day = day.plus({ days: 1 })) {
        const dateStr = day.toISODate()!;
        const dayPlans = plansByDate[dateStr];
        if (dayPlans && dayPlans.total > 0 && dayPlans.total === dayPlans.completed) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 0;
        }
      }
      longestStreak = Math.max(longestStreak, currentStreak);
    }
  }

  return {
    profileId,
    month,
    monthlySummary,
    monthlyGoals,
    allCategories,
    planCompletionStats,
    longestStreak,
    incompletePlans
  };
}; 