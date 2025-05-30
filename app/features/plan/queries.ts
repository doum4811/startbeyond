import client from "~/supa-client";
import type { Database } from "database.types";

// Types from database.types.ts
type DailyPlanTable = Database['public']['Tables']['daily_plans'];
type DailyPlan = DailyPlanTable['Row'];
type DailyPlanInsert = DailyPlanTable['Insert'];

type WeeklyTaskTable = Database['public']['Tables']['weekly_tasks'];
type WeeklyTask = WeeklyTaskTable['Row'];
type WeeklyTaskInsert = WeeklyTaskTable['Insert'];

type WeeklyNoteTable = Database['public']['Tables']['weekly_notes'];
type WeeklyNote = WeeklyNoteTable['Row'];
type WeeklyNoteInsert = WeeklyNoteTable['Insert'];

type MonthlyGoalTable = Database['public']['Tables']['monthly_goals'];
type MonthlyGoal = MonthlyGoalTable['Row'];
type MonthlyGoalInsert = MonthlyGoalTable['Insert'];

type MonthlyReflectionTable = Database['public']['Tables']['monthly_reflections'];
type MonthlyReflection = MonthlyReflectionTable['Row'];
type MonthlyReflectionInsert = MonthlyReflectionTable['Insert'];

// Column constants
const DAILY_PLAN_COLUMNS = `
  id,
  profile_id,
  plan_date,
  category_code,
  subcode,
  duration_minutes,
  comment,
  is_completed,
  linked_weekly_task_id,
  created_at,
  updated_at
`;

const WEEKLY_TASK_COLUMNS = `
  id,
  profile_id,
  week_start_date,
  category_code,
  subcode,
  comment,
  days,
  is_locked,
  sort_order,
  from_monthly_goal_id,
  created_at,
  updated_at
`;

const WEEKLY_NOTE_COLUMNS = `
  id,
  profile_id,
  week_start_date,
  critical_success_factor,
  weekly_see,
  words_of_praise,
  weekly_goal_note,
  created_at,
  updated_at
`;

const MONTHLY_GOAL_COLUMNS = `
  id,
  profile_id,
  month_date,
  title,
  description,
  category_code,
  success_criteria,
  weekly_breakdown,
  is_completed,
  created_at,
  updated_at
`;

const MONTHLY_REFLECTION_COLUMNS = `
  id,
  profile_id,
  month_date,
  monthly_reflection,
  monthly_notes,
  created_at,
  updated_at
`;

// == Daily Plans ==

