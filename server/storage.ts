import {
  type Product,
  type InsertProduct,
  type CartItem,
  type InsertCartItem,
  type Order,
  type InsertOrder,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Products
  getAllProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;

  // Cart
  getCartItems(sessionId: string): Promise<CartItem[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItemQuantity(id: string, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: string): Promise<boolean>;
  clearCart(sessionId: string): Promise<void>;

  // Orders
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
}

export class MemStorage implements IStorage {
  private products: Map<string, Product>;
  private cartItems: Map<string, CartItem>;
  private orders: Map<string, Order>;

  constructor() {
    this.products = new Map();
    this.cartItems = new Map();
    this.orders = new Map();
    this.seedProducts();
  }

  private seedProducts() {
    const seedData: Omit<Product, 'id'>[] = [
      {
        name: "Royal Burgundy Silk Saree",
        description: "Exquisite handwoven silk saree with intricate golden zari work. Perfect for weddings and special occasions.",
        price: "12500.00",
        imageUrl: "/attached_assets/generated_images/Burgundy_silk_saree_with_golden_border_42ff257b.png",
        images: [
          "/attached_assets/generated_images/Burgundy_silk_saree_with_golden_border_42ff257b.png",
          "/attached_assets/generated_images/Model_in_burgundy_saree_hero_554d9242.png",
          "/attached_assets/generated_images/Zari_embroidery_close-up_detail_f166f911.png",
          "/attached_assets/generated_images/Black_Banarasi_with_gold_zari_a1a8984b.png",
          "/attached_assets/generated_images/Royal_blue_Banarasi_silk_saree_10d05351.png",
        ],
        fabric: "Silk",
        color: "Burgundy",
        occasion: "Wedding",
        category: "Banarasi",
        inStock: 5,
      },
      {
        name: "Emerald Kanjivaram Saree",
        description: "Traditional Kanjivaram silk saree in rich emerald green with temple border design and contrasting pallu.",
        price: "18000.00",
        imageUrl: "/attached_assets/generated_images/Emerald_Kanjivaram_saree_with_gold_c3e9d260.png",
        images: [
          "/attached_assets/generated_images/Emerald_Kanjivaram_saree_with_gold_c3e9d260.png",
          "/attached_assets/generated_images/Peacock_blue_silk_with_embroidery_1a4cb141.png",
          "/attached_assets/generated_images/Soft_pink_cotton_silk_saree_5cffd59d.png",
          "/attached_assets/generated_images/Turquoise_chiffon_party_saree_c3edb00c.png",
          "/attached_assets/generated_images/Champagne_designer_saree_with_sequins_e15c5a58.png",
        ],
        fabric: "Silk",
        color: "Green",
        occasion: "Wedding",
        category: "Kanjivaram",
        inStock: 3,
      },
      {
        name: "Royal Burgundy Heritage Silk",
        description: "Luxurious pure silk saree in deep burgundy with intricate golden zari border work and traditional paisley motifs. Perfect for weddings and grand celebrations.",
        price: "18500.00",
        fabric: "Silk",
        color: "Burgundy",
        occasion: "Wedding",
        imageUrl: "/attached_assets/generated_images/Burgundy_silk_saree_with_golden_border_42ff257b.png",
        images: [
          "/attached_assets/generated_images/Burgundy_silk_saree_with_golden_border_42ff257b.png",
          "/attached_assets/generated_images/Model_in_burgundy_saree_hero_554d9242.png",
          "/attached_assets/generated_images/Zari_embroidery_close-up_detail_f166f911.png",
          "/attached_assets/generated_images/Black_Banarasi_with_gold_zari_a1a8984b.png",
        ],
        category: "Silk Collection",
        inStock: 5,
      },
      {
        name: "Banarasi Blue Elegance",
        description: "Traditional Banarasi silk saree in royal blue with silver zari weaving and intricate floral patterns. A timeless piece of Indian craftsmanship.",
        price: "22000.00",
        fabric: "Banarasi",
        color: "Blue",
        occasion: "Wedding",
        imageUrl: "/attached_assets/generated_images/Royal_blue_Banarasi_silk_saree_10d05351.png",
        images: [
          "/attached_assets/generated_images/Royal_blue_Banarasi_silk_saree_10d05351.png",
          "/attached_assets/generated_images/Peacock_blue_silk_with_embroidery_1a4cb141.png",
          "/attached_assets/generated_images/Turquoise_chiffon_party_saree_c3edb00c.png",
        ],
        category: "Banarasi Collection",
        inStock: 3,
      },
      {
        name: "Emerald Kanjivaram Heritage",
        description: "Authentic Kanjivaram silk saree in rich emerald green with heavy gold zari border and traditional temple motifs. A South Indian masterpiece.",
        price: "28000.00",
        fabric: "Kanjivaram",
        color: "Green",
        occasion: "Wedding",
        imageUrl: "/attached_assets/generated_images/Emerald_Kanjivaram_saree_with_gold_c3e9d260.png",
        images: [
          "/attached_assets/generated_images/Emerald_Kanjivaram_saree_with_gold_c3e9d260.png",
          "/attached_assets/generated_images/Peacock_blue_silk_with_embroidery_1a4cb141.png",
          "/attached_assets/generated_images/Zari_embroidery_close-up_detail_f166f911.png",
        ],
        category: "Kanjivaram Collection",
        inStock: 2,
      },
      {
        name: "Blush Pink Cotton Silk",
        description: "Lightweight cotton silk saree in soft pink with delicate floral embroidery. Perfect for summer festivities and casual elegance.",
        price: "4500.00",
        fabric: "Cotton Silk",
        color: "Pink",
        occasion: "Festive",
        imageUrl: "/attached_assets/generated_images/Soft_pink_cotton_silk_saree_5cffd59d.png",
        images: [
          "/attached_assets/generated_images/Soft_pink_cotton_silk_saree_5cffd59d.png",
          "/attached_assets/generated_images/Champagne_designer_saree_with_sequins_e15c5a58.png",
          "/attached_assets/generated_images/Model_in_burgundy_saree_hero_554d9242.png",
          "/attached_assets/generated_images/Burgundy_silk_saree_with_golden_border_42ff257b.png",
          "/attached_assets/generated_images/Zari_embroidery_close-up_detail_f166f911.png",
        ],
        category: "Cotton Collection",
        inStock: 8,
      },
      {
        name: "Peacock Blue Designer Saree",
        description: "Stunning pure silk saree in peacock blue with golden peacock motif embroidery. Vibrant colors perfect for festive celebrations.",
        price: "16500.00",
        fabric: "Silk",
        color: "Blue",
        occasion: "Festive",
        imageUrl: "/attached_assets/generated_images/Peacock_blue_silk_with_embroidery_1a4cb141.png",
        images: [
          "/attached_assets/generated_images/Peacock_blue_silk_with_embroidery_1a4cb141.png",
          "/attached_assets/generated_images/Royal_blue_Banarasi_silk_saree_10d05351.png",
          "/attached_assets/generated_images/Turquoise_chiffon_party_saree_c3edb00c.png",
          "/attached_assets/generated_images/Emerald_Kanjivaram_saree_with_gold_c3e9d260.png",
        ],
        category: "Designer Collection",
        inStock: 6,
      },
      {
        name: "Champagne Sequin Saree",
        description: "Contemporary designer saree in champagne beige with intricate pearl and sequin work. Modern Indo-western fusion for elegant parties.",
        price: "12000.00",
        fabric: "Silk",
        color: "Beige",
        occasion: "Party",
        imageUrl: "/attached_assets/generated_images/Champagne_designer_saree_with_sequins_e15c5a58.png",
        images: [
          "/attached_assets/generated_images/Champagne_designer_saree_with_sequins_e15c5a58.png",
          "/attached_assets/generated_images/Soft_pink_cotton_silk_saree_5cffd59d.png",
          "/attached_assets/generated_images/Model_in_burgundy_saree_hero_554d9242.png",
          "/attached_assets/generated_images/Zari_embroidery_close-up_detail_f166f911.png",
          "/attached_assets/generated_images/Peacock_blue_silk_with_embroidery_1a4cb141.png",
        ],
        category: "Designer Collection",
        inStock: 4,
      },
      {
        name: "Classic Black Banarasi",
        description: "Sophisticated black and gold Banarasi silk saree with heavy zari border and traditional Mughal patterns. Timeless elegance for formal occasions.",
        price: "24000.00",
        fabric: "Banarasi",
        color: "Black",
        occasion: "Wedding",
        imageUrl: "/attached_assets/generated_images/Black_Banarasi_with_gold_zari_a1a8984b.png",
        images: [
          "/attached_assets/generated_images/Black_Banarasi_with_gold_zari_a1a8984b.png",
          "/attached_assets/generated_images/Burgundy_silk_saree_with_golden_border_42ff257b.png",
          "/attached_assets/generated_images/Zari_embroidery_close-up_detail_f166f911.png",
          "/attached_assets/generated_images/Royal_blue_Banarasi_silk_saree_10d05351.png",
          "/attached_assets/generated_images/Emerald_Kanjivaram_saree_with_gold_c3e9d260.png",
        ],
        category: "Banarasi Collection",
        inStock: 3,
      },
      {
        name: "Turquoise Chiffon Party Wear",
        description: "Light and flowing chiffon saree in vibrant turquoise with silver sequin work. Perfect for contemporary party celebrations.",
        price: "6500.00",
        fabric: "Chiffon",
        color: "Turquoise",
        occasion: "Party",
        imageUrl: "/attached_assets/generated_images/Turquoise_chiffon_party_saree_c3edb00c.png",
        images: [
          "/attached_assets/generated_images/Turquoise_chiffon_party_saree_c3edb00c.png",
          "/attached_assets/generated_images/Peacock_blue_silk_with_embroidery_1a4cb141.png",
          "/attached_assets/generated_images/Royal_blue_Banarasi_silk_saree_10d05351.png",
          "/attached_assets/generated_images/Emerald_Kanjivaram_saree_with_gold_c3e9d260.png",
          "/attached_assets/generated_images/Champagne_designer_saree_with_sequins_e15c5a58.png",
        ],
        category: "Party Collection",
        inStock: 7,
      },
    ];

    seedData.forEach((data) => {
      const id = randomUUID();
      const product: Product = { ...data, id };
      this.products.set(id, product);
    });
  }

  // Products
  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = { ...insertProduct, id };
    this.products.set(id, product);
    return product;
  }

  // Cart
  async getCartItems(sessionId: string): Promise<CartItem[]> {
    return Array.from(this.cartItems.values()).filter(
      (item) => item.sessionId === sessionId
    );
  }

  async addToCart(insertItem: InsertCartItem): Promise<CartItem> {
    const existingItem = Array.from(this.cartItems.values()).find(
      (item) => item.productId === insertItem.productId && item.sessionId === insertItem.sessionId
    );

    if (existingItem) {
      existingItem.quantity += insertItem.quantity;
      this.cartItems.set(existingItem.id, existingItem);
      return existingItem;
    }

    const id = randomUUID();
    const cartItem: CartItem = { ...insertItem, id };
    this.cartItems.set(id, cartItem);
    return cartItem;
  }

  async updateCartItemQuantity(id: string, quantity: number): Promise<CartItem | undefined> {
    const item = this.cartItems.get(id);
    if (!item) return undefined;

    item.quantity = quantity;
    this.cartItems.set(id, item);
    return item;
  }

  async removeFromCart(id: string): Promise<boolean> {
    return this.cartItems.delete(id);
  }

  async clearCart(sessionId: string): Promise<void> {
    const itemsToDelete = Array.from(this.cartItems.entries())
      .filter(([, item]) => item.sessionId === sessionId)
      .map(([id]) => id);

    itemsToDelete.forEach((id) => this.cartItems.delete(id));
  }

  // Orders
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = {
      ...insertOrder,
      id,
      createdAt: new Date(),
    };
    this.orders.set(id, order);
    return order;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }
}

export const storage = new MemStorage();