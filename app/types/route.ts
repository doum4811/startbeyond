import type { CategoryDistribution, ActivityHeatmap, CategorySummary } from "~/features/stats/types";

export namespace Route {
  export interface ComponentProps {
    loaderData: {
      categoryDistribution: CategoryDistribution[];
      // timeAnalysis: TimeAnalysis[ ];
      activityHeatmap: ActivityHeatmap[];
      categorySummary: CategorySummary;
    };
  }
} 