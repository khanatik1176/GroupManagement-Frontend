import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "theme-input w-full rounded-xl px-4 py-2.5 text-sm transition",
        className,
      )}
      {...props}
    />
  );
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "theme-input w-full rounded-xl px-4 py-2.5 text-sm transition",
        className,
      )}
      {...props}
    />
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-[var(--danger)]">{message}</p>;
}

export function FormAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="rounded-xl border border-[var(--danger)]/25 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
      {message}
    </p>
  );
}

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "theme-input w-full rounded-xl px-4 py-2.5 text-sm transition",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
