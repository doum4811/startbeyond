import { Button } from "~/common/components/ui/button";
import { Badge } from "~/common/components/ui/badge";
import { X } from "lucide-react";
import type { UICategory } from "~/common/types/daily";

interface Props {
  categories: UICategory[];
  selectedCategories: Set<string>;
  onToggleCategory: (code: string) => void;
  onClear: () => void;
}

export function MonthlyRecordsFilter({ categories, selectedCategories, onToggleCategory, onClear }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {categories.map(category => (
        <Badge
          key={category.code}
          variant={selectedCategories.has(category.code) ? "default" : "outline"}
          className={`cursor-pointer ${!category.isActive ? 'opacity-50' : ''}`}
          onClick={() => onToggleCategory(category.code)}
        >
          {category.label}
        </Badge>
      ))}
        {selectedCategories.size > 0 && (
        <Button variant="ghost" size="sm" onClick={onClear} className="ml-auto">
          <X className="h-4 w-4 mr-1" />
          초기화
        </Button>
      )}
    </div>
  );
} 