import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Label } from "~/common/components/ui/label";
import { Switch } from "~/common/components/ui/switch";
import { Textarea } from "~/common/components/ui/textarea";
import { Lock, Unlock, Plus, X, Bell, Calendar as CalendarIcon } from "lucide-react";
import { CATEGORIES, type CategoryCode, type DailyRecord, type DailyPlan } from "~/common/types/daily";
import { Calendar } from "~/common/components/ui/calendar";
import type { Route } from "~/common/types";
import { Link } from "react-router";

function getToday() {
  return new Date().toLocaleDateString("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function getCategoryColor(code: CategoryCode) {
  // You can customize these colors as you wish
  const map: Record<CategoryCode, string> = {
    EX: "text-orange-500", BK: "text-green-600", ML: "text-orange-600", EM: "text-purple-500", ST: "text-yellow-500", WK: "text-teal-700", HB: "text-pink-500", SL: "text-cyan-600", RT: "text-blue-500"
  };
  return map[code];
}

export function loader({ request }: Route.LoaderArgs) {
  return {};
}

export function action({ request }: Route.ActionArgs) {
  return {};
}

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: "Daily Tracking - StartBeyond" },
    { name: "description", content: "Track your daily activities" },
  ];
}

interface AddFormState {
  category: CategoryCode;
  duration: string;
  unit: string;
  comment: string;
  public: boolean;
}

const initialForm: AddFormState = {
  category: "EX",
  duration: "",
  unit: "min",
  comment: "",
  public: false,
};

// Mock plans for today (would come from loader in real app)
const mockPlans: DailyPlan[] = [
  {
    id: "plan1",
    category_code: "EX",
    duration: 30,
    unit: "min",
    comment: "러닝",
    subcode: "Running",
    created_at: "",
    updated_at: "",
  },
  {
    id: "plan2",
    category_code: "BK",
    duration: 20,
    unit: "pages",
    comment: "독서",
    subcode: "Reading",
    created_at: "",
    updated_at: "",
  },
];

// Mock: days with records (for calendar dots)
const mockRecordDates = [
  new Date().toISOString().slice(0, 10), // today
  new Date(Date.now() - 86400000).toISOString().slice(0, 10), // yesterday
  "2024-05-10",
  "2024-05-12",
];

