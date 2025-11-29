import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { insertAddressSchema } from "@shared/schema";
import { z } from "zod";
import type { Address } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import AddressForm from "@/components/Address/AddressForm";

const addressFormSchema = insertAddressSchema.extend({
  name: z.string().min(2),
  phone: z.string().min(10),
  address: z.string().min(10),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/),
  isDefault: z.boolean().default(false),
});

type AddressFormData = z.infer<typeof addressFormSchema>;

export default function AddressModal({
  modalOpen,
  setModalOpen,
  mode,
  setMode,
}: any) {
  const { toast } = useToast();
  const { token } = useAuth();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  const { data: addresses = [] } = useQuery<Address[]>({
    queryKey: ["/api/addresses"],
    enabled: !!token,
  });

  const selectedAddress = addresses.find((a) => a.id === editingAddressId);

  // ────────────────────────────────────────────────────────────────
  // SAVE / UPDATE ADDRESS
  // ────────────────────────────────────────────────────────────────
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
      setMode("select");
      toast({ title: "Address saved successfully" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save address",
        variant: "destructive",
      });
    },
  });

  // ────────────────────────────────────────────────────────────────
  // DELETE ADDRESS
  // ────────────────────────────────────────────────────────────────
  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/addresses/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({ title: "Address deleted successfully" });
      if (selectedAddressId === editingAddressId) setSelectedAddressId(null);
      setEditingAddressId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete address",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogContent
        className="
          w-[95%] 
          max-w-sm 
          sm:max-w-md 
          md:max-w-lg 
          lg:max-w-xl 
          xl:max-w-2xl 
          p-4 sm:p-6
        "
      >
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {mode === "select"
              ? "Select Address"
              : editingAddressId
                ? "Edit Address"
                : "Add New Address"}
          </DialogTitle>
        </DialogHeader>

        {mode === "select" && (
          <div className="space-y-4">
            <RadioGroup value={selectedAddressId || ""} onValueChange={setSelectedAddressId}>
              <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="flex items-start justify-between p-2 sm:p-3"
                  >
                    <label className="flex items-start gap-3 cursor-pointer flex-1">
                      <RadioGroupItem
                        value={addr.id}
                        id={`address-${addr.id}`}
                        className="mt-1"
                      />

                      <div className="text-sm sm:text-base">
                        <p className="font-medium flex items-center gap-2">
                          {addr.name}

                          {addr.isDefault && (
                            <span className="px-2 py-0.5 text-[10px] sm:text-xs bg-primary text-white rounded">
                              Default
                            </span>
                          )}
                        </p>

                        <p className="text-muted-foreground">
                          {addr.address}, {addr.city}
                        </p>

                        <p className="text-xs sm:text-sm text-gray-500">
                          Phone: {addr.phone}
                        </p>
                      </div>
                    </label>

                    <div className="flex gap-2">
                      {/* EDIT BUTTON */}
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          setEditingAddressId(addr.id);
                          setMode("add");
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => deleteAddressMutation.mutate(addr.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setEditingAddressId(null);
                setMode("add");
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> Add New Address
            </Button>
          </div>
        )}

        {mode === "add" && (
          <AddressForm
            defaultValues={selectedAddress || undefined}
            onSave={(data) => saveAddressMutation.mutate(data as any)}
            isLoading={saveAddressMutation.isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
