import {
  type Product,
  type InsertProduct,
  type CartItem,
  type InsertCartItem,
  type Order,
  type InsertOrder,
  type User,
  type InsertUser,
  type WishlistItem,
  type InsertWishlistItem,
  type Inventory,
  type InsertInventory,
  type Return,
  type InsertReturn,
  products,
  cartItems,
  orders,
  users,
  wishlistItems,
  inventories,
  returns,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, or, ilike, sql, gte, lte } from "drizzle-orm";

interface ProductFilters {
  search?: string;
  fabric?: string;
  occasion?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface IStorage {
  // Users
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  blockUser(id: string): Promise<void>;
  unblockUser(id: string): Promise<void>;

  // Inventories
  createInventory(inventory: InsertInventory): Promise<Inventory>;
  getInventoryByEmail(email: string): Promise<Inventory | undefined>;
  getInventoryById(id: string): Promise<Inventory | undefined>;
  getAllInventories(): Promise<Inventory[]>;
  deleteInventory(id: string): Promise<boolean>;

  // Products
  getAllProducts(filters?: ProductFilters): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(
    id: string,
    updates: Partial<Product>,
  ): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  getInventoryProducts(inventoryId: string): Promise<Product[]>;

  // Cart
  getCartItems(sessionId: string): Promise<CartItem[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItemQuantity(
    id: string,
    quantity: number,
  ): Promise<CartItem | undefined>;
  removeFromCart(id: string): Promise<boolean>;
  clearCart(sessionId: string): Promise<void>;

  // Orders
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getUserOrders(userId: string): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  getInventoryOrders(inventoryId: string): Promise<Order[]>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined>;

  // Wishlist
  getUserWishlist(userId: string): Promise<WishlistItem[]>;
  addToWishlist(item: InsertWishlistItem): Promise<WishlistItem>;
  removeFromWishlist(userId: string, productId: string): Promise<boolean>;
  isInWishlist(userId: string, productId: string): Promise<boolean>;

  // Returns
  createReturn(returnData: InsertReturn): Promise<Return>;
  getUserReturns(userId: string): Promise<Return[]>;
  getInventoryReturns(inventoryId: string): Promise<Return[]>;
  getReturn(id: string): Promise<Return | undefined>;
  updateReturnStatus(id: string, status: string): Promise<Return | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(
    id: string,
    updates: Partial<User>,
  ): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async blockUser(id: string): Promise<void> {
    await db.update(users).set({ isBlocked: true }).where(eq(users.id, id));
  }

  async unblockUser(id: string): Promise<void> {
    await db.update(users).set({ isBlocked: false }).where(eq(users.id, id));
  }

  async createInventory(insertInventory: InsertInventory): Promise<Inventory> {
    const [inventory] = await db
      .insert(inventories)
      .values(insertInventory)
      .returning();
    return inventory;
  }

  async getInventoryByEmail(email: string): Promise<Inventory | undefined> {
    const [inventory] = await db
      .select()
      .from(inventories)
      .where(eq(inventories.email, email));
    return inventory || undefined;
  }

  async getInventoryById(id: string): Promise<Inventory | undefined> {
    const [inventory] = await db
      .select()
      .from(inventories)
      .where(eq(inventories.id, id));
    return inventory || undefined;
  }

  async getAllInventories(): Promise<Inventory[]> {
    return await db.select().from(inventories);
  }

  async deleteInventory(id: string): Promise<boolean> {
    const result = await db
      .delete(inventories)
      .where(eq(inventories.id, id))
      .returning();
    return result.length > 0;
  }

  async getAllProducts(filters?: ProductFilters): Promise<Product[]> {
    const conditions: any[] = [];

    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(products.name, searchPattern),
          ilike(products.description, searchPattern),
          ilike(products.category, searchPattern),
          ilike(products.fabric, searchPattern),
          ilike(products.color, searchPattern),
        ),
      );
    }

    if (filters?.fabric && filters.fabric !== "All") {
      conditions.push(eq(products.fabric, filters.fabric));
    }

