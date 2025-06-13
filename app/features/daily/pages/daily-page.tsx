import { Link, useFetcher, useNavigate } from "react-router";
import type { MetaFunction } from "react-router";
import { DateTime } from "luxon";
import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/common/components/ui/collapsible";
import { Button } from "~/common/components/ui/button";
import { Calendar } from "~/common/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/common/components/ui/popover";
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
import { DailyNotesSection } from "~/features/daily/components/daily-notes-section";
import { action } from "../action";
import { loader } from "../loader";
import type { DailyRecordUI, DailyNoteUI, MemoUI, DailyPlanUI, DailyPageLoaderData, AddFormState, UICategory } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Input } from "~/common/components/ui/input";
import { Label } from "~/common/components/ui/label";
import { CategorySelector } from "~/common/components/ui/CategorySelector";
import { Bell, CalendarIcon, Plus, Trash2, X } from "lucide-react";
import { getCategoryColor } from "../utils";
import { Textarea } from "~/common/components/ui/textarea";


export { loader, action };

const MAX_MINUTES_PER_DAY = 60 * 24;

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const pageData = data as DailyPageLoaderData | undefined;
  return [
    { title: `Daily (${pageData?.today ?? ''}) | StartBeyond` },
    { name: "description", content: "Track your daily activities." },
  ];
};

