# Design Guidelines: Saree E-Commerce Platform

## Design Approach

**Reference-Based Design** drawing from premium e-commerce platforms (Shopify boutiques, Etsy artisan shops) combined with Indian textile aesthetics. The design celebrates rich textures, intricate patterns, and elegant sophistication while maintaining modern e-commerce usability.

**Core Principles:**
- Visual storytelling through textile imagery
- Spacious, gallery-like browsing experience
- Subtle elegance over heavy ornamentation
- Seamless shopping flow with delightful micro-interactions

## Typography System

**Font Families (Google Fonts):**
- Primary (Headings): "Cormorant Garamond" - Elegant serif with Indian calligraphic influence
- Secondary (Body): "Inter" - Clean, highly readable sans-serif
- Accent (Categories/Tags): "Montserrat" - Modern geometric for UI elements

**Type Scale:**
- Hero Headlines: text-5xl md:text-6xl lg:text-7xl, font-light
- Section Headers: text-3xl md:text-4xl, font-normal
- Product Titles: text-xl md:text-2xl, font-medium
- Body Text: text-base, font-normal, leading-relaxed
- Small Labels: text-sm, font-medium, tracking-wide uppercase
- Price Display: text-2xl md:text-3xl, font-semibold

## Layout System

**Spacing Units:** Use Tailwind spacing of 4, 6, 8, 12, 16, 20, 24 for consistent rhythm

**Container Strategy:**
- Full-width sections with max-w-7xl centered containers
- Product grids: max-w-6xl
- Checkout/Cart: max-w-4xl for focused experience
- Text content: max-w-3xl for optimal readability

**Grid Layouts:**
- Product listings: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
- Featured collections: grid-cols-1 lg:grid-cols-2 for larger cards
- Cart items: Single column on mobile, 2-column on desktop (product info + pricing)

## Page-Specific Design

### Homepage

**Hero Section (100vh):**
- Full-screen background image featuring a model in an elegant saree or close-up of intricate textile patterns
- Centered content overlay with blurred background for text/CTA
- Primary headline + subtitle + CTA button (blurred bg)
- Subtle GSAP fade-in and slight parallax scroll effect

**Collections Grid (Multi-section):**
- Featured Collections: 2x2 grid on desktop with large imagery, each featuring different saree types (Silk, Cotton, Designer, Wedding)
- Trending Sarees: 4-column grid with hover effects
- Shop by Occasion: Horizontal scroll cards on mobile, 3-column grid on desktop
- Heritage Textiles: Full-width banner section with side-by-side image + text layout

**Social Proof:**
- Customer testimonials: 3-column cards with customer photos, saree photos, and quotes
- Instagram feed integration: 4-6 images in masonry grid

### Product Listing Page

**Layout:**
- Sticky sidebar filters (fabric type, price range, color, occasion) on desktop, collapsible on mobile
- Main content area with product grid
- Breadcrumb navigation at top
- Result count and sort dropdown (Price, Newest, Popular)

**Product Cards:**
- Aspect ratio 3:4 for product images
- Card structure: Image → Title → Price → Quick View button (appears on hover)
- Subtle elevation on hover with GSAP scale animation (scale-105)
- Wishlist heart icon (top-right corner)

**Pagination:**
- Load more button with smooth GSAP scroll reveal for new products
- Scroll-to-top button appears after scrolling 2 viewports

### Product Detail Page

**Layout (2-Column on Desktop):**
- Left: Image gallery with main image + 4-5 thumbnail strips below, lightbox on click
- Right: Product info panel (sticky on scroll)

**Product Info Panel:**
- Breadcrumb navigation
- Product title (h1)
- Star rating + review count
- Price (prominent display)
- Fabric specifications grid (Material, Care Instructions, Dimensions, Weight)
- Size/variant selector (if applicable)
- Quantity selector
- Add to Cart button (large, prominent) with GSAP bounce animation on click
- Wishlist button
- Accordion sections: Description, Fabric Details, Shipping & Returns, Reviews

