import { DateTime } from "luxon";
import { Button } from "~/common/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Edit3, Plus, Trash2, X } from "lucide-react";
import type { DailyRecordUI, UICategory } from "../types";
import { getCategoryColor } from "../utils";

interface DailyRecordListProps {
  records: DailyRecordUI[];
  categories: UICategory[];
  onEdit: (record: DailyRecordUI) => void;
  onDelete: (recordId: string) => void;
  onAddMemo: (recordId: string) => void;
  onDeleteMemo: (memoId: string, recordId: string) => void;
  onSubcodeChange: (recordId: string, newSubcode: string | null) => void;
}

export function DailyRecordList({
  records,
  categories,
  onEdit,
  onDelete,
  onAddMemo,
  onDeleteMemo,
  onSubcodeChange
}: DailyRecordListProps) {
  if (records.length === 0) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>기록된 활동</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400">오늘 기록된 활동이 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>기록된 활동</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {records.map((record) => {
            const category = categories.find(c => c.code === record.category_code);
            const categoryColor = getCategoryColor(category, record.category_code);
            const recordSubcodes = category?.subcodes || [];

            return (
              <li key={record.id} className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow dark:border-gray-700 dark:hover:shadow-gray-600/50">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`font-semibold text-lg ${categoryColor}`}>
                      {category?.label || record.category_code}
                    </span>
                    {record.duration != null && <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">({record.duration}분)</span>}
                    {record.comment && <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{record.comment}</p>}
                    {record.linked_plan_id && <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">From Plan: {record.linked_plan_id}</p>}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Public: {record.is_public ? "Yes" : "No"} | Created: {record.created_at ? DateTime.fromISO(record.created_at).toFormat("HH:mm") : 'N/A'}
                    </p>
                    
                    {recordSubcodes && recordSubcodes.length > 0 && (
                      <div className="mt-2">
                        <select
                          value={record.subcode || ""}
                          onChange={(e) => onSubcodeChange(record.id, e.target.value || null)}
                          className="text-xs p-1 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">서브코드 선택/해제</option>
                          {recordSubcodes.map((sc: { code: string; name: string }) => (
                            <option key={sc.code} value={sc.code}>{sc.name} ({sc.code})</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(record)} title="수정">
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(record.id)} title="삭제">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onAddMemo(record.id)} title="메모 추가">
                      <Plus className="w-4 h-4 mr-1" /> 메모
                    </Button>
                  </div>
                </div>
                {record.memos && record.memos.length > 0 && (
                  <div className="mt-3 ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-2">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400">메모:</h4>
                    {record.memos.map(memo => (
                      <div key={memo.id} className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-xs relative group">
                        <p className="font-medium">{memo.title}</p>
                        {memo.content && <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{memo.content}</p>}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 w-5 h-5 opacity-50 group-hover:opacity-100"
                          onClick={() => onDeleteMemo(memo.id, record.id)}
                          title="메모 삭제"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
} 