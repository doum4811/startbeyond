// app/features/stats/pages/summary-page.tsx
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Button } from "~/common/components/ui/button";
import { Calendar as CalendarIcon, Share2, Copy, Check, ChevronLeft, ChevronRight, Download, BarChart2, Calendar, Sun, Moon, Clock, CheckSquare } from "lucide-react";
import { DateTime } from "luxon";
import { CategoryDistributionChart } from "~/common/components/stats/category-distribution-chart";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Link, useLoaderData } from "react-router";
import * as statsQueries from "../queries";
import * as settingsQueries from "~/features/settings/queries";
import type { CategoryCode, UICategory } from "~/common/types/daily";
import { CATEGORIES } from "~/common/types/daily";
import { makeSSRClient } from "~/supa-client";
import type { CategoryDistribution, TimeOfDayDistribution, SubcodeDistribution } from "../types";
import { StatsPageHeader } from "~/common/components/stats/stats-page-header";
import { SubcodeDistributionChart } from "~/common/components/stats/subcode-distribution-chart";
import type { SummaryPageLoaderData } from '../types';

// Register a font for PDF (Optional, but good for Korean characters)
// Ensure you have a font file (e.g., NotoSansKR-Regular.ttf) in your project
// Font.register({
//   family: "Noto Sans KR",
//   src: "/fonts/NotoSansKR-Regular.ttf", // Adjust path as needed
// });

interface CustomShareSettings {
  isPublic: boolean;
  includeSummary: boolean; // Simplified for summary page
}

const initialCustomShareSettings: CustomShareSettings = {
  isPublic: false,
  includeSummary: true,
};

const pdfStyles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Helvetica" }, // Consider using registered font: fontFamily: "Noto Sans KR"
  header: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
  title: { fontSize: 22, marginBottom: 5, fontWeight: 'bold' },
  date: { fontSize: 12, color: "#555" },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 16, marginBottom: 8, fontWeight: 'bold', color: '#333' }, 
  summaryText: { fontSize: 11, marginBottom: 3, color: '#444' }, 
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 10,
    marginBottom: 4,
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryName: { flex: 2, color: '#333' },
  categoryValue: { flex: 1, textAlign: 'right', color: '#333' },
});

const SummaryReportPDF = ({ 
    data, 
    categories, 
    month 
}: { 
    data: CategoryDistribution[], 
    categories: UICategory[], 
    month: string 
}) => {
    const getCategoryLabel = (code: CategoryCode) => categories.find(c => c.code === code)?.label || code;
    const totalRecords = data.reduce((sum, cat) => sum + cat.count, 0);
    const totalDurationMinutes = data.reduce((sum, cat) => sum + cat.duration, 0);

    return (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <View style={pdfStyles.header}>
            <Text style={pdfStyles.title}>월간 활동 요약 보고서</Text>
            <Text style={pdfStyles.date}>{month}</Text>
          </View>
          
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>종합 요약</Text>
            <Text style={pdfStyles.summaryText}>총 기록 수: {totalRecords}건</Text>
            <Text style={pdfStyles.summaryText}>총 활동 시간: {(totalDurationMinutes / 60).toFixed(1)}시간 ({totalDurationMinutes}분)</Text>
      </View>
    
      <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>카테고리별 분포</Text>
            {data.map((item) => (
              <View key={item.category} style={pdfStyles.categoryItem}>
                <Text style={pdfStyles.categoryName}>{getCategoryLabel(item.category)}</Text>
                <Text style={pdfStyles.categoryValue}>{item.count}회</Text>
                <Text style={pdfStyles.categoryValue}>{(item.duration / 60).toFixed(1)}시간</Text>
                <Text style={pdfStyles.categoryValue}>{item.percentage}%</Text>
              </View>
            ))}
      </View>
    </Page>
  </Document>
);
};

async function getProfileId(request: Request): Promise<string> {
  const { client } = makeSSRClient(request);
  const { data } = await client.auth.getUser();
  if (!data?.user) throw new Error("User not authenticated");
  return data.user.id;
}

