import { apiRequest, queryClient } from "@/lib/queryClient";

export const wishlistService = {
  checkWishlist: async (productTrackingId: string, token: string) => {
    return await apiRequest(
      "GET",
      `/api/wishlist/check/${productTrackingId}`,
      undefined,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  },

  toggleWishlist: async (
    productTrackingId: string,
    isInWishlist: boolean,
    token: string
  ) => {
    if (isInWishlist) {
      return await apiRequest(
        "DELETE",
        `/api/wishlist/${productTrackingId}`,
        undefined,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } else {
      return await apiRequest(
        "POST",
        "/api/wishlist",
        { trackingId: productTrackingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
  },

  updateWishlistCache: (
    productTrackingId: string,
    isNowInWishlist: boolean
  ) => {
    // Update query cache directly with response without triggering GET call
    queryClient.setQueryData(
      [`/api/wishlist/check/${productTrackingId}`],
      { isInWishlist: isNowInWishlist }
    );

    // Also invalidate general wishlist to keep it in sync
    queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
  },
};
