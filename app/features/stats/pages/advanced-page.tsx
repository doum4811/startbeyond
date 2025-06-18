// app/features/stats/pages/advanced-page.tsx
import React, { useState } from "react";
import { type LoaderFunctionArgs, type MetaFunction, useNavigate } from "react-router";
import { DateTime } from "luxon";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { StatsPageHeader } from "~/common/components/stats/stats-page-header";
import { CategoryHeatmapGrid } from "~/common/components/stats/category-heatmap-grid";
import { CategoryDistributionChart } from "~/common/components/stats/category-distribution-chart";
import { makeSSRClient } from "~/supa-client";
import { getUserCategories } from "~/features/settings/queries";
import * as statsQueries from "~/features/stats/queries";
import type { AdvancedPageLoaderData, HeatmapData, ActivityHeatmap as ActivityHeatmapType } from "~/features/stats/types";
import type { CategoryCode, UICategory } from "~/common/types/daily";
import { CATEGORIES as DEFAULT_CATEGORIES } from "~/common/types/daily";
import { useTranslation } from "react-i18next";
import { ComparisonCard } from "~/features/stats/components/ComparisonCard";
import { getRequiredProfileId } from "~/features/users/utils";
import { Button } from "~/common/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Mock Categories (fallback if DB fetch fails)
const MOCK_UI_CATEGORIES: UICategory[] = Object.values(DEFAULT_CATEGORIES).map(cat => ({
  ...cat,
  isCustom: false,
  isActive: true,
  sort_order: cat.sort_order || 999,
  hasDuration: true,
}));

export const loader = async ({ request }: LoaderFunctionArgs): Promise<AdvancedPageLoaderData> => {
  const { client } = makeSSRClient(request);
  const profileId = await getRequiredProfileId(request);
  const url = new URL(request.url);
  const yearParam = url.searchParams.get("year");
  const currentYear = yearParam ? parseInt(yearParam, 10) : DateTime.now().year;

  let uiCategories: UICategory[] = [];
  try {
    const dbUserCategories = await getUserCategories(client, { profileId });

    const finalCategories: UICategory[] = [];
    const defaultCategoriesMap = new Map(Object.values(DEFAULT_CATEGORIES).map((value) => [value.code, { ...value, isCustom: false, isActive: true, color: null }]));
    const userCategoriesMap = new Map(dbUserCategories.map(c => [c.code, c]));

    defaultCategoriesMap.forEach((defaultCat, code) => {
      const userOverride = userCategoriesMap.get(code as CategoryCode);
      if (userOverride) {
        finalCategories.push({
          ...defaultCat,
          label: userOverride.label || defaultCat.label,
          icon: userOverride.icon || defaultCat.icon,
          color: userOverride.color || defaultCat.color,
          isCustom: true,
          isActive: userOverride.is_active,
          sort_order: userOverride.sort_order ?? defaultCat.sort_order,
          hasDuration: true,
        });
        userCategoriesMap.delete(code as CategoryCode);
      } else {
        finalCategories.push({
          ...defaultCat,
          hasDuration: true,
        });
      }
    });

    userCategoriesMap.forEach(userCat => {
      finalCategories.push({
        code: userCat.code as CategoryCode,
        label: userCat.label,
        icon: userCat.icon || '📝',
        color: userCat.color,
        isCustom: true,
        isActive: userCat.is_active,
        hasDuration: true,
        sort_order: userCat.sort_order ?? 1000,
      });
    });

    uiCategories = finalCategories.sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
  } catch (error) {
    console.error("Error fetching categories in advanced-page loader:", error);
    uiCategories = MOCK_UI_CATEGORIES;
  }
  
  const activeCategories = uiCategories.filter(c => c.isActive);
  const activeCategoryCodes = activeCategories.map(c => c.code as CategoryCode);
  
  const yearlyCategoryHeatmapData = Object.fromEntries(
    activeCategoryCodes.map(code => [code, [] as HeatmapData[]])
  ) as Record<CategoryCode, HeatmapData[]>;

  let comparisonStats = {
      monthly: { time: { current: 0, prev: 0 }, records: { current: 0, prev: 0 } },
      weekly: { time: { current: 0, prev: 0 }, records: { current: 0, prev: 0 } },
  };

  const startDate = DateTime.fromObject({ year: currentYear }).startOf('year').toISODate()!;
  const endDate = DateTime.fromObject({ year: currentYear }).endOf('year').toISODate()!;
  
  const [yearlyActivity, fetchedComparisonStats] = await Promise.all([
      statsQueries.calculateActivityHeatmap(client, { profileId, startDate, endDate }),
      statsQueries.getComparisonStats(client, { profileId })
  ]);
  
  comparisonStats = fetchedComparisonStats;

  const activityByDate: { [date: string]: ActivityHeatmapType } = {};
  for (const day of yearlyActivity) {
      activityByDate[day.date] = day;
  }

  let maxCategoryIntensity = 1;
  for (const day of yearlyActivity) {
    for (const catCode of Object.keys(day.categories) as CategoryCode[]) {
      if (day.categories[catCode] > maxCategoryIntensity) {
        maxCategoryIntensity = day.categories[catCode];
      }
    }
  }
  
  for (const code of activeCategoryCodes) {
      const categoryYearlyData: HeatmapData[] = [];
      let currentDate = DateTime.fromObject({ year: currentYear }).startOf('year');
      
      while (currentDate.year === currentYear) {
          const dateStr = currentDate.toISODate()!;
          const dayData = activityByDate[dateStr];
          const categoryCount = dayData?.categories[code] || 0;
          
          categoryYearlyData.push({
              date: dateStr,
              intensity: categoryCount / maxCategoryIntensity,
              categories: { [code]: categoryCount } as Record<CategoryCode, number>,
              total: categoryCount,
          });
          currentDate = currentDate.plus({ days: 1 });
      }
      yearlyCategoryHeatmapData[code] = categoryYearlyData;
  }

  const usedCategoryCodes = new Set(Object.keys(yearlyCategoryHeatmapData).filter(code => 
    yearlyCategoryHeatmapData[code as CategoryCode].some(day => day.total > 0)
  ));

  const categoriesForGrid = activeCategories.filter(c => usedCategoryCodes.has(c.code));

  const categoryDistribution = await statsQueries.calculateCategoryDistribution(client, {
    profileId,
    startDate: DateTime.fromObject({ year: currentYear }).startOf('year').toISODate()!,
    endDate: DateTime.fromObject({ year: currentYear }).endOf('year').toISODate()!,
  });

  const categoryDistributionWithPercentage = (() => {
    if (!categoryDistribution || categoryDistribution.length === 0) return [];
    const totalDuration = categoryDistribution.reduce((sum, item) => sum + item.duration, 0);
    if (totalDuration === 0) return categoryDistribution.map(item => ({...item, percentage: 0}));
    return categoryDistribution.map(item => ({
      ...item,
      percentage: Math.round((item.duration / totalDuration) * 100),
    }));
  })();

  return {
    profileId,
    categories: categoriesForGrid,
    currentYear,
    yearlyCategoryHeatmapData,
    categoryDistribution: categoryDistributionWithPercentage,
    comparisonStats
  };
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const pageData = data as AdvancedPageLoaderData | undefined;
  return [
    { title: `Advanced Statistics ${pageData?.currentYear || ""} - StartBeyond` },
    { name: "description", content: `View advanced statistics including yearly heatmaps for ${pageData?.currentYear || ""}.` },
  ];
};

