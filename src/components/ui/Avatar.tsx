import { cn, getInitials } from "@/lib/utils";

type AvatarProps = {
  name: string;
  color?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

export function Avatar({ name, color = "#6366f1", size = "md" }: AvatarProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-semibold text-white shadow-lg",
        sizes[size],
      )}
      style={{ backgroundColor: color }}
    >
      {getInitials(name)}
    </div>
  );
}
