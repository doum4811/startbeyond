import React, { useState } from "react";
import { Input } from "~/common/components/ui/input";
import { Button } from "~/common/components/ui/button";
import { List, Grid } from "lucide-react";
import { MonthlyRecordsFilter } from "./MonthlyRecordsFilter";
import { MonthlyRecordsListView } from "./MonthlyRecordsListView";
import { MonthlyRecordsGridView } from "./MonthlyRecordsGridView";
import { useTranslation } from "react-i18next";
import type { MonthlyDayRecord, DailyRecordUI } from "~/features/stats/types";
import type { UICategory } from "~/common/types/daily";

interface Props {
  monthlyRecordsForDisplay: MonthlyDayRecord[];
  categories: UICategory[];
  showNotes?: boolean;
}

export default function MonthlyRecordsTab({ monthlyRecordsForDisplay, categories, showNotes = true }: Props) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const toggleDateExpansion = (date: string) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) newSet.delete(date);
      else newSet.add(date);
      return newSet;
    });
  };

  const toggleCategoryFilter = (categoryCode: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryCode)) newSet.delete(categoryCode);
      else newSet.add(categoryCode);
      return newSet;
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories(new Set());
  };

  const filteredData = monthlyRecordsForDisplay.map(day => {
    const filteredRecords = day.records.filter(record => {
      const searchMatch =
        searchQuery === "" ||
        record.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.subcode?.toLowerCase().includes(searchQuery.toLowerCase());
      const categoryMatch =
        selectedCategories.size === 0 || selectedCategories.has(record.category_code || "");
      return searchMatch && categoryMatch;
    });
    
    // Only include day if it has records after filtering or a note that matches search
    const noteMatchesSearch = showNotes && day.dailyNote && day.dailyNote.toLowerCase().includes(searchQuery.toLowerCase());

    if(filteredRecords.length > 0 || (searchQuery !== "" && noteMatchesSearch)) {
        return { ...day, records: filteredRecords };
    }
    return null;
  }).filter((day): day is MonthlyDayRecord => day !== null);

  const expandAll = () => setExpandedDates(new Set(filteredData.map(d => d.date)));
  const collapseAll = () => setExpandedDates(new Set());

  return (
    <div className="w-full">
      {/* Filters and Controls */}
      <div className="mb-6 flex flex-col gap-4">
        {/* Category Filters */}
        <div>
          <MonthlyRecordsFilter
              categories={categories}
              selectedCategories={selectedCategories}
              onToggleCategory={toggleCategoryFilter}
              onClear={clearFilters}
          />
        </div>

        {/* Search and View Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="w-full md:w-1/3">
            <Input
              placeholder={t("stats_records_page.search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* View Controls */}
          <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={expandAll}>{t('stats_records_page.expand_all')}</Button>
              <Button variant="ghost" size="sm" onClick={collapseAll}>{t('stats_records_page.collapse_all')}</Button>
              <div className="flex items-center rounded-md bg-muted p-1">
                   <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="icon"
                      onClick={() => setViewMode('list')}
                      className="h-8 w-8"
                  >
                      <List className="h-4 w-4" />
                  </Button>
                  <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="icon"
                      onClick={() => setViewMode('grid')}
                      className="h-8 w-8"
                  >
                      <Grid className="h-4 w-4" />
                  </Button>
              </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {viewMode === 'list' ? (
          <MonthlyRecordsListView 
            data={filteredData} 
            categories={categories}
            expandedDates={expandedDates}
            onToggleDate={toggleDateExpansion}
            showNotes={showNotes}
          />
        ) : (
          <MonthlyRecordsGridView
              data={filteredData}
              categories={categories}
              expandedDates={expandedDates}
              onToggleDate={toggleDateExpansion}
          />
        )}
      </div>
    </div>
  );
} 