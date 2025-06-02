import { useFetcher } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Button } from "~/common/components/ui/button";
import { Plus, CheckCircle, Bell } from "lucide-react";
import type { DailyPlanUI } from "../types";
import type { UICategory } from "../types";
import { getCategoryColor } from "../utils";
import { isValidCategoryCode } from "../utils";

interface PlanBannerProps {
  plans: DailyPlanUI[];
  addedPlanIds: Set<string>;
  categories: UICategory[];
  setShowActivateCategoryDialog: (show: boolean) => void;
  setPlanToActivate: (plan: DailyPlanUI | null) => void;
  onAddAll: () => void;
  isAddingAll: boolean;
}

export function PlanBanner({
  plans,
  addedPlanIds,
  categories,
  setShowActivateCategoryDialog,
  setPlanToActivate,
  onAddAll,
  isAddingAll
}: PlanBannerProps) {
  const fetcher = useFetcher(); 

  if (!plans || plans.length === 0) {
    return (
      <Card className="mb-4 bg-slate-50 dark:bg-slate-800">
        <CardContent className="pt-6">
          <p className="text-sm text-slate-600 dark:text-slate-400">오늘 예정된 계획이 없습니다.</p>
        </CardContent>
      </Card>
    );
  }
  
  const activePlanCategories = categories.filter(c => c.isActive);

  const handleAddFromPlan = (plan: DailyPlanUI) => {
    const categoryIsValid = isValidCategoryCode(plan.category_code, activePlanCategories);
    if (!categoryIsValid) {
      setPlanToActivate(plan);
      setShowActivateCategoryDialog(true);
    } else {
      const formData = new FormData();
      formData.append("intent", "addRecordFromPlan");
      formData.append("planId", plan.id);
      formData.append("planCategoryCode", plan.category_code);
      formData.append("planDuration", plan.duration ? String(plan.duration) : "");
      formData.append("planComment", plan.comment || "");
      formData.append("planSubcode", plan.subcode || "");
      formData.append("date", plan.plan_date);
      fetcher.submit(formData, { method: "post" });
    }
  };
  
  const unaddedPlans = plans.filter(p => !addedPlanIds.has(p.id));

  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Bell className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
          오늘의 계획 ({unaddedPlans.length}개 남음)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {unaddedPlans.length > 0 ? (
          <>
            <ul className="space-y-2">
              {unaddedPlans.map((plan) => {
                const planCategory = categories.find(c => c.code === plan.category_code);
                const categoryColor = getCategoryColor(planCategory, plan.category_code);
                return (
                  <li key={plan.id} className="flex justify-between items-center p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors">
                    <div className="flex-1">
                      <span className={`font-semibold ${categoryColor}`}>{planCategory?.label || plan.category_code}</span>:{" "}
                      {plan.comment}
                      {plan.duration != null && <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({plan.duration}분)</span>}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAddFromPlan(plan)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      disabled={addedPlanIds.has(plan.id) || fetcher.state !== 'idle'}
                    >
                      {fetcher.state !== 'idle' && fetcher.formData?.get('planId') === plan.id ? "추가중..." : <><Plus className="w-4 h-4 mr-1" /> 추가</>}
                    </Button>
                  </li>
                );
              })}
            </ul>
            {plans.length > 1 && unaddedPlans.length > 0 && (
              <div className="mt-4 text-right">
                <Button 
                  onClick={onAddAll} 
                  disabled={isAddingAll || unaddedPlans.length === 0 || fetcher.state !== 'idle'}
                  variant="outline"
                  size="sm"
                >
                  {isAddingAll ? "추가 중..." : `남은 계획 모두 추가 (${unaddedPlans.length}개)`}
                </Button>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-700 dark:text-slate-300 py-2">모든 계획이 기록으로 추가되었습니다! <CheckCircle className="inline w-4 h-4 ml-1 text-green-600 dark:text-green-400" /></p>
        )}
      </CardContent>
    </Card>
  );
} 