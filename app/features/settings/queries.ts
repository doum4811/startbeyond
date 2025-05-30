import client from "~/supa-client";
import type { Database } from "database.types";

// Types from database.types.ts
type UserCategoryTable = Database['public']['Tables']['user_categories'];
type UserCategory = UserCategoryTable['Row'];
type UserCategoryInsert = UserCategoryTable['Insert'];

type UserSubcodeTable = Database['public']['Tables']['user_subcodes'];
type UserSubcode = UserSubcodeTable['Row'];
type UserSubcodeInsert = UserSubcodeTable['Insert'];

type UserCodeSettingTable = Database['public']['Tables']['user_code_settings'];
type UserCodeSetting = UserCodeSettingTable['Row'];
type UserCodeSettingInsert = UserCodeSettingTable['Insert'];

type UserDefaultCodePreferenceTable = Database['public']['Tables']['user_default_code_preferences'];
type UserDefaultCodePreference = UserDefaultCodePreferenceTable['Row'];
type UserDefaultCodePreferenceInsert = UserDefaultCodePreferenceTable['Insert'];

// Column constants
const USER_CATEGORY_COLUMNS = `
  id,
  profile_id,
  code,
  label,
  icon,
  color,
  is_active,
  sort_order,
  created_at,
  updated_at
`;

const USER_SUBCODE_COLUMNS = `
  id,
  profile_id,
  parent_category_code,
  subcode,
  description,
  is_favorite,
  frequency_score,
  created_at,
  updated_at
`;

const USER_CODE_SETTING_COLUMNS = `
  id,
  profile_id,
  enable_autocomplete,
  enable_recommendation,
  recommendation_source,
  created_at,
  updated_at
`;

const USER_DEFAULT_CODE_PREFERENCE_COLUMNS = `
  id,
  profile_id,
  default_category_code,
  is_active,
  created_at,
  updated_at
`;

// == User Categories (Custom Codes) ==

