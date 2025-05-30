import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "~/common/components/ui/card";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Textarea } from "~/common/components/ui/textarea";
import { CATEGORIES, type CategoryCode, type DailyPlan } from "~/common/types/daily";
// import type { Route } from "~/common/types";
import { Link, Form, useFetcher } from "react-router";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { DateTime } from "luxon";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";

import * as planQueries from "~/features/plan/queries";
import type { DailyPlan as DbDailyPlan, DailyPlanInsert, DailyPlanUpdate, WeeklyTask as DbWeeklyTask } from "~/features/plan/queries";

// UI-specific types
interface DailyPlanUI extends Omit<DbDailyPlan, 'plan_date' | 'duration_minutes' | 'created_at' | 'updated_at' | 'is_completed' | 'category_code'> {
  id: string; // ensure id is present
  date: string;
  duration?: number;
  comment: string | null;
  subcode: string | null;
  category_code: string; // Keep as string for flexibility, validate with isValidCategoryCode
  is_completed?: boolean;
  created_at?: string;
  updated_at?: string;
  profile_id: string; // Added from DbDailyPlan
  linked_weekly_task_id: string | null; // Added from DbDailyPlan
}

interface WeeklyTaskUI extends Pick<DbWeeklyTask, 'id' | 'category_code' | 'comment' | 'subcode'> {
  days: Record<string, boolean> | null; // Added to display other scheduled days
}

// Helper Functions
async function getProfileId(_request?: Request): Promise<string> { // Optional request
  return "ef20d66d-ed8a-4a14-ab2b-b7ff26f2643c";
}

function getTomorrowDateISO(): string {
  return DateTime.now().plus({ days: 1 }).toISODate();
}

// Returns '월', '화', ...
function getDayString(date: DateTime): string {
  // In Supabase, weekly_tasks.days is stored as JSON: {"월": true, "화": false, ...}
  // We need to match this key format.
  // Luxon's weekday: 1 (Monday) to 7 (Sunday)
  const dayMap = ['월', '화', '수', '목', '금', '토', '일'];
  return dayMap[date.weekday - 1];
}

const MAX_MINUTES_PER_DAY = 60 * 24; // Copied from daily-page for duration validation

// Copied from daily-page.tsx - consider moving to a common util if used in more places
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


// Loader
export interface TomorrowPageLoaderData {
  tomorrowDate: string;
  tomorrowPlans: DailyPlanUI[];
  relevantWeeklyTasks: WeeklyTaskUI[];
  profileId: string;
}

export const loader = async ({ request }: LoaderFunctionArgs): Promise<TomorrowPageLoaderData> => {
  const profileId = await getProfileId(request);
  const tomorrowDate = getTomorrowDateISO();
  const tomorrowDateTime = DateTime.fromISO(tomorrowDate);
  const currentWeekStartDate = tomorrowDateTime.startOf('week').toISODate();
  const tomorrowDayString = getDayString(tomorrowDateTime);

  const [tomorrowPlansData, weeklyTasksData] = await Promise.all([
    planQueries.getDailyPlansByDate({ profileId, date: tomorrowDate }),
    planQueries.getWeeklyTasksByWeek({ profileId, weekStartDate: currentWeekStartDate! })
  ]);

  const tomorrowPlans: DailyPlanUI[] = (tomorrowPlansData || []).map(p => ({
    id: p.id,
    profile_id: p.profile_id,
    date: p.plan_date,
    duration: p.duration_minutes ?? undefined,
    comment: p.comment ?? null,
    subcode: p.subcode ?? null,
    category_code: p.category_code, // Remains string
    is_completed: p.is_completed ?? false,
    linked_weekly_task_id: p.linked_weekly_task_id ?? null,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }));

  const relevantWeeklyTasks: WeeklyTaskUI[] = (weeklyTasksData || [])
    .filter(task => {
        const isScheduledForTomorrow = task.days && 
                                     typeof task.days === 'object' && 
                                     !Array.isArray(task.days) && 
                                     (task.days as Record<string, boolean>)[tomorrowDayString];
        return isScheduledForTomorrow && task.is_locked === true;
    })
    .map(task => ({
      id: task.id,
      comment: task.comment,
      subcode: task.subcode ?? null,
      category_code: task.category_code,
      days: task.days as Record<string, boolean> ?? null, // Pass days through
    }));

  return {
    tomorrowDate,
    tomorrowPlans,
    relevantWeeklyTasks,
    profileId,
  };
};

