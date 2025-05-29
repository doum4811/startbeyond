// import db from "~/db"
// import client from "~/supa-client";
// import type { SupabaseClient } from "@supabase/supabase-js";
// import type { Database } from "~/supa-client"; //  경로는 실제 위치에 맞게 조정 필요
// // import type { Profile } from "~/features/users/types"; // Profile 타입 정의가 있다면
// import { DateTime } from "luxon";

import client from "~/supa-client";

// // Drizzle schema 임포트 (타입 추론 및 Zod 스키마 생성에 활용 가능)
// import { dailyRecords, dailyNotes, memos } from "./schema";
// import { profiles } from "~/features/users/schema"; // profiles 스키마 임포트
// import { eq, and, desc, isNull, gte, lte } from "drizzle-orm"; // Drizzle query helpers

// // Drizzle 스키마에서 타입 추론 (Zod와 유사한 역할)
// export type DailyRecord = typeof dailyRecords.$inferSelect;
// export type DailyRecordInsert = typeof dailyRecords.$inferInsert;
// export type DailyNote = typeof dailyNotes.$inferSelect;
// export type DailyNoteInsert = typeof dailyNotes.$inferInsert;
// export type Memo = typeof memos.$inferSelect;
// export type MemoInsert = typeof memos.$inferInsert;


// // == Daily Records ==

// export async function getDailyRecordsByDate(
//   client: SupabaseClient<Database>,
//   { profileId, date }: { profileId: string; date: string /* "YYYY-MM-DD" */ }
// ) {
//   const { data, error } = await client
//     .from("daily_records")
//     .select("*")
//     .eq("profile_id", profileId)
//     .eq("date", date)
//     .order("created_at", { ascending: false });

//   if (error) {
//     console.error("Error fetching daily records:", error.message);
//     throw new Error(error.message);
//   }
//   return data as DailyRecord[];
// }

// export async function getDailyRecordsByPeriod(
//   client: SupabaseClient<Database>,
//   { profileId, startDate, endDate }: { profileId: string; startDate: string; endDate: string }
// ) {
//   const { data, error } = await client
//     .from("daily_records")
//     .select("*")
//     .eq("profile_id", profileId)
//     .gte("date", startDate)
//     .lte("date", endDate)
//     .order("date", { ascending: false })
//     .order("created_at", { ascending: false });

//   if (error) {
//     console.error("Error fetching daily records for period:", error.message);
//     throw new Error(error.message);
//   }
//   return data as DailyRecord[];
// }

// export async function getDailyRecordById(
//   client: SupabaseClient<Database>,
//   { recordId, profileId }: { recordId: string; profileId: string }
// ) {
//   const { data, error } = await client
//     .from("daily_records")
//     .select("*")
//     .eq("id", recordId)
//     .eq("profile_id", profileId)
//     .single();

//   if (error) {
//     if (error.code === 'PGRST116') return null;
//     console.error("Error fetching daily record by ID:", error.message);
//     throw new Error(error.message);
//   }
//   return data as DailyRecord | null;
// }

// export async function createDailyRecord(
//   client: SupabaseClient<Database>,
//   recordData: DailyRecordInsert // Drizzle의 추론된 Insert 타입 사용
// ) {
//   const { data, error } = await client
//     .from("daily_records")
//     .insert(recordData)
//     .select()
//     .single();

//   if (error) {
//     console.error("Error creating daily record:", error.message);
//     throw new Error(error.message);
//   }
//   return data as DailyRecord;
// }

// export async function updateDailyRecord(
//   client: SupabaseClient<Database>,
//   { recordId, profileId, updates }: { recordId: string; profileId: string; updates: Partial<Omit<DailyRecord, "id" | "profile_id" | "created_at" | "updated_at">> }
// ) {
//   const { data, error } = await client
//     .from("daily_records")
//     .update(updates)
//     .eq("id", recordId)
//     .eq("profile_id", profileId)
//     .select()
//     .single();

//   if (error) {
//     console.error("Error updating daily record:", error.message);
//     throw new Error(error.message);
//   }
//   return data as DailyRecord;
// }

// export async function deleteDailyRecord(
//   client: SupabaseClient<Database>,
//   { recordId, profileId }: { recordId: string; profileId: string }
// ) {
//   // 연관된 메모도 함께 삭제하거나, record_id를 null로 업데이트하는 정책 필요시 추가
//   // 여기서는 일단 daily_record만 삭제
//   const { error } = await client
//     .from("daily_records")
//     .delete()
//     .eq("id", recordId)
//     .eq("profile_id", profileId);

//   if (error) {
//     console.error("Error deleting daily record:", error.message);
//     throw new Error(error.message);
//   }
//   return true;
// }

// // == Daily Notes ==

// export async function getDailyNoteByDate(
//   client: SupabaseClient<Database>,
//   { profileId, date }: { profileId: string; date: string /* "YYYY-MM-DD" */ }
// ) {
//   const { data, error } = await client
//     .from("daily_notes")
//     .select("*")
//     .eq("profile_id", profileId)
//     .eq("date", date)
//     .single(); // 하루에 노트는 하나라고 가정

