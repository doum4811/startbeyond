import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "~/common/components/ui/card";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Textarea } from "~/common/components/ui/textarea";
import { Label } from "~/common/components/ui/label";
import { CATEGORIES, type CategoryCode } from "~/common/types/daily";
import { Link, Form, useFetcher } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { Calendar as CalendarIcon, PlusCircle, Trash2, Edit, Save, CheckSquare, XSquare } from "lucide-react";
import { DateTime } from "luxon";
import { Calendar } from "~/common/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "~/common/components/ui/popover";
import { Switch } from "~/common/components/ui/switch";

import * as planQueries from "~/features/plan/queries";
import type { 
    MonthlyGoalRow as DbMonthlyGoal, 
    MonthlyGoalInsert, 
    MonthlyGoalUpdate,
    MonthlyReflection as DbMonthlyReflection,
    MonthlyReflectionInsert
} from "~/features/plan/queries";

// Generic JSON type if specific one isn't available from supabase-helpers
export type Json = | string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// --- UI Specific Types ---
interface SuccessCriterionUI {
  id: string; 
  text: string;
  is_completed: boolean;
}

interface MonthlyGoalUI {
  id: string;
  month_date: string;
  category_code: CategoryCode;
  title: string;
  description: string | null;
  success_criteria: SuccessCriterionUI[];
  weekly_breakdown: Record<string, string>; // e.g., {"week1": "...", "week2": "..."}
  is_completed: boolean;
  profile_id: string; 
  created_at?: string;
  updated_at?: string;
}

interface MonthlyReflectionUI {
    id: string;
  month_date: string;
  content: string | null;
  profile_id: string;
  created_at?: string;
  updated_at?: string;
}

// --- Helper Functions ---
async function getProfileId(_request?: Request): Promise<string> {
  return "ef20d66d-ed8a-4a14-ab2b-b7ff26f2643c"; 
}

function getCurrentMonthStartDateISO(dateParam?: string | null): string {
  if (dateParam) {
    const dt = DateTime.fromISO(dateParam);
    if (dt.isValid) return dt.startOf('month').toISODate();
  }
  return DateTime.now().startOf('month').toISODate();
}

function getMonthName(dateISO: string): string {
  return DateTime.fromISO(dateISO).toFormat("yyyy년 M월");
}

interface WeekInfo {
  weekNumber: number; // 1-indexed week number in month
  startDate: string; // ISO YYYY-MM-DD
  endDate: string; // ISO YYYY-MM-DD
}

// Helper function to get all weeks within a given month
function getWeeksInMonth(monthIsoDate: string): WeekInfo[] {
  const startOfMonth = DateTime.fromISO(monthIsoDate).startOf('month');
  const endOfMonth = DateTime.fromISO(monthIsoDate).endOf('month');
  const weeks: WeekInfo[] = [];
  let currentWeekStart = startOfMonth.startOf('week');
  let weekNumberInMonth = 1;

  while (currentWeekStart <= endOfMonth) {
    // Ensure the week starts within the current month or the previous month but ends in the current month
    if (currentWeekStart.month === startOfMonth.month || currentWeekStart.plus({days: 6}).month === startOfMonth.month ){
        weeks.push({
            weekNumber: weekNumberInMonth++,
            startDate: currentWeekStart.toISODate()!,
            endDate: currentWeekStart.endOf('week').toISODate()!,
        });
}
    currentWeekStart = currentWeekStart.plus({ weeks: 1 });
  }
  return weeks;
}

const isValidCategoryCode = (code: string): code is CategoryCode => {
    return code in CATEGORIES;
};

function getCategoryColor(code: CategoryCode): string {
  const category = CATEGORIES[code];
  if (!category) return "text-gray-500";
  const map: Record<CategoryCode, string> = {
    EX: "text-orange-500", BK: "text-green-600", ML: "text-orange-600", EM: "text-purple-500", ST: "text-yellow-500", WK: "text-teal-700", HB: "text-pink-500", SL: "text-cyan-600", RT: "text-blue-500"
  };
  return map[code] || "text-gray-500";
}

