import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "~/common/components/ui/card";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Textarea } from "~/common/components/ui/textarea";
import { Label } from "~/common/components/ui/label";
import { Link, Form, useFetcher } from "react-router";
import { Calendar as CalendarIcon, PlusCircle, Trash2, Edit, Check, X, Save } from "lucide-react";
import { DateTime } from "luxon";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { Switch } from "~/common/components/ui/switch";

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
import type { UserCategory as DbUserCategory, UserDefaultCodePreference as DbUserDefaultCodePreference } from "~/features/settings/queries";

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
async function getProfileId(_request?: Request): Promise<string> {
  // return "ef20d66d-ed8a-4a14-ab2b-b7ff26f2643c"; 
  return "fd64e09d-e590-4545-8fd4-ae7b2b784e4a";
}

function getCurrentWeekStartDateISO(): string {
  return DateTime.now().startOf('week').toISODate();
}

function getWeekRangeString(startDateISO: string): string {
  const start = DateTime.fromISO(startDateISO);
  const end = start.endOf('week');
  return `${start.toFormat('yyyy.MM.dd (ccc)')} ~ ${end.toFormat('yyyy.MM.dd (ccc)')}`;
}

const DAYS_OF_WEEK = ["월", "화", "수", "목", "금", "토", "일"];

