// import { useFetcher } from "react-router";
// import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
// import { Button } from "~/common/components/ui/button";
// import { Textarea } from "~/common/components/ui/textarea";
// import { Trash2, Edit3 } from "lucide-react";
// import type { DailyNoteUI } from "../types";

// interface DailyNotesSectionProps {
//   currentDailyNotes: DailyNoteUI[];
//   newNoteContent: string;
//   setNewNoteContent: (content: string) => void;
//   fetcher: ReturnType<typeof useFetcher>;
//   today: string;
// }

// export function DailyNotesSection({
//   currentDailyNotes,
//   newNoteContent,
//   setNewNoteContent,
//   fetcher,
//   today
// }: DailyNotesSectionProps) {
//   const handleSaveNote = () => {
//     if (!newNoteContent.trim()) return;
//     const formData = new FormData();
//     formData.append("intent", "saveDailyNote");
//     formData.append("content", newNoteContent);
//     formData.append("date", today);
//     fetcher.submit(formData, { method: "post" });
//   };

//   const handleUpdateNote = (noteId: string, content: string) => {
//     if (!content.trim()) return;
//     const formData = new FormData();
//     formData.append("intent", "updateDailyNote");
//     formData.append("noteId", noteId);
//     formData.append("content", content);
//     formData.append("date", today);
//     fetcher.submit(formData, { method: "post" });
//   };

//   const handleDeleteNote = (noteId: string) => {
//     if (confirm("이 메모를 삭제하시겠습니까?")) {
//       const formData = new FormData();
//       formData.append("intent", "deleteDailyNote");
//       formData.append("noteId", noteId);
//       formData.append("date", today);
//       fetcher.submit(formData, { method: "post" });
//     }
//   };

//   return (
//     <Card className="mb-8">
//       <CardHeader>
//         <CardTitle>일일 메모</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <div className="space-y-4">
//           <div>
//             <fetcher.Form method="post" onSubmit={() => setNewNoteContent("")}>
//               <input type="hidden" name="intent" value="saveDailyNote" />
//               <input type="hidden" name="date" value={today} />
//               <Textarea
//                 name="newNoteContent"
//                 value={newNoteContent}
//                 onChange={e => setNewNoteContent(e.target.value)}
//                 placeholder="메모 내용을 입력하세요..."
//                 rows={4}
//               />
//               <Button
//                 type="submit"
//                 disabled={!newNoteContent.trim() || fetcher.state !== 'idle'}
//                 className="w-full"
//               >
//                 {fetcher.state !== 'idle' ? "저장 중..." : "메모 추가"}
//               </Button>
//             </fetcher.Form>
//           </div>

//           {currentDailyNotes.length > 0 && (
//             <div className="space-y-4">
//               {currentDailyNotes.map((note) => (
//                 <div key={note.id} className="p-4 border rounded-lg dark:border-gray-700">
//                   <div className="flex justify-between items-start mb-2">
//                     <div className="text-sm text-gray-500 dark:text-gray-400">
//                       {note.created_at ? new Date(note.created_at).toLocaleTimeString() : 'N/A'}
//                     </div>
//                     <div className="flex space-x-2">
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleUpdateNote(note.id, note.content)}
//                         disabled={fetcher.state !== 'idle'}
//                       >
//                         <Edit3 className="w-4 h-4" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleDeleteNote(note.id)}
//                         disabled={fetcher.state !== 'idle'}
//                       >
//                         <Trash2 className="w-4 h-4 text-red-500" />
//                       </Button>
//                     </div>
//                   </div>
//                   <p className="whitespace-pre-wrap">{note.content}</p>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </CardContent>
//     </Card>
//   );
// } 

import { useState } from "react";
import { useFetcher } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Button } from "~/common/components/ui/button";
import { Textarea } from "~/common/components/ui/textarea";
import { Trash2 } from "lucide-react";
import type { DailyNoteUI } from "../types";

interface DailyNotesSectionProps {
  /** 현재 보여줄 일일 메모 배열 (undefined 방지를 위해 기본값을 빈 배열로 함) */
  currentDailyNotes?: DailyNoteUI[];
  today: string;
}

export function DailyNotesSection({
  currentDailyNotes = [],   // 기본값 빈 배열
  today
}: DailyNotesSectionProps) {
  const fetcher = useFetcher();
  const [newNoteContent, setNewNoteContent] = useState("");

  /** 새 메모 저장 */
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    if (!newNoteContent.trim()) {
      e.preventDefault();
      return;
    }
    // The form will be submitted by the browser.
    // We just clear the state after submission is initiated.
    setNewNoteContent("");
  };

  return (
    <Card className="mb-8">
      <CardHeader><CardTitle>일일 메모</CardTitle></CardHeader>
      <CardContent>
        {/* 입력 폼 */}
        <fetcher.Form
          method="post"
          onSubmit={handleSubmit}
        >
          <input type="hidden" name="intent" value="saveDailyNote" />
          <input type="hidden" name="date" value={today} />

          <Textarea
            name="newNoteContent"
            value={newNoteContent}
            onChange={e => setNewNoteContent(e.target.value)}
            placeholder="메모 내용을 입력하세요..."
            rows={4}
          />

          <Button
            type="submit"
            disabled={!newNoteContent.trim() || fetcher.state !== "idle"}
            className="w-full mt-2"
          >
            {fetcher.state === "submitting" ? "저장 중…" : "메모 추가"}
          </Button>
        </fetcher.Form>

        {/* 기존 메모 리스트 */}
        {currentDailyNotes.length > 0 && (
          <div className="space-y-4 mt-6">
            {currentDailyNotes.map(note => (
              <div key={note.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm text-gray-500">
                    {note.created_at
                      ? new Date(note.created_at).toLocaleTimeString()
                      : "N/A"}
                  </div>

                  <div className="flex space-x-2">
                    {/* 삭제 */}
                    <fetcher.Form method="post">
                       <input type="hidden" name="intent" value="deleteDailyNote"/>
                       <input type="hidden" name="noteId" value={note.id}/>
                       <Button
                         variant="ghost"
                         size="icon"
                         type="submit"
                         onClick={(e) => {
                            if (!confirm("이 메모를 삭제하시겠습니까?")) {
                                e.preventDefault();
                            }
                         }}
                         disabled={fetcher.state !== "idle"}
                       >
                         <Trash2 className="w-4 h-4 text-red-500" />
                       </Button>
                    </fetcher.Form>
                  </div>
                </div>

                <p className="whitespace-pre-wrap">{note.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
