import React, { type ReactElement, useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "../ui/dialog";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Share2, Copy, Check, Calendar as CalendarIcon, Download, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SharedLink } from "~/features/stats/types";
import { type Fetcher } from "react-router";
import { DateTime } from "luxon";

type PageType = 'summary' | 'advanced' | 'category' | 'records';

interface StatsPageHeaderProps {
  title: string;
  description?: string;
  periodButton?: React.ReactNode;
  actionButton?: React.ReactNode;
  pdfButton?: React.ReactNode;
  shareSettings: Partial<SharedLink> & { page_type: PageType, period: string };
  onSettingsChange: (settings: Partial<SharedLink>) => void;
  isShareDialogOpen: boolean;
  setIsShareDialogOpen: (isOpen: boolean) => void;
  isCopied: boolean;
  onCopyLink: () => void;
  shareLink?: string;
  fetcherState: 'idle' | 'submitting' | 'loading';
}

export function StatsPageHeader({
  title,
  description,
  periodButton,
  actionButton,
  pdfButton,
  shareSettings,
  onSettingsChange,
  isShareDialogOpen,
  setIsShareDialogOpen,
  isCopied,
  onCopyLink,
  shareLink,
  fetcherState,
}: StatsPageHeaderProps) {
  const { t } = useTranslation();

  const handleSwitchChange = (checked: boolean) => {
    onSettingsChange({
      ...shareSettings,
      is_public: checked,
    });
  };
  
  const handleCheckboxChange = (key: string, checked: boolean) => {
      const newSettings = {
          ...(shareSettings.settings || {}),
          [key]: checked,
      };
      onSettingsChange({
          ...shareSettings,
          settings: newSettings,
      });
  };
  
  const getDialogTitle = () => {
    const { page_type, period } = shareSettings;
    switch (page_type) {
        case 'summary':
            return t('share_dialog.title_summary');
        case 'advanced':
            return t('share_dialog.title_advanced', { year: period });
        case 'category':
            const monthName = DateTime.fromFormat(period, 'yyyy-MM').toFormat('MMMM yyyy');
            return t('share_dialog.title_category', { month: monthName });
        case 'records':
             const [start, end] = period.split('_');
             const range = `${DateTime.fromISO(start).toFormat('yyyy-MM-dd')} ~ ${DateTime.fromISO(end).toFormat('yyyy-MM-dd')}`;
            return t('share_dialog.title_records', { range });
        default:
            return t('share_dialog.title', { period });
    }
  };

  const getShareOptions = () => {
    switch (shareSettings.page_type) {
        case 'summary':
            return ['include_summary', 'include_subcode_distribution'];
        case 'advanced':
            return ['include_heatmap', 'include_comparison'];
        case 'category':
            return ['include_goals'];
        case 'records':
            return ['include_notes', 'include_records_list'];
        default:
            return [];
    }
  };
  
  const shareOptions = getShareOptions();

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
        <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2">
        {periodButton}
            {actionButton}
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Share2 className="w-4 h-4" />
                        {t("stats_header.share")}
            </Button>
          </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                        <DialogTitle>{getDialogTitle()}</DialogTitle>
                        <DialogDescription>{t('share_dialog.description')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <Label htmlFor="make-public" className="font-semibold">{t('share_dialog.make_public')}</Label>
                <Switch
                                id="make-public"
                                checked={shareSettings.is_public || false}
                                onCheckedChange={handleSwitchChange}
                />
              </div>

                        {shareSettings.is_public && (
                            <div className="space-y-4 rounded-lg border p-4">
                                <Label className="font-semibold">{t('share_dialog.include_in_share')}</Label>
              <div className="space-y-2">
                                    {shareOptions.map(optionKey => (
                                        <div key={optionKey} className="flex items-center justify-between">
                                            <Label htmlFor={optionKey} className="font-normal">
                                                {t(`share_dialog.options.${optionKey}`)}
                                            </Label>
                                            <Switch
                                                id={optionKey}
                                                checked={!!(shareSettings.settings as Record<string, any>)?.[optionKey]}
                                                onCheckedChange={(checked) => handleCheckboxChange(optionKey, checked)}
                  />
                </div>
                                    ))}
                </div>
              </div>
                        )}
                        
                        {shareSettings.is_public && shareLink && (
                            <div className="flex w-full items-center space-x-2">
                                <Input value={shareLink} readOnly />
                                <Button type="button" size="icon" onClick={onCopyLink}>
                                    {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
              )}
            </div>
                    <DialogFooter>
                        <div className="w-full text-sm text-muted-foreground">
                            {fetcherState === 'submitting' || fetcherState === 'loading'
                                ? t('share_dialog.saving')
                                : t('share_dialog.saved')}
                        </div>
                        <Button type="button" variant="secondary" onClick={() => setIsShareDialogOpen(false)}>
                            {t('share_dialog.close')}
                        </Button>
                    </DialogFooter>
          </DialogContent>
        </Dialog>
        {pdfButton}
        </div>
      </div>
    </div>
  );
} 