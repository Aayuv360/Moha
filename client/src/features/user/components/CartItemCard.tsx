import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Product } from "@shared/schema";

interface CartItemCardProps {
  item: {
    id: string;
    quantity: number;
    product: Product;
  };
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export function CartItemCard({
  item,
  onUpdateQuantity,
  onRemove,
}: CartItemCardProps) {
  const { product, quantity } = item;
  const subtotal = parseFloat(product.price);
  const image = product.images
    .replace(/[{}]/g, "")
    .split(",")
    .map((s: string) => s.replace(/"/g, ""))[0];
  return (
    <Card className="p-4 md:p-6" data-testid={`cart-item-${item.id}`}>
      <div className="flex gap-4 md:gap-6">
        <div className="w-24 h-32 md:w-32 md:h-40 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between gap-4 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg md:text-xl font-serif font-medium mb-1 truncate">
                {product.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {product.fabric} • {product.color}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(item.id)}
              data-testid={`button-remove-${item.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  onUpdateQuantity(item.id, Math.max(1, quantity - 1))
                }
                disabled={quantity <= 1}
                data-testid={`button-decrease-${item.id}`}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span
                className="text-base font-medium w-12 text-center"
                data-testid={`text-quantity-${item.id}`}
              >
                {quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onUpdateQuantity(item.id, quantity + 1)}
                disabled={quantity >= 10}
                data-testid={`button-increase-${item.id}`}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <p
              className="text-2xl md:text-3xl font-semibold"
              data-testid={`text-subtotal-${item.id}`}
            >
              ₹{subtotal.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