function CalendarPopover({ markedDates }: { markedDates: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)} aria-label="달력 열기">
        <CalendarIcon className="w-5 h-5" />
      </Button>
      {open && (
        <div className="absolute left-0 mt-2 z-50 bg-background border rounded-xl shadow-lg p-2">
          <Calendar
            mode="single"
            modifiers={{
              marked: (date) => markedDates.includes(date.toISOString().slice(0, 10)),
            }}
            modifiersClassNames={{
              marked: "after:content-[''] after:block after:w-1.5 after:h-1.5 after:rounded-full after:bg-primary after:mx-auto after:mt-0.5",
            }}
            onDayClick={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

function PlanBanner({ plans, onAddAll, onDismiss, onAdd, addedPlanIds }: {
  plans: DailyPlan[];
  onAddAll: () => void;
  onDismiss: () => void;
  onAdd: (plan: DailyPlan) => void;
  addedPlanIds: Set<string>;
}) {
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
              <th className="py-2 px-2 text-left">Memo</th>
              <th className="py-2 px-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {plans.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted-foreground py-4">작성한 계획이 없습니다</td>
              </tr>
            ) : (
              plans.map(plan => (
                <tr key={plan.id} className="border-b">
                  <td className="py-2 px-2 flex items-center gap-2">
                    <span className={`text-2xl ${getCategoryColor(plan.category_code)}`}>{CATEGORIES[plan.category_code].icon}</span>
                    <span className="font-medium">{CATEGORIES[plan.category_code].label}</span>
                  </td>
                  <td className="py-2 px-2">{plan.subcode || <span className="text-muted-foreground">-</span>}</td>
                  <td className="py-2 px-2">
                    {plan.duration ? `${plan.duration}분` : "-"}
                  </td>
                  <td className="py-2 px-2">{plan.comment || <span className="text-muted-foreground">No memo</span>}</td>
                  <td className="py-2 px-2 text-center">
                    <Button
                      variant={addedPlanIds.has(plan.id) ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => onAdd(plan)}
                      disabled={addedPlanIds.has(plan.id)}
                    >
                      {addedPlanIds.has(plan.id) ? "추가됨" : "추가"}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 mt-3 justify-end">
        <Button variant="outline" size="sm" onClick={onAddAll} disabled={plans.every(p => addedPlanIds.has(p.id))}>모두 추가</Button>
        <Button variant="ghost" size="sm" onClick={onDismiss}>접기</Button>
      </div>
    </div>
  );
}

export default function DailyPage() {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [form, setForm] = useState<AddFormState>(initialForm);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editComment, setEditComment] = useState("");
  const [editMemo, setEditMemo] = useState("");
  const [originalMemo, setOriginalMemo] = useState("");
  const [editLongMemo, setEditLongMemo] = useState("");
  const [originalLongMemo, setOriginalLongMemo] = useState("");
  const [editSubcode, setEditSubcode] = useState("");
  const [originalSubcode, setOriginalSubcode] = useState("");
  const [expandedType, setExpandedType] = useState<null | 'memo' | 'subcode' | 'edit'>('edit');
  const [plans, setPlans] = useState<DailyPlan[]>(mockPlans);
  const [showPlanBanner, setShowPlanBanner] = useState(plans.length > 0);
  const [addedPlanIds, setAddedPlanIds] = useState<Set<string>>(new Set());
  const [dailyNote, setDailyNote] = useState('');
  const [savedDailyNote, setSavedDailyNote] = useState('');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [editRowDuration, setEditRowDuration] = useState('');
  const [editRowComment, setEditRowComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState<{ id: string; title: string; content: string } | null>(null);
  const [memos, setMemos] = useState<Array<{
    id: string;
    recordId: string;
    title: string;
    content: string;
    created_at: string;
  }>>([]);
  const [durationError, setDurationError] = useState<string | null>(null);
  const MAX_MINUTES_PER_DAY = 60 * 24; // 1440 minutes
  const [isPlanBannerCollapsed, setIsPlanBannerCollapsed] = useState(false);
  const [editRowCategory, setEditRowCategory] = useState<CategoryCode>(initialForm.category);
  const selectedRecord = records.find(r => r.id === selectedRowId);

  function validateDuration(value: string) {
    const num = Number(value);
    if (isNaN(num)) {
      setDurationError("숫자만 입력 가능합니다");
      return false;
    }
    if (num < 0) {
      setDurationError("0 이상의 숫자를 입력해주세요");
      return false;
    }
    if (num > MAX_MINUTES_PER_DAY) {
      setDurationError("하루의 시간(1440분)을 초과할 수 없습니다");
      return false;
    }
    setDurationError(null);
    return true;
  }

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { id, value } = e.target;
    if (id === "duration") {
      if (validateDuration(value)) {
        setForm((f) => ({ ...f, [id]: value }));
      }
    } else {
      setForm((f) => ({ ...f, [id]: value }));
    }
  }

  function handleEditRowDurationChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (validateDuration(value)) {
      setEditRowDuration(value);
    }
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (form.duration && !validateDuration(form.duration)) {
      return;
    }
    const newRecord: DailyRecord = {
      id: Math.random().toString(36).slice(2),
      category_code: form.category,
      duration: form.duration ? Number(form.duration) : undefined,
      unit: form.unit,
      comment: form.comment,
      public: false,
      type: "record",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setRecords((prev) => [newRecord, ...prev]);
    setForm(initialForm);
    setDurationError(null);
  }

  function handlePublicToggle(id: string) {
    setExpandedRow((row) => (row === id ? null : id));
    const rec = records.find((r) => r.id === id);
    setEditComment(rec?.comment || "");
  }

  function handleEditSave(id: string) {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, comment: editComment } : r
      )
    );
    setExpandedRow(null);
  }

  function handleEditCancel() {
    setExpandedRow(null);
  }

  function handleEditCommentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setEditComment(e.target.value);
  }

  function handlePublicSwitch(id: string) {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, public: !r.public } : r
      )
    );
    setExpandedRow(id); // Always open the editor when toggling
    const rec = records.find((r) => r.id === id);
    setEditComment(rec?.comment || "");
  }

  function handleMemoButton(id: string) {
    setSelectedRowId(id);
    setSelectedMemo({
      id: Math.random().toString(36).slice(2),
      title: '',
      content: ''
    });
  }

  function handleMemoSave() {
    if (!selectedMemo || !selectedRowId) return;
    
    const newMemo = {
      ...selectedMemo,
      recordId: selectedRowId,
      created_at: new Date().toISOString()
    };
    
    setMemos(prev => [newMemo, ...prev]);
    setSelectedMemo(null);
    setSelectedRowId(null);
  }

  function handleMemoCancel() {
    setSelectedMemo(null);
    setSelectedRowId(null);
  }

  function handleMemoDelete(memoId: string) {
    setMemos(prev => prev.filter(m => m.id !== memoId));
  }

  function handleMemoChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setEditLongMemo(e.target.value);
  }

  function handleSubcodeButton(id: string) {
    setExpandedRow(id);
    setExpandedType('subcode');
    const rec = records.find((r) => r.id === id);
    setEditSubcode(rec?.subcode || "");
    setOriginalSubcode(rec?.subcode || "");
  }

  function handleSubcodeSave(id: string) {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, subcode: editSubcode } : r
      )
    );
    setExpandedRow(null);
    setExpandedType(null);
  }

  function handleSubcodeCancel() {
    setExpandedRow(null);
    setExpandedType(null);
  }

  function handleSubcodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEditSubcode(e.target.value);
  }

  function handleAddPlan(plan: DailyPlan) {
    if (addedPlanIds.has(plan.id)) return;
    const newRecord: DailyRecord = {
      id: Math.random().toString(36).slice(2),
      category_code: plan.category_code,
      duration: plan.duration,
      unit: plan.unit,
      comment: plan.comment,
      subcode: plan.subcode,
      public: false,
      type: "record",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      linked_plan_id: plan.id,
    };
    setRecords(prev => [newRecord, ...prev]);
    setAddedPlanIds(prev => new Set(prev).add(plan.id));
  }

  function handleAddAllPlans() {
    plans.forEach(plan => {
      if (!addedPlanIds.has(plan.id)) handleAddPlan(plan);
    });
  }

  function handleDismissPlans() {
    setShowPlanBanner(false);
  }

  function handleDeleteRow(id: string) {
    const record = records.find(r => r.id === id);
    if (record?.linked_plan_id) {
      // 어제 작성한 계획에서 가져온 Task가 삭제되면 addedPlanIds에서 제거
      setAddedPlanIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(record.linked_plan_id!);
        return newSet;
      });
    }
    setRecords(prev => prev.filter(r => r.id !== id));
    setMemos(prev => prev.filter(m => m.recordId !== id));
    setExpandedRow(null);
    setExpandedType(null);
  }

  function handleSaveDailyNote(e: React.FormEvent) {
    e.preventDefault();
    setSavedDailyNote(dailyNote);
  }

  function handleRowClick(id: string, duration: number | undefined, comment: string | undefined) {
    if (selectedRowId === id && !isEditing) {
      setSelectedRowId(null);
      setIsEditing(false);
      return;
    }
    const rec = records.find(r => r.id === id);
    setSelectedRowId(id);
    setEditRowDuration(duration ? String(duration) : '');
    setEditRowComment(comment || '');
    setEditRowCategory(rec ? rec.category_code : initialForm.category);
    setIsEditing(true);
  }

  function handleEditRow() {
    if (selectedRowId) {
      const rec = records.find(r => r.id === selectedRowId);
      setEditRowCategory(rec ? rec.category_code : initialForm.category);
      setEditRowDuration(rec && rec.duration ? String(rec.duration) : '');
      setEditRowComment(rec ? rec.comment || '' : '');
    }
    setIsEditing(true);
  }

  function handleEditRowSave(id: string) {
    if (editRowDuration && !validateDuration(editRowDuration)) {
      return;
    }
    setRecords(prev =>
      prev.map(r =>
        r.id === id
          ? {
              ...r,
              duration: editRowDuration ? Number(editRowDuration) : undefined,
              comment: editRowComment,
              category_code: editRowCategory,
            }
          : r
      )
    );
    setIsEditing(false);
    setSelectedRowId(null);
    setDurationError(null);
  }

  function handleEditRowCancel() {
    setIsEditing(false);
    setSelectedRowId(null);
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 pt-16 bg-background min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-3xl">Daily</h1>
          <CalendarPopover markedDates={mockRecordDates} />
        </div>
        <div className="text-gray-500 text-lg">{getToday()}</div>
        <Button asChild className="ml-2" variant="default" size="sm">
          <Link to="/plan/tomorrow">
            <Plus className="w-4 h-4 mr-1" />Tomorrow Plan
          </Link>
        </Button>
      </div>
      {showPlanBanner && (
        <div className="mb-8">
          {isPlanBannerCollapsed ? (
            <div className="rounded-xl bg-muted border px-6 py-3 flex items-center justify-between">
              <span className="font-semibold text-lg text-foreground">어제 작성한 오늘의 계획</span>
              <Button variant="ghost" size="sm" onClick={() => setIsPlanBannerCollapsed(false)}>펴기</Button>
            </div>
          ) : (
            <div className="relative">
              <PlanBanner
                plans={plans}
                onAddAll={handleAddAllPlans}
                onDismiss={() => setIsPlanBannerCollapsed(true)}
                onAdd={handleAddPlan}
                addedPlanIds={addedPlanIds}
              />
              {/* <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => setIsPlanBannerCollapsed(true)}
                aria-label="접기"
              >
                접기
              </Button> */}
            </div>
          )}
        </div>
      )}
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Daily Record</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col gap-4" onSubmit={selectedRowId && isEditing ? (e) => { e.preventDefault(); handleEditRowSave(selectedRowId); } : handleAdd}>
                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-2">
                  {Object.entries(CATEGORIES).map(([code, cat]) => (
                    <Button
                      key={code}
                      type="button"
                      variant={selectedRowId ? ((isEditing ? editRowCategory : selectedRecord?.category_code) === code ? "default" : "outline") : (form.category === code ? "default" : "outline")}
                      className={`w-16 h-16 flex flex-col items-center justify-center rounded-lg border ${selectedRowId ? ((isEditing ? editRowCategory : selectedRecord?.category_code) === code ? 'ring-2 ring-primary' : '') : (form.category === code ? 'ring-2 ring-primary' : '')}`}
                      onClick={() => {
                        if (selectedRowId) {
                          if (isEditing && !selectedRecord?.linked_plan_id) setEditRowCategory(code as CategoryCode);
                        } else {
                          setForm(f => ({ ...f, category: code as CategoryCode }));
                        }
                      }}
                      style={{ minWidth: 64, minHeight: 64 }}
                      disabled={selectedRowId ? (!isEditing || !!selectedRecord?.linked_plan_id) : false}
                    >
                      <span className="text-2xl mb-1">{cat.icon}</span>
                      <span className="text-xs font-medium text-center leading-tight">{cat.label}</span>
                    </Button>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <div className="relative">
                      <Input
                        id="duration"
                        type="number"
                        min={0}
                        max={MAX_MINUTES_PER_DAY}
                        placeholder="분"
                        value={selectedRowId ? (isEditing ? editRowDuration : selectedRecord?.duration?.toString() || '') : form.duration}
                        onChange={selectedRowId ? (isEditing ? handleEditRowDurationChange : undefined) : handleFormChange}
                        className={`w-24 ${durationError ? 'border-red-500' : ''}`}
                        disabled={selectedRowId ? !isEditing : false}
                      />
                      {durationError && (
                        <div className="absolute -bottom-6 left-0 text-xs text-red-500">
                          {durationError}
                        </div>
                      )}
                    </div>
                    <Input
                      id="comment"
                      placeholder="간단 메모"
                      value={selectedRowId ? (isEditing ? editRowComment : selectedRecord?.comment || '') : form.comment}
                      onChange={selectedRowId ? (isEditing ? (e) => setEditRowComment(e.target.value) : undefined) : handleFormChange}
                      className="flex-1"
                      disabled={selectedRowId ? !isEditing : false}
                    />
                    {selectedRowId ? (
                      isEditing ? (
                        <>
                          <Button type="submit" className="ml-2" size="sm">저장</Button>
                          <Button type="button" className="ml-2" size="sm" variant="outline" onClick={handleEditRowCancel}>취소</Button>
                          <Button type="button" className="ml-2" size="sm" variant="destructive" onClick={() => handleDeleteRow(selectedRowId)}>삭제</Button>
                        </>
                      ) : (
                        <>
                          <Button type="button" className="ml-2" size="sm" variant="default" onClick={handleEditRow}>수정</Button>
                          <Button type="button" className="ml-2" size="sm" variant="destructive" onClick={() => handleDeleteRow(selectedRowId)}>삭제</Button>
                        </>
                      )
                    ) : (
                      <Button type="submit" className="ml-2">Add</Button>
                    )}
                  </div>
                </div>
              </form>
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
                      <th className="py-2 px-2 text-left">Code</th>
                      <th className="py-2 px-2 text-left">Subcode</th>
                      <th className="py-2 px-2 text-left">Duration</th>
                      <th className="py-2 px-2 text-left">Comment</th>
                      <th className="py-2 px-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((rec) => {
                      const cat = CATEGORIES[rec.category_code];
                      return (
                        <>
                          <tr
                            key={rec.id}
                            className={`border-b cursor-pointer ${selectedRowId === rec.id ? 'bg-accent/30' : ''}`}
                            onClick={() => handleRowClick(rec.id, rec.duration, rec.comment)}
                          >
                            <td className="py-2 px-2 flex items-center gap-2">
                              <span className={`text-2xl ${getCategoryColor(rec.category_code)}`}>{cat.icon}</span>
                              <span className="font-medium">{cat.label}</span>
                            </td>
                            <td className="py-2 px-2">{rec.subcode || <span className="text-muted-foreground">-</span>}</td>
                            <td className="py-2 px-2">
                              {cat.hasDuration && rec.duration ? `${rec.duration}분` : "-"}
                            </td>
                            <td className="py-2 px-2">{rec.comment || <span className="text-muted-foreground">No comment</span>}</td>
                            <td className="py-2 px-2 text-center flex gap-2 justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSubcodeButton(rec.id)}
                              >
                                세부코드
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMemoButton(rec.id)}
                              >
                                메모
                              </Button>
                            </td>
                          </tr>
                          {selectedRowId === rec.id && expandedType === 'subcode' && (
                            <tr>
                              <td colSpan={5} className="bg-muted px-4 py-3">
                                <form
                                  className="flex flex-col md:flex-row gap-2 items-start md:items-center"
                                  onSubmit={e => { e.preventDefault(); handleSubcodeSave(rec.id); }}
                                >
                                  <Input
                                    value={editSubcode}
                                    onChange={handleSubcodeChange}
                                    className="flex-1"
                                    placeholder="세부코드를 입력하세요..."
                                  />
                                  <div className="flex gap-2 mt-2 md:mt-0">
                                    <Button type="submit" size="sm" disabled={editSubcode === originalSubcode}>저장</Button>
                                    <Button type="button" size="sm" variant="outline" onClick={handleSubcodeCancel}>
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </form>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                    {records.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center text-muted-foreground py-8">No records yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <div className="mt-8">
            <div className="font-semibold mb-2 text-sm text-muted-foreground">전체 메모</div>
            <form className="flex flex-col gap-2" onSubmit={handleSaveDailyNote}>
              <Textarea
                value={dailyNote}
                onChange={e => setDailyNote(e.target.value)}
                placeholder="오늘 하루에 대한 자유 메모, 회고, 다짐 등을 입력하세요."
                className="min-h-[80px]"
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm">저장</Button>
              </div>
            </form>
            {savedDailyNote && (
              <div className="mt-2 text-muted-foreground text-sm whitespace-pre-line">{savedDailyNote}</div>
            )}
          </div>
        </div>
        <div className="w-full lg:w-96 space-y-4">
          {selectedMemo && (
            <Card>
              <CardHeader>
                <CardTitle>새 메모 작성</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); handleMemoSave(); }}>
                  <Input
                    placeholder="제목"
                    value={selectedMemo.title}
                    onChange={e => setSelectedMemo(prev => prev ? { ...prev, title: e.target.value } : null)}
                  />
                  <Textarea
                    placeholder="내용을 입력하세요..."
                    value={selectedMemo.content}
                    onChange={e => setSelectedMemo(prev => prev ? { ...prev, content: e.target.value } : null)}
                    className="min-h-[200px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="submit" size="sm">저장</Button>
                    <Button type="button" size="sm" variant="outline" onClick={handleMemoCancel}>취소</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
          {memos.map(memo => {
            const record = records.find(r => r.id === memo.recordId);
            const cat = record ? CATEGORIES[record.category_code] : null;
            
            return (
              <Card key={memo.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {cat && record && (
                        <span className={`text-2xl ${getCategoryColor(record.category_code)}`}>
                          {cat.icon}
                        </span>
                      )}
                      <CardTitle className="text-lg">{memo.title || '제목 없음'}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMemoDelete(memo.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(memo.created_at).toLocaleString()}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-line">{memo.content}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
} 