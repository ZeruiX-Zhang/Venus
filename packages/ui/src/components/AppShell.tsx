import type { ReactNode } from "react";

export function AppShell({
  children,
  variant
}: {
  children: ReactNode;
  variant: "web" | "desktop";
}) {
  return <main className={`pca-app pca-app--${variant}`}>{children}</main>;
}