export async function getUserCategories(
  { profileId }: { profileId: string }
) {
  const { data, error } = await client
    .from("user_categories")
    .select(USER_CATEGORY_COLUMNS)
    .eq("profile_id", profileId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching user categories:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function getUserCategoryById(
  { categoryId, profileId }: { categoryId: string; profileId: string }
) {
  const { data, error } = await client
    .from("user_categories")
    .select(USER_CATEGORY_COLUMNS)
    .eq("id", categoryId)
    .eq("profile_id", profileId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error("Error fetching user category by ID:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function createUserCategory(
  categoryData: UserCategoryInsert
) {
  const { data, error } = await client
    .from("user_categories")
    .insert(categoryData)
    .select(USER_CATEGORY_COLUMNS)
    .single();

  if (error) {
    console.error("Error creating user category:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function updateUserCategory(
  { categoryId, profileId, updates }: { categoryId: string; profileId: string; updates: Partial<Omit<UserCategory, "id" | "profile_id" | "created_at" | "updated_at">> }
) {
  const { data, error } = await client
    .from("user_categories")
    .update(updates)
    .eq("id", categoryId)
    .eq("profile_id", profileId)
    .select(USER_CATEGORY_COLUMNS)
    .single();

  if (error) {
    console.error("Error updating user category:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function deleteUserCategory(
  { categoryId, profileId }: { categoryId: string; profileId: string }
) {
  // Consider deleting related user_subcodes or warning the user.
  const { error } = await client
    .from("user_categories")
    .delete()
    .eq("id", categoryId)
    .eq("profile_id", profileId);

  if (error) {
    console.error("Error deleting user category:", error.message);
    throw new Error(error.message);
  }
  return true;
}

// == User Subcodes ==

export async function getUserSubcodesByParentCode(
  { profileId, parentCategoryCode }: { profileId: string; parentCategoryCode: string }
) {
  const { data, error } = await client
    .from("user_subcodes")
    .select(USER_SUBCODE_COLUMNS)
    .eq("profile_id", profileId)
    .eq("parent_category_code", parentCategoryCode)
    .order("subcode", { ascending: true });

  if (error) {
    console.error("Error fetching user subcodes by parent code:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function getAllUserSubcodes(
  { profileId }: { profileId: string }
) {
  const { data, error } = await client
    .from("user_subcodes")
    .select(USER_SUBCODE_COLUMNS)
    .eq("profile_id", profileId)
    .order("parent_category_code", { ascending: true })
    .order("subcode", { ascending: true });

  if (error) {
    console.error("Error fetching all user subcodes:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function getUserSubcodeById(
  { subcodeId, profileId }: { subcodeId: string; profileId: string }
) {
  const { data, error } = await client
    .from("user_subcodes")
    .select(USER_SUBCODE_COLUMNS)
    .eq("id", subcodeId)
    .eq("profile_id", profileId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error("Error fetching user subcode by ID:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function createUserSubcode(
  subcodeData: UserSubcodeInsert
) {
  const { data, error } = await client
    .from("user_subcodes")
    .insert(subcodeData)
    .select(USER_SUBCODE_COLUMNS)
    .single();

  if (error) {
    console.error("Error creating user subcode:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function updateUserSubcode(
  { subcodeId, profileId, updates }: { subcodeId: string; profileId: string; updates: Partial<Omit<UserSubcode, "id" | "profile_id" | "created_at" | "updated_at">> }
) {
  const { data, error } = await client
    .from("user_subcodes")
    .update(updates)
    .eq("id", subcodeId)
    .eq("profile_id", profileId)
    .select(USER_SUBCODE_COLUMNS)
    .single();

  if (error) {
    console.error("Error updating user subcode:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function deleteUserSubcode(
  { subcodeId, profileId }: { subcodeId: string; profileId: string }
) {
  const { error } = await client
    .from("user_subcodes")
    .delete()
    .eq("id", subcodeId)
    .eq("profile_id", profileId);

  if (error) {
    console.error("Error deleting user subcode:", error.message);
    throw new Error(error.message);
  }
  return true;
}

// == User Code Settings ==

export async function getUserCodeSettings(
  { profileId }: { profileId: string }
) {
  const { data, error } = await client
    .from("user_code_settings")
    .select(USER_CODE_SETTING_COLUMNS)
    .eq("profile_id", profileId)
    .single(); // Assuming one settings row per profile

  if (error) {
    if (error.code === 'PGRST116') return null; // No settings row yet for this profile
    console.error("Error fetching user code settings:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function upsertUserCodeSettings(
  settingsData: UserCodeSettingInsert
) {
  const { data, error } = await client
    .from("user_code_settings")
    .upsert(settingsData, { onConflict: 'profile_id' })
    .select(USER_CODE_SETTING_COLUMNS)
    .single();

  if (error) {
    console.error("Error upserting user code settings:", error.message);
    throw new Error(error.message);
  }
  return data;
}

// == User Default Code Preferences ==

export async function getUserDefaultCodePreferences(
  { profileId }: { profileId: string }
) {
  const { data, error } = await client
    .from("user_default_code_preferences")
    .select(USER_DEFAULT_CODE_PREFERENCE_COLUMNS)
    .eq("profile_id", profileId);

  if (error) {
    console.error("Error fetching user default code preferences:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function getUserDefaultCodePreference(
  { profileId, defaultCategoryCode }: { profileId: string; defaultCategoryCode: string }
) {
  const { data, error } = await client
    .from("user_default_code_preferences")
    .select(USER_DEFAULT_CODE_PREFERENCE_COLUMNS)
    .eq("profile_id", profileId)
    .eq("default_category_code", defaultCategoryCode)
    .maybeSingle(); // It might exist or not

  if (error) {
    console.error("Error fetching single user default code preference:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function upsertUserDefaultCodePreference(
  preferenceData: UserDefaultCodePreferenceInsert
) {
  const { data, error } = await client
    .from("user_default_code_preferences")
    .upsert(preferenceData, { onConflict: 'profile_id, default_category_code' })
    .select(USER_DEFAULT_CODE_PREFERENCE_COLUMNS)
    .single();

  if (error) {
    console.error("Error upserting user default code preference:", error.message);
    throw new Error(error.message);
  }
  return data;
}

// Batch update for default code preferences might be useful if settings UI allows multiple changes at once.
// export async function updateUserDefaultCodePreferences(
//   profileId: string,
//   preferences: Array<Partial<UserDefaultCodePreferenceInsert> & { default_category_code: string }>
// ) {
//   const updates = preferences.map(pref => (
//     client.from("user_default_code_preferences")
//       .upsert({ ...pref, profile_id: profileId }, { onConflict: 'profile_id, default_category_code' })
//       .select(USER_DEFAULT_CODE_PREFERENCE_COLUMNS)
//       .single()
//   ));
  
//   const results = await Promise.all(updates.map(p => p.then(res => res.data).catch(err => ({ error: err }))));
  
//   const errors = results.filter(r => r && (r as any).error);
//   if (errors.length > 0) {
//     console.error("Errors updating batch default code preferences:", errors);
//     // Handle partial success or throw a combined error
//     throw new Error(`Failed to update some default code preferences. First error: ${(errors[0] as any).error.message}`);
//   }
  
//   return results.map(r => (r as UserDefaultCodePreference | null)).filter(r => r !== null) as UserDefaultCodePreference[];
// } 