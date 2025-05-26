import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { CATEGORIES, type CategoryCode } from "~/common/types/daily";

interface TimeAnalysisData {
  date: string;
  categories: {
    [key in CategoryCode]: number;
  };
  total: number;
}

interface TimeAnalysisChartProps {
  data: TimeAnalysisData[];
}

export function TimeAnalysisChart({ data }: TimeAnalysisChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>시간 분석</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.date} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">{item.date}</div>
                <div className="text-sm text-muted-foreground">
                  총 {item.total}시간
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                {Object.entries(item.categories).map(([category, duration]) => (
                  <div
                    key={category}
                    className="h-full inline-block"
                    style={{
                      width: `${(duration / item.total) * 100}%`,
                      backgroundColor: getCategoryColor(category as CategoryCode),
                    }}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                {Object.entries(item.categories).map(([category, duration]) => (
                  <div key={category} className="flex items-center gap-1">
                    <span className="text-2xl">{CATEGORIES[category as CategoryCode].icon}</span>
                    <span>{duration}시간</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function getCategoryColor(category: CategoryCode) {
  const colors: Record<CategoryCode, string> = {
    EX: "#f97316", // orange-500
    BK: "#16a34a", // green-600
    ML: "#ea580c", // orange-600
    EM: "#a855f7", // purple-500
    ST: "#eab308", // yellow-500
    WK: "#0f766e", // teal-700
    HB: "#ec4899", // pink-500
    SL: "#0891b2", // cyan-600
    RT: "#3b82f6", // blue-500
  };
  return colors[category];
} 