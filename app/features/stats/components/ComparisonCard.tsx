import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '~/common/components/ui/card';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

interface ComparisonMetric {
  label: string;
  currentValue: number;
  previousValue: number;
  unit: 'hours' | 'records';
}

function formatValue(value: number, unit: 'hours' | 'records'): string {
  if (unit === 'hours') {
    return `${value.toFixed(1)}h`;
  }
  return `${value} records`;
}

function ChangeIndicator({ change, previousValue }: { change: number; previousValue: number }) {
  const { t } = useTranslation();
  if (previousValue === 0) {
    if (change > 0) {
      return <span className="text-sm font-medium text-green-500">{t('stats_summary_page.vs_last_month_new')}</span>;
    }
    return <span className="text-sm font-medium text-muted-foreground">{t('stats_summary_page.vs_last_month_no_change')}</span>;
  }

  if (change > 0) {
    return <span className="text-sm font-medium text-green-500 flex items-center"><ArrowUp className="h-4 w-4" /> +{change.toFixed(0)}%</span>;
  }
  if (change < 0) {
    return <span className="text-sm font-medium text-red-500 flex items-center"><ArrowDown className="h-4 w-4" /> {change.toFixed(0)}%</span>;
  }
  return <span className="text-sm font-medium text-muted-foreground flex items-center"><Minus className="h-4 w-4" /></span>;
}

const ComparisonMetricDisplay: React.FC<{ metric: ComparisonMetric }> = ({ metric }) => {
  const change = metric.previousValue > 0 ? ((metric.currentValue - metric.previousValue) / metric.previousValue) * 100 : (metric.currentValue > 0 ? 100 : 0);

  return (
    <div className="flex justify-between items-center">
      <p className="font-medium">{metric.label}</p>
      <div className="text-right">
        <p className="font-bold text-lg">{formatValue(metric.currentValue, metric.unit)}</p>
        <div className="flex items-center justify-end gap-2">
          <p className="text-xs text-muted-foreground">vs {formatValue(metric.previousValue, metric.unit)}</p>
          <ChangeIndicator change={change} previousValue={metric.previousValue} />
        </div>
      </div>
    </div>
  );
};

interface ComparisonCardProps {
  title: string;
  metrics: ComparisonMetric[];
}

export const ComparisonCard: React.FC<ComparisonCardProps> = ({ title, metrics }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map(metric => <ComparisonMetricDisplay key={metric.label} metric={metric} />)}
      </CardContent>
    </Card>
  );
}; 