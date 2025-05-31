import React from 'react';
import { Button } from "~/common/components/ui/button";
import type { UICategory } from "~/common/types/daily";

interface CategorySelectorProps {
  categories: UICategory[];
  selectedCategoryCode: string | null | undefined;
  onSelectCategory: (categoryCode: string) => void;
  disabled?: boolean;
  instanceId?: string; // Optional: for ensuring unique keys if multiple selectors are on one page
}

export function CategorySelector({
  categories,
  selectedCategoryCode,
  onSelectCategory,
  disabled = false,
  instanceId = 'category-selector'
}: CategorySelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
      {categories.map((cat, index) => {
        if (!cat.isActive) return null; // Only show active categories

        return (
          <Button
            key={`${instanceId}-${cat.code}-${index}`}
            type="button"
            variant={selectedCategoryCode === cat.code ? "default" : "outline"}
            className={`w-16 h-16 flex flex-col items-center justify-center rounded-lg border shrink-0 ${
              selectedCategoryCode === cat.code ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onSelectCategory(cat.code)}
            style={{ minWidth: 64, minHeight: 64 }}
            disabled={disabled}
            title={cat.label}
          >
            <span className="text-2xl mb-1">{cat.icon || '❓'}</span>
            <span className="text-xs font-medium text-center leading-tight">{cat.label}</span>
          </Button>
        );
      })}
    </div>
  );
}

// It might be beneficial to move UICategory to a more central place if it's used by CategorySelector
// and many pages, e.g., app/common/types/categories.ts or similar.
// For now, assuming it's correctly imported from daily types. 