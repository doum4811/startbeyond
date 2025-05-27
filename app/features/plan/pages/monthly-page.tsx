import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Textarea } from "~/common/components/ui/textarea";
import { CATEGORIES, type CategoryCode } from "~/common/types/daily";
// import type { Route } from "~/common/types";
import { Link } from "react-router";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateTime } from "luxon";
import { Calendar } from "~/common/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "~/common/components/ui/popover";

interface MonthlyGoal {
  id: string;
  category: CategoryCode;
  title: string;
  description: string;
  successCriteria: {
    id: string;
    text: string;
    isCompleted: boolean;
  }[];
  weeklyBreakdown: {
    week1: string;
    week2: string;
    week3: string;
    week4: string;
  };
  isCompleted: boolean;
}

interface MonthlyPlanState {
  goals: MonthlyGoal[];
  monthlyNotes: string;
  monthlyReflection: string;
}

function getMonthRange(date = new Date()) {
  const dt = DateTime.fromJSDate(date);
  const firstDay = dt.startOf('month');
  const lastDay = dt.endOf('month');
  return `${firstDay.toFormat('yyyy.MM.dd')} ~ ${lastDay.toFormat('yyyy.MM.dd')}`;
}

// export function loader({ request }: Route.LoaderArgs) {
//   return {};
// }

// export function action({ request }: Route.ActionArgs) {
//   return {};
// }

// export function meta({ data }: Route.MetaArgs) {
//   return [
//     { title: "Monthly Plan - StartBeyond" },
//     { name: "description", content: "Plan your monthly goals and activities" },
//   ];
// }

