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
}

export function MonthlyRecordsGridView({ data, categories, expandedDates, onToggleDate }: Props) {
  const { i18n, t } = useTranslation();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((day) => (
          <Card key={day.date}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {DateTime.fromISO(day.date).setLocale(i18n.language).toLocaleString(DateTime.DATE_FULL)}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleDate(day.date)}
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
                    <div key={record.id} className="flex items-start gap-4">
                      <div className="w-24 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{category?.icon}</span>
                          <span className="text-sm font-medium">{category?.label}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm">
                          {record.duration_minutes && `${record.duration_minutes}분 • `}
                          {record.comment}
                          {record.subcode && ` (${record.subcode})`}
                        </div>
                        </div>
                      </div>
                    );
                  })}
                  {day.dailyNote && (
                  <div className="mt-4 pt-4 border-t">
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