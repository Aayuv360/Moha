import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Address } from "@shared/schema";

interface AddressState {
  addresses: Address[];
  selectedAddressId: string | null;
  editingAddressId: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AddressState = {
  addresses: [],
  selectedAddressId: null,
  editingAddressId: null,
  isLoading: false,
  error: null,
};

const addressSlice = createSlice({
  name: "address",
  initialState,
  reducers: {
    setAddresses: (state, action: PayloadAction<Address[]>) => {
      state.addresses = action.payload;
    },
    setSelectedAddressId: (state, action: PayloadAction<string | null>) => {
      state.selectedAddressId = action.payload;
    },
    setEditingAddressId: (state, action: PayloadAction<string | null>) => {
      state.editingAddressId = action.payload;
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    addAddress: (state, action: PayloadAction<Address>) => {
      state.addresses.push(action.payload);
    },
    updateAddress: (state, action: PayloadAction<Address>) => {
      const index = state.addresses.findIndex(
        (addr) => addr.id === action.payload.id,
      );
      if (index !== -1) {
        state.addresses[index] = action.payload;
      }
    },
    deleteAddress: (state, action: PayloadAction<string>) => {
      state.addresses = state.addresses.filter((addr) => addr.id !== action.payload);
    },
    resetAddress: () => initialState,
  },
});

export const {
  setAddresses,
  setSelectedAddressId,
  setEditingAddressId,
  setIsLoading,
  setError,
  addAddress,
  updateAddress,
  deleteAddress,
  resetAddress,
} = addressSlice.actions;

export default addressSlice.reducer;
