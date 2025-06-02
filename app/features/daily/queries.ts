// import db from "~/db"
// import client from "~/supa-client";
// import type { SupabaseClient } from "@supabase/supabase-js";
// import type { Database } from "~/supa-client"; //  경로는 실제 위치에 맞게 조정 필요
// // import type { Profile } from "~/features/users/types"; // Profile 타입 정의가 있다면
import { DateTime } from "luxon";

import client from "~/supa-client";
import type { Database } from "database.types"; // Ensure this path is correct
import type { DailyNoteUI } from "./pages/daily-page";

// Assuming your database.types.ts is at the root, if it's elsewhere adjust the import path.
export type DailyRecordTable = Database['public']['Tables']['daily_records'];
export type DailyRecord = DailyRecordTable['Row'];
export type DailyRecordInsert = DailyRecordTable['Insert'];
export type DailyRecordUpdate = DailyRecordTable['Update'];

export type DailyNoteTable = Database['public']['Tables']['daily_notes'];
export type DailyNote = DailyNoteTable['Row'];
export type DailyNoteInsert = DailyNoteTable['Insert'];
export type DailyNoteUpdate = DailyNoteTable['Update'];

export type MemoTable = Database['public']['Tables']['memos'];
export type Memo = MemoTable['Row'];
export type MemoInsert = MemoTable['Insert'];
export type MemoUpdate = MemoTable['Update'];

// Type for Memos when fetched with the profile_id from the related daily_record
interface MemoWithRecordProfile extends Memo {
  daily_records: { profile_id: string } | null; 
}

interface MemoWithOptionalRecordProfile extends Memo {
  daily_records?: { profile_id: string } | null; // For updates where it might not be selected
}


// == Daily Records ==

const DAILY_RECORD_COLUMNS = `
  id,
  profile_id,
  date,
  category_code,
  subcode,
  duration_minutes,
  comment,
  is_public,
  linked_plan_id,
  created_at,
  updated_at
`;

const DAILY_NOTE_COLUMNS = `
  id,
  profile_id,
  date,
  content,
  created_at,
  updated_at
`;

const MEMO_COLUMNS = `
  id,
  profile_id,
  record_id,
  title,
  content,
  created_at,
  updated_at
`;

