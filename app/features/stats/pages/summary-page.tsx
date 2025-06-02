// app/features/stats/pages/summary-page.tsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { CategoryDistributionChart } from "~/common/components/stats/category-distribution-chart";
import { DateTime } from "luxon";
import { StatsPageHeader } from "~/common/components/stats/stats-page-header";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { CategoryCode } from "~/common/types/daily";

// Mock 데이터
const mockCategoryData = [
  { category: "EX" as CategoryCode, count: 30, duration: 45, percentage: 35 },
  { category: "BK" as CategoryCode, count: 20, duration: 30, percentage: 25 },
  { category: "ML" as CategoryCode, count: 15, duration: 20, percentage: 20 },
  { category: "EM" as CategoryCode, count: 10, duration: 15, percentage: 15 },
  { category: "ST" as CategoryCode, count: 5, duration: 10, percentage: 5 },
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

// PDF Dummy 컴포넌트
const MonthlyReportPDF = ({ data }: { data: typeof mockCategoryData }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <View style={pdfStyles.header}>
        <Text style={pdfStyles.title}>월간 활동 보고서 (요약)</Text>
        <Text style={pdfStyles.date}>{DateTime.now().toFormat("yyyy년 MM월")}</Text>
      </View>
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>카테고리 분포 요약</Text>
        <Text>총 카테고리 항목: {data.length}개</Text>
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

export default function SummaryStatsPage() {
  const [shareSettings, setShareSettings] = useState<ShareSettings>(initialShareSettings);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  function handleShareSettingsChange(key: keyof ShareSettings, value: boolean) {
    setShareSettings(prev => ({ ...prev, [key]: value }));
  }

  function handleCopyLink() {
    const mockLink = "https://startbeyond.com/share/summary/abc123";
    navigator.clipboard.writeText(mockLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 bg-background min-h-screen">
      <StatsPageHeader
        title="월간 요약 (무료)"
        description="이 페이지는 무료로 제공되는 요약 통계입니다."
        shareSettings={shareSettings}
        onShareSettingsChange={handleShareSettingsChange}
        isShareDialogOpen={isShareDialogOpen}
        setIsShareDialogOpen={setIsShareDialogOpen}
        isCopied={isCopied}
        onCopyLink={handleCopyLink}
        shareLink="https://startbeyond.com/share/summary/abc123"
        pdfDocument={<MonthlyReportPDF data={mockCategoryData} />}
        pdfFileName={`summary-report-${DateTime.now().toFormat("yyyy-MM")}.pdf`}
      />

      {/* 카드 요약 영역 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">총 기록 수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">총 활동 시간</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">234시간</div>
            <p className="text-xs text-muted-foreground">+12.3% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">목표 달성률</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">대표 카테고리</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">운동</div>
            <p className="text-xs text-muted-foreground">전체의 35%</p>
          </CardContent>
        </Card>
      </div>

      {/* 카테고리 분포 차트 */}
      <Card>
        <CardHeader>
          <CardTitle>카테고리별 분포</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryDistributionChart data={mockCategoryData} />
        </CardContent>
      </Card>
    </div>
  );
}
