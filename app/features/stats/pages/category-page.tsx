// app/features/stats/pages/category-page.tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/common/components/ui/tabs";
import React, { useState, useMemo, Fragment } from "react";
import { type LoaderFunctionArgs, type MetaFunction, useLoaderData } from "react-router";
import { DateTime } from "luxon";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Info, ChevronDown, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/common/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/common/components/ui/select";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { StatsPageHeader } from "~/common/components/stats/stats-page-header";
import { makeSSRClient } from "~/supa-client";
import { getUserCategories } from "~/features/settings/queries";
import * as statsQueries from "~/features/stats/queries";
import * as dailyQueries from "~/features/daily/queries";
import * as planQueries from "~/features/plan/queries";
import type { DailyPlan } from "~/features/plan/queries";
import type { DetailedCategorySummary, SubcodeDetail } from "~/features/stats/queries";
import type { CategoryCode, UICategory } from "~/common/types/daily";
import { CATEGORIES as DEFAULT_CATEGORIES } from "~/common/types/daily";

interface GoalAchievementStats {
  totalPlans: number;
  completedPlans: number;
  completionRate: number;
  longestStreak: number;
  uncheckedPlans: { plan: DailyPlan; category?: UICategory }[];
  categoryCompletion: Record<string, { total: number; completed: number; rate: number; category: UICategory }>;
}

export interface CategoryPageLoaderData {
  profileId: string | null;
  categories: UICategory[];
  detailedSummary: DetailedCategorySummary[];
  selectedMonthISO: string;
  goalStats: GoalAchievementStats;
}

async function getProfileId(request: Request): Promise<string | null> {
  try {
    const { client } = makeSSRClient(request);
    const {
      data: { user },
    } = await client.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.warn("Failed to get profileId in loader:", error);
    return null;
  }
}

export const loader = async ({
  request,
}: LoaderFunctionArgs): Promise<CategoryPageLoaderData> => {
  const profileId = await getProfileId(request);
  const { client } = makeSSRClient(request);
  const url = new URL(request.url);
  const monthParam = url.searchParams.get("month") || DateTime.now().toFormat("yyyy-MM");
  const monthStart = DateTime.fromFormat(monthParam, "yyyy-MM").startOf("month");
  const startDate = monthStart.toISODate()!;
  const endDate = monthStart.endOf("month").toISODate()!;

  let uiCategories: UICategory[] = [];
  let detailedSummary: DetailedCategorySummary[] = [];
  let goalStats: GoalAchievementStats = {
    totalPlans: 0,
    completedPlans: 0,
    completionRate: 0,
    longestStreak: 0,
    uncheckedPlans: [],
    categoryCompletion: {},
  };

  if (profileId) {
    const [userCategoriesDb, summary, plans, records] = await Promise.all([
      getUserCategories(client, { profileId }),
      statsQueries.calculateDetailedCategorySummary(client, {
        profileId,
        startDate,
        endDate,
      }),
      planQueries.getDailyPlansByPeriod(client, { profileId, startDate, endDate }),
      dailyQueries.getDailyRecordsByPeriod(client, { profileId, startDate, endDate }),
    ]);

    const finalCategories: UICategory[] = [];
    const defaultCategoriesMap = new Map(Object.values(DEFAULT_CATEGORIES).map((value) => [value.code, {...value, color: null, isCustom: false, isActive: true}]));
    const userCategoriesMap = new Map(userCategoriesDb.map(c => [c.code, c]));

    defaultCategoriesMap.forEach((defaultCat, code) => {
        const userOverride = userCategoriesMap.get(code);
        if (userOverride) {
            finalCategories.push({
                ...defaultCat,
                label: userOverride.label || defaultCat.label,
                icon: userOverride.icon || defaultCat.icon,
                color: userOverride.color || defaultCat.color,
                isCustom: true, 
                isActive: userOverride.is_active,
                sort_order: userOverride.sort_order ?? defaultCat.sort_order,
            });
            userCategoriesMap.delete(code); 
        } else {
            finalCategories.push(defaultCat);
        }
    });

    userCategoriesMap.forEach(userCat => {
        finalCategories.push({
            code: userCat.code,
            label: userCat.label,
            icon: userCat.icon || '📝',
            color: userCat.color,
            isCustom: true,
            isActive: userCat.is_active,
            hasDuration: true, 
            sort_order: userCat.sort_order ?? 1000,
        });
    });
    
    uiCategories = finalCategories.sort(
      (a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999),
    );
    const activeCategories = uiCategories.filter(c => c.isActive);
    const activeCategoryCodes = new Set(activeCategories.map(c => c.code));
    
    detailedSummary = summary.filter(s => activeCategoryCodes.has(s.category_code));
  
    // Calculate Goal Stats
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
            category: uiCategories.find(c => c.code === plan.category_code)
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
  } else {
     uiCategories = Object.values(DEFAULT_CATEGORIES).map((c) => ({
        ...c,
        isCustom: false,
        isActive: true,
      }));
  }
  
  const activeCategories = uiCategories.filter(c => c.isActive);

  return {
    profileId,
    categories: activeCategories,
    detailedSummary,
    selectedMonthISO: monthParam,
    goalStats,
  };
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `상세 통계 - StartBeyond` },
    {
      name: "description",
      content: `카테고리별 활동의 상세 통계를 확인합니다.`,
    },
  ];
};

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AF19FF",
  "#FF1943",
  "#19B2FF",
  "#6B19FF",
];