function dbGoalToUIGoal(dbGoal: DbMonthlyGoal): MonthlyGoalUI {
  let successCriteriaUI: SuccessCriterionUI[] = [];
  if (dbGoal.success_criteria && Array.isArray(dbGoal.success_criteria)) {
     successCriteriaUI = dbGoal.success_criteria.map((sc: any, index: number) => ({
      id: String(sc.id || `sc-${dbGoal.id}-${index}-${Date.now()}`), 
      text: sc.text || "",
      is_completed: sc.is_completed || false,
    }));
  } else if (typeof dbGoal.success_criteria === 'string') {
    try {
      const parsed = JSON.parse(dbGoal.success_criteria);
      if (Array.isArray(parsed)) {
        successCriteriaUI = parsed.map((sc: any, index: number) => ({
          id: String(sc.id || `sc-${dbGoal.id}-${index}-${Date.now()}`), 
          text: sc.text || "",
          is_completed: sc.is_completed || false,
        }));
      }
    } catch (e) {
      console.error("Error parsing success_criteria from string:", e);
    }
  }

  let weeklyBreakdownUI: Record<string, string> = {};
  if (dbGoal.weekly_breakdown && typeof dbGoal.weekly_breakdown === 'object' && !Array.isArray(dbGoal.weekly_breakdown)) {
    weeklyBreakdownUI = dbGoal.weekly_breakdown as Record<string, string>;
  } else if (typeof dbGoal.weekly_breakdown === 'string') {
    try {
        const parsedWb = JSON.parse(dbGoal.weekly_breakdown);
        if (typeof parsedWb === 'object' && !Array.isArray(parsedWb)) {
            weeklyBreakdownUI = parsedWb;
        }
    } catch (e) {
        console.error("Error parsing weekly_breakdown from string:", e);
    }
  }
  
  return {
    id: dbGoal.id,
    profile_id: dbGoal.profile_id,
    month_date: dbGoal.month_date, 
    category_code: dbGoal.category_code as CategoryCode, 
    title: dbGoal.title,
    description: dbGoal.description ?? null,
    success_criteria: successCriteriaUI,
    weekly_breakdown: weeklyBreakdownUI,
    is_completed: dbGoal.is_completed ?? false,
    created_at: dbGoal.created_at,
    updated_at: dbGoal.updated_at,
  };
}

function dbReflectionToUIReflection(dbReflection: DbMonthlyReflection): MonthlyReflectionUI {
  return {
    id: dbReflection.id,
    profile_id: dbReflection.profile_id,
    month_date: dbReflection.month_date, 
    content: dbReflection.monthly_reflection ?? null, 
    created_at: dbReflection.created_at,
    updated_at: dbReflection.updated_at,
  };
}

// --- Loader ---
export interface MonthlyPageLoaderData {
  profileId: string;
  selectedMonth: string; // ISO date string YYYY-MM-DD (start of month)
  monthlyGoals: MonthlyGoalUI[];
  monthlyReflection: MonthlyReflectionUI | null;
  weeksInSelectedMonth: WeekInfo[];
}

export const loader = async ({ request }: LoaderFunctionArgs): Promise<MonthlyPageLoaderData> => {
  const profileId = await getProfileId(request);
  const url = new URL(request.url);
  const monthParam = url.searchParams.get("month");
  const selectedMonth = getCurrentMonthStartDateISO(monthParam);
  const weeksInSelectedMonth = getWeeksInMonth(selectedMonth);

  const [dbGoals, dbReflection] = await Promise.all([
    planQueries.getMonthlyGoalsByMonth({ profileId, monthDate: selectedMonth }),
    planQueries.getMonthlyReflectionByMonth({ profileId, monthDate: selectedMonth })
  ]);

  const monthlyGoals: MonthlyGoalUI[] = (dbGoals || []).map(dbGoalToUIGoal);
  const monthlyReflection: MonthlyReflectionUI | null = dbReflection ? dbReflectionToUIReflection(dbReflection) : null;

  return {
    profileId,
    selectedMonth,
    monthlyGoals,
    monthlyReflection,
    weeksInSelectedMonth,
  };
};

