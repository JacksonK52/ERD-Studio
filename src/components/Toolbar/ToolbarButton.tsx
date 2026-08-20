import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ToolbarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  active?: boolean;
  shortcut?: string;
}

export function ToolbarButton({
  icon,
  label,
  active,
  shortcut,
  disabled,
  className = "",
  ...rest
}: ToolbarButtonProps) {
  const title = shortcut ? `${label} (${shortcut})` : label;

  return (
    <button
      type="button"
      title={title}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      className={[
        "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors",
        "text-[color:var(--color-text-muted)]",
        active
          ? "bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]"
          : "hover:bg-zinc-100 hover:text-[color:var(--color-text)]",
        disabled ? "cursor-not-allowed opacity-35 hover:bg-transparent" : "cursor-pointer",
        className,
      ].join(" ")}
      {...rest}
    >
      {icon}
    </button>
  );
}

export function ToolbarDivider() {
  return <div className="mx-1 h-5 w-px bg-[color:var(--color-border)]" />;
}
