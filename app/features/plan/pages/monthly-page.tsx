import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "~/common/components/ui/card";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Textarea } from "~/common/components/ui/textarea";
import { Label } from "~/common/components/ui/label";
import { CATEGORIES } from "~/common/types/daily";
import type { CategoryCode, UICategory } from "~/common/types/daily";
import { Link, useFetcher, useNavigate } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { Calendar as CalendarIcon, PlusCircle, Trash2, Edit, Save, CheckSquare, XSquare, AlertCircle, Info, CheckCircle, AlertTriangle, X } from "lucide-react";
import { DateTime } from "luxon";
import { Calendar } from "~/common/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "~/common/components/ui/popover";
import { Switch } from "~/common/components/ui/switch";
import { CategorySelector } from "~/common/components/ui/CategorySelector";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "~/common/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "~/common/components/ui/alert-dialog";

import * as planQueries from "~/features/plan/queries";
import type { 
    MonthlyGoalRow as DbMonthlyGoal, 
    MonthlyGoalInsert, 
    MonthlyGoalUpdate,
    MonthlyReflection as DbMonthlyReflection,
    MonthlyReflectionInsert
} from "~/features/plan/queries";
import * as settingsQueries from "~/features/settings/queries";
import type { UserCategory as DbUserCategory, UserDefaultCodePreference as DbUserDefaultCodePreference } from "~/features/settings/queries";
import { makeSSRClient } from "~/supa-client";
import { getRequiredProfileId } from "~/features/users/utils";

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
function getCurrentMonthStartDateISO(dateParam?: string | null): string {
  if (dateParam) {
    const dt = DateTime.fromISO(dateParam);
    if (dt.isValid) return dt.startOf('month').toISODate();
  }
  return DateTime.now().startOf('month').toISODate();
}

