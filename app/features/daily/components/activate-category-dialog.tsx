import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/common/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import type { DailyPlanUI } from "../types";
import type { UICategory } from "../types";

interface ActivateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planToActivate: DailyPlanUI | null;
  categories: UICategory[];
  onActivateAndAdd: () => void;
}

export function ActivateCategoryDialog({
  open,
  onOpenChange,
  planToActivate,
  categories,
  onActivateAndAdd
}: ActivateCategoryDialogProps) {
  if (!planToActivate) return null;

  const categoryToActivate = categories.find(c => c.code === planToActivate.category_code);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-500"/>
            카테고리 활성화 필요
          </AlertDialogTitle>
          <AlertDialogDescription>
            선택한 계획의 카테고리 '{categoryToActivate?.label || planToActivate.category_code}'가 현재 비활성 상태입니다.
            이 계획을 기록으로 추가하려면 먼저 카테고리를 활성화해야 합니다. 활성화하고 기록을 추가하시겠습니까?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>취소</AlertDialogCancel>
          <AlertDialogAction onClick={onActivateAndAdd}>활성화 및 추가</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 