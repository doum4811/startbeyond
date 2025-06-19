// app/features/stats/pages/summary-page.tsx
import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Button } from "~/common/components/ui/button";
import { Calendar as CalendarIcon, Share2, Copy, Check, ChevronLeft, ChevronRight, Download, BarChart2, Calendar, Sun, Moon, Clock, CheckSquare } from "lucide-react";
import { DateTime } from "luxon";
import { CategoryDistributionChart } from "~/common/components/stats/category-distribution-chart";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { LoaderFunctionArgs, MetaFunction, ActionFunctionArgs } from "react-router";
import { Link, useLoaderData, useFetcher } from "react-router";
import * as statsQueries from "../queries";
import * as settingsQueries from "~/features/settings/queries";
import type { CategoryCode, UICategory } from "~/common/types/daily";
import { CATEGORIES } from "~/common/types/daily";
import { makeSSRClient } from "~/supa-client";
import type { 
  CategoryDistribution, 
  TimeOfDayDistribution, 
  SubcodeDistribution, 
  SummaryInsights, 
  SharedLink,
  GoalCompletionStats,
  SharedLinkInsert
} from "../types";
import { StatsPageHeader } from "~/common/components/stats/stats-page-header";
import { SubcodeDistributionChart } from "~/common/components/stats/subcode-distribution-chart";
import { CategoryDistributionList } from "../components/CategoryDistributionList";
import { SubcodeDistributionList } from "../components/SubcodeDistributionList";
import type { SummaryPageLoaderData } from '../types';
import i18next from "i18next";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '~/common/components/ui/select';
import { getRequiredProfileId } from '~/features/users/utils';

Font.register({
  family: "Noto Sans KR",
  fonts: [
    { src: "/fonts/NotoSansKR-Variable.ttf" }, // All weights in one file
  ],
});
Font.register({
    family: "Source Sans 3",
    fonts: [
        { src: "/fonts/SourceSans3-Variable.ttf" },
        { src: "/fonts/SourceSans3-Italic-Variable.ttf", fontStyle: 'italic' },
    ]
});

interface CustomShareSettings {
  is_public: boolean;
  allow_export: boolean;
  include_summary: boolean;
  include_subcode_distribution: boolean;
}

const initialCustomShareSettings: CustomShareSettings = {
  is_public: false,
  allow_export: false,
  include_summary: true,
  include_subcode_distribution: true,
};

const pdfStyles = StyleSheet.create({
  page: { 
    paddingTop: 35,
    paddingBottom: 50, // Increased padding for footer
    paddingHorizontal: 35,
    fontFamily: "Noto Sans KR", 
    fontWeight: 400,
  },
  header: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10, textAlign: 'center' },
  title: { fontSize: 22, marginBottom: 5, fontFamily: 'Noto Sans KR', fontWeight: 700 },
  date: { fontSize: 12, color: "#555", fontFamily: 'Noto Sans KR' },
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
  categoryName: { width: '40%', fontWeight: 500 },
  categoryValue: { width: '20%', textAlign: 'right' },
  subcodeSection: { marginTop: 10, paddingLeft: 15 },
  subcodeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9,
    marginBottom: 3,
  },
  subcodeName: { width: '50%' },
  subcodeValue: { width: '25%', textAlign: 'right' },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 35,
    right: 35,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
    fontSize: 9,
    color: 'grey',
  },
});

