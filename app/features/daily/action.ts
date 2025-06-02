import type { ActionFunctionArgs } from "react-router";
import * as dailyQueries from "~/features/daily/queries";
import * as settingsQueries from "~/features/settings/queries";
import type { DailyRecordUI, DailyNoteUI, MemoUI } from "./types";
import { getToday } from "./utils";
import { isValidCategoryCode } from "./utils";
import type { UICategory } from "./types";
import type { CategoryCode } from "~/common/types/daily";

const MAX_MINUTES_PER_DAY = 60 * 24;

async function getProfileId(_request?: Request): Promise<string> {
  return "fd64e09d-e590-4545-8fd4-ae7b2b784e4a";
}

export async function action({ request }: ActionFunctionArgs) {
  const profileId = await getProfileId(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const date = formData.get("date") as string || getToday();

  const [userCategoriesDb, userDefaultCodePreferencesDb] = await Promise.all([
    settingsQueries.getUserCategories({ profileId }),
    settingsQueries.getUserDefaultCodePreferences({ profileId })
  ]);

  const activeCategories: UICategory[] = [];
  const defaultCategoryPreferences = new Map(
    (userDefaultCodePreferencesDb || []).map(pref => [pref.default_category_code, pref.is_active as boolean])
  );

  (userCategoriesDb || []).forEach((cat: any) => {
    const isActive = defaultCategoryPreferences.get(cat.code) ?? cat.is_active ?? true;
    if (isActive) {
      activeCategories.push({
        code: cat.code,
        label: cat.label || cat.code,
        icon: cat.icon || '📝',
        color: cat.color,
        isCustom: cat.is_custom ?? false,
        isActive: true,
        hasDuration: true,
        sort_order: cat.sort_order
      });
    }
  });

  if (intent === "addRecord" || intent === "updateRecord") {
    const categoryCode = formData.get("category_code") as CategoryCode;
    const durationStr = formData.get("duration") as string;
    const comment = formData.get("comment") as string;
    const subcode = formData.get("subcode") as string | undefined;
    const isPublic = formData.get("is_public") === "on" || formData.get("is_public") === "true";
    const recordId = formData.get("recordId") as string | undefined;

    if (!categoryCode || !isValidCategoryCode(categoryCode, activeCategories)) {
      return { ok: false, intent, error: "Invalid or inactive category selected.", errors: { category_code: "Invalid category."} };
    }

    let durationMinutes: number | null = null;
    if (durationStr) {
      durationMinutes = parseInt(durationStr, 10);
      if (isNaN(durationMinutes) || durationMinutes < 0 || durationMinutes > MAX_MINUTES_PER_DAY) {
        return { ok: false, intent, error: `Duration must be a number between 0 and ${MAX_MINUTES_PER_DAY}.`, errors: { duration: "Invalid duration."} };
      }
    }

    if (intent === "addRecord") {
      const newRecord = {
        profile_id: profileId,
        date,
        category_code: categoryCode,
        duration_minutes: durationMinutes,
        comment: comment || null,
        subcode: subcode || null,
        is_public: isPublic,
        linked_plan_id: null,
      };
      try {
        const createdRecord = await dailyQueries.createDailyRecord(newRecord);
        if (!createdRecord || !createdRecord.id) {
            return { ok: false, intent, error: "Failed to create record: No ID returned" };
        }
        return { ok: true, intent, createdRecordId: createdRecord.id };
      } catch (error: any) {
        console.error("Error creating daily record:", error);
        return { ok: false, intent, error: error.message || "Failed to create record." };
      }
    } else if (intent === "updateRecord" && recordId) {
      const updatedFields = {
        category_code: categoryCode,
        duration_minutes: durationMinutes,
        comment: comment || null,
        subcode: subcode || null,
        is_public: isPublic,
      };
      try {
        const updatedRecordDb = await dailyQueries.updateDailyRecord({ profileId, recordId, updates: updatedFields });
         if (!updatedRecordDb || !updatedRecordDb.id) {
            return { ok: false, intent, error: "Failed to update record: No ID returned" };
        }
        const updatedRecord: DailyRecordUI = {
            id: updatedRecordDb.id!,
            profile_id: updatedRecordDb.profile_id,
            date: updatedRecordDb.date || date,
            duration: updatedRecordDb.duration_minutes ?? undefined,
            is_public: updatedRecordDb.is_public ?? false,
            comment: updatedRecordDb.comment ?? null,
            subcode: updatedRecordDb.subcode ?? null,
            linked_plan_id: updatedRecordDb.linked_plan_id ?? null,
            category_code: updatedRecordDb.category_code as CategoryCode,
            created_at: updatedRecordDb.created_at,
            updated_at: updatedRecordDb.updated_at,
         };
        return { ok: true, intent, recordId, updatedRecord };
      } catch (error: any) {
        console.error("Error updating daily record:", error);
        return { ok: false, intent, error: error.message || "Failed to update record." };
      }
    }
  }

  if (intent === "saveDailyNote" || intent === "updateDailyNote") {
    const noteId = formData.get("noteId") as string | undefined;
    const contentValue = formData.get("content") as string; 

    if (!contentValue || !contentValue.trim()) { 
      return { ok: false, intent, error: "Note content cannot be empty." };
    }

    try {
      if (intent === "updateDailyNote" && noteId) {
        const updatedNoteDb = await dailyQueries.updateDailyNote({ profileId, noteId, content: contentValue }); 
        if (!updatedNoteDb || !updatedNoteDb.id) return { ok: false, intent, error: "Failed to update note."};
        const updatedNote: DailyNoteUI = { 
            id: updatedNoteDb.id!, 
            profile_id: updatedNoteDb.profile_id!,
            date, 
            content: updatedNoteDb.content!,
            created_at: updatedNoteDb.created_at,
            updated_at: updatedNoteDb.updated_at,
         }; 
        return { ok: true, intent: "updateDailyNote", updatedNote };
      } else if (intent === "saveDailyNote" && !noteId) { 
        const newNoteDb = await dailyQueries.createDailyNote({ profile_id: profileId, date, content: contentValue });
        if (!newNoteDb || !newNoteDb.id) return { ok: false, intent, error: "Failed to create note."};
        const newNote: DailyNoteUI = { 
            id:newNoteDb.id!, 
            profile_id: newNoteDb.profile_id!,
            date, 
            content: newNoteDb.content!,
            created_at: newNoteDb.created_at,
            updated_at: newNoteDb.updated_at,
        }; 
        return { ok: true, intent: "saveDailyNote", newNote };
      } else {
        return { ok: false, intent, error: "Invalid state for saving/updating note."};
      }
    } catch (error: any) {
      console.error("Error saving/updating daily note:", error);
      return { ok: false, intent, error: error.message || "Failed to save/update note." };
    }
  }

  if (intent === "deleteDailyNote") {
    const noteId = formData.get("noteId") as string;
    if (!noteId) return { ok: false, intent, error: "Note ID is missing." };
    try {
      await dailyQueries.deleteDailyNoteById({ profileId, noteId });
      return { ok: true, intent, deletedNoteId: noteId };
    } catch (error: any) {
      console.error("Error deleting daily note:", error);
      return { ok: false, intent, error: error.message || "Failed to delete note." };
    }
  }

  if (intent === "addMemo") {
    const recordId = formData.get("recordId") as string;
    const title = formData.get("memoTitle") as string;
    const content = formData.get("memoContent") as string;

    if (!recordId) return { ok: false, intent, error: "Record ID is missing for memo." };
    if (!title || !title.trim()) return { ok: false, intent, error: "Memo title cannot be empty." };

    const newMemo = {
      profile_id: profileId,
      record_id: recordId,
      title,
      content: content || "", 
    };
    try {
      const createdMemoDb = await dailyQueries.createMemo(newMemo);
      if (!createdMemoDb || !createdMemoDb.id) return { ok: false, intent, error: "Failed to create memo."};
      const createdMemo: MemoUI = {
          id: createdMemoDb.id!,
          profile_id: createdMemoDb.profile_id!,
          record_id: createdMemoDb.record_id!,
          title: createdMemoDb.title ?? null,
          content: createdMemoDb.content ?? null,
          created_at: createdMemoDb.created_at!,
          updated_at: createdMemoDb.updated_at!,
      };
      return { ok: true, intent, recordId, memo: createdMemo };
    } catch (error: any) {
      console.error("Error creating memo:", error);
      return { ok: false, intent, error: error.message || "Failed to create memo." };
    }
  }

  if (intent === "deleteMemo") {
    const memoId = formData.get("memoId") as string;
    const recordId = formData.get("recordId") as string; 
    if (!memoId) return { ok: false, intent, error: "Memo ID is missing." };
    try {
      await dailyQueries.deleteMemo({ profileId, memoId });
      return { ok: true, intent, memoId, recordId };
    } catch (error: any) {
      console.error("Error deleting memo:", error);
      return { ok: false, intent, error: error.message || "Failed to delete memo." };
    }
  }
  
  if (intent === "addRecordFromPlan") {
    const planId = formData.get("planId") as string;
    const planCategoryCode = formData.get("planCategoryCode") as CategoryCode; 
    const planDuration = formData.get("planDuration") as string;
    const planComment = formData.get("planComment") as string;

    if (!planId || !planCategoryCode) {
      return { ok: false, intent, error: "Plan details missing." };
    }
    if (!isValidCategoryCode(planCategoryCode, activeCategories)) { 
      return { ok: false, intent, error: "Category for this plan is not active.", needsActivation: true, categoryToActivate: planCategoryCode, planDetails: { planId, planCategoryCode, planDuration, planComment, date } };
    }

    let durationMinutes: number | null = null;
    if (planDuration) {
      durationMinutes = parseInt(planDuration, 10);
      if (isNaN(durationMinutes) || durationMinutes < 0 || durationMinutes > MAX_MINUTES_PER_DAY) {
        durationMinutes = null;
      }
    }
    
    const newRecord = {
      profile_id: profileId,
      date,
      category_code: planCategoryCode,
      duration_minutes: durationMinutes,
      comment: planComment || `From plan ${planId}`,
      subcode: formData.get("planSubcode") as string || null,
      is_public: false, 
      linked_plan_id: planId,
    };

    try {
      const createdRecord = await dailyQueries.createDailyRecord(newRecord);
      if (!createdRecord || !createdRecord.id) {
        return { ok: false, intent, error: "Failed to create record from plan." };
      }
      return { ok: true, intent, createdRecordId: createdRecord.id, addedFromPlanId: planId };
    } catch (error: any) {
      console.error("Error creating record from plan:", error);
      return { ok: false, intent, error: error.message || "Failed to create record from plan." };
    }
  }

  if (intent === "activateCategoryAndAddRecordFromPlan") {
    const planId = formData.get("planId") as string;
    const categoryToActivate = formData.get("categoryToActivate") as CategoryCode;
    const planCategoryCode = formData.get("planCategoryCode") as CategoryCode;
    const planDuration = formData.get("planDuration") as string;
    const planComment = formData.get("planComment") as string;
    const planDate = formData.get("planDate") as string || date;

    if (categoryToActivate !== planCategoryCode) {
        return { ok: false, error: "Category mismatch during activation." };
    }
    
    try {
        await settingsQueries.upsertUserDefaultCodePreference({
            profile_id: profileId,
            default_category_code: categoryToActivate,
            is_active: true
        });

        let durationMinutes: number | null = null;
        if (planDuration) {
            durationMinutes = parseInt(planDuration, 10);
            if (isNaN(durationMinutes) || durationMinutes < 0 || durationMinutes > MAX_MINUTES_PER_DAY) {
                durationMinutes = null;
            }
        }
        const newRecord = {
            profile_id: profileId,
            date: planDate,
            category_code: planCategoryCode,
            duration_minutes: durationMinutes,
            comment: planComment || `From plan ${planId}`,
            subcode: formData.get("planSubcode") as string || null,
            is_public: false,
            linked_plan_id: planId,
        };
        const createdRecord = await dailyQueries.createDailyRecord(newRecord);
        if (!createdRecord || !createdRecord.id) {
            return { ok: false, intent, error: "Failed to create record after activating category." };
        }
        return { ok: true, intent, createdRecordId: createdRecord.id, addedFromPlanId: planId, activatedCategoryCode: categoryToActivate };

    } catch (error: any) {
        console.error("Error in activateCategoryAndAddRecordFromPlan:", error);
        return { ok: false, intent, error: error.message || "Failed." };
    }
  }
  
  if (intent === "addAllRecordsFromMultiplePlans") {
    const plansJson = formData.get("plans") as string;
    if (!plansJson) return { ok: false, intent, error: "No plans provided." };

    let plansToAdd: { planId: string; planCategoryCode: CategoryCode; planDuration: string; planComment: string; planSubcode?: string; planDate: string; }[];
    try {
      plansToAdd = JSON.parse(plansJson);
    } catch (e) {
      return { ok: false, intent, error: "Invalid plans JSON." };
    }

    const results: { plan_id: string; success: boolean; record_id?: string; error?: string; }[] = [];
    const addedRecordPlanIds: string[] = [];

    for (const plan of plansToAdd) {
      if (!isValidCategoryCode(plan.planCategoryCode, activeCategories)) {
        results.push({ plan_id: plan.planId, success: false, error: `Category ${plan.planCategoryCode} is not active.` });
        continue;
      }

      let durationMinutes: number | null = null;
      if (plan.planDuration) {
        durationMinutes = parseInt(plan.planDuration, 10);
        if (isNaN(durationMinutes) || durationMinutes < 0 || durationMinutes > MAX_MINUTES_PER_DAY) {
          durationMinutes = null;
        }
      }

      const newRecord = {
        profile_id: profileId,
        date: plan.planDate,
        category_code: plan.planCategoryCode,
        duration_minutes: durationMinutes,
        comment: plan.planComment || `From plan ${plan.planId}`,
        subcode: plan.planSubcode || null,
        is_public: false,
        linked_plan_id: plan.planId,
      };

      try {
        const createdRecord = await dailyQueries.createDailyRecord(newRecord);
        if (createdRecord && createdRecord.id) {
          results.push({ plan_id: plan.planId, success: true, record_id: createdRecord.id });
          addedRecordPlanIds.push(plan.planId);
        } else {
          results.push({ plan_id: plan.planId, success: false, error: "Failed to create record instance." });
        }
      } catch (error: any) {
        results.push({ plan_id: plan.planId, success: false, error: error.message || "Unknown error during record creation." });
      }
    }
    
    const partialErrors = results.filter(r => !r.success).map(r => ({plan_id: r.plan_id, error: r.error!}));

    return { 
        ok: true, 
        intent, 
        addedRecordPlanIds,
        ...(partialErrors.length > 0 && { partialErrors })
    };
  }

  if (intent === "updateSubcode") {
    const recordId = formData.get("recordId") as string;
    const newSubcode = formData.get("subcode") as string | null;

    if (!recordId) {
        return { ok: false, intent, error: "Record ID is missing for subcode update." };
    }

    try {
        const updatedRecordDb = await dailyQueries.updateDailyRecord({
            profileId,
            recordId,
            updates: { subcode: newSubcode === '' ? null : newSubcode }
        });
        if (!updatedRecordDb || !updatedRecordDb.id) {
            return { ok: false, intent, error: "Failed to update subcode." };
        }
        const updatedRecord: DailyRecordUI = {
            id: updatedRecordDb.id!,
            profile_id: updatedRecordDb.profile_id,
            date: updatedRecordDb.date || date,
            duration: updatedRecordDb.duration_minutes ?? undefined,
            is_public: updatedRecordDb.is_public ?? false,
            comment: updatedRecordDb.comment ?? null,
            subcode: updatedRecordDb.subcode ?? null,
            linked_plan_id: updatedRecordDb.linked_plan_id ?? null,
            category_code: updatedRecordDb.category_code as CategoryCode,
            created_at: updatedRecordDb.created_at,
            updated_at: updatedRecordDb.updated_at,
         };
        return { ok: true, intent, recordId, updatedRecord };
    } catch (error: any) {
        console.error("Error updating subcode:", error);
        return { ok: false, intent, error: error.message || "Failed to update subcode." };
    }
  }

  return { ok: false, intent, error: "Unknown action intent." };
} 