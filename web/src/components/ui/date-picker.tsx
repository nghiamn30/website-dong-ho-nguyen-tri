"use client";

import { useState } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TimePicker } from "@/components/ui/time-picker";
import { formatDate, toDateInputValue } from "@/lib/date-time";
import { cn } from "@/lib/utils";

const monthShortNames = [
  "Thg 1",
  "Thg 2",
  "Thg 3",
  "Thg 4",
  "Thg 5",
  "Thg 6",
  "Thg 7",
  "Thg 8",
  "Thg 9",
  "Thg 10",
  "Thg 11",
  "Thg 12",
];

export function DatePicker({
  className,
  disabled,
  id,
  placeholder = "Chọn ngày",
  value,
  onChange,
}: {
  id?: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onChange: (value: string) => void;
}) {
  const selectedDate = parseDateValue(value);

  return (
    <Popover>
      <PopoverTrigger
        disabled={disabled}
        id={id}
        render={
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-between font-normal",
              !value && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        {selectedDate ? formatDate(selectedDate) : placeholder}
        <CalendarIcon className="size-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          key={value || "empty"}
          mode="single"
          locale={vi}
          defaultMonth={selectedDate}
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              onChange(toDateInputValue(date));
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export function MonthPicker({
  className,
  disabled,
  id,
  placeholder = "Chọn tháng",
  value,
  onChange,
}: {
  id?: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onChange: (value: string) => void;
}) {
  const { year, month } = parseMonthValue(value);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(Number(year));

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setViewYear(Number(year));
    }
  };

  const monthLabel = `Tháng ${month} ${year}`;
  const hasValue = /^\d{4}-\d{2}$/.test(value);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        disabled={disabled}
        id={id}
        render={
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-between font-normal",
              !hasValue && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        {hasValue ? monthLabel : placeholder}
        <CalendarIcon className="size-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="flex items-center justify-between">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Năm trước"
            onClick={() => setViewYear((y) => y - 1)}
          >
            <ChevronLeft />
          </Button>
          <span className="text-sm font-medium">{viewYear}</span>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Năm sau"
            onClick={() => setViewYear((y) => y + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {monthShortNames.map((label, index) => {
            const monthNumber = index + 1;
            const isActive =
              hasValue &&
              viewYear === Number(year) &&
              monthNumber === month;

            return (
              <Button
                key={label}
                type="button"
                size="sm"
                variant={isActive ? "default" : "ghost"}
                onClick={() => {
                  onChange(
                    `${viewYear}-${String(monthNumber).padStart(2, "0")}`,
                  );
                  setOpen(false);
                }}
              >
                {label}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function DateTimePicker({
  className,
  disabled,
  id,
  value,
  onChange,
}: {
  id?: string;
  value: string;
  disabled?: boolean;
  className?: string;
  onChange: (value: string) => void;
}) {
  const { date, time } = splitDateTimeValue(value);

  return (
    <div className={cn("grid gap-2 sm:grid-cols-[1fr_104px]", className)}>
      <DatePicker
        id={id}
        value={date}
        disabled={disabled}
        onChange={(nextDate) => onChange(`${nextDate}T${time}`)}
      />
      <TimePicker
        ariaLabel="Giờ"
        value={time}
        disabled={disabled}
        onChange={(nextTime) => onChange(`${date}T${nextTime}`)}
      />
    </div>
  );
}

function splitDateTimeValue(value: string) {
  const [date, time] = value.split("T");

  return {
    date: date || toDateInputValue(new Date()),
    time: time || "00:00",
  };
}

function parseDateValue(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return undefined;
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function parseMonthValue(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})$/);
  const now = new Date();

  return {
    year: match ? match[1] : String(now.getFullYear()),
    month: match ? Number(match[2]) : now.getMonth() + 1,
  };
}
