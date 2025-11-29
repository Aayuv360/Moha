import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertCartItemSchema,
  insertOrderSchema,
  insertUserSchema,
  insertWishlistItemSchema,
  insertProductSchema,
  insertInventorySchema,
  insertReturnSchema,
  insertAddressSchema,
} from "@shared/schema";
import { z } from "zod";
import {
  generateToken,
  hashPassword,
  comparePasswords,
  authMiddleware,
  optionalAuthMiddleware,
  verifyToken,
  type AuthRequest,
} from "./auth";

// Generate unique order tracking ID (format: ORD-XXXXX-XXXXX)
function generateOrderTrackingId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let part1 = "";
  let part2 = "";
  for (let i = 0; i < 5; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ORD-${part1}-${part2}`;
}

// Generate unique user tracking ID (format: USER-XXXXX-XXXXX)
function generateUserTrackingId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let part1 = "";
  let part2 = "";
  for (let i = 0; i < 5; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `USER-${part1}-${part2}`;
}

const adminAuthMiddleware = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.userId = decoded.userId;
    const user = await storage.getUserById(decoded.userId);
    if (user && user.isAdmin) {
      next();
    } else {
      res.status(403).json({ error: "Admin access required" });
    }
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
};

const inventoryAuthMiddleware = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.userId = decoded.userId;
    const user = await storage.getUserById(decoded.userId);
    if (user && user.isInventoryOwner) {
      req.inventoryId = user.inventoryId;
      next();
    } else {
      res.status(403).json({ error: "Inventory owner access required" });
    }
  } catch (error) {
    console.error("Inventory auth error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
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
      const userTrackingId = generateUserTrackingId();
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        userTrackingId: userTrackingId,
      } as any);

      const token = generateToken(user.id);

      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        user: { ...userWithoutPassword, id: user.userTrackingId },
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
        user: { ...userWithoutPassword, id: user.userTrackingId },
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
        user: { ...userWithoutPassword, id: user.userTrackingId },
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/auth/inventory-login", async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        password: z.string(),
      });
      const { email, password } = schema.parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user || !user.isInventoryOwner) {
        return res.status(401).json({ error: "Invalid inventory credentials" });
      }

      if (user.isBlocked) {
        return res
          .status(403)
          .json({ error: "Inventory account has been blocked" });
      }

      const validPassword = await comparePasswords(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid inventory credentials" });
      }

      const token = generateToken(user.id);

      const { password: _, ...userWithoutPassword } = user;

      res.json({
        user: { ...userWithoutPassword, id: user.userTrackingId },
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
      res.json({ ...userWithoutPassword, id: user.userTrackingId });
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
      res.json(
        users.map((u) => {
          const { password: _, ...userWithoutPassword } = u;
          return userWithoutPassword;
        }),
      );
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post(
    "/api/admin/inventories",
    authMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const user = await storage.getUserById(req.userId!);
        if (!user?.isAdmin) {
          return res.status(403).json({ error: "Admin access required" });
        }

        const schema = insertInventorySchema;
        const validatedData = schema.parse(req.body);

        const existingInventory = await storage.getInventoryByEmail(
          validatedData.email,
        );
        if (existingInventory) {
          return res
            .status(400)
            .json({ error: "Inventory email already exists" });
        }

        const inventory = await storage.createInventory(validatedData);

        const owner = await storage.getUserById(validatedData.ownerId);
        if (owner) {
          await storage.updateUser(validatedData.ownerId, {
            isInventoryOwner: true,
            inventoryId: inventory.id,
          } as any);
        }

        res.status(201).json(inventory);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to create inventory" });
      }
    },
  );

  app.delete(
    "/api/admin/inventories/:id",
    authMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const user = await storage.getUserById(req.userId!);
        if (!user?.isAdmin) {
          return res.status(403).json({ error: "Admin access required" });
        }

        const success = await storage.deleteInventory(req.params.id);
        if (!success) {
          return res.status(404).json({ error: "Inventory not found" });
        }

        res.status(204).send();
      } catch (error) {
        res.status(500).json({ error: "Failed to delete inventory" });
      }
    },
  );

  app.post(
    "/api/admin/users/:id/block",
    authMiddleware,
    async (req: AuthRequest, res) => {
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
    },
  );

  app.post(
    "/api/admin/users/:id/unblock",
    authMiddleware,
    async (req: AuthRequest, res) => {
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
    },
  );

  app.get(
    "/api/admin/orders",
    authMiddleware,
    async (req: AuthRequest, res) => {
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
    },
  );

  app.get(
    "/api/admin/all-products",
    authMiddleware,
    async (req: AuthRequest, res) => {
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
    },
  );

  app.get(
    "/api/inventory/products",
    authMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const user = await storage.getUserById(req.userId!);
        if (!user?.isInventoryOwner || !user.inventoryId) {
          return res.status(403).json({ error: "Inventory access required" });
        }

        const products = await storage.getInventoryProducts(user.inventoryId);

        const productsWithAllocations = await Promise.all(
          products.map(async (product) => {
            const allocations = await storage.getProductInventoryByProduct(
              product.id,
            );
            console.log("Allocations:", allocations);
            const storeInventory = allocations.map((alloc) => ({
              storeId: alloc.storeId,
              quantity: alloc.quantity,
              channel: alloc.channel,
            }));

            return {
              ...product,
              storeInventory,
            };
          }),
        );

        res.json(productsWithAllocations);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch products" });
      }
    },
  );

  app.post(
    "/api/inventory/products",
    authMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const user = await storage.getUserById(req.userId!);
        if (!user?.isInventoryOwner || !user.inventoryId) {
          return res.status(403).json({ error: "Inventory access required" });
        }

        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        const trackingId = `PROD-${timestamp}-${random}`;

        const { storeInventory, channel } = req.body;

        const schema = insertProductSchema.extend({
          trackingId: z.string(),
          images: z.array(z.string()).min(1, "At least one image required"),
          videoUrl: z.string().nullable().optional(),
        });

        const requestData = {
          ...req.body,
          trackingId,
          images:
            req.body.images && Array.isArray(req.body.images)
              ? req.body.images
              : [],
          videoUrl: req.body.videoUrl || null,
        };

        const validatedData = schema.parse(requestData);

        const product = await storage.createProduct({
          ...validatedData,
          inventoryId: user.inventoryId,
        });

        if (channel === "Online") {
          for (const allocation of storeInventory) {
            await storage.updateStoreProductInventory(
              product.id,
              allocation.storeId,
              allocation.quantity,
              "online",
            );
          }
        } else if (channel === "Shop") {
          for (const allocation of storeInventory) {
            await storage.updateStoreProductInventory(
              product.id,
              allocation.storeId,
              allocation.quantity,
              "physical",
            );
          }
        } else if (channel === "Both") {
          const stores = await storage.getAllInventories();

          for (const allocation of storeInventory) {
            const store = stores.find((s) => s.id === allocation.storeId);

            const channelName =
              store?.name === "Online Store" ? "online" : "physical";
            await storage.updateStoreProductInventory(
              product.id,
              allocation.storeId,
              allocation.quantity,
              channelName,
            );
          }
        }

        res.status(201).json(product);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        console.error("Product creation error:", error);
        res
          .status(500)
          .json({ error: "Failed to create product", details: String(error) });
      }
    },
  );

  app.patch(
    "/api/inventory/products/:id",
    authMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const user = await storage.getUserById(req.userId!);
        if (!user?.isInventoryOwner || !user.inventoryId) {
          return res.status(403).json({ error: "Inventory access required" });
        }

        const product = await storage.getProduct(req.params.id);
        if (!product || product.inventoryId !== user.inventoryId) {
          return res
            .status(404)
            .json({ error: "Product not found or unauthorized" });
        }

        const { storeInventory, channel } = req.body;
        const updateData = { ...req.body };

        // Ensure images is an array
        if (updateData.images && !Array.isArray(updateData.images)) {
          updateData.images = [];
        } else if (!updateData.images) {
          updateData.images = product.images || [];
        }

        const updatedProduct = await storage.updateProduct(
          req.params.id,
          updateData,
        );
        const existingAllocations = await storage.getProductInventoryByProduct(
          req.params.id,
        );
        for (const allocation of existingAllocations) {
          await storage.updateStoreProductInventory(
            req.params.id,
            allocation.storeId,
            0,
            allocation.channel,
          );
        }
        if (channel === "Online") {
          for (const allocation of storeInventory) {
            await storage.updateStoreProductInventory(
              req.params.id,
              allocation.storeId,
              allocation.quantity,
              "online",
            );
          }
        } else if (channel === "Shop") {
          for (const allocation of storeInventory) {
            await storage.updateStoreProductInventory(
              req.params.id,
              allocation.storeId,
              allocation.quantity,
              "physical",
            );
          }
        } else if (channel === "Both") {
          const stores = await storage.getAllInventories();

          for (const allocation of storeInventory) {
            const store = stores.find((s) => s.id === allocation.storeId);

            const channelName =
              store?.name === "Online Store" ? "online" : "physical";
            await storage.updateStoreProductInventory(
              req.params.id,
              allocation.storeId,
              allocation.quantity,
              channelName,
            );
          }
        }
        res.json(updatedProduct);
      } catch (error) {
        console.error("Product update error:", error);
        res.status(500).json({ error: "Failed to update product" });
      }
    },
  );

  app.delete(
    "/api/inventory/products/:id",
    authMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const user = await storage.getUserById(req.userId!);
        if (!user?.isInventoryOwner || !user.inventoryId) {
          return res.status(403).json({ error: "Inventory access required" });
        }

        const product = await storage.getProduct(req.params.id);
        if (!product || product.inventoryId !== user.inventoryId) {
          return res
            .status(404)
            .json({ error: "Product not found or unauthorized" });
        }

        const success = await storage.deleteProduct(req.params.id);
        if (!success) {
          return res.status(404).json({ error: "Product not found" });
        }

        res.status(204).send();
      } catch (error) {
        res.status(500).json({ error: "Failed to delete product" });
      }
    },
  );

  app.get(
    "/api/inventory/orders",
    authMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const user = await storage.getUserById(req.userId!);
        if (!user?.isInventoryOwner || !user.inventoryId) {
          return res.status(403).json({ error: "Inventory access required" });
        }

        const orders = await storage.getInventoryOrders(user.inventoryId);

        // Ensure all orders have orderTrackingId, generate if missing
        const enrichedOrders = await Promise.all(
          orders.map(async (order: any) => {
            if (!order.orderTrackingId) {
              const trackingId = generateOrderTrackingId();
              await storage.updateOrder(order.id, {
                orderTrackingId: trackingId,
              });
              return { ...order, orderTrackingId: trackingId };
            }
            return order;
          }),
        );

        res.json(enrichedOrders);
      } catch (error) {
        console.error("Fetch inventory orders error:", error);
        res.status(500).json({ error: "Failed to fetch orders" });
      }
    },
  );

  app.patch(
    "/api/inventory/orders/:idOrTrackingId/status",
    authMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const user = await storage.getUserById(req.userId!);
        if (!user?.isInventoryOwner || !user.inventoryId) {
          return res.status(403).json({ error: "Inventory access required" });
        }

        const { status, returnNotes, refundStatus } = req.body;
        if (!["pending", "shipped", "delivered"].includes(status)) {
          return res.status(400).json({ error: "Invalid status" });
        }

        let id = req.params.idOrTrackingId;
        let order = null;

        // Check if it's a tracking ID (format: ORD-XXXXX-XXXXX)
        if (id.startsWith("ORD-")) {
          const allOrders = await storage.getAllOrders();
          order = allOrders.find(
            (o) =>
              o.orderTrackingId === id && o.inventoryId === user.inventoryId,
          );
        } else {
          order = await storage.getOrder(id);
        }

        if (!order || order.inventoryId !== user.inventoryId) {
          return res
            .status(404)
            .json({ error: "Order not found or unauthorized" });
        }

        const oldStatus = order.status;
        const updates: any = { status };
        if (returnNotes !== undefined) updates.returnNotes = returnNotes;
        if (refundStatus !== undefined) updates.refundStatus = refundStatus;

        const updatedOrder = await storage.updateOrderStatus(order.id, status);

        res.json(updatedOrder);
      } catch (error) {
        res.status(500).json({ error: "Failed to update order status" });
      }
    },
  );

  app.patch(
    "/api/inventory/orders/:idOrTrackingId/refund",
    authMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const user = await storage.getUserById(req.userId!);
        if (!user?.isInventoryOwner || !user.inventoryId) {
          return res.status(403).json({ error: "Inventory access required" });
        }

        const { refundStatus, returnNotes } = req.body;
        if (
          !["none", "requested", "approved", "rejected"].includes(refundStatus)
        ) {
          return res.status(400).json({ error: "Invalid refund status" });
        }

        let id = req.params.idOrTrackingId;
        let order = null;

        // Check if it's a tracking ID (format: ORD-XXXXX-XXXXX)
        if (id.startsWith("ORD-")) {
          const allOrders = await storage.getAllOrders();
          order = allOrders.find(
            (o) =>
              o.orderTrackingId === id && o.inventoryId === user.inventoryId,
          );
        } else {
          order = await storage.getOrder(id);
        }

        if (!order || order.inventoryId !== user.inventoryId) {
          return res
            .status(404)
            .json({ error: "Order not found or unauthorized" });
        }

        const updatedOrder = await storage.updateOrder(order.id, {
          refundStatus,
          returnNotes,
        });

        res.json(updatedOrder);
      } catch (error) {
        res.status(500).json({ error: "Failed to process refund" });
      }
    },
  );

  // Product endpoints
  app.get("/api/onlineProducts", async (req, res) => {
    try {
      const { search, fabric, occasion, minPrice, maxPrice } = req.query;

      const filters: any = {};
      if (typeof search === "string") filters.search = search;
      if (typeof fabric === "string") filters.fabric = fabric;
      if (typeof occasion === "string") filters.occasion = occasion;
      if (typeof minPrice === "string") filters.minPrice = parseFloat(minPrice);
      if (typeof maxPrice === "string") filters.maxPrice = parseFloat(maxPrice);

      const products = await storage.getAllProducts(filters);

      const productsWithOnlineStock = await Promise.all(
        products.map(async (product) => {
          const allocations = await storage.getProductInventoryByProduct(
            product.id,
          );

          const storeInventory = allocations.map((alloc) => ({
            storeId: alloc.storeId,
            quantity: alloc.quantity,
            channel: alloc.channel,
          }));

          const onlineEntry = storeInventory.find(
            (inv) => inv.channel === "online",
          );

          if (!onlineEntry) return null;

          return {
            ...product,
            inStock: onlineEntry.quantity,
          };
        }),
      );

      const filteredProducts = productsWithOnlineStock.filter(Boolean);

      res.json(filteredProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch products", details: String(error) });
    }
  });

  app.get("/api/onlineProducts/tracking/:trackingId", async (req, res) => {
    try {
      const product = await storage.getProductByTrackingId(
        req.params.trackingId,
      );
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const allocations = await storage.getProductInventoryByProduct(
        product.id,
      );

      const onlineEntry = allocations.find(
        (alloc) => alloc.channel === "online",
      );

      const onlineStock = onlineEntry ? onlineEntry.quantity : 0;

      res.json({
        ...product,
        inStock: onlineStock,
      });
    } catch (error) {
      console.error("Error fetching product by tracking ID:", error);
      res.status(500).json({
        error: "Failed to fetch product",
        details: String(error),
      });
    }
  });

  app.get("/api/onlineProducts/:id", async (req, res) => {
    try {
      const id = req.params.id;

      // Check if ID is a tracking ID (format: PROD-XXXXX-XXXXX)
      const isTrackingId = id.startsWith("PROD-");

      let product;
      if (isTrackingId) {
        product = await storage.getProductByTrackingId(id);
      } else {
        product = await storage.getProduct(id);
      }

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const allocations = await storage.getProductInventoryByProduct(
        product.id,
      );

      const onlineEntry = allocations.find(
        (alloc) => alloc.channel === "online",
      );

      const onlineStock = onlineEntry ? onlineEntry.quantity : 0;

      res.json({
        ...product,
        inStock: onlineStock,
      });
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({
        error: "Failed to fetch product",
        details: String(error),
      });
    }
  });

  app.get("/api/cart/:sessionId", async (req, res) => {
    try {
      const cartItems = await storage.getCartItems(req.params.sessionId);

      const cartItemsWithProducts = await Promise.all(
        cartItems.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          return {
            id: item.id,
            sessionId: item.sessionId,
            quantity: item.quantity,
            product: product ? { ...product, id: product.trackingId } : null,
          };
        }),
      );

      res.json(cartItemsWithProducts.filter((item) => item.product));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cart items" });
    }
  });

  app.get(
    "/api/cart/user/:userTrackingId",
    authMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const user = await storage.getUserById(req.userId!);
        if (!user || user.userTrackingId !== req.params.userTrackingId) {
          return res.status(403).json({ error: "Forbidden" });
        }

        const cartItems = await storage.getCartItemsByUserId(req.userId!);

        const cartItemsWithProducts = await Promise.all(
          cartItems.map(async (item) => {
            const product = await storage.getProduct(item.productId);
            return {
              id: item.id,
              userId: user.userTrackingId,
              quantity: item.quantity,
              productId: product?.id,
              product: product ? { ...product, id: product.trackingId } : null,
            };
          }),
        );

        res.json(cartItemsWithProducts.filter((item) => item.product));
      } catch (error) {
        console.error("Cart fetch error:", error);
        res.status(500).json({ error: "Failed to fetch cart items" });
      }
    },
  );

  app.post(
    "/api/cart/merge-on-login",
    authMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const { sessionId } = req.body;

        if (!sessionId) {
          return res.status(400).json({ error: "Session ID is required" });
        }

        const user = await storage.getUserById(req.userId!);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        await storage.mergeCartsOnLogin(sessionId, req.userId!);

        const mergedCartItems = await storage.getCartItemsByUserId(req.userId!);
        const cartItemsWithProducts = await Promise.all(
          mergedCartItems.map(async (item) => {
            const product = await storage.getProduct(item.productId);
            return {
              id: item.id,
              userId: user.userTrackingId,
              quantity: item.quantity,
              product: product ? { ...product, id: product.trackingId } : null,
            };
          }),
        );

        res.json(cartItemsWithProducts.filter((item) => item.product));
      } catch (error) {
        console.error("Cart merge error:", error);
        res.status(500).json({ error: "Failed to merge carts" });
      }
    },
  );

  app.post("/api/cart", async (req, res) => {
    try {
      const validatedData = insertCartItemSchema.parse(req.body);

      if (!validatedData.sessionId && !validatedData.userId) {
        return res
          .status(400)
          .json({ error: "Either sessionId or userId must be provided" });
      }

      // Convert tracking ID to product ID if provided
      let productId = validatedData.productId;
      if (validatedData.trackingId && !productId) {
        const product = await storage.getProductByTrackingId(
          validatedData.trackingId,
        );
        if (!product) {
          return res.status(404).json({ error: "Product not found" });
        }
        productId = product.id;
      }

      if (!productId) {
        return res
          .status(400)
          .json({ error: "productId or trackingId is required" });
      }

      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      if (product.inStock === 0) {
        return res.status(400).json({ error: "Product is out of stock" });
      }

      const cartItem = await storage.addToCart({
        productId: productId,
        quantity: validatedData.quantity || 1,
        sessionId: validatedData.sessionId,
        userId: validatedData.userId,
      });

      let userTrackingId = cartItem.userId;
      if (cartItem.userId) {
        const user = await storage.getUserById(cartItem.userId);
        if (user) {
          userTrackingId = user.userTrackingId;
        }
      }

      res.status(201).json({
        id: cartItem.id,
        userId: userTrackingId,
        sessionId: cartItem.sessionId,
        quantity: cartItem.quantity,
        product: product ? { ...product, id: product.trackingId } : null,
      });
    } catch (error) {
      console.error("Add to cart error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add item to cart" });
    }
  });

  app.patch("/api/cart/:id", async (req, res) => {
    try {
      const { quantity } = req.body;

      if (typeof quantity !== "number" || quantity < 1) {
        return res.status(400).json({ error: "Invalid quantity" });
      }

      const updatedItem = await storage.updateCartItemQuantity(
        req.params.id,
        quantity,
      );

      if (!updatedItem) {
        return res.status(404).json({ error: "Cart item not found" });
      }

      const product = await storage.getProduct(updatedItem.productId);

      let userTrackingId = updatedItem.userId;
      if (updatedItem.userId) {
        const user = await storage.getUserById(updatedItem.userId);
        if (user) {
          userTrackingId = user.userTrackingId;
        }
      }

      res.json({
        id: updatedItem.id,
        userId: userTrackingId,
        sessionId: updatedItem.sessionId,
        quantity: updatedItem.quantity,
        product: product ? { ...product, id: product.trackingId } : null,
      });
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

      // Ensure all orders have orderTrackingId, generate if missing
      const enrichedOrders = await Promise.all(
        orders.map(async (order: any) => {
          if (!order.orderTrackingId) {
            const trackingId = generateOrderTrackingId();
            await storage.updateOrder(order.id, {
              orderTrackingId: trackingId,
            });
            order.orderTrackingId = trackingId;
          }

          // Parse items and convert product IDs to tracking IDs
          let items = [];
          if (order.items) {
            try {
              items =
                typeof order.items === "string"
                  ? JSON.parse(order.items)
                  : order.items;
              items = await Promise.all(
                items.map(async (item: any) => {
                  const product = await storage.getProduct(item.productId);
                  return {
                    ...item,
                    productId: product?.trackingId || item.productId,
                  };
                }),
              );
            } catch (e) {
              // If parsing fails, leave items as is
            }
          }

          return {
            id: order.orderTrackingId,
            userId: order.userId,
            ...order,
            items: JSON.stringify(items),
          };
        }),
      );

      res.json(enrichedOrders);
    } catch (error) {
      console.error("Fetch orders error:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.post(
    "/api/orders",
    optionalAuthMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const validatedData = insertOrderSchema.parse(req.body);
        const orderItems =
          typeof validatedData.items === "string"
            ? JSON.parse(validatedData.items)
            : validatedData.items;
        const sessionId =
          orderItems && orderItems.length > 0 ? orderItems[0].sessionId : null;

        const enrichedItems = await Promise.all(
          orderItems.map(async (item: any) => {
            if (item.productId) {
              const product = await storage.getProduct(item.productId);
              if (product) {
                return {
                  ...item,
                  name: product.name,
                  imageUrl: product.imageUrl,
                  fabric: product.fabric,
                  color: product.color,
                  occasion: product.occasion,
                  category: product.category,
                };
              }
            }
            return item;
          }),
        );

        let inventoryId: string | undefined = undefined;
        if (enrichedItems.length > 0 && enrichedItems[0].productId) {
          const firstProduct = await storage.getProduct(
            enrichedItems[0].productId,
          );
          if (firstProduct) {
            inventoryId = firstProduct.inventoryId;
          }
        }

        const orderData = {
          ...validatedData,
          orderTrackingId: generateOrderTrackingId(),
          items: JSON.stringify(enrichedItems),
          userId: req.userId || null,
          inventoryId: inventoryId || null,
        };
        const order = await storage.createOrder(orderData);

        for (const item of enrichedItems) {
          if (item.productId && item.quantity) {
            const product = await storage.getProduct(item.productId);
            if (product) {
              const newStock = Math.max(
                0,
                product.inStock - (item.quantity || 1),
              );
              await storage.updateProduct(item.productId, {
                inStock: newStock,
              });

              if (inventoryId) {
                const storeInventories =
                  await storage.getProductInventoryByProduct(item.productId);
                for (const storeInv of storeInventories) {
                  if (storeInv.channel === "online") {
                    const newStoreStock = Math.max(
                      0,
                      storeInv.quantity - (item.quantity || 1),
                    );
                    await storage.updateStoreProductInventory(
                      item.productId,
                      storeInv.storeId,
                      newStoreStock,
                      storeInv.channel,
                    );
                  }
                }
              }
            }
          }
        }

        if (sessionId) {
          await storage.clearCart(sessionId);
        }

        // Convert order response to use tracking IDs
        let items = [];
        if (order.items) {
          try {
            items =
              typeof order.items === "string"
                ? JSON.parse(order.items)
                : order.items;
            items = await Promise.all(
              items.map(async (item: any) => {
                const product = await storage.getProduct(item.productId);
                return {
                  ...item,
                  productId: product?.trackingId || item.productId,
                };
              }),
            );
          } catch (e) {
            // If parsing fails, leave items as is
          }
        }

        res.status(201).json({
          id: order.orderTrackingId,
          userId: order.userId,
          ...order,
          items: JSON.stringify(items),
        });
      } catch (error) {
        console.error("Order creation error:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        res
          .status(500)
          .json({ error: "Failed to create order", details: String(error) });
      }
    },
  );

  app.get("/api/orders/:idOrTrackingId", async (req, res) => {
    try {
      let id = req.params.idOrTrackingId;
      let order = null;

      // Check if it's a tracking ID (format: ORD-XXXXX-XXXXX)
      if (id.startsWith("ORD-")) {
        const orders = await storage.getAllOrders();
        order = orders.find((o) => o.orderTrackingId === id);
      } else {
        order = await storage.getOrder(id);
      }

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Convert items to use tracking IDs
      let items = [];
      if (order.items) {
        try {
          items =
            typeof order.items === "string"
              ? JSON.parse(order.items)
              : order.items;
          items = await Promise.all(
            items.map(async (item: any) => {
              const product = await storage.getProduct(item.productId);
              return {
                ...item,
                productId: product?.trackingId || item.productId,
              };
            }),
          );
        } catch (e) {
          // If parsing fails, leave items as is
        }
      }

      res.json({
        id: order.orderTrackingId,
        userId: order.userId,
        ...order,
        items: JSON.stringify(items),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  // Wishlist endpoints - User can only access their own wishlist
  app.get("/api/wishlist", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Only fetch this user's wishlist items
      const wishlistItems = await storage.getUserWishlist(req.userId!);

      // Convert product IDs to tracking IDs and user ID to tracking ID
      const enrichedItems = await Promise.all(
        wishlistItems.map(async (item: any) => {
          // Verify item belongs to authenticated user
          if (item.userId !== req.userId!) {
            return null;
          }
          const product = await storage.getProduct(item.productId);
          return {
            id: item.id,
            userId: user.userTrackingId,
            productId: product?.trackingId || item.productId,
            createdAt: item.createdAt,
          };
        }),
      );

      res.json(enrichedItems.filter(Boolean));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wishlist" });
    }
  });

  // Add to wishlist - only for authenticated user
  app.post("/api/wishlist", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Convert tracking ID to product ID if provided
      let productId = req.body.productId;
      if (req.body.trackingId && !productId) {
        const product = await storage.getProductByTrackingId(
          req.body.trackingId,
        );
        if (!product) {
          return res.status(404).json({ error: "Product not found" });
        }
        productId = product.id;
      }

      // Always ensure userId is the authenticated user's ID
      const validatedData = insertWishlistItemSchema.parse({
        userId: req.userId!,
        productId: productId,
      });
      const wishlistItem = await storage.addToWishlist(validatedData);
      
      // Verify the item belongs to the authenticated user
      if (wishlistItem.userId !== req.userId!) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const product = await storage.getProduct(productId);
      res.status(201).json({
        id: wishlistItem.id,
        userId: user.userTrackingId,
        productId: product?.trackingId || wishlistItem.productId,
        createdAt: wishlistItem.createdAt,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add to wishlist" });
    }
  });

  // Remove from wishlist - only authenticated user can remove their own items
  app.delete(
    "/api/wishlist/:productIdOrTrackingId",
    authMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const user = await storage.getUserById(req.userId!);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        let productId = req.params.productIdOrTrackingId;

        // Check if it's a tracking ID and convert to product ID
        if (productId.startsWith("PROD-")) {
          const product = await storage.getProductByTrackingId(productId);
          if (!product) {
            return res.status(404).json({ error: "Product not found" });
          }
          productId = product.id;
        }

        // Only remove from authenticated user's wishlist
        const success = await storage.removeFromWishlist(
          req.userId!,
          productId,
        );
        if (!success) {
          return res.status(404).json({ error: "Wishlist item not found" });
        }
        res.status(204).send();
      } catch (error) {
        res.status(500).json({ error: "Failed to remove from wishlist" });
      }
    },
  );

  app.get(
    "/api/wishlist/check/:productIdOrTrackingId",
    authMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const user = await storage.getUserById(req.userId!);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        let productId = req.params.productIdOrTrackingId;

        if (productId.startsWith("PROD-")) {
          const product = await storage.getProductByTrackingId(productId);
          if (!product) {
            return res.status(404).json({ error: "Product not found" });
          }
          productId = product.id;
        }

        const isInWishlist = await storage.isInWishlist(req.userId!, productId);
        res.json({ isInWishlist, userId: user.userTrackingId });
      } catch (error) {
        res.status(500).json({ error: "Failed to check wishlist" });
      }
    },
  );

  // Returns endpoints
  app.post("/api/returns", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertReturnSchema.parse({
        orderId: req.body.orderId,
        userId: req.userId!,
        productId: req.body.productId,
        quantity: req.body.quantity,
        reason: req.body.reason,
        refundAmount: req.body.refundAmount,
        status: "requested",
        inventoryId: req.body.inventoryId,
      });
      const returnRecord = await storage.createReturn(validatedData);
      res.status(201).json(returnRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create return request" });
    }
  });

  app.get("/api/returns", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userReturns = await storage.getUserReturns(req.userId!);
      res.json(userReturns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch returns" });
    }
  });

  app.get(
    "/api/inventory/returns",
    inventoryAuthMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const inventoryReturns = await storage.getInventoryReturns(
          req.inventoryId!,
        );
        res.json(inventoryReturns);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch inventory returns" });
      }
    },
  );

  app.patch(
    "/api/inventory/returns/:id/status",
    inventoryAuthMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const { status } = z.object({ status: z.string() }).parse(req.body);
        const returnRecord = await storage.getReturn(req.params.id);

        if (!returnRecord) {
          return res.status(404).json({ error: "Return not found" });
        }

        const updatedReturn = await storage.updateReturnStatus(
          req.params.id,
          status,
        );

        // If approving, increase stock
        if (status === "approved" && returnRecord.productId) {
          const product = await storage.getProduct(returnRecord.productId);
          if (product) {
            const newStock = product.inStock + returnRecord.quantity;
            await storage.updateProduct(returnRecord.productId, {
              inStock: newStock,
            });
          }
        }

        res.json(updatedReturn);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to update return status" });
      }
    },
  );

  // Address endpoints
  app.get("/api/addresses", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const addresses = await storage.getUserAddresses(req.userId!);
      res.json(addresses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch addresses" });
    }
  });

  app.post("/api/addresses", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertAddressSchema.parse({
        userId: req.userId!,
        name: req.body.name,
        phone: req.body.phone,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        pincode: req.body.pincode,
        isDefault: req.body.isDefault || false,
      });
      const address = await storage.createAddress(validatedData);
      res.status(201).json(address);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create address" });
    }
  });

  app.patch(
    "/api/addresses/:id",
    authMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const address = await storage.getAddress(req.params.id);
        if (!address) {
          return res.status(404).json({ error: "Address not found" });
        }

        if (address.userId !== req.userId!) {
          return res.status(403).json({ error: "Unauthorized" });
        }

        const validatedData = insertAddressSchema.partial().parse(req.body);
        const updated = await storage.updateAddress(
          req.params.id,
          validatedData,
        );
        res.json(updated);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to update address" });
      }
    },
  );

  app.delete(
    "/api/addresses/:id",
    authMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const address = await storage.getAddress(req.params.id);
        if (!address) {
          return res.status(404).json({ error: "Address not found" });
        }

        if (address.userId !== req.userId!) {
          return res.status(403).json({ error: "Unauthorized" });
        }

        await storage.deleteAddress(req.params.id);
        res.status(204).send();
      } catch (error) {
        res.status(500).json({ error: "Failed to delete address" });
      }
    },
  );

  // Store endpoints
  app.get(
    "/api/inventory/all-stores",
    authMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const user = await storage.getUserById(req.userId!);
        if (!user?.isInventoryOwner) {
          return res
            .status(403)
            .json({ error: "Inventory owner access required" });
        }

        const inventories = await storage.getAllInventories();
        res.json(inventories);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch stores" });
      }
    },
  );

  const httpServer = createServer(app);
  return httpServer;
}
