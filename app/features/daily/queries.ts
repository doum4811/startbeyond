// import db from "~/db"
// import client from "~/supa-client";
// import type { SupabaseClient } from "@supabase/supabase-js";
// import type { Database } from "~/supa-client"; //  경로는 실제 위치에 맞게 조정 필요
// // import type { Profile } from "~/features/users/types"; // Profile 타입 정의가 있다면
// import { DateTime } from "luxon";

import client from "~/supa-client";
import type { Database } from "database.types"; // Ensure this path is correct

// Assuming your database.types.ts is at the root, if it's elsewhere adjust the import path.
type DailyRecordTable = Database['public']['Tables']['daily_records'];
type DailyRecord = DailyRecordTable['Row'];
type DailyRecordInsert = DailyRecordTable['Insert'];

type DailyNoteTable = Database['public']['Tables']['daily_notes'];
type DailyNote = DailyNoteTable['Row'];
type DailyNoteInsert = DailyNoteTable['Insert'];

type MemoTable = Database['public']['Tables']['memos'];
type Memo = MemoTable['Row'];
type MemoInsert = MemoTable['Insert'];

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
    console.error("Error updating daily record:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function deleteDailyRecord(
  { recordId, profileId }: { recordId: string; profileId: string }
) {
  // 연관된 메모도 함께 삭제하거나, record_id를 null로 업데이트하는 정책 필요시 추가
  // 여기서는 일단 daily_record만 삭제
  const { error } = await client
    .from("daily_records")
    .delete()
    .eq("id", recordId)
    .eq("profile_id", profileId);

  if (error) {
    console.error("Error deleting daily record:", error.message);
    throw new Error(error.message);
  }
  return true;
}

// == Daily Notes ==

export async function getDailyNoteByDate(
  { profileId, date }: { profileId: string; date: string /* "YYYY-MM-DD" */ }
) {
  const { data, error } = await client
    .from("daily_notes")
    .select(DAILY_NOTE_COLUMNS)
    .eq("profile_id", profileId)
    .eq("date", date)
    .single(); // 하루에 노트는 하나라고 가정

  if (error) {
    if (error.code === 'PGRST116') return null; // 해당 날짜에 노트가 없음
    console.error("Error fetching daily note by date:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function upsertDailyNote(
  noteData: DailyNoteInsert // { profile_id: string; date: string; content: string; }
) {
  const { data, error } = await client
    .from("daily_notes")
    .upsert(noteData, { onConflict: 'profile_id, date' }) // profile_id와 date가 충돌하면 업데이트
    .select(DAILY_NOTE_COLUMNS)
    .single();

  if (error) {
    console.error("Error upserting daily note:", error.message);
    throw new Error(error.message);
  }
  return data;
}

export async function deleteDailyNoteByDate(
  { profileId, date }: { profileId: string; date: string }
) {
  const { error } = await client
    .from("daily_notes")
    .delete()
    .eq("profile_id", profileId)
    .eq("date", date);

  if (error) {
    console.error("Error deleting daily note by date:", error.message);
    throw new Error(error.message);
  }
  return true;
}


// == Memos ==

export async function getMemosByRecordId(
  { recordId, profileId }: { recordId: string; profileId: string }
) {
  // First, verify the daily_record belongs to the profileId for security
  const { data: recordData, error: recordError } = await client
    .from("daily_records")
    .select("id")
    .eq("id", recordId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (recordError) {
    console.error("Error verifying record ownership:", recordError.message);
    throw new Error(recordError.message);
  }
  if (!recordData) {
    // Record not found or doesn't belong to the user
    // console.warn('Attempt to fetch memos for record ' + recordId + ' not owned by profile ' + profileId);
    return []; // Or throw an error, depending on desired behavior
  }

  const { data, error } = await client
    .from("memos")
    .select(MEMO_COLUMNS)
    .eq("record_id", recordId)
    // .eq("profile_id", profileId) // No direct profile_id on memos, ownership is via daily_records
    .order("created_at", { ascending: false });

  if (error) {
    console.error('Error fetching memos for record_id ' + recordId + ':', error.message);
    throw new Error(error.message);
  }
  return data;
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
  memoData: MemoInsert,
  profileId: string // Required to verify daily_record ownership
) {
  if (!memoData.record_id) {
    throw new Error("record_id is required to create a memo.");
  }
  // Verify the daily_record belongs to the profileId before inserting memo
  const { data: recordData, error: recordError } = await client
    .from("daily_records")
    .select("id")
    .eq("id", memoData.record_id)
    .eq("profile_id", profileId)
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