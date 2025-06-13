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
import { useTranslation } from "react-i18next";

interface Props {
  monthlyRecordsForDisplay: MonthlyDayRecord[];
  categories: UICategory[];
}

export default function MonthlyRecordsTab({ monthlyRecordsForDisplay, categories }: Props) {
  const { t } = useTranslation();
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
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
            <Input
            placeholder={t("stats_records_page.search_placeholder")}
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
            {t("stats_records_page.expand_all")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCollapseAll}
          >
            <ChevronsUp className="h-4 w-4 mr-2" />
            {t("stats_records_page.collapse_all")}
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