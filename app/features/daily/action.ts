import { redirect } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { DateTime } from "luxon";
import { makeSSRClient } from "~/supa-client";
import * as dailyQueries from "~/features/daily/queries";
import type { DailyRecord as DbDailyRecord, DailyNote as DbDailyNote, Memo as DbMemo, DailyRecordInsert, DailyRecordUpdate, DailyNoteInsert, MemoInsert } from "~/features/daily/queries";
import * as settingsQueries from "~/features/settings/queries";
import { CATEGORIES, type CategoryCode, type UICategory } from "~/common/types/daily";
import type { DailyRecordUI, DailyNoteUI } from "./types";
import { getProfileId } from "~/features/users/utils";

const MAX_MINUTES_PER_DAY = 60 * 24;

function getToday(): string {
  return DateTime.now().toISODate();
}

const isValidCategoryCode = (code: string, activeCategories: UICategory[]): boolean => {
    return activeCategories.some(c => c.code === code && c.isActive);
};

export async function action({ request }: ActionFunctionArgs) {
  const { client } = makeSSRClient(request);
  let profileId: string;
  try {
    profileId = await getProfileId(request);
  } catch (error: any) {
    if (error.message === "User not authenticated") {
      return redirect("/auth/login");
    }
    throw error;
  }

  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const today = getToday();

  const activeCategoriesForAction = await (async () => {
    const [userCategoriesDb, defaultPreferencesDb] = await Promise.all([
      settingsQueries.getUserCategories(client, { profileId }),
      settingsQueries.getUserDefaultCodePreferences(client, { profileId })
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
        const createdRecord = await dailyQueries.createDailyRecord(client, recordData);
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

        const updatedRecordDb = await dailyQueries.updateDailyRecord(client, {
            recordId,
            updates,
            profileId,
        });

        if (!updatedRecordDb) {
            return { ok: false, error: "Failed to update record or record not found.", intent, recordId };
        }

        const updatedRecord: DailyRecordUI = {
            id: updatedRecordDb.id!,
            date: updatedRecordDb.date || today,
            duration_minutes: updatedRecordDb.duration_minutes ?? undefined,
            is_public: updatedRecordDb.is_public ?? false,
            comment: updatedRecordDb.comment ?? null,
            subcode: updatedRecordDb.subcode ?? null,
            linked_plan_id: updatedRecordDb.linked_plan_id ?? null,
            category_code: updatedRecordDb.category_code as CategoryCode,
            profile_id: updatedRecordDb.profile_id,
            created_at: updatedRecordDb.created_at,
            updated_at: updatedRecordDb.updated_at,
         };

        return { ok: true, intent, recordId, updatedRecord };
      }
      case "deleteRecord": {
        const recordId = formData.get("recordId") as string;
        if (!recordId) return { ok: false, error: "Record ID is required." };
        await dailyQueries.deleteDailyRecord(client, { recordId, profileId });
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
        const createdNoteDb = await dailyQueries.createDailyNote(client, noteData);

        if (!createdNoteDb) {
            return { ok: false, error: "Failed to save daily note.", intent };
        }
        const newNote: DailyNoteUI = {
            id: createdNoteDb.id!,
            date: createdNoteDb.date || today,
            content: createdNoteDb.content,
            profile_id: createdNoteDb.profile_id,
            created_at: createdNoteDb.created_at,
            updated_at: createdNoteDb.updated_at,
        };
        return { ok: true, intent, newNote };
      }
      case "deleteDailyNote": {
        const noteId = formData.get("noteId") as string;
        if (!noteId) return { ok: false, error: "Note ID is required." };
        await dailyQueries.deleteDailyNoteById(client, { noteId, profileId });
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
            const updatedNoteDb = await dailyQueries.updateDailyNote(client, { noteId, profileId, content });
            if (!updatedNoteDb) {
                return { ok: false, error: "Failed to update daily note or note not found.", intent, noteId };
            }
            const updatedNote: DailyNoteUI = { 
                id: updatedNoteDb.id!, 
                date: updatedNoteDb.date || date,
                content: updatedNoteDb.content,
                profile_id: updatedNoteDb.profile_id,
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
        if (!content || content.trim() === "") {
          return { ok: false, error: "Memo content is required."};
        }
        if (!title || title.trim() === "") {
          return { ok: false, error: "Memo title is required."};
        }

        const memoData: MemoInsert = {
          profile_id: profileId,
          record_id: recordId,
          title: title,
          content: content,
        };
        const createdMemo = await dailyQueries.createMemo(client, memoData);
        return { ok: true, intent, createdMemoId: createdMemo?.id };
      }
      case "deleteMemo": {
        const memoId = formData.get("memoId") as string | null;
        if (!memoId) return { ok: false, error: "Memo ID is required." };
        await dailyQueries.deleteMemo(client, { memoId, profileId });
        return { ok: true, intent, deletedMemoId: memoId };
      }
      case "updateSubcode": {
        const recordId = formData.get("recordId") as string | null;
        const subcode = formData.get("subcode") as string | null;

        if (!recordId) return { ok: false, error: "Record ID is required." };
        const updates: Partial<DailyRecordUpdate> = { subcode };
        await dailyQueries.updateDailyRecord(client, { recordId, updates, profileId });
        return { ok: true, intent, recordId };
      }
      case "addAllRecordsFromMultiplePlans": {
        const plansDataStr = formData.get("plansData") as string | null;
        const date = (formData.get("date") as string | null) || today;
        if (!plansDataStr) return { ok: false, error: "No plans data provided." };

        const plans = JSON.parse(plansDataStr) as Array<{
            plan_id: string;
            category_code: string;
            subcode: string | null;
            duration: number | null;
            comment: string | null;
            linked_plan_id: string;
        }>;

        const newRecords: DailyRecordInsert[] = plans.map(plan => ({
          profile_id: profileId,
          date: date,
          category_code: plan.category_code,
          subcode: plan.subcode,
          duration_minutes: plan.duration ?? undefined,
          comment: plan.comment,
          linked_plan_id: plan.linked_plan_id,
          is_public: false, // Defaulting to false for bulk add
        }));
        
        await dailyQueries.createMultipleDailyRecords(client, newRecords);

        return { ok: true, intent };
      }
      case "activateCategoryAndAddRecordFromPlan": {
        const categoryCodeToActivate = formData.get("category_code_to_activate") as string;
        const isCustomCategoryStr = formData.get("isCustomCategory") as string;
        const isCustom = isCustomCategoryStr === 'true';

        // 1. Activate Category
        if (isCustom) {
            const userCategories = await settingsQueries.getUserCategories(client, { profileId });
            const categoryToUpdate = userCategories?.find(uc => uc.code === categoryCodeToActivate);
            if (categoryToUpdate) {
                await settingsQueries.updateUserCategory(client, {
                    categoryId: categoryToUpdate.id,
                    profileId,
                    updates: { is_active: true }
                });
            } else {
                 return { ok: false, error: `Custom category ${categoryCodeToActivate} not found.` };
            }
        } else {
            await settingsQueries.upsertUserDefaultCodePreference(client, {
                profile_id: profileId,
                default_category_code: categoryCodeToActivate,
                is_active: true
            });
        }
        
        // 2. Add Record (logic copied from addRecordFromPlan case)
        const durationStr = formData.get("duration") as string | null;
        const comment = formData.get("comment") as string | null;
        const date = (formData.get("date") as string | null) || today;
        const subcode = formData.get("subcode") as string | null;
        const linkedPlanId = formData.get("linked_plan_id") as string | null;

        let durationMinutes: number | undefined = undefined;
        if (durationStr && durationStr.trim() !== "") {
            durationMinutes = parseInt(durationStr, 10);
            if (isNaN(durationMinutes) || durationMinutes < 0 || durationMinutes > MAX_MINUTES_PER_DAY) {
                return { ok: false, error: "Invalid duration value."};
            }
        }
        
        const recordData: DailyRecordInsert = {
          profile_id: profileId,
          date: date,
          category_code: categoryCodeToActivate,
          duration_minutes: durationMinutes,
          comment: comment,
          subcode: subcode,
          is_public: false, // Default to false
          linked_plan_id: linkedPlanId,
        };
        const createdRecord = await dailyQueries.createDailyRecord(client, recordData);
        return { ok: true, intent, createdRecordId: createdRecord?.id, activatedCategory: categoryCodeToActivate };
      }

      default:
        return { ok: false, error: `Unknown intent: ${intent}` };
    }
  } catch (error: any) {
    console.error("Action error:", error);
    const intentVal = formData.get("intent") as string | null;
    return { ok: false, error: error.message || "An unexpected error occurred.", intent: intentVal || "error" };
  }
}