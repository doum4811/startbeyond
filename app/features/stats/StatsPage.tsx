import { useState } from "react";
import { useLoaderData, Link } from "react-router";
import { DateTime } from "luxon";
import { Button } from "~/common/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/common/components/ui/tabs";
import type { StatsPageLoaderData } from "./types";
import MonthlyRecordsTab from "./components/MonthlyRecordsTab";
// ... (SummaryTab, TimeAnalysisTab 등도 필요시 import)

export default function StatsPage() {
  const { selectedMonthISO, monthlyRecordsForDisplay, categories } = useLoaderData<StatsPageLoaderData>();
  const currentMonth = DateTime.fromFormat(selectedMonthISO, "yyyy-MM");
  const prevMonthISO = currentMonth.minus({ months: 1 }).toFormat("yyyy-MM");
  const nextMonthISO = currentMonth.plus({ months: 1 }).toFormat("yyyy-MM");

  // ... (공유, PDF 등 상태 관리 필요시 추가)

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 pt-16 bg-background min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">통계</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="icon">
            <Link to={`?month=${prevMonthISO}`}><ChevronLeft className="h-4 w-4" /></Link>
          </Button>
          <span className="text-lg font-medium">{currentMonth.toFormat("yyyy년 MMMM")}</span>
          <Button asChild variant="outline" size="icon">
            <Link to={`?month=${nextMonthISO}`}><ChevronRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
      <Tabs defaultValue="monthly-records" className="space-y-4">
        {/* 필요시 다른 탭도 추가 */}
        <TabsList>
          <TabsTrigger value="monthly-records">월간 기록</TabsTrigger>
        </TabsList>
        <TabsContent value="monthly-records">
          <MonthlyRecordsTab monthlyRecordsForDisplay={monthlyRecordsForDisplay} categories={categories} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 