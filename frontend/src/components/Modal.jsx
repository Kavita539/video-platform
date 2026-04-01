export const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div 
      className="fixed inset-0 bg-black/75 backdrop-blur-[4px] flex items-center justify-center z-[1000] p-5 animate-[fadeIn_0.2s_ease]" 
      onClick={onClose}
    >
      <div 
        className="bg-surface border border-border-bright rounded-[var(--radius-lg)] w-full max-w-[540px] max-height-[90vh] overflow-y-auto animate-[fadeUp_0.35s_ease]" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-[20px_24px_16px] border-b border-border">
          <h3 className="font-[var(--font-display)] text-[1rem] font-bold">
            {title}
          </h3>
          <button 
            className="bg-transparent border-none text-muted text-[1rem] p-[4px_8px] rounded-[var(--radius-sm)] transition-colors hover:text-primary hover:bg-raised" 
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};