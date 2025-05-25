import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Textarea } from "~/common/components/ui/textarea";
import { CATEGORIES, type CategoryCode } from "~/common/types/daily";
import type { Route } from "~/common/types";
import { Link } from "react-router";
import { Calendar as CalendarIcon } from "lucide-react";

interface WeeklyTask {
  id: string;
  category_code: CategoryCode;
  subcode?: string;
  comment: string;
  days: Record<string, boolean>;
  isLocked: boolean;
  fromMonthlyGoal?: boolean;
}

interface WeeklyPlanState {
  tasks: WeeklyTask[];
  criticalSuccessFactor: string;
  weeklySee: string;
  wordsOfPraise: string;
  weeklyGoalNote: string;
}

interface MonthlyGoal {
  id: string;
  category: CategoryCode;
  title: string;
  weeklyBreakdown: {
    week1: string;
    week2: string;
    week3: string;
    week4: string;
  };
}

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
const DEFAULT_CATEGORY: CategoryCode = "EX";

function getWeekRange(date = new Date()) {
  const day = date.getDay() || 7; // 일요일=0 → 7
  const monday = new Date(date);
  monday.setDate(date.getDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const format = (d: Date) =>
    `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${['일','월','화','수','목','금','토'][d.getDay()]})`;
  return `${format(monday)} ~ ${format(sunday)}`;
}

function getCurrentWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const diff = now.getTime() - start.getTime();
  const weekNumber = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.min(Math.max(weekNumber, 1), 4); // 1-4 사이의 값 반환
}

