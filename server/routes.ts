import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCartItemSchema, insertOrderSchema, insertUserSchema, insertWishlistItemSchema, insertProductSchema, insertStoreSchema } from "@shared/schema";
import { z } from "zod";
import { generateToken, hashPassword, comparePasswords, authMiddleware, optionalAuthMiddleware, type AuthRequest } from "./auth";

const adminAuthMiddleware = (req: any, res: any, next: any) => {
  authMiddleware(req, res, () => {
    if (req.isAdmin) {
      next();
    } else {
      res.status(403).json({ error: "Admin access required" });
    }
  });
};

const storeAuthMiddleware = (req: any, res: any, next: any) => {
  authMiddleware(req, res, () => {
    if (req.isStoreOwner) {
      next();
    } else {
      res.status(403).json({ error: "Store owner access required" });
    }
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth endpoints
  app.post("/api/auth/register", async (req, res) => {
    try {
      const schema = insertUserSchema.extend({
        email: z.string().email(),
        password: z.string().min(6),
      });
      const validatedData = schema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      const token = generateToken(user.id);
      
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(201).json({
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        password: z.string(),
      });
      const { email, password } = schema.parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (user.isBlocked) {
        return res.status(403).json({ error: "User account has been blocked" });
      }

      const validPassword = await comparePasswords(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken(user.id);
      
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/auth/admin-login", async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        password: z.string(),
      });
      const { email, password } = schema.parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user || !user.isAdmin) {
        return res.status(401).json({ error: "Invalid admin credentials" });
      }

      const validPassword = await comparePasswords(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid admin credentials" });
      }

      const token = generateToken(user.id);
      
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/auth/store-login", async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        password: z.string(),
      });
      const { email, password } = schema.parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user || !user.isStoreOwner) {
        return res.status(401).json({ error: "Invalid store credentials" });
      }

      if (user.isBlocked) {
        return res.status(403).json({ error: "Store account has been blocked" });
      }

      const validPassword = await comparePasswords(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid store credentials" });
      }

      const token = generateToken(user.id);
      
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.get("/api/auth/me", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Admin endpoints
  app.get("/api/admin/users", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.userId!);
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const users = await storage.getAllUsers();
      res.json(users.map(u => {
        const { password: _, ...userWithoutPassword } = u;
        return userWithoutPassword;
      }));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/stores", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.userId!);
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const schema = insertStoreSchema;
      const validatedData = schema.parse(req.body);

      const existingStore = await storage.getStoreByEmail(validatedData.email);
      if (existingStore) {
        return res.status(400).json({ error: "Store email already exists" });
      }

      const store = await storage.createStore(validatedData);
      
      const owner = await storage.getUserById(validatedData.ownerId);
      if (owner) {
        await storage.updateUser(validatedData.ownerId, {
          isStoreOwner: true,
          storeId: store.id,
        } as any);
      }

      res.status(201).json(store);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create store" });
    }
  });

  app.delete("/api/admin/stores/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.userId!);
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const success = await storage.deleteStore(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Store not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete store" });
    }
  });

  app.post("/api/admin/users/:id/block", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.userId!);
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      await storage.blockUser(req.params.id);
      res.json({ message: "User blocked" });
    } catch (error) {
      res.status(500).json({ error: "Failed to block user" });
    }
  });

  app.post("/api/admin/users/:id/unblock", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.userId!);
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      await storage.unblockUser(req.params.id);
      res.json({ message: "User unblocked" });
    } catch (error) {
      res.status(500).json({ error: "Failed to unblock user" });
    }
  });

  app.get("/api/admin/orders", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.userId!);
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/admin/all-products", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.userId!);
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Store endpoints
  app.get("/api/store/products", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.userId!);
      if (!user?.isStoreOwner || !user.storeId) {
        return res.status(403).json({ error: "Store access required" });
      }

      const products = await storage.getStoreProducts(user.storeId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/store/products", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.userId!);
      if (!user?.isStoreOwner || !user.storeId) {
        return res.status(403).json({ error: "Store access required" });
      }

      const schema = insertProductSchema;
      const validatedData = schema.parse(req.body);

      // Generate unique tracking ID (format: PROD-TIMESTAMP-RANDOM)
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const trackingId = `PROD-${timestamp}-${random}`;

      const product = await storage.createProduct({
        ...validatedData,
        trackingId,
        storeId: user.storeId,
      });

      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.patch("/api/store/products/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.userId!);
      if (!user?.isStoreOwner || !user.storeId) {
        return res.status(403).json({ error: "Store access required" });
      }

      const product = await storage.getProduct(req.params.id);
      if (!product || product.storeId !== user.storeId) {
        return res.status(404).json({ error: "Product not found or unauthorized" });
      }

      const updatedProduct = await storage.updateProduct(req.params.id, req.body);
      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/store/products/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.userId!);
      if (!user?.isStoreOwner || !user.storeId) {
        return res.status(403).json({ error: "Store access required" });
      }

      const product = await storage.getProduct(req.params.id);
      if (!product || product.storeId !== user.storeId) {
        return res.status(404).json({ error: "Product not found or unauthorized" });
      }

      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  app.get("/api/store/orders", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.userId!);
      if (!user?.isStoreOwner || !user.storeId) {
        return res.status(403).json({ error: "Store access required" });
      }

      const orders = await storage.getStoreOrders(user.storeId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.patch("/api/store/orders/:id/status", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.userId!);
      if (!user?.isStoreOwner || !user.storeId) {
        return res.status(403).json({ error: "Store access required" });
      }

      const { status, returnNotes, refundStatus } = req.body;
      if (!['pending', 'shipped', 'delivered'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const order = await storage.getOrder(req.params.id);
      if (!order || order.storeId !== user.storeId) {
        return res.status(404).json({ error: "Order not found or unauthorized" });
      }

      const oldStatus = order.status;
      const updates: any = { status };
      if (returnNotes !== undefined) updates.returnNotes = returnNotes;
      if (refundStatus !== undefined) updates.refundStatus = refundStatus;

      const updatedOrder = await db
        .update(orders)
        .set(updates)
        .where(eq(orders.id, req.params.id))
        .returning();

      if (status === 'shipped' && oldStatus !== 'shipped') {
        const items = JSON.parse(order.items);
        for (const item of items) {
          const product = await storage.getProduct(item.productId);
          if (product) {
            const newStock = Math.max(0, product.inStock - item.quantity);
            await storage.updateProduct(item.productId, { inStock: newStock });
          }
        }
      }

      res.json(updatedOrder[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  app.patch("/api/store/orders/:id/refund", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.userId!);
      if (!user?.isStoreOwner || !user.storeId) {
        return res.status(403).json({ error: "Store access required" });
      }

      const { refundStatus, returnNotes } = req.body;
      if (!['none', 'requested', 'approved', 'rejected'].includes(refundStatus)) {
        return res.status(400).json({ error: "Invalid refund status" });
      }

      const order = await storage.getOrder(req.params.id);
      if (!order || order.storeId !== user.storeId) {
        return res.status(404).json({ error: "Order not found or unauthorized" });
      }

      const updatedOrder = await db
        .update(orders)
        .set({ refundStatus, returnNotes })
        .where(eq(orders.id, req.params.id))
        .returning();

      res.json(updatedOrder[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to process refund" });
    }
  });

  // Product endpoints
  app.get("/api/products", async (req, res) => {
    try {
      const { search, fabric, occasion, minPrice, maxPrice } = req.query;
      
      const filters: any = {};
      if (typeof search === 'string') filters.search = search;
      if (typeof fabric === 'string') filters.fabric = fabric;
      if (typeof occasion === 'string') filters.occasion = occasion;
      if (typeof minPrice === 'string') filters.minPrice = parseFloat(minPrice);
      if (typeof maxPrice === 'string') filters.maxPrice = parseFloat(maxPrice);
      
      const products = await storage.getAllProducts(filters);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  // Cart endpoints
  app.get("/api/cart/:sessionId", async (req, res) => {
    try {
      const cartItems = await storage.getCartItems(req.params.sessionId);
      
      const cartItemsWithProducts = await Promise.all(
        cartItems.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          return { ...item, product };
        })
      );

      res.json(cartItemsWithProducts.filter(item => item.product));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cart items" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const validatedData = insertCartItemSchema.parse(req.body);
      
      const product = await storage.getProduct(validatedData.productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      if (product.inStock === 0) {
        return res.status(400).json({ error: "Product is out of stock" });
      }

      const cartItem = await storage.addToCart(validatedData);
      res.status(201).json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add item to cart" });
    }
  });

  app.patch("/api/cart/:id", async (req, res) => {
    try {
      const { quantity } = req.body;
      
      if (typeof quantity !== 'number' || quantity < 1) {
        return res.status(400).json({ error: "Invalid quantity" });
      }

      const updatedItem = await storage.updateCartItemQuantity(req.params.id, quantity);
      
      if (!updatedItem) {
        return res.status(404).json({ error: "Cart item not found" });
      }

      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const success = await storage.removeFromCart(req.params.id);
      
      if (!success) {
        return res.status(404).json({ error: "Cart item not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove cart item" });
    }
  });

  // Order endpoints
  app.get("/api/orders", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const orders = await storage.getUserOrders(req.userId!);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", optionalAuthMiddleware, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const orderItems = JSON.parse(validatedData.items);
      const sessionId = orderItems.length > 0 ? orderItems[0].sessionId : null;
      
      // Get storeId from first product in order
      let storeId: string | undefined = undefined;
      if (orderItems.length > 0) {
        const firstProduct = await storage.getProduct(orderItems[0].productId);
        if (firstProduct) {
          storeId = firstProduct.storeId;
        }
      }

      const orderData = {
        ...validatedData,
        userId: req.userId || null,
        storeId: storeId || null,
      };
      const order = await storage.createOrder(orderData);
      
      if (sessionId) {
        await storage.clearCart(sessionId);
      }

      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  // Wishlist endpoints
  app.get("/api/wishlist", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const wishlistItems = await storage.getUserWishlist(req.userId!);
      res.json(wishlistItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wishlist" });
    }
  });

  app.post("/api/wishlist", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertWishlistItemSchema.parse({
        userId: req.userId!,
        productId: req.body.productId,
      });
      const wishlistItem = await storage.addToWishlist(validatedData);
      res.status(201).json(wishlistItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add to wishlist" });
    }
  });

  app.delete("/api/wishlist/:productId", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const success = await storage.removeFromWishlist(req.userId!, req.params.productId);
      if (!success) {
        return res.status(404).json({ error: "Wishlist item not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove from wishlist" });
    }
  });

  app.get("/api/wishlist/check/:productId", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const isInWishlist = await storage.isInWishlist(req.userId!, req.params.productId);
      res.json({ isInWishlist });
    } catch (error) {
      res.status(500).json({ error: "Failed to check wishlist" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
