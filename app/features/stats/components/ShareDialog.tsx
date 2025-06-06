import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/common/components/ui/dialog";
import { Switch } from "~/common/components/ui/switch";
import { Label } from "~/common/components/ui/label";
import type { CategoryPageShareSettings } from "../types";
import type { CategoryCode } from "~/common/types/daily";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: CategoryPageShareSettings;
  onSettingsChange: (settings: CategoryPageShareSettings) => void;
  categoryCode: CategoryCode;
}

export function ShareDialog({ open, onOpenChange, settings, onSettingsChange, categoryCode }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>'{categoryCode}' 카테고리 공유 설정</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="showSummary">주요 통계</Label>
            <Switch
              id="showSummary"
              checked={settings.showSummary}
              onCheckedChange={(checked) => onSettingsChange({ ...settings, showSummary: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="showActivityTrend">활동 트렌드 (차트)</Label>
            <Switch
              id="showActivityTrend"
              checked={settings.showActivityTrend}
              onCheckedChange={(checked) => onSettingsChange({ ...settings, showActivityTrend: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="showGoalProgress">목표 진행 상황</Label>
            <Switch
              id="showGoalProgress"
              checked={settings.showGoalProgress}
              onCheckedChange={(checked) => onSettingsChange({ ...settings, showGoalProgress: checked })}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 