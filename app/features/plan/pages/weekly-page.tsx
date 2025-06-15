import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "~/common/components/ui/card";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Textarea } from "~/common/components/ui/textarea";
import { Label } from "~/common/components/ui/label";
import { Link, Form, useFetcher, redirect, useNavigate, useLoaderData } from "react-router";
import { Calendar as CalendarIcon, PlusCircle, Trash2, Edit, Check, X, Save, ChevronLeft, ChevronRight, AlertCircle, Info, CheckCircle, AlertTriangle } from "lucide-react";
import { DateTime } from "luxon";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { Switch } from "~/common/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "~/common/components/ui/popover";
import { Calendar } from "~/common/components/ui/calendar";
import { useTranslation } from "react-i18next";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "~/common/components/ui/alert-dialog";

import * as planQueries from "~/features/plan/queries";
import type { 
    WeeklyTask as DbWeeklyTask, 
    WeeklyTaskInsert, 
    WeeklyTaskUpdate,
    WeeklyNote as DbWeeklyNote,
    WeeklyNoteInsert,
    MonthlyGoalRow as DbMonthlyGoal
} from "~/features/plan/queries";
import { CATEGORIES } from "~/common/types/daily";
import type { CategoryCode, UICategory } from "~/common/types/daily";
import { CategorySelector } from "~/common/components/ui/CategorySelector";
import * as settingsQueries from "~/features/settings/queries";
import { makeSSRClient } from "~/supa-client";

// --- UI Specific Types ---
interface WeeklyTaskUI {
  id: string;
  category_code: string;
  subcode: string | null;
  comment: string;
  days: Record<string, boolean> | null; 
  is_locked: boolean;
  from_monthly_goal_id: string | null;
  created_at?: string;
  sort_order?: number;
}

interface WeeklyNoteUI {
  id: string;
  critical_success_factor: string | null;
  weekly_see: string | null;
  words_of_praise: string | null;
  weekly_goal_note: string | null;
}

interface MonthlyGoalUI extends Pick<DbMonthlyGoal, 'id' | 'category_code' | 'title' | 'weekly_breakdown'> {
}

// --- Helper Functions ---
async function getProfileId(request: Request): Promise<string> {
  const { client } = makeSSRClient(request);
  const { data: { user } } = await client.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  return user.id;
}

function getCurrentWeekStartDateISO(): string {
  return DateTime.now().startOf('week').toISODate();
}

function getWeekRangeString(startDateISO: string, locale?: string): string {
  const start = DateTime.fromISO(startDateISO).setLocale(locale || 'en');
  const end = start.endOf('week').setLocale(locale || 'en');
  return `${start.toFormat('yyyy.MM.dd (ccc)')} ~ ${end.toFormat('yyyy.MM.dd (ccc)')}`;
}

const DAYS_OF_WEEK = ["월", "화", "수", "목", "금", "토", "일"];

const isValidCategoryCode = (code: string, activeCategories: UICategory[]): boolean => {
    return activeCategories.some(c => c.code === code && c.isActive);
};

function getCategoryColor(category: UICategory | undefined, code?: string): string {
  const categoryCode = category?.code ?? code;
  if (!categoryCode) return "text-gray-500";
  
  if (category?.isCustom && category.color) {
      return category.color;
  }
  
  const map: Record<string, string> = {
    EX: "text-orange-500", BK: "text-green-600", ML: "text-orange-600", EM: "text-purple-500", ST: "text-yellow-500", WK: "text-teal-700", HB: "text-pink-500", SL: "text-cyan-600", RT: "text-blue-500"
  };
  return map[categoryCode] || "text-gray-500";
}

function sortWeeklyTasksArray(tasks: WeeklyTaskUI[]): WeeklyTaskUI[] {
  return tasks.sort((a, b) => {
    if (a.sort_order !== undefined && b.sort_order !== undefined) {
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }
    } else if (a.sort_order !== undefined) {
      return -1; 
    } else if (b.sort_order !== undefined) {
      return 1;  
    }
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeB - timeA;
  });
}

// --- Loader ---
export interface WeeklyPageLoaderData {
  profileId: string;
  currentWeekStartDate: string;
  weeklyTasks: WeeklyTaskUI[];
  weeklyNote: WeeklyNoteUI | null;
  monthlyGoalsForWeek: MonthlyGoalUI[];
  currentWeekNumberInMonth: number;
  categories: UICategory[];
}

