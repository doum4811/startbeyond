import type { CategoryDistribution } from "../queries";
import type { CategoryCode } from "~/common/types/daily";

interface Props {
  data: CategoryDistribution[];
  categoryCode: CategoryCode;
}

export function CategoryDistributionChart({ data, categoryCode }: Props) {
  // 실제 데이터를 사용하여 차트를 그리는 로직
  const filteredData = data.filter(item => item.category === categoryCode);
  
  return (
    <div className="h-[300px] flex items-center justify-center">
      <div className="text-muted-foreground">
        {filteredData.length > 0 ? (
          <div className="space-y-4">
            <div className="text-lg font-medium">카테고리 분포</div>
            <div className="space-y-2">
              {filteredData.map((item) => (
                <div key={item.category} className="flex items-center justify-between">
                  <span>{item.category}</span>
                  <span>{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          "데이터가 없습니다"
        )}
      </div>
    </div>
  );
} 