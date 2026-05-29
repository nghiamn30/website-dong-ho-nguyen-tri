"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function TimePicker({
  ariaLabel = "Giờ",
  className,
  disabled,
  id,
  value,
  onChange,
}: {
  id?: string;
  value: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      id={id}
      aria-label={ariaLabel}
      type="time"
      step={60}
      value={normalizeTimeValue(value)}
      disabled={disabled}
      className={cn(
        "bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none",
        className,
      )}
      onChange={(event) => onChange(normalizeTimeValue(event.target.value))}
    />
  );
}

function normalizeTimeValue(value: string) {
  const match = value.match(/^(\d{2}):(\d{2})/);

  return match ? `${match[1]}:${match[2]}` : "00:00";
}
