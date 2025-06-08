import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "~/lib/utils"
import { buttonVariants } from "~/common/components/ui/button"
import { DateTime } from "luxon"

interface CalendarProps {
  selectedDate: DateTime
  onDateChange: (date: DateTime) => void
  className?: string
  markedDates?: string[]
}

export function Calendar({
  selectedDate,
  onDateChange,
  className,
  markedDates,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<DateTime>(
    selectedDate.startOf("month")
  )

  const startOfWeek = currentMonth.setLocale('en-GB').startOf('week');
  const days: DateTime[] = []

  for (let i = 0; i < 42; i++) {
    days.push(startOfWeek.plus({ days: i }))
  }

  return (
    <div className={cn("w-full max-w-sm p-3", className)}>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(currentMonth.minus({ months: 1 }))}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "size-8 p-0 text-muted-foreground"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold">
          {currentMonth.toFormat("yyyy년 M월")}
        </span>
        <button
          onClick={() => setCurrentMonth(currentMonth.plus({ months: 1 }))}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "size-8 p-0 text-muted-foreground"
          )}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-muted-foreground mb-2">
        {["월", "화", "수", "목", "금", "토", "일"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 text-sm gap-1">
        {days.map((day) => {
          const isMarked = markedDates?.includes(day.toISODate() as string)
          const isSelected = day.hasSame(selectedDate, "day")
          const isCurrentMonth = day.month === currentMonth.month

          return (
            <button
              key={day.toISODate()}
              onClick={() => onDateChange(day)}
              className={cn(
                "relative h-10 w-10 p-2 rounded-md hover:bg-accent hover:text-accent-foreground",
                isSelected && "bg-primary text-primary-foreground",
                !isCurrentMonth && "text-muted-foreground/50"
              )}
            >
              {day.day}

              {isMarked && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-sky-400"></span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
