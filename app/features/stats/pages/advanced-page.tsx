// app/features/stats/pages/advanced-page.tsx
import React, { useState } from "react";
import { type LoaderFunctionArgs, type MetaFunction } from "react-router";
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

// Mock Categories (fallback if DB fetch fails)
const MOCK_UI_CATEGORIES: UICategory[] = Object.values(DEFAULT_CATEGORIES).map(cat => ({
  ...cat,
  isCustom: false,
  isActive: true,
  sort_order: cat.sort_order || 999,
  hasDuration: true,
}));

async function getProfileId(request: Request): Promise<string | null> {
  try {
    const { client } = makeSSRClient(request);
    const { data: { user } } = await client.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.warn("Failed to get profileId in advanced-page loader:", error);
    return null;
  }
}

export const loader = async ({ request }: LoaderFunctionArgs): Promise<AdvancedPageLoaderData> => {
  let profileId: string | null = null;
  let uiCategories: UICategory[] = MOCK_UI_CATEGORIES;
  const { client } = makeSSRClient(request);

  try {
    profileId = await getProfileId(request);
    if (profileId) {
      const dbUserCategories = await getUserCategories(client, { profileId });
      if (dbUserCategories && dbUserCategories.length > 0) {
        const fetchedCategories = dbUserCategories.map(cat => ({
          code: cat.code as CategoryCode,
          label: cat.label,
          icon: cat.icon || '❓',
          color: cat.color,
          isCustom: true, 
          isActive: cat.is_active ?? true,
          sort_order: cat.sort_order ?? 1000,
          hasDuration: true, 
        }));
        uiCategories = fetchedCategories.length > 0 ? fetchedCategories : MOCK_UI_CATEGORIES;
      }
    }
  } catch (error) {
    console.error("Error fetching categories in advanced-page loader:", error);
  }

  const currentYear = DateTime.now().year;
  const activeCategories = uiCategories.filter(c => c.isActive);
  const activeCategoryCodes = activeCategories.map(c => c.code as CategoryCode);
  
  const yearlyCategoryHeatmapData = Object.fromEntries(
    activeCategoryCodes.map(code => [code, [] as HeatmapData[]])
  ) as Record<CategoryCode, HeatmapData[]>;

  if (profileId) {
    const startDate = DateTime.fromObject({ year: currentYear }).startOf('year').toISODate()!;
    const endDate = DateTime.fromObject({ year: currentYear }).endOf('year').toISODate()!;
    
    const yearlyActivity: ActivityHeatmapType[] = await statsQueries.calculateActivityHeatmap(client, { profileId, startDate, endDate });

    const activityByDate: { [date: string]: ActivityHeatmapType } = {};
    for (const day of yearlyActivity) {
        activityByDate[day.date] = day;
    }

    let maxCategoryIntensity = 1;
    for (const day of yearlyActivity) {
      for (const catCode in day.categories) {
        if (day.categories[catCode as CategoryCode] > maxCategoryIntensity) {
          maxCategoryIntensity = day.categories[catCode as CategoryCode];
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
  } else {
    // For non-logged-in users, data is already initialized with empty arrays.
    // We can fill with empty day placeholders if needed, but for now this is fine.
    activeCategoryCodes.forEach(code => {
        const dailyData = Array.from({ length: 365 }, (_, i) => {
            const date = DateTime.now().startOf('year').plus({ days: i });
            return {
              date: date.toFormat("yyyy-MM-dd"),
              intensity: 0,
              categories: {} as Record<CategoryCode, number>,
              total: 0,
            } as HeatmapData;
          });
        yearlyCategoryHeatmapData[code] = dailyData;
    });
  }

  const usedCategoryCodes = new Set(Object.keys(yearlyCategoryHeatmapData).filter(code => 
    yearlyCategoryHeatmapData[code as CategoryCode].some(day => day.total > 0)
  ));

  const categoriesForGrid = uiCategories.filter(c => usedCategoryCodes.has(c.code));

  const categoryDistribution = profileId ? await statsQueries.calculateCategoryDistribution(client, {
    profileId,
    startDate: DateTime.fromObject({ year: currentYear }).startOf('year').toISODate()!,
    endDate: DateTime.fromObject({ year: currentYear }).endOf('year').toISODate()!,
  }) : [];


  return {
    profileId,
    categories: categoriesForGrid,
    currentYear,
    yearlyCategoryHeatmapData,
    categoryDistribution,
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
    categoryDistribution
  } = loaderData;

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

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 pt-16 bg-background min-h-screen space-y-8">
      <StatsPageHeader
        title={`Advanced Statistics (${currentYear})`}
        shareSettings={shareSettings as any} 
        onShareSettingsChange={handleShareSettingsChange as any}
        isShareDialogOpen={isShareDialogOpen}
        setIsShareDialogOpen={setIsShareDialogOpen}
        isCopied={isCopied}
        onCopyLink={handleCopyLink}
        shareLink="mock/share/link/advanced"
        pdfFileName={`advanced-stats-${currentYear}.pdf`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Yearly Category Activity Heatmap ({currentYear})</CardTitle>
        </CardHeader>
        <CardContent>
          {categories && categories.length > 0 && yearlyCategoryHeatmapData ? (
            <CategoryHeatmapGrid 
              year={currentYear} 
              data={yearlyCategoryHeatmapData} 
              categories={categories} 
            />
          ) : (
            <p>No category data available to display heatmap.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Yearly Category Distribution ({currentYear})</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px]">
          {distributionChartCategories.length > 0 ? (
            <CategoryDistributionChart data={categoryDistribution} categories={distributionChartCategories} />
          ) : (
            <p className="text-center text-muted-foreground pt-12">No data for category distribution chart.</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Monthly/Weekly Comparison (Placeholder)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Placeholder for Monthly/Weekly Comparison charts and data.</p>
        </CardContent>
      </Card>

    </div>
  );
}
