import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start rounded-2xl border border-dashed border-theme bg-panel px-4 py-8 text-left",
        className,
      )}
    >
      <p className="text-base font-medium text-heading">{title}</p>
      {description && (
        <p className="mt-2 text-sm text-muted">{description}</p>
      )}
    </div>
  );
}