    if (filters?.occasion && filters.occasion !== "All") {
      conditions.push(eq(products.occasion, filters.occasion));
    }

    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
        conditions.push(
          and(
            gte(sql`CAST(${products.price} AS DECIMAL)`, filters.minPrice),
            lte(sql`CAST(${products.price} AS DECIMAL)`, filters.maxPrice),
          ),
        );
      } else if (filters.minPrice !== undefined) {
        conditions.push(
          gte(sql`CAST(${products.price} AS DECIMAL)`, filters.minPrice),
        );
      } else if (filters.maxPrice !== undefined) {
        conditions.push(
          lte(sql`CAST(${products.price} AS DECIMAL)`, filters.maxPrice),
        );
      }
    }

    if (conditions.length === 0) {
      return await db.select().from(products);
    }

    return await db
      .select()
      .from(products)
      .where(and(...conditions));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  async updateProduct(
    id: string,
    updates: Partial<Product>,
  ): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();
    return result.length > 0;
  }

  async getInventoryProducts(inventoryId: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.inventoryId, inventoryId));
  }

  async getCartItems(sessionId: string): Promise<CartItem[]> {
    return await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.sessionId, sessionId));
  }

  async addToCart(insertItem: InsertCartItem): Promise<CartItem> {
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.productId, insertItem.productId),
          eq(cartItems.sessionId, insertItem.sessionId),
        ),
      );

    if (existingItem) {
      const [updatedItem] = await db
        .update(cartItems)
        .set({ quantity: existingItem.quantity + insertItem.quantity })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updatedItem;
    }

    const [cartItem] = await db
      .insert(cartItems)
      .values(insertItem)
      .returning();
    return cartItem;
  }

  async updateCartItemQuantity(
    id: string,
    quantity: number,
  ): Promise<CartItem | undefined> {
    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return updatedItem || undefined;
  }

  async removeFromCart(id: string): Promise<boolean> {
    const result = await db
      .delete(cartItems)
      .where(eq(cartItems.id, id))
      .returning();
    return result.length > 0;
  }

  async clearCart(sessionId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    return order;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getInventoryOrders(inventoryId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.inventoryId, inventoryId))
      .orderBy(desc(orders.createdAt));
  }

  async updateOrderStatus(
    id: string,
    status: string,
  ): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  async updateOrder(
    id: string,
    updates: Partial<Order>,
  ): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  async getUserWishlist(userId: string): Promise<WishlistItem[]> {
    return await db
      .select()
      .from(wishlistItems)
      .where(eq(wishlistItems.userId, userId))
      .orderBy(desc(wishlistItems.createdAt));
  }

  async addToWishlist(item: InsertWishlistItem): Promise<WishlistItem> {
    const existing = await db
      .select()
      .from(wishlistItems)
      .where(
        and(
          eq(wishlistItems.userId, item.userId),
          eq(wishlistItems.productId, item.productId),
        ),
      );

    if (existing.length > 0) {
      return existing[0];
    }

    const [wishlistItem] = await db
      .insert(wishlistItems)
      .values(item)
      .returning();
    return wishlistItem;
  }

  async removeFromWishlist(
    userId: string,
    productId: string,
  ): Promise<boolean> {
    const result = await db
      .delete(wishlistItems)
      .where(
        and(
          eq(wishlistItems.userId, userId),
          eq(wishlistItems.productId, productId),
        ),
      )
      .returning();
    return result.length > 0;
  }

  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const [item] = await db
      .select()
      .from(wishlistItems)
      .where(
        and(
          eq(wishlistItems.userId, userId),
          eq(wishlistItems.productId, productId),
        ),
      );
    return !!item;
  }

  async createReturn(returnData: InsertReturn): Promise<Return> {
    const [returnRecord] = await db
      .insert(returns)
      .values(returnData)
      .returning();
    return returnRecord;
  }

  async getUserReturns(userId: string): Promise<Return[]> {
    return await db
      .select()
      .from(returns)
      .where(eq(returns.userId, userId))
      .orderBy(desc(returns.createdAt));
  }

  async getInventoryReturns(inventoryId: string): Promise<Return[]> {
    return await db
      .select()
      .from(returns)
      .where(eq(returns.inventoryId, inventoryId))
      .orderBy(desc(returns.createdAt));
  }

  async getReturn(id: string): Promise<Return | undefined> {
    const [returnRecord] = await db
      .select()
      .from(returns)
      .where(eq(returns.id, id));
    return returnRecord || undefined;
  }

  async updateReturnStatus(id: string, status: string): Promise<Return | undefined> {
    const [returnRecord] = await db
      .update(returns)
      .set({ status })
      .where(eq(returns.id, id))
      .returning();
    return returnRecord || undefined;
  }

  async seedProducts(): Promise<void> {
    const existingProducts = await this.getAllProducts();
    if (existingProducts.length > 0) {
      return;
    }

    const seedData: InsertProduct[] = [
      {
        name: "Royal Burgundy Silk Saree",
        description:
          "Exquisite handwoven silk saree with intricate golden zari work. Perfect for weddings and special occasions.",
        price: "12500.00",
        imageUrl:
          "https://placehold.co/600x800/8b0000/ffffff?text=Burgundy+Silk+Saree",
        images: [
          "https://placehold.co/600x800/8b0000/ffffff?text=Burgundy+Silk+Saree",
          "https://placehold.co/600x800/8b0000/ffffff?text=Model+View",
          "https://placehold.co/600x800/8b0000/ffffff?text=Zari+Detail",
        ],
        fabric: "Silk",
        color: "Burgundy",
        occasion: "Wedding",
        category: "Banarasi",
        inStock: 5,
      },
      {
        name: "Emerald Kanjivaram Saree",
        description:
          "Traditional Kanjivaram silk saree in rich emerald green with temple border design and contrasting pallu.",
        price: "18000.00",
        imageUrl:
          "https://placehold.co/600x800/059669/ffffff?text=Emerald+Kanjivaram",
        images: [
          "https://placehold.co/600x800/059669/ffffff?text=Emerald+Kanjivaram",
          "https://placehold.co/600x800/059669/ffffff?text=Detail+View",
        ],
        fabric: "Silk",
        color: "Green",
        occasion: "Wedding",
        category: "Kanjivaram",
        inStock: 3,
      },
      {
        name: "Royal Burgundy Heritage Silk",
        description:
          "Luxurious pure silk saree in deep burgundy with intricate golden zari border work and traditional paisley motifs. Perfect for weddings and grand celebrations.",
        price: "18500.00",
        fabric: "Silk",
        color: "Burgundy",
        occasion: "Wedding",
        imageUrl:
          "https://placehold.co/600x800/8b0000/ffffff?text=Heritage+Silk",
        images: [
          "https://placehold.co/600x800/8b0000/ffffff?text=Heritage+Silk",
          "https://placehold.co/600x800/8b0000/ffffff?text=Full+View",
          "https://placehold.co/600x800/8b0000/ffffff?text=Zari+Work",
        ],
        category: "Silk Collection",
        inStock: 5,
      },
      {
        name: "Banarasi Blue Elegance",
        description:
          "Traditional Banarasi silk saree in royal blue with silver zari weaving and intricate floral patterns. A timeless piece of Indian craftsmanship.",
        price: "22000.00",
        fabric: "Banarasi",
        color: "Blue",
        occasion: "Wedding",
        imageUrl:
          "https://placehold.co/600x800/1e40af/ffffff?text=Royal+Blue+Banarasi",
        images: [
          "https://placehold.co/600x800/1e40af/ffffff?text=Royal+Blue+Banarasi",
          "https://placehold.co/600x800/1e40af/ffffff?text=Zari+Detail",
        ],
        category: "Banarasi Collection",
        inStock: 3,
      },
      {
        name: "Emerald Kanjivaram Heritage",
        description:
          "Authentic Kanjivaram silk saree in rich emerald green with heavy gold zari border and traditional temple motifs. A South Indian masterpiece.",
        price: "28000.00",
        fabric: "Kanjivaram",
        color: "Green",
        occasion: "Wedding",
        imageUrl:
          "https://placehold.co/600x800/059669/ffffff?text=Kanjivaram+Heritage",
        images: [
          "https://placehold.co/600x800/059669/ffffff?text=Kanjivaram+Heritage",
          "https://placehold.co/600x800/059669/ffffff?text=Temple+Motif",
        ],
        category: "Kanjivaram Collection",
        inStock: 2,
      },
      {
        name: "Blush Pink Cotton Silk",
        description:
          "Lightweight cotton silk saree in soft pink with delicate floral embroidery. Perfect for summer festivities and casual elegance.",
        price: "4500.00",
        fabric: "Cotton Silk",
        color: "Pink",
        occasion: "Festive",
        imageUrl:
          "https://placehold.co/600x800/fbbf24/ffffff?text=Blush+Pink+Cotton",
        images: [
          "https://placehold.co/600x800/fbbf24/ffffff?text=Blush+Pink+Cotton",
          "https://placehold.co/600x800/fbbf24/ffffff?text=Embroidery+Detail",
        ],
        category: "Cotton Collection",
        inStock: 8,
      },
      {
        name: "Peacock Blue Designer Saree",
        description:
          "Stunning pure silk saree in peacock blue with golden peacock motif embroidery. Vibrant colors perfect for festive celebrations.",
        price: "16500.00",
        fabric: "Silk",
        color: "Blue",
        occasion: "Festive",
        imageUrl:
          "https://placehold.co/600x800/0891b2/ffffff?text=Peacock+Blue+Designer",
        images: [
          "https://placehold.co/600x800/0891b2/ffffff?text=Peacock+Blue+Designer",
          "https://placehold.co/600x800/0891b2/ffffff?text=Peacock+Motif",
        ],
        category: "Designer Collection",
        inStock: 6,
      },
      {
        name: "Champagne Sequin Saree",
        description:
          "Contemporary designer saree in champagne beige with intricate pearl and sequin work. Modern Indo-western fusion for elegant parties.",
        price: "12000.00",
        fabric: "Silk",
        color: "Beige",
        occasion: "Party",
        imageUrl:
          "https://placehold.co/600x800/d4af37/ffffff?text=Champagne+Sequin",
        images: [
          "https://placehold.co/600x800/d4af37/ffffff?text=Champagne+Sequin",
          "https://placehold.co/600x800/d4af37/ffffff?text=Sequin+Detail",
        ],
        category: "Designer Collection",
        inStock: 4,
      },
      {
        name: "Classic Black Banarasi",
        description:
          "Sophisticated black and gold Banarasi silk saree with heavy zari border and traditional Mughal patterns. Timeless elegance for formal occasions.",
        price: "24000.00",
        fabric: "Banarasi",
        color: "Black",
        occasion: "Wedding",
        imageUrl:
          "https://placehold.co/600x800/000000/ffd700?text=Classic+Black+Banarasi",
        images: [
          "https://placehold.co/600x800/000000/ffd700?text=Classic+Black+Banarasi",
          "https://placehold.co/600x800/000000/ffd700?text=Zari+Border",
        ],
        category: "Banarasi Collection",
        inStock: 3,
      },
      {
        name: "Turquoise Chiffon Party Wear",
        description:
          "Light and flowing chiffon saree in vibrant turquoise with silver sequin work. Perfect for contemporary party celebrations.",
        price: "6500.00",
        fabric: "Chiffon",
        color: "Turquoise",
        occasion: "Party",
        imageUrl:
          "https://placehold.co/600x800/14b8a6/ffffff?text=Turquoise+Chiffon",
        images: [
          "https://placehold.co/600x800/14b8a6/ffffff?text=Turquoise+Chiffon",
          "https://placehold.co/600x800/14b8a6/ffffff?text=Sequin+Work",
        ],
        category: "Party Collection",
        inStock: 7,
      },
    ];

    for (const data of seedData) {
      await this.createProduct(data);
    }
  }
}

export const storage = new DatabaseStorage();
