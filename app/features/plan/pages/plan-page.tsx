import { Link } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/common/components/ui/card";
import { Button } from "~/common/components/ui/button";
import { ArrowRight } from "lucide-react";
import { DateTime } from "luxon";
import { useTranslation } from "react-i18next";

import * as planQueries from "~/features/plan/queries";
import * as dailyQueries from "~/features/daily/queries";
import { makeSSRClient } from "~/supa-client";
// Assuming a common way to get profileId, adjust if necessary
// import { getProfileId } from "~/utils/auth"; 

// Placeholder for getProfileId - replace with your actual implementation
// async function getProfileId(_request?: Request): Promise<string> {
//   // return "ef20d66d-ed8a-4a14-ab2b-b7ff26f2643c"; // Mock profileId
//   return "fd64e09d-e590-4545-8fd4-ae7b2b784e4a";
// }
async function getProfileId(request: Request): Promise<string> {
  const { client } = makeSSRClient(request);
  const { data: { user } } = await client.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  return user.id;
}

export interface PlanOverviewLoaderData {
  profileId: string;
  tomorrowsPlanCount: number;
  tomorrowsTopPlans?: { id: string; comment: string | null }[];
  currentWeeklyTasksCount: number;
  lockedWeeklyTasksCount: number;
  lockedWeeklyTaskSummaries?: string[];
  currentMonthlyGoalsCount: number;
  monthlyGoalTitles?: string[];
  latestDailyNoteSummary?: string | null; 
  latestWeeklyNoteSummary?: string | null;
  latestMonthlyReflectionSummary?: string | null;
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: "Planning Hub - StartBeyond" },
    { name: "description", content: "Overview of your daily, weekly, and monthly plans." },
  ];
};

export async function loader({ request }: LoaderFunctionArgs): Promise<PlanOverviewLoaderData> {
  const { client } = makeSSRClient(request);
  const profileId = await getProfileId(request);
  const today = DateTime.now();
  const tomorrow = today.plus({ days: 1 }).toISODate();
  const currentWeekStartDate = today.startOf('week').toISODate();
  const currentMonthStartDate = today.startOf('month').toISODate();

  const [tomorrowsPlansResult, weeklyTasksResult, monthlyGoalsResult, dailyNoteResult, weeklyNoteResult, monthlyReflectionResult] = await Promise.all([
    planQueries.getDailyPlansByDate(client, { profileId, date: tomorrow! }),
    planQueries.getWeeklyTasksByWeek(client, { profileId, weekStartDate: currentWeekStartDate! }),
    planQueries.getMonthlyGoalsByMonth(client, { profileId, monthDate: currentMonthStartDate! }),
    dailyQueries.getDailyNotesByDate(client, { profileId, date: today.toISODate()! }),
    planQueries.getWeeklyNoteByWeek(client, { profileId, weekStartDate: currentWeekStartDate! }),
    planQueries.getMonthlyReflectionByMonth(client, { profileId, monthDate: currentMonthStartDate! })
  ]);

  const tomorrowsPlans = tomorrowsPlansResult || [];
  const weeklyTasks = weeklyTasksResult || [];
  const monthlyGoals = monthlyGoalsResult || [];
  const dailyNotesArray = dailyNoteResult || [];
  const weeklyNote = weeklyNoteResult;
  const monthlyReflection = monthlyReflectionResult;

  const tomorrowsTopPlans = tomorrowsPlans.slice(0, 2).map(p => ({ id: p.id, comment: p.comment?.substring(0, 40) || 'Plan'}));
  const lockedWeeklyTaskSummaries = weeklyTasks.filter(t => t.is_locked).slice(0,3).map(t => t.comment?.substring(0,40) || 'Locked Task');
  const monthlyGoalTitles = monthlyGoals.slice(0,3).map(g => g.title?.substring(0,40) || 'Goal'); 

  const latestDailyNote = dailyNotesArray.length > 0 ? dailyNotesArray[0] : null;

  return {
    profileId,
    tomorrowsPlanCount: tomorrowsPlans.length,
    tomorrowsTopPlans,
    currentWeeklyTasksCount: weeklyTasks.length,
    lockedWeeklyTasksCount: weeklyTasks.filter(task => task.is_locked).length,
    lockedWeeklyTaskSummaries,
    currentMonthlyGoalsCount: monthlyGoals.length,
    monthlyGoalTitles,
    latestDailyNoteSummary: latestDailyNote?.content ? latestDailyNote.content.substring(0, 70) + (latestDailyNote.content.length > 70 ? "..." : "") : null,
    latestWeeklyNoteSummary: weeklyNote?.critical_success_factor ? weeklyNote.critical_success_factor.substring(0,70) + (weeklyNote.critical_success_factor.length > 70 ? "..." : "") : (weeklyNote?.weekly_goal_note ? weeklyNote.weekly_goal_note.substring(0,70) + (weeklyNote.weekly_goal_note.length > 70 ? "..." : "") : null),
    latestMonthlyReflectionSummary: monthlyReflection?.monthly_reflection ? monthlyReflection.monthly_reflection.substring(0,70) + (monthlyReflection.monthly_reflection.length > 70 ? "..." : "") : null
  };
}

