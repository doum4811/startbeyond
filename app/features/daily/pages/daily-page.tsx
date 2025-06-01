import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Label } from "~/common/components/ui/label";
import { Textarea } from "~/common/components/ui/textarea";
import { Plus, X, Bell, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { CATEGORIES, type CategoryCode, type UICategory } from "~/common/types/daily";
import { Calendar } from "~/common/components/ui/calendar";
import { Link, Form, useFetcher, useNavigate } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { DateTime } from "luxon";
import * as dailyQueries from "~/features/daily/queries";
import * as planQueries from "~/features/plan/queries";
import type { DailyRecord as DbDailyRecord, DailyNote as DbDailyNote, Memo as DbMemo, DailyRecordInsert, DailyRecordUpdate, DailyNoteInsert, MemoInsert } from "~/features/daily/queries";
import type { DailyPlan as DbDailyPlan } from "~/features/plan/queries";
import * as settingsQueries from "~/features/settings/queries";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/common/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/common/components/ui/alert-dialog";
import { CategorySelector } from "~/common/components/ui/CategorySelector";
import { DailyNotesSection } from "~/features/daily/components/daily-notes-section";

interface DailyRecordUI extends Omit<DbDailyRecord, 'date' | 'duration_minutes' | 'created_at' | 'updated_at' | 'category_id'> {
  date: string;
  duration?: number;
  comment: string | null;
  subcode: string | null;
  is_public: boolean;
  linked_plan_id: string | null;
  memos?: MemoUI[];
  created_at?: string;
  updated_at?: string;
}

export interface DailyNoteUI extends Omit<DbDailyNote, 'date' | 'created_at' | 'updated_at'> {
  date: string;
  created_at?: string;
  updated_at?: string;
}

interface MemoUI extends Omit<DbMemo, 'created_at' | 'updated_at'> {
  created_at?: string;
  updated_at?: string;
}

interface DailyPlanUI extends Omit<DbDailyPlan, 'duration_minutes' | 'created_at' | 'updated_at' | 'category_id' | 'is_completed' | 'sort_order'> {
  id: string;
  plan_date: string;
  duration?: number;
  comment: string | null;
  subcode: string | null;
  category_code: string;
  is_completed: boolean;
  created_at?: string;
  updated_at?: string;
  profile_id: string;
  linked_weekly_task_id: string | null;
}

// Helper Functions
const MAX_MINUTES_PER_DAY = 60 * 24;

function getToday(): string {
  return DateTime.now().toISODate();
}

function getCategoryColor(category: UICategory | undefined, code?: string): string {
  if (category) {
    if (category.isCustom && category.color) {
      return category.color;
    }
    const map: Record<string, string> = {
      EX: "text-orange-500", BK: "text-green-600", ML: "text-orange-600",
      EM: "text-purple-500", ST: "text-yellow-500", WK: "text-teal-700",
      HB: "text-pink-500", SL: "text-cyan-600", RT: "text-blue-500"
    };
    return map[category.code] || "text-gray-500";
  }
  if (code) {
    const map: Record<string, string> = {
      EX: "text-orange-500", BK: "text-green-600", ML: "text-orange-600",
      EM: "text-purple-500", ST: "text-yellow-500", WK: "text-teal-700",
      HB: "text-pink-500", SL: "text-cyan-600", RT: "text-blue-500"
    };
    return map[code] || "text-gray-500";
  }
  return "text-gray-500";
}

const isValidCategoryCode = (code: string, activeCategories: UICategory[]): boolean => {
    return activeCategories.some(c => c.code === code && c.isActive);
};

export interface DailyPageLoaderData {
  today: string;
  records: DailyRecordUI[];
  dailyNotes: DailyNoteUI[];
  plansForBanner: DailyPlanUI[];
  markedDates: string[];
  profileId: string;
  categories: UICategory[];
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const pageData = data as DailyPageLoaderData | undefined;
  return [
    { title: `Daily Records (${pageData?.today ?? DateTime.now().toISODate()}) - StartBeyond` },
    { name: "description", content: "Track your daily activities and notes." },
  ];
};

async function getProfileId(_request: Request): Promise<string> {
  // return "ef20d66d-ed8a-4a14-ab2b-b7ff26f2643c";
  return "fd64e09d-e590-4545-8fd4-ae7b2b784e4a";
}

export async function loader({ request }: LoaderFunctionArgs): Promise<DailyPageLoaderData> {
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
    dailyQueries.getDailyRecordsByDate({ profileId, date: selectedDate }),
    dailyQueries.getDailyNotesByDate({ profileId, date: selectedDate }),
    planQueries.getDailyPlansByDate({ profileId, date: selectedDate }),
    dailyQueries.getDatesWithRecords({ profileId, year: DateTime.fromISO(selectedDate).year, month: DateTime.fromISO(selectedDate).month }),
    settingsQueries.getUserCategories({ profileId }),
    settingsQueries.getUserDefaultCodePreferences({ profileId })
  ]);

  const records: DailyRecordUI[] = (recordsData || []).map((r: DbDailyRecord) => ({
        ...r,
        id: r.id!,
        date: r.date || selectedDate,
        duration: r.duration_minutes ?? undefined,
        is_public: r.is_public ?? false,
        comment: r.comment ?? null,
        subcode: r.subcode ?? null,
        linked_plan_id: r.linked_plan_id ?? null,
        category_code: r.category_code
    } as DailyRecordUI));

  const dailyNotes: DailyNoteUI[] = (dailyNotesData || []).map((note: DbDailyNote) => ({
    ...note,
    id: note.id!,
    date: note.date || selectedDate,
    content: note.content,
    created_at: note.created_at,
    updated_at: note.updated_at
  } as DailyNoteUI));

  const plansForBanner: DailyPlanUI[] = (plansForBannerData || []).map((p: DbDailyPlan) => ({
        ...p,
        id: p.id!,
        plan_date: p.plan_date || selectedDate,
        duration: p.duration_minutes ?? undefined,
        is_completed: p.is_completed ?? false,
        comment: p.comment ?? null,
        subcode: p.subcode ?? null,
        category_code: p.category_code,
        profile_id: p.profile_id,
        linked_weekly_task_id: p.linked_weekly_task_id ?? null,
    } as DailyPlanUI));

  const recordIds = records.map((r: DailyRecordUI) => r.id).filter((id): id is string => typeof id === 'string');
  const memosData = recordIds.length > 0 ? await dailyQueries.getMemosByRecordIds({ profileId, recordIds }) : [];
  const memos: MemoUI[] = (memosData || []).map((m: DbMemo) => ({...m, id: m.id!})) as MemoUI[];

  const recordsWithMemos: DailyRecordUI[] = records.map((r: DailyRecordUI) => ({
    ...r,
    memos: memos.filter((m: MemoUI) => m.record_id === r.id)
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

export async function action({ request }: ActionFunctionArgs) {
  const profileId = await getProfileId(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const today = getToday();
  
  const activeCategoriesForAction = await (async () => {
    const [userCategoriesDb, defaultPreferencesDb] = await Promise.all([
        settingsQueries.getUserCategories({ profileId }),
        settingsQueries.getUserDefaultCodePreferences({ profileId })
    ]);
    const categories: UICategory[] = [];
    const defaultPrefsMap = new Map((defaultPreferencesDb || []).map(p => [p.default_category_code, p.is_active as boolean]));
    for (const key in CATEGORIES) {
        const base = CATEGORIES[key as CategoryCode];
        const isActivePref = defaultPrefsMap.get(base.code);
        if (isActivePref === undefined || isActivePref) {
            categories.push({
                code: base.code,
                label: base.label,
                icon: base.icon,
                isCustom: false,
                isActive: true,
                hasDuration: base.hasDuration,
                sort_order: base.sort_order
            });
        }
    }
    (userCategoriesDb || []).forEach(uc => {
        if (uc.is_active) {
            if (!categories.find(c => c.code === uc.code && !c.isCustom && c.isActive)) {
                 categories.push({
                    code: uc.code,
                    label: uc.label,
                    icon: uc.icon || '📝',
                    color: uc.color || undefined,
                    isCustom: true,
                    isActive: true,
                    hasDuration: true,
                    sort_order: uc.sort_order !== null && uc.sort_order !== undefined ? uc.sort_order : 1000,
                });
            }
        }
    });
    return categories.filter(c => c.isActive);
  })();

  try {
    switch (intent) {
      case "addRecord":
      case "addRecordFromPlan":
      {
        const categoryCodeStr = formData.get("category_code") as string | null;
        if (!categoryCodeStr || !isValidCategoryCode(categoryCodeStr, activeCategoriesForAction)) {
          return {ok: false, error: "Invalid or missing active category code."};
        }

        const durationStr = formData.get("duration") as string | null;
        const comment = formData.get("comment") as string | null;
        const date = (formData.get("date") as string | null) || today;
        const subcode = formData.get("subcode") as string | null;
        const linkedPlanId = formData.get("linked_plan_id") as string | null;
        const isPublicFormVal = formData.get("is_public");
        const isPublic = typeof isPublicFormVal === 'string' ? isPublicFormVal === "true" : false;

        let durationMinutes: number | undefined = undefined;
        if (durationStr && durationStr.trim() !== "") {
            durationMinutes = parseInt(durationStr, 10);
            if (isNaN(durationMinutes) || durationMinutes < 0 || durationMinutes > MAX_MINUTES_PER_DAY) {
                 return { ok: false, error: "Invalid duration value."};
            }
        } else if (durationStr === null || durationStr.trim() === "") {
            durationMinutes = undefined;
        }

        const recordData: DailyRecordInsert = {
          profile_id: profileId,
          date: date,
          category_code: categoryCodeStr,
          duration_minutes: durationMinutes,
          comment: comment,
          subcode: subcode,
          is_public: isPublic,
          linked_plan_id: linkedPlanId,
        };
        const createdRecord = await dailyQueries.createDailyRecord(recordData);
        const addedFromPlanIdResponse = intent === "addRecordFromPlan" ? linkedPlanId : undefined;
        return { ok: true, intent, createdRecordId: createdRecord?.id, addedFromPlanId: addedFromPlanIdResponse };
      }
      case "updateRecord": {
        const recordId = formData.get("recordId") as string | null;
        const categoryCodeStr = formData.get("category_code") as string | null;
        const durationStr = formData.get("duration") as string | null;
        const comment = formData.get("comment") as string | null;
        const isPublicFormVal = formData.get("is_public");
        const isPublic = typeof isPublicFormVal === 'string' ? isPublicFormVal === "true" : false;

        if (!recordId) return { ok: false, error: "Record ID is required." };
        if (!categoryCodeStr || !isValidCategoryCode(categoryCodeStr, activeCategoriesForAction)) {
          return {ok: false, error: "Invalid or missing active category code for update."};
        }

        let durationMinutes: number | undefined | null = undefined;
        if (durationStr && durationStr.trim() !== "") {
            durationMinutes = parseInt(durationStr, 10);
             if (isNaN(durationMinutes) || durationMinutes < 0 || durationMinutes > MAX_MINUTES_PER_DAY) {
                 return { ok: false, error: "Invalid duration value."};
            }
        } else if (durationStr === null || durationStr.trim() === "") {
            durationMinutes = null;
        }

        const updates: Partial<DailyRecordUpdate> = {};
        updates.category_code = categoryCodeStr;
        updates.comment = comment;
        if (durationMinutes !== undefined) {
            updates.duration_minutes = durationMinutes;
        }
        updates.is_public = isPublic;

        const updatedRecordDb = await dailyQueries.updateDailyRecord({
            recordId,
            updates,
            profileId
        });

        if (!updatedRecordDb) {
            return { ok: false, error: "Failed to update record or record not found.", intent, recordId };
        }

        const updatedRecord: DailyRecordUI = {
            ...updatedRecordDb,
            id: updatedRecordDb.id!,
            date: updatedRecordDb.date || today,
            duration: updatedRecordDb.duration_minutes ?? undefined,
            is_public: updatedRecordDb.is_public ?? false,
            comment: updatedRecordDb.comment ?? null,
            subcode: updatedRecordDb.subcode ?? null,
            linked_plan_id: updatedRecordDb.linked_plan_id ?? null,
        };

        return { ok: true, intent, recordId, updatedRecord };
      }
      case "deleteRecord": {
        const recordId = formData.get("recordId") as string;
        if (!recordId) return { ok: false, error: "Record ID is required." };
        await dailyQueries.deleteDailyRecord({ recordId, profileId });
        return { ok: true, intent, recordId };
      }
      case "saveDailyNote": {
        const content = formData.get("newNoteContent") as string | null;
        const date = (formData.get("date") as string | null) || today;

        if (!content || content.trim() === "") {
             return { ok: false, error: "Note content cannot be empty.", intent };
        }
        const noteData: DailyNoteInsert = {
            profile_id: profileId,
            date: date,
            content: content,
        };
        const createdNoteDb = await dailyQueries.createDailyNote(noteData);

        if (!createdNoteDb) {
            return { ok: false, error: "Failed to save daily note.", intent };
        }
        const newNote: DailyNoteUI = {
            id: createdNoteDb.id!,
            profile_id: createdNoteDb.profile_id,
            date: createdNoteDb.date || today,
            content: createdNoteDb.content,
            created_at: createdNoteDb.created_at,
            updated_at: createdNoteDb.updated_at,
        };
        return { ok: true, intent, newNote };
      }
      case "deleteDailyNote": {
        const noteId = formData.get("noteId") as string;
        if (!noteId) return { ok: false, error: "Note ID is required." };
        await dailyQueries.deleteDailyNoteById({ noteId, profileId });
        return { ok: true, intent, deletedNoteId: noteId };
      }
      case "updateDailyNote": {
        const noteId = formData.get("noteId") as string | null;
        const content = formData.get("editedNoteContent") as string | null;
        const date = (formData.get("date") as string | null) || today;

        if (!noteId) return { ok: false, error: "Note ID is required for update.", intent };
        if (!content || content.trim() === "") {
             return { ok: false, error: "Note content cannot be empty for update.", intent };
        }
        
        try {
          const updatedNoteDb = await dailyQueries.updateDailyNote({ noteId, profileId, content });
          if (!updatedNoteDb) {
            return { ok: false, error: "Failed to update daily note or note not found.", intent, noteId };
          }
          const updatedNote: DailyNoteUI = {
            id: updatedNoteDb.id!,
            profile_id: updatedNoteDb.profile_id,
            date: updatedNoteDb.date || date,
            content: updatedNoteDb.content,
            created_at: updatedNoteDb.created_at,
            updated_at: updatedNoteDb.updated_at,
          };
          return { ok: true, intent, updatedNote };
        } catch (e: any) {
          console.error("Error in updateDailyNote action case:", e);
          return { ok: false, error: e.message || "Failed to update note.", intent, noteId };
        }
      }
      case "addMemo": {
        const recordId = formData.get("recordId") as string | null;
        const title = formData.get("memoTitle") as string | null;
        const content = formData.get("memoContent") as string | null;

        if (!recordId) return { ok: false, error: "Record ID is required for memo."};
        if (!content || content.trim() === "") return { ok: false, error: "Content is required for memo."};

        const memoData: MemoInsert = {
          profile_id: profileId,
          record_id: recordId,
          title: title ?? "",
          content: content,
        };
        await dailyQueries.createMemo(memoData);
        return { ok: true, intent, recordId };
      }
      case "deleteMemo": {
        const memoId = formData.get("memoId") as string;
        if (!memoId) return { ok: false, error: "Memo ID is required." };
        await dailyQueries.deleteMemo({ memoId, profileId });
        return { ok: true, intent, memoId };
      }
       case "updateSubcode": {
        const recordId = formData.get("recordId") as string;
        const subcode = formData.get("subcode") as string | null;
        if (!recordId) return { ok: false, error: "Record ID is required." };

        const updates: Partial<DailyRecordUpdate> = { subcode };

        const updatedRecordDb = await dailyQueries.updateDailyRecord({
            recordId,
            updates,
            profileId
        });

        if (!updatedRecordDb) {
            return { ok: false, error: "Failed to update subcode or record not found.", intent, recordId };
        }

        const updatedRecord: DailyRecordUI = {
            ...updatedRecordDb,
            id: updatedRecordDb.id!,
            date: updatedRecordDb.date || today,
            duration: updatedRecordDb.duration_minutes ?? undefined,
            is_public: updatedRecordDb.is_public ?? false,
            comment: updatedRecordDb.comment ?? null,
            subcode: updatedRecordDb.subcode ?? null,
            linked_plan_id: updatedRecordDb.linked_plan_id ?? null,
        };

        return { ok: true, intent, recordId, updatedRecord };
      }
      case "activateCategoryAndAddRecordFromPlan": {
        const planId = formData.get("planId") as string | null;
        const categoryCodeToActivate = formData.get("category_code_to_activate") as string | null;
        const isCustomCategoryStr = formData.get("isCustomCategory") as string | null;
        const isCustom = isCustomCategoryStr === 'true';
        const addedFromPlanIdForm = formData.get("addedFromPlanId") as string | null;

        console.log("[Action] Intent: activateCategoryAndAddRecordFromPlan");
        console.log("[Action] Plan ID:", planId, "Category to Activate:", categoryCodeToActivate, "Is Custom:", isCustom, "addedFromPlanIdForm:", addedFromPlanIdForm);

        const subcode = formData.get("subcode") as string | null;
        const durationStr = formData.get("duration") as string | null;
        const comment = formData.get("comment") as string | null;
        const date = (formData.get("date") as string | null) || today;

        if (!planId || !categoryCodeToActivate) {
            console.error("[Action] Missing planId or categoryCodeToActivate");
            return { ok: false, error: "Missing plan ID or category code for activation." };
        }

        try {
            console.log(`[Action] Attempting to activate category: ${categoryCodeToActivate}`);
            if (isCustom) {
                const userCategories = await settingsQueries.getUserCategories({ profileId });
                const categoryToUpdate = userCategories?.find(uc => uc.code === categoryCodeToActivate);
                if (categoryToUpdate) {
                    console.log(`[Action] Found custom category ${categoryToUpdate.id}, setting is_active to true.`);
                    await settingsQueries.updateUserCategory({
                        categoryId: categoryToUpdate.id,
                        profileId,
                        updates: { is_active: true }
                    });
                    console.log(`[Action] Custom category ${categoryCodeToActivate} activated.`);
                } else {
                    console.error(`[Action] Custom category ${categoryCodeToActivate} not found.`);
                    return { ok: false, error: `Custom category ${categoryCodeToActivate} not found for activation.`};
                }
            } else {
                console.log(`[Action] Upserting default category preference for ${categoryCodeToActivate} to active.`);
                await settingsQueries.upsertUserDefaultCodePreference({
                    profile_id: profileId,
                    default_category_code: categoryCodeToActivate,
                    is_active: true
                });
                console.log(`[Action] Default category ${categoryCodeToActivate} preference set to active.`);
            }
        } catch (activationError: any) {
            console.error("[Action] Error activating category:", activationError);
            return { ok: false, error: `Failed to activate category ${categoryCodeToActivate}: ${activationError.message}` };
        }

        let durationMinutes: number | undefined = undefined;
        if (durationStr && durationStr.trim() !== "") {
            durationMinutes = parseInt(durationStr, 10);
            if (isNaN(durationMinutes) || durationMinutes < 0 || durationMinutes > MAX_MINUTES_PER_DAY) {
                console.error("[Action] Invalid duration value:", durationStr);
                return { ok: false, error: "Invalid duration value." };
            }
        }

        const recordData: DailyRecordInsert = {
            profile_id: profileId,
            date: date,
            category_code: categoryCodeToActivate,
            duration_minutes: durationMinutes,
            comment: comment,
            subcode: subcode,
            is_public: false,
            linked_plan_id: planId,
        };

        try {
            console.log("[Action] Attempting to create daily record:", recordData);
            const createdRecord = await dailyQueries.createDailyRecord(recordData);
            console.log("[Action] Daily record created successfully for planId:", planId, "linkedPlanId in record:", recordData.linked_plan_id);
            return { ok: true, intent, activatedCategoryCode: categoryCodeToActivate, addedFromPlanId: planId, createdRecordId: createdRecord?.id };
        } catch (recordCreationError: any) {
            console.error("[Action] Error creating daily record:", recordCreationError);
            return { ok: false, error: `Failed to create daily record after activating category: ${recordCreationError.message}` };
        }
      }
      case "addAllRecordsFromMultiplePlans": {
        const plansDataString = formData.get("plansData") as string | null;
        const dateForRecords = (formData.get("date") as string | null) || today;

        if (!plansDataString) {
          return { ok: false, error: "No plans data provided.", intent };
        }

        let plansToProcess: { plan_id: string, category_code: string, subcode: string | null, duration: number | undefined, comment: string | null, linked_plan_id: string }[] = [];
        try {
          plansToProcess = JSON.parse(plansDataString);
        } catch (e) {
          return { ok: false, error: "Invalid plans data format.", intent };
        }

        if (!Array.isArray(plansToProcess) || plansToProcess.length === 0) {
          return { ok: false, error: "Plans data is empty or not an array.", intent };
        }

        const addedRecordPlanIds: string[] = [];
        const errors: { plan_id: string, error: string }[] = [];
        console.log(`[Action addAllRecordsFromMultiplePlans] Processing ${plansToProcess.length} plans.`);

        for (const plan of plansToProcess) {
          console.log(`[Action addAllRecordsFromMultiplePlans] Validating plan: ${plan.plan_id}, category: ${plan.category_code}`);
          if (!plan.category_code || !isValidCategoryCode(plan.category_code, activeCategoriesForAction)) {
            console.warn(`[Action addAllRecordsFromMultiplePlans] Invalid category for plan ${plan.plan_id}: ${plan.category_code}`);
            errors.push({ plan_id: plan.plan_id, error: `Invalid or inactive category: ${plan.category_code}` });
            continue;
          }

          const recordData: DailyRecordInsert = {
            profile_id: profileId,
            date: dateForRecords,
            category_code: plan.category_code,
            duration_minutes: plan.duration,
            comment: plan.comment,
            subcode: plan.subcode,
            is_public: false,
            linked_plan_id: plan.linked_plan_id,
          };
          console.log(`[Action addAllRecordsFromMultiplePlans] Creating record for plan ${plan.plan_id}:`, recordData);
          try {
            await dailyQueries.createDailyRecord(recordData);
            addedRecordPlanIds.push(plan.plan_id);
            console.log(`[Action addAllRecordsFromMultiplePlans] Successfully created record for plan ${plan.plan_id}`);
          } catch (error: any) {
            console.error(`[Action addAllRecordsFromMultiplePlans] Error creating record for plan ${plan.plan_id}:`, error);
            errors.push({ plan_id: plan.plan_id, error: error.message || "Failed to create record for this plan." });
          }
        }
        console.log(`[Action addAllRecordsFromMultiplePlans] Finished. Added: ${addedRecordPlanIds.length}, Errors: ${errors.length}`);
        if (errors.length > 0 && addedRecordPlanIds.length === 0) {
          return { ok: false, error: "All record creations failed.", intent, errors };
        }
        return { ok: true, intent, addedRecordPlanIds, partialErrors: errors.length > 0 ? errors : undefined };
      }
      default:
        return { ok: false, error: `Unknown intent: ${intent}` };
    }
  } catch (error: any) {
    console.error("Action error:", error);
    return { ok: false, error: error.message || "An unexpected error occurred." };
  }
}

interface AddFormState {
  category: string;
  duration: string;
  comment: string;
}

const initialForm: AddFormState = {
  category: "EX",
  duration: "",
  comment: "",
};

function CalendarPopover({ markedDates, currentSelectedDate }: { markedDates: string[]; currentSelectedDate: string }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        aria-label="달력 열기"
      >
        <CalendarIcon className="w-10 h-10" />
      </Button>
      {open && (
        <div className="absolute left-0 mt-2 z-50 bg-background border rounded-xl shadow-lg p-2">
          <Calendar
            className="w-[320px] p-6"
            selectedDate={DateTime.fromISO(currentSelectedDate)}
            onDateChange={(d: DateTime) => {
              const newDate = d.toISODate();
              if (newDate) {
                navigate(`/daily?date=${newDate}`);
              }
              setOpen(false);
            }}
            markedDates={markedDates}
          />
        </div>
      )}
    </div>
  )
}

function PlanBanner({
  plans,
  addedPlanIds,
  categories,
  setShowActivateCategoryDialog,
  setPlanToActivate,
  onAddAll,
  isAddingAll
}: {
  plans: DailyPlanUI[];
  addedPlanIds: Set<string>;
  categories: UICategory[];
  setShowActivateCategoryDialog: (show: boolean) => void;
  setPlanToActivate: (plan: DailyPlanUI | null) => void;
  onAddAll: () => void;
  isAddingAll: boolean;
}) {
  const fetcher = useFetcher();

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-base">
        <thead>
          <tr className="border-b">
            <th className="py-2 px-2 text-left">Code</th>
            <th className="py-2 px-2 text-left">Subcode</th>
            <th className="py-2 px-2 text-left">Duration</th>
            <th className="py-2 px-2 text-left">Comment</th>
            <th className="py-2 px-2 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {plans.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center text-muted-foreground py-4">작성한 계획이 없습니다</td>
            </tr>
          ) : (
            plans.map(plan => {
              const categoryInfo = categories.find(c => c.code === plan.category_code);
              const isCategoryActive = categoryInfo ? categoryInfo.isActive : false;
              const displayCategory = categoryInfo || { code: plan.category_code, icon: '❓', label: plan.category_code || 'Unknown', hasDuration: false, isCustom: false, isActive: false };
              const planCatColor = getCategoryColor(categoryInfo, plan.category_code);

              return (
              <tr key={plan.id} className="border-b">
                <td className="py-2 px-2 flex items-center gap-2">
                  <span className={`text-2xl ${planCatColor}`}>{displayCategory?.icon || ''}</span>
                  <span className="font-medium">{displayCategory?.label || plan.category_code}</span>
                </td>
                <td className="py-2 px-2">{plan.subcode || <span className="text-muted-foreground">-</span>}</td>
                <td className="py-2 px-2">
                  {plan.duration ? `${plan.duration}분` : "-"}
                </td>
                <td className="py-2 px-2">{plan.comment || <span className="text-muted-foreground">No memo</span>}</td>
                <td className="py-2 px-2 text-center">
                  {isCategoryActive ? (
                    <fetcher.Form method="post">
                      <input type="hidden" name="intent" value="addRecordFromPlan" />
                      <input type="hidden" name="planId" value={plan.id} />
                      <input type="hidden" name="category_code" value={plan.category_code} />
                      {plan.subcode && <input type="hidden" name="subcode" value={plan.subcode} />}
                      {plan.duration && <input type="hidden" name="duration" value={plan.duration.toString()} />}
                      <input type="hidden" name="comment" value={plan.comment || ''} />
                      <input type="hidden" name="linked_plan_id" value={plan.id} />
                      <Button
                        type="submit"
                        variant={addedPlanIds.has(plan.id) ? "secondary" : "outline"}
                        size="sm"
                        disabled={addedPlanIds.has(plan.id) || fetcher.state !== 'idle'}
                      >
                        {addedPlanIds.has(plan.id) ? "추가됨" : (fetcher.state !== 'idle' ? "추가중..." : "추가")}
                      </Button>
                    </fetcher.Form>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPlanToActivate(plan);
                        setShowActivateCategoryDialog(true);
                      }}
                      disabled={addedPlanIds.has(plan.id)}
                    >
                      {addedPlanIds.has(plan.id) ? "추가됨" : "추가 (비활성)"}
                    </Button>
                  )}
                </td>
              </tr>
            )})
          )}
        </tbody>
      </table>
      {plans.length > 0 && (
        <div className="flex justify-end mt-2 p-2">
          <Button
            onClick={onAddAll}
            disabled={isAddingAll || plans.every(p => addedPlanIds.has(p.id))}
            size="sm"
          >
            {isAddingAll ? "처리 중..." : "모두 기록에 추가"}
          </Button>
        </div>
      )}
    </div>
  );
}

