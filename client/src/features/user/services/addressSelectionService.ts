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
  const savedPincode = sessionStorage.getItem("checkout_pincode");

  // 1. If user manually entered pincode
  if (savedPincode) {
    return { address: null, pincode: savedPincode, source: "pincode" };
  }

  // 2. If no addresses, NEVER call /api/orders
  if (!addresses || addresses.length === 0) {
    return { address: null, pincode: null, source: null };
  }

  // 3. If token exists AND addresses exist → fetch orders
  if (token) {
    try {
      const orders = await apiRequest("GET", "/api/orders", undefined);

      if (orders && orders.length > 0) {
        const mostRecentOrder = orders[0];

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

  // 4. Default address
  const defaultAddress = addresses.find((a) => a.isDefault);
  if (defaultAddress) {
    return { address: defaultAddress, pincode: null, source: "default" };
  }

  // 5. First address
  return { address: addresses[0], pincode: null, source: "first" };
}
