import pkg from '@supabase/supabase-js';
import type { Database } from 'database.types';
import type { SupabaseClient } from "@supabase/supabase-js";
import { CATEGORIES as DEFAULT_CATEGORIES } from "~/common/types/daily";
import { getUserCategories } from "~/features/settings/queries";
// import type { Database } from "~/supa-client";

// Types from database.types.ts
type ProfileTable = Database['public']['Tables']['profiles'];
export type Profile = ProfileTable['Row'];
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

export async function getUserProfile(
  client: SupabaseClient<Database>,
  { username }: { username: string }
): Promise<Profile | null> {
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return data;
}

export async function getUserProfileById(
  client: SupabaseClient<Database>,
  { profileId }: { profileId: string }
) {
  const { data, error } = await client
    .from("profiles")
    .select(
      `
      profile_id,
      username,
      full_name,
      avatar_url,
      headline,
      bio,
      daily_record_visibility
    `
    )
    .eq("profile_id", profileId)
    .single();

  if (error) {
    console.error("Error fetching user profile by ID:", error);
    return null;
  }

  return data;
}

export type Post = Database["public"]["Tables"]["community_posts"]["Row"];

export async function getUserPosts(
  client: SupabaseClient<Database>,
  { userId }: { userId: string }
): Promise<Post[] | null> {
  const { data, error } = await client
    .from("community_posts")
    .select("*")
    .eq("profile_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user posts:", error);
    return null;
  }

  return data;
}

export async function getFollowStatus(
  client: SupabaseClient<Database>,
  { followerId, followingId }: { followerId: string; followingId: string }
): Promise<{ isFollowing: boolean }> {
  const { data, error, count } = await client
    .from("follows")
    .select("*", { count: "exact" })
    .eq("follower_id", followerId)
    .eq("following_id", followingId);

  if (error) {
    console.error("Error fetching follow status:", error);
    return { isFollowing: false };
  }

  return { isFollowing: (count ?? 0) > 0 };
}

export async function getFollowCounts(
  client: SupabaseClient<Database>,
  { userId }: { userId: string }
): Promise<{ followers: number; following: number }> {
  const { count: followers, error: followersError } = await client
    .from("follows")
    .select("*", { count: "exact" })
    .eq("following_id", userId);

  const { count: following, error: followingError } = await client
    .from("follows")
    .select("*", { count: "exact" })
    .eq("follower_id", userId);

  if (followersError || followingError) {
    console.error("Error fetching follow counts:", { followersError, followingError });
    return { followers: 0, following: 0 };
  }

  return { followers: followers ?? 0, following: following ?? 0 };
}

export async function followUser(
  client: SupabaseClient<Database>,
  { followerId, followingId }: { followerId: string; followingId: string }
) {
  const { error } = await client
    .from("follows")
    .insert({ follower_id: followerId, following_id: followingId });

  if (error) {
    console.error("Error following user:", error);
    throw new Error(error.message);
  }
}

export async function unfollowUser(
  client: SupabaseClient<Database>,
  { followerId, followingId }: { followerId: string; followingId: string }
) {
  const { error } = await client
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);

  if (error) {
    console.error("Error unfollowing user:", error);
    throw new Error(error.message);
  }
}

export async function updateUserProfile(
  client: SupabaseClient<Database>,
  {
    profileId,
    updates,
  }: {
    profileId: string;
    updates: {
      full_name?: string;
      headline?: string;
      bio?: string;
      avatar_url?: string;
      daily_record_visibility?: string;
    };
  }
) {
  const { data, error } = await client
    .from("profiles")
    .update(updates)
    .eq("profile_id", profileId)
    .select()
    .single();

  if (error) {
    console.error("Error updating user profile:", error);
    throw new Error(error.message);
  }
  return data;
}

export type DailyRecordWithCategory =
  Database["public"]["Tables"]["daily_records"]["Row"] & {
    category: {
      icon: string | null;
      label: string | null;
    } | null;
  };

export async function getVisibleDailyRecords(
  client: SupabaseClient<Database>,
  {
    profileId,
    viewerId,
  }: {
    profileId: string;
    viewerId: string | null;
  }
) {
  const { data: profile } = await client
    .from("profiles")
    .select("daily_record_visibility")
    .eq("profile_id", profileId)
    .single();

  if (!profile) {
    return { error: "Profile not found", data: null };
  }

  if (profile.daily_record_visibility === "private") {
    return { error: "private", data: [] };
  }

  if (profile.daily_record_visibility === "followers") {
    if (!viewerId || profileId === viewerId) {
      // Show records if it's the owner's profile
    } else {
      const { data: followStatus } = await client
        .from("follows")
        .select("follower_id")
        .eq("follower_id", viewerId)
        .eq("following_id", profileId)
        .maybeSingle();

      if (!followStatus) {
        return { error: "not_following", data: [] };
      }
    }
  }

  const { data, error } = await client
      .from("daily_records")
    .select("*, memos (*)")
    .eq("profile_id", profileId)
      .eq("is_public", true)
      .order("date", { ascending: false })
    .limit(30);

  if (error) {
    console.error("Error fetching daily records:", error);
    return { error: error.message, data: null };
  }

  return { data, error: null };
}