// --- Action ---
export const action = async ({ request }: ActionFunctionArgs) => {
  const profileId = await getProfileId(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const selectedMonth = formData.get("month_date") as string || getCurrentMonthStartDateISO(); // Ensure month_date is passed
  const weeksInMonthForAction = getWeeksInMonth(selectedMonth); // Get weeks for action context

  try {
    switch (intent) {
      case "addMonthlyGoal":
      case "updateMonthlyGoal": {
        const title = formData.get("title") as string | null;
        const categoryCodeStr = formData.get("category_code") as string | null;
        if (!title || title.trim() === "") return { ok: false, error: "Goal title is required.", intent };
        if (!categoryCodeStr || !isValidCategoryCode(categoryCodeStr)) return { ok: false, error: "Valid category is required.", intent };
        
        const description = formData.get("description") as string | null;
        const successCriteriaStr = formData.get("success_criteria") as string | null;
        
        const success_criteria_for_db: Json = (successCriteriaStr || "")
      .split('\n')
      .filter(line => line.trim())
          .map((line, index) => ({ 
            id: String(formData.get(`success_criteria_id_${index}`) as string || `new-${Date.now()}-${index}`), 
        text: line.trim(),
            is_completed: formData.get(`success_criteria_completed_${index}`) === 'true' || false
          })) as unknown as Json; 
          
        const weekly_breakdown_for_db: Json = weeksInMonthForAction.reduce((acc, weekInfo) => {
          const breakdown = formData.get(`weekly_breakdown_week${weekInfo.weekNumber}`) as string | null;
          if (breakdown && breakdown.trim() !== "") {
            (acc as Record<string, string>)[`week${weekInfo.weekNumber}`] = breakdown.trim();
          }
          return acc;
        }, {} as Record<string, string>) as unknown as Json; 

        if (intent === "addMonthlyGoal") {
          const goalData: MonthlyGoalInsert = {
            profile_id: profileId,
            month_date: selectedMonth,
            category_code: categoryCodeStr,
            title,
            description,
            success_criteria: success_criteria_for_db,
            weekly_breakdown: weekly_breakdown_for_db,
            is_completed: false,
          };
          const newGoalDb = await planQueries.createMonthlyGoal(goalData);
          const newGoal = newGoalDb ? dbGoalToUIGoal(newGoalDb) : null;
          return { ok: true, intent, newGoal };
        } else { // updateMonthlyGoal
          const goalId = formData.get("goalId") as string | null;
          if (!goalId) return { ok: false, error: "Goal ID is required for update.", intent };
          
          const isCompleted = formData.get("is_completed") === "true";

          const updates: Partial<MonthlyGoalUpdate> = {
            category_code: categoryCodeStr,
            title,
            description,
            success_criteria: success_criteria_for_db,
            weekly_breakdown: weekly_breakdown_for_db,
            is_completed: isCompleted,
          };
          const updatedGoalDb = await planQueries.updateMonthlyGoal({ goalId, profileId, updates });
          const updatedGoal = updatedGoalDb ? dbGoalToUIGoal(updatedGoalDb) : null;
          return { ok: true, intent, updatedGoal, goalId };
        }
      }
      case "deleteMonthlyGoal": {
        const goalId = formData.get("goalId") as string | null;
        if (!goalId) return { ok: false, error: "Goal ID is required for deletion.", intent };
        await planQueries.deleteMonthlyGoal({ goalId, profileId });
        return { ok: true, intent, deletedGoalId: goalId };
      }
      case "updateGoalCompletionStatus": { 
        const goalId = formData.get("goalId") as string | null;
        if (!goalId) return { ok: false, error: "Goal ID is required.", intent };

        const successCriteriaStr = formData.get("success_criteria") as string | null; 
        let success_criteria_parsed: SuccessCriterionUI[] = [];
        if (successCriteriaStr) {
            try { 
              const parsedJson = JSON.parse(successCriteriaStr);
              if (Array.isArray(parsedJson)) {
                success_criteria_parsed = parsedJson.map((item: any, index: number) => ({ 
                  id: String(item.id || `sc-parsed-${goalId}-${index}-${Date.now()}`), 
                  text: item.text || "", 
                  is_completed: item.is_completed || false
      }));
    }
            }
            catch (e) { 
                console.error("Failed to parse success_criteria for updateGoalCompletionStatus", e); 
                return { ok: false, error: "Invalid success criteria format.", intent };
            }
        }
        
        const allCriteriaCompleted = success_criteria_parsed.length > 0 && success_criteria_parsed.every(sc => sc.is_completed);
        
        const updates: Partial<MonthlyGoalUpdate> = {
          success_criteria: success_criteria_parsed as unknown as Json, 
          is_completed: allCriteriaCompleted
        };
        const updatedGoalDb = await planQueries.updateMonthlyGoal({ goalId, profileId, updates });
        const updatedGoal = updatedGoalDb ? dbGoalToUIGoal(updatedGoalDb) : null;
        return { ok: true, intent, updatedGoal, goalId };
      }
      case "upsertMonthlyReflection": {
        const content = formData.get("content") as string | null;
        const reflectionId = formData.get("reflectionId") as string | null;

        const reflectionData: MonthlyReflectionInsert = {
          profile_id: profileId,
          month_date: selectedMonth,
          monthly_reflection: content, 
        };
        if (reflectionId && reflectionId !== "null" && reflectionId.trim() !== "") {
          reflectionData.id = reflectionId;
        }
        
        const upsertedReflectionDb = await planQueries.upsertMonthlyReflection(reflectionData);
        const upsertedReflection = upsertedReflectionDb ? dbReflectionToUIReflection(upsertedReflectionDb) : null;
        return { ok: true, intent, upsertedReflection };
      }
      default:
        return { ok: false, error: `Unknown intent: ${intent}`, intent };
    }
  } catch (error: any) {
    console.error("MonthlyPage Action error:", error);
    const intentVal = formData.get("intent") as string | null;
    return { ok: false, error: error.message || "An unexpected error occurred.", intent: intentVal || "error" };
  }
};

// --- Meta ---
export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const pageData = data as MonthlyPageLoaderData | undefined;
  const monthStr = pageData?.selectedMonth ? getMonthName(pageData.selectedMonth) : "Monthly";
  return [
    { title: `${monthStr} Plan - StartBeyond` },
    { name: "description", content: `Plan your goals and reflections for ${monthStr}.` },
  ];
};

