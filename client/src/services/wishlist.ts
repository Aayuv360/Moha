import { apiRequest, queryClient } from "@/lib/queryClient";
import type { WishlistItem } from "@shared/schema";

export const wishlistService = {
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
    // Get current wishlist from cache
    const currentWishlist = queryClient.getQueryData<WishlistItem[]>([
      "/api/wishlist",
    ]) || [];

    // Update the wishlist by adding or removing the product
    let updatedWishlist: WishlistItem[];
    if (isNowInWishlist) {
      // Add to wishlist if not already present
      if (!currentWishlist.some((w) => w.productId === productTrackingId)) {
        updatedWishlist = [
          ...currentWishlist,
          { id: "", userId: "", productId: productTrackingId, createdAt: new Date() },
        ];
      } else {
        updatedWishlist = currentWishlist;
      }
    } else {
      // Remove from wishlist
      updatedWishlist = currentWishlist.filter(
        (w) => w.productId !== productTrackingId
      );
    }

    // Update the cache
    queryClient.setQueryData(["/api/wishlist"], updatedWishlist);
  },
};
