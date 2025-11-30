import type { Address, Order } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export async function getSelectedAddress(
  addresses: Address[],
  token: string | null,
): Promise<{
  address: Address | null;
  pincode: string | null;
  source: "recent_order" | "default" | "first" | "pincode" | null;
}> {
  // Get pincode from sessionStorage if available
  const savedPincode = sessionStorage.getItem("checkout_pincode");
  if (savedPincode) {
    return { address: null, pincode: savedPincode, source: "pincode" };
  }

  if (!addresses || addresses.length === 0) {
    return { address: null, pincode: null, source: null };
  }

  // Try to get most recent order address
  if (token) {
    try {
      const orders = await apiRequest("GET", "/api/orders", undefined);
      if (orders && orders.length > 0) {
        const mostRecentOrder = orders[0]; // Assuming orders are sorted by date
        if (mostRecentOrder.addressId) {
          const addressFromOrder = addresses.find(
            (a) => a.id === mostRecentOrder.addressId,
          );
          if (addressFromOrder) {
            return {
              address: addressFromOrder,
              pincode: null,
              source: "recent_order",
            };
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch orders for address selection:", error);
    }
  }

  // Get default address
  const defaultAddress = addresses.find((a) => a.isDefault);
  if (defaultAddress) {
    return { address: defaultAddress, pincode: null, source: "default" };
  }

  // Get first saved address
  if (addresses.length > 0) {
    return { address: addresses[0], pincode: null, source: "first" };
  }

  return { address: null, pincode: null, source: null };
}
