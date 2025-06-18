import React from "react";
import { DateTime } from "luxon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/common/components/ui/tooltip";
import type { HeatmapData } from "~/features/stats/types";

interface Props {
  data: HeatmapData[];
  startDate: DateTime;
  endDate: DateTime;
  compact?: boolean;
}

export function ActivityHeatmap({ data, startDate, endDate, compact = false }: Props) {
  const dayLabels = compact ? ["S", "M", "T", "W", "T", "F", "S"] : ["일", "월", "화", "수", "목", "금", "토"];
  const dataByDate = new Map(data.map(item => [item.date, item]));

  const startDay = startDate.startOf('day');
  const endDay = endDate.startOf('day');
  const totalDays = Math.floor(endDay.diff(startDay, 'days').as('days')) + 1;
  
  const startOffset = startDay.weekday % 7;
  const cells = Array.from({ length: totalDays + startOffset });

  function getIntensityColor(intensity: number) {
    if (intensity === 0) return "bg-gray-100 dark:bg-gray-800";
    if (intensity <= 0.2) return "bg-green-200 dark:bg-green-900";
    if (intensity <= 0.4) return "bg-green-400 dark:bg-green-700";
    if (intensity <= 0.6) return "bg-green-600 dark:bg-green-500";
    return "bg-green-800 dark:bg-green-400";
  }

  const cellSize = compact ? "h-3 w-3" : "h-8 w-8";
  
  const monthLabels = Array.from({ length: endDate.month - startDate.month + 1 }, (_, i) => startDate.plus({ months: i }))
    .map(monthDate => ({
      label: monthDate.toFormat('MMM'),
      startWeek: monthDate.startOf('month').weekNumber,
    }));

  return (
    <div className="flex flex-col">
       <div className="relative h-6">
        {!compact && monthLabels.map(({ label, startWeek }) => (
          <div key={label} className="absolute text-xs text-muted-foreground" style={{ left: `calc(${startWeek - startDate.weekNumber} * (theme(width.8) + theme(gap.1.5)))` }}>
            {label}
          </div>
        ))}
       </div>
        <div className="flex justify-start gap-1.5">
            <div className={`flex flex-col text-xs text-muted-foreground gap-1.5 mr-1`}>
                {dayLabels.map((label, i) => (
                    <div key={label + i} className={`${cellSize} flex items-center justify-center`}>
                        {compact ? ((i % 2) !== 0 ? label : '') : label}
                    </div>
          ))}
        </div>
            <div className="grid gap-1" style={{ gridTemplateRows: 'repeat(7, auto)', gridAutoFlow: 'column' }}>
                {cells.map((_, index) => {
                    const dayOffset = index - startOffset;
                    if (dayOffset < 0) {
                        return <div key={`empty-${index}`} className={`${cellSize} bg-transparent`} />;
                    }
                    const currentDate = startDay.plus({ days: dayOffset });
                    const dateStr = currentDate.toISODate();
                    
                    if (!dateStr || currentDate > endDay) {
                        return <div key={`empty-invalid-${index}`} className={`${cellSize} bg-transparent`} />;
                    }

                    const dayData = dataByDate.get(dateStr);
                    const intensity = dayData?.intensity ?? 0;
                return (
                        <TooltipProvider key={dateStr} delayDuration={150}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                            <div className={`${cellSize} rounded-sm ${getIntensityColor(intensity)}`} />
                            </TooltipTrigger>
                            <TooltipContent>
                            <p>{currentDate.toFormat("yyyy-MM-dd")}</p>
                            <p>활동: {dayData?.total ?? 0}</p>
                            </TooltipContent>
                        </Tooltip>
                        </TooltipProvider>
                );
              })}
        </div>
      </div>
    </div>
  );
} 