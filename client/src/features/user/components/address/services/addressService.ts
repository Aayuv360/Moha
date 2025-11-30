import { useMutation, useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "@/hooks/use-toast";
import type { Address } from "@shared/schema";
import { insertAddressSchema } from "@shared/schema";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  setAddresses,
  setError,
  addAddress,
  updateAddress,
  deleteAddress,
  setSelectedAddressId,
} from "../store/addressSlice";
import { RootState } from "@/lib/store";

export const addressFormSchema = insertAddressSchema
  .omit({ userId: true })
  .extend({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    address: z.string().min(10, "Address must be at least 10 characters"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
    isDefault: z.boolean().default(false),
  });

export type AddressFormData = z.infer<typeof addressFormSchema>;

export function useFetchAddresses(enabled: boolean = true) {
  const dispatch = useDispatch();

  return useQuery<Address[]>({
    queryKey: ["/api/addresses"],
    queryFn: async () => {
      const data = await apiRequest("GET", "/api/addresses", undefined);
      dispatch(setAddresses(data));
      return data;
    },
    enabled,
  });
}

export function useSaveAddressMutation() {
  const { toast } = useToast();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async (data: { formData: AddressFormData; id?: string }) => {
      if (data.id) {
        return await apiRequest(
          "PATCH",
          `/api/addresses/${data.id}`,
          data.formData,
        );
      }
      return await apiRequest("POST", "/api/addresses", data.formData);
    },
    onSuccess: (addresses: Address[], variables) => {
      dispatch(setAddresses(addresses));
      queryClient.setQueryData(["/api/addresses"], addresses);
      if (variables.id) {
        toast({ title: "Address updated successfully" });
      } else {
        toast({ title: "Address saved successfully" });
      }
    },
    onError: () => {
      dispatch(setError("Failed to save address"));
      toast({
        title: "Error",
        description: "Failed to save address",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteAddressMutation() {
  const { toast } = useToast();
  const dispatch = useDispatch();
  const { selectedAddressId } = useSelector(
    (state: RootState) => state.address,
  );
  return useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/addresses/${id}`, {});
    },
    onSuccess: (addresses: Address[], deletedId: string) => {
      if (selectedAddressId === deletedId) {
        dispatch(setSelectedAddressId(null));
      }
      dispatch(setAddresses(addresses));
      queryClient.setQueryData(["/api/addresses"], addresses);
      toast({ title: "Address deleted successfully" });
    },
    onError: () => {
      dispatch(setError("Failed to delete address"));
      toast({
        title: "Error",
        description: "Failed to delete address",
        variant: "destructive",
      });
    },
  });
}
