import { DateTime } from "luxon";
import { CATEGORIES, type CategoryCode } from "~/common/types/daily";

export interface HeatmapData {
  date: string;
  intensity: number;
  categories: {
    [key in CategoryCode]: number;
  };
}

interface ActivityHeatmapProps {
  data: HeatmapData[];
  startDate: DateTime;
  endDate: DateTime;
  compact?: boolean;
}

export function ActivityHeatmap({ data, startDate, endDate, compact }: ActivityHeatmapProps) {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const totalDays = endDate.diff(startDate, "days").days + 1;
  const weeks = Array.from({ length: Math.ceil(totalDays / 7) }, (_, i) => i);

  function getIntensityColor(intensity: number) {
    if (intensity === 0) return "bg-muted";
    if (intensity < 0.25) return "bg-primary/20";
    if (intensity < 0.5) return "bg-primary/40";
    if (intensity < 0.75) return "bg-primary/60";
    return "bg-primary/80";
  }

  return (
    <div className={compact ? "overflow-x-auto pb-2" : ""}>
      <div className="flex">
        {/* 요일 라벨 */}
        <div className="flex flex-col justify-between mr-1">
          {days.map((day) => (
            <div key={day} className={`text-xs text-muted-foreground ${compact ? "h-4 w-4" : "h-8 w-8"}`}>{day}</div>
          ))}
        </div>
        {/* 히트맵 그리드 */}
        <div className="flex">
          {weeks.map((week) => (
            <div key={week} className="flex flex-col">
              {days.map((_, dayIndex) => {
                const date = startDate.plus({ days: week * 7 + dayIndex });
                if (date > endDate) return null;
                const dateStr = date.toFormat("yyyy-MM-dd");
                const dayData = data.find((d) => d.date === dateStr);
                const intensity = dayData?.intensity || 0;
                return (
                  <div
                    key={`${week}-${dayIndex}`}
                    className={`rounded-sm ${compact ? "w-4 h-4" : "w-8 h-8"} m-[1px] ${getIntensityColor(intensity)}`}
                    title={`${dateStr}: ${Math.round(intensity * 100)}% 활동`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 