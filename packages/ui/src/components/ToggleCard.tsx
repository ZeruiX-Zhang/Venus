import type { ReactNode } from "react";

export function ToggleCard({
  active,
  children,
  onClick
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`pca-toggle-card ${active ? "is-active" : ""}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