function CalendarPopover({ markedDates, currentSelectedDate }: { markedDates: string[]; currentSelectedDate: string }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  function handleDateSelect(date: DateTime) {
    const newDate = date.toISODate();
    if (newDate) {
      navigate(`?date=${newDate}`);
      setOpen(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <CalendarIcon className="w-5 h-5" />
      </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            selectedDate={DateTime.fromISO(currentSelectedDate)}
          onDateChange={handleDateSelect}
            markedDates={markedDates}
          />
      </PopoverContent>
    </Popover>
  )
}

function PlanBanner({
  plans,
  date,
  categories,
  onAddFromPlan,
  onAddAllFromPlans,
  isAddingAll,
  records,
}: {
  plans: DailyPlanUI[];
  date: string;
  categories: UICategory[];
  onAddFromPlan: (plan: DailyPlanUI, isCategoryActive: boolean) => void;
  onAddAllFromPlans: () => void;
  isAddingAll: boolean;
  records: DailyRecordUI[];
}) {
  const [isCollapsed, setIsCollapsed] = useState(plans.length === 0);
  const allPlansAdded = useMemo(() => plans.every(p => records.some(r => r.linked_plan_id === p.id)), [plans, records]);
  const { t } = useTranslation();

  return (
    <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)} className="mb-8">
       <div className="rounded-xl bg-muted border">
        <CollapsibleTrigger asChild>
          <div className="px-6 py-3 flex items-center justify-between cursor-pointer w-full">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <span className="font-semibold text-lg text-foreground">{t('plan_banner_title')}</span>
            </div>
            <Button variant="ghost" size="sm">{isCollapsed ? t('expand') : t('collapse')}</Button>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
            <div className="p-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-2 text-left">{t('category')}</th>
                    <th className="py-2 px-2 text-left">{t('comment')}</th>
                    <th className="py-2 px-2 text-left">{t('duration')}</th>
                    <th className="py-2 px-2 text-center">{t('action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center text-muted-foreground py-4">{t('no_plans')}</td>
                    </tr>
                  ) : (
                    plans.map((plan) => {
                      const category = categories.find(c => c.code === plan.category_code);
                      const isCategoryActive = !!category?.isActive;
                      const isAdded = records.some(r => r.linked_plan_id === plan.id);
                      return (
                      <tr key={plan.id} className="border-b">
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-2xl`}>{category?.icon || '❓'}</span>
                            <div>
                                <span>{category?.label || plan.category_code}</span>
                                {plan.subcode && <div className="text-xs text-muted-foreground">({plan.subcode})</div>}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-2">{plan.comment || '-'}</td>
                        <td className="py-2 px-2">{plan.duration ? `${plan.duration}분` : '-'}</td>
                        <td className="text-center">
                            <Button size="sm" onClick={() => onAddFromPlan(plan, isCategoryActive)} disabled={isAdded}>
                              {isAdded ? t('added') : (isCategoryActive ? t('add_record') : `${t('add_record')} (${t('inactive')})`)}
                            </Button>
                        </td>
                      </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
              {plans.length > 0 && (
                <div className="flex justify-end mt-4">
                    <Button onClick={onAddAllFromPlans} disabled={isAddingAll || allPlansAdded}>
                      {isAddingAll ? t('processing') : (allPlansAdded ? t('all_added') : t('add_all_records'))}
                    </Button>
                </div>
              )}
            </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

interface DailyPageProps {
    loaderData: DailyPageLoaderData;
}

export default function DailyPage({ loaderData }: DailyPageProps) {
  const { today, records, dailyNotes, plansForBanner, markedDates, categories } = loaderData;
  const fetcher = useFetcher<typeof action>();
  const { t, i18n } = useTranslation();

  if (!i18n.isInitialized) {
    return null; // Or a loading spinner
  }

  const [form, setForm] = useState<AddFormState>(() => {
      const firstActiveCategory = categories.find(c => c.isActive);
    return {
        category_code: firstActiveCategory ? firstActiveCategory.code : "",
        duration: "",
        comment: "",
        is_public: false,
    };
  });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const [durationError, setDurationError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [showActivateCategoryDialog, setShowActivateCategoryDialog] = useState(false);
  const [planToActivate, setPlanToActivate] = useState<DailyPlanUI | null>(null);

  const [editingSubcodeForRecordId, setEditingSubcodeForRecordId] = useState<string | null>(null);
  const [editSubcodeValue, setEditSubcodeValue] = useState("");
  const [showMemoFormForRecordId, setShowMemoFormForRecordId] = useState<string | null>(null);
  const [memoTitle, setMemoTitle] = useState("");
  const [memoContent, setMemoContent] = useState("");

  const activeCategories = useMemo(() => categories.filter(cat => cat.isActive), [categories]);

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.ok) {
    const firstActiveCategory = categories.find(c => c.isActive);
      setForm({ category_code: firstActiveCategory?.code || "", duration: "", comment: "", is_public: false });
    setIsEditing(false);
    setSelectedRowId(null);
                setEditingSubcodeForRecordId(null);
                setShowMemoFormForRecordId(null);
    }
  }, [fetcher.state, fetcher.data, categories]);

  function validateDuration(value: string): boolean {
    const num = Number(value);
    if (value.trim() === "" || (num >= 0 && num <= MAX_MINUTES_PER_DAY)) {
        setDurationError(null);
        return true;
    }
      setDurationError(`0에서 ${MAX_MINUTES_PER_DAY} 사이의 숫자를 입력해주세요.`);
      return false;
  }

  function handleFormCategorySelect(code: string) {
    setForm(f => ({ ...f, category_code: code }));
  }

  const handleRowClick = (record: DailyRecordUI) => {
    if (selectedRowId === record.id) {
      handleCancelEdit();
    } else {
    setSelectedRowId(record.id);
    setIsEditing(true);
      setForm({
        category_code: record.category_code || "",
        duration: record.duration !== null && record.duration !== undefined ? String(record.duration) : "",
        comment: record.comment || "",
        is_public: record.is_public || false,
      });
    setEditingSubcodeForRecordId(null);
    setShowMemoFormForRecordId(null);
  }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedRowId(null);
    const firstActiveCategory = categories.find(c => c.isActive);
    setForm({
      category_code: firstActiveCategory?.code || "",
      duration: "",
      comment: "",
      is_public: false,
    });
  };

  const confirmDelete = (recordId: string) => {
    setItemToDelete(recordId);
    setShowDeleteConfirm(true);
  };
  
  const handleDelete = () => {
    if (itemToDelete) {
      const formData = new FormData();
      formData.append("intent", "deleteRecord");
      formData.append("recordId", itemToDelete);
      fetcher.submit(formData, { method: "POST" });
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };
  
  const selectedRecord = records.find(r => r.id === selectedRowId);

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 pt-16 bg-background min-h-screen">
      <div className="mb-6 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">{t('daily')}</h1>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CalendarPopover markedDates={markedDates} currentSelectedDate={today} />
            <div className="text-lg font-bold text-muted-foreground">
              {DateTime.fromISO(today).setLocale(i18n.language).toFormat("yyyy-MM-dd (ccc)")}
            </div>
          </div>
          <Button asChild>
              <Link to="/plan/tomorrow"><Plus className="w-4 h-4 mr-1" />{t('tomorrow_plan')}</Link>
          </Button>
        </div>
      </div>

      <PlanBanner
        plans={plansForBanner}
        records={records}
        date={today} 
                categories={categories}
        onAddFromPlan={(plan, isCategoryActive) => {
            if (!isCategoryActive) {
                setPlanToActivate(plan);
                setShowActivateCategoryDialog(true);
                return;
            }
            const formData = new FormData();
            formData.append("intent", "addRecord");
            formData.append("category_code", plan.category_code);
            formData.append("subcode", plan.subcode || "");
            formData.append("duration", String(plan.duration || ""));
            formData.append("comment", plan.comment || "");
            formData.append("date", today);
            formData.append("linked_plan_id", plan.id);
            fetcher.submit(formData, { method: "POST" });
        }}
        onAddAllFromPlans={() => {
            const plansToAdd = plansForBanner.filter(p => !records.some(r => r.linked_plan_id === p.id));
            if (plansToAdd.length === 0) return;
            const formData = new FormData();
            formData.append("intent", "addAllRecordsFromMultiplePlans");
            formData.append("date", today);
            formData.append("plansData", JSON.stringify(plansToAdd.map(p => ({
                plan_id: p.id,
                category_code: p.category_code,
                subcode: p.subcode,
                duration: p.duration,
                comment: p.comment,
                linked_plan_id: p.id,
            }))));
            fetcher.submit(formData, { method: "POST" });
        }}
        isAddingAll={fetcher.state !== 'idle' && fetcher.formData?.get("intent") === "addAllRecordsFromMultiplePlans"}
       />

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
            <Card>
              <CardHeader><CardTitle>{isEditing ? t('edit_record') : t('add_daily_record')}</CardTitle></CardHeader>
            <CardContent>
              <fetcher.Form method="post" onSubmit={() => setDurationError(null)}>
                    <input type="hidden" name="intent" value={isEditing ? "updateRecord" : "addRecord"} />
                    {isEditing && <input type="hidden" name="recordId" value={selectedRowId || ''} />}
                <input type="hidden" name="date" value={today} />
                <CategorySelector
                        categories={activeCategories}
                        selectedCategoryCode={form.category_code}
                  onSelectCategory={handleFormCategorySelect}
                        disabled={isEditing && !!selectedRecord?.linked_plan_id}
                        instanceId="daily-page-form"
                />
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        <div className="relative">
                            <Input name="duration" type="number" placeholder={t('duration')} value={form.duration} onChange={e => { if(validateDuration(e.target.value)) setForm(f=>({...f, duration: e.target.value}))}} className={`w-24 ${durationError ? 'border-red-500' : ''}`} />
                            {durationError && <div className="absolute -bottom-6 left-0 text-xs text-red-500">{durationError}</div>}
                            </div>
                        <Input name="comment" placeholder={t('comment')} value={form.comment} onChange={e => setForm(f=>({...f, comment: e.target.value}))} className="flex-1" />
                        <input type="hidden" name="category_code" value={form.category_code} />
                        {isEditing && (
                            <div className="flex items-center space-x-2"><Label htmlFor="is_public_edit">{t('public')}</Label><input type="checkbox" name="is_public" id="is_public_edit" checked={form.is_public} onChange={e => setForm(f => ({...f, is_public: e.target.checked}))} /></div>
                        )}
                        {isEditing ? (
                            <div className="flex gap-1">
                                <Button type="submit" size="sm" disabled={fetcher.state !== 'idle'}>{t('save')}</Button>
                                <Button type="button" size="sm" variant="outline" onClick={handleCancelEdit}>{t('cancel')}</Button>
                                <Button type="button" variant="destructive" size="sm" onClick={() => confirmDelete(selectedRowId!)}>{t('delete')}</Button>
                            </div>
                        ) : (
                            <Button type="submit" disabled={fetcher.state !== 'idle' || !form.category_code}>{t('add')}</Button>
                        )}
                </div>
              </fetcher.Form>
            </CardContent>
          </Card>

          <Card>
              <CardHeader><CardTitle>{t('records')}</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-base">
                        <thead><tr className="border-b">
                            <th className="py-2 px-2 text-left w-1/3">{t('category')}</th>
                            <th className="py-2 px-2 text-left w-2/4">{t('comment')}</th>
                            <th className="py-2 px-2 text-left">{t('duration')}</th>
                            <th className="py-2 px-2 text-center">{t('action')}</th>
                        </tr></thead>
                  <tbody>
                            {records.map(rec => {
                      const categoryInfo = categories.find(c => c.code === rec.category_code);
                                return (<React.Fragment key={rec.id}>
                                    <tr className={`border-b cursor-pointer ${selectedRowId === rec.id ? 'bg-accent/30' : ''}`} onClick={() => handleRowClick(rec)}>
                            <td className="py-2 px-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{categoryInfo?.icon}</span>
                                    <div>
                                        <span className="font-medium">{categoryInfo?.label}</span>
                                        {rec.subcode && <div className="text-xs text-muted-foreground">{rec.subcode}</div>}
                                    </div>
                                </div>
                            </td>
                                        <td className="w-2/4">{rec.comment || '-'}</td>
                                        <td className="w-[70px]">{rec.duration ? `${rec.duration}분` : (categoryInfo?.hasDuration ? "-" : "")}</td>
                                        <td className="py-2 px-2 text-center">
                                            <div className="flex gap-1 justify-center">
                                                <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); setEditingSubcodeForRecordId(rec.id); setEditSubcodeValue(rec.subcode || ""); setShowMemoFormForRecordId(null); setSelectedRowId(rec.id); setIsEditing(false); }}>{t('subcode')}</Button>
                                                <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); setShowMemoFormForRecordId(rec.id); setMemoTitle(''); setMemoContent(''); setEditingSubcodeForRecordId(null); setSelectedRowId(rec.id); setIsEditing(false); }}>{t('comment')}</Button>
                                            </div>
                                        </td>
                          </tr>
                                    {editingSubcodeForRecordId === rec.id && (<tr><td colSpan={4} className="bg-muted p-2"><fetcher.Form method="post" className="flex items-center gap-2" onSubmit={() => setEditingSubcodeForRecordId(null)}><input type="hidden" name="intent" value="updateSubcode" /><input type="hidden" name="recordId" value={rec.id} /><Input name="subcode" value={editSubcodeValue} onChange={e => setEditSubcodeValue(e.target.value)} className="flex-1" /><Button type="submit" size="sm">{t('save')}</Button><Button type="button" size="sm" variant="ghost" onClick={() => setEditingSubcodeForRecordId(null)}><X className="w-4 h-4"/></Button></fetcher.Form></td></tr>)}
                                    {showMemoFormForRecordId === rec.id && (<tr><td colSpan={4} className="bg-muted p-4"><h4 className="font-medium text-md mb-2">{t('add_new_memo')}</h4><fetcher.Form method="post" className="flex flex-col gap-3" onSubmit={() => setShowMemoFormForRecordId(null)}><input type="hidden" name="intent" value="addMemo" /><input type="hidden" name="recordId" value={rec.id} /><Input name="memoTitle" placeholder={t('title')} value={memoTitle} onChange={e => setMemoTitle(e.target.value)} /><Textarea name="memoContent" placeholder={t('content')} value={memoContent} onChange={e => setMemoContent(e.target.value)} required /><div className="flex justify-end gap-2"><Button type="submit" size="sm">{t('save')}</Button><Button type="button" size="sm" variant="outline" onClick={() => setShowMemoFormForRecordId(null)}>{t('cancel')}</Button></div></fetcher.Form></td></tr>)}
                                </React.Fragment>)
                    })}
                            {records.length === 0 && (<tr><td colSpan={4} className="text-center py-8 text-muted-foreground">{t('no_records_yet')}</td></tr>)}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <DailyNotesSection 
                currentDailyNotes={dailyNotes}
            today={today}
          />
        </div>

        <div className="w-full lg:w-96 space-y-4">
            <h3 className="font-semibold text-foreground">{t('memos_by_record')}</h3>
            {records.flatMap(r => r.memos || []).length === 0 ? (<p className="text-sm text-muted-foreground">{t('no_memos')}</p>) : 
            (records.map(record => record.memos && record.memos.length > 0 && (
                <div key={`memo-list-${record.id}`} className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-1">
                        <span className="text-lg">{categories.find(c=>c.code === record.category_code)?.icon || '❓'}</span>
                        {record.comment || categories.find(c=>c.code === record.category_code)?.label}
                 </h4>
                {record.memos.map(memo => (
                        <Card key={memo.id} className="bg-muted/50">
                            <CardHeader className="p-3 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-semibold">{memo.title || t('comment')}</CardTitle>
                                <fetcher.Form method="post"><input type="hidden" name="intent" value="deleteMemo"/><input type="hidden" name="memoId" value={memo.id}/><Button variant="ghost" size="icon" className="h-6 w-6" type="submit"><X className="w-4 h-4"/></Button></fetcher.Form>
                    </CardHeader>
                            <CardContent className="p-3 pt-0">
                                <p className="text-sm whitespace-pre-wrap">{memo.content}</p>
                                <p className="text-xs text-muted-foreground mt-2">{DateTime.fromISO(memo.created_at!).setLocale(i18n.language).toLocaleString(DateTime.DATETIME_SHORT)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )))}
        </div>
      </div>
      
       <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('delete_confirm_title')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('delete_confirm_description')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setItemToDelete(null)}>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>{t('delete')}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      {showActivateCategoryDialog && planToActivate && (
        <AlertDialog open={showActivateCategoryDialog} onOpenChange={setShowActivateCategoryDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('activate_category_dialog_title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('activate_category_dialog_description', { categoryLabel: categories.find(c => c.code === planToActivate.category_code)?.label || planToActivate.category_code })}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setPlanToActivate(null)}>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => {
                            if (planToActivate) {
                                const formData = new FormData();
                                formData.append("intent", "activateCategoryAndAddRecordFromPlan");
                                formData.append("planId", planToActivate.id); 
                                formData.append("category_code_to_activate", planToActivate.category_code);
                                const category = categories.find(c=>c.code === planToActivate.category_code);
                                formData.append("isCustomCategory", String(!!category?.isCustom));
                                formData.append("subcode", planToActivate.subcode || "");
                                formData.append("duration", String(planToActivate.duration || ""));
                                formData.append("comment", planToActivate.comment || "");
                                formData.append("date", today); 
                                formData.append("linked_plan_id", planToActivate.id);
                                fetcher.submit(formData, { method: "POST" });
                                setShowActivateCategoryDialog(false);
                                setPlanToActivate(null);
                            }
                        }}
                    >
                        {t('activate_and_add')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}