const SummaryReportPDF = ({ 
    data, 
    subcodeData,
    categories, 
    month,
    t
}: { 
    data: CategoryDistribution[], 
    subcodeData: SubcodeDistribution[],
    categories: UICategory[], 
    month: string,
    t: (key: string, options?: any) => string;
}) => {
    const getCategoryLabel = (code: CategoryCode) => categories.find(c => c.code === code)?.label || code;
    const totalRecords = data.reduce((sum, cat) => sum + cat.count, 0);
    const totalDurationMinutes = data.reduce((sum, cat) => sum + cat.duration, 0);
    
    const subcodesByCategory = useMemo(() => {
        return subcodeData.reduce((acc, item) => {
            const category = categories.find(c => c.code === item.category);
            if (category) {
                if (!acc[item.category]) {
                    acc[item.category] = {
                        label: category.label,
                        subcodes: []
                    };
                }
                acc[item.category].subcodes.push(item);
            }
            return acc;
        }, {} as Record<CategoryCode, { label: string; subcodes: SubcodeDistribution[] }>);
    }, [subcodeData, categories]);

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

      {subcodeData && subcodeData.length > 0 && (
          <View style={pdfStyles.section}>
              <Text style={pdfStyles.sectionTitle}>{t('stats_summary_page.subcode_distribution_title')}</Text>
              {Object.keys(subcodesByCategory).map(categoryCode => (
                  <View key={categoryCode} style={{ marginBottom: 8 }}>
                      <Text style={pdfStyles.categoryName}>{subcodesByCategory[categoryCode as CategoryCode].label}</Text>
                      <View style={pdfStyles.subcodeSection}>
                          {subcodesByCategory[categoryCode as CategoryCode].subcodes.map(subcode => (
                              <View key={subcode.subcode} style={pdfStyles.subcodeItem}>
                                  <Text style={pdfStyles.subcodeName}>{subcode.subcode}</Text>
                                  <Text style={pdfStyles.subcodeValue}>{subcode.count}회</Text>
                                  <Text style={pdfStyles.subcodeValue}>{(subcode.duration / 60).toFixed(1)}시간</Text>
                              </View>
                          ))}
                      </View>
                  </View>
              ))}
          </View>
      )}
       <View style={pdfStyles.footer} fixed>
          <Text>StartBeyond</Text>
      </View>
    </Page>
  </Document>
);
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const { client } = makeSSRClient(request);
    const profileId = await getRequiredProfileId(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === 'upsertShareSettings') {
        try {
            const page_type = 'summary';
            const period = formData.get('period') as string;

            if (!page_type || !period) {
                return { ok: false, error: 'Page type and period are required.' };
            }

            const settings: { [key: string]: any } = {};
            for (const [key, value] of formData.entries()) {
                if (key !== 'is_public' && key !== 'period' && key !== 'intent' && key !== 'page_type') {
                    settings[key] = value === 'true';
                }
            }
            
            const sharedLinkData: SharedLinkInsert = {
                profile_id: profileId,
                page_type: 'summary',
                period,
                is_public: formData.get('is_public') === 'true',
                settings,
            };

            const result = await statsQueries.upsertSharedLink(client, { sharedLinkData: sharedLinkData as SharedLinkInsert & { token: string } });
            return { ok: true, sharedLink: result };
        } catch (error: any) {
            console.error("Error upserting share settings:", error);
            return { ok: false, error: error.message };
        }
    }
    return { ok: false, error: 'Unknown intent' };
};

export const loader = async ({ request }: LoaderFunctionArgs): Promise<SummaryPageLoaderData> => {
  const { client } = makeSSRClient(request);
  const profileId = await getRequiredProfileId(request);

  const url = new URL(request.url);
  const monthParam = url.searchParams.get("month");
  
  let selectedMonthStart: DateTime;
  if (monthParam) {
    selectedMonthStart = DateTime.fromISO(`${monthParam}-01`).startOf("month");
    if (!selectedMonthStart.isValid) {
      // Fallback to current month if param is invalid
      selectedMonthStart = DateTime.now().startOf("month");
    }
  } else {
    selectedMonthStart = DateTime.now().startOf("month");
  }

  const monthForDb = selectedMonthStart.toFormat("yyyy-MM");
  const selectedMonthEnd = selectedMonthStart.endOf("month");
  const prevMonthStart = selectedMonthStart.minus({ months: 1 });
  const prevMonthEnd = prevMonthStart.endOf("month");
  
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
      sharedLink,
  ] = await Promise.all([
    statsQueries.getStatsCache(client, { profileId, monthDate: monthForDb }),
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
    statsQueries.getSharedLink(client, { profileId, pageType: 'summary', period: monthForDb })
  ]);

  let categoryDistribution: CategoryDistribution[] = cachedStats?.category_distribution || [];

  if (!cachedStats?.category_distribution) {
    const calculatedDist = await statsQueries.calculateCategoryDistribution(client, {
        profileId,
        startDate: selectedMonthStart.toISODate()!,
        endDate: selectedMonthEnd.toISODate()!,
    });
    // Only attempt to upsert if there's actually data to cache.
    if (calculatedDist && calculatedDist.length > 0) {
      await statsQueries.upsertStatsCache(client, {
        profileId,
        monthDate: monthForDb,
        stats: { category_distribution: calculatedDist },
      });
    }
    categoryDistribution = calculatedDist;
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
    selectedMonthISO: monthForDb,
    categoryDistribution: categoryDistributionWithPercentage || [],
    subcodeDistribution: subcodeDistribution || [],
    categories: processedCategories,
    timeOfDayDistribution: timeOfDayDistribution || [],
    prevMonthCategoryDistribution: (prevMonthCategoryDistribution || []).map(item => ({
      category_code: item.category,
      count: item.count,
      duration: item.duration,
    })),
    currentMonthGoalStats: currentMonthGoalStats || { totalPlans: 0, completedPlans: 0, completionRate: 0, total_goals: 0, completed_goals: 0 },
    prevMonthGoalStats: prevMonthGoalStats || { totalPlans: 0, completedPlans: 0, completionRate: 0, total_goals: 0, completed_goals: 0 },
    summaryInsights: summaryInsights || { mostActiveWeekday: null, weekdayVsWeekend: { weekday: 0, weekend: 0 }, most_active_category: null, longest_duration_category: null, most_active_time_slot: null },
    locale: i18next.language,
    sharedLink: sharedLink as SharedLink | null,
  };
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const pageData = data as SummaryPageLoaderData | undefined;
  if (!pageData) return [];
  
  const currentMonth = DateTime.fromFormat(pageData.selectedMonthISO, "yyyy-MM").setLocale(pageData.locale);
  const monthName = pageData.locale === 'ko' ? currentMonth.toFormat("yyyy년 M월") : currentMonth.toFormat("MMMM yyyy");
  const title = pageData.locale === 'ko' ? `월간 요약 ${monthName} - StartBeyond` : `Monthly Summary ${monthName} - StartBeyond`;
  const description = pageData.locale === 'ko' ? `${monthName} 활동 요약입니다.` : `Activity summary for ${monthName}.`;

  return [
    { title },
    { name: "description", content: description },
  ];
};

