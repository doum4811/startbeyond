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
    comment: "",
    created_at: "",
    updated_at: "",
  },
  {
    id: "plan2",
    category_code: "BK",
    duration: 20,
    unit: "pages",
    comment: "",
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
              <th className="py-2 px-2 text-left">Duration</th>
              <th className="py-2 px-2 text-left">Memo</th>
              <th className="py-2 px-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {plans.map(plan => (
              <tr key={plan.id} className="border-b">
                <td className="py-2 px-2 flex items-center gap-2">
                  <span className={`text-2xl ${getCategoryColor(plan.category_code)}`}>{CATEGORIES[plan.category_code].icon}</span>
                  <span className="font-medium">{CATEGORIES[plan.category_code].label}</span>
                </td>
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
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 mt-3 justify-end">
        <Button variant="outline" size="sm" onClick={onAddAll} disabled={plans.every(p => addedPlanIds.has(p.id))}>모두 추가</Button>
        <Button variant="ghost" size="sm" onClick={onDismiss}>닫기</Button>
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

  function handleCategorySelect(code: CategoryCode) {
    setForm((f) => ({ ...f, category: code }));
  }

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    // const { id, value, type, checke =d } = e.target;
    // setForm((f) => ({ ...f, [id]: type === "checkbox" ? checked : value }));
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    // duration is now optional, no validation
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
    setExpandedRow(id);
    setExpandedType('memo');
    const rec = records.find((r) => r.id === id);
    setEditLongMemo(rec?.longMemo || "");
    setOriginalLongMemo(rec?.longMemo || "");
  }

  function handleMemoSave(id: string) {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, longMemo: editLongMemo } : r
      )
    );
    setExpandedRow(null);
  }

  function handleMemoCancel() {
    setExpandedRow(null);
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
    setRecords(prev => prev.filter(r => r.id !== id));
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
      return;
    }
    setSelectedRowId(id);
    setIsEditing(false);
    setEditRowDuration(duration ? String(duration) : '');
    setEditRowComment(comment || '');
  }

  function handleEditRow() {
    setIsEditing(true);
  }

  function handleEditRowSave(id: string) {
    setRecords(prev =>
      prev.map(r =>
        r.id === id ? { ...r, duration: Number(editRowDuration), comment: editRowComment } : r
      )
    );
    setIsEditing(false);
    setSelectedRowId(null);
  }

  function handleEditRowCancel() {
    setIsEditing(false);
    setSelectedRowId(null);
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 pt-16">
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
      {showPlanBanner && plans.length > 0 && (
        <PlanBanner
          plans={plans}
          onAddAll={handleAddAllPlans}
          onDismiss={handleDismissPlans}
          onAdd={handleAddPlan}
          addedPlanIds={addedPlanIds}
        />
      )}
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
                  variant={form.category === code ? "default" : "outline"}
                  className={`w-16 h-16 flex flex-col items-center justify-center rounded-lg border ${form.category === code ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setForm(f => ({ ...f, category: code as CategoryCode }))}
                  style={{ minWidth: 64, minHeight: 64 }}
                  disabled={!!selectedRowId}
                >
                  <span className="text-2xl mb-1">{cat.icon}</span>
                  <span className="text-xs font-medium text-center leading-tight">{cat.label}</span>
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                id="duration"
                type="number"
                min={0}
                placeholder="분"
                value={selectedRowId && isEditing ? editRowDuration : form.duration}
                onChange={selectedRowId && isEditing ? (e) => setEditRowDuration(e.target.value) : handleFormChange}
                className="w-24"
                disabled={!CATEGORIES[form.category].hasDuration && !selectedRowId}
              />
              <Input
                id="comment"
                placeholder="간단 메모"
                value={selectedRowId && isEditing ? editRowComment : form.comment}
                onChange={selectedRowId && isEditing ? (e) => setEditRowComment(e.target.value) : handleFormChange}
                className="flex-1"
                disabled={!!selectedRowId && !isEditing}
              />
              {selectedRowId ? (
                isEditing ? (
                  <>
                    <Button type="submit" className="ml-2" size="sm">저장</Button>
                    <Button type="button" className="ml-2" size="sm" variant="outline" onClick={handleEditRowCancel}>취소</Button>
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
                  <th className="py-2 px-2 text-left">Memo</th>
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
                        <td className="py-2 px-2">{rec.comment || <span className="text-muted-foreground">No memo</span>}</td>
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
                      {selectedRowId === rec.id && expandedType === 'memo' && (
                        <tr>
                          <td colSpan={5} className="bg-muted px-4 py-3">
                            <form
                              className="flex flex-col md:flex-row gap-2 items-start md:items-center"
                              onSubmit={e => { e.preventDefault(); handleMemoSave(rec.id); }}
                            >
                              <Textarea
                                value={editLongMemo}
                                onChange={handleMemoChange}
                                className="flex-1 min-h-[40px]"
                                placeholder="긴 메모를 입력하세요..."
                              />
                              <div className="flex gap-2 mt-2 md:mt-0">
                                <Button type="submit" size="sm" disabled={editLongMemo === originalLongMemo}>저장</Button>
                                <Button type="button" size="sm" variant="outline" onClick={handleMemoCancel}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </form>
                            {originalLongMemo && (
                              <div className="mt-2 text-xs text-muted-foreground whitespace-pre-line">
                                <span className="font-semibold">이전 메모:</span> {originalLongMemo}
                              </div>
                            )}
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
          {/* 예시 row UI */}
          <div className="mt-8">
            <div className="font-semibold mb-2 text-sm text-muted-foreground">예시</div>
            <div className="border rounded-lg bg-muted flex items-center px-4 py-3 gap-4 w-full max-w-2xl">
              <span className="text-2xl text-orange-500">🏃</span>
              <span className="font-medium">Exercise</span>
              <span className="text-gray-700 ml-4">30 min</span>
              <span className="ml-4 flex-1 text-gray-500">Jogging in the park</span>
              <Button variant="outline" size="sm">메모</Button>
            </div>
          </div>
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
        </CardContent>
      </Card>
    </div>
  );
} 