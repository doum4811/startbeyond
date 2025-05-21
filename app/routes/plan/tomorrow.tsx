import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/common/components/ui/card";
import { Button } from "~/common/components/ui/button";
import { Input } from "~/common/components/ui/input";
import { Textarea } from "~/common/components/ui/textarea";
import { CATEGORIES, type CategoryCode, type DailyPlan } from "~/common/types/daily";
import type { Route } from "~/common/types";
import { Link } from "react-router";
import { Calendar as CalendarIcon } from "lucide-react";

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" });
}

function CalendarPopover() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)} aria-label="달력 열기">
        <CalendarIcon className="w-5 h-5" />
      </Button>
      {open && (
        <div className="absolute left-0 mt-2 z-50 bg-background border rounded-xl shadow-lg p-2">
          {/* 달력 컴포넌트 연결 가능 */}
          <div className="text-muted-foreground text-sm p-4">(달력 자리)</div>
        </div>
      )}
    </div>
  );
}

export function loader({ request }: Route.LoaderArgs) {
  return {};
}

export function action({ request }: Route.ActionArgs) {
  return {};
}

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: "Tomorrow Plan - StartBeyond" },
    { name: "description", content: "Plan your tomorrow activities" },
  ];
}

interface AddPlanForm {
  category: CategoryCode;
  duration: string;
  comment: string;
}

const initialForm: AddPlanForm = {
  category: "EX",
  duration: "",
  comment: "",
};

export default function TomorrowPlanPage() {
  const [plans, setPlans] = useState<DailyPlan[]>([]);
  const [form, setForm] = useState<AddPlanForm>(initialForm);

  function handleCategorySelect(code: CategoryCode) {
    setForm((f) => ({ ...f, category: code }));
  }

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { id, value } = e.target;
    setForm((f) => ({ ...f, [id]: value }));
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const newPlan: DailyPlan = {
      id: Math.random().toString(36).slice(2),
      category_code: form.category,
      duration: form.duration ? Number(form.duration) : undefined,
      unit: "min",
      comment: form.comment,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setPlans((prev) => [newPlan, ...prev]);
    setForm(initialForm);
  }

  function handleDelete(id: string) {
    setPlans((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 pt-16">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-3xl">Tomorrow</h1>
          <CalendarPopover />
        </div>
        <div className="text-gray-500 text-lg">{getTomorrow()}</div>
        <Button asChild className="ml-2" variant="ghost" size="sm">
          <Link to="/daily">back to daily</Link>
        </Button>
      </div>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Tomorrow Plan</CardTitle>
          <div className="text-sm text-muted-foreground mt-1">내일은 이런 걸 해보세요!</div>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleAdd}>
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-2">
              {Object.entries(CATEGORIES).map(([code, cat]) => (
                <Button
                  key={code}
                  type="button"
                  variant={form.category === code ? "default" : "outline"}
                  className={`w-16 h-16 flex flex-col items-center justify-center rounded-lg border ${form.category === code ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => handleCategorySelect(code as CategoryCode)}
                  style={{ minWidth: 64, minHeight: 64 }}
                >
                  <span className="text-2xl mb-1">{cat.icon}</span>
                  <span className="text-xs font-medium text-center leading-tight">{cat.label}</span>
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                id="duration"
                type="number"
                min={0}
                placeholder="분"
                value={form.duration}
                onChange={handleFormChange}
                className="w-24"
              />
              <Input
                id="comment"
                placeholder="간단 메모"
                value={form.comment}
                onChange={handleFormChange}
                className="flex-1"
              />
              <Button type="submit" className="ml-2">Add</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Planned Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-base">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-2 text-left">Code</th>
                  <th className="py-2 px-2 text-left">Duration</th>
                  <th className="py-2 px-2 text-left">Memo</th>
                  <th className="py-2 px-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => {
                  const cat = CATEGORIES[plan.category_code];
                  return (
                    <tr key={plan.id} className="border-b">
                      <td className="py-2 px-2 flex items-center gap-2">
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="font-medium">{cat.label}</span>
                      </td>
                      <td className="py-2 px-2">{plan.duration ? `${plan.duration}분` : "-"}</td>
                      <td className="py-2 px-2">{plan.comment || <span className="text-muted-foreground">No memo</span>}</td>
                      <td className="py-2 px-2 text-center">
                        <Button variant="outline" size="sm" onClick={() => handleDelete(plan.id)}>삭제</Button>
                      </td>
                    </tr>
                  );
                })}
                {plans.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-muted-foreground py-8">No plans yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 