export default function SummaryStatsPage() {
  const { t, i18n } = useTranslation();
  const fetcher = useFetcher<typeof action>();
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
      sharedLink: initialSharedLink,
  } = useLoaderData<SummaryPageLoaderData>();
  
  const [sharedLink, setSharedLink] = useState<SharedLink | null>(initialSharedLink);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const currentMonth = DateTime.fromFormat(selectedMonthISO, "yyyy-MM").setLocale(i18n.language);
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

  useEffect(() => {
    setSharedLink(initialSharedLink);
    // When the month (and thus the initialSharedLink) changes,
    // close the share dialog and reset the copy status.
    setIsShareDialogOpen(false);
    setIsCopied(false);
  }, [selectedMonthISO, initialSharedLink]);

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.ok && fetcher.data.sharedLink) {
        setSharedLink(fetcher.data.sharedLink);
    }
  }, [fetcher.state, fetcher.data]);

  function handleSettingsChange(newSettings: Partial<SharedLink>) {
    const formData = new FormData();
    formData.append('intent', 'upsertShareSettings');
    formData.append('page_type', 'summary');
    formData.append('period', selectedMonthISO);
    
    if (newSettings.is_public !== undefined) {
      formData.append('is_public', String(newSettings.is_public));
    }
    
    const settings = newSettings.settings as { [key: string]: any } | undefined;
    if (settings) {
        Object.entries(settings).forEach(([key, value]) => {
            formData.append(key, String(value));
        });
    }

    fetcher.submit(formData, { method: "post" });
  }

  function handleCopyLink() {
    if (typeof window === 'undefined' || !sharedLink?.token) return;
    const url = `${window.location.origin}/share/${sharedLink.token}`;
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }

  const pdfDocument = <SummaryReportPDF data={categoryDistribution} subcodeData={subcodeDistribution} categories={categories} month={monthNameForDisplay} t={t} />;

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

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const pdfButton = isClient ? (
    <PDFDownloadLink
      key={selectedMonthISO}
      document={pdfDocument}
      fileName={`summary-report-${selectedMonthISO}.pdf`}
    >
      {({ loading }) => (
        <Button variant="outline" size="sm" disabled={loading} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          {loading ? t("stats_header.pdf.loading") : t("stats_header.pdf.download")}
        </Button>
      )}
    </PDFDownloadLink>
  ) : null;

  if (!i18n.isInitialized) {
    return null; // or a loading spinner
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-background min-h-screen">
      <div className="mb-4">
        <StatsPageHeader
          title={t('stats_summary_page.page_title')}
          description={t('stats_summary_page.page_description_free')}
          shareSettings={sharedLink || { page_type: 'summary', period: selectedMonthISO, is_public: false, settings: { include_summary: true, include_subcode_distribution: true } }}
          onSettingsChange={handleSettingsChange}
          isShareDialogOpen={isShareDialogOpen}
          setIsShareDialogOpen={setIsShareDialogOpen}
          isCopied={isCopied}
          onCopyLink={handleCopyLink}
          shareLink={sharedLink?.is_public && sharedLink?.token ? (typeof window !== 'undefined' ? `${window.location.origin}/share/${sharedLink.token}` : `/share/${sharedLink.token}`) : undefined}
          periodButton={periodControl}
          pdfButton={pdfButton}
          fetcherState={fetcher.state}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("stats_summary_page.category_distribution_title")}</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px] overflow-y-auto">
            {categoryDistribution.length > 0 ? (
                <CategoryDistributionList data={categoryDistribution} categories={categories} />
            ) : (
                <p className="text-muted-foreground text-center pt-16">{t("stats_summary_page.no_data")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("stats_summary_page.subcode_distribution_title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {subcodeDistribution.length > 0 ? (
                <SubcodeDistributionList data={subcodeDistribution} categories={categories} />
            ) : (
                <p className="text-muted-foreground text-center pt-16">{t("stats_summary_page.no_data")}</p>
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