export default function CategoryStatsPage() {
  const { categories, detailedSummary, selectedMonthISO, goalStats } = useLoaderData<
    typeof loader
  >();
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [shareSettings] = useState({
    isPublic: false,
    includeRecords: true,
    includeDailyNotes: true,
    includeMemos: false,
    includeStats: true,
  });
    
  const [showOverallEvidence, setShowOverallEvidence] = useState(false);
  const [showCategoryEvidence, setShowCategoryEvidence] = useState<Record<string, boolean>>({});

  const toggleCategoryEvidence = (code: string) => {
    setShowCategoryEvidence(prev => ({...prev, [code]: !prev[code]}));
  };

  function toggleRowExpansion(code: string) {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(code)) {
        newSet.delete(code);
      } else {
        newSet.add(code);
      }
      return newSet;
    });
  }

  const tableData = useMemo(() => {
    return categories
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
  }, [categories, detailedSummary]);

  const chartData = useMemo(() => {
    return detailedSummary
      .map((summary) => {
        const categoryInfo = categories.find((c) => c.code === summary.category_code);
        return {
          name: categoryInfo?.label ?? summary.category_code,
          value: summary.total_duration,
          icon: categoryInfo?.icon,
        };
      })
      .filter((item) => item.value > 0);
  }, [detailedSummary, categories]);

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 pt-16 bg-background min-h-screen space-y-8">
      <StatsPageHeader
        title="카테고리별 상세 통계"
        description={`${DateTime.fromFormat(
          selectedMonthISO,
          "yyyy-MM",
        ).toFormat("yyyy년 M월")}의 데이터를 표시합니다.`}
        shareSettings={shareSettings}
        onShareSettingsChange={() => {}}
        isShareDialogOpen={false}
        setIsShareDialogOpen={() => {}}
        isCopied={false}
        onCopyLink={() => {}}
        shareLink=""
        pdfFileName={`category-report-${DateTime.now().toFormat("yyyy-MM")}.pdf`}
      />

      <Tabs defaultValue="analysis" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analysis">
            그래프 & 요약
          </TabsTrigger>
          <TabsTrigger value="goals">
            목표 달성
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>그래프</CardTitle>
              <Select
                value={chartType}
                onValueChange={(value: "bar" | "pie") =>
                  setChartType(value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="그래프 종류" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">
                    활동 시간 (막대 그래프)
                  </SelectItem>
                  <SelectItem value="pie">
                    활동 비율 (원 그래프)
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="h-[400px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "bar" ? (
                    <BarChart
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) =>
                          `${(value / 60).toFixed(1)} 시간`
                        }
                      />
                      <Legend />
                      <Bar
                        dataKey="value"
                        name="총 활동 시간 (분)"
                        fill="#8884d8"
                      />
                    </BarChart>
                  ) : (
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({
                          cx,
                          cy,
                          midAngle,
                          innerRadius,
                          outerRadius,
                          percent,
                          index,
                        }) => {
                          const RADIAN = Math.PI / 180;
                          const radius =
                            innerRadius + (outerRadius - innerRadius) * 0.5;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          return (
                            <text
                              x={x}
                              y={y}
                              fill="white"
                              textAnchor={x > cx ? "start" : "end"}
                              dominantBaseline="central"
                            >
                              {`${chartData[index].icon} ${
                                (percent * 100).toFixed(0)
                              }%`}
                            </text>
                          );
                        }}
                      >
                        {chartData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) =>
                          `${(value / 60).toFixed(1)} 시간`
                        }
                      />
                      <Legend />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">
                    이번 달에 표시할 데이터가 없습니다.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>카테고리별 요약</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ width: '25%' }}>카테고리</TableHead>
                    <TableHead style={{ width: '15%' }}>총 활동 시간</TableHead>
                    <TableHead style={{ width: '15%' }}>총 활동 횟수</TableHead>
                    <TableHead style={{ width: '15%' }}>평균 활동 시간</TableHead>
                    <TableHead>전체 세부코드 (클릭하여 펼치기)</TableHead>
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
                                <h4 className="font-semibold mb-2">세부코드 상세</h4>
                                <ul className="space-y-1">
                                  {row.subcodes.map((sc: SubcodeDetail) => (
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
                        데이터가 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">전체 계획 완료율</CardTitle>
                <p className="text-xs text-muted-foreground">이번 달에 계획된 모든 항목의 달성률입니다.</p>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{goalStats.completionRate}%</div>
                <p className="text-xs text-muted-foreground">{goalStats.completedPlans} / {goalStats.totalPlans} 항목 완료</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">최장 연속 달성</CardTitle>
                <p className="text-xs text-muted-foreground">계획을 모두 달성한 날이 연속된 최장 기간입니다.</p>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{goalStats.longestStreak}일</div>
                <p className="text-xs text-muted-foreground">목표를 {goalStats.longestStreak}일 연속 달성했습니다.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">미완료 계획</CardTitle>
                   <p className="text-xs text-muted-foreground">이번 달에 달성하지 못한 계획입니다.</p>
                </div>
                {goalStats.uncheckedPlans.length > 0 && (
                  <button
                    className="text-xs flex items-center gap-1 underline text-primary hover:text-primary-foreground transition-colors"
                    onClick={() => setShowCategoryEvidence(prev => ({ ...prev, unchecked: !prev.unchecked }))}
                  >
                    <Info className="w-3 h-3" />
                    {showCategoryEvidence.unchecked ? "목록 닫기" : "목록 보기"}
                  </button>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{goalStats.uncheckedPlans.length}개</div>
                <p className="text-xs text-muted-foreground">{goalStats.uncheckedPlans.length}개의 계획이 미완료 상태입니다.</p>
                {showCategoryEvidence.unchecked && (
                  <div className="mt-4 border rounded p-2 bg-muted max-h-48 overflow-y-auto">
                    <ul className="space-y-1">
                      {goalStats.uncheckedPlans.map(({ plan, category }) => (
                        <li key={plan.id} className="text-xs flex items-center gap-2 p-1 bg-background rounded">
                           <span>{category?.icon}</span>
                           <span className="font-semibold">{DateTime.fromISO(plan.plan_date).toFormat("MM/dd")}</span>
                           <span className="truncate">{plan.comment || 'N/A'}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>카테고리별 계획 달성 현황</CardTitle>
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
                  <p className="text-center text-muted-foreground">이번 달에 설정된 계획이 없습니다.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
