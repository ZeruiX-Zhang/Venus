import type { ReactNode } from "react";

export function StatusPill({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "danger" | "info";
}) {
  return <span className={`pca-status-pill pca-status-pill--${tone}`}>{children}</span>;
}
