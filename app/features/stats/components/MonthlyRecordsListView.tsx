import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Button } from "~/common/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { UICategory } from "~/common/types/daily";
import type { MonthlyDayRecord } from "../types";
import { useTranslation } from "react-i18next";
import { DateTime } from "luxon";

interface Props {
  data: MonthlyDayRecord[];
  categories: UICategory[];
  expandedDates: Set<string>;
  onToggleDate: (date: string) => void;
  showNotes?: boolean;
}

export function MonthlyRecordsListView({ data, categories, expandedDates, onToggleDate, showNotes = true }: Props) {
  const { i18n, t } = useTranslation();

  return (
    <div className="space-y-4">
      {data.map((day) => (
          <Card key={day.date} className="overflow-x-auto">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 cursor-pointer" onClick={() => onToggleDate(day.date)}>
            <CardTitle className="text-sm font-medium">
              {DateTime.fromISO(day.date).setLocale(i18n.language).toLocaleString(DateTime.DATE_FULL)}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
            >
              {expandedDates.has(day.date) ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            </CardHeader>
          {expandedDates.has(day.date) && (
              <CardContent>
                <div className="space-y-4">
                    {day.records.map((record) => {
                  const category = categories.find(c => c.code === record.category_code);
                      return (
                    <div key={record.id} className="flex items-start gap-4 py-2 border-b last:border-b-0">
                      <div className="w-24 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{category?.icon}</span>
                          <span className="text-sm font-medium truncate" title={category?.label}>{category?.label}</span>
                        </div>
                      </div>
                      <div className="w-20 flex-shrink-0">
                        <div className="text-sm truncate" title={record.subcode || ''}>
                          {record.subcode || '-'}
                        </div>
                      </div>
                      <div className="flex-1 min-w-[150px]">
                        <div className="text-sm">
                          {record.comment}
                        </div>
                        {record.memos && record.memos.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {record.memos.map(memo => (
                              <div key={memo.id} className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                {memo.title && <div className="font-semibold text-primary">{memo.title}</div>}
                                <p className="whitespace-pre-wrap">{memo.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                       <div className="w-16 flex-shrink-0 text-right">
                          <span className="text-sm font-mono">{record.duration_minutes ? `${record.duration_minutes}분` : '-'}</span>
                       </div>
                    </div>
                      );
                    })}
                  {showNotes && day.dailyNote && (
                  <div className="mt-4 pt-4">
                    <div className="text-sm font-medium mb-2">{t("daily_notes")}</div>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {day.dailyNote}
                    </div>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
      ))}
    </div>
  );
} 