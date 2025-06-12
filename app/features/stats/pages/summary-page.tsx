// app/features/stats/pages/summary-page.tsx
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
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
import type { CategoryDistribution, TimeOfDayDistribution, SubcodeDistribution, SummaryInsights } from "../types";
import { StatsPageHeader } from "~/common/components/stats/stats-page-header";
import { SubcodeDistributionChart } from "~/common/components/stats/subcode-distribution-chart";
import { CategoryDistributionList } from "../components/CategoryDistributionList";
import { SubcodeDistributionList } from "../components/SubcodeDistributionList";
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
    month,
    t
}: { 
    data: CategoryDistribution[], 
    categories: UICategory[], 
    month: string,
    t: (key: string, options?: any) => string;
}) => {
    const getCategoryLabel = (code: CategoryCode) => categories.find(c => c.code === code)?.label || code;
    const totalRecords = data.reduce((sum, cat) => sum + cat.count, 0);
    const totalDurationMinutes = data.reduce((sum, cat) => sum + cat.duration, 0);

    return (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <View style={pdfStyles.header}>
            <Text style={pdfStyles.title}>{t('stats_summary_page.pdf_report_title')}</Text>
            <Text style={pdfStyles.date}>{t('stats_summary_page.pdf_date', { month })}</Text>
          </View>
          
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>{t('stats_summary_page.pdf_total_summary_title')}</Text>
            <Text style={pdfStyles.summaryText}>{t('stats_summary_page.pdf_total_records', { count: totalRecords })}</Text>
            <Text style={pdfStyles.summaryText}>{t('stats_summary_page.pdf_total_duration', { hours: (totalDurationMinutes / 60).toFixed(1), minutes: totalDurationMinutes })}</Text>
      </View>
    
      <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>{t('stats_summary_page.pdf_category_distribution_title')}</Text>
            {data.map((item) => (
              <View key={item.category} style={pdfStyles.categoryItem}>
                <Text style={pdfStyles.categoryName}>{getCategoryLabel(item.category)}</Text>
                <Text style={pdfStyles.categoryValue}>{item.count}{t('category_distribution_list.count_unit')}</Text>
                <Text style={pdfStyles.categoryValue}>{(item.duration / 60).toFixed(1)}{t('category_distribution_list.time_unit_hours')}</Text>
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
      summaryInsights,
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
    statsQueries.calculateSummaryInsights(client, {
        profileId,
        startDate: selectedMonthStart.toISODate()!,
        endDate: selectedMonthEnd.toISODate()!,
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

  const categoryDistributionWithPercentage = (() => {
    if (!categoryDistribution || categoryDistribution.length === 0) return [];
    const totalDuration = categoryDistribution.reduce((sum, item) => sum + item.duration, 0);
    if (totalDuration === 0) return categoryDistribution.map(item => ({ ...item, percentage: 0 }));
    return categoryDistribution.map(item => ({
        ...item,
        percentage: Math.round((item.duration / totalDuration) * 100)
    }));
  })();

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
    categoryDistribution: categoryDistributionWithPercentage,
    subcodeDistribution,
    categories: processedCategories,
    timeOfDayDistribution,
    prevMonthCategoryDistribution,
    currentMonthGoalStats,
    prevMonthGoalStats,
    summaryInsights,
  };
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const pageData = data as SummaryPageLoaderData | undefined;
  const monthName = pageData?.selectedMonthISO ? DateTime.fromFormat(pageData.selectedMonthISO, "yyyy-MM").toFormat("MMMM yyyy") : "Stats";
  // Translation in meta function is tricky. For now, keeping it static Korean.
  // A better approach would involve passing locale from the loader.
  return [
    { title: `월간 요약 ${monthName} - StartBeyond` },
    { name: "description", content: `${monthName} 활동 요약입니다.` },
  ];
};

export default function SummaryStatsPage() {
  const { t, i18n } = useTranslation();
  const { 
      selectedMonthISO, 
      categoryDistribution, 
      subcodeDistribution, 
      categories, 
      timeOfDayDistribution,
      prevMonthCategoryDistribution,
      currentMonthGoalStats,
      prevMonthGoalStats,
      summaryInsights,
  } = useLoaderData<typeof loader>();
  
  const [shareSettings, setShareSettings] = useState<CustomShareSettings>(initialCustomShareSettings);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const currentMonth = DateTime.fromFormat(selectedMonthISO, "yyyy-MM");
  const prevMonthISO = currentMonth.minus({ months: 1 }).toFormat("yyyy-MM");
  const nextMonthISO = currentMonth.plus({ months: 1 }).toFormat("yyyy-MM");
  const monthNameForDisplay = i18n.language === 'ko' ? currentMonth.toFormat("yyyy년 M월") : currentMonth.toFormat("MMMM yyyy");

  const totalRecords = categoryDistribution.reduce((sum, cat) => sum + cat.count, 0);
  const totalDurationMinutes = categoryDistribution.reduce((sum, cat) => sum + cat.duration, 0);
  const totalDurationHours = (totalDurationMinutes / 60).toFixed(1);
  
  const prevMonthTotalRecords = prevMonthCategoryDistribution.reduce((sum, cat) => sum + cat.count, 0);
  const prevMonthTotalDurationMinutes = prevMonthCategoryDistribution.reduce((sum, cat) => sum + cat.duration, 0);
  
  function getPercentageChange(current: number, previous: number): string {
    if (previous === 0) {
      return current > 0 ? t('stats_summary_page.vs_last_month_new') : t('stats_summary_page.vs_last_month_no_change');
    }
    const change = ((current - previous) / previous) * 100;
    if (Math.abs(change) < 0.1) return t('stats_summary_page.vs_last_month_no_change');
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
    const url = `https://startbeyond.com/share/summary/${selectedMonthISO}`;
    navigator.clipboard.writeText(url).then(() => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    });
  }

  const pdfDocument = <SummaryReportPDF data={categoryDistribution} categories={categories} month={monthNameForDisplay} t={t} />;

  const periodControl = (
    <div className="flex items-center gap-1">
        <Button asChild variant="outline" size="icon">
            <Link to={`?month=${prevMonthISO}`} preventScrollReset>
            <ChevronLeft className="h-4 w-4" />
            </Link>
        </Button>
        <span className="text-lg font-medium w-32 text-center">
            {monthNameForDisplay}
        </span>
        <Button asChild variant="outline" size="icon">
            <Link to={`?month=${nextMonthISO}`} preventScrollReset>
            <ChevronRight className="h-4 w-4" />
            </Link>
        </Button>
    </div>
  );

  if (!i18n.isInitialized) {
    return null; // or a loading spinner
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 pt-8 sm:pt-12 md:pt-16 bg-background min-h-screen">
      <StatsPageHeader
        title={t('stats_summary_page.page_title')}
        description={t('stats_summary_page.page_description_free')}
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
            <CardTitle className="text-sm font-medium">{t('stats_summary_page.total_records')}</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords}{t('category_distribution_list.count_unit')}</div>
            <p className="text-xs text-muted-foreground">{t('stats_summary_page.vs_last_month')} {recordsChangeText}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats_summary_page.total_hours')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDurationHours}{t('category_distribution_list.time_unit_hours')}</div>
            <p className="text-xs text-muted-foreground">{t('stats_summary_page.vs_last_month')} {durationChangeText}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats_summary_page.goal_achievement_rate')}</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonthGoalStats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
                {t('stats_summary_page.vs_last_month')} {goalRateChangeText}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats_summary_page.most_active_category_title')}</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mostActiveCategoryLabel}</div>
            <p className="text-xs text-muted-foreground">{t('stats_summary_page.most_active_category_desc', { percentage: mostActiveCategoryPercentage })}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('stats_summary_page.category_distribution')}</CardTitle>
          </CardHeader>
          <CardContent>
          {categoryDistribution && categoryDistribution.length > 0 ? (
              <CategoryDistributionList data={categoryDistribution} categories={categories} />
          ) : (
              <p className="text-center text-muted-foreground pt-12">{t('stats_summary_page.no_data')}</p>
          )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
          <CardTitle>{t('stats_summary_page.subcode_distribution_title')}</CardTitle>
          </CardHeader>
          <CardContent>
          {subcodeDistribution && subcodeDistribution.length > 0 ? (
              <SubcodeDistributionList data={subcodeDistribution} categories={categories} />
          ) : (
              <p className="text-center text-muted-foreground pt-12">{t('subcode_distribution_list.no_data')}</p>
          )}
        </CardContent>
       </Card>
      </div>

       <Card className="mt-4">
        <CardHeader>
            <CardTitle>{t('stats_summary_page.monthly_summary_title')}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-sm text-muted-foreground space-y-2">
                {summaryInsights?.mostActiveWeekday ? (
                    <p dangerouslySetInnerHTML={{ __html: t('stats_summary_page.most_active_weekday', { day: summaryInsights.mostActiveWeekday.day, count: summaryInsights.mostActiveWeekday.count }) }} />
                ) : (
                    <p>{t('stats_summary_page.not_enough_data')}</p>
                )}
                {summaryInsights && (
                    <p dangerouslySetInnerHTML={{ __html: t('stats_summary_page.weekday_vs_weekend', { weekday: summaryInsights.weekdayVsWeekend.weekday, weekend: summaryInsights.weekdayVsWeekend.weekend }) }} />
                )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
