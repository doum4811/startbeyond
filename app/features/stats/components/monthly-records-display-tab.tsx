import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Search, ChevronDown, ChevronUp, Filter, Grid, List } from "lucide-react";
import { DateTime } from "luxon";
import type { CategoryCode, UICategory } from "~/common/types/daily";
import { Popover, PopoverContent, PopoverTrigger } from "~/common/components/ui/popover";
import { Badge } from "~/common/components/ui/badge";
import type { DailyRecordUI, MemoUI } from "~/features/daily/pages/daily-page"; // Assuming these types are correctly exported

// Interface for data structure for one day, matches structure in StatsPage loader
interface MonthlyDayRecord {
  date: string; // YYYY-MM-DD
  records: DailyRecordUI[];
  dailyNote: string | null;
  memos: MemoUI[];
}

interface MonthlyRecordsDisplayTabProps {
  monthlyRecordsForDisplay: MonthlyDayRecord[];
  categories: UICategory[];
  // profileId: string; // May not be needed directly here if all actions are on parent
}

export function MonthlyRecordsDisplayTab({
  monthlyRecordsForDisplay,
  categories,
}: MonthlyRecordsDisplayTabProps) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<CategoryCode>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  // Reset filters when the core data changes (e.g., month changes)
  useEffect(() => {
    setExpandedDates(new Set());
    setSelectedCategories(new Set());
    setSearchQuery("");
  }, [monthlyRecordsForDisplay]);

  function toggleDate(date: string) {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  }

  function toggleCategory(category: CategoryCode) {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

  function clearFilters() {
    setSelectedCategories(new Set());
    setSearchQuery("");
  }

  function filterRecords(records: MonthlyDayRecord[]) {
    return records.filter(day => {
      if (selectedCategories.size > 0) {
        const hasSelectedCategory = day.records.some(record =>
          selectedCategories.has(record.category_code as CategoryCode) // Ensure category_code is CategoryCode
        );
        if (!hasSelectedCategory) return false;
      }

      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          day.records.some(record =>
            record.comment?.toLowerCase().includes(searchLower) ||
            record.subcode?.toLowerCase().includes(searchLower)
          ) ||
          day.dailyNote?.toLowerCase().includes(searchLower) ||
          day.memos.some(memo =>
            memo.title?.toLowerCase().includes(searchLower) || // Ensure title is checked
            memo.content.toLowerCase().includes(searchLower)
          );
        if (!matchesSearch) return false;
      }
      return true;
    });
  }

  const filteredRecords = filterRecords(monthlyRecordsForDisplay);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>월간 기록</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4 mr-2" />
              그리드
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4 mr-2" />
              리스트
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="검색어를 입력하세요..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  필터
                  {selectedCategories.size > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedCategories.size}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">카테고리 필터</h4>
                    {selectedCategories.size > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                      >
                        초기화
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat) => (
                      <Button
                        key={cat.code}
                        variant={selectedCategories.has(cat.code as CategoryCode) ? "default" : "outline"}
                        size="sm"
                        className="justify-start"
                        onClick={() => toggleCategory(cat.code as CategoryCode)}
                      >
                        <span className="mr-2">{cat.icon}</span>
                        {cat.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>
            {filteredRecords.map((day) => {
              const displayDate = DateTime.fromISO(day.date).toFormat("yyyy-MM-dd (ccc)");
              return (
                <Card key={day.date}>
                  <CardHeader className="cursor-pointer" onClick={() => toggleDate(day.date)}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <span>{displayDate}</span>
                        <span className="text-sm font-normal text-muted-foreground">
                          {day.records.length}개의 기록
                        </span>
                      </CardTitle>
                      {expandedDates.has(day.date) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedDates.has(day.date) && (
                    <CardContent>
                      <div className="space-y-4">
                        {/* Records */}
                        <div className="space-y-2">
                          {day.records.map((record) => {
                            const categoryInfo = categories.find(c => c.code === record.category_code);
                            return (
                              <div key={record.id} className="flex items-center gap-4 p-3 border rounded-lg">
                                <span className="text-2xl">{categoryInfo?.icon || '❓'}</span>
                                <div className="flex-1">
                                  <div className="font-medium">{categoryInfo?.label || record.category_code}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {record.subcode && <span>{record.subcode} • </span>}
                                    {record.duration && <span>{record.duration}분 • </span>}
                                    {record.comment}
                                  </div>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {record.created_at ? new Date(record.created_at).toLocaleTimeString() : ''}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Daily Note */}
                        {day.dailyNote && (
                          <div className="p-3 border rounded-lg">
                            <div className="text-sm font-medium mb-1">일일 메모</div>
                            <div className="text-sm text-muted-foreground whitespace-pre-line">
                              {day.dailyNote}
                            </div>
                          </div>
                        )}

                        {/* Memos */}
                        {day.memos && day.memos.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium">상세 메모</div>
                            {day.memos.map((memo) => (
                              <div key={memo.id} className="p-3 border rounded-lg">
                                <div className="font-medium mb-1">{memo.title || "메모"}</div>
                                <div className="text-sm text-muted-foreground whitespace-pre-line">
                                  {memo.content}
                                </div>
                                <div className="text-xs text-muted-foreground mt-2">
                                  {memo.created_at ? new Date(memo.created_at).toLocaleString() : ''}
                                </div>
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
            {filteredRecords.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground py-8">
                검색 결과가 없습니다
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 