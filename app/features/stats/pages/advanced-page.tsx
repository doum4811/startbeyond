// app/features/stats/pages/advanced-page.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { TimeAnalysisChart } from "~/common/components/stats/time-analysis-chart";
import { CategoryDistributionChart } from "~/common/components/stats/category-distribution-chart";
import { DateTime } from "luxon";
import { StatsPageHeader } from "~/common/components/stats/stats-page-header";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { CategoryCode } from "~/common/types/daily";
import { CategoryHeatmapGrid, type HeatmapData } from "~/common/components/stats/category-heatmap-grid";

// Mock 데이터
const mockTimeData = [
  { date: "2024-03-01", categories: { EX: 2, BK: 1, ML: 1, EM: 0, ST: 0, WK: 0, HB: 0, SL: 0, RT: 0 }, total: 4 },
  { date: "2024-03-02", categories: { EX: 1, BK: 2, ML: 0, EM: 1, ST: 0, WK: 0, HB: 0, SL: 0, RT: 0 }, total: 4 },
];

const mockCategoryData = [
  { category: "EX" as CategoryCode, count: 30, duration: 45, percentage: 35 },
  { category: "BK" as CategoryCode, count: 20, duration: 30, percentage: 25 },
  { category: "ML" as CategoryCode, count: 15, duration: 20, percentage: 20 },
  { category: "EM" as CategoryCode, count: 10, duration: 15, percentage: 15 },
  { category: "ST" as CategoryCode, count: 5, duration: 10, percentage: 5 },
];

const allCategoryCodes = ["EX", "BK", "ML", "EM", "ST", "WK", "HB", "SL", "RT"] as const;
const yearlyCategoryHeatmapData = Object.fromEntries(
  allCategoryCodes.map(code => [
    code,
    Array.from({ length: 365 }, (_, i) => ({
      date: DateTime.now().minus({ days: i }).toFormat("yyyy-MM-dd"),
      intensity: Math.random(),
      categories: {
        EX: 0, BK: 0, ML: 0, EM: 0, ST: 0, WK: 0, HB: 0, SL: 0, RT: 0,
        [code]: Math.floor(Math.random() * 3),
      }
    }))
  ])
) as Record<CategoryCode, HeatmapData[]>;

const categories = [
  { code: "EX" as CategoryCode, label: "운동", icon: "🏃" },
  { code: "BK" as CategoryCode, label: "독서", icon: "📚" },
  { code: "ML" as CategoryCode, label: "명상", icon: "🧘" },
  { code: "EM" as CategoryCode, label: "영어", icon: "🇬🇧" },
];

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

// PDF Dummy 컴포넌트 (히트맵 요약)
const AdvancedStatsPDF = () => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <View style={pdfStyles.header}>
        <Text style={pdfStyles.title}>심화 통계 (히트맵 요약)</Text>
        <Text style={pdfStyles.date}>{DateTime.now().toFormat("yyyy년 MM월")}</Text>
      </View>
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>카테고리별 연간 활동 히트맵</Text>
        <Text>카테고리별 연간 데이터 요약 (mock)</Text>
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
});

export default function AdvancedStatsPage() {
  const [shareSettings, setShareSettings] = useState<ShareSettings>(initialShareSettings);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const navigate = useNavigate();

  function handleShareSettingsChange(key: keyof ShareSettings, value: boolean) {
    setShareSettings(prev => ({ ...prev, [key]: value }));
  }
  function handleCopyLink() {
    const mockLink = "https://startbeyond.com/share/advanced/abc123";
    navigator.clipboard.writeText(mockLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 bg-background min-h-screen">
      <StatsPageHeader
        title="심화 통계 (유료)"
        description="더 자세한 통계와 분석을 위해 프리미엄으로 업그레이드하세요."
        shareSettings={shareSettings}
        onShareSettingsChange={handleShareSettingsChange}
        isShareDialogOpen={isShareDialogOpen}
        setIsShareDialogOpen={setIsShareDialogOpen}
        isCopied={isCopied}
        onCopyLink={handleCopyLink}
        shareLink="https://startbeyond.com/share/advanced/abc123"
        pdfDocument={<AdvancedStatsPDF />}
        pdfFileName={`advanced-report-${DateTime.now().toFormat("yyyy-MM")}.pdf`}
      />

        {/* 카테고리별 히트맵 그리드 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>카테고리별 연간 활동 히트맵</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryHeatmapGrid
              year={2025}
              data={yearlyCategoryHeatmapData}
              categories={categories}
            />
          </CardContent>
        </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 시간대별 분석 섹션 */}
        <Card>
          <CardHeader>
            <CardTitle>시간대별 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <TimeAnalysisChart data={mockTimeData} />
          </CardContent>
        </Card>

        {/* 카테고리 분포 섹션 */}
        <Card>
          <CardHeader>
            <CardTitle>카테고리 분포</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryDistributionChart data={mockCategoryData} />
          </CardContent>
        </Card>

        {/* 월간/주간 비교 섹션 */}
        <Card>
          <CardHeader>
            <CardTitle>월간/주간 비교</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              비교 차트 자리 (프리미엄 전용)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
