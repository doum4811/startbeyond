import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";

export default function StatsPage() {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4 pt-16 bg-background min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Stats</h1>
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">통계별 탭/필터/차트</h2>
        <div className="rounded border p-4 text-muted-foreground">여기에 통계별 탭/필터/차트 UI가 들어갑니다.</div>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">카테고리별, subcode별, 기간별 등</h2>
        <div className="rounded border p-4 text-muted-foreground">여기에 카테고리별, subcode별, 기간별 통계 UI가 들어갑니다.</div>
      </div>
    </div>
  );
} 