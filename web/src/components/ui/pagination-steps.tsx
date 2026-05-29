"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PaginationSteps({
  current,
  steps,
  onChange,
}: {
  current: string;
  steps: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const index = Math.max(
    0,
    steps.findIndex((step) => step.value === current),
  );
  const previous = steps[index - 1];
  const next = steps[index + 1];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!previous}
        onClick={() => previous && onChange(previous.value)}
      >
        <ChevronLeft data-icon="inline-start" />
        Trước
      </Button>
      <div className="rounded-md border bg-muted/40 px-3 py-1 text-sm text-muted-foreground">
        {index + 1}/{steps.length} - {steps[index]?.label}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!next}
        onClick={() => next && onChange(next.value)}
      >
        Sau
        <ChevronRight data-icon="inline-end" />
      </Button>
    </div>
  );
}
