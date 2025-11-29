import { apiRequest, queryClient } from "@/lib/queryClient";

export const cartService = {
  getCartBySessionId: async (sessionId: string) => {
    return await apiRequest("GET", `/api/cart/${sessionId}`);
  },

  getCartByUserId: async (userTrackingId: string, token: string | null) => {
    return await apiRequest(
      "GET",
      `/api/cart/user/${userTrackingId}`,
      undefined,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  },

  getCart: async (
    cartIdentifier: string,
    isUserCart: boolean,
    token: string | null
  ) => {
    if (isUserCart && token) {
      return await cartService.getCartByUserId(cartIdentifier, token);
    }
    return await cartService.getCartBySessionId(cartIdentifier);
  },

  addToCart: async (
    item: any,
    isUserCart: boolean,
    token: string | null
  ) => {
    return await apiRequest(
      "POST",
      "/api/cart",
      item,
      isUserCart && token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined
    );
  },

  updateCartQuantity: async (
    cartItemId: string,
    quantity: number,
    isUserCart: boolean,
    token: string | null
  ) => {
    return await apiRequest(
      "PATCH",
      `/api/cart/${cartItemId}`,
      { quantity },
      isUserCart && token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined
    );
  },

  removeFromCart: async (
    cartItemId: string,
    isUserCart: boolean,
    token: string | null
  ) => {
    return await apiRequest(
      "DELETE",
      `/api/cart/${cartItemId}`,
      {},
      isUserCart && token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined
    );
  },

  mergeCartsOnLogin: async (
    sessionId: string,
    token: string | null
  ) => {
    if (!token) throw new Error("Token required for merge");
    return await apiRequest(
      "POST",
      "/api/cart/merge-on-login",
      { sessionId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  },

  invalidateCartCache: (cartIdentifier: string) => {
    queryClient.invalidateQueries({
      queryKey: ["/api/cart", cartIdentifier],
    });
  },
};
