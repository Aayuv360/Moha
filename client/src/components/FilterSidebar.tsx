import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";

interface FilterSidebarProps {
  filters: {
    fabric: string;
    occasion: string;
    priceRange: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

export function FilterSidebar({
  filters,
  onFilterChange,
  onClearFilters,
  isMobile = false,
  onClose,
}: FilterSidebarProps) {
  const fabricOptions = [
    "All",
    "Silk",
    "Cotton Silk",
    "Banarasi",
    "Chiffon",
    "Kanjivaram",
  ];
  const occasionOptions = ["All", "Wedding", "Festive", "Casual", "Party"];
  const priceRangeOptions = [
    { label: "All", value: "all" },
    { label: "Under ₹5,000", value: "0-5000" },
    { label: "₹5,000 - ₹10,000", value: "5000-10000" },
    { label: "₹10,000 - ₹20,000", value: "10000-20000" },
    { label: "Above ₹20,000", value: "20000-999999" },
  ];

  return (
    <div className="bg-card rounded-lg p-6">
      {isMobile && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif font-medium">Filters</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-testid="button-close-filters"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-mono uppercase tracking-wider">
          Filter By
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-xs"
          data-testid="button-clear-filters"
        >
          Clear All
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <Label className="text-base font-medium mb-4 block">Fabric</Label>
          <RadioGroup
            value={filters.fabric}
            onValueChange={(value) => onFilterChange("fabric", value)}
          >
            {fabricOptions.map((option) => (
              <div key={option} className="flex items-center space-x-2 mb-3">
                <RadioGroupItem
                  value={option}
                  id={`fabric-${option}`}
                  data-testid={`radio-fabric-${option}`}
                />
                <Label
                  htmlFor={`fabric-${option}`}
                  className="cursor-pointer font-normal"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Separator />

        <div>
          <Label className="text-base font-medium mb-4 block">Occasion</Label>
          <RadioGroup
            value={filters.occasion}
            onValueChange={(value) => onFilterChange("occasion", value)}
          >
            {occasionOptions.map((option) => (
              <div key={option} className="flex items-center space-x-2 mb-3">
                <RadioGroupItem
                  value={option}
                  id={`occasion-${option}`}
                  data-testid={`radio-occasion-${option}`}
                />
                <Label
                  htmlFor={`occasion-${option}`}
                  className="cursor-pointer font-normal"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Separator />

        <div>
          <Label className="text-base font-medium mb-4 block">
            Price Range
          </Label>
          <RadioGroup
            value={filters.priceRange}
            onValueChange={(value) => onFilterChange("priceRange", value)}
          >
            {priceRangeOptions.map((option) => (
              <div
                key={option.value}
                className="flex items-center space-x-2 mb-3"
              >
                <RadioGroupItem
                  value={option.value}
                  id={`price-${option.value}`}
                  data-testid={`radio-price-${option.value}`}
                />
                <Label
                  htmlFor={`price-${option.value}`}
                  className="cursor-pointer font-normal"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
    </div>
  );
}