**Additional Sections:**
- You May Also Like: 4-column grid of related products
- Recently Viewed: Horizontal scroll carousel

### Shopping Cart

**Layout:**
- Cart items list (left 60% on desktop)
- Order summary sidebar (right 40%, sticky)

**Cart Items:**
- Each item: Thumbnail image (left) + Details (center) + Quantity controls + Price + Remove (right)
- Quantity controls with GSAP number transitions
- Empty state with illustration + Continue Shopping CTA

**Order Summary:**
- Subtotal, Shipping estimate, Tax, Total
- Promo code input field
- Proceed to Checkout button (large, full-width)
- Trust badges: Secure checkout, Free shipping threshold

### Checkout Page

**Multi-step Progress Indicator:**
- Steps: Shipping → Payment → Review
- Visual stepper at top showing current progress

**Form Layout (Single column, max-w-3xl):**
- Section headers with dividing lines
- Form groups with clear labels
- Input fields with consistent spacing (mb-6)
- Shipping address form
- Payment method cards (radio selection)
- Order review summary (sticky on desktop)
- Place Order button with loading state animation

## Component Library

### Navigation
- Top announcement bar (py-2, dismissible)
- Main header: Logo (left) + Search bar (center) + Icons (Cart, Wishlist, Account - right)
- Category mega-menu on hover with 4-column layout showing subcategories + featured image
- Sticky on scroll with subtle shadow

### Buttons
- Primary CTA: Rounded-lg, px-8 py-4, font-medium
- Secondary: Outlined variant with transparent background
- Icon buttons: Equal padding (p-3), rounded-full
- Add to Cart: Prominent with shopping bag icon, disabled state during add animation

### Cards
- Product cards: Rounded-xl, minimal border, shadow-sm, hover:shadow-lg transition
- Featured cards: Rounded-2xl with gradient overlays for text readability
- Info cards: Soft backgrounds, rounded-lg, p-6

### Forms
- Input fields: Rounded-lg, px-4 py-3, border-2
- Focus states: Border color change + subtle shadow
- Error states: Red border + error text below (text-sm)
- Select dropdowns: Matching input styling with custom arrow
- Checkboxes/Radio: Custom styled with accent colors

### Overlays
- Cart drawer: Slide-in from right, backdrop blur
- Quick view modal: Centered, max-w-4xl, with product gallery
- Image lightbox: Full-screen with navigation arrows

## Animation Strategy (GSAP)

**Minimal, Purposeful Animations:**
- Scroll reveals: Fade-in + slight y-axis movement for product cards (stagger effect)
- Hero transitions: Subtle parallax on background image
- Add to cart: Button scale pulse + cart icon bounce + item count badge animation
- Page transitions: Smooth fade between routes
- Hover effects: Scale (1.02-1.05) and shadow transitions
- Number counters: Price and quantity animate smoothly when changed

**Performance Guidelines:**
- Use `will-change` sparingly
- Leverage GSAP's timeline for coordinated animations
- Debounce scroll animations
- No animations on initial page load beyond hero fade-in

## Image Strategy

**Hero Images:**
- Homepage: Large hero image featuring model in saree or detailed textile close-up
- Collection pages: Banner images for each collection category

**Product Images:**
- High-quality lifestyle shots showing drape and fall of fabric
- Detail shots highlighting embroidery, borders, and patterns
- Model shots from multiple angles
- Flat-lay presentation for traditional viewing

**Supporting Images:**
- About/Heritage section: Weaving process, artisan photos
- Testimonials: Customer photos in their purchased sarees
- Trust badges and certification logos in footer

## Responsive Breakpoints

- Mobile: base (< 768px) - Single column, stacked layouts
- Tablet: md (768px+) - 2-column grids, visible filters
- Desktop: lg (1024px+) - Multi-column grids, sidebar layouts
- Large Desktop: xl (1280px+) - 4-column product grids, max-width containers

**Mobile Specific:**
- Hamburger menu for navigation
- Bottom fixed Add to Cart bar on product pages
- Collapsible filter accordion
- Horizontal scroll for product carousels