export default function WeeklyPlanPage() {
  const [state, setState] = useState<WeeklyPlanState>({
    tasks: [],
    criticalSuccessFactor: "",
    weeklySee: "",
    wordsOfPraise: "",
    weeklyGoalNote: "",
  });
  const [newTaskCategory, setNewTaskCategory] = useState<CategoryCode>(DEFAULT_CATEGORY);
  const [newTaskSubcode, setNewTaskSubcode] = useState("");
  const [newTaskComment, setNewTaskComment] = useState("");
  const [savedNotes, setSavedNotes] = useState({
    criticalSuccessFactor: "",
    wordsOfPraise: "",
    weeklyGoalNote: "",
  });
  const [showMonthlyPlans, setShowMonthlyPlans] = useState(true);
  const [addedMonthlyTaskIds, setAddedMonthlyTaskIds] = useState<Set<string>>(new Set());
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskComment, setEditTaskComment] = useState("");
  const [editTaskSubcode, setEditTaskSubcode] = useState("");
  const [editTaskCategory, setEditTaskCategory] = useState<CategoryCode>(DEFAULT_CATEGORY);

  // Mock monthly goals (would come from loader in real app)
  const [monthlyGoals] = useState<MonthlyGoal[]>([
    {
      id: "1",
      category: "EX",
      title: "운동 습관 만들기",
      weeklyBreakdown: {
        week1: "주 3회 러닝 30분",
        week2: "주 4회 러닝 30분",
        week3: "주 4회 러닝 40분",
        week4: "주 5회 러닝 40분",
      },
    },
    {
      id: "2",
      category: "BK",
      title: "독서 습관 만들기",
      weeklyBreakdown: {
        week1: "하루 30분 독서",
        week2: "하루 45분 독서",
        week3: "하루 1시간 독서",
        week4: "하루 1시간 30분 독서",
      },
    },
  ]);

  const currentWeek = getCurrentWeekNumber();

  function handleAddTask() {
    if (!newTaskComment.trim()) return;
    setState(s => ({
      ...s,
      tasks: [
        ...s.tasks,
        {
          id: Math.random().toString(36).slice(2),
          category_code: newTaskCategory,
          subcode: newTaskSubcode,
          comment: newTaskComment,
          days: Object.fromEntries(DAYS.map(day => [day, false])),
          isLocked: false
        }
      ]
    }));
    setNewTaskCategory(DEFAULT_CATEGORY);
    setNewTaskSubcode("");
    setNewTaskComment("");
  }

  function handleTaskDayToggle(taskId: string, day: string) {
    setState(s => ({
      ...s,
      tasks: s.tasks.map(t =>
        t.id === taskId ? { ...t, days: { ...t.days, [day]: !t.days[day] } } : t
      )
    }));
  }

  function handleTaskLockToggle(taskId: string) {
    setState(s => ({
      ...s,
      tasks: s.tasks.map(t =>
        t.id === taskId ? { ...t, isLocked: !t.isLocked } : t
      )
    }));
  }

  function handleTaskDelete(taskId: string) {
    setState(s => ({ ...s, tasks: s.tasks.filter(t => t.id !== taskId) }));
    setAddedMonthlyTaskIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(taskId);
      return newSet;
    });
  }

  function handleSaveNotes(e: React.FormEvent) {
    e.preventDefault();
    setSavedNotes({
      criticalSuccessFactor: state.criticalSuccessFactor,
      wordsOfPraise: state.wordsOfPraise,
      weeklyGoalNote: state.weeklyGoalNote,
    });
  }

  function handleAddMonthlyTask(goal: MonthlyGoal) {
    if (addedMonthlyTaskIds.has(goal.id)) return;
    const newTask: WeeklyTask = {
      id: Math.random().toString(36).slice(2),
      category_code: goal.category,
      comment: goal.weeklyBreakdown[`week${currentWeek}` as keyof typeof goal.weeklyBreakdown],
      days: Object.fromEntries(DAYS.map(day => [day, false])),
      isLocked: false,
      fromMonthlyGoal: true
    };
    setState(s => ({
      ...s,
      tasks: [newTask, ...s.tasks]
    }));
    setAddedMonthlyTaskIds(prev => new Set(prev).add(goal.id));
  }

  function handleAddAllMonthlyTasks() {
    monthlyGoals.forEach(goal => {
      if (!addedMonthlyTaskIds.has(goal.id)) {
        handleAddMonthlyTask(goal);
      }
    });
  }

  function handleEditTask(task: WeeklyTask) {
    setEditingTaskId(task.id);
    setEditTaskComment(task.comment);
    setEditTaskSubcode(task.subcode || "");
    setEditTaskCategory(task.category_code);
  }

  function handleEditTaskSave(taskId: string) {
    setState(s => ({
      ...s,
      tasks: s.tasks.map(t =>
        t.id === taskId
          ? {
              ...t,
              category_code: editTaskCategory,
              subcode: editTaskSubcode,
              comment: editTaskComment,
            }
          : t
      )
    }));
    setEditingTaskId(null);
  }

  function handleEditTaskCancel() {
    setEditingTaskId(null);
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 pt-16 bg-background min-h-screen">
      <div className="flex justify-center mb-4">
        <div className="text-xl font-bold text-center">{getWeekRange()}</div>
      </div>
      <div className="flex flex-col gap-4">
        {showMonthlyPlans && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>월간 목표의 {currentWeek}주차 계획</CardTitle>
                  <div className="text-sm text-muted-foreground">월간 목표에서 설정한 이번 주 계획입니다</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowMonthlyPlans(false)}>접기</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyGoals.map(goal => (
                  <div key={goal.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{CATEGORIES[goal.category].icon}</span>
                      <div>
                        <div className="font-medium">{goal.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {goal.weeklyBreakdown[`week${currentWeek}` as keyof typeof goal.weeklyBreakdown]}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant={addedMonthlyTaskIds.has(goal.id) ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => handleAddMonthlyTask(goal)}
                      disabled={addedMonthlyTaskIds.has(goal.id)}
                    >
                      {addedMonthlyTaskIds.has(goal.id) ? "추가됨" : "추가"}
                    </Button>
                  </div>
                ))}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddAllMonthlyTasks}
                    disabled={monthlyGoals.every(g => addedMonthlyTaskIds.has(g.id))}
                  >
                    모두 추가
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>할 일(Task)</CardTitle></CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-2 mb-4"
              onSubmit={e => { e.preventDefault(); handleAddTask(); }}
            >
              <div className="flex gap-2 items-center">
                <div className="flex gap-1 overflow-x-auto no-scrollbar">
                  {Object.entries(CATEGORIES).map(([code, cat]) => (
                    <Button
                      key={code}
                      type="button"
                      variant={newTaskCategory === code ? "default" : "outline"}
                      className={`w-10 h-10 flex flex-col items-center justify-center rounded-lg border ${newTaskCategory === code ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setNewTaskCategory(code as CategoryCode)}
                      style={{ minWidth: 64, minHeight: 64 }}
                    >
                      <span className="text-2xl mb-1">{cat.icon}</span>
                      <span className="text-xs font-medium text-center leading-tight">{cat.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTaskSubcode}
                  onChange={e => setNewTaskSubcode(e.target.value)}
                  placeholder="세부코드(subcode)"
                  className="w-32"
                />
                <Input
                  value={newTaskComment}
                  onChange={e => setNewTaskComment(e.target.value)}
                  placeholder="Task (comment)"
                  className="flex-1"
                />
                <Button type="submit">Add</Button>
              </div>
            </form>
            <div className="overflow-x-auto">
              <table className="min-w-full text-base">
                <thead>
                  <tr>
                    <th className="py-1 px-2 text-left">Code</th>
                    <th className="py-1 px-2 text-left">Subcode</th>
                    <th className="py-1 px-2 text-left">Task (Comment)</th>
                    {DAYS.map(day => (
                      <th key={day} className="py-1 px-2 text-center">{day}</th>
                    ))}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {state.tasks.map(task => (
                    <tr key={task.id}>
                      <td className="py-1 px-2 text-center">
                        {editingTaskId === task.id && !task.fromMonthlyGoal ? (
                          <div className="flex gap-1 overflow-x-auto no-scrollbar">
                            {Object.entries(CATEGORIES).map(([code, cat]) => (
                              <Button
                                key={code}
                                type="button"
                                variant={editTaskCategory === code ? "default" : "outline"}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg border ${editTaskCategory === code ? 'ring-2 ring-primary' : ''}`}
                                onClick={() => setEditTaskCategory(code as CategoryCode)}
                                style={{ minWidth: 32, minHeight: 32 }}
                              >
                                <span className="text-xl">{cat.icon}</span>
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xl">{CATEGORIES[task.category_code].icon}</span>
                        )}
                      </td>
                      <td className="py-1 px-2 text-muted-foreground">
                        {editingTaskId === task.id ? (
                          <Input
                            value={editTaskSubcode}
                            onChange={e => setEditTaskSubcode(e.target.value)}
                            placeholder="세부코드"
                            className="w-32"
                          />
                        ) : (
                          task.subcode || '-'
                        )}
                      </td>
                      <td className="py-1 px-2">
                        {editingTaskId === task.id ? (
                          <Input
                            value={editTaskComment}
                            onChange={e => setEditTaskComment(e.target.value)}
                            placeholder="Task (comment)"
                            className="flex-1"
                          />
                        ) : (
                          task.comment
                        )}
                      </td>
                      {DAYS.map(day => (
                        <td key={day} className="py-1 px-2 text-center">
                          <input
                            type="checkbox"
                            checked={task.days[day]}
                            onChange={() => !task.isLocked && handleTaskDayToggle(task.id, day)}
                            className={`accent-primary w-4 h-4 ${task.isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={task.isLocked}
                          />
                        </td>
                      ))}
                      <td className="py-1 px-2 text-center">
                        <div className="flex gap-2 justify-center">
                          {editingTaskId === task.id ? (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleEditTaskSave(task.id)}
                              >
                                저장
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handleEditTaskCancel}
                              >
                                취소
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                variant={task.isLocked ? "default" : "outline"}
                                onClick={() => handleTaskLockToggle(task.id)}
                              >
                                {task.isLocked ? "고정됨" : "고정"}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditTask(task)}
                              >
                                수정
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => handleTaskDelete(task.id)}
                              >
                                삭제
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {state.tasks.length === 0 && (
                    <tr>
                      <td colSpan={DAYS.length + 4} className="text-center text-muted-foreground py-4">할 일을 추가하세요</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <form onSubmit={handleSaveNotes}>
          <Card>
            <CardHeader>
              <CardTitle>Critical Success Factor</CardTitle>
              <div className="text-sm text-muted-foreground mt-1">이번 주의 핵심 성공 요소를 정의하세요</div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={state.criticalSuccessFactor}
                onChange={e => setState(s => ({ ...s, criticalSuccessFactor: e.target.value }))}
                placeholder="이번 주의 핵심 성공 요소를 입력하세요"
                className="min-h-[100px]"
              />
              {savedNotes.criticalSuccessFactor && (
                <div className="mt-2 text-muted-foreground text-sm whitespace-pre-line">
                  {savedNotes.criticalSuccessFactor}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Note for Weekly Goals</CardTitle>
              <div className="text-sm text-muted-foreground mt-1">이번 주 목표를 위한 메모를 작성하세요</div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={state.weeklyGoalNote}
                onChange={e => setState(s => ({ ...s, weeklyGoalNote: e.target.value }))}
                placeholder="이번 주 목표를 위한 메모를 입력하세요"
                className="min-h-[100px]"
              />
              {savedNotes.weeklyGoalNote && (
                <div className="mt-2 text-muted-foreground text-sm whitespace-pre-line">
                  {savedNotes.weeklyGoalNote}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Words of Praise</CardTitle>
              <div className="text-sm text-muted-foreground mt-1">자신을 칭찬하고 격려하는 말을 남겨보세요</div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={state.wordsOfPraise}
                onChange={e => setState(s => ({ ...s, wordsOfPraise: e.target.value }))}
                placeholder="칭찬과 격려의 말을 입력하세요"
                className="min-h-[100px]"
              />
              {savedNotes.wordsOfPraise && (
                <div className="mt-2 text-muted-foreground text-sm whitespace-pre-line">
                  {savedNotes.wordsOfPraise}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end mt-4">
            <Button type="submit">저장</Button>
          </div>
        </form>
      </div>
    </div>
  );
} 