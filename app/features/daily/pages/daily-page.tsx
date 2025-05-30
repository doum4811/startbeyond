import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Label } from "~/common/components/ui/label";
import { Textarea } from "~/common/components/ui/textarea";
import { Plus, X, Bell, Calendar as CalendarIcon } from "lucide-react";
import { CATEGORIES, type CategoryCode, type Category } from "~/common/types/daily";
import { Calendar } from "~/common/components/ui/calendar";
import { Link, Form, useFetcher } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { DateTime } from "luxon";
import * as dailyQueries from "~/features/daily/queries";
import * as planQueries from "~/features/plan/queries";
import type { DailyRecord as DbDailyRecord, DailyNote as DbDailyNote, Memo as DbMemo, DailyRecordInsert, DailyRecordUpdate, DailyNoteInsert, MemoInsert } from "~/features/daily/queries";
import type { DailyPlan as DbDailyPlan } from "~/features/plan/queries";

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

interface DailyNoteUI extends Omit<DbDailyNote, 'date' | 'created_at' | 'updated_at'> {
  date: string;
  created_at?: string;
  updated_at?: string;
}

interface MemoUI extends Omit<DbMemo, 'created_at' | 'updated_at'> {
  created_at?: string;
  updated_at?: string;
}

interface DailyPlanUI extends Omit<DbDailyPlan, 'duration_minutes' | 'created_at' | 'updated_at' | 'category_id' | 'is_completed' | 'sort_order'> {
  plan_date: string;
  duration?: number;
  is_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

function getToday() {
  return DateTime.now().toISODate();
}

const MAX_MINUTES_PER_DAY = 60 * 24;

function getCategoryColor(code: CategoryCode): string {
  const category = CATEGORIES[code];
  if (!category) return "text-gray-500"; // Fallback for unknown codes
  const map: Record<CategoryCode, string> = {
    EX: "text-orange-500", BK: "text-green-600", ML: "text-orange-600", EM: "text-purple-500", ST: "text-yellow-500", WK: "text-teal-700", HB: "text-pink-500", SL: "text-cyan-600", RT: "text-blue-500"
  };
  return map[code] || "text-gray-500";
}

const isValidCategoryCode = (code: string): code is CategoryCode => {
    return code in CATEGORIES;
};

export interface DailyPageLoaderData {
  today: string;
  records: DailyRecordUI[];
  dailyNote: DailyNoteUI | null;
  plansForBanner: DailyPlanUI[];
  markedDates: string[];
  profileId: string;
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const pageData = data as DailyPageLoaderData | undefined;
  return [
    { title: `Daily Records (${pageData?.today ?? DateTime.now().toISODate()}) - StartBeyond` },
    { name: "description", content: "Track your daily activities and notes." },
  ];
};

async function getProfileId(_request: Request): Promise<string> {
  // return "mock-profile-id";
  return "ef20d66d-ed8a-4a14-ab2b-b7ff26f2643c"; // Updated mock profileId
}

export async function loader({ request }: LoaderFunctionArgs): Promise<DailyPageLoaderData> {
  const profileId = await getProfileId(request);
  const url = new URL(request.url);
  const selectedDate = url.searchParams.get("date") || getToday();

  const [recordsData, dailyNoteData, plansForBannerData, recordDatesResult] = await Promise.all([
    dailyQueries.getDailyRecordsByDate({ profileId, date: selectedDate }),
    dailyQueries.getDailyNoteByDate({ profileId, date: selectedDate }),
    planQueries.getDailyPlansByDate({ profileId, date: selectedDate }),
    dailyQueries.getDatesWithRecords({ profileId, year: DateTime.fromISO(selectedDate).year, month: DateTime.fromISO(selectedDate).month })
  ]);

  const records: DailyRecordUI[] = (recordsData || []).map(r => ({
        ...r,
        date: r.date || selectedDate,
        duration: r.duration_minutes ?? undefined,
        is_public: r.is_public ?? false,
        comment: r.comment ?? null,
        subcode: r.subcode ?? null,
        linked_plan_id: r.linked_plan_id ?? null,
        category_code: r.category_code 
    } as DailyRecordUI));

  const dailyNote: DailyNoteUI | null = dailyNoteData ? { ...dailyNoteData, date: dailyNoteData.date || selectedDate } as DailyNoteUI : null;
  
  const plansForBanner: DailyPlanUI[] = (plansForBannerData || []).map(p => ({
        ...p,
        plan_date: p.plan_date || selectedDate,
        duration: p.duration_minutes ?? undefined,
        is_completed: p.is_completed ?? false,
        comment: p.comment ?? "",
        category_code: p.category_code 
    } as DailyPlanUI));

  const recordIds = records.map(r => r.id).filter((id): id is string => typeof id === 'string');
  const memosData = recordIds.length > 0 ? await dailyQueries.getMemosByRecordIds({ profileId, recordIds }) : [];
  const memos: MemoUI[] = (memosData || []) as MemoUI[];

  const recordsWithMemos: DailyRecordUI[] = records.map(r => ({
    ...r,
    memos: memos.filter(m => m.record_id === r.id)
  }));

  return {
    today: selectedDate,
    records: recordsWithMemos,
    dailyNote,
    plansForBanner,
    markedDates: (recordDatesResult || []).map(d => d.date),
    profileId
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const profileId = await getProfileId(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const today = getToday();

  try {
    switch (intent) {
      case "addRecord":
      case "addRecordFromPlan":
      {
        const categoryCodeStr = formData.get("category_code") as string | null;
        if (!categoryCodeStr || !isValidCategoryCode(categoryCodeStr)) {
          return {ok: false, error: "Invalid or missing category code."};
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
        await dailyQueries.createDailyRecord(recordData);
        return { ok: true, intent };
      }
      case "updateRecord": {
        const recordId = formData.get("recordId") as string | null;
        const categoryCodeStr = formData.get("category_code") as string | null;
        const durationStr = formData.get("duration") as string | null;
        const comment = formData.get("comment") as string | null;
        const isPublicFormVal = formData.get("is_public");
        const isPublic = typeof isPublicFormVal === 'string' ? isPublicFormVal === "true" : false;

        if (!recordId) return { ok: false, error: "Record ID is required." };
        if (!categoryCodeStr || !isValidCategoryCode(categoryCodeStr)) {
          return {ok: false, error: "Invalid or missing category code for update."};
        }
        
        let durationMinutes: number | undefined = undefined;
        if (durationStr && durationStr.trim() !== "") {
            durationMinutes = parseInt(durationStr, 10);
             if (isNaN(durationMinutes) || durationMinutes < 0 || durationMinutes > MAX_MINUTES_PER_DAY) {
                 return { ok: false, error: "Invalid duration value."};
            }
        } else if (durationStr === null || durationStr.trim() === "") {
            // This case means duration should be set to null if it was previously set
            // durationMinutes remains undefined, and we handle null assignment below
        }

        const updates: Partial<DailyRecordUpdate> = {};
        updates.category_code = categoryCodeStr;
        updates.comment = comment;
        if (durationMinutes !== undefined) {
            updates.duration_minutes = durationMinutes;
        } else if (durationStr === null || durationStr.trim() === "") {
            updates.duration_minutes = null; // Explicitly set to null
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
        
        // Convert DbDailyRecord to DailyRecordUI before returning
        const updatedRecord: DailyRecordUI = {
            ...updatedRecordDb,
            date: updatedRecordDb.date || today, // Ensure date is present
            duration: updatedRecordDb.duration_minutes ?? undefined,
            is_public: updatedRecordDb.is_public ?? false,
            comment: updatedRecordDb.comment ?? null,
            subcode: updatedRecordDb.subcode ?? null,
            linked_plan_id: updatedRecordDb.linked_plan_id ?? null,
            // category_code is already in updatedRecordDb
            // memos will be out of sync until next loader call, or we could try to preserve them
            // For simplicity, we'll let the loader handle memo refresh.
        };

        return { ok: true, intent, recordId, updatedRecord };
      }
      case "deleteRecord": {
        const recordId = formData.get("recordId") as string;
        if (!recordId) return { ok: false, error: "Record ID is required." };
        await dailyQueries.deleteDailyRecord({ recordId, profileId });
        return { ok: true, intent };
      }
      case "saveDailyNote": {
        const content = formData.get("dailyNoteContent") as string | null;
        const date = (formData.get("date") as string | null) || today;
        const noteId = formData.get("noteId") as string | null;

        if (content === null) {
             return { ok: false, error: "Note content cannot be empty.", intent };
        }

        const noteData: DailyNoteInsert = {
            profile_id: profileId,
            date: date,
            content: content,
        };
        if (noteId) noteData.id = noteId;
        
        const upsertedNoteDb = await dailyQueries.upsertDailyNote(noteData);

        if (!upsertedNoteDb) {
            return { ok: false, error: "Failed to save daily note.", intent };
        }
        // Convert DbDailyNote to DailyNoteUI, ensuring all fields are present as expected by UI
        const upsertedNote: DailyNoteUI = {
            id: upsertedNoteDb.id, // Assuming id is always returned
            profile_id: upsertedNoteDb.profile_id,
            date: upsertedNoteDb.date || today,
            content: upsertedNoteDb.content,
            created_at: upsertedNoteDb.created_at,
            updated_at: upsertedNoteDb.updated_at,
        };
        return { ok: true, intent, upsertedNote };
      }
      case "addMemo": {
        const recordId = formData.get("recordId") as string | null;
        const title = formData.get("memoTitle") as string | null;
        const content = formData.get("memoContent") as string | null;

        if (!recordId) return { ok: false, error: "Record ID is required for memo."};
        if (!content) return { ok: false, error: "Content is required for memo."};
        
        const memoData: MemoInsert = {
          profile_id: profileId,
          record_id: recordId,
          title: title ?? "",
          content: content,
        };
        await dailyQueries.createMemo(memoData);
        return { ok: true, intent };
      }
      case "deleteMemo": {
        const memoId = formData.get("memoId") as string;
        if (!memoId) return { ok: false, error: "Memo ID is required." };
        await dailyQueries.deleteMemo({ memoId, profileId });
        return { ok: true, intent };
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
        
        // Convert DbDailyRecord to DailyRecordUI before returning
        const updatedRecord: DailyRecordUI = {
            ...updatedRecordDb,
            date: updatedRecordDb.date || today, // Ensure date is present
            duration: updatedRecordDb.duration_minutes ?? undefined,
            is_public: updatedRecordDb.is_public ?? false,
            comment: updatedRecordDb.comment ?? null,
            subcode: updatedRecordDb.subcode ?? null,
            linked_plan_id: updatedRecordDb.linked_plan_id ?? null,
        };

        return { ok: true, intent, recordId, updatedRecord };
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
  category: CategoryCode;
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
  const navigate = useFetcher().submit;

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
                navigate({ date: newDate }, { method: "get", action: "/daily" });
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

function PlanBanner({ plans, addedPlanIds }: {
  plans: DailyPlanUI[];
  addedPlanIds: Set<string>;
}) {
  const fetcher = useFetcher();
  
  return (
    <div className="rounded-xl bg-muted border px-6 py-5 flex flex-col gap-2 mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-5 h-5 text-primary" />
        <span className="font-semibold text-lg text-foreground">어제 작성한 오늘의 계획</span>
      </div>
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
                const categoryInfo = isValidCategoryCode(plan.category_code) 
                  ? CATEGORIES[plan.category_code] 
                  : { code: plan.category_code, icon: '❓', label: plan.category_code || 'Unknown', hasDuration: false };
                return (
                <tr key={plan.id} className="border-b">
                  <td className="py-2 px-2 flex items-center gap-2">
                    <span className={`text-2xl ${isValidCategoryCode(plan.category_code) ? getCategoryColor(plan.category_code) : 'text-gray-500'}`}>{categoryInfo?.icon || ''}</span>
                    <span className="font-medium">{categoryInfo?.label || plan.category_code}</span>
                  </td>
                  <td className="py-2 px-2">{plan.subcode || <span className="text-muted-foreground">-</span>}</td>
                  <td className="py-2 px-2">
                    {plan.duration ? `${plan.duration}분` : "-"}
                  </td>
                  <td className="py-2 px-2">{plan.comment || <span className="text-muted-foreground">No memo</span>}</td>
                  <td className="py-2 px-2 text-center">
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
                  </td>
                </tr>
              )}) 
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface DailyPageProps {
    loaderData: DailyPageLoaderData;
}

export default function DailyPage({ loaderData }: DailyPageProps) {
  const { today, records: initialRecords, dailyNote, plansForBanner, markedDates, profileId } = loaderData;
  
  const fetcher = useFetcher();
  const [form, setForm] = useState<AddFormState>(initialForm);
  const [records, setRecords] = useState<DailyRecordUI[]>(initialRecords); // Local state for records
  
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [editRowCategory, setEditRowCategory] = useState<CategoryCode>(initialForm.category);
  const [editRowDuration, setEditRowDuration] = useState('');
  const [editRowComment, setEditRowComment] = useState('');
  const [editRowIsPublic, setEditRowIsPublic] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSubcodeForRecordId, setEditingSubcodeForRecordId] = useState<string | null>(null);
  const [editSubcodeValue, setEditSubcodeValue] = useState("");
  const [showMemoFormForRecordId, setShowMemoFormForRecordId] = useState<string | null>(null);
  const [memoTitle, setMemoTitle] = useState("");
  const [memoContent, setMemoContent] = useState("");
  const [currentDailyNoteContent, setCurrentDailyNoteContent] = useState(dailyNote?.content || '');
  
  const [durationError, setDurationError] = useState<string | null>(null);
  const [isPlanBannerCollapsed, setIsPlanBannerCollapsed] = useState(plansForBanner.length === 0);
  const addedPlanIds = new Set(records.map(r => r.linked_plan_id).filter(Boolean) as string[]);

  useEffect(() => {
    // When loaderData changes (e.g., date navigation), reset local records state
    setRecords(initialRecords);
  }, [initialRecords]);

  useEffect(() => {
    setCurrentDailyNoteContent(dailyNote?.content || '');
  }, [dailyNote]);

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
        const actionData = fetcher.data as {
            ok: boolean; 
            intent?: string; 
            recordId?: string; 
            error?: string; 
            updatedRecord?: DailyRecordUI; 
            memoId?: string; // Added for deleteMemo intent
            upsertedNote?: DailyNoteUI; // Added for saveDailyNote intent
            // Potentially add other specific data fields for other intents if needed
        };
        if (actionData.ok) {
            if (actionData.intent === "addRecord" || actionData.intent === "addRecordFromPlan") {
                setForm(initialForm);
                setSelectedRowId(null);
                setIsEditing(false);
                // Re-fetch or optimistically add to records state for immediate UI update
                // For now, relying on loader revalidation or manual refresh. Consider optimistic update later.
            }
            if (actionData.intent === "updateRecord" && actionData.recordId) {
                if (actionData.updatedRecord) {
                    setRecords(prevRecords => 
                        prevRecords.map(r => 
                            r.id === actionData.recordId ? { ...r, ...actionData.updatedRecord } : r
                        )
                    );
                }
                setIsEditing(false);
                setSelectedRowId(null);
                setForm(initialForm);
            }
            if (actionData.intent === "updateSubcode" && actionData.recordId) {
                if (actionData.updatedRecord) { // Expecting updatedRecord from updateSubcode action
                     setRecords(prevRecords => 
                        prevRecords.map(r => 
                            r.id === actionData.recordId ? { ...r, ...actionData.updatedRecord } : r
                        )
                    );
                } else {
                    // If updatedRecord is not returned by updateSubcode, the UI might not refresh immediately
                    // or would need a page reload/re-fetch of records data.
                    console.warn(`[DailyPage Effect] updateSubcode for ${actionData.recordId} was ok, but no updatedRecord data received. UI might be stale.`);
                }
                setEditingSubcodeForRecordId(null);
            }
            if (actionData.intent === "addMemo" && actionData.recordId) {
                setShowMemoFormForRecordId(null);
                setMemoTitle("");
                setMemoContent("");
                // Memos are part of records. Re-fetch or optimistic update needed.
            }
            if (actionData.intent === "deleteRecord" && actionData.recordId) {
                setRecords(prevRecords => prevRecords.filter(r => r.id !== actionData.recordId));
                if (selectedRowId === actionData.recordId) {
                    setSelectedRowId(null);
                    setIsEditing(false);
                    setForm(initialForm);
                }
            }
            if (actionData.intent === "deleteMemo" && actionData.memoId) { 
                 setRecords(prevRecords => prevRecords.map(r => ({
                     ...r,
                     memos: r.memos ? r.memos.filter(m => m.id !== actionData.memoId) : []
                 })));
            }
            if (actionData.intent === "saveDailyNote" && actionData.upsertedNote) {
                setCurrentDailyNoteContent(actionData.upsertedNote.content);
                // We might also want to update the `dailyNote` state if it's held fully in state
                // For instance, if `dailyNote` itself was a state variable `[dailyNote, setDailyNote] = useState(loaderData.dailyNote)`
                // then we could do: setDailyNote(actionData.upsertedNote);
            }
        } else if (actionData.error) {
            console.error("Action Error:", actionData.error, "Intent:", actionData.intent);
            if (actionData.intent === "updateRecord" || actionData.intent === "addRecord") {
                 if (actionData.error?.includes("duration")) {
                    setDurationError(actionData.error);
                }
            }
           // Consider showing a toast or alert for other errors too
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.data, fetcher.state]);

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
    if (isValidCategoryCode(code)) {
        if (isEditing && selectedRecord?.linked_plan_id) return;
        if (isEditing) setEditRowCategory(code);
        else setForm(f => ({ ...f, category: code }));
    } else {
        console.warn("Invalid category code selected during form interaction:", code);
    }
  }

  function handleRowClick(record: DailyRecordUI) {
    if (selectedRowId === record.id && isEditing) {
        // Already editing this row, do nothing or perhaps allow deselect/cancel?
        // For now, do nothing to prevent accidental state changes.
        return;
    }
    // If clicking a different row while already editing one,
    // perhaps we should save/cancel the current edit first?
    // For now, directly switch to the new record.

    setSelectedRowId(record.id);
    if (isValidCategoryCode(record.category_code)) {
        setEditRowCategory(record.category_code);
    } else {
        setEditRowCategory(initialForm.category); // Fallback to default
        console.warn("Invalid category_code in clicked record:", record.category_code);
    }
    setEditRowDuration(record.duration ? String(record.duration) : '');
    setEditRowComment(record.comment || '');
    setEditRowIsPublic(record.is_public);
    setIsEditing(true); // Directly enter edit mode for the main form
    setDurationError(null);

    // If these were open for another record, close them.
    setEditingSubcodeForRecordId(null);
    setShowMemoFormForRecordId(null);
  }

  function handleEditRowCancel() {
    setIsEditing(false);
    const currentRecord = records.find(r => r.id === selectedRowId);
    if (currentRecord) {
        if (isValidCategoryCode(currentRecord.category_code)) {
            setEditRowCategory(currentRecord.category_code);
        } else {
            setEditRowCategory(initialForm.category);
        }
        setEditRowDuration(currentRecord.duration ? String(currentRecord.duration) : '');
        setEditRowComment(currentRecord.comment || '');
        setEditRowIsPublic(currentRecord.is_public);
    }
    setDurationError(null);
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
        <div className="mb-8">
          {isPlanBannerCollapsed ? (
            <div className="rounded-xl bg-muted border px-6 py-3 flex items-center justify-between">
              <span className="font-semibold text-lg text-foreground">어제 작성한 오늘의 계획</span>
              <Button variant="ghost" size="sm" onClick={() => setIsPlanBannerCollapsed(false)}>펴기</Button>
            </div>
          ) : (
            <div className="relative">
              <PlanBanner
                plans={plansForBanner}
                addedPlanIds={addedPlanIds}
              />
               <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => setIsPlanBannerCollapsed(true)}
                aria-label="접기"
              >
                <X className="w-4 h-4"/>
              </Button>
            </div>
          )}
        </div>
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
                
                <div className="flex flex-col gap-4">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar mb-2">
                    {Object.keys(CATEGORIES).map((code) => {
                        const catCode = code as CategoryCode;
                        const cat = CATEGORIES[catCode];
                        return (
                        <Button
                        key={catCode}
                        type="button"
                        variant={currentFormCategory === catCode ? "default" : "outline"}
                        className={`w-16 h-16 flex flex-col items-center justify-center rounded-lg border ${currentFormCategory === catCode ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => handleFormCategorySelect(catCode)}
                        style={{ minWidth: 64, minHeight: 64 }}
                        disabled={(isEditing && !!selectedRecord?.linked_plan_id) || (fetcher.state !== 'idle' && fetcher.formData?.get('intent') === (isEditing ? 'updateRecord' : 'addRecord'))}
                        >
                        <span className="text-2xl mb-1">{cat.icon}</span>
                        <span className="text-xs font-medium text-center leading-tight">{cat.label}</span>
                        </Button>
                    )})}
                    </div>
                    <div className="flex flex-col gap-2">
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
                                if (validateDuration(e.target.value)) {
                                    if (isEditing) setEditRowDuration(e.target.value);
                                    else setForm(f => ({ ...f, duration: e.target.value }));
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
                                    // Placeholder for delete action
                                    if (confirm("Are you sure you want to delete this record?") && selectedRowId) {
                                        const formData = new FormData();
                                        formData.append("intent", "deleteRecord");
                                        formData.append("recordId", selectedRowId);
                                        fetcher.submit(formData, { method: "post" });
                                    }
                                }}>삭제</Button>
                            </div>
                        ) : (
                            <Button type="submit" className="ml-2 flex-shrink-0" disabled={fetcher.state !== 'idle'}>
                                {fetcher.state !== 'idle' && fetcher.formData?.get('intent') === 'addRecord' ? "추가중..." : "Add"}
                            </Button>
                        )}
                    </div>
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
                      const cat = isValidCategoryCode(rec.category_code) 
                        ? CATEGORIES[rec.category_code] 
                        : { code: rec.category_code, icon: '❓', label: rec.category_code || 'Unknown', hasDuration: false };
                      return (
                        <>
                          <tr
                            key={rec.id}
                            className={`border-b cursor-pointer ${selectedRowId === rec.id ? 'bg-accent/30' : ''}`}
                            onClick={() => handleRowClick(rec)}
                          >
                            <td className="py-2 px-2 flex items-center gap-2">
                              <span className={`text-2xl ${isValidCategoryCode(rec.category_code) ? getCategoryColor(rec.category_code) : 'text-gray-500'}`}>{cat.icon}</span>
                              <span className="font-medium">{cat.label}</span>
                            </td>
                            <td className="py-2 px-2">{rec.subcode || <span className="text-muted-foreground">-</span>}</td>
                            <td className="py-2 px-2">
                              {rec.duration ? `${rec.duration}분` : (cat.hasDuration ? "-" : "")}
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
                        </>
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
          <div className="mt-8">
            <div className="font-semibold mb-2 text-sm text-muted-foreground">오늘의 노트</div>
            <fetcher.Form method="post">
                <input type="hidden" name="intent" value="saveDailyNote" />
                <input type="hidden" name="date" value={today} />
                {dailyNote?.id && <input type="hidden" name="noteId" value={dailyNote.id} />}
                <Textarea
                    name="dailyNoteContent"
                    value={currentDailyNoteContent}
                    onChange={e => setCurrentDailyNoteContent(e.target.value)}
                    placeholder="오늘 하루에 대한 자유 메모, 회고, 다짐 등을 입력하세요."
                    className="min-h-[80px]"
                />
                <div className="flex justify-end mt-2">
                    <Button type="submit" size="sm" disabled={fetcher.state !== 'idle' && fetcher.formData?.get('intent') === 'saveDailyNote'}>
                        {fetcher.state !== 'idle' && fetcher.formData?.get('intent') === 'saveDailyNote' ? "저장중..." : "노트 저장"}
                    </Button>
                </div>
            </fetcher.Form>
          </div>
        </div>
        <div className="w-full lg:w-96 space-y-4">
          {showMemoFormForRecordId && (
            <Card>
              <CardHeader>
                <CardTitle>새 메모 작성 (기록: {records.find(r=>r.id === showMemoFormForRecordId)?.comment?.substring(0,20) || 'N/A'})</CardTitle>
              </CardHeader>
              <CardContent>
                <fetcher.Form method="post" className="flex flex-col gap-4" onSubmit={() => setShowMemoFormForRecordId(null)}>
                  <input type="hidden" name="intent" value="addMemo" />
                  <input type="hidden" name="recordId" value={showMemoFormForRecordId} />
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
                    className="min-h-[150px]"
                    required
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="submit" size="sm" disabled={!memoContent.trim() || (fetcher.state !== 'idle' && fetcher.formData?.get('intent') === 'addMemo') }>저장</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowMemoFormForRecordId(null)}>취소</Button>
                  </div>
                </fetcher.Form>
              </CardContent>
            </Card>
          )}
          <div className="font-semibold mb-2 text-sm text-muted-foreground mt-4">기록별 메모</div>
          {records.flatMap(r => r.memos || []).length === 0 && <p className="text-muted-foreground text-sm">작성된 메모가 없습니다.</p>}
          {records.map(record => (
            record.memos && record.memos.length > 0 && (
              <div key={`record-memos-${record.id}`} className="mb-4">
                 <h4 className="font-medium text-sm mb-1">
                    {(isValidCategoryCode(record.category_code) ? CATEGORIES[record.category_code]?.icon : '❓')} {record.comment || (isValidCategoryCode(record.category_code) ? CATEGORIES[record.category_code]?.label : record.category_code)}
                 </h4>
                {record.memos.map(memo => (
                  <Card key={memo.id} className="mb-2">
                    <CardHeader className="pb-2 pt-3 px-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-md">{memo.title || '제목 없음'}</CardTitle>
                        <fetcher.Form method="post" style={{display: 'inline-block'}}>
                            <input type="hidden" name="intent" value="deleteMemo" />
                            <input type="hidden" name="memoId" value={memo.id} />
                            <Button variant="ghost" size="icon" type="submit" disabled={fetcher.state !== 'idle' && fetcher.formData?.get('intent') === 'deleteMemo' && fetcher.formData?.get('memoId') === memo.id}><X className="w-4 h-4" /></Button>
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
    </div>
  );
} 