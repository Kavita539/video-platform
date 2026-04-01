import { forwardRef } from "react";

const baseInputClasses =
  "bg-[var(--bg-raised)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--text-primary)] font-[var(--font-mono)] text-[0.875rem] p-[10px_14px] transition-all duration-[var(--transition)] outline-none w-full focus:border-[var(--accent)] focus:shadow-[0_0_0_2px_var(--accent-glow)]";

const errorClasses =
  "border-[var(--danger)] focus:shadow-[0_0_0_2px_var(--danger-glow)]";

// Input Component
export const Input = forwardRef(
  ({ label, error, className = "", ...props }, ref) => (
    <div className={`flex flex-col gap-[6px] ${className}`}>
      {label && (
        <label className="text-[0.72rem] font-medium text-[var(--text-secondary)] tracking-wider uppercase">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`${baseInputClasses} ${error ? errorClasses : ""}`}
        {...props}
      />
      {error && <p className="text-[0.72rem] text-[var(--danger)]">{error}</p>}
    </div>
  ),
);
Input.displayName = "Input";

// Textarea Component
export const Textarea = forwardRef(
  ({ label, error, className = "", ...props }, ref) => (
    <div className={`flex flex-col gap-[6px] ${className}`}>
      {label && (
        <label className="text-[0.72rem] font-medium text-[var(--text-secondary)] tracking-wider uppercase">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={`${baseInputClasses} resize-y min-h-[80px] leading-relaxed ${error ? errorClasses : ""}`}
        {...props}
      />
      {error && <p className="text-[0.72rem] text-[var(--danger)]">{error}</p>}
    </div>
  ),
);

Textarea.displayName = "Textarea";
