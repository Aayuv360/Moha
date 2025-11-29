import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";

export default function TrackProduct() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trackingId, setTrackingId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trackingId.trim()) {
      toast({
        title: "Invalid tracking ID",
        description: "Please enter a valid tracking ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Verify the product exists by tracking ID
      const response = await fetch(
        `/api/onlineProducts/tracking/${trackingId.trim()}`
      );
      
      if (!response.ok) {
        throw new Error("Product not found");
      }

      // Navigate to product detail page with tracking ID
      navigate(`/product/track/${trackingId.trim()}`);
    } catch (error) {
      toast({
        title: "Product not found",
        description: "No product found with this tracking ID. Please check and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif mb-4">Track Your Product</h1>
          <p className="text-lg text-muted-foreground">
            Enter your product tracking ID to view details and manage your order.
          </p>
        </div>

        <div className="bg-card rounded-lg p-8 shadow-sm border border-border">
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label htmlFor="tracking-id" className="block text-sm font-medium mb-2">
                Tracking ID
              </label>
              <div className="flex gap-2">
                <Input
                  id="tracking-id"
                  type="text"
                  placeholder="e.g., PROD-ABC123-XYZ789"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                  className="flex-1"
                  data-testid="input-tracking-id"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading || !trackingId.trim()}
                  data-testid="button-track-product"
                  className="gap-2"
                >
                  <Search className="h-4 w-4" />
                  {isLoading ? "Searching..." : "Track"}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Your tracking ID is a unique code provided with your product. It starts with "PROD-".
            </p>
          </form>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">Find Your Product</h3>
            <p className="text-sm text-muted-foreground">
              Search using your unique tracking ID
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-primary font-bold">ℹ</span>
            </div>
            <h3 className="font-semibold mb-1">View Details</h3>
            <p className="text-sm text-muted-foreground">
              See product information and specifications
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-primary font-bold">✓</span>
            </div>
            <h3 className="font-semibold mb-1">Manage Orders</h3>
            <p className="text-sm text-muted-foreground">
              Add to cart or wishlist directly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
