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

  // Inventory endpoints
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
        res.json(products);
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

        const schema = insertProductSchema;
        const validatedData = schema.parse(req.body);

        // Generate unique tracking ID (format: PROD-TIMESTAMP-RANDOM)
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        const trackingId = `PROD-${timestamp}-${random}`;

        const product = await storage.createProduct({
          ...validatedData,
          trackingId,
          inventoryId: user.inventoryId,
        });

        res.status(201).json(product);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to create product" });
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

        const updatedProduct = await storage.updateProduct(
          req.params.id,
          req.body,
        );
        res.json(updatedProduct);
      } catch (error) {
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
        res.json(orders);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch orders" });
      }
    },
  );

  app.patch(
    "/api/inventory/orders/:id/status",
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

        const order = await storage.getOrder(req.params.id);
        if (!order || order.inventoryId !== user.inventoryId) {
          return res
            .status(404)
            .json({ error: "Order not found or unauthorized" });
        }

        const oldStatus = order.status;
        const updates: any = { status };
        if (returnNotes !== undefined) updates.returnNotes = returnNotes;
        if (refundStatus !== undefined) updates.refundStatus = refundStatus;

        const updatedOrder = await storage.updateOrderStatus(
          req.params.id,
          status,
        );

        res.json(updatedOrder);
      } catch (error) {
        res.status(500).json({ error: "Failed to update order status" });
      }
    },
  );

  app.patch(
    "/api/inventory/orders/:id/refund",
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

        const order = await storage.getOrder(req.params.id);
        if (!order || order.inventoryId !== user.inventoryId) {
          return res
            .status(404)
            .json({ error: "Order not found or unauthorized" });
        }

        const updatedOrder = await storage.updateOrder(req.params.id, {
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
  app.get("/api/products", async (req, res) => {
    try {
      const { search, fabric, occasion, minPrice, maxPrice } = req.query;

      const filters: any = {};
      if (typeof search === "string") filters.search = search;
      if (typeof fabric === "string") filters.fabric = fabric;
      if (typeof occasion === "string") filters.occasion = occasion;
      if (typeof minPrice === "string") filters.minPrice = parseFloat(minPrice);
      if (typeof maxPrice === "string") filters.maxPrice = parseFloat(maxPrice);

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
        }),
      );

      res.json(cartItemsWithProducts.filter((item) => item.product));
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

  app.post(
    "/api/orders",
    optionalAuthMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const validatedData = insertOrderSchema.parse(req.body);
        const orderItems = typeof validatedData.items === "string" 
          ? JSON.parse(validatedData.items) 
          : validatedData.items;
        const sessionId =
          orderItems && orderItems.length > 0 ? orderItems[0].sessionId : null;

        // Enrich items with product details
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

        // Get inventoryId from first product in order
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
          items: JSON.stringify(enrichedItems),
          userId: req.userId || null,
          inventoryId: inventoryId || null,
        };
        const order = await storage.createOrder(orderData);

        // Reduce stock immediately when order is created (pending status)
        for (const item of enrichedItems) {
          if (item.productId && item.quantity) {
            const product = await storage.getProduct(item.productId);
            if (product) {
              const newStock = Math.max(0, product.inStock - (item.quantity || 1));
              await storage.updateProduct(item.productId, {
                inStock: newStock,
              });
            }
          }
        }

        if (sessionId) {
          await storage.clearCart(sessionId);
        }

        res.status(201).json(order);
      } catch (error) {
        console.error("Order creation error:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to create order", details: String(error) });
      }
    },
  );

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

  app.delete(
    "/api/wishlist/:productId",
    authMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const success = await storage.removeFromWishlist(
          req.userId!,
          req.params.productId,
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
    "/api/wishlist/check/:productId",
    authMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const isInWishlist = await storage.isInWishlist(
          req.userId!,
          req.params.productId,
        );
        res.json({ isInWishlist });
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

  // Store Product Inventory endpoints
  app.get(
    "/api/inventory/products/:productId/stores",
    authMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const user = await storage.getUserById(req.userId!);
        if (!user?.isInventoryOwner || !user.inventoryId) {
          return res.status(403).json({ error: "Inventory access required" });
        }

        const product = await storage.getProduct(req.params.productId);
        if (!product || product.inventoryId !== user.inventoryId) {
          return res.status(404).json({ error: "Product not found or unauthorized" });
        }

        const storeInventory = await storage.getProductInventoryByProduct(req.params.productId);
        const inventories = await storage.getAllInventories();
        
        const result = inventories.map((inv) => {
          const storeInv = storeInventory.find((si) => si.storeId === inv.id);
          return {
            storeId: inv.id,
            storeName: inv.name,
            quantity: storeInv?.quantity || 0,
            channel: storeInv?.channel || "physical",
          };
        });

        res.json(result);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch store inventory" });
      }
    },
  );

  app.patch(
    "/api/inventory/products/:productId/inventory",
    authMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const user = await storage.getUserById(req.userId!);
        if (!user?.isInventoryOwner || !user.inventoryId) {
          return res.status(403).json({ error: "Inventory access required" });
        }

        const product = await storage.getProduct(req.params.productId);
        if (!product || product.inventoryId !== user.inventoryId) {
          return res.status(404).json({ error: "Product not found or unauthorized" });
        }

        const { storeInventory } = z.object({
          storeInventory: z.array(z.object({
            storeId: z.string(),
            quantity: z.number().min(0),
          }))
        }).parse(req.body);

        const results = await Promise.all(
          storeInventory.map((si) =>
            storage.updateStoreProductInventory(req.params.productId, si.storeId, si.quantity)
          )
        );

        res.json(results);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to update inventory" });
      }
    },
  );

  app.post(
    "/api/inventory/products/:productId/move",
    authMiddleware,
    async (req: AuthRequest, res) => {
      try {
        const user = await storage.getUserById(req.userId!);
        if (!user?.isInventoryOwner || !user.inventoryId) {
          return res.status(403).json({ error: "Inventory access required" });
        }

        const product = await storage.getProduct(req.params.productId);
        if (!product || product.inventoryId !== user.inventoryId) {
          return res.status(404).json({ error: "Product not found or unauthorized" });
        }

        const { fromStoreId, toStoreId, quantity } = z.object({
          fromStoreId: z.string(),
          toStoreId: z.string(),
          quantity: z.number().min(1),
        }).parse(req.body);

        const success = await storage.moveProductInventory(
          req.params.productId,
          fromStoreId,
          toStoreId,
          quantity
        );

        if (!success) {
          return res.status(400).json({ error: "Insufficient inventory in source store" });
        }

        res.json({ success: true });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: "Failed to move inventory" });
      }
    },
  );

  const httpServer = createServer(app);
  return httpServer;
}
