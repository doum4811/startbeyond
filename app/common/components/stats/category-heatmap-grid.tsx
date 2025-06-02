import React from "react";
import { ActivityHeatmap } from "./activity-heatmap";
import { DateTime } from "luxon";
import type { CategoryCode } from "~/common/types/daily";

export interface HeatmapData {
  date: string; // yyyy-MM-dd
  intensity: number;
  categories: {
    [key in CategoryCode]: number;
  };
}

interface CategoryInfo {
  code: CategoryCode;
  label: string;
  icon: string;
}

interface CategoryHeatmapGridProps {
  year: number;
  data: Record<CategoryCode, HeatmapData[]>;
  categories: CategoryInfo[];
}

export function CategoryHeatmapGrid({ year, data, categories }: CategoryHeatmapGridProps) {
  const startDate = DateTime.fromObject({ year, month: 1, day: 1 });
  const endDate = DateTime.fromObject({ year, month: 12, day: 31 });

  return (
    <div className="space-y-4">
      <div className="text-3xl font-bold mb-2">{year}</div>
      {categories.map((cat) => (
        <div key={cat.code} className="mb-2">
          <div className="flex items-center mb-1">
            <span className="text-xl mr-2">{cat.icon}</span>
            <span className="font-semibold text-base">{cat.label}</span>
          </div>
          <ActivityHeatmap
            data={data[cat.code] || []}
            startDate={startDate}
            endDate={endDate}
            compact
          />
        </div>
      ))}
    </div>
  );
} 