export const loader = async ({ request }: LoaderFunctionArgs): Promise<SummaryPageLoaderData> => {
  const profileId = await getProfileId(request);
  const url = new URL(request.url);
  const monthParam = url.searchParams.get("month") || DateTime.now().toFormat("yyyy-MM");
  const selectedMonthStart = DateTime.fromFormat(monthParam, "yyyy-MM").startOf("month");
  const selectedMonthEnd = selectedMonthStart.endOf("month");
  const prevMonthStart = selectedMonthStart.minus({ months: 1 });
  const prevMonthEnd = prevMonthStart.endOf("month");
  
  const { client } = makeSSRClient(request);

  const [
      cachedStats,
      userCategoriesData,
      userDefaultCodePreferencesData,
      timeOfDayDistribution,
      subcodeDistribution,
      prevMonthCategoryDistribution,
      currentMonthGoalStats,
      prevMonthGoalStats,
  ] = await Promise.all([
    statsQueries.getStatsCache(client, { profileId, monthDate: monthParam }),
    settingsQueries.getUserCategories(client, { profileId }),
    settingsQueries.getUserDefaultCodePreferences(client, { profileId }),
    statsQueries.calculateTimeOfDayDistribution(client, {
        profileId,
        startDate: selectedMonthStart.toISODate()!,
        endDate: selectedMonthEnd.toISODate()!,
    }),
    statsQueries.calculateSubcodeDistribution(client, {
        profileId,
        startDate: selectedMonthStart.toISODate()!,
        endDate: selectedMonthEnd.toISODate()!,
    }),
    statsQueries.calculateCategoryDistribution(client, {
        profileId,
        startDate: prevMonthStart.toISODate()!,
        endDate: prevMonthEnd.toISODate()!,
    }),
    statsQueries.calculateGoalCompletionStats(client, {
        profileId,
        startDate: selectedMonthStart.toISODate()!,
        endDate: selectedMonthEnd.toISODate()!,
    }),
    statsQueries.calculateGoalCompletionStats(client, {
        profileId,
        startDate: prevMonthStart.toISODate()!,
        endDate: prevMonthEnd.toISODate()!,
    }),
  ]);

  let categoryDistribution: CategoryDistribution[];

  if (cachedStats?.category_distribution) {
    categoryDistribution = cachedStats.category_distribution;
  } else {
    categoryDistribution = await statsQueries.calculateCategoryDistribution(client, {
        profileId,
        startDate: selectedMonthStart.toISODate()!,
        endDate: selectedMonthEnd.toISODate()!,
    });
    // Note: insights are not cached for now, they are calculated on each load.
    await statsQueries.upsertStatsCache(client, {
      profileId,
      monthDate: monthParam,
      stats: { category_distribution: categoryDistribution },
    });
  }

  // For stats, we want to show all categories that have data, regardless of their active status.
  const processedCategories: UICategory[] = [];
  
  // Start with default categories
  for (const catCodeKey in CATEGORIES) {
    if (Object.prototype.hasOwnProperty.call(CATEGORIES, catCodeKey)) {
      const baseCategory = CATEGORIES[catCodeKey as CategoryCode];
      processedCategories.push({ ...baseCategory, isCustom: false, isActive: true, sort_order: baseCategory.sort_order || 999 });
    }
  }

  // Override with user's custom categories
  (userCategoriesData || []).forEach(userCat => {
    const existingIndex = processedCategories.findIndex(c => c.code === userCat.code && !c.isCustom);
    if (existingIndex !== -1) {
      // If user has a category that's also a default one, remove the default one
      processedCategories.splice(existingIndex, 1);
    }
    // Add the user category (custom or customized default)
    processedCategories.push({
      code: userCat.code as CategoryCode, 
      label: userCat.label, 
      icon: userCat.icon || '📝',
      color: userCat.color || undefined, 
      isCustom: true, 
      isActive: userCat.is_active, // Keep the original active status for potential UI cues
      hasDuration: true, 
      sort_order: userCat.sort_order ?? 1000,
    });
  });
  
  processedCategories.sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));

  return {
    profileId,
    selectedMonthISO: monthParam,
    categoryDistribution,
    subcodeDistribution,
    categories: processedCategories,
    timeOfDayDistribution,
    prevMonthCategoryDistribution,
    currentMonthGoalStats,
    prevMonthGoalStats,
  };
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const pageData = data as SummaryPageLoaderData | undefined;
  const monthName = pageData?.selectedMonthISO ? DateTime.fromFormat(pageData.selectedMonthISO, "yyyy-MM").toFormat("MMMM yyyy") : "Stats";
  return [
    { title: `월간 요약 ${monthName} - StartBeyond` },
    { name: "description", content: `${monthName} 활동 요약입니다.` },
  ];
};