function getMonthName(dateISO: string, t: any, i18n: any): string {
    const dt = DateTime.fromISO(dateISO).setLocale(i18n.language);
    if (i18n.language === 'ko') {
        return dt.toFormat("yyyy년 M월");
    }
    return dt.toFormat("MMMM yyyy");
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

const isValidCategoryCode = (code: string, activeCategories: UICategory[]): code is CategoryCode => {
    // Ensure it's a valid CategoryCode and is active
    return activeCategories.some(c => c.code === code && c.isActive) && Object.keys(CATEGORIES).includes(code);
};

function getCategoryColor(category: UICategory | undefined, code?: string): string {
  if (category) {
    if (category.isCustom && category.color) {
      return category.color;
    }
    const map: Record<string, string> = {
      EX: "text-orange-500", BK: "text-green-600", ML: "text-orange-600", EM: "text-purple-500", ST: "text-yellow-500", WK: "text-teal-700", HB: "text-pink-500", SL: "text-cyan-600", RT: "text-blue-500"
    };
    return map[category.code] || "text-gray-500";
  }
  if (code) {
     const map: Record<string, string> = {
      EX: "text-orange-500", BK: "text-green-600", ML: "text-orange-600", EM: "text-purple-500", ST: "text-yellow-500", WK: "text-teal-700", HB: "text-pink-500", SL: "text-cyan-600", RT: "text-blue-500"
    };
    return map[code] || "text-gray-500";
  }
  return "text-gray-500";
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
  categories: UICategory[];
}

export const loader = async ({ request }: LoaderFunctionArgs): Promise<MonthlyPageLoaderData> => {
  const { client } = makeSSRClient(request);
  const profileId = await getRequiredProfileId(request);
  const url = new URL(request.url);
  const monthParam = url.searchParams.get("month");
  const selectedMonth = getCurrentMonthStartDateISO(monthParam);
  const weeksInSelectedMonth = getWeeksInMonth(selectedMonth);

  const [
    dbGoals, 
    dbReflection,
    userCategoriesData,
    userDefaultCodePreferencesData
  ] = await Promise.all([
    planQueries.getMonthlyGoalsByMonth(client, { profileId, monthDate: selectedMonth }),
    planQueries.getMonthlyReflectionByMonth(client, { profileId, monthDate: selectedMonth }),
    settingsQueries.getUserCategories(client, { profileId }),
    settingsQueries.getUserDefaultCodePreferences(client, { profileId })
  ]);

  const monthlyGoals: MonthlyGoalUI[] = (dbGoals || []).map(dbGoalToUIGoal);
  const monthlyReflection: MonthlyReflectionUI | null = dbReflection ? dbReflectionToUIReflection(dbReflection) : null;

  // Process categories (Copied and adapted from tomorrow-page.tsx / weekly-page.tsx)
  const processedCategories: UICategory[] = [];
  const defaultCategoryPreferences = new Map(
    (userDefaultCodePreferencesData || []).map(pref => [pref.default_category_code, pref.is_active])
  );

  for (const catCodeKey in CATEGORIES) {
    if (Object.prototype.hasOwnProperty.call(CATEGORIES, catCodeKey)) {
      const baseCategory = CATEGORIES[catCodeKey as CategoryCode];
      const isActivePreference = defaultCategoryPreferences.get(baseCategory.code);
      const isActive = isActivePreference === undefined ? true : isActivePreference;

      processedCategories.push({
        code: baseCategory.code,
        label: baseCategory.label,
        icon: baseCategory.icon,
        isCustom: false,
        isActive: isActive,
        hasDuration: baseCategory.hasDuration,
        sort_order: baseCategory.sort_order !== undefined ? baseCategory.sort_order : 999,
      });
    }
  }

  (userCategoriesData || []).forEach(userCat => {
    const existingIndex = processedCategories.findIndex(c => c.code === userCat.code && !c.isCustom);
    if (existingIndex !== -1) {
        if(userCat.is_active) {
            processedCategories.splice(existingIndex, 1);
        } else {
            return;
        }
    }
    
    if (!processedCategories.find(c => c.code === userCat.code && c.isCustom)) {
        processedCategories.push({
            code: userCat.code,
            label: userCat.label,
            icon: userCat.icon || '📝', 
            color: userCat.color || undefined,
            isCustom: true,
            isActive: userCat.is_active,
            hasDuration: true, 
            sort_order: userCat.sort_order !== null && userCat.sort_order !== undefined ? userCat.sort_order : 1000,
        });
    }
  });
  
  processedCategories.sort((a, b) => {
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    if (a.isCustom && !b.isCustom) return -1;
    if (!a.isCustom && b.isCustom) return 1;
    return (a.sort_order ?? 999) - (b.sort_order ?? 999);
  });

  return {
    profileId,
    selectedMonth,
    monthlyGoals,
    monthlyReflection,
    weeksInSelectedMonth,
    categories: processedCategories,
  };
};

// --- Action ---
export const action = async ({ request }: ActionFunctionArgs) => {
  const { client } = makeSSRClient(request);
  const profileId = await getRequiredProfileId(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const selectedMonth = formData.get("month_date") as string || getCurrentMonthStartDateISO(); // Ensure month_date is passed
  const weeksInMonthForAction = getWeeksInMonth(selectedMonth); // Get weeks for action context

  // Fetch active categories for action validation (Copied from other pages)
  const activeCategoriesForAction = await (async () => {
    const [userCategoriesDb, defaultPreferencesDb] = await Promise.all([
        settingsQueries.getUserCategories(client, { profileId }),
        settingsQueries.getUserDefaultCodePreferences(client, { profileId })
    ]);
    const categoriesToValidate: UICategory[] = [];
    const defaultPrefsMap = new Map((defaultPreferencesDb || []).map(p => [p.default_category_code, p.is_active]));
    for (const key in CATEGORIES) {
        const base = CATEGORIES[key as CategoryCode];
        const isActivePref = defaultPrefsMap.get(base.code);
        if (isActivePref === undefined || isActivePref) {
            categoriesToValidate.push({ 
                code: base.code,
                label: base.label,
                icon: base.icon,
                isCustom: false, 
                isActive: true, 
                hasDuration: base.hasDuration,
                sort_order: base.sort_order 
            });
        }
    }
    (userCategoriesDb || []).forEach(uc => {
        if (uc.is_active) { 
            if (!categoriesToValidate.find(c => c.code === uc.code && !c.isCustom && c.isActive)) {
                 categoriesToValidate.push({
                    code: uc.code,
                    label: uc.label,
                    icon: uc.icon || '📝',
                    color: uc.color || undefined,
                    isCustom: true,
                    isActive: true,
                    hasDuration: true, 
                    sort_order: uc.sort_order !== null && uc.sort_order !== undefined ? uc.sort_order : 1000,
                });
  }
        }
    });
    return categoriesToValidate.filter(c => c.isActive);
  })();

  try {
    switch (intent) {
      case "addMonthlyGoal":
      case "updateMonthlyGoal": {
        const title = formData.get("title") as string | null;
        const categoryCodeStr = formData.get("category_code") as string | null;
        if (!title || title.trim() === "") return { ok: false, error: "Goal title is required.", intent };
        if (!categoryCodeStr || !isValidCategoryCode(categoryCodeStr, activeCategoriesForAction)) return { ok: false, error: "Valid active category is required.", intent };
        
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
          const newGoalDb = await planQueries.createMonthlyGoal(client, goalData);
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
          const updatedGoalDb = await planQueries.updateMonthlyGoal(client, { goalId, profileId, updates });
          const updatedGoal = updatedGoalDb ? dbGoalToUIGoal(updatedGoalDb) : null;
          return { ok: true, intent, updatedGoal, goalId };
        }
      }
      case "deleteMonthlyGoal": {
        const goalId = formData.get("goalId") as string | null;
        if (!goalId) return { ok: false, error: "Goal ID is required for deletion.", intent };
        await planQueries.deleteMonthlyGoal(client, { goalId, profileId });
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
        const updatedGoalDb = await planQueries.updateMonthlyGoal(client, { goalId, profileId, updates });
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
        
        const upsertedReflectionDb = await planQueries.upsertMonthlyReflection(client, reflectionData);
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
  const monthStr = pageData?.selectedMonth ? getMonthName(pageData.selectedMonth, {}, {}) : "Monthly";
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
    weeksInSelectedMonth,
    categories
  } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  if (!i18n.isInitialized) {
    return null; // Or a loading spinner
  }
  
  const [selectedMonth, setSelectedMonth] = useState<string>(initialSelectedMonth);
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoalUI[]>(initialMonthlyGoals);
  const [monthlyReflection, setMonthlyReflection] = useState<MonthlyReflectionUI | null>(initialMonthlyReflection);

  const [goalForm, setGoalForm] = useState<GoalFormState>(initialGoalFormState(weeksInSelectedMonth));
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  
  const [reflectionFormContent, setReflectionFormContent] = useState(initialMonthlyReflection?.content || "");

  const [pageAlert, setPageAlert] = useState<{ type: 'error' | 'warning' | 'info' | 'success'; message: string; } | null>(null);

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
    setPageAlert(null);
  }, [initialSelectedMonth, initialMonthlyGoals, initialMonthlyReflection, weeksInSelectedMonth]);

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      const res = fetcher.data;
      if (res.ok) {
        if ((res.intent === "addMonthlyGoal" && res.newGoal)) {
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
          setPageAlert({ type: 'success', message: t('monthly_page.reflection_saved_success')});
        }
      } else if (res.error) {
        console.error("Monthly Page Action Error:", res.error, "Intent:", res.intent);
        setPageAlert({ type: 'error', message: `Error (${res.intent || 'Unknown'}): ${res.error}`});
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
  
  const alertIcons = {
    error: <AlertCircle className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
    info: <Info className="h-4 w-4" />,
    success: <CheckCircle className="h-4 w-4" />,
  };
  
  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-4 pt-16 sm:px-6 lg:px-8 bg-background min-h-screen">
      {pageAlert && (
        <AlertDialog open={!!pageAlert} onOpenChange={() => setPageAlert(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{pageAlert.type.charAt(0).toUpperCase() + pageAlert.type.slice(1)}</AlertDialogTitle>
              <AlertDialogDescription>{pageAlert.message}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setPageAlert(null)}>{i18n.language === 'ko' ? '확인' : 'Confirm'}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-3xl">{t('monthly_page.title')}</h1>
          <MonthlyCalendarPopover 
            currentMonthISO={selectedMonth} 
            onMonthChange={(newMonthISO) => {
                navigate(`/plan/monthly?month=${newMonthISO}`);
            }}
          />
        </div>
        <div className="text-gray-500 text-lg order-last sm:order-none sm:mx-auto">{getMonthName(selectedMonth, t, i18n)}</div>
        <Button asChild className="sm:ml-2" variant="ghost" size="sm">
            <Link to="/plan/weekly">{t('monthly_page.to_weekly_plan')}</Link>
        </Button>
      </div>

      {/* Goal Form - Inline Collapsible Section */}
      <Card className="mb-8">
        <CardHeader className="cursor-pointer" onClick={() => { if (!isGoalsInputSectionOpen) handleOpenGoalForm(); else handleCancelGoalForm(); }}>
            <div className="flex items-center justify-between">
                <CardTitle>{isGoalsInputSectionOpen ? (isEditingGoal ? t('monthly_page.edit_goal') : t('monthly_page.add_goal')) : t('monthly_page.monthly_goals_count', { count: monthlyGoals.length })}</CardTitle>
                <Button variant="ghost" size="sm">
                    {isGoalsInputSectionOpen ? t('monthly_page.cancel') : (monthlyGoals.length === 0 ? t('monthly_page.add_goal') : t('monthly_page.show_add_goal'))}
                </Button>
            </div>
            {!isGoalsInputSectionOpen && <CardDescription>{t('monthly_page.click_to_add_goal')}</CardDescription>}
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
                        <Label htmlFor="goal-category">{t('monthly_page.category')}</Label>
                        <CategorySelector
                          categories={categories.filter(c => c.isActive)}
                          selectedCategoryCode={goalForm.category_code}
                          onSelectCategory={(code) => handleGoalFormChange('category_code', code as CategoryCode)}
                          disabled={fetcher.state !== 'idle'}
                          instanceId="monthly-page-selector"
                    />
                        <input type="hidden" name="category_code" value={goalForm.category_code} />
                  </div>
                  <div>
                        <Label htmlFor="goal-title">{t('monthly_page.goal_title')}</Label>
                        <Input id="goal-title" name="title" value={goalForm.title} onChange={e => handleGoalFormChange('title', e.target.value)} required />
                    </div>
                    <div>
                        <Label htmlFor="goal-description">{t('monthly_page.description_optional')}</Label>
                        <Textarea id="goal-description" name="description" value={goalForm.description} onChange={e => handleGoalFormChange('description', e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="goal-success-criteria">{t('monthly_page.success_criteria')}</Label>
                        <Textarea id="goal-success-criteria" name="success_criteria" value={goalForm.success_criteria} onChange={e => handleGoalFormChange('success_criteria', e.target.value)} placeholder={t('monthly_page.success_criteria_placeholder')} className="min-h-[80px]" />
                    </div>
                    <div>
                        <Label>{t('monthly_page.weekly_breakdown')}</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                            {weeksInSelectedMonth.map(weekInfo => (
                                <div key={`wb-week${weekInfo.weekNumber}`}>
                                    <Label htmlFor={`wb-week${weekInfo.weekNumber}`} className="text-sm font-normal text-muted-foreground">
                                        {t('monthly_page.week_with_range', { week: weekInfo.weekNumber, startDate: DateTime.fromISO(weekInfo.startDate).toFormat('MM/dd'), endDate: DateTime.fromISO(weekInfo.endDate).toFormat('MM/dd') })}
                                    </Label>
                                    <Textarea 
                                        id={`wb-week${weekInfo.weekNumber}`} 
                                        name={`weekly_breakdown_week${weekInfo.weekNumber}`}
                                        value={goalForm.weekly_breakdown[`week${weekInfo.weekNumber}`] || ""} 
                                        onChange={e => handleWeeklyBreakdownChange(weekInfo.weekNumber, e.target.value)}
                                        placeholder={t('monthly_page.plan_for_week', { week: weekInfo.weekNumber })}
                                        className="min-h-[60px]"
                                    />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={handleCancelGoalForm}>{t('monthly_page.cancel')}</Button>
                        <Button type="submit" disabled={fetcher.state !== 'idle' || !goalForm.title.trim()}>
                        {fetcher.state !== 'idle' && (fetcher.formData?.get('intent') === 'addMonthlyGoal' || fetcher.formData?.get('intent') === 'updateMonthlyGoal') ? t('monthly_page.saving') : (isEditingGoal ? t('monthly_page.save_changes') : t('monthly_page.add_goal'))}
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
                    <CardTitle>{t('monthly_page.monthly_goals_count', { count: monthlyGoals.length })}</CardTitle>
                     <CardDescription>{t('monthly_page.click_to_add_goal')}</CardDescription>
                </CardHeader>
            )}
            {!isGoalsInputSectionOpen && monthlyGoals.length === 0 && (
                <CardContent className="py-6">
                    <p className="text-muted-foreground text-center">{t('monthly_page.no_goals_yet')}</p>
                </CardContent>
            )}
            {monthlyGoals.length > 0 && (
                <CardContent className={`space-y-4 ${isGoalsInputSectionOpen ? 'pt-4' : 'pt-6'}`}>
                    {monthlyGoals.map(goal => (
                        <Card key={goal.id} className={` ${goal.is_completed ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                            <CardHeader className="pb-3 pt-4 px-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-3 flex-shrink min-w-0">
                                        <span className={`text-3xl flex-shrink-0 ${isValidCategoryCode(goal.category_code, categories) ? getCategoryColor(categories.find(c=>c.code === goal.category_code), goal.category_code) : 'text-gray-500'}`}>{categories.find(c=>c.code === goal.category_code)?.icon || '🎯'}</span>
                                        <div className="flex-grow min-w-0">
                                            <h3 className="text-lg font-semibold break-words">{goal.title}</h3>
                                            {goal.is_completed && <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full mt-1 inline-block">{t('monthly_page.completed_badge')}</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-1.5 flex-shrink-0">
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
                                {goal.description && <p className="text-sm text-muted-foreground whitespace-pre-line break-words">{goal.description}</p>}
                                {goal.success_criteria.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium mb-1.5">{t('monthly_page.success_criteria_heading')}</h4>
                                        <ul className="space-y-1.5">
                                            {goal.success_criteria.map(sc => (
                                                <li key={sc.id} className="flex items-start gap-2 text-sm">
                                                    <button onClick={() => handleToggleSuccessCriterion(goal.id, sc.id)} disabled={fetcher.state !== 'idle'} className="flex-shrink-0 mt-0.5">
                                                        {sc.is_completed ? <CheckSquare className="w-4 h-4 text-green-600" /> : <XSquare className="w-4 h-4 text-muted-foreground" />}
                                                    </button>
                                                    <span className={`break-words ${sc.is_completed ? 'line-through text-muted-foreground' : ''}`}>{sc.text}</span>
                                                </li>
                                            ))}
                                        </ul>
                </div>
              )}
                                {Object.keys(goal.weekly_breakdown).length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium mb-1.5">{t('monthly_page.weekly_breakdown_heading')}</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                        {Object.entries(goal.weekly_breakdown).map(([weekKey, breakdownText]) => (
                                            breakdownText && <p key={weekKey} className="break-words"><strong className="capitalize">{t('monthly_page.week_label', { week: weekKey.replace('week', '') })}:</strong> {breakdownText}</p>
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
                      <CardTitle>{t('monthly_page.reflection_title')}</CardTitle>
                    </div>
                    <CardDescription>{t('monthly_page.reflection_description')}</CardDescription>
          </CardHeader>
                <fetcher.Form method="post" key={monthlyReflection?.id || 'new-reflection-form'}>
                    <input type="hidden" name="intent" value="upsertMonthlyReflection" />
                    <input type="hidden" name="month_date" value={selectedMonth} />
                    {monthlyReflection?.id && <input type="hidden" name="reflectionId" value={monthlyReflection.id} />}
          <CardContent>
                <Textarea
                            name="content"
                            value={reflectionFormContent}
                            onChange={e => setReflectionFormContent(e.target.value)}
                            placeholder={t('monthly_page.reflection_placeholder')}
                            className="min-h-[150px]"
                        />
          </CardContent>
                    <CardFooter className="flex justify-between items-center">
                        <div>
                          {monthlyReflection && (monthlyReflection.updated_at || monthlyReflection.created_at) && (
                            <p className="text-xs text-muted-foreground">
                              {t('monthly_page.last_saved')}: {DateTime.fromISO(monthlyReflection.updated_at || monthlyReflection.created_at!).toLocaleString(DateTime.DATETIME_SHORT)}
                            </p>
                          )}
                        </div>
                        <Button type="submit" disabled={fetcher.state !== 'idle' && fetcher.formData?.get('intent') === 'upsertMonthlyReflection'}>
                            {fetcher.state !== 'idle' && fetcher.formData?.get('intent') === 'upsertMonthlyReflection' ? t('monthly_page.saving') : <><Save className="w-4 h-4 mr-1.5" /> {t('monthly_page.save_reflection')}</>}
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