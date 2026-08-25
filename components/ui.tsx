export function Card({
  children,
  className = "",
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-3xl border border-slate-200/70 shadow-[0_1px_2px_rgba(37,37,37,0.04),0_12px_28px_-16px_rgba(37,37,37,0.18)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

const TONE_DOT: Record<string, string> = {
  default: "bg-ink",
  danger: "bg-rose-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
};

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "danger" | "success" | "warning";
}) {
  const toneClasses: Record<string, string> = {
    default: "text-ink",
    danger: "text-rose-600",
    success: "text-emerald-600",
    warning: "text-amber-600",
  };
  return (
    <Card className="p-5">
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[tone]}`} />
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
      <p className={`text-2xl font-semibold mt-1.5 tracking-tight ${toneClasses[tone]}`}>
        {value}
      </p>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </Card>
  );
}

export function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  );
}
