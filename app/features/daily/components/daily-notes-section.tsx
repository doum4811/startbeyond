import React, { useState } from 'react';
import type { FetcherWithComponents } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '~/common/components/ui/card';
import { Button } from '~/common/components/ui/button';
import { Textarea } from '~/common/components/ui/textarea';
import { Trash2, Pencil } from 'lucide-react';
import type { DailyNoteUI } from '~/features/daily/pages/daily-page'; // Adjust if DailyNoteUI is defined elsewhere or move it
// If action type is available and more specific, use it. For now, using any for fetcher.data.
// import type { action as dailyPageAction } from '~/features/daily/pages/daily-page';

interface DailyNotesSectionProps {
  currentDailyNotes: DailyNoteUI[];
  newNoteContent: string;
  setNewNoteContent: (content: string) => void;
  fetcher: FetcherWithComponents<any>; // Replace 'any' with the actual type of the action function if possible
  today: string;
  // Potentially add:
  // editingNoteId: string | null;
  // setEditingNoteId: (id: string | null) => void;
  // editedNoteContent: string;
  // setEditedNoteContent: (content: string) => void;
  // handleUpdateNote: (noteId: string) => void; 
}

export function DailyNotesSection({
  currentDailyNotes,
  newNoteContent,
  setNewNoteContent,
  fetcher,
  today,
}: DailyNotesSectionProps) {
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editedNoteContent, setEditedNoteContent] = useState<string>("");

  function handleEditClick(note: DailyNoteUI) {
    setEditingNoteId(note.id);
    setEditedNoteContent(note.content);
  }

  function handleCancelEdit() {
    setEditingNoteId(null);
    setEditedNoteContent("");
  }

  // Effect to reset editing state if the note being edited is deleted via fetcher
  // This might be needed if DailyPage's useEffect doesn't implicitly cause a re-render
  // that resets this component cleanly after a delete action from another part of the page.
  // For now, we rely on the parent component re-rendering with updated currentDailyNotes.

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>오늘의 노트</CardTitle>
      </CardHeader>
      <CardContent>
        {currentDailyNotes.length > 0 && (
          <ul className="space-y-3 mb-4">
            {currentDailyNotes.map(note => (
              <li key={note.id} className="p-3 border rounded-md bg-muted/30 flex flex-col">
                {editingNoteId === note.id ? (
                  <fetcher.Form method="post" onSubmit={() => { handleCancelEdit(); /* Optimistically clear edit state */ }} className="w-full">
                    <input type="hidden" name="intent" value="updateDailyNote" />
                    <input type="hidden" name="noteId" value={note.id} />
                    <input type="hidden" name="date" value={today} /> {/* Include date for consistency if action needs it */}
                    <Textarea
                      name="editedNoteContent"
                      value={editedNoteContent}
                      onChange={(e) => setEditedNoteContent(e.target.value)}
                      className="min-h-[80px] mb-2"
                      required
                    />
                    <div className="flex justify-end gap-2">
                      <Button 
                        type="submit" 
                        size="sm"
                        disabled={fetcher.state !== 'idle' || !editedNoteContent.trim()}
                      >
                        {fetcher.state !== 'idle' && fetcher.formData?.get('intent') === 'updateDailyNote' && fetcher.formData?.get('noteId') === note.id ? "저장중..." : "저장"}
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit}>취소</Button>
                    </div>
                  </fetcher.Form>
                ) : (
                  <div className="flex justify-between items-start w-full">
                    <p className="whitespace-pre-wrap text-sm flex-1 mr-2 py-1">{note.content}</p>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(note)} className="h-7 w-7">
                        <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </Button>
                      <fetcher.Form method="post" style={{ display: 'inline-block' }} onSubmit={(e) => {
                        if (!confirm('이 노트를 삭제하시겠습니까?')) e.preventDefault();
                      }}>
                        <input type="hidden" name="intent" value="deleteDailyNote" />
                        <input type="hidden" name="noteId" value={note.id} />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          type="submit" 
                          className="h-7 w-7" 
                          disabled={fetcher.state !== 'idle' && fetcher.formData?.get('intent') === 'deleteDailyNote' && fetcher.formData?.get('noteId') === note.id}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </fetcher.Form>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {currentDailyNotes.length === 0 && !editingNoteId && (
          <p className="text-muted-foreground text-sm mb-4">작성된 노트가 없습니다.</p>
        )}

        {!editingNoteId && (
            <fetcher.Form method="post" onSubmit={() => {/* setNewNoteContent(''); Optimistically clear after submit? */}}>
                <input type="hidden" name="intent" value="saveDailyNote" />
                <input type="hidden" name="date" value={today} />
                <Textarea
                    name="newNoteContent"
                    value={newNoteContent}
                    onChange={e => setNewNoteContent(e.target.value)}
                    placeholder="새 노트를 입력하세요..."
                    className="min-h-[80px]"
                />
                <div className="flex justify-end mt-2">
                    <Button 
                    type="submit" 
                    size="sm" 
                    disabled={(fetcher.state !== 'idle' && fetcher.formData?.get('intent') === 'saveDailyNote') || !newNoteContent.trim()}
                    >
                        {(fetcher.state !== 'idle' && fetcher.formData?.get('intent') === 'saveDailyNote') ? "저장중..." : "노트 추가"} 
                    </Button>
                </div>
            </fetcher.Form>
        )}
      </CardContent>
    </Card>
  );
} 