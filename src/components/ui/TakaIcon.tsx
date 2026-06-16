import { cn } from "@/lib/utils";

type TakaIconProps = React.SVGProps<SVGSVGElement>;

export function TakaIcon({ className, ...props }: TakaIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
      aria-hidden="true"
      {...props}
    >
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontSize="14"
        fontWeight="700"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        ৳
      </text>
    </svg>
  );
}
