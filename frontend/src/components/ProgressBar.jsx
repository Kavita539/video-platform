export const ProgressBar = ({ value = 0, variant = "default", label }) => {
  const variants = {
    default: "bg-accent",
    processing: "bg-info",
    completed: "bg-success",
    failed: "bg-danger",
  };

  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className="flex flex-col gap-[6px]">
      {label && (
        <div className="text-[0.72rem] text-secondary tracking-wider">
          {label}
        </div>
      )}
      <div className="h-1 bg-overlay rounded-[2px] overflow-hidden">
        <div
          className={`h-full rounded-[2px] transition-all duration-300 ease-out animate-[progress-bar_0.4s_ease] ${variants[variant]}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      <div className="text-[0.68rem] text-muted font-mono">
        {clampedValue}%
      </div>
    </div>
  );
};
