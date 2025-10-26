# Saree E-Commerce Platform

## Overview

A premium e-commerce platform for selling traditional Indian sarees, featuring a modern React frontend with elegant design inspired by Indian textile aesthetics. The application provides a gallery-like browsing experience with product filtering, shopping cart functionality, and order checkout.

The platform showcases handcrafted sarees across multiple categories (Silk, Cotton Silk, Banarasi, Chiffon, Kanjivaram) and occasions (Wedding, Festive, Casual, Party) with rich imagery and detailed product information.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript
- Vite as the build tool and development server
- Wouter for client-side routing
- TanStack Query (React Query) for server state management
- GSAP for animations and scroll effects
- shadcn/ui component library built on Radix UI primitives

**Design System:**
- Tailwind CSS for styling with custom theme configuration
- Typography: Cormorant Garamond (headings), Inter (body), Montserrat (UI elements)
- Component variants using class-variance-authority
- Consistent spacing and responsive grid layouts
- Custom CSS variables for theming (light/dark mode support)

**State Management:**
- React Query for API data fetching and caching
- Local storage for session management (cart persistence)
- React Hook Form with Zod validation for form handling

**Key Pages:**
- Home: Hero section with GSAP animations, featured collections
- Products: Filterable product grid with sidebar filters
- ProductDetail: Individual product view with add-to-cart
- Cart: Shopping cart with quantity management
- Checkout: Order form with validation and submission

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- ESM module system
- Middleware for JSON parsing and request logging

**API Design:**
- RESTful endpoints under `/api` prefix
- Product endpoints: GET all products, GET single product
- Cart endpoints: GET cart by session, POST/PATCH/DELETE cart items
- Order endpoint: POST to create orders

**Data Storage:**
- In-memory storage implementation (`MemStorage` class) for development
- Prepared for PostgreSQL migration with Drizzle ORM schema defined
- Session-based cart isolation using client-generated session IDs

**Development Setup:**
- Vite middleware integration for HMR in development
- Custom request logging with response capture
- Static file serving for production builds

### Data Models

**Database Schema (Drizzle ORM):**

1. **Products Table:**
   - UUID primary key
   - Product details: name, description, price (decimal)
   - Categorization: fabric, color, occasion, category
   - Image URL for product photos
   - Stock tracking (inStock integer)

2. **Cart Items Table:**
   - UUID primary key
   - Product reference (productId)
   - Quantity management
   - Session ID for user isolation

3. **Orders Table:**
   - UUID primary key
   - Customer information: name, email, phone
   - Shipping address: address, city, state, pincode
   - Order details: totalAmount, items (JSON string)
   - Timestamp for order creation

**Validation:**
- Zod schemas generated from Drizzle tables using `drizzle-zod`
- Type-safe insert/select operations with TypeScript inference

### External Dependencies

**UI Component Libraries:**
- @radix-ui/* primitives for accessible components (dialogs, dropdowns, accordions, etc.)
- embla-carousel-react for image carousels
- lucide-react for icon components

**Database & ORM:**
- Drizzle ORM for type-safe database queries
- @neondatabase/serverless for PostgreSQL connection (when migrated)
- connect-pg-simple for potential session storage

**Development Tools:**
- @replit/vite-plugin-* for Replit-specific development features
- tsx for TypeScript execution
- esbuild for production server bundling

**Utilities:**
- date-fns for date formatting
- nanoid for ID generation
- clsx and tailwind-merge for className composition

**Third-Party Services:**
- Google Fonts API for typography (Cormorant Garamond, Inter, Montserrat)
- Local asset storage in `attached_assets/generated_images/` for product images

**Build Configuration:**
- TypeScript with strict mode and ESNext modules
- PostCSS with Tailwind CSS and Autoprefixer
- Path aliases (@/, @shared/, @assets/) for clean imports
- Separate client and server build outputs