export default function SummaryStatsPage() {
  const { 
      selectedMonthISO, 
      categoryDistribution, 
      subcodeDistribution, 
      categories, 
      timeOfDayDistribution,
      prevMonthCategoryDistribution,
      currentMonthGoalStats,
      prevMonthGoalStats,
  } = useLoaderData<typeof loader>();
  
  const [shareSettings, setShareSettings] = useState<CustomShareSettings>(initialCustomShareSettings);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const currentMonth = DateTime.fromFormat(selectedMonthISO, "yyyy-MM");
  const prevMonthISO = currentMonth.minus({ months: 1 }).toFormat("yyyy-MM");
  const nextMonthISO = currentMonth.plus({ months: 1 }).toFormat("yyyy-MM");
  const monthNameForPdf = currentMonth.toFormat("yyyy년 M월");

  const totalRecords = categoryDistribution.reduce((sum, cat) => sum + cat.count, 0);
  const totalDurationMinutes = categoryDistribution.reduce((sum, cat) => sum + cat.duration, 0);
  const totalDurationHours = (totalDurationMinutes / 60).toFixed(1);
  
  const prevMonthTotalRecords = prevMonthCategoryDistribution.reduce((sum, cat) => sum + cat.count, 0);
  const prevMonthTotalDurationMinutes = prevMonthCategoryDistribution.reduce((sum, cat) => sum + cat.duration, 0);
  
  function getPercentageChange(current: number, previous: number): string {
    if (previous === 0) {
      return current > 0 ? "새 활동" : "변화 없음";
    }
    const change = ((current - previous) / previous) * 100;
    if (Math.abs(change) < 0.1) return "변화 없음";
    if (change > 0) return `+${change.toFixed(0)}%`;
    return `${change.toFixed(0)}%`;
  }

  const recordsChangeText = getPercentageChange(totalRecords, prevMonthTotalRecords);
  const durationChangeText = getPercentageChange(totalDurationMinutes, prevMonthTotalDurationMinutes);
  const goalRateChangeText = getPercentageChange(currentMonthGoalStats.completionRate, prevMonthGoalStats.completionRate);

  const mostActiveCategory = useMemo(() => {
    if (categoryDistribution.length === 0) return null;
    return [...categoryDistribution].sort((a, b) => b.duration - a.duration)[0];
  }, [categoryDistribution]);

  const mostActiveCategoryLabel = mostActiveCategory 
    ? (categories.find(c => c.code === mostActiveCategory.category)?.label || mostActiveCategory.category)
    : "-";
  
  const mostActiveCategoryPercentage = mostActiveCategory && totalDurationMinutes > 0
    ? ((mostActiveCategory.duration / totalDurationMinutes) * 100).toFixed(0)
    : 0;

  function handleShareSettingsChange(key: keyof CustomShareSettings, value: boolean) {
    setShareSettings(prev => ({ ...prev, [key]: value }));
  }

  function handleCopyLink() {
    const mockLink = "https://startbeyond.com/share/summary/" + selectedMonthISO;
    navigator.clipboard.writeText(mockLink);
    // toast.success("링크가 복사되었습니다"); // Assuming sonner is available
    alert("링크가 복사되었습니다!"); // Fallback if toast is not set up
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  const pdfDocument = <SummaryReportPDF data={categoryDistribution} categories={categories} month={monthNameForPdf} />;

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
        title="월간 요약"
        description="이 페이지는 무료 플랜 사용자에게 제공되는 기본 통계 요약입니다."
        shareSettings={shareSettings as any} // Cast for simplicity with generic StatsPageHeader
        onShareSettingsChange={handleShareSettingsChange as any}
        isShareDialogOpen={isShareDialogOpen}
        setIsShareDialogOpen={setIsShareDialogOpen}
        isCopied={isCopied}
        onCopyLink={handleCopyLink}
        shareLink={`https://startbeyond.com/share/summary/${selectedMonthISO}`}
        pdfDocument={pdfDocument}
        pdfFileName={`summary-report-${selectedMonthISO}.pdf`}
        periodButton={periodControl}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 기록 수</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords}회</div>
            <p className="text-xs text-muted-foreground">지난 달 대비 {recordsChangeText}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 활동 시간</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDurationHours}시간</div>
            <p className="text-xs text-muted-foreground">지난 달 대비 {durationChangeText}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">목표 달성률</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonthGoalStats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
                지난 달 대비 {goalRateChangeText}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">가장 많은 활동</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mostActiveCategoryLabel}</div>
            <p className="text-xs text-muted-foreground">총 시간의 {mostActiveCategoryPercentage}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>카테고리별 분포</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
          {categoryDistribution && categoryDistribution.length > 0 ? (
              <CategoryDistributionChart data={categoryDistribution} categories={categories} selectedMonthISO={selectedMonthISO} />
          ) : (
              <p className="text-center text-muted-foreground pt-12">이번 달 활동 데이터가 없습니다.</p>
          )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
          <CardTitle>세부코드별 분포 (상위 15개)</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
          {subcodeDistribution && subcodeDistribution.length > 0 ? (
              <SubcodeDistributionChart data={subcodeDistribution} categories={categories} />
          ) : (
              <p className="text-center text-muted-foreground pt-12">세부코드 기록이 없습니다.</p>
          )}
        </CardContent>
       </Card>
      </div>

       <Card className="mt-4">
        <CardHeader>
            <CardTitle>월간 요약</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-sm text-muted-foreground space-y-2">
                <p>이번 달 가장 많이 언급된 키워드: 운동, 독서, 명상 (기능 구현 예정)</p>
                <p>주요 성취: 러닝 100km 달성, 독서 5권 완료 (기능 구현 예정)</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