interface AdvancedStatsPageProps {
  loaderData: AdvancedPageLoaderData;
}

export default function AdvancedStatsPage({ loaderData }: AdvancedStatsPageProps) {
  const { 
    categories,
    currentYear,
    yearlyCategoryHeatmapData,
    categoryDistribution,
    comparisonStats,
  } = loaderData;
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [shareSettings, setShareSettings] = useState({
    isPublic: false,
    includeRecords: true,
    includeDailyNotes: true,
    includeMemos: false,
    includeStats: true,
  });
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleShareSettingsChange = (key: string, value: boolean) => {
    setShareSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText("mock/share/link/advanced");
    setIsCopied(true); 
    setTimeout(() => setIsCopied(false), 2000);
  };

  const distributionChartCategories = categories.filter(c => 
    categoryDistribution.length > 0 && 
    categoryDistribution.find(dataItem => dataItem.category === c.code)
  );
  
  const monthlyMetrics = [
      { label: t('stats_summary_page.total_hours'), currentValue: comparisonStats.monthly.time.current / 60, previousValue: comparisonStats.monthly.time.prev / 60, unit: 'hours' as const },
      { label: t('stats_summary_page.total_records'), currentValue: comparisonStats.monthly.records.current, previousValue: comparisonStats.monthly.records.prev, unit: 'records' as const }
  ];

  const weeklyMetrics = [
      { label: t('stats_summary_page.total_hours'), currentValue: comparisonStats.weekly.time.current / 60, previousValue: comparisonStats.weekly.time.prev / 60, unit: 'hours' as const },
      { label: t('stats_summary_page.total_records'), currentValue: comparisonStats.weekly.records.current, previousValue: comparisonStats.weekly.records.prev, unit: 'records' as const }
  ];

  const handlePrevYear = () => {
    navigate(`?year=${currentYear - 1}`);
  };

  const handleNextYear = () => {
    navigate(`?year=${currentYear + 1}`);
  };

  const periodButton = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={handlePrevYear}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="w-24 text-center font-semibold">{currentYear}</span>
      <Button variant="outline" size="icon" onClick={handleNextYear} disabled={currentYear >= DateTime.now().year}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-background min-h-screen space-y-6">
      <StatsPageHeader
        title={t("stats_advanced_page.title", { year: currentYear })}
        periodButton={periodButton}
        shareSettings={shareSettings as any} 
        onShareSettingsChange={handleShareSettingsChange as any}
        isShareDialogOpen={isShareDialogOpen}
        setIsShareDialogOpen={setIsShareDialogOpen}
        isCopied={isCopied}
        onCopyLink={handleCopyLink}
        shareLink="mock/share/link/advanced"
       // pdfFileName={`advanced-stats-${currentYear}.pdf`}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("stats_advanced_page.heatmap_title", { year: currentYear })}</CardTitle>
        </CardHeader>
        <CardContent>
          {categories && categories.length > 0 && yearlyCategoryHeatmapData ? (
            <CategoryHeatmapGrid 
              year={currentYear} 
              data={yearlyCategoryHeatmapData} 
              categories={categories} 
            />
          ) : (
            <p className="text-center text-muted-foreground pt-12">{t("stats_advanced_page.no_heatmap_data")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("stats_advanced_page.distribution_title", { year: currentYear })}</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px]">
          {distributionChartCategories.length > 0 ? (
            <CategoryDistributionChart  data={categoryDistribution} categories={distributionChartCategories} />
          ) : (
            <p className="text-center text-muted-foreground pt-12">{t("stats_advanced_page.no_distribution_data")}</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>{t("stats_advanced_page.comparison_title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("stats_advanced_page.comparison_placeholder")}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ComparisonCard title={t('stats_advanced_page.monthly_comparison_title')} metrics={monthlyMetrics} />
        <ComparisonCard title={t('stats_advanced_page.weekly_comparison_title')} metrics={weeklyMetrics} />
      </div>

    </div>
  );
}