interface DailyPageProps {
    loaderData: DailyPageLoaderData;
}

export default function DailyPage({ loaderData }: DailyPageProps) {
  const { today, records: initialRecords, dailyNotes: initialDailyNotes, plansForBanner, markedDates, profileId, categories } = loaderData;

  const fetcher = useFetcher<typeof action>();

  const [form, setForm] = useState<AddFormState>(() => {
      const firstActiveCategory = categories.find(c => c.isActive);
      return { ...initialForm, category: firstActiveCategory ? firstActiveCategory.code : "EX" };
  });
  const [records, setRecords] = useState<DailyRecordUI[]>(initialRecords);
  const [currentDailyNotes, setCurrentDailyNotes] = useState<DailyNoteUI[]>(initialDailyNotes);
  const [newNoteContent, setNewNoteContent] = useState("");

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [editRowCategory, setEditRowCategory] = useState<string>(() => {
      const firstActiveCategory = categories.find(c => c.isActive);
      return firstActiveCategory ? firstActiveCategory.code : "EX";
  });
  const [editRowDuration, setEditRowDuration] = useState('');
  const [editRowComment, setEditRowComment] = useState('');
  const [editRowIsPublic, setEditRowIsPublic] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSubcodeForRecordId, setEditingSubcodeForRecordId] = useState<string | null>(null);
  const [editSubcodeValue, setEditSubcodeValue] = useState("");
  const [showMemoFormForRecordId, setShowMemoFormForRecordId] = useState<string | null>(null);
  const [memoTitle, setMemoTitle] = useState("");
  const [memoContent, setMemoContent] = useState("");

  const [durationError, setDurationError] = useState<string | null>(null);
  const [isPlanBannerCollapsed, setIsPlanBannerCollapsed] = useState(plansForBanner.length === 0);
  const [addedPlanIds, setAddedPlanIds] = useState(() => new Set(loaderData.records.map(r => r.linked_plan_id).filter(Boolean) as string[]));
  const [showActivateCategoryDialog, setShowActivateCategoryDialog] = useState(false);
  const [planToActivate, setPlanToActivate] = useState<DailyPlanUI | null>(null);
  const [pendingAddAllPlansQueue, setPendingAddAllPlansQueue] = useState<DailyPlanUI[]>([]);
  const [isAddingAllPlans, setIsAddingAllPlans] = useState(false);

  useEffect(() => {
    setRecords(initialRecords);
    setCurrentDailyNotes(initialDailyNotes);
    setNewNoteContent("");
    setAddedPlanIds(new Set(initialRecords.map(r => r.linked_plan_id).filter(Boolean) as string[]));
    const firstActiveCategory = categories.find(c => c.isActive);
    setForm({ ...initialForm, category: firstActiveCategory ? firstActiveCategory.code : "EX" });
    setIsEditing(false);
    setSelectedRowId(null);
    setShowActivateCategoryDialog(false);
    setPlanToActivate(null);
    setPendingAddAllPlansQueue([]);
    setIsAddingAllPlans(false);
  }, [initialRecords, initialDailyNotes, categories]);

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
        type BaseActionResponse = { ok: boolean; intent?: string; error?: string; };
        type ActionResponseOkAdd = BaseActionResponse & { ok: true; intent: "addRecord" | "addRecordFromPlan"; createdRecordId?: string; addedFromPlanId?: string; };
        type ActionResponseOkActivate = BaseActionResponse & { ok: true; intent: "activateCategoryAndAddRecordFromPlan"; createdRecordId?: string; addedFromPlanId?: string; activatedCategoryCode?: string; };
        type ActionResponseOkUpdate = BaseActionResponse & { ok: true; intent: "updateRecord" | "updateSubcode"; recordId: string; updatedRecord: DailyRecordUI; };
        type ActionResponseOkDeleteRecMemo = BaseActionResponse & { ok: true; intent: "deleteRecord" | "deleteMemo"; recordId?: string; memoId?: string; };
        type ActionResponseOkNoteAdd = BaseActionResponse & { ok: true; intent: "saveDailyNote"; newNote: DailyNoteUI; };
        type ActionResponseOkNoteDelete = BaseActionResponse & { ok: true; intent: "deleteDailyNote"; deletedNoteId: string; };
        type ActionResponseOkNoteUpdate = BaseActionResponse & { ok: true; intent: "updateDailyNote"; updatedNote: DailyNoteUI; };
        type ActionResponseOkAddMemo = BaseActionResponse & { ok: true; intent: "addMemo"; recordId?: string; };
        type ActionResponseOkAddAll = BaseActionResponse & { ok: true; intent: "addAllRecordsFromMultiplePlans"; addedRecordPlanIds: string[]; partialErrors?: {plan_id: string, error: string}[] };
        type ActionResponseError = BaseActionResponse & { ok: false; errors?: any };

        const actionData = fetcher.data as ActionResponseOkAdd | ActionResponseOkActivate | ActionResponseOkUpdate | ActionResponseOkDeleteRecMemo | ActionResponseOkNoteAdd | ActionResponseOkNoteDelete | ActionResponseOkNoteUpdate | ActionResponseOkAddMemo | ActionResponseOkAddAll | ActionResponseError;

        if (actionData.ok) {
            if (actionData.intent === "addRecord" || actionData.intent === "addRecordFromPlan" || (actionData.intent === "activateCategoryAndAddRecordFromPlan" && (actionData as ActionResponseOkActivate).createdRecordId)) {
                const addActionResult = actionData as ActionResponseOkAdd | ActionResponseOkActivate;
                setForm(initialForm);
                setSelectedRowId(null);
                setIsEditing(false);
                if (addActionResult.addedFromPlanId) {
                    setAddedPlanIds(prev => new Set(prev).add(addActionResult.addedFromPlanId!));
                }
                if (actionData.intent === "activateCategoryAndAddRecordFromPlan" && addActionResult.addedFromPlanId) {
                    setShowActivateCategoryDialog(false);
                    setPlanToActivate(null);
                    setPendingAddAllPlansQueue(prevQueue => {
                        const newQueue = prevQueue.filter(p => p.id !== addActionResult.addedFromPlanId);
                        processNextPendingPlanForActivation(newQueue);
                        return newQueue;
                    });
                } else if (actionData.intent !== "activateCategoryAndAddRecordFromPlan") {
                    setIsAddingAllPlans(false);
                }
            } else if (actionData.intent === "updateRecord" ) {
                 const updateResult = actionData as ActionResponseOkUpdate;
                if (updateResult.updatedRecord) {
                    setRecords(prevRecords =>
                        prevRecords.map(r =>
                            r.id === updateResult.recordId ? { ...r, ...updateResult.updatedRecord } : r
                        )
                    );
                }
                setIsEditing(false);
                setSelectedRowId(null);
                setForm(initialForm);
            } else if (actionData.intent === "updateSubcode") {
                const updateSubcodeResult = actionData as ActionResponseOkUpdate;
                if (updateSubcodeResult.updatedRecord) {
                     setRecords(prevRecords =>
                        prevRecords.map(r =>
                            r.id === updateSubcodeResult.recordId ? { ...r, ...updateSubcodeResult.updatedRecord } : r
                        )
                    );
                } else {
                    console.warn(`[DailyPage Effect] updateSubcode for ${updateSubcodeResult.recordId} was ok, but no updatedRecord data received.`);
                }
                setEditingSubcodeForRecordId(null);
            } else if (actionData.intent === "addMemo") {
                const addMemoResult = actionData as ActionResponseOkAddMemo;
                setShowMemoFormForRecordId(null);
                setMemoTitle("");
                setMemoContent("");
                console.log("Memo added for recordId:", addMemoResult.recordId);
            } else if (actionData.intent === "deleteRecord") {
                const deleteResult = actionData as ActionResponseOkDeleteRecMemo;
                setRecords(prevRecords => prevRecords.filter(r => r.id !== deleteResult.recordId));
                if (selectedRowId === deleteResult.recordId) {
                    setSelectedRowId(null);
                    setIsEditing(false);
                    setForm(initialForm);
                }
            } else if (actionData.intent === "deleteMemo") {
                const deleteMemoResult = actionData as ActionResponseOkDeleteRecMemo;
                 setRecords(prevRecords => prevRecords.map(r => ({
                     ...r,
                     memos: r.memos ? r.memos.filter(m => m.id !== deleteMemoResult.memoId) : []
                 })));
            } else if (actionData.intent === "saveDailyNote") {
                const addNoteResult = actionData as ActionResponseOkNoteAdd;
                setCurrentDailyNotes(prevNotes => {
                    if (prevNotes.some(note => note.id === addNoteResult.newNote.id)) {
                        return prevNotes;
                    }
                    return [...prevNotes, addNoteResult.newNote];
                });
                setNewNoteContent("");
            } else if (actionData.intent === "deleteDailyNote") {
                const deleteNoteResult = actionData as ActionResponseOkNoteDelete;
                setCurrentDailyNotes(prevNotes => prevNotes.filter(note => note.id !== deleteNoteResult.deletedNoteId));
            } else if (actionData.intent === "updateDailyNote") {
                const updateNoteResult = actionData as ActionResponseOkNoteUpdate;
                setCurrentDailyNotes(prevNotes =>
                    prevNotes.map(note =>
                        note.id === updateNoteResult.updatedNote.id ? updateNoteResult.updatedNote : note
                    )
                );
            } else if (actionData.intent === "addAllRecordsFromMultiplePlans") {
                const addAllResult = actionData as ActionResponseOkAddAll;
                if (addAllResult.addedRecordPlanIds && addAllResult.addedRecordPlanIds.length > 0) {
                    setAddedPlanIds(prev => new Set([...prev, ...addAllResult.addedRecordPlanIds!]));
                }
                if (addAllResult.partialErrors && addAllResult.partialErrors.length > 0) {
                    alert(`일부 계획을 기록으로 추가하는데 실패했습니다: ${addAllResult.partialErrors.map(e => `${e.plan_id}: ${e.error}`).join("; ")}`);
                }
                if (pendingAddAllPlansQueue.length > 0 && !showActivateCategoryDialog) {
                    processNextPendingPlanForActivation(pendingAddAllPlansQueue);
                } else if (pendingAddAllPlansQueue.length === 0) {
                    setIsAddingAllPlans(false);
                }
            }
        } else {
            const errorResult = actionData as ActionResponseError;
            console.error("Action Error:", errorResult.error, "Intent:", errorResult.intent);
            if (errorResult.intent === "activateCategoryAndAddRecordFromPlan") {
                setShowActivateCategoryDialog(false);
                const failedPlanId = planToActivate?.id;
                setPlanToActivate(null);
                alert(`카테고리 활성화 및 기록 추가 중 오류 발생: ${errorResult.error}`);
                if (isAddingAllPlans && failedPlanId) {
                    setPendingAddAllPlansQueue(prevQueue => {
                        const newQueue = prevQueue.filter(p => p.id !== failedPlanId);
                        processNextPendingPlanForActivation(newQueue);
                        return newQueue;
                    });
                } else {
                    setIsAddingAllPlans(false);
                }
            } else if (errorResult.intent === "addAllRecordsFromMultiplePlans") {
                setIsAddingAllPlans(false);
                alert(`여러 계획 추가 중 오류 발생: ${errorResult.error}${errorResult.errors ? ` Details: ${JSON.stringify(errorResult.errors)}` : ''}`);
                setPendingAddAllPlansQueue([]);
            } else if (errorResult.intent === "updateRecord" || errorResult.intent === "addRecord") {
                if (errorResult.error?.includes("duration")) {
                    setDurationError(errorResult.error);
                } else {
                    alert(`오류 (${errorResult.intent || '알 수 없음'}): ${errorResult.error}`);
                }
            } else {
                alert(`오류 (${errorResult.intent || '알 수 없음'}): ${errorResult.error}`);
            }
        }
    }
  }, [fetcher.data, fetcher.state, planToActivate, isAddingAllPlans]);

  function validateDuration(value: string): boolean {
    const num = Number(value);
    if (value.trim() === "") {
        setDurationError(null);
        return true;
    }
    if (isNaN(num) || num < 0 || num > MAX_MINUTES_PER_DAY) {
      setDurationError(`0에서 ${MAX_MINUTES_PER_DAY} 사이의 숫자를 입력해주세요.`);
      return false;
    }
    setDurationError(null);
    return true;
  }

  function handleFormCategorySelect(code: string) {
    const selectedCat = categories.find(c => c.code === code);
    if (selectedCat && selectedCat.isActive) {
        if (isEditing && selectedRecord?.linked_plan_id) return;
        if (isEditing) setEditRowCategory(code);
        else setForm(f => ({ ...f, category: code }));
    } else {
        console.warn("Attempted to select an invalid or inactive category code:", code);
    }
  }

  function handleRowClick(record: DailyRecordUI) {
    if (selectedRowId === record.id && isEditing) {
        return;
    }
    setSelectedRowId(record.id);
    setEditRowCategory(record.category_code);
    setEditRowDuration(record.duration ? String(record.duration) : '');
    setEditRowComment(record.comment || '');
    setEditRowIsPublic(record.is_public);
    setIsEditing(true);
    setDurationError(null);
    setEditingSubcodeForRecordId(null);
    setShowMemoFormForRecordId(null);
  }

  function handleEditRowCancel() {
    setIsEditing(false);
    const currentRecord = records.find(r => r.id === selectedRowId);
    if (currentRecord) {
        if (isValidCategoryCode(currentRecord.category_code, categories.filter(c => c.isActive))) {
            setEditRowCategory(currentRecord.category_code);
        } else {
            const firstActive = categories.find(c => c.isActive);
            setEditRowCategory(firstActive ? firstActive.code : initialForm.category);
        }
        setEditRowDuration(currentRecord.duration ? String(currentRecord.duration) : '');
        setEditRowComment(currentRecord.comment || '');
        setEditRowIsPublic(currentRecord.is_public);
    } else {
        const firstActive = categories.find(c => c.isActive);
        setEditRowCategory(firstActive ? firstActive.code : initialForm.category);
        setEditRowDuration('');
        setEditRowComment('');
        setEditRowIsPublic(false);
    }
    setDurationError(null);
  }

  function processNextPendingPlanForActivation(queue: DailyPlanUI[]) {
    if (queue.length > 0) {
      const nextPlan = queue[0];
      setPlanToActivate(nextPlan);
      setShowActivateCategoryDialog(true);
    } else {
      setPlanToActivate(null);
      setShowActivateCategoryDialog(false);
      setIsAddingAllPlans(false);
    }
  }

  function handleAddAllPlansToRecords() {
    const plansReadyToAdd = plansForBanner.filter(p => !addedPlanIds.has(p.id));
    if (plansReadyToAdd.length === 0) {
      alert("추가할 새로운 계획이 없습니다.");
      return;
    }

    setIsAddingAllPlans(true);

    const directAddPayload: {
        plan_id: string;
        category_code: string;
        subcode: string | null;
        duration: number | undefined;
        comment: string | null;
        linked_plan_id: string;
    }[] = [];
    let activationNeededPlans: DailyPlanUI[] = [];

    for (const plan of plansReadyToAdd) {
      const categoryInfo = categories.find(c => c.code === plan.category_code);
      if (categoryInfo && categoryInfo.isActive) {
        directAddPayload.push({
          plan_id: plan.id,
          category_code: plan.category_code,
          subcode: plan.subcode,
          duration: plan.duration,
          comment: plan.comment,
          linked_plan_id: plan.id,
        });
      } else {
        activationNeededPlans.push(plan);
      }
    }

    if (directAddPayload.length > 0) {
      const formData = new FormData();
      formData.append("intent", "addAllRecordsFromMultiplePlans");
      formData.append("date", today);
      formData.append("plansData", JSON.stringify(directAddPayload));
      fetcher.submit(formData, { method: "post" });
      setPendingAddAllPlansQueue(activationNeededPlans);
    } else if (activationNeededPlans.length > 0) {
      setPendingAddAllPlansQueue(activationNeededPlans);
      processNextPendingPlanForActivation(activationNeededPlans);
    } else {
      setIsAddingAllPlans(false);
    }
  }

  const currentFormCategory = isEditing ? editRowCategory : form.category;
  const currentFormDuration = isEditing ? editRowDuration : form.duration;
  const currentFormComment = isEditing ? editRowComment : form.comment;
  const currentFormIsPublic = isEditing ? editRowIsPublic : false;
  const selectedRecord = records.find(r => r.id === selectedRowId);

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 pt-16 bg-background min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-3xl">Daily</h1>
          <CalendarPopover markedDates={markedDates} currentSelectedDate={today} />
        </div>
        <div className="text-gray-500 text-lg">{DateTime.fromISO(today).toFormat("yyyy-MM-dd (ccc)")}</div>
        <Button asChild className="ml-2" variant="default" size="sm">
          <Link to="/plan/tomorrow">
            <Plus className="w-4 h-4 mr-1" />Tomorrow Plan
          </Link>
        </Button>
      </div>
      {plansForBanner.length > 0 && (
        <Collapsible
          open={!isPlanBannerCollapsed}
          onOpenChange={(open:boolean) => setIsPlanBannerCollapsed(!open)}
          className="mb-8"
        >
          <div className="rounded-xl bg-muted border">
            <CollapsibleTrigger asChild>
              <div className="px-6 py-3 flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-lg text-foreground">어제 작성한 오늘의 계획</span>
                </div>
                <Button variant="ghost" size="sm">
                  {isPlanBannerCollapsed ? "펴기" : "접기"}
                  <span className="sr-only">Toggle Plan Banner</span>
                </Button>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <PlanBanner
                plans={plansForBanner}
                addedPlanIds={addedPlanIds}
                categories={categories}
                setShowActivateCategoryDialog={setShowActivateCategoryDialog}
                setPlanToActivate={setPlanToActivate}
                onAddAll={handleAddAllPlansToRecords}
                isAddingAll={isAddingAllPlans}
              />
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{isEditing && selectedRowId ? "Edit Record" : "Add Daily Record"}</CardTitle>
            </CardHeader>
            <CardContent>
              <fetcher.Form method="post" onSubmit={() => setDurationError(null)}>
                <input type="hidden" name="intent" value={isEditing && selectedRowId ? "updateRecord" : "addRecord"} />
                {isEditing && selectedRowId && <input type="hidden" name="recordId" value={selectedRowId} />}
                <input type="hidden" name="date" value={today} />
                <CategorySelector
                  categories={categories.filter(cat => cat.isActive)}
                  selectedCategoryCode={currentFormCategory}
                  onSelectCategory={handleFormCategorySelect}
                  disabled={(isEditing && !!selectedRecord?.linked_plan_id) || (fetcher.state !== 'idle' && fetcher.formData?.get('intent') === (isEditing ? 'updateRecord' : 'addRecord'))}
                  instanceId="daily-page-form-selector"
                />
                <div className="flex flex-col gap-2 mt-2">
                    <div className="flex gap-2">
                        <div className="relative">
                        <Input
                            name="duration"
                            type="number"
                            min={0}
                            max={MAX_MINUTES_PER_DAY}
                            placeholder="분"
                            value={currentFormDuration}
                            onChange={(e) => {
                                if (isEditing) {
                                    if (validateDuration(e.target.value)) setEditRowDuration(e.target.value);
                                } else {
                                    if (validateDuration(e.target.value)) setForm(f => ({ ...f, duration: e.target.value }));
                                }
                            }}
                            className={`w-24 ${durationError ? 'border-red-500' : ''}`}
                            disabled={fetcher.state !== 'idle' && fetcher.formData?.get('intent') === (isEditing ? 'updateRecord' : 'addRecord')}
                        />
                        {durationError && (
                            <div className="absolute -bottom-6 left-0 text-xs text-red-500">
                            {durationError}
                            </div>
                        )}
                        </div>
                        <Input
                            name="comment"
                            placeholder="간단 메모"
                            value={currentFormComment || ''}
                            onChange={(e) => {
                                if (isEditing) setEditRowComment(e.target.value);
                                else setForm(f => ({ ...f, comment: e.target.value }));
                            }}
                            className="flex-1"
                            disabled={fetcher.state !== 'idle' && fetcher.formData?.get('intent') === (isEditing ? 'updateRecord' : 'addRecord')}
                        />
                        <input type="hidden" name="category_code" value={currentFormCategory} />
                        {isEditing && selectedRowId && (
                            <div className="flex items-center space-x-2 pt-2 flex-shrink-0">
                                <Label htmlFor="is_public_edit" className="text-sm">공개</Label>
                                <input type="checkbox" name="is_public" id="is_public_edit" checked={editRowIsPublic} onChange={(e) => setEditRowIsPublic(e.target.checked)} className="form-checkbox h-4 w-4 text-primary rounded"/>
                            </div>
                        )}
                        {isEditing && selectedRowId ? (
                            <div className="flex gap-1 flex-shrink-0">
                                <Button type="submit" className="ml-2" size="sm" disabled={fetcher.state !== 'idle'}>저장</Button>
                                <Button type="button" className="ml-1" size="sm" variant="outline" onClick={handleEditRowCancel} disabled={fetcher.state !== 'idle'}>취소</Button>
                                <Button type="button" variant="destructive" size="sm" className="ml-1" disabled={fetcher.state !== 'idle'} onClick={() => {
                                    if (confirm("Are you sure you want to delete this record?") && selectedRowId) {
                                        const formData = new FormData();
                                        formData.append("intent", "deleteRecord");
                                        formData.append("recordId", selectedRowId);
                                        fetcher.submit(formData, { method: "post" });
                                    }
                                }}>삭제</Button>
                            </div>
                        ) : (
                            <Button type="submit" className="ml-2 flex-shrink-0" disabled={fetcher.state !== 'idle' || !form.category || !isValidCategoryCode(form.category, categories.filter(c => c.isActive))}>
                                {fetcher.state !== 'idle' && fetcher.formData?.get('intent') === 'addRecord' ? "추가중..." : "Add"}
                            </Button>
                        )}
                    </div>
                </div>
              </fetcher.Form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-base">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 px-2 text-left">Category</th>
                      <th className="py-2 px-2 text-left">Subcode</th>
                      <th className="py-2 px-2 text-left">Duration</th>
                      <th className="py-2 px-2 text-left">Comment</th>
                      <th className="py-2 px-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((rec) => {
                      const categoryInfo = categories.find(c => c.code === rec.category_code);
                      const displayCategory = categoryInfo || {
                          code: rec.category_code,
                          label: rec.category_code || 'Unknown',
                          icon: '❓',
                          isCustom: false,
                          isActive: false,
                          hasDuration: false
                        };
                      const catColor = getCategoryColor(categoryInfo, rec.category_code);
                      return (
                        <React.Fragment key={`record-item-${rec.id}`}>
                          <tr
                            className={`border-b cursor-pointer ${selectedRowId === rec.id ? 'bg-accent/30' : ''}`}
                            onClick={() => handleRowClick(rec)}
                          >
                            <td className="py-2 px-2 flex items-center gap-2">
                              <span className={`text-2xl ${catColor}`}>{displayCategory.icon}</span>
                              <span className="font-medium">{displayCategory.label}</span>
                            </td>
                            <td className="py-2 px-2">{rec.subcode || <span className="text-muted-foreground">-</span>}</td>
                            <td className="py-2 px-2">
                              {rec.duration ? `${rec.duration}분` : (displayCategory.hasDuration ? "-" : "")}
                            </td>
                            <td className="py-2 px-2">{rec.comment || <span className="text-muted-foreground">No comment</span>}</td>
                            <td className="py-2 px-2 text-center flex gap-2 justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); setEditingSubcodeForRecordId(rec.id); setEditSubcodeValue(rec.subcode || ""); setShowMemoFormForRecordId(null); setSelectedRowId(rec.id); setIsEditing(false);}}
                              >
                                세부코드
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); setShowMemoFormForRecordId(rec.id); setMemoTitle(""); setMemoContent(""); setEditingSubcodeForRecordId(null);setSelectedRowId(rec.id); setIsEditing(false);}}
                              >
                                메모
                              </Button>
                            </td>
                          </tr>
                          {editingSubcodeForRecordId === rec.id && (
                            <tr key={`subcode-edit-${rec.id}`}>
                              <td colSpan={5} className="bg-muted px-4 py-3">
                                <fetcher.Form method="post" className="flex flex-col md:flex-row gap-2 items-start md:items-center" onSubmit={() => setEditingSubcodeForRecordId(null)}>
                                  <input type="hidden" name="intent" value="updateSubcode" />
                                  <input type="hidden" name="recordId" value={rec.id} />
                                  <Input
                                    name="subcode"
                                    value={editSubcodeValue || ''}
                                    onChange={(e) => setEditSubcodeValue(e.target.value)}
                                    className="flex-1"
                                    placeholder="세부코드를 입력하세요..."
                                  />
                                  <div className="flex gap-2 mt-2 md:mt-0">
                                    <Button type="submit" size="sm" disabled={editSubcodeValue === (rec.subcode || '') || fetcher.state !== 'idle'}>저장</Button>
                                    <Button type="button" size="sm" variant="outline" onClick={() => setEditingSubcodeForRecordId(null)}>
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </fetcher.Form>
                              </td>
                            </tr>
                          )}
                          {showMemoFormForRecordId === rec.id && !isEditing && !editingSubcodeForRecordId && (
                             <tr key={`memo-form-wrapper-${rec.id}`}>
                                <td colSpan={5} className="bg-muted p-0">
                                   <div className="p-4 border-t">
                                    <h4 className="font-medium text-md mb-2">새 메모 작성 (기록: {rec.comment?.substring(0,20) || categories.find(c=>c.code === rec.category_code)?.label || 'N/A'})</h4>
                                    <fetcher.Form method="post" className="flex flex-col gap-3" onSubmit={() => setShowMemoFormForRecordId(null)}>
                                        <input type="hidden" name="intent" value="addMemo" />
                                        <input type="hidden" name="recordId" value={rec.id} />
                                        <Input
                                            name="memoTitle"
                                            placeholder="제목 (선택)"
                                            value={memoTitle}
                                            onChange={e => setMemoTitle(e.target.value)}
                                        />
                                        <Textarea
                                            name="memoContent"
                                            placeholder="내용을 입력하세요..."
                                            value={memoContent}
                                            onChange={e => setMemoContent(e.target.value)}
                                            className="min-h-[100px]"
                                            required
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button type="submit" size="sm" disabled={!memoContent.trim() || (fetcher.state !== 'idle' && fetcher.formData?.get('intent') === 'addMemo' && fetcher.formData?.get('recordId') === rec.id) }>저장</Button>
                                            <Button type="button" size="sm" variant="outline" onClick={() => setShowMemoFormForRecordId(null)}>취소</Button>
                                        </div>
                                    </fetcher.Form>
                                   </div>
                                </td>
                             </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    {records.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-muted-foreground py-8">No records yet for {DateTime.fromISO(today).toFormat("yyyy-MM-dd")}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <DailyNotesSection 
            currentDailyNotes={currentDailyNotes}
            newNoteContent={newNoteContent}
            setNewNoteContent={setNewNoteContent}
            fetcher={fetcher}
            today={today}
          />

        </div>
        <div className="w-full lg:w-96 space-y-4">
          <div className="font-semibold mb-2 text-sm text-muted-foreground mt-4">기록별 메모</div>
          {records.flatMap(r => r.memos || []).length === 0 && !showMemoFormForRecordId && <p className="text-muted-foreground text-sm">작성된 메모가 없습니다. 메모를 추가하려면 각 기록 옆의 '메모' 버튼을 클릭하세요.</p>}
          {records.map(record => (
            record.memos && record.memos.length > 0 && (
              <div key={`record-memos-summary-${record.id}`} className="mb-4">
                 <h4 className="font-medium text-sm mb-1 flex items-center gap-1">
                    <span className={`text-lg ${getCategoryColor(categories.find(c=>c.code === record.category_code), record.category_code)}`}>{categories.find(c => c.code === record.category_code)?.icon || '❓'}</span>
                    {record.comment || (categories.find(c => c.code === record.category_code)?.label || record.category_code)}
                 </h4>
                {record.memos.map(memo => (
                  <Card key={memo.id} className="mb-2 bg-muted/30">
                    <CardHeader className="pb-2 pt-3 px-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-md">{memo.title || '제목 없음'}</CardTitle>
                        <fetcher.Form method="post" style={{display: 'inline-block'}}>
                            <input type="hidden" name="intent" value="deleteMemo" />
                            <input type="hidden" name="memoId" value={memo.id} />
                            <Button variant="ghost" size="icon" type="submit" disabled={fetcher.state !== 'idle' && fetcher.formData?.get('intent') === 'deleteMemo' && fetcher.formData?.get('memoId') === memo.id}><X className="w-4 h-4 text-destructive/70 hover:text-destructive" /></Button>
                        </fetcher.Form>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {memo.created_at ? DateTime.fromISO(memo.created_at).toLocaleString(DateTime.DATETIME_SHORT) : ''}
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                      <div className="whitespace-pre-line text-sm">{memo.content}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ))}
        </div>
      </div>
      {showActivateCategoryDialog && planToActivate && (
        <AlertDialog open={showActivateCategoryDialog} onOpenChange={(open) => {
            if (!open) { 
                setPlanToActivate(null);
                if(isAddingAllPlans) {
                    setPendingAddAllPlansQueue([]); 
                    setIsAddingAllPlans(false); 
                }
            }
            setShowActivateCategoryDialog(open);
        }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>비활성 카테고리</AlertDialogTitle>
                    <AlertDialogDescription>
                        선택한 계획의 카테고리 '{categories.find(c => c.code === planToActivate.category_code)?.label || planToActivate.category_code}'는 현재 비활성 상태입니다.
                        이 기록을 추가하려면 카테고리를 활성화해야 합니다. 활성화하고 기록을 추가하시겠습니까?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => {
                         setShowActivateCategoryDialog(false); // Ensure dialog closes on cancel
                    }}>취소</AlertDialogCancel>
                    <AlertDialogAction
                        type="button"
                        onClick={() => {
                            if (planToActivate) {
                                const formData = new FormData();
                                formData.append("intent", "activateCategoryAndAddRecordFromPlan");
                                formData.append("planId", planToActivate.id); 
                                formData.append("addedFromPlanId", planToActivate.id); 
                                formData.append("category_code_to_activate", planToActivate.category_code);
                                if (planToActivate.subcode) formData.append("subcode", planToActivate.subcode);
                                if (planToActivate.duration) formData.append("duration", planToActivate.duration.toString());
                                formData.append("comment", planToActivate.comment || '');
                                formData.append("linked_plan_id", planToActivate.id); 
                                formData.append("isCustomCategory", String(categories.find(c=>c.code === planToActivate.category_code)?.isCustom || false));
                                formData.append("date", today); 
                                fetcher.submit(formData, { method: "post" });
                            }
                        }}
                    >
                        활성화하고 추가
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}