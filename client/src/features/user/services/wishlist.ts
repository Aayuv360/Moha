import { apiRequest, queryClient } from "@/lib/queryClient";
import type { WishlistItem } from "@shared/schema";

export const wishlistService = {
  toggleWishlist: async (
    productTrackingId: string,
    isInWishlist: boolean,
    token: string,
  ) => {
    if (isInWishlist) {
      return await apiRequest(
        "DELETE",
        `/api/wishlist/${productTrackingId}`,
        undefined,
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } else {
      return await apiRequest(
        "POST",
        "/api/wishlist",
        { trackingId: productTrackingId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    }
  },

  updateWishlistCache: (
    productTrackingId: string,
    isNowInWishlist: boolean,
  ) => {
    const currentWishlist =
      queryClient.getQueryData<WishlistItem[]>(["/api/wishlist"]) || [];

    let updatedWishlist: WishlistItem[];
    if (isNowInWishlist) {
      if (!currentWishlist.some((w) => w.productId === productTrackingId)) {
        updatedWishlist = [
          ...currentWishlist,
          {
            id: "",
            userId: "",
            productId: productTrackingId,
            createdAt: new Date(),
          },
        ];
      } else {
        updatedWishlist = currentWishlist;
      }
    } else {
      updatedWishlist = currentWishlist.filter(
        (w) => w.productId !== productTrackingId,
      );
    }

    queryClient.setQueryData(["/api/wishlist"], updatedWishlist);
  },
};
