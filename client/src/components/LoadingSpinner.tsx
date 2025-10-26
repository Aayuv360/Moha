export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16 md:py-24" data-testid="loading-spinner">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-muted rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
