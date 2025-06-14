import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { useNavigate } from "react-router";
import type { CategoryCode, UICategory } from "~/common/types/daily";
import type { CategoryDistribution } from "~/features/stats/types";

interface Props {
  data: CategoryDistribution[];
  categories: UICategory[];
  selectedMonthISO?: string;
}

export function CategoryDistributionChart({ data, categories, selectedMonthISO }: Props) {
  const navigate = useNavigate();
  const getCategoryInfo = (code: CategoryCode) => {
    return categories.find(c => c.code === code);
  };

  const chartData = data.map(item => ({
    ...item,
    label: getCategoryInfo(item.category)?.label || item.category,
    fill: getCategoryInfo(item.category)?.color || "#8884d8",
  }));

  const handleBarClick = (payload: any) => {
    const categoryCode = payload?.category;
    if (categoryCode) {
      const targetPath = selectedMonthISO
        ? `/stats/category/${categoryCode}?month=${selectedMonthISO}`
        : `/stats/category/${categoryCode}`;
      navigate(targetPath);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const categoryInfo = getCategoryInfo(item.category);
  return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                카테고리
              </span>
              <span className="font-bold text-muted-foreground flex items-center">
                {categoryInfo?.icon} <span className="ml-1">{categoryInfo?.label}</span>
              </span>
              </div>
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                비율
              </span>
              <span className="font-bold text-muted-foreground">{item.percentage}%</span>
                </div>
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                횟수
              </span>
              <span className="font-bold">{item.count}</span>
              </div>
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                시간
              </span>
              <span className="font-bold">{(item.duration / 60).toFixed(1)}시간</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
        <XAxis type="number" hide />
        <YAxis 
          type="category" 
          dataKey="label" 
          width={80} 
          tickLine={false} 
          axisLine={false}
          tick={{ fontSize: 12 }} 
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
        <Bar dataKey="percentage" radius={[4, 4, 4, 4]} onClick={handleBarClick}>
          {chartData.map((entry) => (
            <Cell 
              key={`cell-${entry.category}`} 
              cursor="pointer" 
              fill={entry.fill}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
} 