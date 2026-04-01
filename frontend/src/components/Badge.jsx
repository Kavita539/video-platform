export const Badge = ({ children, variant = "default", dot }) => {
  const variants = {
    default: "overlay secondary",
    safe: "bg-[rgba(63,207,142,0.12)] success",
    flagged: "bg-[var(--danger-glow)] danger",
    pending: "overlay muted",
    processing: "bg-[rgba(79,163,247,0.12)] info",
    completed: "bg-[rgba(63,207,142,0.10)] success",
    failed: "bg-[var(--danger-glow)] danger",
    admin: "bg-[var(--accent-glow)] accent",
    editor: "bg-[rgba(79,163,247,0.12)] info",
    viewer: "overlay secondary",
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