export const loader = async ({ request }: LoaderFunctionArgs): Promise<WeeklyPageLoaderData | Response> => {
  try {
    const url = new URL(request.url);
    const weekParam = url.searchParams.get("week");
    let baseDate = weekParam ? DateTime.fromISO(weekParam) : DateTime.now();
    if (!baseDate.isValid) {
      baseDate = DateTime.now();
    }
    const currentWeekStartDate = baseDate.startOf('week').toISODate()!;

    const { client } = makeSSRClient(request);
    const profileId = await getProfileId(request);
    const currentWeekNumberInMonth = planQueries.getWeekOfMonth(currentWeekStartDate);

    const [
      dbWeeklyTasks, 
      dbWeeklyNoteData, 
      dbMonthlyGoals,
      userCategoriesData,
      userDefaultCodePreferencesData
    ] = await Promise.all([
      planQueries.getWeeklyTasksByWeek(client, { profileId, weekStartDate: currentWeekStartDate }),
      planQueries.getWeeklyNoteByWeek(client, { profileId, weekStartDate: currentWeekStartDate }),
      planQueries.getMonthlyGoalsForWeek(client, { profileId, dateInWeek: currentWeekStartDate }),
      settingsQueries.getUserCategories(client, { profileId }),
      settingsQueries.getUserDefaultCodePreferences(client, { profileId })
    ]);

    const weeklyTasks: WeeklyTaskUI[] = (dbWeeklyTasks || []).map((task: DbWeeklyTask): WeeklyTaskUI => ({
      id: task.id,
      category_code: task.category_code,
      subcode: task.subcode ?? null,
      comment: task.comment,
      days: task.days as Record<string,boolean> ?? {},
      is_locked: task.is_locked ?? false,
      from_monthly_goal_id: task.from_monthly_goal_id ?? null,
      created_at: task.created_at,
      sort_order: task.sort_order,
    }));

    const weeklyNote: WeeklyNoteUI | null = dbWeeklyNoteData ? {
      id: dbWeeklyNoteData.id,
      critical_success_factor: dbWeeklyNoteData.critical_success_factor ?? "",
      weekly_see: dbWeeklyNoteData.weekly_see ?? "",
      words_of_praise: dbWeeklyNoteData.words_of_praise ?? "",
      weekly_goal_note: dbWeeklyNoteData.weekly_goal_note ?? "",
    } : null;

    const monthlyGoalsForWeek: MonthlyGoalUI[] = (dbMonthlyGoals || []).map((goal: DbMonthlyGoal): MonthlyGoalUI => ({
      id: goal.id,
      category_code: goal.category_code,
      title: goal.title,
      weekly_breakdown: typeof goal.weekly_breakdown === 'string' 
          ? JSON.parse(goal.weekly_breakdown) 
          : goal.weekly_breakdown || {},
    }));

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
      currentWeekStartDate,
      weeklyTasks,
      weeklyNote,
      monthlyGoalsForWeek,
      currentWeekNumberInMonth,
      categories: processedCategories,
    };
  } catch (error: any) {
    if (error.message === "User not authenticated") {
      return redirect("/auth/login");
    }
    throw error;
  }
};