export async function getDailyPlansByDate(
  { profileId, date }: { profileId: string; date: string /* YYYY-MM-DD */ }
) {
  const { data, error } = await client
    .from("daily_plans")
    .select(DAILY_PLAN_COLUMNS)
    .eq("profile_id", profileId)
    .eq("plan_date", date)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching daily plans by date:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function getDailyPlanById(
  { planId, profileId }: { planId: string; profileId: string }
) {
  const { data, error } = await client
    .from("daily_plans")
    .select(DAILY_PLAN_COLUMNS)
    .eq("id", planId)
    .eq("profile_id", profileId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error("Error fetching daily plan by ID:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function createDailyPlan(
  planData: DailyPlanInsert
) {
  const { data, error } = await client
    .from("daily_plans")
    .insert(planData)
    .select(DAILY_PLAN_COLUMNS)
    .single();

  if (error) {
    console.error("Error creating daily plan:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function updateDailyPlan(
  { planId, profileId, updates }: { planId: string; profileId: string; updates: Partial<Omit<DailyPlan, "id" | "profile_id" | "created_at" | "updated_at">> }
) {
  const { data, error } = await client
    .from("daily_plans")
    .update(updates)
    .eq("id", planId)
    .eq("profile_id", profileId)
    .select(DAILY_PLAN_COLUMNS)
    .single();

  if (error) {
    console.error("Error updating daily plan:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function deleteDailyPlan(
  { planId, profileId }: { planId: string; profileId: string }
) {
  const { error } = await client
    .from("daily_plans")
    .delete()
    .eq("id", planId)
    .eq("profile_id", profileId);

  if (error) {
    console.error("Error deleting daily plan:", error.message);
    throw new Error(error.message);
  }
  return true;
}

// == Weekly Tasks ==

export async function getWeeklyTasksByWeek(
  { profileId, weekStartDate }: { profileId: string; weekStartDate: string /* YYYY-MM-DD, typically a Monday */ }
) {
  const { data, error } = await client
    .from("weekly_tasks")
    .select(WEEKLY_TASK_COLUMNS)
    .eq("profile_id", profileId)
    .eq("week_start_date", weekStartDate)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching weekly tasks by week:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function getWeeklyTaskById(
  { taskId, profileId }: { taskId: string; profileId: string }
) {
  const { data, error } = await client
    .from("weekly_tasks")
    .select(WEEKLY_TASK_COLUMNS)
    .eq("id", taskId)
    .eq("profile_id", profileId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error("Error fetching weekly task by ID:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function createWeeklyTask(
  taskData: WeeklyTaskInsert
) {
  const { data, error } = await client
    .from("weekly_tasks")
    .insert(taskData)
    .select(WEEKLY_TASK_COLUMNS)
    .single();

  if (error) {
    console.error("Error creating weekly task:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function updateWeeklyTask(
  { taskId, profileId, updates }: { taskId: string; profileId: string; updates: Partial<Omit<WeeklyTask, "id" | "profile_id" | "created_at" | "updated_at">> }
) {
  const { data, error } = await client
    .from("weekly_tasks")
    .update(updates)
    .eq("id", taskId)
    .eq("profile_id", profileId)
    .select(WEEKLY_TASK_COLUMNS)
    .single();

  if (error) {
    console.error("Error updating weekly task:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function deleteWeeklyTask(
  { taskId, profileId }: { taskId: string; profileId: string }
) {
  const { error } = await client
    .from("weekly_tasks")
    .delete()
    .eq("id", taskId)
    .eq("profile_id", profileId);

  if (error) {
    console.error("Error deleting weekly task:", error.message);
    throw new Error(error.message);
  }
  return true;
}


// == Weekly Notes ==

export async function getWeeklyNoteByWeek(
  { profileId, weekStartDate }: { profileId: string; weekStartDate: string /* YYYY-MM-DD, typically a Monday */ }
) {
  const { data, error } = await client
    .from("weekly_notes")
    .select(WEEKLY_NOTE_COLUMNS)
    .eq("profile_id", profileId)
    .eq("week_start_date", weekStartDate)
    .single(); // Assuming one note document per profile per week

  if (error) {
    if (error.code === 'PGRST116') return null; // No note for this week yet
    console.error("Error fetching weekly note by week:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function upsertWeeklyNote(
  noteData: WeeklyNoteInsert
) {
  const { data, error } = await client
    .from("weekly_notes")
    .upsert(noteData, { onConflict: 'profile_id, week_start_date' })
    .select(WEEKLY_NOTE_COLUMNS)
    .single();

  if (error) {
    console.error("Error upserting weekly note:", error.message);
    throw new Error(error.message);
  }
  return data;
}

// == Monthly Goals ==

export async function getMonthlyGoalsByMonth(
  { profileId, monthDate }: { profileId: string; monthDate: string /* YYYY-MM-01 */ }
) {
  const { data, error } = await client
    .from("monthly_goals")
    .select(MONTHLY_GOAL_COLUMNS)
    .eq("profile_id", profileId)
    .eq("month_date", monthDate) // Ensure month_date is stored consistently, e.g., YYYY-MM-01
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching monthly goals by month:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function getMonthlyGoalById(
  { goalId, profileId }: { goalId: string; profileId: string }
) {
  const { data, error } = await client
    .from("monthly_goals")
    .select(MONTHLY_GOAL_COLUMNS)
    .eq("id", goalId)
    .eq("profile_id", profileId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error("Error fetching monthly goal by ID:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function createMonthlyGoal(
  goalData: MonthlyGoalInsert
) {
  const { data, error } = await client
    .from("monthly_goals")
    .insert(goalData)
    .select(MONTHLY_GOAL_COLUMNS)
    .single();

  if (error) {
    console.error("Error creating monthly goal:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function updateMonthlyGoal(
  { goalId, profileId, updates }: { goalId: string; profileId: string; updates: Partial<Omit<MonthlyGoal, "id" | "profile_id" | "created_at" | "updated_at">> }
) {
  const { data, error } = await client
    .from("monthly_goals")
    .update(updates)
    .eq("id", goalId)
    .eq("profile_id", profileId)
    .select(MONTHLY_GOAL_COLUMNS)
    .single();

  if (error) {
    console.error("Error updating monthly goal:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function deleteMonthlyGoal(
  { goalId, profileId }: { goalId: string; profileId: string }
) {
  const { error } = await client
    .from("monthly_goals")
    .delete()
    .eq("id", goalId)
    .eq("profile_id", profileId);

  if (error) {
    console.error("Error deleting monthly goal:", error.message);
    throw new Error(error.message);
  }
  return true;
}

// == Monthly Reflections ==

export async function getMonthlyReflectionByMonth(
  { profileId, monthDate }: { profileId: string; monthDate: string /* YYYY-MM-01 */ }
) {
  const { data, error } = await client
    .from("monthly_reflections")
    .select(MONTHLY_REFLECTION_COLUMNS)
    .eq("profile_id", profileId)
    .eq("month_date", monthDate) // Ensure month_date is stored consistently
    .single(); // Assuming one reflection document per profile per month

  if (error) {
    if (error.code === 'PGRST116') return null; // No reflection for this month yet
    console.error("Error fetching monthly reflection by month:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function upsertMonthlyReflection(
  reflectionData: MonthlyReflectionInsert
) {
  const { data, error } = await client
    .from("monthly_reflections")
    .upsert(reflectionData, { onConflict: 'profile_id, month_date' })
    .select(MONTHLY_REFLECTION_COLUMNS)
    .single();

  if (error) {
    console.error("Error upserting monthly reflection:", error.message);
    throw new Error(error.message);
  }
  return data;
}

// Note: Delete functions for weekly_notes and monthly_reflections might not be common
// as they are typically unique per period and profile, and are updated via upsert.
// If explicit deletion is needed, it can be added similarly to other delete functions. 