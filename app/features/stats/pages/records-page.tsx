import { useLoaderData, Link } from "react-router";
import type { MetaFunction } from "react-router";
import { DateTime } from "luxon";
import { Button } from "~/common/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MonthlyRecordsTab from "~/features/stats/components/MonthlyRecordsTab";
import type { StatsPageLoaderData } from "~/features/stats/types";
import { StatsPageHeader } from "~/common/components/stats/stats-page-header";
import { loader as recordsLoader } from "../records-loader";

export const loader = recordsLoader;

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const pageData = data as StatsPageLoaderData | undefined;
  const monthName = pageData?.selectedMonthISO ? DateTime.fromFormat(pageData.selectedMonthISO, "yyyy-MM").toFormat("MMMM yyyy") : "Records";
  return [
    { title: `월간 기록 ${monthName} - StartBeyond` },
    { name: "description", content: `${monthName}의 모든 활동 기록을 확인합니다.` },
  ];
};

export default function RecordsPage() {
  const { selectedMonthISO, monthlyRecordsForDisplay, categories } = useLoaderData<typeof loader>();

  const currentMonth = DateTime.fromFormat(selectedMonthISO, "yyyy-MM");
  const prevMonthISO = currentMonth.minus({ months: 1 }).toFormat("yyyy-MM");
  const nextMonthISO = currentMonth.plus({ months: 1 }).toFormat("yyyy-MM");

  const periodControl = (
    <div className="flex items-center gap-1">
        <Button asChild variant="outline" size="icon">
            <Link to={`?month=${prevMonthISO}`} preventScrollReset>
            <ChevronLeft className="h-4 w-4" />
            </Link>
        </Button>
        <span className="text-lg font-medium w-32 text-center">
            {currentMonth.toFormat("yyyy년 MMMM")}
        </span>
        <Button asChild variant="outline" size="icon">
            <Link to={`?month=${nextMonthISO}`} preventScrollReset>
            <ChevronRight className="h-4 w-4" />
            </Link>
        </Button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 pt-8 sm:pt-12 md:pt-16 bg-background min-h-screen">
      <StatsPageHeader
        title="월간 기록 모아보기"
        description="한 달 동안의 모든 활동, 메모, 노트를 필터링하고 검색할 수 있습니다."
        periodButton={periodControl}
        // Dummy props for StatsPageHeader that are not used on this page
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