import { cn, getRoleLabel } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "admin";
  className?: string;
};

const variants = {
  default: "border-theme bg-panel text-body",
  success: "border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-[var(--success)]",
  warning: "border-amber-400/25 bg-amber-400/10 text-amber-700 dark:text-amber-300/90",
  danger: "border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[var(--danger)]",
  admin: "border-primary bg-primary-soft text-primary",
};

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const variant =
    role === "admin"
      ? "admin"
      : role === "permanent"
        ? "success"
        : "warning";

  return <Badge variant={variant}>{getRoleLabel(role)}</Badge>;
}
