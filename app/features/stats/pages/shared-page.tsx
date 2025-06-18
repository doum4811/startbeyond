import React from 'react';
import { type LoaderFunctionArgs, type MetaFunction, useLoaderData, Link } from 'react-router';
import { makeSSRClient } from '~/supa-client';
import * as statsQueries from '~/features/stats/queries';
import * as dailyQueries from '~/features/daily/queries';
import * as planQueries from '~/features/plan/queries';
import * as settingsQueries from '~/features/settings/queries';
import type { SharedLink, SummaryPageLoaderData, AdvancedPageLoaderData, CategoryPageLoaderData, HeatmapData, RecordsPageLoaderData as RecordsPageSharedData, MonthlyDayRecord } from '~/features/stats/types';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '~/common/components/ui/card';
import { Button } from '~/common/components/ui/button';
import { CategoryDistributionList } from '../components/CategoryDistributionList';
import { SubcodeDistributionList } from '../components/SubcodeDistributionList';
import { CATEGORIES, type UICategory, type CategoryCode } from '~/common/types/daily';
import { DateTime } from 'luxon';
import { CategoryHeatmapGrid } from '~/common/components/stats/category-heatmap-grid';
import { CategoryDistributionChart } from '~/common/components/stats/category-distribution-chart';
import { ComparisonCard } from '../components/ComparisonCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/common/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/common/components/ui/table";
import { Fragment } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import MonthlyRecordsTab from '../components/MonthlyRecordsTab';
import type { DailyRecordUI, MemoUI } from '~/features/daily/types';

// This will hold data for ANY shared page type.
interface SharedPageLoaderData {
  sharedLink: SharedLink;
  summaryData?: Partial<Omit<SummaryPageLoaderData, 'profileId' | 'locale' | 'sharedLink'>>;
  advancedData?: Partial<Omit<AdvancedPageLoaderData, 'profileId' | 'sharedLink'>>;
  categoryData?: Partial<Omit<CategoryPageLoaderData, 'profileId' | 'sharedLink'>>;
  recordsData?: Partial<RecordsPageSharedData>;
}

