// app/features/stats/pages/category-page.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { CategoryDistributionChart } from "~/common/components/stats/category-distribution-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/common/components/ui/tabs";
import { DateTime } from "luxon";
import { StatsPageHeader } from "~/common/components/stats/stats-page-header";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { CategoryCode } from "~/common/types/daily";
import { CATEGORIES } from "~/common/types/daily";
import { BarChart2, Target, CheckCircle2, Info } from "lucide-react";

// Mock 데이터
const mockCategoryData = [
  { category: "EX" as CategoryCode, count: 30, duration: 45, percentage: 35 },
  { category: "BK" as CategoryCode, count: 20, duration: 30, percentage: 25 },
  { category: "ML" as CategoryCode, count: 15, duration: 20, percentage: 20 },
  { category: "EM" as CategoryCode, count: 10, duration: 15, percentage: 15 },
  { category: "ST" as CategoryCode, count: 5, duration: 10, percentage: 5 },
];

const categories = [
  { code: "EX" as CategoryCode, label: "운동", icon: "🏃" },
  { code: "BK" as CategoryCode, label: "독서", icon: "📚" },
  { code: "ML" as CategoryCode, label: "명상", icon: "🧘" },
  { code: "EM" as CategoryCode, label: "영어", icon: "🇬🇧" },
  { code: "ST" as CategoryCode, label: "공부", icon: "🧠" },
];

// Mock 체크박스 데이터
const mockCheckboxData = {
  EX: { total: 30, completed: 25 },
  BK: { total: 20, completed: 15 },
  ML: { total: 15, completed: 12 },
  EM: { total: 10, completed: 8 },
  ST: { total: 5, completed: 4 },
};

interface ShareSettings {
  isPublic: boolean;
  includeRecords: boolean;
  includeDailyNotes: boolean;
  includeMemos: boolean;
  includeStats: boolean;
}

const initialShareSettings: ShareSettings = {
  isPublic: false,
  includeRecords: true,
  includeDailyNotes: true,
  includeMemos: false,
  includeStats: true,
};

