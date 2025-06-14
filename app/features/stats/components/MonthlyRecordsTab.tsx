import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/common/components/ui/tabs";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Search, List, Grid, ChevronsDown, ChevronsUp } from "lucide-react";
import type { UICategory } from "~/common/types/daily";
import type { MonthlyDayRecord } from "../types";
import { MonthlyRecordsFilter } from "./MonthlyRecordsFilter";
import { MonthlyRecordsListView } from "./MonthlyRecordsListView";
import { MonthlyRecordsGridView } from "./MonthlyRecordsGridView";

interface Props {
  monthlyRecordsForDisplay: MonthlyDayRecord[];
  categories: UICategory[];
}

export default function MonthlyRecordsTab({ monthlyRecordsForDisplay, categories }: Props) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

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

  function toggleCategory(category: string) {
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
    setSearchQuery("");
    setSelectedCategories(new Set());
  }

  function filterRecords(records: MonthlyDayRecord[]) {
    return records.filter(record => {
      const matchesSearch = searchQuery === "" || 
        record.records.some(r => 
          r.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.subcode?.toLowerCase().includes(searchQuery.toLowerCase())
          ) ||
        record.dailyNote?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.memos.some(m => 
          m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.content.toLowerCase().includes(searchQuery.toLowerCase())
          );

      const matchesCategories = selectedCategories.size === 0 ||
        record.records.some(r => selectedCategories.has(r.category_code));

      return matchesSearch && matchesCategories;
    });
  }

  const filteredRecords = filterRecords(monthlyRecordsForDisplay);

  function handleExpandAll() {
    const allDates = new Set(filteredRecords.map(r => r.date));
    setExpandedDates(allDates);
  }

  function handleCollapseAll() {
    setExpandedDates(new Set());
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
            <Input
            placeholder="검색어를 입력하세요"
              value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[300px]"
            />
              <MonthlyRecordsFilter
                categories={categories}
                selectedCategories={selectedCategories}
                onToggleCategory={toggleCategory}
                onClear={clearFilters}
              />
        </div>
        <div className="flex items-center gap-2">
           <Button
            variant="outline"
            size="sm"
            onClick={handleExpandAll}
          >
            <ChevronsDown className="h-4 w-4 mr-2" />
            전체 열기
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCollapseAll}
          >
            <ChevronsUp className="h-4 w-4 mr-2" />
            전체 접기
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
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