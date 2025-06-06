import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Input } from "~/common/components/ui/input";
import { Button } from "~/common/components/ui/button";
import { Search, X } from "lucide-react";
import { Badge } from "~/common/components/ui/badge";
import type { UICategory } from "~/common/types/daily";
import type { DailyRecordUI } from "~/features/daily/types";

interface Props {
  records: DailyRecordUI[];
  categories: UICategory[];
  onSearch: (query: string, selectedCategories: Set<string>) => void;
}

export function SearchRecords({ records, categories, onSearch }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  function handleSearch() {
    onSearch(searchQuery, selectedCategories);
  }

  function handleClear() {
    setSearchQuery("");
    setSelectedCategories(new Set());
    onSearch("", new Set());
  }

  function toggleCategory(code: string) {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(code)) {
      newSelected.delete(code);
    } else {
      newSelected.add(code);
    }
    setSelectedCategories(newSelected);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>기록 검색</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="키워드 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button variant="outline" onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              검색
            </Button>
            <Button variant="outline" onClick={handleClear}>
              <X className="w-4 h-4 mr-2" />
              초기화
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category.code}
                variant={selectedCategories.has(category.code) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleCategory(category.code)}
              >
                {category.icon} {category.label}
              </Badge>
            ))}
          </div>

          {records.length > 0 && (
            <div className="space-y-2">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="p-3 rounded-lg border bg-card text-card-foreground"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {categories.find((c) => c.code === record.category_code)?.icon}{" "}
                        {categories.find((c) => c.code === record.category_code)?.label}
                      </Badge>
                      {record.subcode && (
                        <Badge variant="secondary">{record.subcode}</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {record.date}
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm">{record.comment}</p>
                    {record.duration && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {record.duration}분
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 