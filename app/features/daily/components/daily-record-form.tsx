import type { FormEvent, Dispatch, SetStateAction } from "react";
import type { FetcherWithComponents } from "react-router";
import { Button } from "~/common/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Input } from "~/common/components/ui/input";
import { Label } from "~/common/components/ui/label";
import { CategorySelector } from "~/common/components/ui/CategorySelector";
import type { UICategory } from "~/common/types/daily";
import type { DailyRecordUI } from "~/features/daily/types";

const MAX_MINUTES_PER_DAY = 60 * 24;

interface AddFormState {
  category: string;
  duration: string;
  comment: string;
}

interface DailyRecordFormProps {
  fetcher: FetcherWithComponents<any>;
  isEditing: boolean;
  selectedRowId: string | null;
  today: string;
  categories: UICategory[];
  form: AddFormState;
  setForm: Dispatch<SetStateAction<AddFormState>>;
  editRowCategory: string;
  setEditRowCategory: (category: string) => void;
  editRowDuration: string;
  setEditRowDuration: (duration: string) => void;
  editRowComment: string;
  setEditRowComment: (comment: string) => void;
  editRowIsPublic: boolean;
  setEditRowIsPublic: (isPublic: boolean) => void;
  handleEditRowCancel: () => void;
  selectedRecord: DailyRecordUI | undefined;
  durationError: string | null;
  setDurationError: (error: string | null) => void;
}

function isValidCategoryCode(code: string, activeCategories: UICategory[]): boolean {
  return activeCategories.some(c => c.code === code && c.isActive);
}

export function DailyRecordForm({
  fetcher,
  isEditing,
  selectedRowId,
  today,
  categories,
  form,
  setForm,
  editRowCategory,
  setEditRowCategory,
  editRowDuration,
  setEditRowDuration,
  editRowComment,
  setEditRowComment,
  editRowIsPublic,
  setEditRowIsPublic,
  handleEditRowCancel,
  selectedRecord,
  durationError,
  setDurationError,
}: DailyRecordFormProps) {
  const activeCategories = categories.filter(cat => cat.isActive);
  const currentFormCategory = isEditing ? editRowCategory : form.category;
  const currentFormDuration = isEditing ? editRowDuration : form.duration;
  const currentFormComment = isEditing ? editRowComment : form.comment;

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
      else setForm((f: AddFormState) => ({ ...f, category: code }));
    } else {
      console.warn("Attempted to select an invalid or inactive category code:", code);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    setDurationError(null);
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{isEditing && selectedRowId ? "Edit Record" : "Add Daily Record"}</CardTitle>
      </CardHeader>
      <CardContent>
        <fetcher.Form method="post" onSubmit={handleSubmit}>
          <input type="hidden" name="intent" value={isEditing && selectedRowId ? "updateRecord" : "addRecord"} />
          {isEditing && selectedRowId && <input type="hidden" name="recordId" value={selectedRowId} />}
          <input type="hidden" name="date" value={today} />
          <CategorySelector
            categories={activeCategories}
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
                      if (validateDuration(e.target.value)) setForm((f: AddFormState) => ({ ...f, duration: e.target.value }));
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
                  else setForm((f: AddFormState) => ({ ...f, comment: e.target.value }));
                }}
                className="flex-1"
                disabled={fetcher.state !== 'idle' && fetcher.formData?.get('intent') === (isEditing ? 'updateRecord' : 'addRecord')}
              />
              <input type="hidden" name="category_code" value={currentFormCategory} />
              {isEditing && selectedRowId && (
                <div className="flex items-center space-x-2 pt-2 flex-shrink-0">
                  <Label htmlFor="is_public_edit" className="text-sm">공개</Label>
                  <input type="checkbox" name="is_public" id="is_public_edit" checked={editRowIsPublic} onChange={(e) => setEditRowIsPublic(e.target.checked)} className="form-checkbox h-4 w-4 text-primary rounded" />
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
                <Button type="submit" className="ml-2 flex-shrink-0" disabled={fetcher.state !== 'idle' || !form.category || !isValidCategoryCode(form.category, activeCategories)}>
                  {fetcher.state !== 'idle' && fetcher.formData?.get('intent') === 'addRecord' ? "추가중..." : "Add"}
                </Button>
              )}
            </div>
          </div>
        </fetcher.Form>
      </CardContent>
    </Card>
  );
} 