export default function MonthlyPlanPage() {
  const [state, setState] = useState<MonthlyPlanState>({
    goals: [],
    monthlyNotes: "",
    monthlyReflection: "",
  });
  const [savedNotes, setSavedNotes] = useState({
    monthlyNotes: "",
    monthlyReflection: "",
  });
  const [newGoalCategory, setNewGoalCategory] = useState<CategoryCode>("EX");
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDescription, setNewGoalDescription] = useState("");
  const [newGoalSuccessCriteria, setNewGoalSuccessCriteria] = useState("");
  const [newGoalWeek1, setNewGoalWeek1] = useState("");
  const [newGoalWeek2, setNewGoalWeek2] = useState("");
  const [newGoalWeek3, setNewGoalWeek3] = useState("");
  const [newGoalWeek4, setNewGoalWeek4] = useState("");
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  function resetForm() {
    setNewGoalCategory("EX");
    setNewGoalTitle("");
    setNewGoalDescription("");
    setNewGoalSuccessCriteria("");
    setNewGoalWeek1("");
    setNewGoalWeek2("");
    setNewGoalWeek3("");
    setNewGoalWeek4("");
    setEditingGoalId(null);
  }

  function handleAddGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    // 달성 기준을 줄바꿈으로 구분하여 배열로 변환
    const criteriaList = newGoalSuccessCriteria
      .split('\n')
      .filter(line => line.trim())
      .map(line => ({
        id: Math.random().toString(36).slice(2),
        text: line.trim(),
        isCompleted: false
      }));

    if (editingGoalId) {
      // 기존 목표 수정
      setState(s => ({
        ...s,
        goals: s.goals.map(goal => 
          goal.id === editingGoalId
            ? {
                ...goal,
                category: newGoalCategory,
                title: newGoalTitle,
                description: newGoalDescription,
                successCriteria: criteriaList,
                weeklyBreakdown: {
                  week1: newGoalWeek1,
                  week2: newGoalWeek2,
                  week3: newGoalWeek3,
                  week4: newGoalWeek4,
                }
              }
            : goal
        )
      }));
    } else {
      // 새 목표 추가
      setState(s => ({
        ...s,
        goals: [
          ...s.goals,
          {
            id: Math.random().toString(36).slice(2),
            category: newGoalCategory,
            title: newGoalTitle,
            description: newGoalDescription,
            successCriteria: criteriaList,
            weeklyBreakdown: {
              week1: newGoalWeek1,
              week2: newGoalWeek2,
              week3: newGoalWeek3,
              week4: newGoalWeek4,
            },
            isCompleted: false
          }
        ]
      }));
    }

    resetForm();
  }

  function handleEditGoal(goal: MonthlyGoal) {
    setNewGoalCategory(goal.category);
    setNewGoalTitle(goal.title);
    setNewGoalDescription(goal.description);
    setNewGoalSuccessCriteria(goal.successCriteria.map(c => c.text).join('\n'));
    setNewGoalWeek1(goal.weeklyBreakdown.week1);
    setNewGoalWeek2(goal.weeklyBreakdown.week2);
    setNewGoalWeek3(goal.weeklyBreakdown.week3);
    setNewGoalWeek4(goal.weeklyBreakdown.week4);
    setEditingGoalId(goal.id);
  }

  function handleCriteriaToggle(goalId: string, criteriaId: string) {
    setState(s => ({
      ...s,
      goals: s.goals.map(goal => {
        if (goal.id === goalId) {
          const updatedCriteria = goal.successCriteria.map(criteria => 
            criteria.id === criteriaId 
              ? { ...criteria, isCompleted: !criteria.isCompleted }
              : criteria
          );
          const isCompleted = updatedCriteria.every(c => c.isCompleted);
          return { ...goal, successCriteria: updatedCriteria, isCompleted };
        }
        return goal;
      })
    }));
  }

  function handleDeleteGoal(goalId: string) {
    setState(s => ({
      ...s,
      goals: s.goals.filter(g => g.id !== goalId)
    }));
  }

  function handleSaveNotes(e: React.FormEvent) {
    e.preventDefault();
    setSavedNotes({
      monthlyNotes: state.monthlyNotes,
      monthlyReflection: state.monthlyReflection,
    });
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 pt-16 bg-background min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-3xl">Monthly</h1>
          <CalendarPopover />
        </div>
        <div className="text-gray-500 text-lg">{getMonthRange()}</div>
        <Button asChild className="ml-2" variant="ghost" size="sm">
          <Link to="/plan/weekly">back to weekly</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{editingGoalId ? '월간 목표 수정' : '월간 목표 추가'}</CardTitle>
            <div className="text-sm text-muted-foreground mt-1">
              {editingGoalId ? '목표를 수정하세요' : '이번 달의 핵심 목표를 설정하세요'}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddGoal} className="flex flex-col gap-4">
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {Object.entries(CATEGORIES).map(([code, cat]) => (
                  <Button
                    key={code}
                    type="button"
                    variant={newGoalCategory === code ? "default" : "outline"}
                    className={`w-16 h-16 flex flex-col items-center justify-center rounded-lg border ${newGoalCategory === code ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setNewGoalCategory(code as CategoryCode)}
                    style={{ minWidth: 64, minHeight: 64 }}
                  >
                    <span className="text-2xl mb-1">{cat.icon}</span>
                    <span className="text-xs font-medium text-center leading-tight">{cat.label}</span>
                  </Button>
                ))}
              </div>

              <div className="grid gap-4">
                <Input
                  value={newGoalTitle}
                  onChange={e => setNewGoalTitle(e.target.value)}
                  placeholder="목표 제목"
                />
                <Textarea
                  value={newGoalDescription}
                  onChange={e => setNewGoalDescription(e.target.value)}
                  placeholder="목표 설명"
                  className="min-h-[80px]"
                />
                <Textarea
                  value={newGoalSuccessCriteria}
                  onChange={e => setNewGoalSuccessCriteria(e.target.value)}
                  placeholder="달성 기준"
                  className="min-h-[80px]"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium mb-2">1주차</div>
                    <Textarea
                      value={newGoalWeek1}
                      onChange={e => setNewGoalWeek1(e.target.value)}
                      placeholder="1주차 계획"
                      className="min-h-[60px]"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">2주차</div>
                    <Textarea
                      value={newGoalWeek2}
                      onChange={e => setNewGoalWeek2(e.target.value)}
                      placeholder="2주차 계획"
                      className="min-h-[60px]"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">3주차</div>
                    <Textarea
                      value={newGoalWeek3}
                      onChange={e => setNewGoalWeek3(e.target.value)}
                      placeholder="3주차 계획"
                      className="min-h-[60px]"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">4주차</div>
                    <Textarea
                      value={newGoalWeek4}
                      onChange={e => setNewGoalWeek4(e.target.value)}
                      placeholder="4주차 계획"
                      className="min-h-[60px]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingGoalId ? '수정 완료' : '목표 추가'}
                </Button>
                {editingGoalId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    취소
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>월간 목표</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {state.goals.map(goal => (
                <div key={goal.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{CATEGORIES[goal.category].icon}</span>
                      <h3 className="text-lg font-semibold">{goal.title}</h3>
                      {goal.isCompleted && (
                        <span className="text-sm text-green-600 font-medium">달성 완료</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditGoal(goal)}
                      >
                        수정
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-4">
                    <div>
                      <div className="text-sm font-medium mb-1">설명</div>
                      <div className="text-muted-foreground">{goal.description}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-2">달성 기준</div>
                      <div className="space-y-2">
                        {goal.successCriteria.map(criteria => (
                          <div key={criteria.id} className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={criteria.isCompleted}
                              onChange={() => handleCriteriaToggle(goal.id, criteria.id)}
                              className="mt-1 accent-primary"
                            />
                            <span className={criteria.isCompleted ? "line-through text-muted-foreground" : ""}>
                              {criteria.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium mb-1">1주차</div>
                        <div className="text-muted-foreground">{goal.weeklyBreakdown.week1}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-1">2주차</div>
                        <div className="text-muted-foreground">{goal.weeklyBreakdown.week2}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-1">3주차</div>
                        <div className="text-muted-foreground">{goal.weeklyBreakdown.week3}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-1">4주차</div>
                        <div className="text-muted-foreground">{goal.weeklyBreakdown.week4}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/plan/weekly?goal=${goal.id}`}>주간 계획으로</Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/daily?goal=${goal.id}`}>일간 기록으로</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {state.goals.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  아직 설정된 목표가 없습니다
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>월간 메모</CardTitle>
            <div className="text-sm text-muted-foreground mt-1">이번 달에 대한 메모와 회고를 작성하세요</div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveNotes} className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-2">월간 메모</div>
                <Textarea
                  value={state.monthlyNotes}
                  onChange={e => setState(s => ({ ...s, monthlyNotes: e.target.value }))}
                  placeholder="이번 달에 대한 메모를 작성하세요"
                  className="min-h-[100px]"
                />
                {savedNotes.monthlyNotes && (
                  <div className="mt-2 text-muted-foreground text-sm whitespace-pre-line">
                    {savedNotes.monthlyNotes}
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm font-medium mb-2">월간 회고</div>
                <Textarea
                  value={state.monthlyReflection}
                  onChange={e => setState(s => ({ ...s, monthlyReflection: e.target.value }))}
                  placeholder="이번 달을 돌아보며..."
                  className="min-h-[100px]"
                />
                {savedNotes.monthlyReflection && (
                  <div className="mt-2 text-muted-foreground text-sm whitespace-pre-line">
                    {savedNotes.monthlyReflection}
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button type="submit">저장</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// function CalendarPopover() {
//   const [open, setOpen] = useState(false);
//   const [date, setDate] = useState<Date | undefined>(new Date());

//   return (
//     <Popover open={open} onOpenChange={setOpen}>
//       <PopoverTrigger asChild>
//         <Button variant="ghost" size="icon" aria-label="달력 열기">
//           <CalendarIcon className="w-5 h-5" />
//         </Button>
//       </PopoverTrigger>
//       <PopoverContent className="w-auto p-0" align="start">
//         <Calendar
//           mode="single"
//           selected={date}
//           onSelect={(newDate: Date | undefined) => {
//             setDate(newDate);
//             setOpen(false);
//           }}
//         />
//       </PopoverContent>
//     </Popover>
//   );
// } 

export function CalendarPopover() {
    const [open, setOpen] = useState(false)
    const [date, setDate] = useState<DateTime>(DateTime.now())
  
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="달력 열기">
            <CalendarIcon className="w-5 h-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            selectedDate={date}
            onDateChange={(newDate: DateTime) => {
              setDate(newDate)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    )
  }
  