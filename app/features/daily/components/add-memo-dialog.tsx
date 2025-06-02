import { useState } from "react";
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
import { Input } from "~/common/components/ui/input";
import { Label } from "~/common/components/ui/label";
import { Textarea } from "~/common/components/ui/textarea";
import type { FetcherWithComponents } from "react-router";

interface AddMemoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordId: string | null;
  fetcher: FetcherWithComponents<any>;
  onSave: (title: string, content: string) => void;
}

export function AddMemoDialog({
  open,
  onOpenChange,
  recordId,
  fetcher,
  onSave
}: AddMemoDialogProps) {
  const [memoTitle, setMemoTitle] = useState("");
  const [memoContent, setMemoContent] = useState("");

  const handleSave = () => {
    if (!memoTitle.trim()) {
      alert("메모 제목을 입력해주세요.");
      return;
    }
    onSave(memoTitle, memoContent);
    setMemoTitle("");
    setMemoContent("");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>메모 추가</AlertDialogTitle>
          <AlertDialogDescription>선택한 활동에 대한 메모를 추가합니다.</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="memoTitle">제목</Label>
            <Input 
              id="memoTitle" 
              value={memoTitle} 
              onChange={(e) => setMemoTitle(e.target.value)} 
              placeholder="메모 제목" 
            />
          </div>
          <div>
            <Label htmlFor="memoContent">내용 (선택)</Label>
            <Textarea 
              id="memoContent" 
              value={memoContent} 
              onChange={(e) => setMemoContent(e.target.value)} 
              placeholder="상세 내용" 
              rows={4} 
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleSave} 
            disabled={!memoTitle.trim() || fetcher.state !== 'idle'}
          >
            저장
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 