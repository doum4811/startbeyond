import React, { type ReactElement, useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Share2, Copy, Check, Calendar as CalendarIcon, Download } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ShareSettings {
  isPublic: boolean;
  includeRecords: boolean;
  includeDailyNotes: boolean;
  includeMemos: boolean;
  includeStats: boolean;
}

interface StatsPageHeaderProps {
  title: string;
  description?: string;
  shareSettings: ShareSettings;
  onShareSettingsChange: (key: keyof ShareSettings, value: boolean) => void;
  isShareDialogOpen: boolean;
  setIsShareDialogOpen: (open: boolean) => void;
  isCopied: boolean;
  onCopyLink: () => void;
  shareLink: string;
  pdfDocument?: ReactElement<any>;
  pdfFileName: string;
  periodButton?: React.ReactNode;
}

export function StatsPageHeader({
  title,
  description,
  shareSettings,
  onShareSettingsChange,
  isShareDialogOpen,
  setIsShareDialogOpen,
  isCopied,
  onCopyLink,
  shareLink,
  pdfDocument,
  pdfFileName,
  periodButton,
}: StatsPageHeaderProps) {
  const [isClient, setIsClient] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" /> {t("stats_header.share")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("stats_header.share_dialog.title")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="public">{t("stats_header.share_dialog.public_toggle")}</Label>
                <Switch
                  id="public"
                  checked={shareSettings.isPublic}
                  onCheckedChange={checked => onShareSettingsChange("isPublic", checked)}
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">{t("stats_header.share_dialog.select_info")}</div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="records"
                    checked={shareSettings.includeRecords}
                    onCheckedChange={checked => onShareSettingsChange("includeRecords", checked as boolean)}
                  />
                  <Label htmlFor="records">{t("stats_header.share_dialog.activity_records")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dailyNotes"
                    checked={shareSettings.includeDailyNotes}
                    onCheckedChange={checked => onShareSettingsChange("includeDailyNotes", checked as boolean)}
                  />
                  <Label htmlFor="dailyNotes">{t("stats_header.share_dialog.daily_notes")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="memos"
                    checked={shareSettings.includeMemos}
                    onCheckedChange={checked => onShareSettingsChange("includeMemos", checked as boolean)}
                  />
                  <Label htmlFor="memos">{t("stats_header.share_dialog.detailed_memos")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="stats"
                    checked={shareSettings.includeStats}
                    onCheckedChange={checked => onShareSettingsChange("includeStats", checked as boolean)}
                  />
                  <Label htmlFor="stats">{t("stats_header.share_dialog.statistics")}</Label>
                </div>
              </div>
              {shareSettings.isPublic && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("stats_header.share_dialog.share_link")}</div>
                  <div className="flex gap-2">
                    <Input
                      value={shareLink}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={onCopyLink}
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
          </DialogContent>
        </Dialog>
        {periodButton ?? (
          <Button variant="outline" size="sm">
            <CalendarIcon className="w-4 h-4 mr-2" /> {t("stats_header.select_period")}
          </Button>
        )}
        {isClient && pdfDocument && (
          <PDFDownloadLink
            document={pdfDocument}
            fileName={pdfFileName}
          >
            {({ loading }) => (
              <Button variant="outline" size="sm" disabled={loading}>
                <Download className="w-4 h-4 mr-2" />
                {loading ? t("stats_header.pdf.loading") : t("stats_header.pdf.download")}
              </Button>
            )}
          </PDFDownloadLink>
        )}
      </div>
    </div>
  );
} 