import React, { type ReactElement, useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Share2, Copy, Check, Calendar as CalendarIcon, Download, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SharedLink } from "~/features/stats/types";

interface StatsPageHeaderProps {
  title: string;
  description?: string;
  shareSettings: Partial<SharedLink>;
  onSettingsChange?: (settings: Partial<SharedLink>) => void;
  isShareDialogOpen: boolean;
  setIsShareDialogOpen: (open: boolean) => void;
  isCopied: boolean;
  onCopyLink: () => void;
  shareLink?: string;
  periodButton?: React.ReactNode;
  pdfButton?: React.ReactNode;
  fetcherState?: 'idle' | 'submitting' | 'loading';
}

export function StatsPageHeader({
  title,
  description,
  shareSettings,
  onSettingsChange,
  isShareDialogOpen,
  setIsShareDialogOpen,
  isCopied,
  onCopyLink,
  shareLink,
  periodButton,
  pdfButton,
  fetcherState = 'idle',
}: StatsPageHeaderProps) {
  const { t } = useTranslation();
  
  const [localSettings, setLocalSettings] = useState(shareSettings);

  useEffect(() => {
    setLocalSettings(shareSettings);
  }, [shareSettings]);

  const handleSettingChange = (key: string, value: any) => {
    setLocalSettings(prev => {
        const newSettings = { ...prev };
        if (key === 'is_public') {
            newSettings.is_public = value;
        } else {
            newSettings.settings = { ...(prev.settings || {}), [key]: value };
        }
        
        if (onSettingsChange) {
            onSettingsChange(newSettings);
        }
        return newSettings;
    });
  };

  const renderShareOptions = () => {
    const pageType = localSettings.page_type;
    if (!pageType) return <p className="text-sm text-muted-foreground">{t("stats_header.share_dialog.no_options")}</p>;

    const optionsConfig: Record<string, string[]> = {
      summary: ['include_summary', 'include_subcode_distribution'],
      advanced: ['include_heatmap', 'include_comparison'],
      category: ['include_goals']
    };

    const options = optionsConfig[pageType];

    if (!options || options.length === 0) {
      return <p className="text-sm text-muted-foreground">{t("stats_header.share_dialog.no_options")}</p>;
    }
    
    const currentSettings: { [key: string]: any } = localSettings.settings || {};

    return (
      <>
        {options.map(optionKey => (
          <div className="flex items-center space-x-2" key={optionKey}>
            <Checkbox
              id={optionKey}
              checked={!!currentSettings[optionKey]}
              onCheckedChange={checked => handleSettingChange(optionKey, checked as boolean)}
            />
            <Label htmlFor={optionKey}>{t(`stats_header.share_dialog.${optionKey}`)}</Label>
          </div>
        ))}
      </>
    );
  };
  
  const getFooterStatus = () => {
    if (fetcherState === 'submitting' || fetcherState === 'loading') {
        return (
            <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('saving')}...
            </div>
        );
    }
    return <p className="text-sm text-muted-foreground">{t('all_changes_saved')}</p>;
  };

  return (
    <div className="flex w-full flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
        {periodButton}
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Share2 className="w-4 h-4" /> {t("stats_header.share_button")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("stats_header.share_dialog.title")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="public" className="font-medium">{t("stats_header.share_dialog.public_switch_label")}</Label>
                <Switch
                  id="public"
                  checked={localSettings.is_public ?? false}
                  onCheckedChange={checked => handleSettingChange("is_public", checked)}
                />
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">{t("stats_header.share_dialog.share_options_title")}</div>
                {renderShareOptions()}
              </div>

              {localSettings.is_public && (
                <div className="space-y-2 pt-2">
                  <div className="text-sm font-medium">{t("stats_header.share_dialog.generating_link")}</div>
                  <div className="flex gap-2">
                    <Input
                      value={shareLink || t("stats_header.share_dialog.generating_link")}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={onCopyLink}
                      disabled={!shareLink || fetcherState !== 'idle'}
                    >
                      {isCopied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="sm:justify-between">
                <div>{getFooterStatus()}</div>
                <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>{t("stats_header.share_dialog.close")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {pdfButton}
      </div>
    </div>
  );
} 