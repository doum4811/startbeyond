import { Card } from "~/common/components/ui/card";
import { type ActivityHeatmap } from "~/features/stats/queries";
import { type UICategory } from "~/common/types/daily";
import { DateTime } from "luxon";

interface Props {
  data: ActivityHeatmap[];
  categories: UICategory[];
}

export function ActivityHeatmapChart({ data, categories }: Props) {
  const activeCategories = categories.filter(c => c.isActive);
  const categoryColors = new Map(activeCategories.map(c => [c.code, c.color || '#94a3b8']));

  const weeks = data.reduce((acc, curr) => {
    const date = DateTime.fromISO(curr.date);
    const weekNumber = date.weekNumber;
    if (!acc[weekNumber]) {
      acc[weekNumber] = [];
    }
    acc[weekNumber].push(curr);
    return acc;
  }, {} as Record<number, ActivityHeatmap[]>);

  return (
    <div className="space-y-4">
      {Object.entries(weeks).map(([weekNumber, weekData]) => (
        <Card key={weekNumber} className="p-4">
          <div className="text-sm font-medium mb-2">Week {weekNumber}</div>
          <div className="grid grid-cols-7 gap-2">
            {weekData.map((day) => {
              const date = DateTime.fromISO(day.date);
              const dayOfWeek = date.weekday;
              const intensity = day.total / 24; // Assuming 24 hours is max
              const backgroundColor = `rgba(148, 163, 184, ${intensity})`;

              return (
                <div
                  key={day.date}
                  className="aspect-square rounded-md"
                  style={{ backgroundColor }}
                  title={`${date.toFormat('MM/dd')}: ${day.total} hours`}
                >
                  <div className="text-xs text-center mt-1">{date.toFormat('dd')}</div>
                  <div className="flex flex-wrap gap-1 p-1">
                    {Object.entries(day.categories).map(([code, hours]) => {
                      if (hours === 0) return null;
                      const color = categoryColors.get(code);
                      return (
                        <div
                          key={code}
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: color }}
                          title={`${code}: ${hours} hours`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
} 