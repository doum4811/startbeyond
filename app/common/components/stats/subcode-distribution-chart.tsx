import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import type { UICategory } from "~/common/types/daily";
import type { SubcodeDistribution } from "~/features/stats/types";

interface Props {
  data: SubcodeDistribution[];
  categories: UICategory[];
}

export function SubcodeDistributionChart({ data, categories }: Props) {
  const getCategoryInfo = (code: string) => categories.find(c => c.code === code);

  const chartData = data.map(item => ({
    ...item,
    fill: getCategoryInfo(item.category)?.color || "#8884d8",
  }));
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const categoryInfo = getCategoryInfo(item.category);
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                세부코드
              </span>
              <span className="font-bold text-muted-foreground">
                {item.subcode}
              </span>
            </div>
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
          dataKey="subcode" 
          width={80} 
          tickLine={false} 
          axisLine={false}
          tick={{ fontSize: 12 }} 
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
        <Bar dataKey="count" radius={[4, 4, 4, 4]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
} 