import React from "react";
import type { ReactElement } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Share2, Copy, Check, Calendar as CalendarIcon } from "lucide-react";

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
              <Share2 className="w-4 h-4 mr-2" /> 공유하기
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>통계 공유 설정</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="public">공개 설정</Label>
                <Switch
                  id="public"
                  checked={shareSettings.isPublic}
                  onCheckedChange={checked => onShareSettingsChange("isPublic", checked)}
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">공유할 정보 선택</div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="records"
                    checked={shareSettings.includeRecords}
                    onCheckedChange={checked => onShareSettingsChange("includeRecords", checked as boolean)}
                  />
                  <Label htmlFor="records">활동 기록</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dailyNotes"
                    checked={shareSettings.includeDailyNotes}
                    onCheckedChange={checked => onShareSettingsChange("includeDailyNotes", checked as boolean)}
                  />
                  <Label htmlFor="dailyNotes">일일 메모</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="memos"
                    checked={shareSettings.includeMemos}
                    onCheckedChange={checked => onShareSettingsChange("includeMemos", checked as boolean)}
                  />
                  <Label htmlFor="memos">상세 메모</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="stats"
                    checked={shareSettings.includeStats}
                    onCheckedChange={checked => onShareSettingsChange("includeStats", checked as boolean)}
                  />
                  <Label htmlFor="stats">통계</Label>
                </div>
              </div>
              {shareSettings.isPublic && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">공유 링크</div>
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
            <CalendarIcon className="w-4 h-4 mr-2" /> 기간 선택
          </Button>
        )}
        {pdfDocument && (
          <PDFDownloadLink
            document={pdfDocument}
            fileName={pdfFileName}
          >
            {({ loading }) => (
              <Button variant="outline" size="sm" disabled={loading}>
                <CalendarIcon className="w-4 h-4 mr-2" />
                {loading ? "PDF 생성 중..." : "PDF 다운로드"}
              </Button>
            )}
          </PDFDownloadLink>
        )}
      </div>
    </div>
  );
} 