// Action
export const action = async ({ request }: ActionFunctionArgs) => {
  const profileId = await getProfileId(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const tomorrowDate = getTomorrowDateISO();

  try {
    switch (intent) {
      case "addPlan": {
        const categoryCodeStr = formData.get("category_code") as string | null;
        const durationStr = formData.get("duration") as string | null;
        const comment = formData.get("comment") as string | null;
        const subcode = formData.get("subcode") as string | null;

        if (!categoryCodeStr || !isValidCategoryCode(categoryCodeStr)) {
          return { ok: false, error: "Invalid or missing category code.", intent };
        }
        if (!comment || comment.trim() === "") { 
            return { ok: false, error: "Plan details/comment is required.", intent };
        }
        let durationMinutes: number | undefined = undefined;
        if (durationStr && durationStr.trim() !== "") {
            durationMinutes = parseInt(durationStr, 10);
            if (isNaN(durationMinutes) || durationMinutes < 0 || durationMinutes > MAX_MINUTES_PER_DAY) {
                 return { ok: false, error: "Invalid duration value.", intent };
            }
        }
        
        const planData: DailyPlanInsert = {
          profile_id: profileId,
          plan_date: tomorrowDate,
          category_code: categoryCodeStr,
          duration_minutes: durationMinutes,
          comment: comment,
          subcode: subcode,
          is_completed: false, 
        };
        const newPlanDb = await planQueries.createDailyPlan(planData);
        // Convert DbDailyPlan to DailyPlanUI before returning
        const newPlan: DailyPlanUI | null = newPlanDb ? {
            id: newPlanDb.id,
            profile_id: newPlanDb.profile_id,
            date: newPlanDb.plan_date,
            category_code: newPlanDb.category_code,
            subcode: newPlanDb.subcode ?? null,
            duration: newPlanDb.duration_minutes ?? undefined,
            comment: newPlanDb.comment ?? null,
            is_completed: newPlanDb.is_completed ?? false,
            linked_weekly_task_id: newPlanDb.linked_weekly_task_id ?? null,
            created_at: newPlanDb.created_at,
            updated_at: newPlanDb.updated_at
        } : null;
        return { ok: true, intent, newPlan };
      }
      case "addPlanFromWeeklyTask": {
        const weeklyTaskId = formData.get("weeklyTaskId") as string | null;
        const categoryCodeStr = formData.get("category_code") as string | null;
        const comment = formData.get("comment") as string | null;
        const subcode = formData.get("subcode") as string | null;
        const durationStr = formData.get("duration") as string | null; 

        if (!categoryCodeStr || !isValidCategoryCode(categoryCodeStr)) {
          return { ok: false, error: "Invalid category code for plan from weekly task.", intent };
        }
        if (!comment || comment.trim() === "") {
            return {ok: false, error: "Comment is required when adding from weekly task.", intent };
        }

        let durationMinutes: number | undefined = undefined;
        if (durationStr && durationStr.trim() !== "") {
            durationMinutes = parseInt(durationStr, 10);
            if (isNaN(durationMinutes) || durationMinutes < 0 || durationMinutes > MAX_MINUTES_PER_DAY) {
                 return { ok: false, error: "Invalid duration value.", intent };
            }
        }
        
        const planData: DailyPlanInsert = {
          profile_id: profileId,
          plan_date: tomorrowDate,
          category_code: categoryCodeStr,
          duration_minutes: durationMinutes,
          comment: comment,
          subcode: subcode,
          is_completed: false,
          linked_weekly_task_id: weeklyTaskId, 
        };
        const newPlanFromTaskDb = await planQueries.createDailyPlan(planData);
        const newPlanFromTask: DailyPlanUI | null = newPlanFromTaskDb ? {
            id: newPlanFromTaskDb.id,
            profile_id: newPlanFromTaskDb.profile_id,
            date: newPlanFromTaskDb.plan_date,
            category_code: newPlanFromTaskDb.category_code,
            subcode: newPlanFromTaskDb.subcode ?? null,
            duration: newPlanFromTaskDb.duration_minutes ?? undefined,
            comment: newPlanFromTaskDb.comment ?? null,
            is_completed: newPlanFromTaskDb.is_completed ?? false,
            linked_weekly_task_id: newPlanFromTaskDb.linked_weekly_task_id ?? null,
            created_at: newPlanFromTaskDb.created_at,
            updated_at: newPlanFromTaskDb.updated_at
        } : null;
        return { ok: true, intent, linked_weekly_task_id: weeklyTaskId, newPlanFromTask };
      }
      case "updatePlan": {
        const planId = formData.get("planId") as string | null;
        const categoryCodeStr = formData.get("category_code") as string | null;
        const subcode = formData.get("subcode") as string | null;
        const durationStr = formData.get("duration") as string | null;
        const comment = formData.get("comment") as string | null;

        if (!planId) return { ok: false, error: "Plan ID is required for update.", intent };
        if (!categoryCodeStr || !isValidCategoryCode(categoryCodeStr)) {
          return { ok: false, error: "Invalid or missing category code for update.", intent };
        }
        if (!comment || comment.trim() === "") { 
            return { ok: false, error: "Plan comment is required for update.", intent };
        }

        let durationMinutes: number | undefined | null = undefined; // Allow null for explicit clearing
        if (durationStr && durationStr.trim() !== "") {
            durationMinutes = parseInt(durationStr, 10);
            if (isNaN(durationMinutes) || durationMinutes < 0 || durationMinutes > MAX_MINUTES_PER_DAY) {
                 return { ok: false, error: "Invalid duration value for update.", intent };
            }
        } else if (durationStr === null || durationStr.trim() === "") {
            durationMinutes = null; // Explicitly set to null to clear the value in DB
        }

        const updates: Partial<DailyPlanUpdate> = {
            category_code: categoryCodeStr,
            comment: comment,
            subcode: subcode, // subcode can be empty string or null
            duration_minutes: durationMinutes, // durationMinutes can be number or null
        };

        const updatedPlanDb = await planQueries.updateDailyPlan({ planId, profileId, updates });
        
        if (!updatedPlanDb) {
            return { ok: false, error: "Failed to update plan or plan not found.", intent, planId };
        }

        const updatedPlan: DailyPlanUI = {
            id: updatedPlanDb.id,
            profile_id: updatedPlanDb.profile_id,
            date: updatedPlanDb.plan_date,
            category_code: updatedPlanDb.category_code,
            subcode: updatedPlanDb.subcode ?? null,
            duration: updatedPlanDb.duration_minutes ?? undefined,
            comment: updatedPlanDb.comment ?? null,
            is_completed: updatedPlanDb.is_completed ?? false,
            linked_weekly_task_id: updatedPlanDb.linked_weekly_task_id ?? null,
            created_at: updatedPlanDb.created_at,
            updated_at: updatedPlanDb.updated_at
        };
        return { ok: true, intent, planId, updatedPlan };
      }
      case "addAllPlansFromWeeklyTasks": {
        const weeklyTasksToAddString = formData.get("weeklyTasksToAdd") as string | null;
        if (!weeklyTasksToAddString) {
          return { ok: false, error: "No weekly tasks data provided.", intent };
        }
        let weeklyTasksInfo: Array<{ weeklyTaskId: string; category_code: string; comment: string; subcode: string | null; duration?: number; }> = [];
        try {
          weeklyTasksInfo = JSON.parse(weeklyTasksToAddString);
        } catch (e) {
          return { ok: false, error: "Invalid weekly tasks data format.", intent };
        }

        if (!Array.isArray(weeklyTasksInfo) || weeklyTasksInfo.length === 0) {
          return { ok: false, error: "Weekly tasks data is empty or not an array.", intent };
        }

        const newPlansDb: DbDailyPlan[] = [];
        const errors: string[] = [];

        for (const taskInfo of weeklyTasksInfo) {
          if (!taskInfo.category_code || !isValidCategoryCode(taskInfo.category_code)) {
            errors.push(`Invalid category for task based on: ${taskInfo.comment}`);
            continue;
          }
          if (!taskInfo.comment || taskInfo.comment.trim() === "") {
            errors.push(`Missing comment for a task.`);
            continue;
          }

          const planData: DailyPlanInsert = {
            profile_id: profileId,
            plan_date: tomorrowDate,
            category_code: taskInfo.category_code,
            duration_minutes: taskInfo.duration ?? undefined,
            comment: taskInfo.comment,
            subcode: taskInfo.subcode,
            is_completed: false,
            linked_weekly_task_id: taskInfo.weeklyTaskId,
          };
          try {
            const createdPlan = await planQueries.createDailyPlan(planData);
            if (createdPlan) {
              newPlansDb.push(createdPlan);
            } else {
              errors.push(`Failed to create plan for: ${taskInfo.comment}`);
            }
          } catch (error: any) {
            errors.push(`Error creating plan for ${taskInfo.comment}: ${error.message}`);
          }
        }

        if (errors.length > 0 && newPlansDb.length === 0) { // All failed
            return { ok: false, error: `All plan creations failed. Errors: ${errors.join("; ")}`, intent };
        }

        const newPlans: DailyPlanUI[] = newPlansDb.map(p => ({
            id: p.id,
            profile_id: p.profile_id,
            date: p.plan_date,
            category_code: p.category_code,
            subcode: p.subcode ?? null,
            duration: p.duration_minutes ?? undefined,
            comment: p.comment ?? null,
            is_completed: p.is_completed ?? false,
            linked_weekly_task_id: p.linked_weekly_task_id ?? null,
            created_at: p.created_at,
            updated_at: p.updated_at
        }));
        
        // If some succeeded and some failed, return ok:true but include partial errors/success info
        return { ok: true, intent, newPlans, partialErrors: errors.length > 0 ? errors : undefined };
      }
      case "deletePlan": {
        const planId = formData.get("planId") as string | null;
        if (!planId) return { ok: false, error: "Plan ID is required for deletion.", intent };
        await planQueries.deleteDailyPlan({ planId, profileId });
        return { ok: true, intent, deletedPlanId: planId };
      }
      default:
        return { ok: false, error: `Unknown intent: ${intent}`, intent: intent || "unknown" };
    }
  } catch (error: any) {
    console.error("TomorrowPage Action error:", error);
    const intentValue = formData.get("intent") as string | null;
    return { ok: false, error: error.message || "An unexpected error occurred.", intent: intentValue || "error" };
  }
};

// Meta
export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const pageData = data as TomorrowPageLoaderData | undefined;
  const dateStr = pageData?.tomorrowDate ? DateTime.fromISO(pageData.tomorrowDate).toFormat("yyyy-MM-dd") : "Tomorrow";
  return [
    { title: `Plan for ${dateStr} - StartBeyond` },
    { name: "description", content: `Plan your activities for ${dateStr}.` },
  ];
};