// --- Action ---
function dbTaskToUiTask(dbTask: DbWeeklyTask): WeeklyTaskUI {
    return {
        id: dbTask.id,
        category_code: dbTask.category_code,
        subcode: dbTask.subcode ?? null,
        comment: dbTask.comment,
        days: dbTask.days as Record<string, boolean> ?? {},
        is_locked: dbTask.is_locked ?? false,
        from_monthly_goal_id: dbTask.from_monthly_goal_id ?? null,
        created_at: dbTask.created_at,
        sort_order: dbTask.sort_order,
    };
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { client } = makeSSRClient(request);
  let profileId: string;
  try {
    profileId = await getProfileId(request);
  } catch (error: any) {
    if (error.message === "User not authenticated") {
      return redirect("/auth/login");
    }
    throw error;
  }
  
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const url = new URL(request.url);
  let baseDate = url.searchParams.get("week") ? DateTime.fromISO(url.searchParams.get("week")!) : DateTime.now();
  if (!baseDate.isValid) {
    baseDate = DateTime.now();
  }
  const currentWeekStartDate = baseDate.startOf('week').toISODate()!;

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
      case "addWeeklyTask": {
        const categoryCodeStr = formData.get("category_code") as string | null;
        const subcode = formData.get("subcode") as string | null;
        const comment = formData.get("comment") as string | null;
        if (!categoryCodeStr || !isValidCategoryCode(categoryCodeStr, activeCategoriesForAction)) return { ok: false, error: "Invalid or missing active category code.", intent };
        if (!comment || comment.trim() === "") return { ok: false, error: "Task comment is required.", intent };

        const initialDays: Record<string, boolean> = {};
        DAYS_OF_WEEK.forEach(day => initialDays[day] = false);

        const taskData: WeeklyTaskInsert = {
          profile_id: profileId,
          week_start_date: currentWeekStartDate,
          category_code: categoryCodeStr,
          subcode: subcode,
          comment: comment,
          days: initialDays, 
          is_locked: false,
        };
        const newTaskDb = await planQueries.createWeeklyTask(client, taskData);
        const newTask: WeeklyTaskUI | null = newTaskDb ? dbTaskToUiTask(newTaskDb) : null;
        return { ok: true, intent, newTask };
      }
      case "updateWeeklyTask": {
        const taskId = formData.get("taskId") as string | null;
        const categoryCodeStr = formData.get("category_code") as string | null;
        const subcode = formData.get("subcode") as string | null;
        const comment = formData.get("comment") as string | null;
        const isLocked = formData.get("is_locked") === "true";
        const daysStr = formData.get("days") as string | null; 
        if (!taskId) return { ok: false, error: "Task ID is required.", intent };
        if (categoryCodeStr && !isValidCategoryCode(categoryCodeStr, activeCategoriesForAction)) return { ok: false, error: "Invalid active category code for update.", intent};
        let daysUpdate: Record<string, boolean> | undefined = undefined;
        if (daysStr) {
            try { daysUpdate = JSON.parse(daysStr); } 
            catch (e) { return { ok: false, error: "Invalid days format.", intent}; }
        }
        const updates: Partial<WeeklyTaskUpdate> = {};
        if (categoryCodeStr) updates.category_code = categoryCodeStr;
        if (subcode !== null) updates.subcode = subcode; 
        if (comment) updates.comment = comment;
        updates.is_locked = isLocked;
        if (daysUpdate) updates.days = daysUpdate;

        const updatedTaskDb = await planQueries.updateWeeklyTask(client, { taskId, profileId, updates });
        const updatedTask: WeeklyTaskUI | null = updatedTaskDb ? dbTaskToUiTask(updatedTaskDb) : null;
        return { ok: true, intent, updatedTask, taskId };
      }
      case "deleteWeeklyTask": {
        const taskId = formData.get("taskId") as string | null;
        if (!taskId) return { ok: false, error: "Task ID is required.", intent };
        await planQueries.deleteWeeklyTask(client, { taskId, profileId });
        return { ok: true, intent, deletedTaskId: taskId };
      }
      case "addWeeklyTaskFromMonthlyGoal": {
        const monthlyGoalId = formData.get("monthlyGoalId") as string | null;
        const categoryCodeStr = formData.get("category_code") as string | null;
        const commentFromBreakdown = formData.get("comment") as string | null;
        if (!monthlyGoalId) return { ok: false, error: "Monthly Goal ID is required.", intent};
        if (!categoryCodeStr || !isValidCategoryCode(categoryCodeStr, activeCategoriesForAction)) return { ok: false, error: "Invalid active category code.", intent };
        if (!commentFromBreakdown) return { ok: false, error: "Breakdown comment is required.", intent};

        const initialDays: Record<string, boolean> = {};
        DAYS_OF_WEEK.forEach(day => initialDays[day] = false);
        
        const taskData: WeeklyTaskInsert = {
          profile_id: profileId,
          week_start_date: currentWeekStartDate,
          category_code: categoryCodeStr,
          comment: commentFromBreakdown,
          days: initialDays,
          is_locked: false,
          from_monthly_goal_id: monthlyGoalId, 
        };
        const newTaskDb = await planQueries.createWeeklyTask(client, taskData);
        const newTask: WeeklyTaskUI | null = newTaskDb ? dbTaskToUiTask(newTaskDb) : null;
        return { ok: true, intent, newTask, linkedMonthlyGoalId: monthlyGoalId };
      }
      case "upsertWeeklyGoals": {
        const criticalSuccessFactor = formData.get("criticalSuccessFactor") as string | null;
        const weeklySee = formData.get("weeklySee") as string | null;
        const wordsOfPraise = formData.get("wordsOfPraise") as string | null;
        const weeklyGoalNote = formData.get("weeklyGoalNote") as string | null;
        const existingGoalId = formData.get("existingGoalId") as string | null;

        const noteData: WeeklyNoteInsert = {
          profile_id: profileId,
          week_start_date: currentWeekStartDate,
          critical_success_factor: criticalSuccessFactor,
          weekly_see: weeklySee,
          words_of_praise: wordsOfPraise,
          weekly_goal_note: weeklyGoalNote,
        };
        if (existingGoalId && existingGoalId !== "null" && existingGoalId.trim() !== "") noteData.id = existingGoalId;

        const upsertedNoteDb = await planQueries.upsertWeeklyNote(client, noteData);
        const upsertedNote: WeeklyNoteUI | null = upsertedNoteDb ? { 
            id: upsertedNoteDb.id,
            critical_success_factor: upsertedNoteDb.critical_success_factor ?? "",
            weekly_see: upsertedNoteDb.weekly_see ?? "",
            words_of_praise: upsertedNoteDb.words_of_praise ?? "",
            weekly_goal_note: upsertedNoteDb.weekly_goal_note ?? ""
        } : null;
        return { ok: true, intent, upsertedNote };
      }
      case "addAllWeeklyTasksFromMonthlyGoals": {
        const monthlyTasksToAddString = formData.get("monthlyTasksToAdd") as string | null;
        if (!monthlyTasksToAddString) {
          return { ok: false, error: "No monthly tasks data provided.", intent };
        }
        let monthlyTasksInfo: Array<{ monthlyGoalId: string; category_code: string; comment: string; subcode?: string | null; }> = [];
        try {
          monthlyTasksInfo = JSON.parse(monthlyTasksToAddString);
        } catch (e) {
          return { ok: false, error: "Invalid monthly tasks data format.", intent };
        }

        if (!Array.isArray(monthlyTasksInfo) || monthlyTasksInfo.length === 0) {
          return { ok: false, error: "Monthly tasks data is empty or not an array.", intent };
        }

        const newTasksDb: DbWeeklyTask[] = [];
        const errors: string[] = [];
        const initialDays: Record<string, boolean> = {};
        DAYS_OF_WEEK.forEach(day => initialDays[day] = false);

        for (const taskInfo of monthlyTasksInfo) {
          if (!taskInfo.category_code || !isValidCategoryCode(taskInfo.category_code, activeCategoriesForAction)) {
            errors.push(`Invalid active category for task from monthly goal: ${taskInfo.comment}`);
            continue;
          }
          if (!taskInfo.comment || taskInfo.comment.trim() === "") {
            errors.push(`Missing comment for a task from monthly goal.`);
            continue;
          }

          const taskData: WeeklyTaskInsert = {
            profile_id: profileId,
            week_start_date: currentWeekStartDate,
            category_code: taskInfo.category_code,
            comment: taskInfo.comment,
            subcode: taskInfo.subcode ?? null,
            days: initialDays, 
            is_locked: false,
            from_monthly_goal_id: taskInfo.monthlyGoalId,
          };
          try {
            const createdTask = await planQueries.createWeeklyTask(client,  taskData);
            if (createdTask) {
              newTasksDb.push(createdTask);
            } else {
              errors.push(`Failed to create weekly task for: ${taskInfo.comment}`);
            }
          } catch (error: any) {
            errors.push(`Error creating weekly task for ${taskInfo.comment} (goalId: ${taskInfo.monthlyGoalId}): ${error.message}`);
          }
        }

        if (errors.length > 0 && newTasksDb.length === 0) { // All failed
            return { ok: false, error: `All weekly task creations from monthly goals failed. Errors: ${errors.join("; ")}`, intent };
        }

        const newTasks: WeeklyTaskUI[] = newTasksDb.map(dbTaskToUiTask);
        
        return { ok: true, intent, newTasks, partialErrors: errors.length > 0 ? errors : undefined };
      }
      default:
        return { ok: false, error: `Unknown intent: ${intent}`, intent };
    }
  } catch (error: any) {
    console.error("WeeklyPage Action error:", error);
    const intentVal = formData.get("intent") as string | null;
    return { ok: false, error: error.message || "An unexpected error occurred.", intent: intentVal || "error" };
  }
};

