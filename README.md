# RAAKKY CHICKEN — APP B: CUSTOMER ORDERING APPLICATION

High-performance, bilingual (English & Tamil), mobile-first online ordering progressive web application built for **The Raakky Chicken** (Press Colony, Coimbatore, Tamil Nadu).

---

## 🍗 Ecosystem Overview

The Raakky Chicken platform consists of:
1. **Existing Website**: Informational counter website showcasing location, ratings, and butcher cuts.
2. **APP A**: Shop Management, POS & Kitchen Counter Terminal (developed separately).
3. **APP B (This Application)**: Customer Ordering Progressive Web Application.
4. **Shared Cloudflare Backend**:
   - **Cloudflare Pages**: High-speed edge hosting.
   - **Cloudflare Workers / Pages Functions**: API layer (`/api/*`).
   - **Cloudflare D1**: Shared SQLite/D1 database schema (`server/schema.sql`).
   - **Cloudflare R2**: High-resolution counter and product asset storage.

---

## 🚀 Key Features Built in APP B

### 1. Brand & Design System
- **Palette**: Chilli Red (`#d90429`), Spicy Orange (`#f97316`), Warm Yellow (`#facc15`), Cream (`#fffdfa`), Charcoal (`#050505`), Fresh Green (`#16a34a`).
- **Typography**: `Barlow Condensed` for punchy butcher headings and stamps; `DM Sans` for clean UI controls; `Noto Sans Tamil` for authentic Tamil script rendering.
- **Micro-interactions**: Rotating spicy chilli loaders, skeleton loaders, subtle entrance animations, active item badges, celebration confetti on order completion.

### 2. Complete Bilingual Support (English & தமிழ்)
- Comprehensive translation dictionary (`src/locales/en.ts` and `src/locales/ta.ts`).
- 100% interface coverage: navigation, cut preferences, weight packages, bill breakdown, toasts, dialogs, error messages.
- Persistent language switcher located in the header, mobile drawer, and customer profile.

### 3. Real-Time Counter Status Engine
- Live Asia/Kolkata timezone shop hours:
  - **Monday – Saturday**: 7:00 AM – 9:00 PM
  - **Sunday**: 4:00 AM – 9:00 PM (early morning butcher rush)
- Real-time remote pause detection from APP A: when the counter operator pauses ordering, APP B immediately disables checkout and explains why with polite bilingual messaging.

### 4. Interactive Product Catalogue & Cutting Preferences
- Package size selection with dynamic price calculations (250g, 500g, 1kg).
- Custom cutting preferences:
  - **Style**: Medium Curry Cut, Small Biryani / Sukka Pieces, Large Fry Cut, Boneless Cubes, Whole Bird.
  - **Skin**: Skin-on vs. Skinless.
  - **Organs**: With Liver & Heart vs. Without Liver.
  - **Custom instructions**: Direct chef notes.
- In-stock inventory verification preventing out-of-stock purchases.

### 5. Persistent Shopping Cart & Revalidation
- Persistent cart in `localStorage` across page reloads.
- Line items differentiated by cut type and skin preferences.
- Free delivery progress indicator (Free delivery over ₹499).
- Custom red destructive confirmation modal on item deletion.
- Background and manual price & stock revalidation.

### 6. 5-Step Intuitive Checkout Flow
- **Step 1: Customer Details**: Indian +91 mobile verification with OTP countdown (60s), test OTP simulation (`123456`), and verified badge.
- **Step 2: Delivery vs. Store Pickup**:
  - **Home Delivery**: Saved address manager + new address form with landmark, house number, pincode, and delivery instructions.
  - **Store Pickup**: 81, Thiruvalluvar Nagar counter location, Google Maps navigation link, ~20-25 mins estimate, ₹0 delivery fee.
- **Step 3: Payment Method**:
  - Razorpay Online Payment (Google Pay, PhonePe, UPI, Cards, Netbanking).
  - Cash on Delivery (COD) / Pay on Delivery.
  - Pay at Counter (for Store Pickup).
- **Step 4: Final Order Review**: Itemized bill, delivery destination, payment mode review.
- **Step 5: Place Order**: Anti-duplicate submission protection and server-side verification.

### 7. Live Order Tracking & Reorder
- Real-time animated progress timeline:
  - `Order Placed` ➔ `Accepted by Shop` ➔ `Preparing (Cleaning & Cutting)` ➔ `Out for Delivery` / `Ready for Pickup` ➔ `Completed`.
- Display of counter rejection reason if rejected by shop in APP A.
- Order cancellation capability while pending/accepted.
- Direct shop call button (`+91 98435 99030`) and counter directions.
- One-click reorder with live stock revalidation.

### 8. Centralized Toast & Notification System
- Toast notifications with semantic colors: Green (success), Red (error), Amber (warning), Neutral (information).
- Custom modal dialogs (no native browser `alert()` or `confirm()`).
- Offline/online network connectivity banner.

---

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Lucide React
- **Animations**: Framer Motion + Canvas Confetti
- **Routing**: React Router v6
- **Backend / DB Binding**: Cloudflare Pages Functions + Cloudflare D1 SQL Database

---

## 💻 Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5174` in your browser.

3. **Build for production**:
   ```bash
   npm run build
   ```

---

## ☁️ Cloudflare Pages & D1 Deployment

1. **Create the shared Cloudflare D1 Database**:
   ```bash
   npx wrangler d1 create raakky-db
   ```

2. **Execute the database schema**:
   ```bash
   npx wrangler d1 execute raakky-db --file=./server/schema.sql
   ```

3. **Deploy to Cloudflare Pages**:
   ```bash
   npx wrangler pages deploy dist --project-name=raakky-customer-app
   ```
