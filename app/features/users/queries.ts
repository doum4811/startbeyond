import pkg from '@supabase/supabase-js';
import type { Database } from 'database.types';
// import type { Database } from "~/supa-client";

// Types from database.types.ts
type ProfileTable = Database['public']['Tables']['profiles'];
type Profile = ProfileTable['Row'];
type ProfileInsert = ProfileTable['Insert']; // Usually handled by auth trigger
type ProfileUpdate = ProfileTable['Update'];

// Column constants
const PROFILE_COLUMNS = `
  profile_id,
  username,
  full_name,
  avatar_url,
  bio,
  headline,
  created_at,
  updated_at,
  stats,
  views
`;

// == Profiles ==

export const getProfileById = async (
  client: pkg.SupabaseClient<Database>,
  { profileId }: { profileId: string }
) => {
  const { data, error } = await client
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("profile_id", profileId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error("Error fetching profile by ID:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export const getProfileByUsername = async (
  client: pkg.SupabaseClient<Database>,
  { username }: { username: string }
) => {
  const { data, error } = await client
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("username", username)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error("Error fetching profile by username:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export const updateProfile = async (
  client: pkg.SupabaseClient<Database>,
  { profileId, updates }: { profileId: string; updates: ProfileUpdate }
) => {
  // Ensure profile_id from updates is not overriding the path/session profileId
  const { profile_id, ...safeUpdates } = updates;
  
  const { data, error } = await client
    .from("profiles")
    .update(safeUpdates)
    .eq("profile_id", profileId)
    .select(PROFILE_COLUMNS)
    .single();

  if (error) {
    console.error("Error updating profile:", error.message);
    throw new Error(error.message);
  }
  return data;
}

// Example of a more complex query if needed later (similar to the reference):
// export async function getUserProfileWithStats(
//   { profileId }: { profileId: string }
// ) {
//   const { data, error } = await client
//     .from("profiles")
//     .select(`
//       ${PROFILE_COLUMNS},
//       daily_records_count:daily_records(count),
//       memos_count:memos(count)
//     `)
//     .eq("profile_id", profileId)
//     .single();

//   if (error) {
//     if (error.code === 'PGRST116') return null;
//     console.error("Error fetching profile with stats:", error.message);
//     throw new Error(error.message);
//   }
//   return data;
// }

// Note: Profile creation is typically handled by a database trigger 
// (e.g., handle_new_user) when a new user signs up in auth.users table.
// Direct creation of a profile via API might be less common unless specific admin tools are built. 

export const getUserById = async (
  client: pkg.SupabaseClient<Database>,
  { id }: { id: string }
) => {
  const { data, error } = await client
    .from("profiles")
    .select(
      `
        profile_id,
        full_name,
        username,
        avatar_url 
        `
    )
    .eq("profile_id", id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
};