import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { DateTime } from "luxon";
import { CATEGORIES, type CategoryCode } from "~/common/types/daily";

interface HeatmapData {
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
}

export function ActivityHeatmap({ data, startDate, endDate }: ActivityHeatmapProps) {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const weeks = Array.from({ length: Math.ceil(endDate.diff(startDate, "days").days / 7) }, (_, i) => i);

  function getIntensityColor(intensity: number) {
    if (intensity === 0) return "bg-muted";
    if (intensity < 0.25) return "bg-primary/20";
    if (intensity < 0.5) return "bg-primary/40";
    if (intensity < 0.75) return "bg-primary/60";
    return "bg-primary/80";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>활동 히트맵</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            {days.map((day) => (
              <div key={day} className="w-8 text-center text-sm text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weeks.map((week) => (
              <>
                {days.map((day, dayIndex) => {
                  const date = startDate.plus({ days: week * 7 + dayIndex });
                  const dateStr = date.toFormat("yyyy-MM-dd");
                  const dayData = data.find((d) => d.date === dateStr);
                  const intensity = dayData?.intensity || 0;

                  return (
                    <div
                      key={`${week}-${day}`}
                      className={`aspect-square rounded-sm ${getIntensityColor(intensity)}`}
                      title={`${dateStr}: ${intensity * 100}% 활동`}
                    />
                  );
                })}
              </>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-muted rounded-sm" />
              <span>없음</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-primary/20 rounded-sm" />
              <span>적음</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-primary/60 rounded-sm" />
              <span>보통</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-primary/80 rounded-sm" />
              <span>많음</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 