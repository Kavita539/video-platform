import { forwardRef } from "react";

export const Spinner = ({ size = "md" }) => {
  const sizes = {
    sm: "w-3 h-3 border-2",
    md: "w-5 h-5 border-2",
    lg: "w-8 h-8 border-3",
  };

  return (
    <span
      className={`inline-block rounded-full border-t-transparent border-current animate-spin flex-shrink-0 ${sizes[size]}`}
      aria-label="Loading"
    />
  );
};

export const Button = forwardRef(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading,
      disabled,
      className = "",
      ...props
    },
    ref,
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center gap-2 border-none rounded-[var(--radius-sm)] font-[var(--font-mono)] font-medium tracking-wider uppercase cursor-pointer transition-all duration-[var(--transition)] whitespace-nowrap select-none disabled:opacity-45 disabled:cursor-not-allowed";

    const sizes = {
      sm: "p-[6px_12px] text-[0.72rem]",
      md: "p-[10px_20px] text-[0.78rem]",
      lg: "p-[14px_28px] text-[0.85rem]",
    };

    const variants = {
      primary:
        "bg-[var(--accent)] text-[#0d0e10] enabled:hover:bg-[#ffb733] enabled:hover:shadow-[0_0_20px_var(--accent-glow)]",
      secondary:
        "bg-transparent text-[var(--text-primary)] border border-[var(--border-bright)] enabled:hover:border-[var(--accent)] enabled:hover:text-[var(--accent)]",
      ghost:
        "bg-transparent text-[var(--text-secondary)] enabled:hover:text-[var(--text-primary)] enabled:hover:bg-[var(--bg-raised)]",
      danger:
        "bg-[var(--danger)] text-white enabled:hover:bg-[#ff5555] enabled:hover:shadow-[0_0_20px_var(--danger-glow)]",
    };

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${sizes[size]} ${variants[variant]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner size="sm" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