// --- Meta ---
export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const pageData = data as WeeklyPageLoaderData | undefined;
  const weekString = pageData?.currentWeekStartDate 
    ? getWeekRangeString(pageData.currentWeekStartDate) 
    : "Current Week";
  
  return [
    { title: `Weekly Plan (${weekString}) - StartBeyond` },
    { name: "description", content: `Plan your tasks and goals for the week: ${weekString}.` },
  ];
};

const DEFAULT_TASK_CATEGORY: CategoryCode = "WK";

export default function WeeklyPlanPage() {
  const { 
    profileId,
    currentWeekStartDate, 
    weeklyTasks: initialWeeklyTasks, 
    weeklyNote: initialWeeklyNote,
    monthlyGoalsForWeek,
    currentWeekNumberInMonth,
    categories
  } = useLoaderData<typeof loader>();

  const { t, i18n } = useTranslation();
  const editFetcher = useFetcher<Awaited<ReturnType<typeof action>>>();
  const deleteFetcher = useFetcher<Awaited<ReturnType<typeof action>>>();
  const dayToggleFetcher = useFetcher<Awaited<ReturnType<typeof action>>>();
  const lockFetcher = useFetcher<Awaited<ReturnType<typeof action>>>();
  const monthlyGoalFetcher = useFetcher<Awaited<ReturnType<typeof action>>>();
  const notesFetcher = useFetcher<Awaited<ReturnType<typeof action>>>();
  const navigate = useNavigate();

  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTaskUI[]>(() => sortWeeklyTasksArray(initialWeeklyTasks));
  const weeklyTasksRef = useRef(weeklyTasks);
  useEffect(() => {
    weeklyTasksRef.current = weeklyTasks;
  }, [weeklyTasks]);

  const [weeklyNote, setWeeklyNote] = useState<WeeklyNoteUI | null>(initialWeeklyNote);
  const [newTaskCategory, setNewTaskCategory] = useState<CategoryCode>(DEFAULT_TASK_CATEGORY);
  const [newTaskSubcode, setNewTaskSubcode] = useState("");
  const [newTaskComment, setNewTaskComment] = useState("");

  const [csfInput, setCsfInput] = useState(initialWeeklyNote?.critical_success_factor || "");
  const [seeInput, setSeeInput] = useState(initialWeeklyNote?.weekly_see || "");
  const [praiseInput, setPraiseInput] = useState(initialWeeklyNote?.words_of_praise || "");
  const [goalNoteInput, setGoalNoteInput] = useState(initialWeeklyNote?.weekly_goal_note || "");

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskData, setEditTaskData] = useState<Partial<WeeklyTaskUI> | null>(null);
  
  const [pageAlert, setPageAlert] = useState<{ type: 'error' | 'warning' | 'info' | 'success'; message: string; } | null>(null);
  
  const [isMonthlyGoalsCollapsed, setIsMonthlyGoalsCollapsed] = useState(monthlyGoalsForWeek.length === 0);
  const [addedMonthlyGoalTaskIds, setAddedMonthlyGoalTaskIds] = useState<Set<string>>(() => 
    new Set(initialWeeklyTasks.filter(t => !!t.from_monthly_goal_id).map(t => t.from_monthly_goal_id!))
  );
  
  useEffect(() => {
    setWeeklyTasks(sortWeeklyTasksArray(initialWeeklyTasks));
    setWeeklyNote(initialWeeklyNote);
    setCsfInput(initialWeeklyNote?.critical_success_factor || "");
    setSeeInput(initialWeeklyNote?.weekly_see || "");
    setPraiseInput(initialWeeklyNote?.words_of_praise || "");
    setGoalNoteInput(initialWeeklyNote?.weekly_goal_note || "");
    setAddedMonthlyGoalTaskIds(new Set(initialWeeklyTasks.filter(t => !!t.from_monthly_goal_id).map(t => t.from_monthly_goal_id!)));
    setIsMonthlyGoalsCollapsed(monthlyGoalsForWeek.length === 0);
    setPageAlert(null);
  }, [initialWeeklyTasks, initialWeeklyNote, monthlyGoalsForWeek]);

  // Edit/Add Fetcher Effect
  useEffect(() => {
    if (editFetcher.data && editFetcher.state === "idle") {
        const res = editFetcher.data;
        if (res instanceof Response) return;
        if (res.ok) {
            if (res.intent === "addWeeklyTask" && res.newTask) {
                const newTaskToAdd = res.newTask as WeeklyTaskUI;
                setWeeklyTasks(prevTasks => {
                    if (prevTasks.some(t => t.id === newTaskToAdd.id)) return prevTasks;
                    return sortWeeklyTasksArray([newTaskToAdd, ...prevTasks]);
                });
                setNewTaskCategory(DEFAULT_TASK_CATEGORY);
                setNewTaskSubcode("");
                setNewTaskComment("");
            } else if (res.intent === "updateWeeklyTask" && res.taskId && res.updatedTask) {
                setWeeklyTasks(prev => sortWeeklyTasksArray(prev.map(t => t.id === res.taskId ? res.updatedTask as WeeklyTaskUI : t)));
                setEditingTaskId(null);
                setEditTaskData(null);
            }
        } else if (res.error) {
            console.error("Edit/Add Task Error:", res.error, "Intent:", res.intent);
            setPageAlert({ type: 'error', message: `Error (${res.intent || 'Unknown'}): ${res.error}` });
        }
    }
  }, [editFetcher.data, editFetcher.state]);

  // Delete Fetcher Effect
  useEffect(() => {
      if (deleteFetcher.data && deleteFetcher.state === "idle") {
          const res = deleteFetcher.data;
          if (res instanceof Response) return;
          if (res.ok) {
              if (res.intent === "deleteWeeklyTask" && res.deletedTaskId) {
                  const taskToDelete = weeklyTasksRef.current.find(t => t.id === res.deletedTaskId);
                  setWeeklyTasks(prev => sortWeeklyTasksArray(prev.filter(t => t.id !== res.deletedTaskId)));
                  if (taskToDelete?.from_monthly_goal_id) {
                      setAddedMonthlyGoalTaskIds(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(taskToDelete.from_monthly_goal_id!);
                          return newSet;
                      });
                  }
              }
          } else if (res.error) {
              console.error("Delete Task Error:", res.error, "Intent:", res.intent);
              setPageAlert({ type: 'error', message: `Error (${res.intent || 'Unknown'}): ${res.error}` });
          }
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteFetcher.data, deleteFetcher.state]);

  // Day Toggle Fetcher Effect
  useEffect(() => {
      if (dayToggleFetcher.data && dayToggleFetcher.state === "idle") {
          const res = dayToggleFetcher.data;
          if (res instanceof Response) return;
          if (res.ok && res.intent === "updateWeeklyTask" && res.updatedTask) {
              setWeeklyTasks(prev => sortWeeklyTasksArray(prev.map(t => t.id === res.taskId ? res.updatedTask as WeeklyTaskUI : t)));
          } else if (res.error) {
              console.error("Day Toggle Error:", res.error, "Intent:", res.intent);
              setPageAlert({ type: 'error', message: `Error (${res.intent || 'Unknown'}): ${res.error}` });
          }
      }
  }, [dayToggleFetcher.data, dayToggleFetcher.state]);

  // Lock Fetcher Effect
  useEffect(() => {
      if (lockFetcher.data && lockFetcher.state === "idle") {
          const res = lockFetcher.data;
          if (res instanceof Response) return;
          if (res.ok && res.intent === "updateWeeklyTask" && res.updatedTask) {
              setWeeklyTasks(prev => sortWeeklyTasksArray(prev.map(t => t.id === res.taskId ? res.updatedTask as WeeklyTaskUI : t)));
          } else if (res.error) {
              console.error("Lock Toggle Error:", res.error, "Intent:", res.intent);
              setPageAlert({ type: 'error', message: `Error (${res.intent || 'Unknown'}): ${res.error}` });
          }
      }
  }, [lockFetcher.data, lockFetcher.state]);

  // Monthly Goal Fetcher Effect
  useEffect(() => {
      if (monthlyGoalFetcher.data && monthlyGoalFetcher.state === "idle") {
          const res = monthlyGoalFetcher.data;
          if (res instanceof Response) return;
          if (res.ok) {
              if (res.intent === "addWeeklyTaskFromMonthlyGoal" && res.newTask && res.linkedMonthlyGoalId) {
                  setWeeklyTasks(prev => sortWeeklyTasksArray([res.newTask as WeeklyTaskUI, ...prev.filter(t => t.id !== (res.newTask as WeeklyTaskUI).id)]));
                  setAddedMonthlyGoalTaskIds(prev => new Set(prev).add(res.linkedMonthlyGoalId!));
              } else if (res.intent === "addAllWeeklyTasksFromMonthlyGoals" && res.newTasks) {
                  const newTasks = res.newTasks as WeeklyTaskUI[];
                  if (newTasks.length > 0) {
                      setWeeklyTasks(prevTasks => {
                          const newTaskIds = new Set(newTasks.map(t => t.id));
                          const filteredPrevTasks = prevTasks.filter(t => !newTaskIds.has(t.id));
                          return sortWeeklyTasksArray([...newTasks, ...filteredPrevTasks]);
                      });
                      setAddedMonthlyGoalTaskIds(prevIds => {
                          const newGoalIdsToAdd = new Set(newTasks.map(t => t.from_monthly_goal_id).filter((id): id is string => id !== null));
                          return new Set([...prevIds, ...newGoalIdsToAdd]);
                      });
                  }
                  if (res.partialErrors && res.partialErrors.length > 0) {
                      setPageAlert({ type: 'warning', message: `Some weekly tasks could not be added: ${res.partialErrors.join("; ")}` });
                  }
              }
          } else if (res.error) {
              console.error("Monthly Goal Action Error:", res.error, "Intent:", res.intent);
              setPageAlert({ type: 'error', message: `Error (${res.intent || 'Unknown'}): ${res.error}` });
          }
      }
  }, [monthlyGoalFetcher.data, monthlyGoalFetcher.state]);

  // Notes Fetcher Effect
  useEffect(() => {
      if (notesFetcher.data && notesFetcher.state === "idle") {
          const res = notesFetcher.data;
          if (res instanceof Response) return;
          if (res.ok && res.intent === "upsertWeeklyGoals" && res.upsertedNote) {
              setWeeklyNote(res.upsertedNote as WeeklyNoteUI);
              setPageAlert({ type: 'success', message: t('weekly_page.notes_saved_success')});
          } else if (res.error) {
              console.error("Notes Save Error:", res.error, "Intent:", res.intent);
              setPageAlert({ type: 'error', message: `Error (${res.intent || 'Unknown'}): ${res.error}` });
          }
      }
  }, [notesFetcher.data, notesFetcher.state, t]);

  const handleWeekNavigate = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' 
        ? DateTime.fromISO(currentWeekStartDate).minus({ weeks: 1 }) 
        : DateTime.fromISO(currentWeekStartDate).plus({ weeks: 1 });
    navigate(`/plan/weekly?week=${newDate.toISODate()}`);
  };

  const handleDateSelect = (date: DateTime | undefined) => {
      if (!date) return;
      const newWeekStartDate = date.startOf('week').toISODate();
      navigate(`/plan/weekly?week=${newWeekStartDate}`);
  };

  function handleNewTaskCategorySelect(code: string) {
    const selectedCat = categories.find(c => c.code === code);
    if (selectedCat && selectedCat.isActive) {
      setNewTaskCategory(code as CategoryCode);
    } else {
      console.warn("Attempted to select an invalid or inactive category for new task:", code);
    }
  }
  
  function handleEditTaskCategorySelect(code: string) {
    const selectedCat = categories.find(c => c.code === code);
    if(editTaskData && selectedCat && selectedCat.isActive) {
       setEditTaskData(prev => ({...(prev || {} as Partial<WeeklyTaskUI>), category_code: code}));
    } else {
      console.warn("Attempted to select an invalid or inactive category for editing task:", code);
    }
  }

  function handleStartEdit(task: WeeklyTaskUI) {
    setEditingTaskId(task.id);
    setEditTaskData({ ...task });
  }

  function handleCancelEdit() {
    setEditingTaskId(null);
    setEditTaskData(null);
  }
  
  function handleToggleTaskDay(taskId: string, day: string) {
    const taskToUpdate = weeklyTasks.find(t => t.id === taskId);
    if (!taskToUpdate || taskToUpdate.is_locked) return;

    const currentDays = taskToUpdate.days || {};
    const newDays = { ...currentDays, [day]: !currentDays[day] };
    const formData = new FormData();
    formData.append("intent", "updateWeeklyTask");
    formData.append("taskId", taskId);
    formData.append("days", JSON.stringify(newDays));
    formData.append("is_locked", String(taskToUpdate.is_locked || false));
    formData.append("category_code", taskToUpdate.category_code);
    formData.append("comment", taskToUpdate.comment || "");
    if(taskToUpdate.subcode) formData.append("subcode", taskToUpdate.subcode);

    dayToggleFetcher.submit(formData, { method: "post" });
  }

  function handleToggleTaskLock(taskId: string, newLockState: boolean) {
    const taskToUpdate = weeklyTasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;

    const formData = new FormData();
    formData.append("intent", "updateWeeklyTask");
    formData.append("taskId", taskId);
    formData.append("is_locked", String(newLockState));
    formData.append("category_code", taskToUpdate.category_code);
    formData.append("comment", taskToUpdate.comment || ""); 
    if(taskToUpdate.subcode) formData.append("subcode", taskToUpdate.subcode);
    formData.append("days", JSON.stringify(taskToUpdate.days ?? {}));
    lockFetcher.submit(formData, { method: "post" });
  }

  function handleAddAllMonthlyTasks() {
    const tasksToAddFromGoals: Array<{ monthlyGoalId: string; category_code: string; comment: string; subcode?: string | null; }> = [];
    monthlyGoalsForWeek.forEach(goal => {
      if (goal.weekly_breakdown && typeof goal.weekly_breakdown === 'object' && !Array.isArray(goal.weekly_breakdown)) {
        const weekKey = `week${currentWeekNumberInMonth}` as keyof typeof goal.weekly_breakdown;
        const breakdownObject = goal.weekly_breakdown as { [key: string]: string | undefined };
        const breakdownText = breakdownObject[weekKey];

        if (breakdownText && typeof breakdownText === 'string' && !addedMonthlyGoalTaskIds.has(goal.id)) {
          tasksToAddFromGoals.push({
            monthlyGoalId: goal.id,
            category_code: goal.category_code, 
            comment: breakdownText,
          });
        }
      }
    });

    if (tasksToAddFromGoals.length === 0) {
      setPageAlert({ type: 'info', message: t('weekly_page.all_monthly_added_alert') });
      return;
    }

    const formData = new FormData();
    formData.append("intent", "addAllWeeklyTasksFromMonthlyGoals");
    formData.append("monthlyTasksToAdd", JSON.stringify(tasksToAddFromGoals));
    monthlyGoalFetcher.submit(formData, { method: "post" });
  }
  
  const allMonthlyTasksForTheWeekAdded = monthlyGoalsForWeek.length > 0 && monthlyGoalsForWeek.every(mg => addedMonthlyGoalTaskIds.has(mg.id));

  const anyFetcherSubmitting =
    editFetcher.state !== 'idle' ||
    deleteFetcher.state !== 'idle' ||
    dayToggleFetcher.state !== 'idle' ||
    lockFetcher.state !== 'idle' ||
    monthlyGoalFetcher.state !== 'idle' ||
    notesFetcher.state !== 'idle';

  if (!i18n.isInitialized) {
    return null;
  }
  
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="font-bold text-3xl flex-shrink-0">{t('weekly_page.title')}</h1>
        <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="icon" onClick={() => handleWeekNavigate('prev')}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className="w-full sm:w-[280px] justify-start text-left font-normal"
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {getWeekRangeString(currentWeekStartDate, i18n.language)}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                        selectedDate={DateTime.fromISO(currentWeekStartDate)}
                        onDateChange={handleDateSelect}
                    />
                </PopoverContent>
            </Popover>
            <Button variant="outline" size="icon" onClick={() => handleWeekNavigate('next')}>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
        <Button asChild variant="ghost">
            <Link to="/plan/daily/tomorrow">{t('weekly_page.to_tomorrows_plan')}</Link>
        </Button>
      </div>

      <div className="mb-8">
        {isMonthlyGoalsCollapsed ? (
             <Card>
                <CardHeader className="cursor-pointer py-4" onClick={() => setIsMonthlyGoalsCollapsed(false)}>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{t('weekly_page.monthly_goals_title', { count: monthlyGoalsForWeek.length })}</CardTitle>
                        <Button variant="ghost" size="sm">{t('weekly_page.expand')}</Button>
                    </div>
                </CardHeader>
            </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                        <CardTitle>{t('weekly_page.monthly_goals_focus', { week: currentWeekNumberInMonth })}</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setIsMonthlyGoalsCollapsed(true)}>{t('weekly_page.collapse')}</Button>
                </div>
                    <CardDescription>{t('weekly_page.monthly_goals_desc')}</CardDescription>
            </CardHeader>
                {monthlyGoalsForWeek.length > 0 ? (
                    <>
                        <CardContent className="space-y-3">
                        {monthlyGoalsForWeek.map(goal => {
                            const dynamicGoalCategoryInfo = categories.find(c => c.code === goal.category_code);
                            const breakdownKey = `week${currentWeekNumberInMonth}` as keyof typeof goal.weekly_breakdown;
                            const weeklyBreakdown = goal.weekly_breakdown as Record<string, string> | undefined;
                            const taskDescription = weeklyBreakdown?.[breakdownKey] || "N/A for this week";
                            const isAdded = addedMonthlyGoalTaskIds.has(goal.id);
                            return (
                            <div key={goal.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                                <span className={`text-2xl ${dynamicGoalCategoryInfo ? getCategoryColor(dynamicGoalCategoryInfo, goal.category_code) : getCategoryColor(undefined, goal.category_code)}`}>{dynamicGoalCategoryInfo?.icon || '❓'}</span>
                      <div>
                        <div className="font-medium">{goal.title}</div>
                                    <div className="text-sm text-muted-foreground">{taskDescription}</div>
                        </div>
                      </div>
                                <monthlyGoalFetcher.Form method="post">
                                    <input type="hidden" name="intent" value="addWeeklyTaskFromMonthlyGoal" />
                                    <input type="hidden" name="monthlyGoalId" value={goal.id} />
                                    <input type="hidden" name="category_code" value={goal.category_code} />
                                    <input type="hidden" name="comment" value={taskDescription} />
                    <Button
                                        type="submit"
                                        variant={isAdded ? "secondary" : "outline"}
                      size="sm"
                                        disabled={isAdded || anyFetcherSubmitting || taskDescription === "N/A for this week" || !taskDescription.trim()}
                    >
                                        {isAdded ? t('weekly_page.added') : (monthlyGoalFetcher.state !== 'idle' && monthlyGoalFetcher.formData?.get('monthlyGoalId') === goal.id ? t('weekly_page.adding') : t('weekly_page.add_as_weekly_task'))}
                    </Button>
                                </monthlyGoalFetcher.Form>
                  </div>
                            );
                        })}
                        </CardContent>
                        <CardFooter className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddAllMonthlyTasks}
                                disabled={allMonthlyTasksForTheWeekAdded || anyFetcherSubmitting}
                  >
                                {monthlyGoalFetcher.state !== 'idle' && monthlyGoalFetcher.formData?.get('intent') === 'addAllWeeklyTasksFromMonthlyGoals' ? t('weekly_page.adding_all') : t('weekly_page.add_all_from_monthly')}
                  </Button>
                        </CardFooter>
                    </>
                ) : (
                    <CardContent>
                        <p className="text-muted-foreground text-center py-4">{t('weekly_page.no_monthly_goals', { week: currentWeekNumberInMonth })}</p>
            </CardContent>
                )}
          </Card>
        )}
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{editingTaskId ? t('weekly_page.edit_task') : t('weekly_page.add_task')}</CardTitle>
        </CardHeader>
          <CardContent>
          <editFetcher.Form method="post" onSubmit={(e) => {
            if(editingTaskId && editTaskData) {
                const formData = new FormData();
                formData.set("intent", "updateWeeklyTask");
                formData.set("taskId", editingTaskId);
                formData.set("category_code", editTaskData.category_code || DEFAULT_TASK_CATEGORY);
                formData.set("subcode", editTaskData.subcode || "");
                formData.set("comment", editTaskData.comment || "");
                formData.set("is_locked", String(editTaskData.is_locked || false));
                formData.set("days", JSON.stringify(editTaskData.days || {}));
                editFetcher.submit(formData, { method: "post" });
                e.preventDefault(); 
            }
          }}>
            <input type="hidden" name="intent" value={editingTaskId ? "" : "addWeeklyTask"} /> 
            {editingTaskId && <input type="hidden" name="taskId" value={editingTaskId} />}
            
            <CategorySelector 
              categories={categories.filter(c => c.isActive)} 
              selectedCategoryCode={editingTaskId && editTaskData?.category_code ? editTaskData.category_code : newTaskCategory}
              onSelectCategory={editingTaskId ? handleEditTaskCategorySelect : handleNewTaskCategorySelect}
              disabled={anyFetcherSubmitting}
              instanceId="weekly-page-selector"
            />
            
            {!editingTaskId && <input type="hidden" name="category_code" value={newTaskCategory} />}

            <div className="flex flex-col sm:flex-row gap-2 mb-3 mt-2">
                <Input
                name="subcode"
                placeholder={t('weekly_page.subcode_placeholder')}
                value={editingTaskId && editTaskData ? (editTaskData.subcode || "") : newTaskSubcode}
                onChange={e => editingTaskId && editTaskData ? setEditTaskData(d => ({...(d || {} as Partial<WeeklyTaskUI>), subcode: e.target.value})) : setNewTaskSubcode(e.target.value)}
                className="sm:w-1/3"
                disabled={anyFetcherSubmitting}
                />
                <Input
                name="comment"
                placeholder={t('weekly_page.task_desc_placeholder')}
                value={editingTaskId && editTaskData ? (editTaskData.comment || "") : newTaskComment}
                onChange={e => editingTaskId && editTaskData ? setEditTaskData(d => ({...(d || {} as Partial<WeeklyTaskUI>), comment: e.target.value})) : setNewTaskComment(e.target.value)}
                  className="flex-1"
                required
                disabled={anyFetcherSubmitting}
              />
              {editingTaskId && editTaskData ? (
                <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={anyFetcherSubmitting || !editTaskData.comment?.trim()}>
                        <Save className="w-4 h-4 mr-1" /> {t('weekly_page.save_changes')}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit} disabled={anyFetcherSubmitting}>
                        <X className="w-4 h-4 mr-1" /> {t('weekly_page.cancel')}
                    </Button>
                </div>
              ) : (
                <Button type="submit" className="whitespace-nowrap" disabled={anyFetcherSubmitting || !newTaskComment.trim()}>
                    {editFetcher.state !== 'idle' && editFetcher.formData?.get("intent") === "addWeeklyTask" ? t('weekly_page.adding') : <><PlusCircle className="w-4 h-4 mr-1" /> {t('weekly_page.add_task_button')}</>}
                </Button>
              )}
              </div>
          </editFetcher.Form>

          <div className="mt-6 overflow-x-auto">
            {weeklyTasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">{t('weekly_page.no_tasks_yet')}</p>
            ) : (
            <table className="min-w-full w-full text-sm">
                <thead>
                <tr className="border-b">
                  <th className="py-2 px-1 text-left">{t('weekly_page.table_header_task')}</th>
                  {DAYS_OF_WEEK.map(day => (
                    <th key={day} className="py-2 px-1 text-center w-px whitespace-nowrap">{day}</th>
                  ))}
                  <th className="py-2 px-1 text-center w-px whitespace-nowrap">{t('weekly_page.table_header_lock')}</th>
                  <th className="py-2 px-1 text-center w-px whitespace-nowrap">{t('weekly_page.table_header_actions')}</th>
                  </tr>
                </thead>
                <tbody>
                {weeklyTasks.map((task) => {
                  const dynamicCategoryInfo = categories.find(c => c.code === task.category_code);
                  const isEditingThis = editingTaskId === task.id;
                  return (
                    <tr key={task.id} className={`border-b ${isEditingThis ? 'bg-amber-50 dark:bg-amber-900/30' : ''}`}>
                      <td className="py-2 px-1">
                        <div className="flex items-center gap-2">
                            <span className={`text-xl flex-shrink-0 ${dynamicCategoryInfo ? getCategoryColor(dynamicCategoryInfo, task.category_code) : getCategoryColor(undefined, task.category_code)}`}>{dynamicCategoryInfo?.icon || '❓'}</span>
                            <div className="min-w-0">
                                <span className="font-medium break-keep">{task.comment}</span>
                                {task.subcode && <span className="text-xs text-muted-foreground block"> ({task.subcode})</span>}
                            </div>
                          </div>
                      </td>
                      {DAYS_OF_WEEK.map(day => (
                        <td key={day} className="py-2 px-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleTaskDay(task.id, day)}
                            className={`w-7 h-7 rounded-full text-xs transition-colors ${
                              task.days?.[day]
                                ? 'bg-primary text-primary-foreground font-semibold'
                                : 'bg-muted hover:bg-muted/80'
                            } ${task.is_locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={task.is_locked || anyFetcherSubmitting}
                          >
                            {day}
                          </button>
                        </td>
                      ))}
                      <td className="py-2 px-1 text-center">
                        <Switch
                            checked={task.is_locked || false}
                            onCheckedChange={(newCheckedState) => handleToggleTaskLock(task.id, newCheckedState)}
                            disabled={anyFetcherSubmitting}
                            aria-label={t('weekly_page.lock_task_aria')}
                        />
                      </td>
                      <td className="py-2 px-1 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button variant="outline" size="icon" onClick={() => handleStartEdit(task)} disabled={isEditingThis || anyFetcherSubmitting} className="h-7 w-7">
                            <Edit className="h-3.5 w-3.5" />
                              </Button>
                          <deleteFetcher.Form method="post" style={{display: 'inline-block'}}>
                            <input type="hidden" name="intent" value="deleteWeeklyTask" />
                            <input type="hidden" name="taskId" value={task.id} />
                            <Button variant="destructive" size="icon" type="submit" disabled={anyFetcherSubmitting} className="h-7 w-7">
                              <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                          </deleteFetcher.Form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            )}
            </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
          <CardTitle>{t('weekly_page.reflections_title')}</CardTitle>
          <CardDescription>{t('weekly_page.reflections_desc')}</CardDescription>
            </CardHeader>
        <notesFetcher.Form method="post">
            <input type="hidden" name="intent" value="upsertWeeklyGoals" />
            {weeklyNote && weeklyNote.id && <input type="hidden" name="existingGoalId" value={weeklyNote.id} />}
            <CardContent className="space-y-6">
            <div>
                <Label htmlFor="csf" className="block text-base font-medium mb-1">{t('weekly_page.csf_label')}</Label>
                <Textarea id="csf" name="criticalSuccessFactor" value={csfInput} onChange={e => setCsfInput(e.target.value)} placeholder={t('weekly_page.csf_placeholder')} className="min-h-[80px]" />
            </div>
            <div>
                <Label htmlFor="weeklySee" className="block text-base font-medium mb-1">{t('weekly_page.see_label')}</Label>
                <Textarea id="weeklySee" name="weeklySee" value={seeInput} onChange={e => setSeeInput(e.target.value)} placeholder={t('weekly_page.see_placeholder')} className="min-h-[80px]" />
            </div>
            <div>
                <Label htmlFor="praise" className="block text-base font-medium mb-1">{t('weekly_page.praise_label')}</Label>
                <Textarea id="praise" name="wordsOfPraise" value={praiseInput} onChange={e => setPraiseInput(e.target.value)} placeholder={t('weekly_page.praise_placeholder')} className="min-h-[80px]" />
                </div>
            <div>
                <Label htmlFor="goalNote" className="block text-base font-medium mb-1">{t('weekly_page.goal_note_label')}</Label>
                <Textarea id="goalNote" name="weeklyGoalNote" value={goalNoteInput} onChange={e => setGoalNoteInput(e.target.value)} placeholder={t('weekly_page.goal_note_placeholder')} className="min-h-[100px]" />
                </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button type="submit" disabled={anyFetcherSubmitting}>
                    {notesFetcher.state !== 'idle' ? t('weekly_page.saving_notes') : <><Save className="w-4 h-4 mr-1" /> {t('weekly_page.save_notes_button')}</> }
                </Button>
            </CardFooter>
        </notesFetcher.Form>
          </Card>
    </div>
  );
} 