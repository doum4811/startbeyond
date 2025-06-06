import React from "react";
import { ActivityHeatmap } from "./activity-heatmap";
import { DateTime } from "luxon";
import type { CategoryCode, UICategory } from "~/common/types/daily";
import { Card } from "~/common/components/ui/card";
import type { ActivityHeatmap as ActivityHeatmapType } from "~/features/stats/queries";

interface Props {
  year: number;
  data: Record<CategoryCode, ActivityHeatmapType[]>;
  categories: UICategory[];
}

export function CategoryHeatmapGrid({ year, data, categories }: Props) {
  const startDate = DateTime.fromObject({ year }).startOf("year");
  const endDate = DateTime.fromObject({ year }).endOf("year");

  return (
    <div className="space-y-6">
      {categories.map((cat) => (
        <div key={cat.code}>
          <h3 className="text-lg font-medium mb-2 flex items-center">
            {cat.icon} <span className="ml-2">{cat.label}</span>
          </h3>
          <div className="p-1 border rounded-md overflow-x-auto">
          <ActivityHeatmap
              data={data[cat.code as CategoryCode] || []}
            startDate={startDate}
            endDate={endDate}
              compact={true}
          />
          </div>
        </div>
      ))}
    </div>
  );
} 