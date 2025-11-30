import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddressForm from "./AddressForm";
import { type RootState } from "@/lib/store";
import { setEditingAddressId } from "../store/addressSlice";
import {
  useSaveAddressMutation,
  useFetchAddresses,
  type AddressFormData,
} from "../services/addressService";
import { useAuth } from "@/lib/auth";

export default function CheckoutAddressModal({ modalOpen, setModalOpen }: any) {
  const dispatch = useDispatch();
  const { token } = useAuth();
  const { addresses, editingAddressId } = useSelector(
    (state: RootState) => state.address,
  );

  useFetchAddresses(!!token && modalOpen);

  const selectedAddress = addresses.find((a) => a.id === editingAddressId);
  const saveAddressMutation = useSaveAddressMutation();

  const handleSaveAddress = (data: AddressFormData) => {
    saveAddressMutation.mutate({
      formData: data,
      id: editingAddressId || undefined,
    });
  };

  useEffect(() => {
    if (saveAddressMutation.isSuccess) {
      dispatch(setEditingAddressId(null));
      setModalOpen(false);
    }
  }, [saveAddressMutation.isSuccess, dispatch]);
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
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            {editingAddressId ? "Edit Address" : "Add New Address"}
          </DialogTitle>
        </DialogHeader>

        <AddressForm
          defaultValues={selectedAddress || undefined}
          onSave={handleSaveAddress}
          isLoading={saveAddressMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
