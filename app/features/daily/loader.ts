import { DateTime } from "luxon";
import type { LoaderFunctionArgs } from "react-router";
import * as dailyQueries from "~/features/daily/queries";
import * as planQueries from "~/features/plan/queries";
import * as settingsQueries from "~/features/settings/queries";
import { CATEGORIES, type CategoryCode, type Category } from "~/common/types/daily";
import type { DailyPageLoaderData, DailyRecordUI, DailyNoteUI, DailyPlanUI, MemoUI, UICategory } from "./types";
import { getToday } from "./utils";
import { makeSSRClient } from "~/supa-client";
import type { DailyRecord as DbDailyRecord, DailyNote as DbDailyNote, Memo as DbMemo } from "~/features/daily/queries";
import type { DailyPlan as DbDailyPlan } from "~/features/plan/queries";

// async function getProfileId(_request?: Request): Promise<string> {
//   return "fd64e09d-e590-4545-8fd4-ae7b2b784e4a";
// }
async function getProfileId(request: Request): Promise<string> {
  const { client } = makeSSRClient(request);
  const { data: { user } } = await client.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  return user.id;
}

export async function loader({ request }: LoaderFunctionArgs): Promise<DailyPageLoaderData> {
  const { client } = makeSSRClient(request);
  const profileId = await getProfileId(request);
  const url = new URL(request.url);
  const selectedDate = url.searchParams.get("date") || getToday();

  const [
    recordsData,
    dailyNotesData,
    plansForBannerData,
    recordDatesResult,
    userCategoriesData,
    userDefaultCodePreferencesData
  ] = await Promise.all([
    dailyQueries.getDailyRecordsByDate(client, { profileId, date: selectedDate }),
    dailyQueries.getDailyNotesByDate(client, { profileId, date: selectedDate }),
    planQueries.getDailyPlansByDate(client, { profileId, date: selectedDate }),
    dailyQueries.getDatesWithRecords(client, { profileId, year: DateTime.fromISO(selectedDate).year, month: DateTime.fromISO(selectedDate).month }),
    settingsQueries.getUserCategories(client, { profileId }),
    settingsQueries.getUserDefaultCodePreferences(client, { profileId })
  ]);

  const records: DailyRecordUI[] = (recordsData || []).map((r) => ({
    id: r.id,
    date: r.date,
    category_code: r.category_code,
    duration: r.duration_minutes ?? undefined,
    comment: r.comment ?? null,
    subcode: r.subcode ?? null,
    is_public: r.is_public ?? false,
    linked_plan_id: r.linked_plan_id ?? null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));

  const dailyNotes: DailyNoteUI[] = (dailyNotesData || []).map((note) => ({
    id: note.id!,
    date: note.date || selectedDate,
    content: note.content,
    created_at: note.created_at,
    updated_at: note.updated_at
  }));

  const recordIds = records.map((r) => r.id);
  const memosData = await dailyQueries.getMemosByRecordIds(client, { profileId, recordIds });

  const memos: MemoUI[] = (memosData || []).map((m) => ({
    id: m.id,
    record_id: m.record_id,
    profile_id: m.profile_id,
    title: m.title,
    content: m.content,
    created_at: m.created_at,
    updated_at: m.updated_at,
  }));
  
  const recordsWithMemos: DailyRecordUI[] = records.map((r) => ({
    ...r,
    memos: memos.filter((m) => m.record_id === r.id)
  }));
  
  const plansForBanner: DailyPlanUI[] = (plansForBannerData || []).map((p) => ({
    id: p.id,
    plan_date: p.plan_date || selectedDate,
    duration: p.duration_minutes ?? undefined,
    is_completed: p.is_completed ?? false,
    comment: p.comment ?? null,
    subcode: p.subcode ?? null,
    category_code: p.category_code,
    profile_id: p.profile_id,
    linked_weekly_task_id: p.linked_weekly_task_id ?? null,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }));

  const processedCategories: UICategory[] = [];
  const defaultCategoryPreferences = new Map(
    (userDefaultCodePreferencesData || []).map(pref => [pref.default_category_code, pref.is_active as boolean])
  );

  for (const catCodeKey in CATEGORIES) {
    if (Object.prototype.hasOwnProperty.call(CATEGORIES, catCodeKey)) {
      const baseCategory = CATEGORIES[catCodeKey as CategoryCode];
      const isActivePreference = defaultCategoryPreferences.get(baseCategory.code);
      const isActive = isActivePreference === undefined ? true : isActivePreference;

      processedCategories.push({
        code: baseCategory.code,
        label: baseCategory.label,
        icon: baseCategory.icon,
        isCustom: false,
        isActive: isActive,
        hasDuration: baseCategory.hasDuration,
        sort_order: baseCategory.sort_order !== undefined ? baseCategory.sort_order : 999,
      });
    }
  }

  (userCategoriesData || []).forEach((userCat: settingsQueries.UserCategory) => {
    const existingIndex = processedCategories.findIndex(c => c.code === userCat.code && !c.isCustom);
    if (existingIndex !== -1) {
      if(userCat.is_active) {
        processedCategories.splice(existingIndex, 1);
      } else {
        return;
      }
    }

    if (!processedCategories.find(c => c.code === userCat.code && c.isCustom)) {
      processedCategories.push({
        code: userCat.code,
        label: userCat.label,
        icon: userCat.icon || '📝',
        color: userCat.color || undefined,
        isCustom: true,
        isActive: userCat.is_active,
        hasDuration: true,
        sort_order: userCat.sort_order !== null && userCat.sort_order !== undefined ? userCat.sort_order : 1000,
      });
    }
  });

  processedCategories.sort((a, b) => {
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    if (a.isCustom && !b.isCustom) return -1;
    if (!a.isCustom && b.isCustom) return 1;
    return (a.sort_order ?? 999) - (b.sort_order ?? 999);
  });

  return {
    today: selectedDate,
    records: recordsWithMemos,
    dailyNotes,
    plansForBanner,
    markedDates: (recordDatesResult || []).map((d: {date: string}) => d.date),
    profileId,
    categories: processedCategories,
  };
} 