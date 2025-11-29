export interface Product {
  id: string;
  trackingId: string;
  name: string;
  description: string;
  price: string;
  images: string;
  videoUrl: string | null;
  fabric: string;
  color: string;
  occasion: string;
  category: string;
  inStock: number;
  inventoryId: string;
  createdAt: string;
}

export interface CartItem {
  id: string;
  userId: string;
  quantity: number;
  productId: string;
  product: Product;
}
