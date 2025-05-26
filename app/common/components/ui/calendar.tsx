// import * as React from "react"
// import { ChevronLeft, ChevronRight } from "lucide-react"
// import { DayPicker } from "react-day-picker"

// import { cn } from "~/lib/utils"
// import { buttonVariants } from "~/common/components/ui/button"

// function Calendar({
//   className,
//   classNames,
//   showOutsideDays = true,
//   ...props
// }: React.ComponentProps<typeof DayPicker>) {
//   return (
//     <DayPicker
//       showOutsideDays={showOutsideDays}
//       className={cn("p-3", className)}
//       classNames={{
//         months: "flex flex-col sm:flex-row gap-2",
//         month: "flex flex-col gap-4",
//         caption: "flex justify-center pt-1 relative items-center w-full",
//         caption_label: "text-sm font-medium",
//         nav: "flex items-center gap-1",
//         nav_button: cn(
//           buttonVariants({ variant: "outline" }),
//           "size-7 bg-transparent p-0 opacity-50 hover:opacity-100"
//         ),
//         nav_button_previous: "absolute left-1",
//         nav_button_next: "absolute right-1",
//         table: "w-full border-collapse space-x-1",
//         head_row: "flex",
//         head_cell:
//           "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
//         row: "flex w-full mt-2",
//         cell: cn(
//           "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md",
//           props.mode === "range"
//             ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
//             : "[&:has([aria-selected])]:rounded-md"
//         ),
//         day: cn(
//           buttonVariants({ variant: "ghost" }),
//           "size-8 p-0 font-normal aria-selected:opacity-100"
//         ),
//         day_range_start:
//           "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
//         day_range_end:
//           "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
//         day_selected:
//           "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
//         day_today: "bg-accent text-accent-foreground",
//         day_outside:
//           "day-outside text-muted-foreground aria-selected:text-muted-foreground",
//         day_disabled: "text-muted-foreground opacity-50",
//         day_range_middle:
//           "aria-selected:bg-accent aria-selected:text-accent-foreground",
//         day_hidden: "invisible",
//         ...classNames,
//       }}
//       components={{
//         IconLeft: ({ className, ...props }) => (
//           <ChevronLeft className={cn("size-4", className)} {...props} />
//         ),
//         IconRight: ({ className, ...props }) => (
//           <ChevronRight className={cn("size-4", className)} {...props} />
//         ),
//       }}
//       {...props}
//     />
//   )
// }

// export { Calendar }
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

  const startOfMonth = currentMonth.startOf("week")
  const days: DateTime[] = []

  for (let i = 0; i < 42; i++) {
    days.push(startOfMonth.plus({ days: i }))
  }

  return (
    <div className={cn("w-full max-w-sm p-4", className)}>
      <div className="flex items-center justify-between mb-2">
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
      <div className="grid grid-cols-7 text-center text-xs text-muted-foreground mb-1">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 text-sm gap-1">
        {/* {days.map((day) => {
          const isSelected = day.hasSame(selectedDate, "day")
          const isCurrentMonth = day.month === currentMonth.month

          return (
            <button
              key={day.toISODate()}
              onClick={() => onDateChange(day)}
              className={cn(
                "aspect-square w-full rounded-md hover:bg-accent hover:text-accent-foreground",
                isSelected &&
                  "bg-primary text-primary-foreground hover:bg-primary",
                !isCurrentMonth && "text-muted-foreground"
              )}
            >
              {day.day}
            </button>
          )
        })} */}
        {days.map((day) => {
  const isMarked = markedDates?.includes(day.toISODate())
  const isSelected = day.hasSame(selectedDate, "day")
  const isCurrentMonth = day.month === currentMonth.month

  return (
    <button
      key={day.toISODate()}
      onClick={() => onDateChange(day)}
      className={cn(
        "relative aspect-square w-full rounded-md hover:bg-accent hover:text-accent-foreground",
        isSelected && "bg-primary text-primary-foreground",
        !isCurrentMonth && "text-muted-foreground"
      )}
    >
      {day.day}

      {isMarked && (
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary"></span>
      )}
    </button>
  )
})}

      </div>
    </div>
  )
}
