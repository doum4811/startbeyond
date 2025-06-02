import { Button } from "~/common/components/ui/button";
import type { UICategory } from "~/common/types/daily";

interface Props {
  categories: UICategory[];
  selectedCategories: Set<string>;
  onToggleCategory: (code: string) => void;
  onClear: () => void;
}

export default function MonthlyRecordsFilter({ categories, selectedCategories, onToggleCategory, onClear }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">카테고리 필터</h4>
        {selectedCategories.size > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear}>초기화</Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {categories.map((cat) => (
          <Button
            key={cat.code}
            variant={selectedCategories.has(cat.code) ? "default" : "outline"}
            size="sm"
            className="justify-start"
            onClick={() => onToggleCategory(cat.code)}
          >
            <span className="mr-2">{cat.icon}</span>
            {cat.label}
          </Button>
        ))}
      </div>
    </div>
  );
} 