import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { DateTime } from "luxon";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { UICategory } from "~/common/types/daily";
import type { MonthlyDayRecord } from "../types";

interface Props {
  data: MonthlyDayRecord[];
  categories: UICategory[];
  expandedDates: Set<string>;
  onToggleDate: (date: string) => void;
}

export default function MonthlyRecordsGridView({ data, categories, expandedDates, onToggleDate }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {data.map((day) => {
        const displayDate = DateTime.fromISO(day.date).toFormat("yyyy-MM-dd (ccc)");
        const isOpen = expandedDates.has(day.date);
        return (
          <Card key={day.date}>
            <CardHeader className="cursor-pointer" onClick={() => onToggleDate(day.date)}>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span>{displayDate}</span>
                  <span className="text-sm font-normal text-muted-foreground">{day.records.length}개의 기록</span>
                </CardTitle>
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CardHeader>
            {isOpen && (
              <CardContent>
                <div className="space-y-4">
                  {day.records.map((record) => {
                    const cat = categories.find(c => c.code === record.category_code);
                    return (
                      <div key={record.id} className="flex items-center gap-4 p-3 border rounded-lg">
                        <span className="text-2xl">{cat?.icon || "❓"}</span>
                        <div className="flex-1">
                          <div className="font-medium">{cat?.label || record.category_code}</div>
                          <div className="text-sm text-muted-foreground">
                            {record.subcode && <span>{record.subcode} • </span>}
                            {record.duration && <span>{record.duration}분 • </span>}
                            {record.comment}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {record.created_at ? new Date(record.created_at).toLocaleTimeString() : ""}
                        </div>
                      </div>
                    );
                  })}
                  {day.dailyNote && (
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm font-medium mb-1">일일 메모</div>
                      <div className="text-sm text-muted-foreground whitespace-pre-line">{day.dailyNote}</div>
                    </div>
                  )}
                  {day.memos.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">상세 메모</div>
                      {day.memos.map((memo) => (
                        <div key={memo.id} className="p-3 border rounded-lg">
                          <div className="font-medium mb-1">{memo.title || "메모"}</div>
                          <div className="text-sm text-muted-foreground whitespace-pre-line">{memo.content || ""}</div>
                          <div className="text-xs text-muted-foreground mt-2">{memo.created_at ? new Date(memo.created_at).toLocaleString() : ""}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
} 