import type { ReactNode } from "react";

export function InspectorPanel({
  children,
  title
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="pca-inspector-panel">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
