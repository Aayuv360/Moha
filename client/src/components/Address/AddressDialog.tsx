import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { insertAddressSchema } from "@shared/schema";
import { z } from "zod";
import type { Address } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AddressForm from "@/components/Address/AddressForm";

const addressFormSchema = insertAddressSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(10, "Address must be at least 10 characters"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  isDefault: z.boolean().default(false),
});

type AddressFormData = z.infer<typeof addressFormSchema>;

export default function AddressDialog() {
  const { toast } = useToast();
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const { token } = useAuth();

  const { data: addresses = [] } = useQuery<Address[]>({
    queryKey: ["/api/addresses"],
    enabled: !!token,
  });

  const saveAddressMutation = useMutation({
    mutationFn: async (data: AddressFormData) => {
      if (editingAddressId) {
        return await apiRequest(
          "PATCH",
          `/api/addresses/${editingAddressId}`,
          data,
        );
      }
      return await apiRequest("POST", "/api/addresses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      setEditingAddressId(null);
      setShowAddressDialog(false);
      toast({
        title: "Address saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save address",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex justify-between items-center mb-6">
      {token && (
        <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingAddressId(null)}
              data-testid="button-add-new-address"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Address
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAddressId ? "Edit Address" : "Add New Address"}
              </DialogTitle>
            </DialogHeader>
            <AddressForm
              addressId={editingAddressId}
              onSave={(data) => saveAddressMutation.mutate(data)}
              isLoading={saveAddressMutation.isPending}
              defaultValues={
                editingAddressId
                  ? addresses.find((a) => a.id === editingAddressId)
                  : undefined
              }
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
