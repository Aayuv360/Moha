import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import AddressForm from "./AddressForm";
import { type RootState } from "@/lib/store";
import {
  setSelectedAddressId,
  setEditingAddressId,
} from "../store/addressSlice";
import {
  useSaveAddressMutation,
  useDeleteAddressMutation,
  useFetchAddresses,
  type AddressFormData,
} from "../services/addressService";
import { useAuth } from "@/lib/auth";

export default function AddressModal({
  modalOpen,
  setModalOpen,
  mode,
  setMode,
}: any) {
  const dispatch = useDispatch();
  const { token } = useAuth();
  const { addresses, selectedAddressId, editingAddressId } = useSelector(
    (state: RootState) => state.address,
  );

  useFetchAddresses(!!token && modalOpen);

  const selectedAddress = addresses.find((a) => a.id === editingAddressId);
  const saveAddressMutation = useSaveAddressMutation();
  const deleteAddressMutation = useDeleteAddressMutation();

  const handleSaveAddress = (data: AddressFormData) => {
    saveAddressMutation.mutate({
      formData: data,
      id: editingAddressId || undefined,
    });
    if (!editingAddressId) {
      setMode("select");
    } else {
      dispatch(setEditingAddressId(null));
      setMode("select");
    }
  };

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
            {mode === "select" ? (
              "Select Address"
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="p-1"
                  onClick={() => {
                    setMode("select");
                  }}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                {editingAddressId ? "Edit Address" : "Add New Address"}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {mode === "select" && (
          <div className="space-y-4">
            <RadioGroup
              value={selectedAddressId || ""}
              onValueChange={(value) => {
                dispatch(setSelectedAddressId(value));
              }}
            >
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
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          dispatch(setEditingAddressId(addr.id));
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
                dispatch(setEditingAddressId(null));
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
            onSave={handleSaveAddress}
            isLoading={saveAddressMutation.isPending}
            onBack={() => {
              dispatch(setEditingAddressId(null));
              setMode("select");
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
