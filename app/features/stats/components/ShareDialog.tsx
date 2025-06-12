import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/common/components/ui/dialog";
import { Switch } from "~/common/components/ui/switch";
import { Label } from "~/common/components/ui/label";
import type { CategoryPageShareSettings } from "../types";
import type { CategoryCode } from "~/common/types/daily";
import { useTranslation } from "react-i18next";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: CategoryPageShareSettings;
  onSettingsChange: (settings: CategoryPageShareSettings) => void;
  categoryCode: CategoryCode;
}

export function ShareDialog({ open, onOpenChange, settings, onSettingsChange, categoryCode }: Props) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("share_dialog.title", { categoryCode })}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="showSummary">{t("share_dialog.show_summary")}</Label>
            <Switch
              id="showSummary"
              checked={settings.showSummary}
              onCheckedChange={(checked) => onSettingsChange({ ...settings, showSummary: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="showActivityTrend">{t("share_dialog.show_activity_trend")}</Label>
            <Switch
              id="showActivityTrend"
              checked={settings.showActivityTrend}
              onCheckedChange={(checked) => onSettingsChange({ ...settings, showActivityTrend: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="showGoalProgress">{t("share_dialog.show_goal_progress")}</Label>
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