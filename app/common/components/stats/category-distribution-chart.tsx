import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { CATEGORIES, type CategoryCode } from "~/common/types/daily";

interface CategoryDistribution {
  category: CategoryCode;
  count: number;
  duration: number;
  percentage: number;
}

interface CategoryDistributionChartProps {
  data: CategoryDistribution[];
}

export function CategoryDistributionChart({ data }: CategoryDistributionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>카테고리별 분포</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.category} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{CATEGORIES[item.category].icon}</span>
                <span>{CATEGORIES[item.category].label}</span>
              </div>
              <div className="text-right">
                <div className="font-medium">{item.percentage}%</div>
                <div className="text-sm text-muted-foreground">
                  {item.count}회 / {item.duration}시간
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 