async function getProcessedCategories(client: any, profileId: string): Promise<UICategory[]> {
    const [userCategoriesData] = await Promise.all([
        settingsQueries.getUserCategories(client, { profileId }),
    ]);

    const processedCategories: UICategory[] = [];
    const defaultCategoriesMap = new Map(Object.values(CATEGORIES).map((value) => [value.code, { ...value, isCustom: false, isActive: true, color: null, hasDuration: true }]));
    const userCategoriesMap = new Map(userCategoriesData.map(c => [c.code, c]));

    defaultCategoriesMap.forEach((defaultCat, code) => {
        const userOverride = userCategoriesMap.get(code as CategoryCode);
        if (userOverride) {
            processedCategories.push({
                ...defaultCat,
                label: userOverride.label || defaultCat.label,
                icon: userOverride.icon || defaultCat.icon,
                color: userOverride.color || defaultCat.color,
                isCustom: true,
                isActive: userOverride.is_active,
                sort_order: userOverride.sort_order ?? defaultCat.sort_order,
            });
            userCategoriesMap.delete(code as CategoryCode);
        } else {
            processedCategories.push(defaultCat);
        }
    });

    userCategoriesMap.forEach(userCat => {
        processedCategories.push({
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

    return processedCategories.sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
}

export const loader = async ({ params, request }: LoaderFunctionArgs): Promise<SharedPageLoaderData> => {
  const { token } = params;
  if (!token) {
    throw new Response("Not Found", { status: 404 });
  }
  
  const { client } = makeSSRClient(request);
  // @ts-ignore
  const sharedLink = await statsQueries.getSharedLinkByToken(client, { token });

  if (!sharedLink || !sharedLink.is_public) {
    throw new Response("Not Found", { status: 404 });
  }
  
  const profileId = sharedLink.profile_id;
  const categories = await getProcessedCategories(client, profileId);
  const activeCategories = categories.filter(c => c.isActive);

  // Based on page_type, fetch the corresponding data
  if (sharedLink.page_type === 'summary') {
    const monthForDb = sharedLink.period;
    const selectedMonthStart = DateTime.fromISO(`${monthForDb}-01`).startOf("month");
    const selectedMonthEnd = selectedMonthStart.endOf("month");

    const [
      categoryDistribution,
      subcodeDistribution,
    ] = await Promise.all([
      statsQueries.calculateCategoryDistribution(client, {
        profileId,
        startDate: selectedMonthStart.toISODate()!,
        endDate: selectedMonthEnd.toISODate()!,
      }),
      statsQueries.calculateSubcodeDistribution(client, {
        profileId,
        startDate: selectedMonthStart.toISODate()!,
        endDate: selectedMonthEnd.toISODate()!,
      }),
    ]);

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
      // @ts-ignore
      sharedLink,
      summaryData: {
        selectedMonthISO: monthForDb,
        categoryDistribution: categoryDistributionWithPercentage,
        subcodeDistribution,
        categories: categories,
      },
    };
  } else if (sharedLink.page_type === 'advanced') {
        const currentYear = parseInt(sharedLink.period, 10);
        const startDate = DateTime.fromObject({ year: currentYear }).startOf('year').toISODate()!;
        const endDate = DateTime.fromObject({ year: currentYear }).endOf('year').toISODate()!;
        
        const [yearlyActivity, fetchedComparisonStats, categoryDistribution] = await Promise.all([
            statsQueries.calculateActivityHeatmap(client, { profileId, startDate, endDate }),
            statsQueries.getComparisonStats(client, { profileId }),
            statsQueries.calculateCategoryDistribution(client, { profileId, startDate, endDate }),
        ]);

        const activityByDate = Object.fromEntries(yearlyActivity.map(day => [day.date, day]));
        let maxCategoryIntensity = 1;
        yearlyActivity.forEach(day => {
            Object.values(day.categories).forEach(count => {
                if (count > maxCategoryIntensity) maxCategoryIntensity = count;
            });
        });

        const yearlyCategoryHeatmapData = activeCategories.reduce((acc, cat) => {
            const categoryYearlyData: HeatmapData[] = [];
            let currentDate = DateTime.fromObject({ year: currentYear }).startOf('year');
            while (currentDate.year === currentYear) {
                const dateStr = currentDate.toISODate()!;
                const dayData = activityByDate[dateStr];
                const categoryCount = dayData?.categories[cat.code as CategoryCode] || 0;
                categoryYearlyData.push({
                    date: dateStr,
                    intensity: categoryCount / maxCategoryIntensity,
                    categories: dayData?.categories || {},
                    total: categoryCount,
                });
                currentDate = currentDate.plus({ days: 1 });
            }
            acc[cat.code as CategoryCode] = categoryYearlyData;
            return acc;
        }, {} as Record<CategoryCode, HeatmapData[]>);
        
        const usedCategoryCodes = new Set(Object.keys(yearlyCategoryHeatmapData).filter(code => 
            yearlyCategoryHeatmapData[code as CategoryCode].some(day => day.total > 0)
        ));
        const categoriesForGrid = activeCategories.filter(c => usedCategoryCodes.has(c.code));

        const categoryDistributionWithPercentage = (() => {
            if (!categoryDistribution || categoryDistribution.length === 0) return [];
            const totalDuration = categoryDistribution.reduce((sum, item) => sum + item.duration, 0);
            if (totalDuration === 0) return categoryDistribution.map(item => ({...item, percentage: 0}));
            return categoryDistribution.map(item => ({...item, percentage: Math.round((item.duration / totalDuration) * 100)}));
        })();
        
        return {
            sharedLink: sharedLink as SharedLink,
            advancedData: {
                categories: categoriesForGrid,
                currentYear,
                yearlyCategoryHeatmapData: yearlyCategoryHeatmapData,
                categoryDistribution: categoryDistributionWithPercentage,
                comparisonStats: fetchedComparisonStats,
            }
        }

  } else if (sharedLink.page_type === 'category') {
        const monthParam = sharedLink.period;
        const monthStart = DateTime.fromFormat(monthParam, "yyyy-MM").startOf("month");
        const startDate = monthStart.toISODate()!;
        const endDate = monthStart.endOf("month").toISODate()!;

        const [detailedSummary, plans, records] = await Promise.all([
            statsQueries.calculateDetailedCategorySummary(client, { profileId, startDate, endDate }),
            planQueries.getDailyPlansByPeriod(client, { profileId, startDate, endDate }),
            dailyQueries.getDailyRecordsByPeriod(client, { profileId, startDate, endDate, onlyPublic: true }),
        ]);
        
        const activeCategoryCodes = new Set(activeCategories.map(c => c.code));
        const filteredSummary = detailedSummary.filter(s => activeCategoryCodes.has(s.category_code));

        const goalStats: CategoryPageLoaderData['goalStats'] = {
            totalPlans: 0, completedPlans: 0, completionRate: 0, longestStreak: 0, uncheckedPlans: [], categoryCompletion: {},
        };

        if (plans && plans.length > 0) {
            const completedPlanIds = new Set(records.map(r => r.linked_plan_id).filter(Boolean));
            const plansByCategory: Record<string, { total: number; completed: number; category: UICategory }> = {};
            
            activeCategories.forEach(cat => {
                plansByCategory[cat.code] = { total: 0, completed: 0, category: cat };
            });
            
            const plansByDate: Record<string, { total: number; completed: number }> = {};

            for (const plan of plans) {
                if (!plan.plan_date) continue;
                
                if (!plansByDate[plan.plan_date]) {
                    plansByDate[plan.plan_date] = { total: 0, completed: 0 };
                }
                plansByDate[plan.plan_date].total++;
                
                const isCompleted = completedPlanIds.has(plan.id);
                if (isCompleted) {
                    plansByDate[plan.plan_date].completed++;
                } else {
                    goalStats.uncheckedPlans.push({
                        plan,
                        category: categories.find(c => c.code === plan.category_code)
                    });
                }
                
                if (plan.category_code && plansByCategory[plan.category_code]) {
                    plansByCategory[plan.category_code].total++;
                    if (isCompleted) {
                        plansByCategory[plan.category_code].completed++;
                    }
                }
            }

            goalStats.totalPlans = plans.length;
            goalStats.completedPlans = completedPlanIds.size;
            goalStats.completionRate = plans.length > 0 ? Math.round((completedPlanIds.size / plans.length) * 100) : 0;

            Object.keys(plansByCategory).forEach(code => {
                const catData = plansByCategory[code];
                if (catData.total > 0) {
                    goalStats.categoryCompletion[code] = {
                        ...catData,
                        rate: Math.round((catData.completed / catData.total) * 100)
                    };
                }
            });
            
            let currentStreak = 0;
            let longestStreak = 0;
            for (let day = monthStart; day <= monthStart.endOf("month"); day = day.plus({ days: 1 })) {
                const dateStr = day.toISODate()!;
                const dayPlans = plansByDate[dateStr];
                if (dayPlans && dayPlans.total > 0 && dayPlans.total === dayPlans.completed) {
                    currentStreak++;
                } else {
                    longestStreak = Math.max(longestStreak, currentStreak);
                    currentStreak = 0;
                }
            }
            longestStreak = Math.max(longestStreak, currentStreak);
            goalStats.longestStreak = longestStreak;
        }

        return {
            // @ts-ignore
            sharedLink,
            categoryData: {
                categories: activeCategories,
                detailedSummary: filteredSummary,
                selectedMonthISO: monthParam,
                goalStats: goalStats,
            }
        };
  } else if (sharedLink.page_type === 'records') {
    const [startDateStr, endDateStr] = sharedLink.period.split('_');
    const startDate = DateTime.fromISO(startDateStr);
    const endDate = DateTime.fromISO(endDateStr);

    const [dbRecords, dbNotes] = await Promise.all([
        dailyQueries.getDailyRecordsByPeriod(client, { profileId, startDate: startDate.toISODate()!, endDate: endDate.toISODate()!, onlyPublic: true }),
        dailyQueries.getDailyNotesByPeriod(client, { profileId, startDate: startDate.toISODate()!, endDate: endDate.toISODate()! }),
    ]);
    
    const records: DailyRecordUI[] = dbRecords.map((r): DailyRecordUI => ({
        id: r.id!,
        date: r.date,
        category_code: r.category_code as CategoryCode,
        comment: r.comment,
        subcode: r.subcode,
        duration_minutes: r.duration_minutes ?? null,
        is_public: r.is_public ?? false,
        linked_plan_id: r.linked_plan_id,
        created_at: r.created_at,
        updated_at: r.updated_at,
        profile_id: r.profile_id,
    }));
    
    const recordIds = records.map(r => r.id).filter((id): id is string => !!id);
    const dbMemos = recordIds.length > 0 ? await dailyQueries.getMemosByRecordIds(client, { profileId, recordIds }) : [];

    const memosByRecordId = new Map<string, MemoUI[]>();
    dbMemos.forEach(memo => {
        if (!memo.record_id) return;
        const existing = memosByRecordId.get(memo.record_id) || [];
        existing.push({ 
            id: memo.id, 
            title: memo.title, 
            content: memo.content,
            record_id: memo.record_id,
            created_at: memo.created_at,
            updated_at: memo.updated_at
        });
        memosByRecordId.set(memo.record_id, existing);
    });

    records.forEach(rec => {
        rec.memos = memosByRecordId.get(rec.id) || [];
    });
    
    const monthlyRecordsForDisplay: MonthlyDayRecord[] = [];
    const notesByDate = new Map(dbNotes.map(n => [n.date, n.content]));
    const recordsByDate = new Map<string, DailyRecordUI[]>();

    records.forEach(rec => {
        const existing = recordsByDate.get(rec.date) || [];
        existing.push(rec);
        recordsByDate.set(rec.date, existing);
    });
    
    let currentDate = startDate;
    while (currentDate <= endDate) {
        const dateStr = currentDate.toISODate()!;
        const dayRecords = recordsByDate.get(dateStr) || [];
        if (dayRecords.length > 0 || notesByDate.has(dateStr)) {
            const allMemosForDay = dayRecords.flatMap(r => r.memos || []);
            monthlyRecordsForDisplay.push({
                date: dateStr,
                records: dayRecords,
                memos: allMemosForDay,
                dailyNote: notesByDate.get(dateStr) || null,
            });
        }
        currentDate = currentDate.plus({ days: 1 });
    }
    
    return {
        // @ts-ignore
        sharedLink,
        recordsData: {
            categories: activeCategories,
            monthlyData: monthlyRecordsForDisplay.sort((a, b) => b.date.localeCompare(a.date)),
            startDate: startDate.toISODate()!,
            endDate: endDate.toISODate()!,
        }
    };

  } else {
     return { 
        // @ts-ignore
        sharedLink 
    };
  }
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
    const { t } = useTranslation();
    const pageData = data as SharedPageLoaderData | undefined;
    const pageType = pageData?.sharedLink?.page_type || 'Stats';
    
    return [
      { title: t('shared_page.meta_title', { pageType: pageType.charAt(0).toUpperCase() + pageType.slice(1) }) },
      { name: "description", content: t('shared_page.meta_description') },
    ];
};

export default function SharedPage() {
  const { sharedLink } = useLoaderData<typeof loader>();
  const { t } = useTranslation();

  if (!sharedLink) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>{t('shared_page.not_found')}</p>
      </div>
    );
  }
  
  const loaderData = useLoaderData<typeof loader>();
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  const renderContent = () => {
    if (sharedLink.page_type === 'summary' && loaderData.summaryData) {
        const { settings } = sharedLink;
        // @ts-ignore
        const { include_summary, include_subcode_distribution } = settings;
        const { categoryDistribution, subcodeDistribution, categories } = loaderData.summaryData;

        return (
            <div className="space-y-6">
                {include_summary && (
                    <Card>
                        <CardHeader><CardTitle>{t('stats_summary_page.category_distribution')}</CardTitle></CardHeader>
                        <CardContent>
                            {categoryDistribution && categoryDistribution.length > 0 ? (
                                // @ts-ignore
                                <CategoryDistributionList data={categoryDistribution} categories={categories} />
                            ) : (
                                <p className="text-center text-muted-foreground pt-12">{t('stats_summary_page.no_data')}</p>
                            )}
                        </CardContent>
                    </Card>
                )}
                {include_subcode_distribution && (
                     <Card>
                        <CardHeader><CardTitle>{t('stats_summary_page.subcode_distribution_title')}</CardTitle></CardHeader>
                        <CardContent>
                        {subcodeDistribution && subcodeDistribution.length > 0 ? (
                            // @ts-ignore
                            <SubcodeDistributionList data={subcodeDistribution} categories={categories} />
                        ) : (
                            <p className="text-center text-muted-foreground pt-12">{t('subcode_distribution_list.no_data')}</p>
                        )}
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    } else if (sharedLink.page_type === 'advanced' && loaderData.advancedData) {
        const { settings } = sharedLink;
        // @ts-ignore
        const { include_heatmap, include_comparison } = settings;
        const { categories, currentYear, yearlyCategoryHeatmapData, categoryDistribution, comparisonStats } = loaderData.advancedData;

        if (!categories || !comparisonStats) {
            return <p>Loading advanced data...</p>;
        }

        const distributionChartCategories = categories.filter(c => 
            categoryDistribution && categoryDistribution.length > 0 && categoryDistribution.find(dataItem => dataItem.category === c.code)
        );
        const monthlyMetrics = [
            { label: t('stats_summary_page.total_hours'), currentValue: comparisonStats.monthly.time.current / 60, previousValue: comparisonStats.monthly.time.prev / 60, unit: 'hours' as const },
            { label: t('stats_summary_page.total_records'), currentValue: comparisonStats.monthly.records.current, previousValue: comparisonStats.monthly.records.prev, unit: 'records' as const }
        ];
        const weeklyMetrics = [
            { label: t('stats_summary_page.total_hours'), currentValue: comparisonStats.weekly.time.current / 60, previousValue: comparisonStats.weekly.time.prev / 60, unit: 'hours' as const },
            { label: t('stats_summary_page.total_records'), currentValue: comparisonStats.weekly.records.current, previousValue: comparisonStats.weekly.records.prev, unit: 'records' as const }
        ];

        return (
            <div className="space-y-6">
                {include_heatmap && (
                    <Card>
                        <CardHeader><CardTitle>{t("stats_advanced_page.heatmap_title", { year: currentYear })}</CardTitle></CardHeader>
                        <CardContent>
                            {categories && categories.length > 0 && yearlyCategoryHeatmapData ? (
                                <CategoryHeatmapGrid year={currentYear as number} data={yearlyCategoryHeatmapData} categories={categories} />
                            ) : (
                                <p className="text-center text-muted-foreground pt-12">{t("stats_advanced_page.no_heatmap_data")}</p>
                            )}
                        </CardContent>
                    </Card>
                )}
                 <Card>
                    <CardHeader><CardTitle>{t("stats_advanced_page.distribution_title", { year: currentYear })}</CardTitle></CardHeader>
                    <CardContent className="h-[350px]">
                    {distributionChartCategories.length > 0 && categoryDistribution ? (
                        <CategoryDistributionChart data={categoryDistribution} categories={distributionChartCategories} />
                    ) : (
                        <p className="text-center text-muted-foreground pt-12">{t("stats_advanced_page.no_distribution_data")}</p>
                    )}
                    </CardContent>
                </Card>
                {include_comparison && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ComparisonCard title={t('stats_advanced_page.monthly_comparison_title')} metrics={monthlyMetrics} />
                        <ComparisonCard title={t('stats_advanced_page.weekly_comparison_title')} metrics={weeklyMetrics} />
                    </div>
                )}
            </div>
        )
    } else if (sharedLink.page_type === 'category' && loaderData.categoryData) {
        const { settings } = sharedLink;
        // @ts-ignore
        const { include_goals } = settings;
        const { categories, detailedSummary, selectedMonthISO, goalStats } = loaderData.categoryData;

        if (!categories || !detailedSummary || !goalStats) {
            return <p>Loading category data...</p>
        }
        
        const tableData = categories
            .filter(cat => detailedSummary.some(s => s.category_code === cat.code))
            .map((cat) => {
                const summary = detailedSummary.find((s) => s.category_code === cat.code);
                return {
                    code: cat.code,
                    label: cat.label,
                    icon: cat.icon,
                    total_duration: summary?.total_duration ?? 0,
                    total_records: summary?.total_records ?? 0,
                    average_duration: summary?.average_duration ?? 0,
                    subcodes: summary?.subcodes ?? [],
                };
            });
        
        const toggleRowExpansion = (code: string) => {
            setExpandedRows(prev => {
                const newSet = new Set(prev);
                if (newSet.has(code)) newSet.delete(code);
                else newSet.add(code);
                return newSet;
            });
        };

        return (
             <Tabs defaultValue="analysis" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="analysis">{t('stats_category_page.tabs.analysis')}</TabsTrigger>
                    {include_goals && <TabsTrigger value="goals">{t('stats_category_page.tabs.goals')}</TabsTrigger>}
                </TabsList>
                 <TabsContent value="analysis" className="space-y-6">
                    <Card>
                        <CardHeader>
                        <CardTitle>{t('stats_category_page.analysis.summary_title')}</CardTitle>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead style={{ width: '25%' }}>{t('stats_category_page.analysis.table_header_category')}</TableHead>
                                <TableHead style={{ width: '15%' }}>{t('stats_category_page.analysis.table_header_total_duration')}</TableHead>
                                <TableHead style={{ width: '15%' }}>{t('stats_category_page.analysis.table_header_total_records')}</TableHead>
                                <TableHead style={{ width: '15%' }}>{t('stats_category_page.analysis.table_header_avg_duration')}</TableHead>
                                <TableHead>{t('stats_category_page.analysis.table_header_subcodes')}</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {tableData.length > 0 ? (
                                tableData.map((row) => (
                                <Fragment key={row.code}>
                                    <TableRow onClick={() => toggleRowExpansion(row.code)} className="cursor-pointer">
                                    <TableCell className="font-medium flex items-center gap-2">
                                        {row.icon} {row.label}
                                    </TableCell>
                                    <TableCell>
                                        {(row.total_duration / 60).toFixed(1)} 시간
                                    </TableCell>
                                    <TableCell>{row.total_records} 회</TableCell>
                                    <TableCell>
                                        {row.average_duration.toFixed(1)} 분
                                    </TableCell>
                                    <TableCell className="flex items-center gap-2">
                                        {row.subcodes.length > 0 ? 
                                        `${row.subcodes.slice(0, 2).map(sc => sc.subcode).join(', ')} 등 ${row.subcodes.length}개` :
                                        '-'
                                        }
                                        {row.subcodes.length > 0 && (
                                        expandedRows.has(row.code) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                                        )}
                                    </TableCell>
                                    </TableRow>
                                    {expandedRows.has(row.code) && (
                                    <TableRow>
                                        <TableCell colSpan={5}>
                                        <div className="p-4 bg-muted rounded-md">
                                            <h4 className="font-semibold mb-2">{t('stats_category_page.analysis.subcode_details_title')}</h4>
                                            <ul className="space-y-1">
                                            {/* @ts-ignore */}
                                            {row.subcodes.map((sc) => (
                                                <li key={sc.subcode} className="flex justify-between text-sm">
                                                <span>{sc.subcode}</span>
                                                <span className="text-muted-foreground">{sc.count}회 / {(sc.duration / 60).toFixed(1)}시간</span>
                                                </li>
                                            ))}
                                            </ul>
                                        </div>
                                        </TableCell>
                                    </TableRow>
                                    )}
                                </Fragment>
                                ))
                            ) : (
                                <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-center h-24"
                                >
                                    {t('stats_category_page.analysis.no_chart_data')}
                                </TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                {include_goals && (
                    <TabsContent value="goals" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">{t('stats_category_page.goals.completion_rate_title')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{goalStats.completionRate}%</div>
                                    <p className="text-xs text-muted-foreground">{goalStats.completedPlans} / {goalStats.totalPlans} 항목 완료</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">{t('stats_category_page.goals.longest_streak_title')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{goalStats.longestStreak}일</div>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">{t('stats_category_page.goals.unchecked_plans_title')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{goalStats.uncheckedPlans.length}개</div>
                                </CardContent>
                            </Card>
                        </div>
                         <Card>
                            <CardHeader>
                                <CardTitle>{t('stats_category_page.goals.category_completion_title')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {Object.values(goalStats.categoryCompletion).length > 0 ? (
                                    Object.values(goalStats.categoryCompletion).map(({ category, total, completed, rate }) => (
                                        <div key={category.code} className="flex flex-col gap-1">
                                            <div className="flex items-center gap-4">
                                                <span className="text-2xl">{category.icon}</span>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-medium">{category.label}</span>
                                                        <span className="text-sm text-muted-foreground">
                                                        {completed}/{total} ({rate}%)
                                                        </span>
                                                    </div>
                                                    <div className="h-2 bg-muted rounded-full">
                                                        <div 
                                                        className="h-2 bg-primary rounded-full" 
                                                        style={{ width: `${rate}%` }} 
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                    ) : (
                                    <p className="text-center text-muted-foreground">{t('stats_category_page.goals.no_plans_this_month')}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        )
    } else if (sharedLink.page_type === 'records' && loaderData.recordsData) {
        const { recordsData } = loaderData;
        if (!recordsData || !recordsData.monthlyData || !recordsData.categories) return <p>{t('shared_page.content_placeholder')}</p>;
        const includeNotes = (sharedLink as any).settings?.include_notes ?? true;
        return (
          <>
            {(sharedLink as any).settings?.include_records_list && (
                <div className="mt-6">
                    {/* @ts-ignore */}
                    <MonthlyRecordsTab
                        monthlyRecordsForDisplay={recordsData.monthlyData}
                        categories={recordsData.categories}
                        showNotes={includeNotes}
                    />
                </div>
            )}
            {!(sharedLink as any).settings?.include_records_list && !includeNotes && (
                 <p>{t('shared_page.content_placeholder')}</p>
            )}
          </>
        );
    }
    // Placeholder for other page types
    return (
        <pre className="mt-4 p-4 bg-muted rounded-md overflow-x-auto">
            <code>{JSON.stringify(sharedLink, null, 2)}</code>
        </pre>
    );
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-background min-h-screen space-y-6">
        <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">{t('shared_page.title', { pageType: sharedLink.page_type })}</h1>
            <p className="text-muted-foreground">{t('shared_page.period', { period: sharedLink.period })}</p>
        </div>
        
        {renderContent()}

        <footer className="text-center mt-8">
            <Button asChild variant="ghost">
                <Link to="/">{t("shared_page.back_to_app")}</Link>
            </Button>
        </footer>
    </div>
  );
} 