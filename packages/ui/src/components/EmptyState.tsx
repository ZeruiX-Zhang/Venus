import type { ReactNode } from "react";

export function EmptyState({
  title,
  body,
  action
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <section className="pca-empty-state" role="status">
      <strong>{title}</strong>
      <p>{body}</p>
      {action}
    </section>
  );
}
