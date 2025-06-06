import type { ActivityHeatmap as ActivityHeatmapType } from "../queries";
import type { CategoryCode } from "~/common/types/daily";
import { DateTime } from "luxon";

interface Props {
  data: ActivityHeatmapType[];
  categoryCode: CategoryCode;
}

export function ActivityHeatmap({ data, categoryCode }: Props) {
  // 날짜별로 데이터를 그룹화
  const groupedData = data.reduce((acc, item) => {
    acc[item.date] = item.categories[categoryCode] || 0;
    return acc;
  }, {} as Record<string, number>);

  // 현재 월의 모든 날짜에 대한 데이터 생성
  const currentMonth = DateTime.now();
  const daysInMonth = currentMonth.daysInMonth;
  const monthData = Array.from({ length: daysInMonth }, (_, i) => {
    const date = currentMonth.set({ day: i + 1 }).toFormat('yyyy-MM-dd');
    return {
      date,
      count: groupedData[date] || 0
    };
  });

  return (
    <div className="h-[300px] flex items-center justify-center">
      <div className="text-muted-foreground">
        {data.length > 0 ? (
          <div className="space-y-4">
            <div className="text-lg font-medium">활동 히트맵</div>
            <div className="grid grid-cols-7 gap-1">
              {monthData.map((item) => (
                <div
                  key={item.date}
                  className={`w-8 h-8 rounded-sm flex items-center justify-center text-xs ${
                    item.count > 2
                      ? "bg-blue-600 text-white"
                      : item.count > 1
                      ? "bg-blue-500 text-white"
                      : item.count > 0
                      ? "bg-blue-400 text-white"
                      : "bg-gray-100"
                  }`}
                  title={`${item.date}: ${item.count} activities`}
                >
                  {DateTime.fromFormat(item.date, 'yyyy-MM-dd').day}
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