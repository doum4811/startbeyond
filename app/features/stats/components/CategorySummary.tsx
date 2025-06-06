import type { CategorySummary as CategorySummaryType } from "../queries";
import type { CategoryCode } from "~/common/types/daily";

interface Props {
  data: CategorySummaryType;
  categoryCode: CategoryCode;
}

export function CategorySummary({ data, categoryCode }: Props) {
  return (
    <div className="h-[300px] flex items-center justify-center">
      <div className="text-muted-foreground">
        {data ? (
          <div className="space-y-4">
            <div className="text-lg font-medium">카테고리 요약</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium">총 기록 수</div>
                <div className="text-2xl font-bold">{data.totalRecords}</div>
              </div>
              <div>
                <div className="text-sm font-medium">총 활동 시간</div>
                <div className="text-2xl font-bold">{data.totalDuration}분</div>
              </div>
              <div>
                <div className="text-sm font-medium">평균 활동 시간</div>
                <div className="text-2xl font-bold">{Math.round(data.averageDuration)}분</div>
              </div>
              <div>
                <div className="text-sm font-medium">가장 활발한 요일</div>
                <div className="text-2xl font-bold">{data.mostActiveDay}</div>
              </div>
            </div>
          </div>
        ) : (
          "데이터가 없습니다"
        )}
      </div>
    </div>
  );
} 