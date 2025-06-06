import { DateTime } from "luxon";
import type { LoaderFunctionArgs } from "react-router";
import { makeSSRClient } from "~/supa-client";
import * as dailyQueries from "~/features/daily/queries";
import * as settingsQueries from "~/features/settings/queries";
import type { MonthlyDayRecord, DailyRecordUI, MemoUI, StatsPageLoaderData } from "./types";
import type { UICategory, CategoryCode } from "~/common/types/daily";
import { CATEGORIES } from "~/common/types/daily";

async function getProfileId(request: Request): Promise<string> {
  const { client } = makeSSRClient(request);
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }
  return user.id;
}

export const loader = async ({ request }: LoaderFunctionArgs): Promise<StatsPageLoaderData> => {
  const { client } = makeSSRClient(request);
  const profileId = await getProfileId(request);
  const url = new URL(request.url);
  const monthParam = url.searchParams.get("month") || DateTime.now().toFormat("yyyy-MM");
  const selectedMonthStart = DateTime.fromFormat(monthParam, "yyyy-MM").startOf("month");
  const selectedMonthEnd = selectedMonthStart.endOf("month");

  const [dbRecords, dbNotes, userCategoriesData, userDefaultCodePreferencesData] = await Promise.all([
    dailyQueries.getDailyRecordsByPeriod(client, {
      profileId,
      startDate: selectedMonthStart.toISODate()!,
      endDate: selectedMonthEnd.toISODate()!,
    }),
    dailyQueries.getDailyNotesByPeriod(client, {
      profileId,
      startDate: selectedMonthStart.toISODate()!,
      endDate: selectedMonthEnd.toISODate()!,
    }),
    settingsQueries.getUserCategories(client, { profileId }),
    settingsQueries.getUserDefaultCodePreferences(client, { profileId }),
  ]);

  const records: DailyRecordUI[] = (dbRecords || []).map((r): DailyRecordUI => ({
    ...r,
    id: r.id!,
    date: r.date,
    duration: r.duration_minutes ?? undefined,
    is_public: r.is_public ?? false,
    comment: r.comment ?? null,
    subcode: r.subcode ?? null,
    linked_plan_id: r.linked_plan_id ?? null,
    category_code: r.category_code as CategoryCode,
    memos: [],
  }));

  const recordIds = records.map(r => r.id).filter((id): id is string => typeof id === 'string');
  const dbMemos: dailyQueries.Memo[] = recordIds.length > 0 ? await dailyQueries.getMemosByRecordIds(client, { profileId, recordIds }) : [];
  
  const memosByRecordId = new Map<string, MemoUI[]>();
  (dbMemos || []).forEach((m: dailyQueries.Memo) => {
    if (!m.record_id) return;
    const memoUI: MemoUI = { ...m, id: m.id!, record_id: m.record_id };
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
    const dayMemos = dayRecords.flatMap(r => r.memos);

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
      processedCategories.push({ ...baseCategory, isCustom: false, isActive: true, sort_order: baseCategory.sort_order || 999 });
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
    selectedMonthISO: monthParam,
    monthlyRecordsForDisplay,
    categories: processedCategories,
  };
}; 