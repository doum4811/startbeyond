import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "~/common/components/ui/card";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Textarea } from "~/common/components/ui/textarea";
import { CATEGORIES, type CategoryCode, type UICategory } from "~/common/types/daily";
// import type { Route } from "~/common/types";
import { Link, Form, useFetcher } from "react-router";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { DateTime } from "luxon";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel, AlertDialogAction } from "~/common/components/ui/alert-dialog";
import { CategorySelector } from "~/common/components/ui/CategorySelector";

import * as planQueries from "~/features/plan/queries";
import type { DailyPlan as DbDailyPlan, DailyPlanInsert, DailyPlanUpdate, WeeklyTask as DbWeeklyTask } from "~/features/plan/queries";
import * as settingsQueries from "~/features/settings/queries";
import type { UserCategory as DbUserCategory, UserDefaultCodePreference as DbUserDefaultCodePreference } from "~/features/settings/queries";

// UI-specific types
// REMOVE UICategory interface definition from here

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

// isValidCategoryCode updated to accept activeCategories list
const isValidCategoryCode = (code: string, activeCategories: UICategory[]): boolean => {
    return activeCategories.some(c => c.code === code && c.isActive);
};

// getCategoryColor updated to accept UICategory object (similar to daily-page.tsx)
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


// Loader
export interface TomorrowPageLoaderData {
  tomorrowDate: string;
  tomorrowPlans: DailyPlanUI[];
  relevantWeeklyTasks: WeeklyTaskUI[];
  profileId: string;
  categories: UICategory[];
}