const isValidCategoryCode = (code: string, activeCategories: UICategory[]): boolean => {
    return activeCategories.some(c => c.code === code && c.isActive);
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

export const loader = async ({ request }: LoaderFunctionArgs): Promise<WeeklyPageLoaderData> => {
  const profileId = await getProfileId(request);
  const currentWeekStartDate = getCurrentWeekStartDateISO();
  const currentWeekNumberInMonth = planQueries.getWeekOfMonth(currentWeekStartDate);

  const [
    dbWeeklyTasks, 
    dbWeeklyNoteData, 
    dbMonthlyGoals,
    userCategoriesData,
    userDefaultCodePreferencesData
  ] = await Promise.all([
    planQueries.getWeeklyTasksByWeek({ profileId, weekStartDate: currentWeekStartDate }),
    planQueries.getWeeklyNoteByWeek({ profileId, weekStartDate: currentWeekStartDate }),
    planQueries.getMonthlyGoalsForWeek({ profileId, dateInWeek: currentWeekStartDate }),
    settingsQueries.getUserCategories({ profileId }),
    settingsQueries.getUserDefaultCodePreferences({ profileId })
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
  const profileId = await getProfileId(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const currentWeekStartDate = getCurrentWeekStartDateISO();

  const activeCategoriesForAction = await (async () => {
    const [userCategoriesDb, defaultPreferencesDb] = await Promise.all([
        settingsQueries.getUserCategories({ profileId }),
        settingsQueries.getUserDefaultCodePreferences({ profileId })
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
        const newTaskDb = await planQueries.createWeeklyTask(taskData);
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

        const updatedTaskDb = await planQueries.updateWeeklyTask({ taskId, profileId, updates });
        const updatedTask: WeeklyTaskUI | null = updatedTaskDb ? dbTaskToUiTask(updatedTaskDb) : null;
        return { ok: true, intent, updatedTask, taskId };
      }
      case "deleteWeeklyTask": {
        const taskId = formData.get("taskId") as string | null;
        if (!taskId) return { ok: false, error: "Task ID is required.", intent };
        await planQueries.deleteWeeklyTask({ taskId, profileId });
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
        const newTaskDb = await planQueries.createWeeklyTask(taskData);
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

        const upsertedNoteDb = await planQueries.upsertWeeklyNote(noteData);
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
            const createdTask = await planQueries.createWeeklyTask(taskData);
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

interface WeeklyPlanPageProps {
    loaderData: WeeklyPageLoaderData;
}

export default function WeeklyPlanPage({ loaderData }: WeeklyPlanPageProps) {
  const { 
    profileId,
    currentWeekStartDate, 
    weeklyTasks: initialWeeklyTasks, 
    weeklyNote: initialWeeklyNote,
    monthlyGoalsForWeek,
    currentWeekNumberInMonth,
    categories
  } = loaderData;

  const fetcher = useFetcher<typeof action>();
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTaskUI[]>(() => sortWeeklyTasksArray(initialWeeklyTasks));
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
  }, [initialWeeklyTasks, initialWeeklyNote, monthlyGoalsForWeek]);

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      const res = fetcher.data;
      if (res.ok) {
        if ((res.intent === "addWeeklyTask" || res.intent === "addWeeklyTaskFromMonthlyGoal") && res.newTask) {
          const newTaskToAdd = res.newTask as WeeklyTaskUI;
          setWeeklyTasks(prevTasks => {
            if (prevTasks.some(t => t.id === newTaskToAdd.id)) {
              return prevTasks; // Already exists, no change, no re-sort needed
            }
            return sortWeeklyTasksArray([newTaskToAdd, ...prevTasks]);
          });

          if (res.intent === "addWeeklyTask") {
            setNewTaskCategory(DEFAULT_TASK_CATEGORY);
    setNewTaskSubcode("");
    setNewTaskComment("");
          } else if (res.intent === "addWeeklyTaskFromMonthlyGoal" && res.linkedMonthlyGoalId) {
             setAddedMonthlyGoalTaskIds(prev => new Set(prev).add(res.linkedMonthlyGoalId!));
          }
        } else if (res.intent === "updateWeeklyTask" && res.taskId) {
          if (res.updatedTask) {
            setWeeklyTasks(prev => sortWeeklyTasksArray(prev.map(t => t.id === res.taskId ? res.updatedTask as WeeklyTaskUI : t)));
          } else {
            console.log(`UI: Task ${res.taskId} was not updated in the list as it was not found or not changed in DB.`);
          }
          setEditingTaskId(null);
          setEditTaskData(null);
        } else if (res.intent === "deleteWeeklyTask" && res.deletedTaskId) {
          setWeeklyTasks(prevWeeklyTasks => {
            return sortWeeklyTasksArray(prevWeeklyTasks.filter(t => t.id !== res.deletedTaskId));
          });
          setAddedMonthlyGoalTaskIds(prevIds => {
            const newSet = new Set(prevIds);
            newSet.delete(res.deletedTaskId);
            return newSet;
          });
        } else if (res.intent === "upsertWeeklyGoals" && res.upsertedNote) {
          setWeeklyNote(res.upsertedNote as WeeklyNoteUI);
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
            alert(`Some weekly tasks from monthly goals could not be added: ${res.partialErrors.join("; ")}`);
          }
        }
      } else if (res.error) {
        console.error("Weekly Page Action Error:", res.error, "Intent:", res.intent);
        alert(`Error (${res.intent || 'Unknown'}): ${res.error}`);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.data, fetcher.state]);

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

    fetcher.submit(formData, { method: "post" });
  }

  function handleToggleTaskLock(taskId: string) {
    const taskToUpdate = weeklyTasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;

    const formData = new FormData();
    formData.append("intent", "updateWeeklyTask");
    formData.append("taskId", taskId);
    formData.append("is_locked", String(!taskToUpdate.is_locked));
    formData.append("category_code", taskToUpdate.category_code);
    formData.append("comment", taskToUpdate.comment || ""); 
    if(taskToUpdate.subcode) formData.append("subcode", taskToUpdate.subcode);
    formData.append("days", JSON.stringify(taskToUpdate.days ?? {}));
    fetcher.submit(formData, { method: "post" });
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
      alert("All relevant monthly goal tasks for this week have already been added or there are no tasks to add.");
      return;
    }

    const formData = new FormData();
    formData.append("intent", "addAllWeeklyTasksFromMonthlyGoals");
    formData.append("monthlyTasksToAdd", JSON.stringify(tasksToAddFromGoals));
    fetcher.submit(formData, { method: "post" });
  }
  
  const allMonthlyTasksForTheWeekAdded = monthlyGoalsForWeek.length > 0 && monthlyGoalsForWeek.every(mg => addedMonthlyGoalTaskIds.has(mg.id));

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 pt-16 bg-background min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-bold text-3xl">Weekly Plan</h1>
        <div className="text-gray-500 text-lg">{getWeekRangeString(currentWeekStartDate)}</div>
        <Button asChild variant="ghost" size="sm">
            <Link to="/plan/tomorrow">To Tomorrow's Plan</Link>
        </Button>
      </div>

      <div className="mb-8">
        {isMonthlyGoalsCollapsed ? (
             <Card>
                <CardHeader className="cursor-pointer py-4" onClick={() => setIsMonthlyGoalsCollapsed(false)}>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Monthly Goals for this Week ({monthlyGoalsForWeek.length})</CardTitle>
                        <Button variant="ghost" size="sm">펴기</Button>
                    </div>
                </CardHeader>
            </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                        <CardTitle>Monthly Goals: Week {currentWeekNumberInMonth} Focus</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setIsMonthlyGoalsCollapsed(true)}>접기</Button>
                </div>
                    <CardDescription>Tasks derived from your monthly goals for the current week.</CardDescription>
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
                                <fetcher.Form method="post">
                                    <input type="hidden" name="intent" value="addWeeklyTaskFromMonthlyGoal" />
                                    <input type="hidden" name="monthlyGoalId" value={goal.id} />
                                    <input type="hidden" name="category_code" value={goal.category_code} />
                                    <input type="hidden" name="comment" value={taskDescription} />
                    <Button
                                        type="submit"
                                        variant={isAdded ? "secondary" : "outline"}
                      size="sm"
                                        disabled={isAdded || fetcher.state !== 'idle' || taskDescription === "N/A for this week" || !taskDescription.trim()}
                    >
                                        {isAdded ? "Added" : (fetcher.state !== 'idle' && fetcher.formData?.get('monthlyGoalId') === goal.id ? "Adding..." : "Add as Weekly Task")}
                    </Button>
                                </fetcher.Form>
                  </div>
                            );
                        })}
                        </CardContent>
                        <CardFooter className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddAllMonthlyTasks}
                                disabled={allMonthlyTasksForTheWeekAdded || fetcher.state !== 'idle'}
                  >
                                {fetcher.state !== 'idle' && fetcher.formData?.get('intent') === 'addWeeklyTaskFromMonthlyGoal' && !fetcher.formData?.has('monthlyGoalId') ? "Adding All..." : "Add All Relevant to Weekly Tasks"}
                  </Button>
                        </CardFooter>
                    </>
                ) : (
                    <CardContent>
                        <p className="text-muted-foreground text-center py-4">No monthly goals set for this month, or no specific tasks for week {currentWeekNumberInMonth}.</p>
            </CardContent>
                )}
          </Card>
        )}
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{editingTaskId ? "Edit Weekly Task" : "Add Weekly Task"}</CardTitle>
        </CardHeader>
          <CardContent>
          <fetcher.Form method="post" onSubmit={(e) => {
            if(editingTaskId && editTaskData) {
                const formData = new FormData();
                formData.set("intent", "updateWeeklyTask");
                formData.set("taskId", editingTaskId);
                formData.set("category_code", editTaskData.category_code || DEFAULT_TASK_CATEGORY);
                formData.set("subcode", editTaskData.subcode || "");
                formData.set("comment", editTaskData.comment || "");
                formData.set("is_locked", String(editTaskData.is_locked || false));
                formData.set("days", JSON.stringify(editTaskData.days || {}));
                fetcher.submit(formData, { method: "post" });
                e.preventDefault(); 
            }
          }}>
            <input type="hidden" name="intent" value={editingTaskId ? "" : "addWeeklyTask"} /> 
            {editingTaskId && <input type="hidden" name="taskId" value={editingTaskId} />}
            
            <CategorySelector 
              categories={categories.filter(c => c.isActive)} 
              selectedCategoryCode={editingTaskId && editTaskData?.category_code ? editTaskData.category_code : newTaskCategory}
              onSelectCategory={editingTaskId ? handleEditTaskCategorySelect : handleNewTaskCategorySelect}
              disabled={fetcher.state !== 'idle'}
              instanceId="weekly-page-selector"
            />
            
            {!editingTaskId && <input type="hidden" name="category_code" value={newTaskCategory} />}

            <div className="flex flex-col sm:flex-row gap-2 mb-3 mt-2">
                <Input
                name="subcode"
                placeholder="Subcode (optional)"
                value={editingTaskId && editTaskData ? (editTaskData.subcode || "") : newTaskSubcode}
                onChange={e => editingTaskId && editTaskData ? setEditTaskData(d => ({...(d || {} as Partial<WeeklyTaskUI>), subcode: e.target.value})) : setNewTaskSubcode(e.target.value)}
                className="sm:w-1/3"
                disabled={fetcher.state !== 'idle'}
                />
                <Input
                name="comment"
                placeholder="Task description (e.g., Weekly Report Prep)"
                value={editingTaskId && editTaskData ? (editTaskData.comment || "") : newTaskComment}
                onChange={e => editingTaskId && editTaskData ? setEditTaskData(d => ({...(d || {} as Partial<WeeklyTaskUI>), comment: e.target.value})) : setNewTaskComment(e.target.value)}
                  className="flex-1"
                required
                disabled={fetcher.state !== 'idle'}
              />
              {editingTaskId && editTaskData ? (
                <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={fetcher.state !== 'idle' || !editTaskData.comment?.trim()}>
                        <Save className="w-4 h-4 mr-1" /> Save Changes
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit} disabled={fetcher.state !== 'idle'}>
                        <X className="w-4 h-4 mr-1" /> Cancel
                    </Button>
                </div>
              ) : (
                <Button type="submit" disabled={fetcher.state !== 'idle' || !newTaskComment.trim()}>
                    {fetcher.state !== 'idle' && fetcher.formData?.get("intent") === "addWeeklyTask" ? "Adding..." : <><PlusCircle className="w-4 h-4 mr-1" /> Add Task</>}
                </Button>
              )}
              </div>
          </fetcher.Form>

          <div className="mt-6 overflow-x-auto">
            {weeklyTasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">No weekly tasks planned yet. Add some!</p>
            ) : (
            <table className="min-w-full text-sm">
                <thead>
                <tr className="border-b">
                  <th className="py-2 px-1 text-left">Task</th>
                  {DAYS_OF_WEEK.map(day => (
                    <th key={day} className="py-2 px-1 text-center w-10">{day}</th>
                  ))}
                  <th className="py-2 px-1 text-center">Lock</th>
                  <th className="py-2 px-1 text-center">Actions</th>
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
                            <span className={`text-xl ${dynamicCategoryInfo ? getCategoryColor(dynamicCategoryInfo, task.category_code) : getCategoryColor(undefined, task.category_code)}`}>{dynamicCategoryInfo?.icon || '❓'}</span>
                            <div>
                                <span className="font-medium">{task.comment}</span>
                                {task.subcode && <span className="text-xs text-muted-foreground block"> ({task.subcode})</span>}
                            </div>
                          </div>
                      </td>
                      {DAYS_OF_WEEK.map(day => (
                        <td key={day} className="py-2 px-1 text-center">
                          <input
                            type="checkbox"
                            checked={task.days?.[day] || false}
                            onChange={() => handleToggleTaskDay(task.id, day)}
                            className={`form-checkbox h-4 w-4 text-primary rounded accent-primary ${task.is_locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            disabled={task.is_locked || fetcher.state !== 'idle'}
                          />
                        </td>
                      ))}
                      <td className="py-2 px-1 text-center">
                        <Switch
                            checked={task.is_locked || false}
                            onCheckedChange={() => handleToggleTaskLock(task.id)}
                            disabled={fetcher.state !== 'idle'}
                            aria-label="Lock Task"
                        />
                      </td>
                      <td className="py-2 px-1 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button variant="outline" size="icon" onClick={() => handleStartEdit(task)} disabled={isEditingThis || fetcher.state !== 'idle'} className="h-7 w-7">
                            <Edit className="h-3.5 w-3.5" />
                              </Button>
                          <fetcher.Form method="post" style={{display: 'inline-block'}}>
                            <input type="hidden" name="intent" value="deleteWeeklyTask" />
                            <input type="hidden" name="taskId" value={task.id} />
                            <Button variant="destructive" size="icon" type="submit" disabled={fetcher.state !== 'idle' && fetcher.formData?.get('intent') === 'deleteWeeklyTask' && fetcher.formData?.get('taskId') === task.id } className="h-7 w-7">
                              <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                          </fetcher.Form>
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
          <CardTitle>Weekly Reflections & Notes</CardTitle>
          <CardDescription>Set your focus and reflect on your week.</CardDescription>
            </CardHeader>
        <fetcher.Form method="post">
            <input type="hidden" name="intent" value="upsertWeeklyGoals" />
            {weeklyNote && weeklyNote.id && <input type="hidden" name="existingGoalId" value={weeklyNote.id} />}
            <CardContent className="space-y-6">
            <div>
                <Label htmlFor="csf" className="block text-base font-medium mb-1">Critical Success Factor (CSF)</Label>
                <Textarea id="csf" name="criticalSuccessFactor" value={csfInput} onChange={e => setCsfInput(e.target.value)} placeholder="이번 주 핵심 성공 요소를 정의하세요 (예: 프로젝트 A 마일스톤 달성)" className="min-h-[80px]" />
            </div>
            <div>
                <Label htmlFor="weeklySee" className="block text-base font-medium mb-1">Weekly See (관찰)</Label>
                <Textarea id="weeklySee" name="weeklySee" value={seeInput} onChange={e => setSeeInput(e.target.value)} placeholder="이번 주에 관찰하거나 집중해서 볼 내용 (예: 팀원들의 진행 상황)" className="min-h-[80px]" />
            </div>
            <div>
                <Label htmlFor="praise" className="block text-base font-medium mb-1">Words of Praise (칭찬과 격려)</Label>
                <Textarea id="praise" name="wordsOfPraise" value={praiseInput} onChange={e => setPraiseInput(e.target.value)} placeholder="스스로에게 또는 타인에게 해주고 싶은 칭찬 (예: 어려운 문제 해결에 대한 자부심)" className="min-h-[80px]" />
                </div>
            <div>
                <Label htmlFor="goalNote" className="block text-base font-medium mb-1">Note for Weekly Goals (주간 목표 메모)</Label>
                <Textarea id="goalNote" name="weeklyGoalNote" value={goalNoteInput} onChange={e => setGoalNoteInput(e.target.value)} placeholder="주간 목표 달성을 위한 추가적인 생각이나 다짐 (예: 매일 아침 30분 집중 시간 확보)" className="min-h-[100px]" />
                </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button type="submit" disabled={fetcher.state !== 'idle' && fetcher.formData?.get('intent') === 'upsertWeeklyGoals'}>
                    {fetcher.state !== 'idle' && fetcher.formData?.get('intent') === 'upsertWeeklyGoals' ? "Saving Notes..." : <><Save className="w-4 h-4 mr-1" /> Save Weekly Notes</> }
                </Button>
            </CardFooter>
        </fetcher.Form>
          </Card>
    </div>
  );
} 