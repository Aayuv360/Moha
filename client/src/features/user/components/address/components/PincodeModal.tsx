import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PincodeModalProps {
  open: boolean;
  onClose: () => void;
  onValidPincode: (pincode: string) => void;
}

export default function PincodeModal({
  open,
  onClose,
  onValidPincode,
}: PincodeModalProps) {
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCheck = async () => {
    if (pincode.length !== 6) {
      toast({
        title: "Invalid Pincode",
        description: "Pincode must be 6 digits",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/validate-pincode", {
        pincode,
      });

      if (response.valid) {
        sessionStorage.setItem("checkout_pincode", pincode);
        onValidPincode(pincode);
        setPincode("");
        onClose();
        toast({
          title: "Pincode verified",
          description: `Delivery available for pincode ${pincode}`,
        });
      } else {
        toast({
          title: "Delivery not available",
          description: "This pincode is not in our delivery area",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to validate pincode",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95%] max-w-sm p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Check Delivery Availability</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Enter Pincode</label>
            <Input
              type="text"
              placeholder="e.g., 560001"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.slice(0, 6))}
              maxLength={6}
              className="mt-2"
              data-testid="input-pincode"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              data-testid="button-pincode-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCheck}
              disabled={loading || pincode.length !== 6}
              className="flex-1"
              data-testid="button-pincode-check"
            >
              {loading ? "Checking..." : "Check"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