export const loader = async ({ request }: LoaderFunctionArgs): Promise<TomorrowPageLoaderData> => {
  const profileId = await getProfileId(request);
  const tomorrowDate = getTomorrowDateISO();
  const tomorrowDateTime = DateTime.fromISO(tomorrowDate);
  const currentWeekStartDate = tomorrowDateTime.startOf('week').toISODate();
  const tomorrowDayString = getDayString(tomorrowDateTime);

  const [
    tomorrowPlansData, 
    weeklyTasksData,
    userCategoriesData,
    userDefaultCodePreferencesData
  ] = await Promise.all([
    planQueries.getDailyPlansByDate({ profileId, date: tomorrowDate }),
    planQueries.getWeeklyTasksByWeek({ profileId, weekStartDate: currentWeekStartDate! }),
    settingsQueries.getUserCategories({ profileId }),
    settingsQueries.getUserDefaultCodePreferences({ profileId })
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

  // Process categories (copied and adapted from daily-page.tsx loader)
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
    tomorrowDate,
    tomorrowPlans,
    relevantWeeklyTasks,
    profileId,
    categories: processedCategories, // Use processedCategories
  };
};

// Action
export const action = async ({ request }: ActionFunctionArgs) => {
  const profileId = await getProfileId(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const tomorrowDate = getTomorrowDateISO();

  const activeCategoriesForAction = await (async () => {
    const [userCategoriesDb, defaultPreferencesDb] = await Promise.all([
        settingsQueries.getUserCategories({ profileId }),
        settingsQueries.getUserDefaultCodePreferences({ profileId })
    ]);
    const categories: UICategory[] = [];
    const defaultPrefsMap = new Map((defaultPreferencesDb || []).map(p => [p.default_category_code, p.is_active]));
    for (const key in CATEGORIES) {
        const base = CATEGORIES[key as CategoryCode];
        const isActivePref = defaultPrefsMap.get(base.code);
        if (isActivePref === undefined || isActivePref) {
            categories.push({ 
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
            if (!categories.find(c => c.code === uc.code && !c.isCustom && c.isActive)) {
                 categories.push({
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
    return categories.filter(c => c.isActive);
  })();

  try {
    switch (intent) {
      case "addPlan": {
        const categoryCodeStr = formData.get("category_code") as string | null;
        const durationStr = formData.get("duration") as string | null;
        const comment = formData.get("comment") as string | null;
        const subcode = formData.get("subcode") as string | null;

        if (!categoryCodeStr || !isValidCategoryCode(categoryCodeStr, activeCategoriesForAction)) { // Updated validation
          return { ok: false, error: "Invalid or missing active category code.", intent };
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

        if (!categoryCodeStr || !isValidCategoryCode(categoryCodeStr, activeCategoriesForAction)) { // Updated validation
          return { ok: false, error: "Invalid active category code for plan from weekly task.", intent };
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
        if (!categoryCodeStr || !isValidCategoryCode(categoryCodeStr, activeCategoriesForAction)) { // Updated validation
          return { ok: false, error: "Invalid or missing active category code for update.", intent };
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
        const tasksJson = formData.get("tasks") as string;
        if (!tasksJson) {
          return { ok: false, error: "No tasks provided to add.", intent };
        }
        try {
          const tasks: Array<Pick<WeeklyTaskUI, 'category_code' | 'comment' | 'subcode' | 'id'>> = JSON.parse(tasksJson);
          const createdPlans: DailyPlanUI[] = [];

          for (const task of tasks) {
            if (!task.category_code || !isValidCategoryCode(task.category_code, activeCategoriesForAction)) { // Updated validation
              console.warn(`Skipping task due to invalid category: ${task.category_code}`);
              continue; 
            }
            if (!task.comment || task.comment.trim() === "") {
                console.warn(`Skipping task due to missing comment: ${task.id}`);
                continue;
            }

            const planData: DailyPlanInsert = {
              profile_id: profileId,
              plan_date: tomorrowDate,
              category_code: task.category_code,
              duration_minutes: undefined, // Assuming duration is not part of weekly task for this action
              comment: task.comment,
              subcode: task.subcode,
              is_completed: false,
              linked_weekly_task_id: task.id,
            };
            try {
              const createdPlanDb = await planQueries.createDailyPlan(planData);
              if (createdPlanDb) {
                // Convert DbDailyPlan to DailyPlanUI
                const createdPlanUi: DailyPlanUI = {
                    id: createdPlanDb.id,
                    profile_id: createdPlanDb.profile_id,
                    date: createdPlanDb.plan_date, // Use plan_date from DB
                    category_code: createdPlanDb.category_code,
                    subcode: createdPlanDb.subcode ?? null,
                    duration: createdPlanDb.duration_minutes ?? undefined,
                    comment: createdPlanDb.comment ?? null,
                    is_completed: createdPlanDb.is_completed ?? false,
                    linked_weekly_task_id: createdPlanDb.linked_weekly_task_id ?? null,
                    created_at: createdPlanDb.created_at,
                    updated_at: createdPlanDb.updated_at
                };
                createdPlans.push(createdPlanUi);
              } else {
                console.warn(`Failed to create plan for: ${task.comment}`);
              }
            } catch (error: any) {
              console.warn(`Error creating plan for ${task.comment}: ${error.message}`);
            }
          }

          if (createdPlans.length > 0) {
            return { ok: true, intent, newPlans: createdPlans };
          } else {
            return { ok: false, error: "No plans created.", intent };
          }
        } catch (error: any) {
          return { ok: false, error: error.message, intent };
        }
      }
      case "deletePlan": {
        const planId = formData.get("planId") as string | null;
        if (!planId) return { ok: false, error: "Plan ID is required for deletion.", intent };
        await planQueries.deleteDailyPlan({ planId, profileId });
        return { ok: true, intent, deletedPlanId: planId };
      }
      case "activateCategoryAndAddSinglePlanFromWeekly": {
        const taskDetailsJson = formData.get("taskDetails") as string;
        if (!taskDetailsJson) {
          return { ok: false, error: "Task details are required for activation.", intent };
        }
        try {
          const taskDetails = JSON.parse(taskDetailsJson);
          const { weeklyTaskId, category_code, comment, subcode, isCustomCategory } = taskDetails;

          if (!category_code /*|| !isValidCategoryCode(category_code, activeCategoriesForAction) // This validation might be redundant if client ensures category exists*/) {
            // Server-side validation should still check if category_code is valid in general sense if needed
            // For now, assuming client sends a category that *can* be activated.
            const categoryExists = activeCategoriesForAction.some(c => c.code === category_code) || Object.keys(CATEGORIES).includes(category_code) || (await settingsQueries.getUserCategories({profileId}))?.find(uc => uc.code === category_code);
            if(!categoryExists) {
                 return { ok: false, error: `Category code ${category_code} does not exist or is invalid.`, intent };
            }
          }
          if (!comment || comment.trim() === "") {
            return { ok: false, error: "Comment is required for activation.", intent };
          }

          // 1. Activate the category (copied logic from daily-page action)
          try {
            if (isCustomCategory) {
                const userCategories = await settingsQueries.getUserCategories({ profileId });
                const categoryToUpdate = userCategories?.find(uc => uc.code === category_code);
                if (categoryToUpdate) {
                    await settingsQueries.updateUserCategory({
                        categoryId: categoryToUpdate.id,
                        profileId,
                        updates: { is_active: true }
                    });
                } else {
                    return { ok: false, error: `Custom category ${category_code} not found for activation.`, intent };
                }
            } else { // Default category
                await settingsQueries.upsertUserDefaultCodePreference({
                    profile_id: profileId,
                    default_category_code: category_code,
                    is_active: true
                });
            }
          } catch (activationError: any) {
            return { ok: false, error: `Failed to activate category ${category_code}: ${activationError.message}`, intent };
          }

          // 2. Create the plan
          const planData: DailyPlanInsert = {
            profile_id: profileId,
            plan_date: tomorrowDate,
            category_code: category_code,
            duration_minutes: undefined, // Assuming no duration from weekly task for now
            comment: comment,
            subcode: subcode,
            is_completed: false,
            linked_weekly_task_id: weeklyTaskId,
          };
          const newPlanDb = await planQueries.createDailyPlan(planData);
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

          if (newPlan) {
            // Removed direct state updates: setTomorrowPlans, setAddedWeeklyTaskIds
            return { ok: true, intent, newPlan, originalWeeklyTaskId: weeklyTaskId, activatedCategoryCode: category_code };
          } else {
            return { ok: false, error: "Failed to create new plan after activation.", intent };
          }
        } catch (error: any) {
          return { ok: false, error: error.message, intent };
        }
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
  category: string;
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
  const { tomorrowDate, tomorrowPlans: initialTomorrowPlans, relevantWeeklyTasks, profileId, categories } = loaderData;
  
  const fetcher = useFetcher<typeof action>();
  // Form state for adding a new plan
  const [addForm, setAddForm] = useState<AddPlanForm>(() => {
    const firstActiveCategory = categories.find(c => c.isActive);
    return {
        ...initialAddForm,
        category: firstActiveCategory ? firstActiveCategory.code : "EX",
    };
  });
  const [isWeeklyTasksCollapsed, setIsWeeklyTasksCollapsed] = useState(relevantWeeklyTasks.length === 0);
  const [tomorrowPlans, setTomorrowPlans] = useState<DailyPlanUI[]>(initialTomorrowPlans);
  const [addedWeeklyTaskIds, setAddedWeeklyTaskIds] = useState<Set<string>>(() => 
    new Set(initialTomorrowPlans.filter(p => p.linked_weekly_task_id).map(p => p.linked_weekly_task_id!))
  );

  // State for editing an existing plan
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [editPlanCategory, setEditPlanCategory] = useState<string>(initialAddForm.category);
  const [editPlanDuration, setEditPlanDuration] = useState("");
  const [editPlanComment, setEditPlanComment] = useState("");
  const [editPlanSubcode, setEditPlanSubcode] = useState("");
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [durationError, setDurationError] = useState<string | null>(null); // For both add and edit

  // New state variables for sequential activation dialog
  const [showActivatePlanDialog, setShowActivatePlanDialog] = useState(false);
  const [planForActivation, setPlanForActivation] = useState<DailyPlanUI | null>(null);
  const [pendingAddAllPlansQueue, setPendingAddAllPlansQueue] = useState<DailyPlanUI[]>([]);

  useEffect(() => {
    setTomorrowPlans(initialTomorrowPlans);
    setAddedWeeklyTaskIds(new Set(initialTomorrowPlans.filter(p => p.linked_weekly_task_id).map(p => p.linked_weekly_task_id!)));
    setIsWeeklyTasksCollapsed(relevantWeeklyTasks.length === 0);
    // Reset addForm category based on potentially new categories from loaderData
    const firstActiveCategory = categories.find(c => c.isActive);
    setAddForm({
      ...initialAddForm,
      category: firstActiveCategory ? firstActiveCategory.code : "EX",
    });
    // Reset editing state when loader data changes (e.g. navigation)
    setIsEditingPlan(false);
    setSelectedPlanId(null);
    // Reset sequential add all states as well if date changes etc.
    setShowActivatePlanDialog(false);
    setPlanForActivation(null);
    setPendingAddAllPlansQueue([]);
  }, [initialTomorrowPlans, relevantWeeklyTasks, categories]);

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
        const actionData = fetcher.data as {
            ok: boolean;
            intent: string; 
            error?: string;
            newPlan?: DailyPlanUI;
            newPlanFromTask?: DailyPlanUI;
            linked_weekly_task_id?: string;
            newPlans?: DailyPlanUI[];
            partialErrors?: string[];
            deletedPlanId?: string;
            planId?: string; 
            updatedPlan?: DailyPlanUI;
            // For new intent activateCategoryAndAddSinglePlanFromWeekly
            activatedCategoryCode?: string;
            originalWeeklyTaskId?: string;
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
            if (actionData.intent === "activateCategoryAndAddSinglePlanFromWeekly" && actionData.newPlan && actionData.originalWeeklyTaskId) {
                const newPlan = actionData.newPlan as DailyPlanUI;
                setTomorrowPlans(prevPlans => {
                    if (prevPlans.some(p => p.id === newPlan.id)) return prevPlans;
                    return [newPlan, ...prevPlans].sort((a,b) => (a.created_at && b.created_at ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : 0) );
                });
                setAddedWeeklyTaskIds(prev => new Set(prev).add(actionData.originalWeeklyTaskId!));
                setShowActivatePlanDialog(false); // Close dialog
                
                // Process next task in queue
                setPendingAddAllPlansQueue(prevQueue => prevQueue.filter(task => task.id !== actionData.originalWeeklyTaskId));
                // Directly call processNext here, but need to ensure state updates are flushed for pendingAddAllPlansQueue
                // A small delay or a separate useEffect listening to pendingAddAllPlansQueue might be more robust
                // For now, will call it directly and see. If issues, will adjust.
                processNextPendingPlanForActivation(pendingAddAllPlansQueue.filter(task => task.id !== actionData.originalWeeklyTaskId));
            }
        } else if (actionData.error) {
            console.error("Action Error:", actionData.error, "Intent:", actionData.intent);
            if (actionData.intent === "activateCategoryAndAddSinglePlanFromWeekly") {
                alert(`Error activating/adding task ${planForActivation?.comment}: ${actionData.error}`);
                setShowActivatePlanDialog(false); // Close dialog
                // Process next task in queue even if current one failed
                if (actionData.originalWeeklyTaskId) { // originalWeeklyTaskId might not be present on all errors
                    processNextPendingPlanForActivation(pendingAddAllPlansQueue.filter(task => task.id !== actionData.originalWeeklyTaskId));
                }
                 else if (planForActivation) { // Fallback if originalWeeklyTaskId not in error data
                    processNextPendingPlanForActivation(pendingAddAllPlansQueue.filter(task => task.id !== planForActivation.id));
                }
            } else if (actionData.error?.includes("duration")) {
                setDurationError(actionData.error);
            } else {
                alert(`Error (${actionData.intent || 'unknown'}): ${actionData.error}`); 
            }
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.data, fetcher.state, selectedPlanId, planForActivation]); // Added planForActivation to deps

  function processNextPendingPlanForActivation(currentQueue?: DailyPlanUI[]) {
    const queueToProcess = currentQueue || pendingAddAllPlansQueue;
    if (queueToProcess.length > 0) {
        const nextPlan = queueToProcess[0];
        setPlanForActivation(nextPlan);
        setShowActivatePlanDialog(true);
    } else {
        setPlanForActivation(null);
        setShowActivatePlanDialog(false);
        setPendingAddAllPlansQueue([]); // Clear queue when done
    }
  }

  function handleCategorySelect(code: string) {
    const selectedCat = categories.find(c => c.code === code);
    if (selectedCat && selectedCat.isActive) {
        if (isEditingPlan) {
            const selectedPlan = tomorrowPlans.find(p => p.id === selectedPlanId);
            if (selectedPlan?.linked_weekly_task_id) return; 
            setEditPlanCategory(code);
        } else {
            setAddForm((f) => ({ ...f, category: code }));
        }
    } else {
        console.warn("Attempted to select an invalid or inactive category code:", code);
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
    if (isEditingPlan && selectedPlanId === plan.id) return;

    setSelectedPlanId(plan.id);
    const planCategoryInfo = categories.find(c => c.code === plan.category_code);
    if (planCategoryInfo && planCategoryInfo.isActive) {
        setEditPlanCategory(plan.category_code);
    } else {
        const firstActive = categories.find(c => c.isActive);
        setEditPlanCategory(firstActive ? firstActive.code : "EX");
    }
    setEditPlanDuration(plan.duration ? String(plan.duration) : "");
    setEditPlanComment(plan.comment || "");
    setEditPlanSubcode(plan.subcode || "");
    setIsEditingPlan(true);
    setDurationError(null);
  }

  function handleEditPlanCancel() {
    setIsEditingPlan(false);
    setSelectedPlanId(null);
    setDurationError(null);
    // Optionally reset edit form fields to initialAddForm or last selected plan's data
    // For now, just exit editing mode. The form will show "Add" fields.
  }

  function handleAddAllWeeklyTasks() {
    const tasksThatCouldBeAdded = relevantWeeklyTasks.filter(task => !addedWeeklyTaskIds.has(task.id));
    if (tasksThatCouldBeAdded.length === 0) return;

    const directAddTasksInfo: any[] = [];
    const activationNeeded: WeeklyTaskUI[] = [];

    tasksThatCouldBeAdded.forEach(task => {
        const categoryInfo = categories.find(c => c.code === task.category_code);
        if (categoryInfo && categoryInfo.isActive) {
            directAddTasksInfo.push({
                id: task.id, 
                category_code: task.category_code,
                comment: task.comment,
                subcode: task.subcode,
            });
        } else {
            activationNeeded.push(task);
        }
    });

    if (directAddTasksInfo.length > 0) {
        const formData = new FormData();
        formData.append("intent", "addAllPlansFromWeeklyTasks");
        formData.append("tasks", JSON.stringify(directAddTasksInfo));
        fetcher.submit(formData, { method: "post" });
    }

    if (activationNeeded.length > 0) {
        setPendingAddAllPlansQueue(activationNeeded.map(task => ({
            id: task.id,
            category_code: task.category_code,
            comment: task.comment,
            subcode: task.subcode,
            date: DateTime.now().toISODate(),
            duration: undefined,
            is_completed: false,
            profile_id: profileId,
            linked_weekly_task_id: task.id,
        })));
        processNextPendingPlanForActivation(activationNeeded.map(task => ({
            id: task.id,
            category_code: task.category_code,
            comment: task.comment,
            subcode: task.subcode,
            date: DateTime.now().toISODate(),
            duration: undefined,
            is_completed: false,
            profile_id: profileId,
            linked_weekly_task_id: task.id,
        })));
    }
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
                                const categoryInfo = categories.find(c => c.code === task.category_code);
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
                                    <span className={`text-2xl ${categoryInfo ? getCategoryColor(categoryInfo, task.category_code) : 'text-gray-500'}`}>{categoryInfo?.icon || '❓'}</span>
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
            
            <CategorySelector
              categories={categories.filter(cat => cat.isActive)}
              selectedCategoryCode={currentFormCategory}
              onSelectCategory={handleCategorySelect}
              disabled={(isEditingPlan && isCategoryDisabledForEdit) || (fetcher.state !== 'idle' && fetcher.formData?.get('intent') === (isEditingPlan ? 'updatePlan' : 'addPlan'))}
              instanceId="tomorrow-page-selector"
            />
            
            <input type="hidden" name="category_code" value={currentFormCategory} />
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
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
                    const categoryInfo = categories.find(c => c.code === plan.category_code);
                  return (
                    <tr key={plan.id} className={`border-b ${isEditingPlan && selectedPlanId === plan.id ? 'bg-accent/30' : 'cursor-pointer hover:bg-muted/50'}`} onClick={() => !isEditingPlan && handlePlanRowClick(plan)}>
                      <td className="py-2 px-2 flex items-center gap-2">
                          <span className={`text-2xl ${categoryInfo ? getCategoryColor(categoryInfo, plan.category_code) : 'text-gray-500'}`}>{categoryInfo?.icon || '❓'}</span>
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

      {/* Dialog for activating category and adding single weekly task */}
      {showActivatePlanDialog && planForActivation && (
        <AlertDialog open={showActivatePlanDialog} onOpenChange={setShowActivatePlanDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>비활성 카테고리</AlertDialogTitle>
                    <AlertDialogDescription>
                        선택한 계획의 카테고리
                        '{categories.find(c => c.code === planForActivation.category_code)?.label || planForActivation.category_code}'
                        는 현재 비활성 상태입니다.
                        이 기록을 추가하려면 카테고리를 활성화해야 합니다. 활성화하고 기록을 추가하시겠습니까?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => {
                        setShowActivatePlanDialog(false);
                        const currentPlanId = planForActivation?.id; // Store before nullifying
                        setPlanForActivation(null);

                        if (currentPlanId && pendingAddAllPlansQueue.some(p => p.id === currentPlanId)) {
                            const nextQueue = pendingAddAllPlansQueue.filter(p => p.id !== currentPlanId);
                            setPendingAddAllPlansQueue(nextQueue);
                            // processNextPendingPlanForActivation 함수는 다음 단계에서 정의합니다.
                            // 일단 호출 부분만 남겨둡니다.
                            if (nextQueue.length > 0) {
                                // processNextPendingPlanForActivation(nextQueue); // 다음 단계에서 정의
                            }
                        }
                    }}>취소</AlertDialogCancel>
                    <AlertDialogAction
                        type="button"
                        onClick={() => {
                            if (planForActivation) {
                                const formData = new FormData();
                                formData.append("intent", "activateCategoryAndAddRecordFromPlan");
                                // ... 나머지 formData 설정은 동일
                                formData.append("planId", planForActivation.id);
                                formData.append("category_code_to_activate", planForActivation.category_code);
                                if (planForActivation.subcode) formData.append("subcode", planForActivation.subcode);
                                if (planForActivation.duration) formData.append("duration", planForActivation.duration.toString());
                                formData.append("comment", planForActivation.comment || '');
                                formData.append("linked_plan_id", planForActivation.id);
                                formData.append("isCustomCategory", String(categories.find(c=>c.code === planForActivation.category_code)?.isCustom || false));
                                fetcher.submit(formData, { method: "post" });
                            }
                        }}
                    >
                        활성화하고 추가
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
} 