import { DateTime } from "luxon";
import type { LoaderFunctionArgs } from "react-router";
import { makeSSRClient } from "~/supa-client";
import * as dailyQueries from "~/features/daily/queries";
import * as settingsQueries from "~/features/settings/queries";
import type { MonthlyDayRecord, DailyRecordUI, MemoUI, StatsPageLoaderData } from "./types";
import type { UICategory, CategoryCode } from "~/common/types/daily";
import { CATEGORIES } from "~/common/types/daily";

export interface RecordsLoaderData {
  profileId: string;
  startDate: string;
  endDate: string;
  monthlyRecordsForDisplay: MonthlyDayRecord[];
  categories: UICategory[];
}

async function getProfileId(request: Request): Promise<string> {
  const { client } = makeSSRClient(request);
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }
  return user.id;
}

export const loader = async ({ request }: LoaderFunctionArgs): Promise<RecordsLoaderData> => {
  const { client } = makeSSRClient(request);
  const profileId = await getProfileId(request);
  const url = new URL(request.url);
  
  const monthParam = url.searchParams.get("month");
  const startDateParam = url.searchParams.get("startDate");
  const endDateParam = url.searchParams.get("endDate");

  let startDate: string;
  let endDate: string;

  if (startDateParam && endDateParam) {
    startDate = startDateParam;
    endDate = endDateParam;
  } else {
    const month = monthParam || DateTime.now().toFormat("yyyy-MM");
    const selectedMonth = DateTime.fromFormat(month, "yyyy-MM");
    startDate = selectedMonth.startOf('month').toISODate()!;
    endDate = selectedMonth.endOf('month').toISODate()!;
  }

  const [dbRecords, dbNotes, userCategoriesData, userDefaultCodePreferencesData] = await Promise.all([
    dailyQueries.getDailyRecordsByPeriod(client, {
      profileId,
      startDate,
      endDate,
    }),
    dailyQueries.getDailyNotesByPeriod(client, {
      profileId,
      startDate,
      endDate,
    }),
    settingsQueries.getUserCategories(client, { profileId }),
    settingsQueries.getUserDefaultCodePreferences(client, { profileId }),
  ]);

  const records: DailyRecordUI[] = (dbRecords || []).map((r): DailyRecordUI => ({
    id: r.id,
    date: r.date,
    category_code: r.category_code as CategoryCode,
    comment: r.comment,
    subcode: r.subcode,
    duration_minutes: r.duration_minutes,
    created_at: r.created_at,
    updated_at: r.updated_at,
    profile_id: r.profile_id,
    linked_plan_id: r.linked_plan_id,
    is_public: r.is_public ?? false,
    // Default values for fields not in daily_records
    is_bookmarked: false,
    evidence_url: null,
    memo: null,
    memos: [],
  }));

  const recordIds = records.map(r => r.id).filter((id): id is string => typeof id === 'string');
  const dbMemos: dailyQueries.Memo[] = recordIds.length > 0 ? await dailyQueries.getMemosByRecordIds(client, { profileId, recordIds }) : [];
  
  const memosByRecordId = new Map<string, MemoUI[]>();
  (dbMemos || []).forEach((m: dailyQueries.Memo) => {
    if (!m.record_id) return;
    const memoUI: MemoUI = { id: m.id, title: m.title, content: m.content };
    if (!memosByRecordId.has(m.record_id)) {
      memosByRecordId.set(m.record_id, []);
    }
    memosByRecordId.get(m.record_id)!.push(memoUI);
  });

  records.forEach(r => {
    r.memos = memosByRecordId.get(r.id) || [];
  });
  
  const notesByDate = new Map<string, string[]>();
  (dbNotes || []).forEach((note: dailyQueries.DailyNote) => {
    if (!note.date || !note.content) return;
    const dateKey = note.date;
    if (!notesByDate.has(dateKey)) {
      notesByDate.set(dateKey, []);
    }
    notesByDate.get(dateKey)!.push(note.content);
  });

  const monthlyRecordsForDisplay: MonthlyDayRecord[] = [];
  const daysWithContent = new Set([...records.map(r => r.date), ...notesByDate.keys()]);

  for (const dateStr of Array.from(daysWithContent).sort()) {
    const dayRecords = records.filter(r => r.date === dateStr);
    const dayNotesContent = notesByDate.get(dateStr)?.join("\n\n") || null;
    const dayMemos = dayRecords.flatMap(r => r.memos || []);

    monthlyRecordsForDisplay.push({
      date: dateStr,
      records: dayRecords,
      dailyNote: dayNotesContent,
      memos: dayMemos,
    });
  }
  monthlyRecordsForDisplay.sort((a, b) => b.date.localeCompare(a.date));

  const processedCategories: UICategory[] = [];
  for (const catCodeKey in CATEGORIES) {
    if (Object.prototype.hasOwnProperty.call(CATEGORIES, catCodeKey)) {
      const baseCategory = CATEGORIES[catCodeKey as CategoryCode];
      processedCategories.push({ ...baseCategory, isCustom: false, isActive: true, sort_order: baseCategory.sort_order || 999, hasDuration: true });
    }
  }
  (userCategoriesData || []).forEach(userCat => {
    const existingIndex = processedCategories.findIndex(c => c.code === userCat.code && !c.isCustom);
    if (existingIndex !== -1) {
      processedCategories.splice(existingIndex, 1);
    }
    processedCategories.push({
      code: userCat.code as CategoryCode, label: userCat.label, icon: userCat.icon || '📝',
      color: userCat.color || undefined, isCustom: true, isActive: userCat.is_active,
      hasDuration: true, sort_order: userCat.sort_order ?? 1000,
    });
  });
  processedCategories.sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));

  return {
    profileId,
    startDate,
    endDate,
    monthlyRecordsForDisplay,
    categories: processedCategories,
  };
}; 