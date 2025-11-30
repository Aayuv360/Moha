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
  type StoreProductInventory,
  type InsertStoreProductInventory,
  type Address,
  type InsertAddress,
  products,
  cartItems,
  orders,
  users,
  wishlistItems,
  inventories,
  returns,
  storeProductInventory,
  addresses,
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
  getProductByTrackingId(trackingId: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(
    id: string,
    updates: Partial<Product>,
  ): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  getInventoryProducts(inventoryId: string): Promise<Product[]>;

  // Cart
  getCartItems(sessionId: string): Promise<CartItem[]>;
  getCartItemsByUserId(userId: string): Promise<CartItem[]>;
  getCartItemById(id: string): Promise<CartItem | undefined>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItemQuantity(
    id: string,
    quantity: number,
  ): Promise<CartItem | undefined>;
  removeFromCart(id: string): Promise<boolean>;
  clearCart(sessionId: string): Promise<void>;
  mergeCartsOnLogin(sessionId: string, userId: string): Promise<void>;

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

  // Store Product Inventory
  getProductInventoryByStore(
    productId: string,
    storeId: string,
  ): Promise<StoreProductInventory | undefined>;
  getProductInventoryByProduct(
    productId: string,
  ): Promise<StoreProductInventory[]>;
  updateStoreProductInventory(
    productId: string,
    storeId: string,
    quantity: number,
    channel?: string,
  ): Promise<StoreProductInventory>;

  // Addresses
  createAddress(address: InsertAddress): Promise<Address>;
  getUserAddresses(userId: string): Promise<Address[]>;
  getAddress(id: string): Promise<Address | undefined>;
  updateAddress(id: string, updates: Partial<Address>): Promise<Address | undefined>;
  deleteAddress(id: string): Promise<boolean>;
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

  async getProductByTrackingId(trackingId: string): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.trackingId, trackingId));
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

  async getCartItemsByUserId(userId: string): Promise<CartItem[]> {
    return await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.userId, userId));
  }

  async getCartItemById(id: string): Promise<CartItem | undefined> {
    const [item] = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.id, id));
    return item || undefined;
  }

  async addToCart(insertItem: InsertCartItem): Promise<CartItem> {
    let whereCondition: any;
    
    if (insertItem.sessionId) {
      whereCondition = and(
        eq(cartItems.productId, insertItem.productId),
        eq(cartItems.sessionId, insertItem.sessionId)
      );
    } else if (insertItem.userId) {
      whereCondition = and(
        eq(cartItems.productId, insertItem.productId),
        eq(cartItems.userId, insertItem.userId)
      );
    } else {
      throw new Error("Either sessionId or userId must be provided");
    }

    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(whereCondition);

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

  async mergeCartsOnLogin(sessionId: string, userId: string): Promise<void> {
    const sessionCartItems = await this.getCartItems(sessionId);
    const userCartItems = await this.getCartItemsByUserId(userId);

    const userCartMap = new Map(
      userCartItems.map((item) => [item.productId, item]),
    );

    for (const sessionItem of sessionCartItems) {
      const existingUserItem = userCartMap.get(sessionItem.productId);

      if (existingUserItem) {
        await db
          .update(cartItems)
          .set({
            quantity:
              existingUserItem.quantity + sessionItem.quantity,
          })
          .where(eq(cartItems.id, existingUserItem.id));
      } else {
        await db
          .update(cartItems)
          .set({ userId, sessionId: null })
          .where(eq(cartItems.id, sessionItem.id));
      }
    }

    await db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
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
    const updates: any = { status };
    if (status === "shipped") updates.shippedAt = new Date();
    if (status === "delivered") updates.deliveredAt = new Date();

    const [order] = await db
      .update(orders)
      .set(updates)
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

  async updateReturnStatus(
    id: string,
    status: string,
  ): Promise<Return | undefined> {
    const updates: any = { status };
    if (status === "approved") updates.approvedAt = new Date();

    const [returnRecord] = await db
      .update(returns)
      .set(updates)
      .where(eq(returns.id, id))
      .returning();
    return returnRecord || undefined;
  }

  async getProductInventoryByStore(
    productId: string,
    storeId: string,
  ): Promise<StoreProductInventory | undefined> {
    const [inventory] = await db
      .select()
      .from(storeProductInventory)
      .where(
        and(
          eq(storeProductInventory.productId, productId),
          eq(storeProductInventory.storeId, storeId),
        ),
      );
    return inventory || undefined;
  }

  async getProductInventoryByProduct(
    productId: string,
  ): Promise<StoreProductInventory[]> {
    return await db
      .select()
      .from(storeProductInventory)
      .where(eq(storeProductInventory.productId, productId));
  }

  async updateStoreProductInventory(
    productId: string,
    storeId: string,
    quantity: number,
    channel: string,
  ): Promise<StoreProductInventory> {
    const existing = await this.getProductInventoryByStore(productId, storeId);
    console.log("Existing inventory:", existing);
    
    // Delete if quantity is 0
    if (quantity === 0 && existing) {
      await db
        .delete(storeProductInventory)
        .where(
          and(
            eq(storeProductInventory.productId, productId),
            eq(storeProductInventory.storeId, storeId),
          ),
        );
      return existing;
    }
    
    if (existing) {
      const [updated] = await db
        .update(storeProductInventory)
        .set({ quantity, channel })
        .where(
          and(
            eq(storeProductInventory.productId, productId),
            eq(storeProductInventory.storeId, storeId),
          ),
        )
        .returning();
      console.log("Updated inventory:", updated);
      return updated;
    } else {
      const [created] = await db
        .insert(storeProductInventory)
        .values({ productId, storeId, quantity, channel })
        .returning();
      return created;
    }
  }

  async moveProductInventory(
    productId: string,
    fromStoreId: string,
    toStoreId: string,
    quantity: number,
  ): Promise<boolean> {
    try {
      const fromInventory = await this.getProductInventoryByStore(
        productId,
        fromStoreId,
      );
      if (!fromInventory || fromInventory.quantity < quantity) {
        return false;
      }

      const fromNewQuantity = fromInventory.quantity - quantity;
      const toInventory = await this.getProductInventoryByStore(
        productId,
        toStoreId,
      );
      const toNewQuantity = (toInventory?.quantity || 0) + quantity;

      await this.updateStoreProductInventory(
        productId,
        fromStoreId,
        fromNewQuantity,
      );
      await this.updateStoreProductInventory(
        productId,
        toStoreId,
        toNewQuantity,
      );

      return true;
    } catch (error) {
      console.error("Failed to move product inventory:", error);
      return false;
    }
  }

  async createAddress(insertAddress: InsertAddress): Promise<Address> {
    const [address] = await db
      .insert(addresses)
      .values(insertAddress)
      .returning();
    return address;
  }

  async getUserAddresses(userId: string): Promise<Address[]> {
    return await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId));
  }

  async getAddress(id: string): Promise<Address | undefined> {
    const [address] = await db
      .select()
      .from(addresses)
      .where(eq(addresses.id, id));
    return address || undefined;
  }

  async updateAddress(
    id: string,
    updates: Partial<Address>,
  ): Promise<Address | undefined> {
    const [address] = await db
      .update(addresses)
      .set(updates)
      .where(eq(addresses.id, id))
      .returning();
    return address || undefined;
  }

  async deleteAddress(id: string): Promise<boolean> {
    const result = await db.delete(addresses).where(eq(addresses.id, id));
    return !!result;
  }

  async updateUserAddressesDefault(userId: string, excludeAddressId: string | null): Promise<void> {
    // Set all addresses for this user to isDefault: false, except the excluded one
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(
        excludeAddressId
          ? and(eq(addresses.userId, userId), sql`${addresses.id} != ${excludeAddressId}`)
          : eq(addresses.userId, userId),
      );
  }
}

export const storage = new DatabaseStorage();
