import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-6xl md:text-8xl font-serif font-light mb-4">404</h1>
        <h2 className="text-2xl md:text-3xl font-serif font-medium mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" data-testid="link-home">
          <Button size="lg">Return Home</Button>
        </Link>
      </div>
    </div>
  );
}
