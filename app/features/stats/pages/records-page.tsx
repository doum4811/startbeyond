import { useLoaderData, useSearchParams, useNavigate, Link } from "react-router";
import type { MetaFunction, LoaderFunction } from "react-router";
import { DateTime } from "luxon";
import { Button } from "~/common/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search } from "lucide-react";
import MonthlyRecordsTab from "~/features/stats/components/MonthlyRecordsTab";
import { StatsPageHeader } from "~/common/components/stats/stats-page-header";
import { loader as recordsLoader, type RecordsLoaderData } from "../records-loader";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "~/common/components/ui/popover";
import { Calendar } from "~/common/components/ui/calendar";
import React, { useState } from "react";
import { Label } from "~/common/components/ui/label";

export const loader: LoaderFunction = recordsLoader;

export const meta: MetaFunction = () => {
  return [
    { title: "Search Records - StartBeyond" },
    { name: "description", content: "Search and filter all your activities, memos, and notes." },
  ];
};

function DateRangePicker({
  startDate,
  endDate,
  onApply,
}: {
  startDate: DateTime;
  endDate: DateTime;
  onApply: (start: DateTime, end: DateTime) => void;
}) {
  const { t } = useTranslation();
  const [currentStartDate, setCurrentStartDate] = useState(startDate);
  const [currentEndDate, setCurrentEndDate] = useState(endDate);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Search className="w-4 h-4" />
          {t("stats_records_page.search_by_period")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 space-y-4" align="end">
        <div className="flex gap-4">
          <div>
            <Label>{t("stats_records_page.start_date")}</Label>
            <Calendar
              selectedDate={currentStartDate}
              onDateChange={(day) => day && setCurrentStartDate(day)}
            />
          </div>
          <div>
            <Label>{t("stats_records_page.end_date")}</Label>
            <Calendar
              selectedDate={currentEndDate}
              onDateChange={(day) => day && setCurrentEndDate(day)}
            />
          </div>
        </div>
        <Button
          onClick={() => onApply(currentStartDate, currentEndDate)}
          className="w-full"
        >
          {t("stats_records_page.apply_period")}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

export default function RecordsPage() {
  const { monthlyRecordsForDisplay, categories, startDate, endDate } = useLoaderData<RecordsLoaderData>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const currentStartDate = DateTime.fromISO(startDate);
  const currentMonthString = currentStartDate.toFormat('yyyy-MM');

  const handlePeriodSearch = (start: DateTime, end: DateTime) => {
    const newParams = new URLSearchParams();
    newParams.set("startDate", start.toISODate()!);
    newParams.set("endDate", end.toISODate()!);
    navigate(`?${newParams.toString()}`, { preventScrollReset: true });
  }

  const periodControl = (
    <div className="flex items-center gap-1">
      <Button asChild variant="outline" size="icon">
        <Link to={`?month=${currentStartDate.minus({ months: 1 }).toFormat("yyyy-MM")}`} preventScrollReset>
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-36">
            {currentStartDate.setLocale(i18n.language).toFormat("yyyy MMMM")}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
           <Calendar
              selectedDate={currentStartDate}
              onDateChange={(day) => day && navigate(`?month=${day.toFormat("yyyy-MM")}`)}
            />
        </PopoverContent>
      </Popover>
      <Button asChild variant="outline" size="icon">
        <Link to={`?month=${currentStartDate.plus({ months: 1 }).toFormat("yyyy-MM")}`} preventScrollReset>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
      <DateRangePicker
        startDate={currentStartDate}
        endDate={DateTime.fromISO(endDate)}
        onApply={handlePeriodSearch}
      />
    </div>
  );

  const isPeriodSearch = searchParams.has("startDate");
  const description = isPeriodSearch
    ? t("stats_records_page.description_period", {
        startDate: currentStartDate.setLocale(i18n.language).toFormat("yyyy.MM.dd"),
        endDate: DateTime.fromISO(endDate).setLocale(i18n.language).toFormat("yyyy.MM.dd"),
      })
    : t("stats_records_page.description_month", {
        month: currentStartDate.setLocale(i18n.language).toFormat("yyyy MMMM"),
      });

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 pt-8 sm:pt-12 md:pt-16 bg-background min-h-screen">
      <StatsPageHeader
        title={t("stats_records_page.title")}
        description={description}
        periodButton={periodControl}
        shareSettings={{ isPublic: false, includeRecords: false, includeDailyNotes: false, includeMemos: false, includeStats: false }}
        onShareSettingsChange={() => {}}
        isShareDialogOpen={false}
        setIsShareDialogOpen={() => {}}
        isCopied={false}
        onCopyLink={() => {}}
        shareLink=""
        pdfFileName=""
      />
      <div className="mt-6">
        <MonthlyRecordsTab 
            monthlyRecordsForDisplay={monthlyRecordsForDisplay}
            categories={categories}
        />
      </div>
    </div>
  );
} 