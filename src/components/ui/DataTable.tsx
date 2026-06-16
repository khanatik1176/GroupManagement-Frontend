import { cn } from "@/lib/utils";

type DataTableShellProps = {
  children: React.ReactNode;
  className?: string;
  minWidth?: number;
};

/** Scrollable wrapper for fixed-layout data tables. */
export function DataTableShell({
  children,
  className,
  minWidth = 960,
}: DataTableShellProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-theme bg-elevated",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <div style={{ minWidth }}>{children}</div>
      </div>
    </div>
  );
}

type DataTableProps = React.TableHTMLAttributes<HTMLTableElement> & {
  minWidth?: number;
};

export function DataTable({ className, minWidth, style, ...props }: DataTableProps) {
  return (
    <table
      className={cn("data-table w-full text-left text-sm", className)}
      style={{ minWidth, ...style }}
      {...props}
    />
  );
}

export function DataTableHead({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        "border-b border-theme bg-header text-xs uppercase tracking-wide text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function DataTableTh({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn("px-3 py-3 font-medium whitespace-nowrap", className)}
      {...props}
    />
  );
}

export function DataTableTd({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("px-3 py-3 align-middle overflow-hidden", className)}
      {...props}
    />
  );
}

/** Truncate cell text with optional title tooltip. */
export function CellText({
  children,
  title,
  className,
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <span
      className={cn("block truncate", className)}
      title={title}
    >
      {children}
    </span>
  );
}
