import { cn } from "@/lib/utils";

export function AppLogo({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary text-primary-foreground shadow-sm",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(12, size * 0.38) }}
      aria-hidden
    >
      <span className="font-bold leading-none tracking-normal">NT</span>
    </div>
  );
}