// PDF Dummy 컴포넌트 (카테고리별 요약 표만)
const CategorySummaryPDF = () => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <View style={pdfStyles.header}>
        <Text style={pdfStyles.title}>카테고리별 상세 통계</Text>
        <Text style={pdfStyles.date}>{DateTime.now().toFormat("yyyy년 MM월")}</Text>
      </View>
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>카테고리별 요약</Text>
        {Object.entries(CATEGORIES).map(([code, cat]) => (
          <View key={code} style={pdfStyles.row}>
            <Text>{cat.label}</Text>
            <Text>120시간 / 45회 / 2.7시간 / 러닝</Text>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

const pdfStyles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Helvetica" },
  header: { marginBottom: 20 },
  title: { fontSize: 24, marginBottom: 10 },
  date: { fontSize: 14, color: "#666" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
});

export default function CategoryStatsPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | CategoryCode>('ALL');
  const [chartType, setChartType] = useState<'bar' | 'doughnut' | 'line'>('bar');
  const [shareSettings, setShareSettings] = useState<ShareSettings>(initialShareSettings);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  // 근거 토글 상태
  const [showOverallEvidence, setShowOverallEvidence] = useState(false);
  const [showCategoryEvidence, setShowCategoryEvidence] = useState<Record<string, boolean>>({});

  function handleShareSettingsChange(key: keyof ShareSettings, value: boolean) {
    setShareSettings(prev => ({ ...prev, [key]: value }));
  }
  function handleCopyLink() {
    const mockLink = "https://startbeyond.com/share/category/abc123";
    navigator.clipboard.writeText(mockLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }
  function toggleCategoryEvidence(code: string) {
    setShowCategoryEvidence(prev => ({ ...prev, [code]: !prev[code] }));
  }

  // mock 근거 데이터
  const mockCheckboxEvidence = [
    { date: "2024-06-01", checked: true, category: "운동", plan: "러닝 30분", executed: true },
    { date: "2024-06-02", checked: false, category: "운동", plan: "러닝 30분", executed: false },
    { date: "2024-06-01", checked: true, category: "독서", plan: "책 20쪽 읽기", executed: true },
    { date: "2024-06-02", checked: false, category: "독서", plan: "책 20쪽 읽기", executed: false },
  ];
  // 미체크만 필터
  const mockUncheckedEvidence = mockCheckboxEvidence.filter(row => !row.checked);

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 bg-background min-h-screen">
      <StatsPageHeader
        title="카테고리별 상세 통계 (유료)"
        description="카테고리별 상세 분석을 위해 프리미엄으로 업그레이드하세요."
        shareSettings={shareSettings}
        onShareSettingsChange={handleShareSettingsChange}
        isShareDialogOpen={isShareDialogOpen}
        setIsShareDialogOpen={setIsShareDialogOpen}
        isCopied={isCopied}
        onCopyLink={handleCopyLink}
        shareLink="https://startbeyond.com/share/category/abc123"
        pdfDocument={<CategorySummaryPDF />}
        pdfFileName={`category-report-${DateTime.now().toFormat("yyyy-MM")}.pdf`}
      />

      <Tabs defaultValue="analysis" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analysis">
            <BarChart2 className="w-4 h-4 mr-2" />
            카테고리 분석
          </TabsTrigger>
          <TabsTrigger value="goals">
            <Target className="w-4 h-4 mr-2" />
            목표 달성
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-6">
          {/* 카테고리별 활동량 그래프 */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>카테고리별 활동량</CardTitle>
              <div className="flex gap-2">
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value as any)} className="border rounded px-2 py-1">
                  <option value="ALL">전체</option>
                  {categories.map(cat => (
                    <option key={cat.code} value={cat.code}>{cat.label}</option>
                  ))}
                </select>
                <select value={chartType} onChange={e => setChartType(e.target.value as any)} className="border rounded px-2 py-1">
                  <option value="bar">막대그래프</option>
                  <option value="doughnut">도넛그래프</option>
                  <option value="line">라인차트</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                (카테고리별 {chartType} 그래프 자리)
              </div>
            </CardContent>
          </Card>

          {/* 카테고리별 요약 테이블 */}
          <Card>
            <CardHeader>
              <CardTitle>카테고리별 요약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2">카테고리</th>
                      <th className="px-4 py-2">총 활동 시간</th>
                      <th className="px-4 py-2">총 활동 횟수</th>
                      <th className="px-4 py-2">평균 활동 시간</th>
                      <th className="px-4 py-2">대표 세부코드</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(CATEGORIES).map(([code, cat]) => (
                      <tr key={code} className="border-t">
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2">120시간</td>
                        <td className="px-4 py-2">45회</td>
                        <td className="px-4 py-2">2.7시간</td>
                        <td className="px-4 py-2">러닝</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 카테고리 분포 차트 */}
          <Card>
            <CardHeader>
              <CardTitle>카테고리 분포</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryDistributionChart data={mockCategoryData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          {/* 체크박스 완료율 요약 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 전체 체크박스 완료율 */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    전체 체크박스 완료율
                    <Info className="w-3 h-3 text-muted-foreground" aria-label="전체 목표 중 체크된 비율입니다." tabIndex={0} />
                  </CardTitle>
                  <div className="text-xs text-muted-foreground mt-1">월간 전체 목표 달성률</div>
                </div>
                <button
                  className="text-xs flex items-center gap-1 underline text-primary hover:text-primary-foreground transition-colors"
                  onClick={() => setShowOverallEvidence(v => !v)}
                >
                  <Info className="w-3 h-3" />
                  {showOverallEvidence ? "근거 닫기" : "근거 보기"}
                </button>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">80%</div>
                <p className="text-xs text-muted-foreground">80/100 체크박스 완료</p>
                {showOverallEvidence && (
                  <div className="mt-4 border rounded p-2 bg-muted">
                    <div className="font-semibold mb-2 flex items-center gap-1">
                      <Info className="w-3 h-3" /> 체크/계획 근거
                    </div>
                    <table className="w-full text-xs border-separate border-spacing-y-1">
                      <thead className="bg-muted/60">
                        <tr>
                          <th className="px-2 py-1">날짜</th>
                          <th className="px-2 py-1">카테고리</th>
                          <th className="px-2 py-1">계획</th>
                          <th className="px-2 py-1">실행</th>
                          <th className="px-2 py-1">체크</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockCheckboxEvidence.map((row, i) => (
                          <tr key={i} className="border-b last:border-b-0">
                            <td className="px-2 py-1">{row.date}</td>
                            <td className="px-2 py-1">{row.category}</td>
                            <td className="px-2 py-1">{row.plan}</td>
                            <td className={"px-2 py-1 font-bold " + (row.executed ? "text-green-600" : "text-red-500")}>{row.executed ? "O" : "X"}</td>
                            <td className={"px-2 py-1 font-bold " + (row.checked ? "text-green-600" : "text-red-500")}>{row.checked ? "체크" : "미체크"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* 연속 체크 기록 */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    연속 체크 기록
                    <Info className="w-3 h-3 text-muted-foreground" aria-label="목표를 며칠 연속 달성했는지 나타냅니다." tabIndex={0} />
                  </CardTitle>
                  <div className="text-xs text-muted-foreground mt-1">이번 달 최장 연속 달성일</div>
                </div>
                {/* 근거 보기 버튼 생략(불필요시) */}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">7일</div>
                <p className="text-xs text-muted-foreground">목표를 7일 연속 달성했습니다.</p>
              </CardContent>
            </Card>
            {/* 미체크 항목 */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    미체크 항목
                    <Info className="w-3 h-3 text-muted-foreground" aria-label="달성하지 못한 목표 내역입니다." tabIndex={0} />
                  </CardTitle>
                  <div className="text-xs text-muted-foreground mt-1">이번 달 미달성 목표</div>
                </div>
                <button
                  className="text-xs flex items-center gap-1 underline text-primary hover:text-primary-foreground transition-colors"
                  onClick={() => setShowCategoryEvidence(prev => ({ ...prev, unchecked: !prev.unchecked }))}
                >
                  <Info className="w-3 h-3" />
                  {showCategoryEvidence.unchecked ? "근거 닫기" : "근거 보기"}
                </button>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockUncheckedEvidence.length}개</div>
                <p className="text-xs text-muted-foreground">운동, 독서 등 미체크 {mockUncheckedEvidence.length}건</p>
                {showCategoryEvidence.unchecked && (
                  <div className="mt-4 border rounded p-2 bg-muted">
                    <div className="font-semibold mb-2 flex items-center gap-1">
                      <Info className="w-3 h-3" /> 미체크 근거
                    </div>
                    <table className="w-full text-xs border-separate border-spacing-y-1">
                      <thead className="bg-muted/60">
                        <tr>
                          <th className="px-2 py-1">날짜</th>
                          <th className="px-2 py-1">카테고리</th>
                          <th className="px-2 py-1">계획</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockUncheckedEvidence.map((row, i) => (
                          <tr key={i} className="border-b last:border-b-0">
                            <td className="px-2 py-1">{row.date}</td>
                            <td className="px-2 py-1">{row.category}</td>
                            <td className="px-2 py-1">{row.plan}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 카테고리별 체크박스 현황 */}
          <Card>
            <CardHeader>
              <CardTitle>카테고리별 체크박스 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(mockCheckboxData).map(([code, data]) => {
                  const cat = categories.find(c => c.code === code);
                  const percentage = Math.round((data.completed / data.total) * 100);
                  return (
                    <div key={code} className="flex flex-col gap-1">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{cat?.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{cat?.label}</span>
                            <span className="text-sm text-muted-foreground">
                              {data.completed}/{data.total} ({percentage}%)
                            </span>
                            <button
                              className="text-xs flex items-center gap-1 underline text-primary hover:text-primary-foreground transition-colors ml-2"
                              onClick={() => toggleCategoryEvidence(code)}
                            >
                              <Info className="w-3 h-3" />
                              {showCategoryEvidence[code] ? "근거 닫기" : "근거 보기"}
                            </button>
                          </div>
                          <div className="h-2 bg-muted rounded-full">
                            <div 
                              className="h-2 bg-primary rounded-full" 
                              style={{ width: `${percentage}%` }} 
                            />
                          </div>
                        </div>
                      </div>
                      {showCategoryEvidence[code] && (
                        <div className="mt-2 border rounded p-2 bg-muted">
                          <div className="font-semibold mb-2 flex items-center gap-1">
                            <Info className="w-3 h-3" /> 체크/계획 근거
                          </div>
                          <table className="w-full text-xs border-separate border-spacing-y-1">
                            <thead className="bg-muted/60">
                              <tr>
                                <th className="px-2 py-1">날짜</th>
                                <th className="px-2 py-1">계획</th>
                                <th className="px-2 py-1">실행</th>
                                <th className="px-2 py-1">체크</th>
                              </tr>
                            </thead>
                            <tbody>
                              {mockCheckboxEvidence.filter(row => row.category === cat?.label).map((row, i) => (
                                <tr key={i} className="border-b last:border-b-0">
                                  <td className="px-2 py-1">{row.date}</td>
                                  <td className="px-2 py-1">{row.plan}</td>
                                  <td className={"px-2 py-1 font-bold " + (row.executed ? "text-green-600" : "text-red-500")}>{row.executed ? "O" : "X"}</td>
                                  <td className={"px-2 py-1 font-bold " + (row.checked ? "text-green-600" : "text-red-500")}>{row.checked ? "체크" : "미체크"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
