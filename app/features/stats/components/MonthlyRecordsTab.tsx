import { useState, useMemo, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "~/common/components/ui/popover";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Search, Filter } from "lucide-react";
import type { MonthlyDayRecord } from "~/features/daily/types";
import type { UICategory } from "~/common/types/daily";
import MonthlyRecordsFilter from "./MonthlyRecordsFilter";
import MonthlyRecordsListView from "./MonthlyRecordsListView";
import MonthlyRecordsGridView from "./MonthlyRecordsGridView";

interface Props {
  monthlyRecordsForDisplay: MonthlyDayRecord[];
  categories: UICategory[];
}

export default function MonthlyRecordsTab({ monthlyRecordsForDisplay, categories }: Props) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const toggleDate = useCallback((date: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  }, []);

  const toggleCategory = useCallback((code: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCategories(new Set());
    setSearchQuery("");
  }, []);

  const filterRecords = useCallback((data: MonthlyDayRecord[]) => {
    return data.filter(day => {
      // Category filter
      if (selectedCategories.size > 0) {
        const hasSelectedCategory = day.records.some(r => 
          selectedCategories.has(r.category_code)
        );
        if (!hasSelectedCategory) return false;
      }

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches = 
          day.records.some(r => 
            (r.comment || "").toLowerCase().includes(q) ||
            (r.subcode || "").toLowerCase().includes(q)
          ) ||
          (day.dailyNote || "").toLowerCase().includes(q) ||
          day.memos.some(m =>
            (m.title || "").toLowerCase().includes(q) ||
            (m.content || "").toLowerCase().includes(q)
          );
        if (!matches) return false;
      }

      return true;
    });
  }, [selectedCategories, searchQuery]);

  const filteredRecords = useMemo(() => 
    filterRecords(monthlyRecordsForDisplay),
    [filterRecords, monthlyRecordsForDisplay]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              placeholder="검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-64 pl-9"
            />
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <MonthlyRecordsFilter
                categories={categories}
                selectedCategories={selectedCategories}
                onToggleCategory={toggleCategory}
                onClear={clearFilters}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            목록
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            그리드
          </Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <MonthlyRecordsListView
          data={filteredRecords}
          categories={categories}
          expandedDates={expandedDates}
          onToggleDate={toggleDate}
        />
      ) : (
        <MonthlyRecordsGridView
          data={filteredRecords}
          categories={categories}
          expandedDates={expandedDates}
          onToggleDate={toggleDate}
        />
      )}
    </div>
  );
} 