interface PlanOverviewPageProps {
    loaderData: PlanOverviewLoaderData;
}

export default function PlanOverviewPage({ loaderData }: PlanOverviewPageProps) {
  const { t, i18n } = useTranslation();

  if (!i18n.isInitialized) {
    return null; // Or a loading spinner
  }
  
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 pt-16 bg-background min-h-screen">
      <div className="mb-8">
        <h1 className="font-bold text-4xl mb-2">{t('plan_hub.title')}</h1>
        <p className="text-lg text-muted-foreground">
          {t('plan_hub.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('plan_hub.tomorrows_plan_title')}</CardTitle>
            <CardDescription>
              {loaderData.tomorrowsPlanCount > 0 
                ? t('plan_hub.tasks_planned_count', { count: loaderData.tomorrowsPlanCount }) 
                : t('plan_hub.no_tasks_planned')}
            </CardDescription>
            {loaderData.tomorrowsTopPlans && loaderData.tomorrowsTopPlans.length > 0 && (
              <ul className="text-sm text-muted-foreground list-disc list-inside pl-2 pt-1 mt-1">
                {loaderData.tomorrowsTopPlans.map(plan => <li key={plan.id} className="truncate">{plan.comment}{plan.comment && plan.comment.length >=40 ? "..." : ""}</li>)}
              </ul>
            )}
          </CardHeader>
          <CardContent className="pt-2">
            <Button asChild variant="outline" className="w-full">
              <Link to="/plan/tomorrow">
                {t('plan_hub.view_tomorrows_plan')} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('plan_hub.weekly_plan_title')}</CardTitle>
            <CardDescription>
              {loaderData.currentWeeklyTasksCount > 0 
                ? t('plan_hub.weekly_tasks_summary', { count: loaderData.currentWeeklyTasksCount, lockedCount: loaderData.lockedWeeklyTasksCount})
                : t('plan_hub.no_weekly_tasks')}
            </CardDescription>
            {loaderData.lockedWeeklyTaskSummaries && loaderData.lockedWeeklyTaskSummaries.length > 0 && (
              <ul className="text-sm text-muted-foreground list-disc list-inside pl-2 pt-1 mt-1">
                {loaderData.lockedWeeklyTaskSummaries.map((summary,idx) => <li key={idx} className="truncate">{summary}{summary.length >=40 ? "..." : ""}</li>)}
              </ul>
            )}
          </CardHeader>
          <CardContent className="pt-2">
            <Button asChild variant="outline" className="w-full">
              <Link to="/plan/weekly">
                {t('plan_hub.view_weekly_plan')} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('plan_hub.monthly_goals_title')}</CardTitle>
            <CardDescription>
              {loaderData.currentMonthlyGoalsCount > 0
                ? t('plan_hub.monthly_goals_summary', { count: loaderData.currentMonthlyGoalsCount })
                : t('plan_hub.no_monthly_goals')}
            </CardDescription>
            {loaderData.monthlyGoalTitles && loaderData.monthlyGoalTitles.length > 0 && (
              <ul className="text-sm text-muted-foreground list-disc list-inside pl-2 pt-1 mt-1">
                {loaderData.monthlyGoalTitles.map((title, idx) => <li key={idx} className="truncate">{title}{title.length >=40 ? "..." : ""}</li>)}
              </ul>
            )}
          </CardHeader>
          <CardContent className="pt-2">
            <Button asChild variant="outline" className="w-full">
              <Link to="/plan/monthly">
                {t('plan_hub.view_monthly_goals')} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>{t('plan_hub.daily_records_title')}</CardTitle>
            <CardDescription>{t('plan_hub.daily_records_description')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4"> {/* Adjusted padding for consistency if no list */} 
            <Button asChild variant="outline" className="w-full">
              <Link to="/daily">
                {t('plan_hub.view_daily_records')} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold mb-4">{t('plan_hub.recent_notes_title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 flex flex-col">
                <CardHeader><CardTitle className="text-lg">{t('plan_hub.todays_note_title')}</CardTitle></CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground whitespace-normal line-clamp-3 min-h-[3em]">
                        {loaderData.latestDailyNoteSummary || t('plan_hub.no_note_today')}
                    </p>
                </CardContent>
            </Card>
            <Card className="md:col-span-1 flex flex-col">
                <CardHeader><CardTitle className="text-lg">{t('plan_hub.this_weeks_focus_title')}</CardTitle></CardHeader>
                <CardContent className="flex-grow">
                     <p className="text-sm text-muted-foreground whitespace-normal line-clamp-3 min-h-[3em]">
                        {loaderData.latestWeeklyNoteSummary || t('plan_hub.no_weekly_notes')}
                    </p>
                </CardContent>
            </Card>
            <Card className="md:col-span-1 flex flex-col">
                <CardHeader><CardTitle className="text-lg">{t('plan_hub.this_months_reflection_title')}</CardTitle></CardHeader>
                <CardContent className="flex-grow">
                     <p className="text-sm text-muted-foreground whitespace-normal line-clamp-3 min-h-[3em]">
                        {loaderData.latestMonthlyReflectionSummary || t('plan_hub.no_monthly_reflection')}
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
} 