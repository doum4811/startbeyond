
import pkg from '@supabase/supabase-js';
import type { Database } from 'database.types';
// import type { Database } from "~/supa-client";

// Types from database.types.ts
type ShareSettingsTable = Database['public']['Tables']['share_settings'];
type ShareSetting = ShareSettingsTable['Row'];
type ShareSettingInsert = ShareSettingsTable['Insert'];

// Assuming daily_records is used for heatmap data
type DailyRecordTable = Database['public']['Tables']['daily_records'];
type DailyRecord = DailyRecordTable['Row'];

// Column constants
const SHARE_SETTING_COLUMNS = `
  id,
  profile_id,
  is_public,
  include_records,
  include_daily_notes,
  include_memos,
  include_stats,
  share_link_token,
  created_at,
  updated_at
`;

// For heatmap, we primarily need date and a measure of activity
const DAILY_RECORD_HEATMAP_COLUMNS = `
  date,
  duration_minutes,
  id
`; // id can be used for COUNT aggregation if needed

// == Share Settings ==

export const getShareSettings = async (
  client: pkg.SupabaseClient<Database>,
  { profileId }: { profileId: string }
) => {
  const { data, error } = await client
    .from("share_settings")
    .select(SHARE_SETTING_COLUMNS)
    .eq("profile_id", profileId)
    .maybeSingle(); // User might not have settings yet

  if (error) {
    // PGRST116 means no rows found, which is acceptable here.
    if (error.code === 'PGRST116') return null; 
    console.error("Error fetching share settings:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export const upsertShareSettings = async (
  client: pkg.SupabaseClient<Database>,
  settingsData: ShareSettingInsert
) => {
  const { data, error } = await client
    .from("share_settings")
    .upsert(settingsData, { onConflict: 'profile_id' })
    .select(SHARE_SETTING_COLUMNS)
    .single();

  if (error) {
    console.error("Error upserting share settings:", error.message);
    throw new Error(error.message);
  }
  return data;
}

// == Statistics Data ==

export interface YearlyActivity {
  date: string; // YYYY-MM-DD
  count: number; // Number of records or sum of durations, etc.
}

export const getYearlyActivityHeatmapData = async (
  client: pkg.SupabaseClient<Database>,
  { profileId, year }: { profileId: string; year: number }
): Promise<YearlyActivity[]> => {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const { data, error } = await client
    .from("daily_records")
    .select(DAILY_RECORD_HEATMAP_COLUMNS) // Select fewer columns for efficiency
    .eq("profile_id", profileId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching yearly activity data:", error.message);
    throw new Error(error.message);
  }

  if (!data) return [];

  // Process data for heatmap: group by date and count records or sum duration
  // This example will count records per day.
  // For summing duration_minutes, ensure nulls are handled (e.g., COALESCE in SQL or filter/map here)
  const activityByDate = data.reduce((acc: Record<string, number>, record: Pick<DailyRecord, 'date'>) => {
    const dateStr = record.date;
    acc[dateStr] = (acc[dateStr] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(activityByDate).map(([date, count]) => ({ date, count }));
}

/**
 * Example: Get category distribution for a given period.
 * This query might be better implemented as a database view or function for performance 
 * if it involves complex aggregations or is frequently used.
 */
export const getCategoryDistribution = async (
  client: pkg.SupabaseClient<Database>,
  { profileId, startDate, endDate }: { profileId: string; startDate: string; endDate: string }
) => {
  // Supabase client does not directly support GROUP BY with typed responses easily for complex aggregates.
  // For complex aggregations, consider using a PostgREST function (RPC) or a view.
  // This is a simplified client-side aggregation for demonstration.
  
  // Alternative 1: Fetch raw data and aggregate in JS (less efficient for large datasets)
  const { data, error } = await client
    .from("daily_records")
    .select("category_code, id") // Fetch relevant fields
    .eq("profile_id", profileId)
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) {
    console.error("Error fetching data for category distribution:", error.message);
    throw new Error(error.message);
  }
  if (!data) return [];

  const distribution = data.reduce((acc: Record<string, number>, record) => {
    acc[record.category_code] = (acc[record.category_code] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(distribution).map(([category, count]) => ({ category, count }));

  // Alternative 2: Create a PostgreSQL function and call it via RPC
  /* 
  Example SQL function (in Supabase SQL editor):
  CREATE OR REPLACE FUNCTION get_category_distribution(p_profile_id UUID, p_start_date DATE, p_end_date DATE)
  RETURNS TABLE(category_code TEXT, count BIGINT) AS $$
  BEGIN
    RETURN QUERY
    SELECT dr.category_code, COUNT(dr.id)
    FROM daily_records dr
    WHERE dr.profile_id = p_profile_id AND dr.date >= p_start_date AND dr.date <= p_end_date
    GROUP BY dr.category_code;
  END; 
  $$ LANGUAGE plpgsql;

  Then call it from client:
  const { data, error } = await client.rpc('get_category_distribution', {
    p_profile_id: profileId,
    p_start_date: startDate,
    p_end_date: endDate,
  });
  if (error) throw error;
  return data;
  */
}

// Add other stats-related query functions as needed. 