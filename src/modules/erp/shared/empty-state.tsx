interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed">
      <div className="text-center">
        <h3 className="font-medium">{title}</h3>

        {description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}