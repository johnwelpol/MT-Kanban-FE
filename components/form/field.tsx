import { Label } from "@/components/ui/label";

export function Field({
  id,
  label,
  errors,
  hint,
  children,
}: {
  id: string;
  label: string;
  errors?: string[];
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {errors?.length ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {errors[0]}
        </p>
      ) : hint ? (
        <div id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

export function FormMessage({ state }: { state: { ok?: boolean; message?: string } }) {
  if (!state.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={state.ok ? "text-sm text-muted-foreground" : "text-sm text-destructive"}
    >
      {state.message}
    </p>
  );
}
