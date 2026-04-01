export const Empty = ({ icon, title, message, action }) => (
  <div className="flex flex-col items-center justify-center p-[60px_20px] text-center gap-[10px]">
    {icon && <div className="text-[2.5rem] mb-2 opacity-40">{icon}</div>}
    <p className="font-[var(--font-display)] text-[0.95rem] text-[var(--text-secondary)]">
      {title}
    </p>
    {message && (
      <p className="text-[0.8rem] text-[var(--text-muted)] max-w-[320px]">
        {message}
      </p>
    )}
    {action}
  </div>
);
