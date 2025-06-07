import pkg from '@supabase/supabase-js';
import type { Database } from "database.types";
import { DateTime } from "luxon";

// Types from database.types.ts
export type DailyRecordTable = Database['public']['Tables']['daily_records'];
export type DailyRecord = DailyRecordTable['Row'];
export type DailyRecordInsert = DailyRecordTable['Insert'];
export type DailyRecordUpdate = DailyRecordTable['Update'];

export type DailyNoteTable = Database['public']['Tables']['daily_notes'];
export type DailyNote = DailyNoteTable['Row'];
export type DailyNoteInsert = DailyNoteTable['Insert'];
// No DailyNoteUpdate as we typically upsert notes.

export type MemoTable = Database['public']['Tables']['memos'];
export type Memo = MemoTable['Row'];
export type MemoInsert = MemoTable['Insert'];
// No MemoUpdate, perhaps delete and re-create if needed, or add if specific fields are updatable.

export type DailyPlanTable = Database['public']['Tables']['daily_plans'];
export type DailyPlan = DailyPlanTable['Row'];
export type DailyPlanInsert = DailyPlanTable['Insert'];
export type DailyPlanUpdate = DailyPlanTable['Update'];

export type WeeklyTaskTable = Database['public']['Tables']['weekly_tasks'];
export type WeeklyTask = WeeklyTaskTable['Row'];
export type WeeklyTaskInsert = WeeklyTaskTable['Insert'];
export type WeeklyTaskUpdate = WeeklyTaskTable['Update'];

// Renaming to avoid conflict if MonthlyGoal is already a table type from Database
export type MonthlyGoalRow = Database['public']['Tables']['monthly_goals']['Row'];
export type MonthlyGoalInsert = Database['public']['Tables']['monthly_goals']['Insert'];
export type MonthlyGoalUpdate = Database['public']['Tables']['monthly_goals']['Update'];

export type WeeklyNoteTable = Database['public']['Tables']['weekly_notes'];
export type WeeklyNote = WeeklyNoteTable['Row'];
export type WeeklyNoteInsert = WeeklyNoteTable['Insert'];
export type WeeklyNoteUpdate = WeeklyNoteTable['Update'];

export type MonthlyReflectionTable = Database['public']['Tables']['monthly_reflections'];
export type MonthlyReflection = MonthlyReflectionTable['Row'];
export type MonthlyReflectionInsert = MonthlyReflectionTable['Insert'];
export type MonthlyReflectionUpdate = MonthlyReflectionTable['Update'];

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

