export const Card = ({ children, className = "", ...props }) => (
  <div
    className={`bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius)] p-5 ${className}`}
    {...props}
  >
    {children}
  </div>
);
