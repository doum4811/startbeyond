import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { DateTime } from "luxon";
import { Button } from "~/common/components/ui/button";
import { Calendar } from "~/common/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "~/common/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { getToday } from "../utils";

interface CalendarPopoverProps {
  markedDates: string[];
  currentSelectedDate: string;
}

export function CalendarPopover({ markedDates, currentSelectedDate }: CalendarPopoverProps) {
  const navigate = useNavigate();
  const [date, setDate] = useState<DateTime | undefined>(DateTime.fromISO(currentSelectedDate));
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleDateSelect = (selectedDt: DateTime | undefined) => {
    setDate(selectedDt);
    if (selectedDt && selectedDt.isValid) {
      navigate(`?date=${selectedDt.toISODate()}`);
    }
    setIsCalendarOpen(false);
  };
  
  useEffect(() => { 
    setDate(DateTime.fromISO(currentSelectedDate));
  }, [currentSelectedDate]);

  const todayDt = DateTime.fromISO(getToday());

  return (
    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal" onClick={() => setIsCalendarOpen(prev => !prev)}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date && date.isValid ? date.toFormat("DDD") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          selectedDate={date || todayDt} 
          onDateChange={handleDateSelect} 
          markedDates={markedDates}
        />
      </PopoverContent>
    </Popover>
  );
} 