export async function getDailyRecordsByDate(
  { profileId, date }: { profileId: string; date: string /* "YYYY-MM-DD" */ }
) {
  const { data, error } = await client
    .from("daily_records")
    .select(DAILY_RECORD_COLUMNS)
    .eq("profile_id", profileId)
    .eq("date", date)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching daily records:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function getDailyRecordsByPeriod(
  { profileId, startDate, endDate }: { profileId: string; startDate: string; endDate: string }
) {
  const { data, error } = await client
    .from("daily_records")
    .select(DAILY_RECORD_COLUMNS)
    .eq("profile_id", profileId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching daily records for period:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function getDailyRecordById(
  { recordId, profileId }: { recordId: string; profileId: string }
) {
  const { data, error } = await client
    .from("daily_records")
    .select(DAILY_RECORD_COLUMNS)
    .eq("id", recordId)
    .eq("profile_id", profileId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error("Error fetching daily record by ID:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function createDailyRecord(
  recordData: DailyRecordInsert
) {
  const { data, error } = await client
    .from("daily_records")
    .insert(recordData)
    .select(DAILY_RECORD_COLUMNS)
    .single();

  if (error) {
    console.error("Error creating daily record:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function updateDailyRecord(
  { recordId, profileId, updates }: { recordId: string; profileId: string; updates: Partial<Omit<DailyRecord, "id" | "profile_id" | "created_at" | "updated_at">> }
) {
  const { data, error } = await client
    .from("daily_records")
    .update(updates)
    .eq("id", recordId)
    .eq("profile_id", profileId)
    .select(DAILY_RECORD_COLUMNS)
    .single();

  if (error) {
    console.error("[updateDailyRecord] Supabase error object:", JSON.stringify(error, null, 2)); // Log the full error object
    if (error.code === 'PGRST116') {
      console.warn(`[updateDailyRecord] Record not found for update (recordId: ${recordId}, profileId: ${profileId}). No rows updated.`);
      return null; 
    }
    console.error(`[updateDailyRecord] Unexpected error updating daily record (recordId: ${recordId}, profileId: ${profileId}):`, error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function deleteDailyRecord(
  { recordId, profileId }: { recordId: string; profileId: string }
) {
  // First, delete associated memos
  const { error: memoError } = await client
    .from("memos")
    .delete()
    .eq("record_id", recordId)
    .eq("profile_id", profileId); // Ensure memos also belong to the same profile, good practice

  if (memoError) {
    console.error(`Error deleting memos for record ${recordId}:`, memoError.message);
    // Decide if you want to stop or proceed if memo deletion fails.
    // For now, we'll throw, but you could also just log and continue.
    throw new Error(`Failed to delete associated memos: ${memoError.message}`);
  }

  // Then, delete the daily_record itself
  const { error: recordError } = await client
    .from("daily_records")
    .delete()
    .eq("id", recordId)
    .eq("profile_id", profileId);

  if (recordError) {
    console.error(`Error deleting daily record ${recordId}:`, recordError.message);
    throw new Error(recordError.message);
  }
  return true;
}

// == Daily Notes ==

export async function getDailyNotesByDate(
  { profileId, date }: { profileId: string; date: string /* "YYYY-MM-DD" */ }
): Promise<DailyNote[]> {
  const { data, error } = await client
    .from("daily_notes")
    .select(DAILY_NOTE_COLUMNS)
    .eq("profile_id", profileId)
    .eq("date", date)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching daily notes by date:", error.message);
    throw new Error(error.message);
  }
  return data || [];
}

export async function getDailyNotesByPeriod(
  { profileId, startDate, endDate }: { profileId: string; startDate: string; endDate: string }
): Promise<DailyNote[]> {
  const { data, error } = await client
    .from("daily_notes")
    .select(DAILY_NOTE_COLUMNS)
    .eq("profile_id", profileId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching daily notes by period:", error.message);
    throw new Error(error.message);
  }
  return data || [];
}

export async function createDailyNote(
  noteData: DailyNoteInsert
): Promise<DailyNote | null> {
  const insertPayload: DailyNoteInsert = {
      profile_id: noteData.profile_id,
      date: noteData.date,
      content: noteData.content,
  };

  const { data, error } = await client
    .from("daily_notes")
    .insert(insertPayload)
    .select(DAILY_NOTE_COLUMNS)
    .single();

  if (error) {
    console.error("Error inserting daily note:", error.message);
    throw error;
  }
  return data;
}

export async function deleteDailyNoteById(
  { noteId, profileId }: { noteId: string; profileId: string }
): Promise<boolean> {
  const { error } = await client
    .from("daily_notes")
    .delete()
    .eq("id", noteId)
    .eq("profile_id", profileId);

  if (error) {
    console.error("Error deleting daily note by ID:", error.message);
    throw new Error(error.message);
  }
  return true;
}

export async function updateDailyNote(
  { noteId, profileId, content }: { noteId: string; profileId: string; content: string }
) {
  if (!content || content.trim() === "") {
    throw new Error("Note content cannot be empty.");
  }
  const { data, error } = await client
    .from("daily_notes")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", noteId)
    .eq("profile_id", profileId)
    .select(DAILY_NOTE_COLUMNS)
    .single();

  if (error) {
    console.error("Error updating daily note:", error.message);
    throw new Error(`Failed to update daily note: ${error.message}`);
  }
  return data;
}

// == Memos ==

export async function getMemosByRecordId(
  { profileId, recordId }: { profileId: string; recordId: string }
) {
  const { data, error } = await client
    .from("memos")
    .select(MEMO_COLUMNS)
    .eq("profile_id", profileId)
    .eq("record_id", recordId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Error fetching memos for record ${recordId}:`, error.message);
    throw new Error(error.message);
  }
  return data || [];
}

export async function getMemosByRecordIds(
  { profileId, recordIds }: { profileId: string; recordIds: string[] }
) {
  if (recordIds.length === 0) return [];
  const { data, error } = await client
    .from("memos")
    .select(MEMO_COLUMNS)
    .eq("profile_id", profileId)
    .in("record_id", recordIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Error fetching memos for multiple records:`, error.message);
    throw new Error(error.message);
  }
  return data || [];
}

export async function deleteMemosByRecordId(
  { profileId, recordId }: { profileId: string; recordId: string }
) {
  const { error } = await client
    .from("memos")
    .delete()
    .eq("profile_id", profileId)
    .eq("record_id", recordId);

  if (error) {
    console.error(`Error deleting memos for record ${recordId}:`, error.message);
    throw new Error(error.message);
  }
  return { ok: true };
}

export async function getMemoById(
  { memoId, profileId }: { memoId: string; profileId: string }
) {
  const { data: memo, error: memoError } = await client
    .from("memos")
    .select(`${MEMO_COLUMNS}, daily_records ( profile_id )`) // Fetch memo and its related record's profile_id
    .eq("id", memoId)
    .single<MemoWithRecordProfile>(); // Use the specific type here

  if (memoError) {
    if (memoError.code === 'PGRST116') return null; // Not found
    console.error("Error fetching memo by ID:", memoError.message);
    throw new Error(memoError.message);
  }
  
  // daily_records should be present due to the select and type assertion
  if (!memo.daily_records || memo.daily_records.profile_id !== profileId) {
    // console.warn('Memo ' + memoId + ' not found or not accessible by profile ' + profileId);
    return null; // Memo doesn't belong to the user or record is missing, or profile_id mismatch
  }

  // Remove the joined daily_records from the final returned object if not needed by caller
  const { daily_records, ...memoData } = memo;
  return memoData as Memo; // Now it matches the Memo type
}


export async function createMemo(
  memoData: MemoInsert
) {
  if (!memoData.record_id) {
    throw new Error("record_id is required to create a memo.");
  }
  if (!memoData.profile_id) {
    throw new Error("profile_id is required in memoData to create a memo.");
  }
  // Verify the daily_record belongs to the profileId before inserting memo
  const { data: recordData, error: recordError } = await client
    .from("daily_records")
    .select("id")
    .eq("id", memoData.record_id)
    .eq("profile_id", memoData.profile_id)
    .single();

  if (recordError || !recordData) {
    console.error("Error verifying record ownership or record not found for memo creation:", recordError?.message);
    throw new Error(recordError?.message || "Associated record not found or not accessible.");
  }

  const { data, error } = await client
    .from("memos")
    .insert(memoData)
    .select(MEMO_COLUMNS)
    .single();

  if (error) {
    console.error("Error creating memo:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function updateMemo(
  { memoId, updates, profileId }: { memoId: string; updates: Partial<Omit<Memo, "id" | "record_id" | "created_at" | "updated_at">>; profileId: string }
) {
  // First, ensure the memo belongs to the user by checking its daily_record
  const { data: existingMemo, error: existingMemoError } = await client
    .from("memos")
    .select(`id, record_id, daily_records ( profile_id )`)
    .eq("id", memoId)
    .single<MemoWithRecordProfile>();

  if (existingMemoError) {
    console.error("Error fetching memo for update:", existingMemoError.message);
    throw new Error(existingMemoError.message);
  }
  if (!existingMemo) {
    throw new Error("Memo not found for update.");
  }

  if (!existingMemo.daily_records || existingMemo.daily_records.profile_id !== profileId) {
    throw new Error("Memo not accessible by this user for update.");
  }

  const { data, error } = await client
    .from("memos")
    .update(updates)
    .eq("id", memoId)
    .select(MEMO_COLUMNS) // Select base memo columns after update
    .single(); 

  if (error) {
    console.error("Error updating memo:", error.message);
    throw new Error(error.message);
  }
  return data as Memo; 
}

export async function deleteMemo(
  { memoId, profileId }: { memoId: string; profileId: string }
) {
   // First, ensure the memo belongs to the user by checking its daily_record
  const { data: existingMemo, error: existingMemoError } = await client
    .from("memos")
    .select("id, record_id, daily_records ( profile_id )")
    .eq("id", memoId)
    .single<MemoWithRecordProfile>();

  if (existingMemoError && existingMemoError.code !== 'PGRST116') { // Ignore 'Not Found' for already deleted
    console.error("Error fetching memo for deletion:", existingMemoError.message);
    throw new Error(existingMemoError.message);
  }
  if (!existingMemo) {
    // Memo already deleted or never existed, consider this a success
    return true; 
  }
  
  if (!existingMemo.daily_records || existingMemo.daily_records.profile_id !== profileId) {
    throw new Error("Memo not accessible by this user for deletion.");
  }

  const { error } = await client
    .from("memos")
    .delete()
    .eq("id", memoId);

  if (error) {
    console.error("Error deleting memo:", error.message);
    throw new Error(error.message);
  }
  return true;
}


// // ======== Example: Using Drizzle for more complex queries or when needed ========
// import db from "~/db"; // Drizzle client
// import { dailyRecords as drSchema, memos as mSchema } from "./schema";
// import { profiles as pSchema } from "~/features/users/schema";
// import { eq, and, desc, getTableColumns } from "drizzle-orm";

// export async function getDailyRecordsWithProfileInfo_DrizzleExample(profileId: string, date: string) {
//   try {
//     const records = await db
//       .select({
//         ...getTableColumns(drSchema),
//         profileName: pSchema.full_name, // Assuming 'full_name' field in profiles
//         profileAvatar: pSchema.avatar_url // Assuming 'avatar_url'
//       })
//       .from(drSchema)
//       .leftJoin(pSchema, eq(drSchema.profile_id, pSchema.profile_id))
//       .where(and(eq(drSchema.profile_id, profileId), eq(drSchema.date, date)))
//       .orderBy(desc(drSchema.created_at));
//     return records;
//   } catch (err) {
//     const error = err as Error;
//     console.error("Error in getDailyRecordsWithProfileInfo_DrizzleExample:", error.message);
//     throw error;
//   }
// }
// // =================================================================================

// // Add similar functions for Daily Notes and Memos as needed,
// // ensuring to use the Supabase client and correct types.

// // For Memos, when creating/updating/deleting, you might want to ensure that the
// // associated daily_record belongs to the authenticated user (profileId)
// // This might involve an extra check before performing the mutation on the memos table.

// This function was a simplified duplicate / test, removing it.
// export const getDailyNotes = async () => {
//   const { data, error } = await client.from("daily_notes").select();
//   if (error) throw new Error(error.message);
//   return data;
// };

// == Utility / Aggregation Queries ==

export async function getDatesWithRecords(
    { profileId, year, month }: { profileId: string; year: number; month: number }
  ): Promise<{ date: string }[]> {
    const startDate = DateTime.fromObject({ year, month, day: 1 }).toISODate();
    const endDate = DateTime.fromObject({ year, month, day: 1 }).endOf('month').toISODate();
  
    const { data, error } = await client
      .from("daily_records")
      .select("date")
      .eq("profile_id", profileId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });
      // No group by needed if we just want a list of dates that have records
      // If you need a count per date, that would be different (RPC or JS aggregate)
  
    if (error) {
      console.error("Error fetching dates with records:", error.message);
      throw new Error(error.message);
    }
  
    if (!data) return [];

    // Get distinct dates
    const distinctDates = [...new Set(data.map(item => item.date))];
    return distinctDates.map(date => ({ date }));
}