// interface WeeklyTask { // This will be replaced by WeeklyTaskUI / DbWeeklyTask
//   id: string;
//   category_code: CategoryCode;
//   comment: string;
//   days: Record<string, boolean>;
//   subcode: string;
// }

// interface WeeklyPlan { // This structure is for mock data, will be replaced
//   tasks: WeeklyTask[];
// }

// function getTomorrow() { // Replaced by getTomorrowDateISO and DateTime formatting
//   const d = new Date();
//   d.setDate(d.getDate() + 1);
//   return d.toLocaleDateString("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" });
// }

// function getTomorrowDay() { // Replaced by getDayString(tomorrowDateTime)
//   const d = new Date();
//   d.setDate(d.getDate() + 1);
//   return ['일','월','화','수','목','금','토'][d.getDay()];
// }

// function getWeekRange(date = new Date()) { // Can be replaced by DateTime utils if needed
//   const day = date.getDay() || 7; // 일요일=0 → 7
//   const monday = new Date(date);
//   monday.setDate(date.getDate() - day + 1);
//   const sunday = new Date(monday);
//   sunday.setDate(monday.getDate() + 6);
//   const format = (d: Date) =>
//     `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${['일','월','화','수','목','금','토'][d.getDay()]})`;
//   return `${format(monday)} ~ ${format(sunday)}`;
// }
// ... (rest of the component will be updated in the next step)
interface AddPlanForm {
  category: CategoryCode;
  duration: string;
  comment: string;
  subcode: string;
}