export const getDailyPlansByDate = async (
  client: pkg.SupabaseClient<Database>,
  { profileId, date }: { profileId: string; date: string /* YYYY-MM-DD */ }
) => {
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

export const getDailyPlanById = async (
  client: pkg.SupabaseClient<Database>,
  { planId, profileId }: { planId: string; profileId: string }
) => {
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

export const createDailyPlan = async (
  client: pkg.SupabaseClient<Database>,
  planData: DailyPlanInsert
) => {
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

export const updateDailyPlan = async (
  client: pkg.SupabaseClient<Database>,
  { planId, profileId, updates }: { planId: string; profileId: string; updates: Partial<Omit<DailyPlan, "id" | "profile_id" | "created_at" | "updated_at">> }
) => {
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

export const deleteDailyPlan = async (
  client: pkg.SupabaseClient<Database>,
  { planId, profileId }: { planId: string; profileId: string }
) => {
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

export const getDailyPlansByPeriod = async (
  client: pkg.SupabaseClient<Database>,
  { profileId, startDate, endDate }: { profileId: string; startDate: string; endDate: string; }
) => {
  const { data, error } = await client
    .from("daily_plans")
    .select(DAILY_PLAN_COLUMNS)
    .eq("profile_id", profileId)
    .gte("plan_date", startDate)
    .lte("plan_date", endDate)
    .order("plan_date", { ascending: true });

  if (error) {
    console.error("Error fetching daily plans by period:", error.message);
    throw new Error(error.message);
  }
  return data;
};

// == Weekly Tasks ==

export const getWeeklyTasksByWeek = async (
  client: pkg.SupabaseClient<Database>,
  { profileId, weekStartDate }: { profileId: string; weekStartDate: string /* YYYY-MM-DD, typically a Monday */ }
) => {
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

export const getWeeklyTaskById = async (
  client: pkg.SupabaseClient<Database>,
  { taskId, profileId }: { taskId: string; profileId: string }
) => {
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

export const createWeeklyTask = async (
  client: pkg.SupabaseClient<Database>,
  taskData: WeeklyTaskInsert
) => {
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

export const updateWeeklyTask = async (
  client: pkg.SupabaseClient<Database>,
  { taskId, profileId, updates }: { taskId: string; profileId: string; updates: Partial<Omit<WeeklyTask, "id" | "profile_id" | "created_at" | "updated_at">> }
) => {
  const { data, error } = await client
    .from("weekly_tasks")
    .update(updates)
    .eq("id", taskId)
    .eq("profile_id", profileId)
    .select(WEEKLY_TASK_COLUMNS)
    .single();

  if (error) {
    console.error("[updateWeeklyTask] Supabase error object:", JSON.stringify(error, null, 2)); // Log the full error object
    // PGRST116: "Failed to find a unique row..." - The row was not found for update
    if (error.code === 'PGRST116') {
      console.warn(`[updateWeeklyTask] Task not found for update (taskId: ${taskId}, profileId: ${profileId}). No rows updated.`);
      return null;
    }
    // Log details for unexpected errors before re-throwing
    console.error(`[updateWeeklyTask] Unexpected error updating weekly task (taskId: ${taskId}, profileId: ${profileId}):`, error.message);
    throw new Error(error.message);
  }
  return data;
}

export const deleteWeeklyTask = async (
  client: pkg.SupabaseClient<Database>,
  { taskId, profileId }: { taskId: string; profileId: string }
) => {
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

export const getWeeklyNoteByWeek = async (
  client: pkg.SupabaseClient<Database>,
  { profileId, weekStartDate }: { profileId: string; weekStartDate: string /* YYYY-MM-DD, typically a Monday */ }
) => {
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

export const upsertWeeklyNote = async (
  client: pkg.SupabaseClient<Database>,
  noteData: WeeklyNoteInsert
) => {
  // Check if a note already exists for this profile and week
  const { data: existingNote, error: fetchError } = await client
    .from("weekly_notes")
    .select("id")
    .eq("profile_id", noteData.profile_id)
    .eq("week_start_date", noteData.week_start_date)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error("Error fetching existing weekly note for upsert:", fetchError.message);
    throw fetchError;
  }

  if (existingNote) {
    // Update existing note
    const updatePayload: Partial<WeeklyNoteUpdate> = {};
    if (noteData.critical_success_factor !== undefined) updatePayload.critical_success_factor = noteData.critical_success_factor;
    if (noteData.weekly_see !== undefined) updatePayload.weekly_see = noteData.weekly_see;
    if (noteData.words_of_praise !== undefined) updatePayload.words_of_praise = noteData.words_of_praise;
    if (noteData.weekly_goal_note !== undefined) updatePayload.weekly_goal_note = noteData.weekly_goal_note;
    
    // Ensure we only update if there's something to update to avoid empty updates triggering 'now()'
    if (Object.keys(updatePayload).length === 0) return existingNote as WeeklyNote;

    const { data, error } = await client
      .from("weekly_notes")
      .update(updatePayload)
      .eq("id", existingNote.id)
      .select(WEEKLY_NOTE_COLUMNS)
      .single();
    if (error) {
      console.error("Error updating weekly note:", error.message);
      throw error;
    }
    return data;
  } else {
    // Insert new note
    const insertPayload: WeeklyNoteInsert = {
        profile_id: noteData.profile_id,
        week_start_date: noteData.week_start_date,
        critical_success_factor: noteData.critical_success_factor ?? null,
        weekly_see: noteData.weekly_see ?? null,
        words_of_praise: noteData.words_of_praise ?? null,
        weekly_goal_note: noteData.weekly_goal_note ?? null,
    };
    if (noteData.id) insertPayload.id = noteData.id; 

    const { data, error } = await client
      .from("weekly_notes")
      .insert(insertPayload)
      .select(WEEKLY_NOTE_COLUMNS)
      .single();
    if (error) {
      console.error("Error inserting weekly note:", error.message);
      throw error;
    }
    return data;
  }
}

// == Monthly Goals ==

export const getMonthlyGoalsByMonth = async (
  client: pkg.SupabaseClient<Database>,
  { profileId, monthDate }: { profileId: string; monthDate: string /* YYYY-MM-01 */ }
) => {
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

export const getMonthlyGoalById = async (
  client: pkg.SupabaseClient<Database>,
  { goalId, profileId }: { goalId: string; profileId: string }
) => {
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

export const createMonthlyGoal = async (
  client: pkg.SupabaseClient<Database>,
  goalData: MonthlyGoalInsert
) => {
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

export const updateMonthlyGoal = async (
  client: pkg.SupabaseClient<Database>,
  { goalId, profileId, updates }: { goalId: string; profileId: string; updates: Partial<Omit<MonthlyGoalRow, "id" | "profile_id" | "created_at" | "updated_at">> }
) => {
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

export const deleteMonthlyGoal = async (
  client: pkg.SupabaseClient<Database>,
  { goalId, profileId }: { goalId: string; profileId: string }
) => {
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

export const getMonthlyReflectionByMonth = async (
  client: pkg.SupabaseClient<Database>,
  { profileId, monthDate }: { profileId: string; monthDate: string /* YYYY-MM-01 */ }
) => {
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

export const upsertMonthlyReflection = async (
  client: pkg.SupabaseClient<Database>,
  reflectionData: MonthlyReflectionInsert
) => {
  const upsertData: MonthlyReflectionInsert & { updated_at?: string } = {
    ...reflectionData,
    updated_at: new Date().toISOString(), // Explicitly set updated_at
  };

  const { data, error } = await client
    .from("monthly_reflections")
    .upsert(upsertData, { onConflict: 'profile_id, month_date' })
    .select(MONTHLY_REFLECTION_COLUMNS)
    .single();

  if (error) {
    console.error("Error updating monthly reflection:", error.message);
    throw error;
  }
  return data;
}

// Note: Delete functions for weekly_notes and monthly_reflections might not be common
// as they are typically unique per period and profile, and are updated via upsert.
// If explicit deletion is needed, it can be added similarly to other delete functions.

// Function to get monthly goals relevant for a specific week (e.g., current month's goals)
export const getMonthlyGoalsForWeek = async (
  client: pkg.SupabaseClient<Database>,
  { profileId, dateInWeek }: { profileId: string; dateInWeek: string }
): Promise<MonthlyGoalRow[] | null> => {
    const dt = DateTime.fromISO(dateInWeek);
    const monthFirstDay = dt.startOf('month').toISODate(); // YYYY-MM-01

    const { data, error } = await client
        .from('monthly_goals')
        .select('*') // Or MONTHLY_GOAL_COLUMNS for consistency
        .eq('profile_id', profileId)
        .eq('month_date', monthFirstDay!) // Corrected column name and logic
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching monthly goals for week:', error);
        throw error;
    }
    return data;
}

// Helper to get week number (1-4/5) within the month for a given date string
export const getWeekOfMonth = (dateString: string): number => {
  const date = DateTime.fromISO(dateString);
  const firstDayOfMonth = date.startOf('month');
  const firstDayOfWeek = date.startOf('week');
  
  let weekNumber;
  // If the week starts in the previous month, count weeks from the start of the current month's first week.
  if (firstDayOfWeek.month < date.month) {
    weekNumber = Math.ceil(date.day / 7);
  } else {
    // Difference in days from the start of the month's first week to the current day, then divide by 7.
    const daysSinceMonthStartWeek = date.diff(firstDayOfMonth.startOf('week'), 'days').days;
    weekNumber = Math.floor(daysSinceMonthStartWeek / 7) + 1;
  }
  return Math.min(Math.max(weekNumber, 1), 5); // Clamp between 1 and 5 (common for 4-4-5 or similar week counts in a month)
} 