//   if (error) {
//     if (error.code === 'PGRST116') return null; // 해당 날짜에 노트가 없음
//     console.error("Error fetching daily note by date:", error.message);
//     throw new Error(error.message);
//   }
//   return data as DailyNote | null;
// }

// export async function upsertDailyNote(
//   client: SupabaseClient<Database>,
//   noteData: DailyNoteInsert // { profile_id: string; date: string; content: string; }
// ) {
//   const { data, error } = await client
//     .from("daily_notes")
//     .upsert(noteData, { onConflict: 'profile_id, date' }) // profile_id와 date가 충돌하면 업데이트
//     .select()
//     .single();

//   if (error) {
//     console.error("Error upserting daily note:", error.message);
//     throw new Error(error.message);
//   }
//   return data as DailyNote;
// }

// export async function deleteDailyNoteByDate(
//   client: SupabaseClient<Database>,
//   { profileId, date }: { profileId: string; date: string }
// ) {
//   const { error } = await client
//     .from("daily_notes")
//     .delete()
//     .eq("profile_id", profileId)
//     .eq("date", date);

//   if (error) {
//     console.error("Error deleting daily note by date:", error.message);
//     throw new Error(error.message);
//   }
//   return true;
// }


// // == Memos ==

// export async function getMemosByRecordId(
//   client: SupabaseClient<Database>,
//   { recordId, profileId }: { recordId: string; profileId: string }
// ) {
//   // 해당 record가 profileId 소유인지 먼저 확인하는 로직이 추가될 수 있음
//   const { data, error } = await client
//     .from("memos")
//     .select("*")
//     .eq("record_id", recordId)
//     .eq("profile_id", profileId) // 메모 자체도 profile_id를 가지므로 이중 확인
//     .order("created_at", { ascending: false });

//   if (error) {
//     console.error("Error fetching memos by record ID:", error.message);
//     throw new Error(error.message);
//   }
//   return data as Memo[];
// }

// // 특정 프로필의 모든 메모 조회 (record_id가 null인 일반 메모 포함 가능)
// export async function getMemosByProfile(
//   client: SupabaseClient<Database>,
//   { profileId, includeGeneralMemosOnly = false }: { profileId: string; includeGeneralMemosOnly?: boolean }
// ) {
//   let query = client
//     .from("memos")
//     .select("*")
//     .eq("profile_id", profileId);

//   if (includeGeneralMemosOnly) {
//     query = query.is("record_id", null);
//   }
  
//   query = query.order("created_at", { ascending: false });

//   const { data, error } = await query;

//   if (error) {
//     console.error("Error fetching memos by profile:", error.message);
//     throw new Error(error.message);
//   }
//   return data as Memo[];
// }


// export async function getMemoById(
//   client: SupabaseClient<Database>,
//   { memoId, profileId }: { memoId: string; profileId: string }
// ) {
//   const { data, error } = await client
//     .from("memos")
//     .select("*")
//     .eq("id", memoId)
//     .eq("profile_id", profileId)
//     .single();

//   if (error) {
//     if (error.code === 'PGRST116') return null;
//     console.error("Error fetching memo by ID:", error.message);
//     throw new Error(error.message);
//   }
//   return data as Memo | null;
// }

// export async function createMemo(
//   client: SupabaseClient<Database>,
//   memoData: MemoInsert // { profile_id: string; title: string; content: string; record_id?: string | null; }
// ) {
//   const { data, error } = await client
//     .from("memos")
//     .insert(memoData)
//     .select()
//     .single();

//   if (error) {
//     console.error("Error creating memo:", error.message);
//     throw new Error(error.message);
//   }
//   return data as Memo;
// }

// export async function updateMemo(
//   client: SupabaseClient<Database>,
//   { memoId, profileId, updates }: { memoId: string; profileId: string; updates: Partial<Omit<Memo, "id" | "profile_id" | "created_at" | "updated_at">> }
// ) {
//   const { data, error } = await client
//     .from("memos")
//     .update(updates)
//     .eq("id", memoId)
//     .eq("profile_id", profileId)
//     .select()
//     .single();

//   if (error) {
//     console.error("Error updating memo:", error.message);
//     throw new Error(error.message);
//   }
//   return data as Memo;
// }

// export async function deleteMemo(
//   client: SupabaseClient<Database>,
//   { memoId, profileId }: { memoId: string; profileId: string }
// ) {
//   const { error } = await client
//     .from("memos")
//     .delete()
//     .eq("id", memoId)
//     .eq("profile_id", profileId);

//   if (error) {
//     console.error("Error deleting memo:", error.message);
//     throw new Error(error.message);
//   }
//   return true;
// } 

export const getDailyNotes = async () => {
  const { data, error } =  await client.from("daily_notes").select("content, date");
  // console.log(data, error);
  // if (error) {
  //   console.error("Error fetching daily notes:", error.message);
  //   throw new Error(error.message);
  // }
  if(error) throw new Error(error.message);
  return data;
};

export const getDailyRecordById = async ()=> {
  await client.from("daily_records").select(`
    id,
    date,
    duration_minutes,
    is_public,
    created_at,
    updated_at
  `)
};