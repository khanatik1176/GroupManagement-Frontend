export function LoadingSpinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-start gap-3 py-12 text-muted">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