// --- Default Form Values ---
const DEFAULT_GOAL_CATEGORY: CategoryCode = "WK";
interface GoalFormState {
  id: string | null; // For editing
  category_code: CategoryCode;
  title: string;
  description: string;
  success_criteria: string; // Newline separated
  weekly_breakdown: Record<string, string>; // Keys like "week1", "week2"
  is_completed: boolean;
  // Keep track of original success criteria to pass IDs and completion status if needed
  original_success_criteria: SuccessCriterionUI[];
}

const initialGoalFormState = (weeksForForm: WeekInfo[]): GoalFormState => ({
  id: null,
  category_code: DEFAULT_GOAL_CATEGORY,
  title: "",
  description: "",
  success_criteria: "",
  weekly_breakdown: weeksForForm.reduce((acc, weekInfo) => ({ ...acc, [`week${weekInfo.weekNumber}`]: "" }), {}),
  is_completed: false,
  original_success_criteria: [],
});

// --- Component ---
interface MonthlyPlanPageProps {
  loaderData: MonthlyPageLoaderData;
  }

export default function MonthlyPlanPage({ loaderData }: MonthlyPlanPageProps) {
  const { 
    profileId, 
    selectedMonth: initialSelectedMonth, 
    monthlyGoals: initialMonthlyGoals, 
    monthlyReflection: initialMonthlyReflection, 
    weeksInSelectedMonth
  } = loaderData;

  const fetcher = useFetcher<typeof action>();
  
  const [selectedMonth, setSelectedMonth] = useState<string>(initialSelectedMonth);
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoalUI[]>(initialMonthlyGoals);
  const [monthlyReflection, setMonthlyReflection] = useState<MonthlyReflectionUI | null>(initialMonthlyReflection);

  const [goalForm, setGoalForm] = useState<GoalFormState>(initialGoalFormState(weeksInSelectedMonth));
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  
  const [reflectionFormContent, setReflectionFormContent] = useState(initialMonthlyReflection?.content || "");

  const [isGoalsInputSectionOpen, setIsGoalsInputSectionOpen] = useState(false);
  const [isReflectionSectionCollapsed, setIsReflectionSectionCollapsed] = useState(!initialMonthlyReflection || !initialMonthlyReflection.content);
  
  useEffect(() => {
    setSelectedMonth(initialSelectedMonth);
    setMonthlyGoals(initialMonthlyGoals);
    setMonthlyReflection(initialMonthlyReflection);
    setReflectionFormContent(initialMonthlyReflection?.content || "");
    setIsReflectionSectionCollapsed(!initialMonthlyReflection || !initialMonthlyReflection.content);
    setGoalForm(initialGoalFormState(weeksInSelectedMonth));
    setIsGoalsInputSectionOpen(false);
    setIsEditingGoal(false);
  }, [initialSelectedMonth, initialMonthlyGoals, initialMonthlyReflection, weeksInSelectedMonth]);

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      const res = fetcher.data;
      if (res.ok) {
        if ((res.intent === "addMonthlyGoal" && res.newGoal)) {
          setMonthlyGoals(prev => [res.newGoal as MonthlyGoalUI, ...prev].sort((a,b) => {
            const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return timeB - timeA;
          }));
          setIsGoalsInputSectionOpen(false);
          setIsEditingGoal(false);
          setGoalForm(initialGoalFormState(weeksInSelectedMonth));
        } else if (res.intent === "updateMonthlyGoal" && res.updatedGoal) {
          setMonthlyGoals(prev => prev.map(g => g.id === res.goalId ? res.updatedGoal as MonthlyGoalUI : g));
          setIsGoalsInputSectionOpen(false);
          setIsEditingGoal(false);
          setGoalForm(initialGoalFormState(weeksInSelectedMonth));
        } else if (res.intent === "deleteMonthlyGoal" && res.deletedGoalId) {
          setMonthlyGoals(prev => prev.filter(g => g.id !== res.deletedGoalId));
        } else if (res.intent === "updateGoalCompletionStatus" && res.updatedGoal) {
          setMonthlyGoals(prev => prev.map(g => g.id === res.goalId ? res.updatedGoal as MonthlyGoalUI : g));
        } else if (res.intent === "upsertMonthlyReflection" && res.upsertedReflection) {
          setMonthlyReflection(res.upsertedReflection as MonthlyReflectionUI);
          setReflectionFormContent((res.upsertedReflection as MonthlyReflectionUI).content || "");
        }
      } else if (res.error) {
        console.error("Monthly Page Action Error:", res.error, "Intent:", res.intent);
        alert(`Error (${res.intent || 'Unknown'}): ${res.error}`);
  }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.data, fetcher.state]); 

  const handleOpenGoalForm = (goalToEdit?: MonthlyGoalUI) => {
    if (goalToEdit) {
      setGoalForm({
        id: goalToEdit.id,
        category_code: goalToEdit.category_code,
        title: goalToEdit.title,
        description: goalToEdit.description || "",
        success_criteria: goalToEdit.success_criteria.map(sc => sc.text).join('\n'),
        weekly_breakdown: { ...initialGoalFormState(weeksInSelectedMonth).weekly_breakdown, ...goalToEdit.weekly_breakdown },
        is_completed: goalToEdit.is_completed,
        original_success_criteria: goalToEdit.success_criteria,
      });
      setIsEditingGoal(true);
    } else {
      setGoalForm(initialGoalFormState(weeksInSelectedMonth));
      setIsEditingGoal(false);
  }
    setIsGoalsInputSectionOpen(true);
  };

  const handleCancelGoalForm = () => {
    setIsGoalsInputSectionOpen(false);
    setIsEditingGoal(false);
    setGoalForm(initialGoalFormState(weeksInSelectedMonth));
  };

  const handleGoalFormChange = (field: keyof GoalFormState, value: any) => {
    setGoalForm(prev => ({ ...prev, [field]: value }));
  };
  
  const handleWeeklyBreakdownChange = (weekNum: number, value: string) => {
    setGoalForm(prev => ({
      ...prev,
      weekly_breakdown: {
        ...prev.weekly_breakdown,
        [`week${weekNum}`]: value,
      }
    }));
  };

  const handleToggleSuccessCriterion = (goalId: string, criterionId: string) => {
    const goal = monthlyGoals.find(g => g.id === goalId);
    if (!goal) return;

    const updatedCriteria = goal.success_criteria.map(sc => 
      sc.id === criterionId ? { ...sc, is_completed: !sc.is_completed } : sc
    );
    
    const formData = new FormData();
    formData.append("intent", "updateGoalCompletionStatus");
    formData.append("goalId", goalId);
    formData.append("month_date", selectedMonth);
    // Pass all success criteria to action to correctly determine overall completion
    formData.append("success_criteria", JSON.stringify(updatedCriteria)); 
    
    fetcher.submit(formData, { method: "post" });
  };
  
  const navigateMonth = useFetcher().submit;

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 pt-16 bg-background min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-3xl">Monthly Plan</h1>
          <MonthlyCalendarPopover 
            currentMonthISO={selectedMonth} 
            onMonthChange={(newMonthISO) => {
                navigateMonth({ month: newMonthISO }, { method: "get", action: "/plan/monthly" });
            }}
          />
        </div>
        <div className="text-gray-500 text-lg">{getMonthName(selectedMonth)}</div>
        <Button asChild className="ml-2" variant="ghost" size="sm">
            <Link to="/plan/weekly">To Weekly Plan</Link>
        </Button>
      </div>

      {/* Goal Form - Inline Collapsible Section */}
      <Card className="mb-8">
        <CardHeader className="cursor-pointer" onClick={() => { if (!isGoalsInputSectionOpen) handleOpenGoalForm(); else handleCancelGoalForm(); }}>
            <div className="flex items-center justify-between">
                <CardTitle>{isGoalsInputSectionOpen ? (isEditingGoal ? "Edit Monthly Goal" : "Add Monthly Goal") : `Monthly Goals (${monthlyGoals.length})`}</CardTitle>
                <Button variant="ghost" size="sm">
                    {isGoalsInputSectionOpen ? "Cancel" : (monthlyGoals.length === 0 ? "Add Goal" : "Show/Add Goal")}
                </Button>
            </div>
            {!isGoalsInputSectionOpen && <CardDescription>Click to add a new goal or view existing goals.</CardDescription>}
          </CardHeader>
        {isGoalsInputSectionOpen && (
            <CardContent className="pt-4">
                <fetcher.Form method="post" className="space-y-4 py-2">
                    <input type="hidden" name="intent" value={isEditingGoal ? "updateMonthlyGoal" : "addMonthlyGoal"} />
                    <input type="hidden" name="month_date" value={selectedMonth} />
                    {isEditingGoal && goalForm.id && <input type="hidden" name="goalId" value={goalForm.id} />}
                    {isEditingGoal && goalForm.id && <input type="hidden" name="is_completed" value={String(goalForm.is_completed)}/>}

                    {isEditingGoal && goalForm.id && goalForm.original_success_criteria.map((sc, index) => (
                        <React.Fragment key={sc.id ? String(sc.id) : `orig-sc-${index}-${goalForm.id || 'new'}`}> 
                        <input type="hidden" name={`success_criteria_id_${index}`} value={sc.id} />
                        <input type="hidden" name={`success_criteria_completed_${index}`} value={String(sc.is_completed)} />
                        </React.Fragment>
                    ))}

                    <div>
                        <Label htmlFor="goal-category">Category</Label>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1 pb-2">
                {Object.entries(CATEGORIES).map(([code, cat]) => (
                  <Button
                    key={code}
                    type="button"
                            variant={goalForm.category_code === code ? "default" : "outline"}
                            className={`w-14 h-14 flex flex-col items-center justify-center rounded-md border text-xs ${(goalForm.category_code === code) ? 'ring-2 ring-primary' : ''}`}
                            onClick={() => handleGoalFormChange('category_code', code as CategoryCode)}
                            style={{ minWidth: 56, minHeight: 56 }}
                  >
                            <span className="text-xl mb-0.5">{cat.icon}</span>
                            <span className="font-medium leading-tight">{cat.label}</span>
                  </Button>
                ))}
              </div>
                        <input type="hidden" name="category_code" value={goalForm.category_code} />
                  </div>
                  <div>
                        <Label htmlFor="goal-title">Title</Label>
                        <Input id="goal-title" name="title" value={goalForm.title} onChange={e => handleGoalFormChange('title', e.target.value)} required />
                    </div>
                    <div>
                        <Label htmlFor="goal-description">Description (Optional)</Label>
                        <Textarea id="goal-description" name="description" value={goalForm.description} onChange={e => handleGoalFormChange('description', e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="goal-success-criteria">Success Criteria (one per line)</Label>
                        <Textarea id="goal-success-criteria" name="success_criteria" value={goalForm.success_criteria} onChange={e => handleGoalFormChange('success_criteria', e.target.value)} placeholder="e.g., Complete Chapter 1\nDeploy to staging" className="min-h-[80px]" />
                    </div>
                    <div>
                        <Label>Weekly Breakdown</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                            {weeksInSelectedMonth.map(weekInfo => (
                                <div key={`wb-week${weekInfo.weekNumber}`}>
                                    <Label htmlFor={`wb-week${weekInfo.weekNumber}`} className="text-sm font-normal text-muted-foreground">
                                        Week {weekInfo.weekNumber} <span className="text-xs">({DateTime.fromISO(weekInfo.startDate).toFormat('MM/dd')}~{DateTime.fromISO(weekInfo.endDate).toFormat('MM/dd')})</span>
                                    </Label>
                                    <Textarea 
                                        id={`wb-week${weekInfo.weekNumber}`} 
                                        name={`weekly_breakdown_week${weekInfo.weekNumber}`}
                                        value={goalForm.weekly_breakdown[`week${weekInfo.weekNumber}`] || ""} 
                                        onChange={e => handleWeeklyBreakdownChange(weekInfo.weekNumber, e.target.value)}
                                        placeholder={`Plan for Week ${weekInfo.weekNumber}`}
                                        className="min-h-[60px]"
                                    />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={handleCancelGoalForm}>Cancel</Button>
                        <Button type="submit" disabled={fetcher.state !== 'idle' || !goalForm.title.trim()}>
                        {fetcher.state !== 'idle' && (fetcher.formData?.get('intent') === 'addMonthlyGoal' || fetcher.formData?.get('intent') === 'updateMonthlyGoal') ? "Saving..." : (isEditingGoal ? "Save Changes" : "Add Goal")}
                      </Button>
                    </div>
                </fetcher.Form>
            </CardContent>
        )}
      </Card>

      {/* Monthly Goals List - Displayed if not in input mode, or if input is open but there are goals */} 
      {(!isGoalsInputSectionOpen || monthlyGoals.length > 0) && (
        <Card className="mb-8">
            {isGoalsInputSectionOpen && (
                 <CardHeader>
                    <CardTitle>Existing Monthly Goals ({monthlyGoals.length})</CardTitle>
                     <CardDescription>Scroll down to see your currently set goals.</CardDescription>
                </CardHeader>
            )}
            {!isGoalsInputSectionOpen && monthlyGoals.length === 0 && (
                <CardContent className="py-6">
                    <p className="text-muted-foreground text-center">No goals set for this month yet. Click above to add one!</p>
                </CardContent>
            )}
            {monthlyGoals.length > 0 && (
                <CardContent className={`space-y-4 ${isGoalsInputSectionOpen ? 'pt-4' : 'pt-6'}`}>
                    {monthlyGoals.map(goal => (
                        <Card key={goal.id} className={` ${goal.is_completed ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                            <CardHeader className="pb-3 pt-4 px-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-3xl ${isValidCategoryCode(goal.category_code) ? getCategoryColor(goal.category_code) : 'text-gray-500'}`}>{CATEGORIES[goal.category_code]?.icon || '🎯'}</span>
                                        <h3 className="text-lg font-semibold">{goal.title}</h3>
                                        {goal.is_completed && <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">COMPLETED</span>}
                                    </div>
                                    <div className="flex gap-1.5">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenGoalForm(goal)}><Edit className="h-4 w-4" /></Button>
                                        <fetcher.Form method="post" style={{display: 'inline-block'}}>
                                            <input type="hidden" name="intent" value="deleteMonthlyGoal" />
                                            <input type="hidden" name="goalId" value={goal.id} />
                                            <input type="hidden" name="month_date" value={selectedMonth} />
                                            <Button variant="ghost" size="icon" type="submit" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" disabled={fetcher.state !== 'idle'}><Trash2 className="h-4 w-4" /></Button>
                                        </fetcher.Form>
                  </div>
                </div>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 space-y-3">
                                {goal.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{goal.description}</p>}
                                {goal.success_criteria.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium mb-1.5">Success Criteria:</h4>
                                        <ul className="space-y-1.5">
                                            {goal.success_criteria.map(sc => (
                                                <li key={sc.id} className="flex items-center gap-2 text-sm">
                                                    <button onClick={() => handleToggleSuccessCriterion(goal.id, sc.id)} disabled={fetcher.state !== 'idle'} className="flex-shrink-0">
                                                        {sc.is_completed ? <CheckSquare className="w-4 h-4 text-green-600" /> : <XSquare className="w-4 h-4 text-muted-foreground" />}
                                                    </button>
                                                    <span className={`${sc.is_completed ? 'line-through text-muted-foreground' : ''}`}>{sc.text}</span>
                                                </li>
                                            ))}
                                        </ul>
                </div>
              )}
                                {Object.keys(goal.weekly_breakdown).length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium mb-1.5">Weekly Breakdown:</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                        {Object.entries(goal.weekly_breakdown).map(([weekKey, breakdownText]) => (
                                            breakdownText && <p key={weekKey}><strong className="capitalize">{weekKey.replace('week','Week ')}:</strong> {breakdownText}</p>
                                        ))}
                                        </div>
            </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
          </CardContent>
            )}
        </Card>
      )}

      {/* Monthly Reflection Section - Always Expanded */}
       <div>
        <Card>
          <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Monthly Reflection & Notes</CardTitle>
                    </div>
                    <CardDescription>Reflect on your month and jot down any thoughts.</CardDescription>
          </CardHeader>
                <fetcher.Form method="post">
                    <input type="hidden" name="intent" value="upsertMonthlyReflection" />
                    <input type="hidden" name="month_date" value={selectedMonth} />
                    {monthlyReflection?.id && <input type="hidden" name="reflectionId" value={monthlyReflection.id} />}
          <CardContent>
                <Textarea
                            name="content"
                            value={reflectionFormContent}
                            onChange={e => setReflectionFormContent(e.target.value)}
                            placeholder="How was your month? What did you learn? What are you grateful for?"
                            className="min-h-[150px]"
                        />
          </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button type="submit" disabled={fetcher.state !== 'idle' && fetcher.formData?.get('intent') === 'upsertMonthlyReflection'}>
                            {fetcher.state !== 'idle' && fetcher.formData?.get('intent') === 'upsertMonthlyReflection' ? "Saving..." : <><Save className="w-4 h-4 mr-1.5" /> Save Reflection</>}
                        </Button>
                    </CardFooter>
                </fetcher.Form>
        </Card>
      </div>
    </div>
  );
}

// --- Components (like CalendarPopover) ---
interface MonthlyCalendarPopoverProps {
  currentMonthISO: string; // YYYY-MM-DD (start of month)
  onMonthChange: (newMonthISO: string) => void;
}
function MonthlyCalendarPopover({ currentMonthISO, onMonthChange }: MonthlyCalendarPopoverProps) {
    const [popoverOpen, setPopoverOpen] = useState(false);
    // Calendar component typically uses full DateTime for its internal `selectedDate`
    const initialDateForCalendar = DateTime.fromISO(currentMonthISO).isValid ? DateTime.fromISO(currentMonthISO) : DateTime.now();
  
    return (
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Select month">
            <CalendarIcon className="w-5 h-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            selectedDate={initialDateForCalendar}
            onDateChange={(newDate: DateTime) => { // Calendar likely returns a full DateTime
              const newMonthIso = newDate.startOf('month').toISODate();
              if (newMonthIso) { // Ensure newMonthIso is not null
                onMonthChange(newMonthIso); // Notify with start of month ISO
              }
              setPopoverOpen(false);
            }}
            // To make it look like a month picker, you might need custom calendar styling or a different component.
            // For now, this standard calendar will select a day, and we derive the month.
            // captionLayout="dropdown-buttons" // If you want year/month dropdowns in calendar
          />
        </PopoverContent>
      </Popover>
    );
  }

// Re-add Dialog components if they were removed
import React from "react"; // For React.Fragment
  