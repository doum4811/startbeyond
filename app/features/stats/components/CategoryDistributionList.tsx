import type { UICategory } from "~/common/types/daily";
import type { CategoryDistribution } from "../types";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  data: CategoryDistribution[];
  categories: UICategory[];
}

function formatDuration(minutes: number, t: (key: string) => string): string {
  if (minutes < 60) {
    return `${minutes}${t("category_distribution_list.time_unit_minutes")}`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}${t("category_distribution_list.time_unit_hours")}`;
  }
  return `${hours}${t("category_distribution_list.time_unit_hours")} ${remainingMinutes}${t("category_distribution_list.time_unit_minutes")}`;
}

export function CategoryDistributionList({ data, categories }: Props) {
  const { t } = useTranslation();
  const totalDuration = useMemo(() => data.reduce((sum, item) => sum + item.duration, 0), [data]);

  const getCategoryInfo = (code: string) => {
    return categories.find(c => c.code === code) || { label: code, icon: '📊' };
  };

  if (!data || data.length === 0) {
    return <p className="text-center text-muted-foreground pt-12">{t("category_distribution_list.no_data")}</p>;
  }

  return (
    <div className="space-y-4">
      {data.map((item) => {
        const categoryInfo = getCategoryInfo(item.category);
        const percentage = totalDuration > 0 ? (item.duration / totalDuration) * 100 : 0;
        return (
          <div key={item.category} className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 font-medium">
                <span className="text-lg">{categoryInfo.icon}</span>
                <span>{categoryInfo.label}</span>
              </div>
              <div className="text-muted-foreground">
                <span className="font-semibold">{formatDuration(item.duration, t)}</span> ({item.count}{t("category_distribution_list.count_unit")})
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary" 
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
} 