const initialAddForm: AddPlanForm = {
  category: "EX",
  duration: "",
  comment: "",
  subcode: "",
};

// Component Props
interface TomorrowPlanPageProps {
    loaderData: TomorrowPageLoaderData;
}

export default function TomorrowPlanPage({ loaderData }: TomorrowPlanPageProps) {
  const { tomorrowDate, tomorrowPlans: initialTomorrowPlans, relevantWeeklyTasks, profileId } = loaderData;
  
  const fetcher = useFetcher<typeof action>();
  // Form state for adding a new plan
  const [addForm, setAddForm] = useState<AddPlanForm>(initialAddForm);
  const [isWeeklyTasksCollapsed, setIsWeeklyTasksCollapsed] = useState(relevantWeeklyTasks.length === 0);
  const [tomorrowPlans, setTomorrowPlans] = useState<DailyPlanUI[]>(initialTomorrowPlans);
  const [addedWeeklyTaskIds, setAddedWeeklyTaskIds] = useState<Set<string>>(() => 
    new Set(initialTomorrowPlans.filter(p => p.linked_weekly_task_id).map(p => p.linked_weekly_task_id!))
  );

  // State for editing an existing plan
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [editPlanCategory, setEditPlanCategory] = useState<CategoryCode>(initialAddForm.category);
  const [editPlanDuration, setEditPlanDuration] = useState("");
  const [editPlanComment, setEditPlanComment] = useState("");
  const [editPlanSubcode, setEditPlanSubcode] = useState("");
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [durationError, setDurationError] = useState<string | null>(null); // For both add and edit

  useEffect(() => {
    setTomorrowPlans(initialTomorrowPlans);
    setAddedWeeklyTaskIds(new Set(initialTomorrowPlans.filter(p => p.linked_weekly_task_id).map(p => p.linked_weekly_task_id!)));
    setIsWeeklyTasksCollapsed(relevantWeeklyTasks.length === 0);
    // Reset editing state when loader data changes (e.g. navigation)
    setIsEditingPlan(false);
    setSelectedPlanId(null);
  }, [initialTomorrowPlans, relevantWeeklyTasks]);

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
        const actionData = fetcher.data as {
            ok: boolean;
            intent: string; // intent는 항상 존재한다고 가정
            error?: string;
            // For addPlan
            newPlan?: DailyPlanUI;
            // For addPlanFromWeeklyTask
            newPlanFromTask?: DailyPlanUI;
            linked_weekly_task_id?: string;
            // For addAllPlansFromWeeklyTasks
            newPlans?: DailyPlanUI[];
            partialErrors?: string[];
            // For deletePlan
            deletedPlanId?: string;
            // For updatePlan
            planId?: string; 
            updatedPlan?: DailyPlanUI;
        };
        if (actionData.ok) {
            if (actionData.intent === "addPlan" && actionData.newPlan) {
                setAddForm(initialAddForm); // Reset add form
                const newPlan = actionData.newPlan as DailyPlanUI;
                setTomorrowPlans(prevPlans => {
                    if (prevPlans.some(p => p.id === newPlan.id)) return prevPlans;
                    return [newPlan, ...prevPlans].sort((a,b) => (a.created_at && b.created_at ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : 0) );
                });
            }
            if (actionData.intent === "addPlanFromWeeklyTask" && actionData.linked_weekly_task_id) {
                if (actionData.newPlanFromTask) { 
                    const newPlanFromTask = actionData.newPlanFromTask as DailyPlanUI;
                    setTomorrowPlans(prevPlans => {
                        if (prevPlans.some(p => p.id === newPlanFromTask.id)) return prevPlans;
                        return [newPlanFromTask, ...prevPlans].sort((a,b) => (a.created_at && b.created_at ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : 0) );
                    });
                    setAddedWeeklyTaskIds(prev => new Set(prev).add(actionData.linked_weekly_task_id!));
                } else {
                    console.warn(`[TomorrowPage Effect] addPlanFromWeeklyTask for ${actionData.linked_weekly_task_id} was ok, but no newPlanFromTask data received.`);
                }
            } 
            if (actionData.intent === "addAllPlansFromWeeklyTasks" && actionData.newPlans) {
                const newPlans = actionData.newPlans as DailyPlanUI[];
                if (newPlans.length > 0) {
                    setTomorrowPlans(prevPlans => {
                        const newPlanIds = new Set(newPlans.map(p => p.id));
                        const filteredPrevPlans = prevPlans.filter(p => !newPlanIds.has(p.id));
                        return [...newPlans, ...filteredPrevPlans].sort((a,b) => (a.created_at && b.created_at ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : 0) );
                    });
                    setAddedWeeklyTaskIds(prevIds => {
                        const newIdsToAdd = new Set(newPlans.map(p => p.linked_weekly_task_id).filter((id): id is string => id !== null));
                        return new Set([...prevIds, ...newIdsToAdd]);
                    });
                }
                if (actionData.partialErrors && actionData.partialErrors.length > 0) {
                    alert(`Some weekly tasks could not be added as plans: ${actionData.partialErrors.join("; ")}`);
                }
            }
            if (actionData.intent === "updatePlan" && actionData.updatedPlan && actionData.planId) {
                const updatedPlan = actionData.updatedPlan as DailyPlanUI;
                setTomorrowPlans(prevPlans => 
                    prevPlans.map(p => p.id === actionData.planId ? updatedPlan : p)
                );
                setIsEditingPlan(false);
                setSelectedPlanId(null);
                // Optionally reset edit form fields here if needed, though they become irrelevant once isEditingPlan is false
            }
            if (actionData.intent === "deletePlan" && actionData.deletedPlanId) {
                const deletedPlanId = actionData.deletedPlanId as string;
                const planToDelete = tomorrowPlans.find(p => p.id === deletedPlanId); // Find before filtering
                setTomorrowPlans(prevPlans => prevPlans.filter(p => p.id !== deletedPlanId));
                if (planToDelete?.linked_weekly_task_id) {
                    setAddedWeeklyTaskIds(prevIds => {
                        const newSet = new Set(prevIds);
                        newSet.delete(planToDelete.linked_weekly_task_id!);
                        return newSet;
                    });
                }
                if (selectedPlanId === deletedPlanId) {
                    setIsEditingPlan(false);
                    setSelectedPlanId(null);
                }
            }
        } else if (actionData.error) {
            console.error("Action Error:", actionData.error, "Intent:", actionData.intent);
            if (actionData.error?.includes("duration")) {
                setDurationError(actionData.error);
            } else {
                alert(`Error (${actionData.intent || 'unknown'}): ${actionData.error}`); 
            }
        }
    }
  }, [fetcher.data, fetcher.state, selectedPlanId]); // Removed tomorrowPlans from deps

  function handleCategorySelect(code: CategoryCode) {
    if (isEditingPlan) {
        const selectedPlan = tomorrowPlans.find(p => p.id === selectedPlanId);
        if (selectedPlan?.linked_weekly_task_id) return; // Cannot change category if from weekly task
        setEditPlanCategory(code);
    } else {
        setAddForm((f) => ({ ...f, category: code }));
    }
  }

  function handleAddFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setAddForm((f) => ({ ...f, [name]: value }));
    if (name === "duration") validateDuration(value);
  }
  
  function handleEditFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    if (name === "duration") {
        if (validateDuration(value)) setEditPlanDuration(value);
    } else if (name === "comment") {
        setEditPlanComment(value);
    } else if (name === "subcode") {
        setEditPlanSubcode(value);
    }
  }

  function validateDuration(value: string): boolean {
    const num = Number(value);
    if (value.trim() === "") { // Allow empty for optional duration
        setDurationError(null);
        return true;
    }
    if (isNaN(num) || num < 0 || num > MAX_MINUTES_PER_DAY) {
      setDurationError(`Must be a number between 0 and ${MAX_MINUTES_PER_DAY}.`);
      return false;
    }
    setDurationError(null);
    return true;
  }

  function handlePlanRowClick(plan: DailyPlanUI) {
    if (isEditingPlan && selectedPlanId === plan.id) return; // Already editing this plan

    setSelectedPlanId(plan.id);
    if (isValidCategoryCode(plan.category_code)) {
        setEditPlanCategory(plan.category_code as CategoryCode);
    } else {
        setEditPlanCategory(initialAddForm.category); // Fallback
        console.warn("Invalid category_code in clicked plan:", plan.category_code);
    }
    setEditPlanDuration(plan.duration ? String(plan.duration) : "");
    setEditPlanComment(plan.comment || "");
    setEditPlanSubcode(plan.subcode || "");
    setIsEditingPlan(true);
    setDurationError(null); // Clear previous errors
  }

  function handleEditPlanCancel() {
    setIsEditingPlan(false);
    setSelectedPlanId(null);
    setDurationError(null);
    // Optionally reset edit form fields to initialAddForm or last selected plan's data
    // For now, just exit editing mode. The form will show "Add" fields.
  }

  function handleAddAllWeeklyTasks() {
    const tasksToAdd = relevantWeeklyTasks.filter(task => !addedWeeklyTaskIds.has(task.id));
    if (tasksToAdd.length === 0) return;

    const tasksInfoForAction = tasksToAdd.map(task => ({
      weeklyTaskId: task.id,
      category_code: task.category_code,
      comment: task.comment,
      subcode: task.subcode,
      // Duration is not part of WeeklyTaskUI, assuming no duration for now
      // If weekly tasks could have durations, it should be included here
    }));

    const formData = new FormData();
    formData.append("intent", "addAllPlansFromWeeklyTasks");
    formData.append("weeklyTasksToAdd", JSON.stringify(tasksInfoForAction));
    fetcher.submit(formData, { method: "post" });
  }

  const allWeeklyTasksAdded = relevantWeeklyTasks.length > 0 && relevantWeeklyTasks.every(task => addedWeeklyTaskIds.has(task.id));

  const currentWeekRange = `${DateTime.fromISO(tomorrowDate).startOf('week').toFormat('yyyy.MM.dd (ccc)')} ~ ${DateTime.fromISO(tomorrowDate).endOf('week').toFormat('yyyy.MM.dd (ccc)')}`;
  
  const selectedPlanForEdit = isEditingPlan ? tomorrowPlans.find(p => p.id === selectedPlanId) : null;
  const currentFormCategory = isEditingPlan ? editPlanCategory : addForm.category;
  const currentFormDuration = isEditingPlan ? editPlanDuration : addForm.duration;
  const currentFormComment = isEditingPlan ? editPlanComment : addForm.comment;
  const currentFormSubcode = isEditingPlan ? editPlanSubcode : addForm.subcode;
  const isCategoryDisabledForEdit = isEditingPlan && !!selectedPlanForEdit?.linked_weekly_task_id;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 pt-16 bg-background min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-3xl">Tomorrow's Plan</h1>
        </div>
        <div className="text-gray-500 text-lg">{DateTime.fromISO(tomorrowDate).toFormat("yyyy-MM-dd (ccc)")}</div>
        <Button asChild className="ml-2" variant="ghost" size="sm">
          <Link to="/daily">To Daily Page</Link>
        </Button>
      </div>

      {/* Weekly Tasks Section - Collapsible */}
      <div className="mb-8">
        {isWeeklyTasksCollapsed ? (
            <Card>
                <CardHeader className="cursor-pointer py-4" onClick={() => setIsWeeklyTasksCollapsed(false)}>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Relevant Weekly Tasks ({relevantWeeklyTasks.length})</CardTitle>
                        <Button variant="ghost" size="sm">펴기</Button>
                    </div>
                </CardHeader>
            </Card>
        ) : (
            <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                            <CardTitle>Relevant Weekly Tasks</CardTitle>
                            <div className="text-sm text-muted-foreground">{currentWeekRange}</div>
              </div>
                        <Button variant="ghost" size="sm" onClick={() => setIsWeeklyTasksCollapsed(true)}>접기</Button>
            </div>
          </CardHeader>
                {relevantWeeklyTasks.length > 0 ? (
                    <>
          <CardContent>
            <div className="space-y-4">
                            {relevantWeeklyTasks.map(task => {
                                const categoryInfo = isValidCategoryCode(task.category_code) ? CATEGORIES[task.category_code as CategoryCode] : null;
                                const isAdded = addedWeeklyTaskIds.has(task.id);
                                const scheduledDays = task.days 
                                  ? Object.entries(task.days)
                                      .filter(([, scheduled]) => scheduled)
                                      .map(([day]) => day)
                                      .join(', ')
                                  : 'Not specified';

                                return (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                                    <span className={`text-2xl ${categoryInfo ? getCategoryColor(task.category_code as CategoryCode) : 'text-gray-500'}`}>{categoryInfo?.icon || '❓'}</span>
                    <div>
                      <div className="font-medium">{task.comment}</div>
                                        {task.subcode && <div className="text-sm text-muted-foreground">Subcode: {task.subcode}</div>}
                                        <div className="text-xs text-muted-foreground">Weekly Schedule: {scheduledDays}</div>
                      </div>
                    </div>
                                    <fetcher.Form method="post">
                                    <input type="hidden" name="intent" value="addPlanFromWeeklyTask" />
                                    <input type="hidden" name="weeklyTaskId" value={task.id} />
                                    <input type="hidden" name="category_code" value={task.category_code} />
                                    {task.subcode && <input type="hidden" name="subcode" value={task.subcode} />}
                                    <input type="hidden" name="comment" value={task.comment} />
                  <Button
                                        type="submit"
                                        variant={isAdded ? "secondary" : "outline"}
                    size="sm"
                                        disabled={isAdded || (fetcher.state !== 'idle' && fetcher.formData?.get('intent') === 'addPlanFromWeeklyTask' && fetcher.formData?.get('weeklyTaskId') === task.id)}
                  >
                                        {isAdded ? "Added" : "Add"}
                  </Button>
                                    </fetcher.Form>
                </div>
                                )
                            })}
                </div>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddAllWeeklyTasks}
                                disabled={allWeeklyTasksAdded || fetcher.state !== 'idle'}
                >
                                {fetcher.state !== 'idle' && fetcher.formData?.get('intent') === 'addPlanFromWeeklyTask' && !fetcher.formData?.has('weeklyTaskId') ? "Adding All..." : "Add All to Tomorrow"}
                </Button>
                        </CardFooter>
                    </>
                ) : (
                    <CardContent>
                        <p className="text-muted-foreground text-center py-4">No weekly tasks scheduled for tomorrow.</p>
          </CardContent>
                )}
        </Card>
      )}
        </div>

      {/* Add/Edit Plan Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{isEditingPlan ? "Edit Plan" : "Add New Plan for Tomorrow"}</CardTitle>
        </CardHeader>
        <CardContent>
          <fetcher.Form method="post" className="flex flex-col gap-4" onSubmit={() => setDurationError(null)}>
            <input type="hidden" name="intent" value={isEditingPlan ? "updatePlan" : "addPlan"} />
            {isEditingPlan && selectedPlanId && <input type="hidden" name="planId" value={selectedPlanId} />}
            
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-2">
              {Object.entries(CATEGORIES).map(([code, cat]) => (
                <Button
                  key={code}
                  type="button"
                  variant={currentFormCategory === code ? "default" : "outline"}
                  className={`w-16 h-16 flex flex-col items-center justify-center rounded-lg border ${currentFormCategory === code ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => handleCategorySelect(code as CategoryCode)}
                  style={{ minWidth: 64, minHeight: 64 }}
                  disabled={(isEditingPlan && isCategoryDisabledForEdit) || (fetcher.state !== 'idle' && fetcher.formData?.get('intent') === (isEditingPlan ? 'updatePlan' : 'addPlan'))}
                >
                  <span className="text-2xl mb-1">{cat.icon}</span>
                  <span className="text-xs font-medium text-center leading-tight">{cat.label}</span>
                </Button>
              ))}
            </div>
            <input type="hidden" name="category_code" value={currentFormCategory} />
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                name="subcode"
                placeholder="Subcode (optional)"
                value={currentFormSubcode}
                onChange={isEditingPlan ? handleEditFormChange : handleAddFormChange}
                className="sm:w-1/3"
                disabled={fetcher.state !== 'idle' && fetcher.formData?.get('intent') === (isEditingPlan ? 'updatePlan' : 'addPlan')}
              />
              <div className="relative sm:w-1/4">
              <Input
                  name="duration"
                type="number"
                min={0}
                  placeholder="Minutes (optional)"
                  value={currentFormDuration}
                  onChange={isEditingPlan ? handleEditFormChange : handleAddFormChange}
                  className={`${durationError ? 'border-red-500' : ''}`}
                  disabled={fetcher.state !== 'idle' && fetcher.formData?.get('intent') === (isEditingPlan ? 'updatePlan' : 'addPlan')}
                />
                {durationError && (
                    <div className="absolute -bottom-5 left-0 text-xs text-red-500">
                        {durationError}
                    </div>
                )}
              </div>
              <Input
                name="comment"
                placeholder="Plan details / comment"
                value={currentFormComment}
                onChange={isEditingPlan ? handleEditFormChange : handleAddFormChange}
                className="flex-1"
                disabled={fetcher.state !== 'idle' && fetcher.formData?.get('intent') === (isEditingPlan ? 'updatePlan' : 'addPlan')}
                required
              />
              {isEditingPlan ? (
                <div className="flex gap-1 flex-shrink-0">
                    <Button type="submit" size="sm" disabled={fetcher.state !== 'idle' || !currentFormComment.trim()}>Save</Button>
                    <Button type="button" size="sm" variant="outline" onClick={handleEditPlanCancel} disabled={fetcher.state !== 'idle'}>Cancel</Button>
                    <fetcher.Form method="post" style={{ display: 'inline-block' }}>
                        <input type="hidden" name="intent" value="deletePlan" />
                        {selectedPlanId && <input type="hidden" name="planId" value={selectedPlanId} />}
                        <Button variant="destructive" size="sm" type="submit" disabled={fetcher.state !== 'idle'}>Delete</Button>
                    </fetcher.Form>
                </div>
              ) : (
                <Button type="submit" className="ml-0 sm:ml-2" disabled={fetcher.state !== 'idle' || !addForm.comment.trim()}>
                  {fetcher.state !== 'idle' && fetcher.formData?.get('intent') === 'addPlan' ? "Adding..." : <><Plus className="w-4 h-4 mr-1" /> Add Plan</>}
                </Button>
              )}
            </div>
          </fetcher.Form>
        </CardContent>
      </Card>

      {/* Planned Activities List */}
      <Card>
        <CardHeader>
          <CardTitle>Tomorrow's Planned Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {tomorrowPlans.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No plans yet for tomorrow. Add some!</p>
          ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-base">
              <thead>
                <tr className="border-b">
                    <th className="py-2 px-2 text-left">Category</th>
                  <th className="py-2 px-2 text-left">Subcode</th>
                  <th className="py-2 px-2 text-left">Duration</th>
                  <th className="py-2 px-2 text-left">Comment</th>
                  <th className="py-2 px-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                  {tomorrowPlans.map((plan) => {
                    const categoryInfo = isValidCategoryCode(plan.category_code) ? CATEGORIES[plan.category_code as CategoryCode] : null;
                  return (
                    <tr key={plan.id} className={`border-b ${isEditingPlan && selectedPlanId === plan.id ? 'bg-accent/30' : 'cursor-pointer hover:bg-muted/50'}`} onClick={() => !isEditingPlan && handlePlanRowClick(plan)}>
                      <td className="py-2 px-2 flex items-center gap-2">
                          <span className={`text-2xl ${categoryInfo ? getCategoryColor(plan.category_code as CategoryCode) : 'text-gray-500'}`}>{categoryInfo?.icon || '❓'}</span>
                          <span className="font-medium">{categoryInfo?.label || plan.category_code}</span>
                      </td>
                      <td className="py-2 px-2">{plan.subcode || <span className="text-muted-foreground">-</span>}</td>
                        <td className="py-2 px-2">{plan.duration ? `${plan.duration} min` : <span className="text-muted-foreground">-</span>}</td>
                        <td className="py-2 px-2">{plan.comment || <span className="text-muted-foreground">N/A</span>}</td>
                      <td className="py-2 px-2 text-center">
                          {isEditingPlan && selectedPlanId === plan.id ? (
                            <span className="text-sm text-muted-foreground">Editing...</span>
                          ) : (
                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handlePlanRowClick(plan); }} disabled={isEditingPlan}>Edit</Button>
                          )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 