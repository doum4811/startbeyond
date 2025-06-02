import { useState, useEffect } from "react";
import { useNavigate, useFetcher } from "react-router";
import { DateTime } from "luxon";
import type { DailyPageLoaderData } from "../types";
import type { DailyRecordUI, DailyPlanUI } from "../types";
import { CalendarPopover } from "./calendar-popover";
import { PlanBanner } from "./plan-banner";
import { DailyRecordForm } from "./daily-record-form";
import { DailyRecordList } from "./daily-record-list";
import { DailyNotesSection } from "./daily-notes-section";
import { ActivateCategoryDialog } from "./activate-category-dialog";
import { AddMemoDialog } from "./add-memo-dialog";
import { getToday } from "../utils";

interface DailyPageProps {
  loaderData: DailyPageLoaderData;
}

export function DailyPage({ loaderData }: DailyPageProps) {
  const { 
    today: currentSelectedDate, 
    records: initialRecords, 
    dailyNotes: initialDailyNotes,
    plansForBanner: initialPlansForBanner,
    markedDates, 
    profileId, 
    categories: allCategories 
  } = loaderData;

  const navigate = useNavigate();
  const fetcher = useFetcher();
  
  const [records, setRecords] = useState<DailyRecordUI[]>(initialRecords);
  const [dailyNotes, setDailyNotes] = useState(initialDailyNotes);
  const [plansForBanner, setPlansForBanner] = useState<DailyPlanUI[]>(initialPlansForBanner);
  
  const activeCategories = allCategories.filter(c => c.isActive);
  
  const initialAddFormState = {
    category_code: activeCategories.find(c => c.isActive)?.code || (allCategories.length > 0 ? allCategories[0].code : ""),
    duration: "",
    comment: ""
  };

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const selectedRecord = records.find(r => r.id === selectedRowId) || null;

  const [showAddMemoModalForRecordId, setShowAddMemoModalForRecordId] = useState<string | null>(null);
  
  const [showActivateCategoryDialog, setShowActivateCategoryDialog] = useState(false);
  const [planToActivate, setPlanToActivate] = useState<DailyPlanUI | null>(null);
  const [addedPlanIds, setAddedPlanIds] = useState<Set<string>>(new Set());
  const [isAddingAllPlans, setIsAddingAllPlans] = useState(false);
  
  const [newNoteContentForSection, setNewNoteContentForSection] = useState("");

  useEffect(() => {
    setRecords(initialRecords);
    setDailyNotes(initialDailyNotes);
    setPlansForBanner(initialPlansForBanner);
    setIsEditing(false);
    setSelectedRowId(null);
    const currentlyAdded = new Set<string>();
    initialRecords.forEach(rec => {
      if (rec.linked_plan_id) currentlyAdded.add(rec.linked_plan_id);
    });
    setAddedPlanIds(currentlyAdded);
    setNewNoteContentForSection("");
  }, [initialRecords, initialDailyNotes, initialPlansForBanner, currentSelectedDate]); 

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      const data = fetcher.data;
      if (data.ok) {
        if (data.intent === "addRecord" || data.intent === "updateRecord" || data.intent === "deleteRecord" ||
            data.intent === "addRecordFromPlan" || data.intent === "activateCategoryAndAddRecordFromPlan" ||
            data.intent === "addAllRecordsFromMultiplePlans" || data.intent === "updateSubcode" ||
            data.intent === "addMemo" || data.intent === "deleteMemo" ||
            data.intent === "saveDailyNote" || data.intent === "updateDailyNote" || data.intent === "deleteDailyNote"
          ) {
           navigate(`?date=${currentSelectedDate}`, { replace: true }); 
        }
        
        if (data.intent === "addRecord" && data.createdRecordId) {
           // Form reset is handled by DailyRecordForm's own useEffect
        } else if (data.intent === "updateRecord" && data.recordId) {
            setIsEditing(false); 
            setSelectedRowId(null);
        } else if (data.intent === "addRecordFromPlan" && data.addedFromPlanId) {
            setAddedPlanIds(prev => new Set(prev).add(data.addedFromPlanId!));
        } else if (data.intent === "activateCategoryAndAddRecordFromPlan" && data.addedFromPlanId) {
            setAddedPlanIds(prev => new Set(prev).add(data.addedFromPlanId!));
            setShowActivateCategoryDialog(false);
            setPlanToActivate(null);
        } else if (data.intent === "addAllRecordsFromMultiplePlans" && data.addedRecordPlanIds) {
            setAddedPlanIds(prev => {
                const newSet = new Set(prev);
                data.addedRecordPlanIds.forEach((id: string) => newSet.add(id));
                return newSet;
            });
            setIsAddingAllPlans(false);
            if (data.partialErrors && data.partialErrors.length > 0) {
                console.warn("Some plans failed to add:", data.partialErrors);
            }
        } else if (data.intent === "addMemo" && data.memo) {
            setShowAddMemoModalForRecordId(null);
        } else if (data.intent === "saveDailyNote" && data.newNote) {
          setNewNoteContentForSection(""); 
        }

      } else { 
        console.error("Action failed:", data.error, data.errors);
        if (data.intent === "addRecordFromPlan" && data.needsActivation && data.categoryToActivate && data.planDetails) {
            const planDetails = data.planDetails as any;
            const planToSet: DailyPlanUI = {
              id: planDetails.planId || '',
              profile_id: profileId,
              plan_date: planDetails.planDate || currentSelectedDate,
              category_code: planDetails.planCategoryCode || '',
              duration: planDetails.planDuration ? parseInt(planDetails.planDuration, 10) : undefined,
              comment: planDetails.planComment || null,
              subcode: planDetails.planSubcode || null,
              is_completed: planDetails.is_completed || false,
              linked_weekly_task_id: planDetails.linked_weekly_task_id || null,
              created_at: planDetails.created_at,
              updated_at: planDetails.updated_at,
            };
            setPlanToActivate(planToSet);
            setShowActivateCategoryDialog(true);
        } else if (data.intent === "addAllRecordsFromMultiplePlans") {
            setIsAddingAllPlans(false);
        }
      }
    }
  }, [fetcher.data, fetcher.state, navigate, currentSelectedDate, profileId]);

  const handleRowClick = (record: DailyRecordUI) => {
    if (record.id) {
      setSelectedRowId(record.id);
      setIsEditing(true);
      const formElement = document.getElementById("daily-record-form-card");
      formElement?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleEditRowCancel = () => {
    setIsEditing(false);
    setSelectedRowId(null);
  };
  
  const handleDeleteRecord = (recordId: string) => {
    if (confirm("이 기록을 삭제하시겠습니까? 연관된 메모도 함께 삭제됩니다.")) {
      const formData = new FormData();
      formData.append("intent", "deleteRecord");
      formData.append("recordId", recordId);
      formData.append("date", currentSelectedDate); 
      fetcher.submit(formData, { method: "post" });
    }
  };
  
  const handleAddMemo = (recordId: string) => {
    setShowAddMemoModalForRecordId(recordId);
  };

  const handleSaveMemo = (title: string, content: string) => {
    if (!showAddMemoModalForRecordId || !title.trim()) {
      alert("메모 제목을 입력해주세요.");
      return;
    }
    const formData = new FormData();
    formData.append("intent", "addMemo");
    formData.append("recordId", showAddMemoModalForRecordId);
    formData.append("memoTitle", title);
    formData.append("memoContent", content);
    formData.append("date", currentSelectedDate);
    fetcher.submit(formData, { method: "post" });
  };
  
  const handleDeleteMemo = (memoId: string, recordId: string) => {
    if (confirm("이 메모를 삭제하시겠습니까?")) {
      const formData = new FormData();
      formData.append("intent", "deleteMemo");
      formData.append("memoId", memoId);
      formData.append("recordId", recordId); 
      formData.append("date", currentSelectedDate);
      fetcher.submit(formData, { method: "post" });
    }
  };

  const handleActivateCategoryAndAddPlan = () => {
    if (!planToActivate) return;
    const formData = new FormData();
    formData.append("intent", "activateCategoryAndAddRecordFromPlan");
    formData.append("categoryToActivate", planToActivate.category_code); 
    formData.append("planId", planToActivate.id);
    formData.append("planCategoryCode", planToActivate.category_code);
    formData.append("planDuration", planToActivate.duration ? String(planToActivate.duration) : "");
    formData.append("planComment", planToActivate.comment || "");
    formData.append("planSubcode", planToActivate.subcode || "");
    formData.append("planDate", planToActivate.plan_date);
    
    fetcher.submit(formData, { method: "post" });
  };
  
  const handleAddAllPlansToRecords = () => {
    const unaddedPlans = plansForBanner.filter(p => !addedPlanIds.has(p.id));
    if (unaddedPlans.length === 0) return;

    setIsAddingAllPlans(true);
    const plansPayload = unaddedPlans.map(p => ({
      planId: p.id,
      planCategoryCode: p.category_code,
      planDuration: p.duration ? String(p.duration) : "",
      planComment: p.comment || "",
      planSubcode: p.subcode || "",
      planDate: p.plan_date,
    }));

    const formData = new FormData();
    formData.append("intent", "addAllRecordsFromMultiplePlans");
    formData.append("plans", JSON.stringify(plansPayload));
    formData.append("date", currentSelectedDate);

    fetcher.submit(formData, { method: "post" });
  };
  
  const handleSubcodeChange = (recordId: string, newSubcode: string | null) => {
    const formData = new FormData();
    formData.append("intent", "updateSubcode");
    formData.append("recordId", recordId);
    formData.append("subcode", newSubcode || ""); 
    formData.append("date", currentSelectedDate);
    fetcher.submit(formData, { method: "post" });
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-700 dark:text-gray-300">
        Daily Records - {DateTime.fromISO(currentSelectedDate).toFormat("yyyy년 M월 d일 (cccc)")}
      </h1>

      <CalendarPopover markedDates={markedDates} currentSelectedDate={currentSelectedDate} />

      {plansForBanner.length > 0 && (
        <PlanBanner
          plans={plansForBanner}
          addedPlanIds={addedPlanIds}
          categories={allCategories} 
          setShowActivateCategoryDialog={setShowActivateCategoryDialog}
          setPlanToActivate={setPlanToActivate}
          onAddAll={handleAddAllPlansToRecords}
          isAddingAll={isAddingAllPlans}
        />
      )}
      
      <div id="daily-record-form-card">
        <DailyRecordForm
          today={currentSelectedDate}
          profileId={profileId} 
          categories={allCategories} 
          selectedRecord={selectedRecord}
          isEditing={isEditing}
          onCancelEdit={handleEditRowCancel} 
          initialFormState={initialAddFormState} 
          activeCategories={activeCategories} 
        />
      </div>
      
      {fetcher.data && !fetcher.data.ok && fetcher.state === 'idle' && (
        <div className="my-4 p-3 bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300 rounded">
          <p className="font-bold">에러 발생:</p>
          <p>{fetcher.data.error || "알 수 없는 오류가 발생했습니다."}</p>
          {fetcher.data.errors && (
            <ul className="list-disc list-inside">
              {Object.entries(fetcher.data.errors).map(([key, value]) => (
                <li key={key}>{`${key}: ${value}`}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <DailyRecordList
        records={records}
        categories={allCategories}
        onEdit={handleRowClick}
        onDelete={handleDeleteRecord}
        onAddMemo={handleAddMemo}
        onDeleteMemo={handleDeleteMemo}
        onSubcodeChange={handleSubcodeChange}
      />

      <DailyNotesSection 
        currentDailyNotes={dailyNotes}
        newNoteContent={newNoteContentForSection}
        setNewNoteContent={setNewNoteContentForSection}
        fetcher={fetcher} 
        today={currentSelectedDate}
      />
 
      <AddMemoDialog
        open={!!showAddMemoModalForRecordId}
        onOpenChange={() => setShowAddMemoModalForRecordId(null)}
        recordId={showAddMemoModalForRecordId}
        fetcher={fetcher}
        onSave={handleSaveMemo}
      />
      
      <ActivateCategoryDialog
        open={showActivateCategoryDialog}
        onOpenChange={setShowActivateCategoryDialog}
        planToActivate={planToActivate}
        categories={allCategories}
        onActivateAndAdd={handleActivateCategoryAndAddPlan}
      />
    </div>
  );
} 