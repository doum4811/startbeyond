import { Link } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/common/components/ui/card";
import { Button } from "~/common/components/ui/button";
import { ArrowRight } from "lucide-react";
import { DateTime } from "luxon";

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

export const meta: MetaFunction = () => {
  return [
    { title: "Plan Overview - StartBeyond" },
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
    latestDailyNoteSummary: latestDailyNote?.content ? latestDailyNote.content.substring(0, 70) + (latestDailyNote.content.length > 70 ? "..." : "") : "No note for today.",
    latestWeeklyNoteSummary: weeklyNote?.critical_success_factor ? weeklyNote.critical_success_factor.substring(0,70) + (weeklyNote.critical_success_factor.length > 70 ? "..." : "") : (weeklyNote?.weekly_goal_note ? weeklyNote.weekly_goal_note.substring(0,70) + (weeklyNote.weekly_goal_note.length > 70 ? "..." : "") : "No weekly notes."),
    latestMonthlyReflectionSummary: monthlyReflection?.monthly_reflection ? monthlyReflection.monthly_reflection.substring(0,70) + (monthlyReflection.monthly_reflection.length > 70 ? "..." : "") : "No reflection this month."
  };
}

interface PlanOverviewPageProps {
    loaderData: PlanOverviewLoaderData;
}

export default function PlanOverviewPage({ loaderData }: PlanOverviewPageProps) {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 pt-16 bg-background min-h-screen">
      <div className="mb-8">
        <h1 className="font-bold text-4xl mb-2">Planning Hub</h1>
        <p className="text-lg text-muted-foreground">
          Manage your daily activities, weekly tasks, and long-term monthly goals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Tomorrow's Plan</CardTitle>
            <CardDescription>
              {loaderData.tomorrowsPlanCount > 0 
                ? `${loaderData.tomorrowsPlanCount} tasks planned` 
                : "No tasks planned for tomorrow."}
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
                View Tomorrow's Plan <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Plan</CardTitle>
            <CardDescription>
              {loaderData.currentWeeklyTasksCount > 0 
                ? `${loaderData.currentWeeklyTasksCount} tasks this week (${loaderData.lockedWeeklyTasksCount} locked).`
                : "No weekly tasks found."}
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
                View Weekly Plan <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Goals</CardTitle>
            <CardDescription>
              {loaderData.currentMonthlyGoalsCount > 0
                ? `${loaderData.currentMonthlyGoalsCount} goals this month.`
                : "No monthly goals set."}
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
                View Monthly Goals <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Daily Records</CardTitle>
            <CardDescription>Log your daily activities and notes.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4"> {/* Adjusted padding for consistency if no list */} 
            <Button asChild variant="outline" className="w-full">
              <Link to="/daily">
                View Daily Records <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold mb-4">Recent Reflections & Notes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 flex flex-col">
                <CardHeader><CardTitle className="text-lg">Today's Note</CardTitle></CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground whitespace-normal line-clamp-3 min-h-[3em]">
                        {loaderData.latestDailyNoteSummary}
                    </p>
                </CardContent>
            </Card>
            <Card className="md:col-span-1 flex flex-col">
                <CardHeader><CardTitle className="text-lg">This Week's Focus</CardTitle></CardHeader>
                <CardContent className="flex-grow">
                     <p className="text-sm text-muted-foreground whitespace-normal line-clamp-3 min-h-[3em]">
                        {loaderData.latestWeeklyNoteSummary}
                    </p>
                </CardContent>
            </Card>
            <Card className="md:col-span-1 flex flex-col">
                <CardHeader><CardTitle className="text-lg">This Month's Reflection</CardTitle></CardHeader>
                <CardContent className="flex-grow">
                     <p className="text-sm text-muted-foreground whitespace-normal line-clamp-3 min-h-[3em]">
                        {loaderData.latestMonthlyReflectionSummary}
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
} 