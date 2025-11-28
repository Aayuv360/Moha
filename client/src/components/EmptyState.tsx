import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24 px-4" data-testid="empty-state">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-muted flex items-center justify-center mb-6">
        {icon || <ShoppingBag className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />}
      </div>
      <h2 className="text-2xl md:text-3xl font-serif font-medium mb-3 text-center">
        {title}
      </h2>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        {description}
      </p>
      {actionLabel && actionHref && (
        <Link to={actionHref} data-testid="button-empty-state-action">
          <Button size="lg">{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
}
