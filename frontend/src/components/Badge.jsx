export const Badge = ({ children, variant = "default", dot }) => {
  const variants = {
    default: "bg-overlay text-secondary",
    safe: "bg-[rgba(63,207,142,0.12)] text-success",
    flagged: "bg-[var(--danger-glow)] text-danger",
    pending: "bg-overlay text-muted",
    processing: "bg-[rgba(79,163,247,0.12)] text-info",
    completed: "bg-[rgba(63,207,142,0.10)] text-success",
    failed: "bg-[var(--danger-glow)] text-danger",
    admin: "bg-[var(--accent-glow)] text-accent",
    editor: "bg-[rgba(79,163,247,0.12)] text-info",
    viewer: "bg-overlay text-secondary",
  };

  return (
    <span
      className={`inline-flex items-center gap-[5px] p-[3px_8px] rounded-[2px] text-[0.68rem] font-semibold tracking-[0.08em] uppercase font-[var(--font-mono)] ${variants[variant]}`}
    >
      {dot && (
        <span className="w-[5px] h-[5px] rounded-full bg-current animate-[pulse-dot_1.5s_ease_infinite]" />
      )}
      {children}
    </span>
  );
};
