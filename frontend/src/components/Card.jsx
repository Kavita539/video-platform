export const Card = ({ children, className = "", ...props }) => (
  <div
    className={`bg-surface border border-border rounded-[var(--radius)] p-5 ${className}`}
    {...props}
  >
    {children}
  </div>
);
