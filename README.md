# BiteBox - Food Delivery Web Application

BiteBox is a full-stack food delivery web application built with React, Vite, Express, and SQLite. It features realistic restaurant menus, server-computed bill arithmetic, atomic payments, delivery route animation on Leaflet maps, a restaurant kitchen dispatch portal, and evaluator rehearsal controls.

---

## ⚡ Quick Start (Fresh Clone)

To start the application from a fresh clone, run the following three commands:

```bash
# 1. Install dependencies
npm install

# 2. Seed database schema and sample data
npm run seed

# 3. Start backend API (port 3001) and frontend dev server (port 5173)
npm run dev
```

- **Customer App**: [http://localhost:5173/](http://localhost:5173/)
- **Restaurant Partner Portal**: [http://localhost:5173/restaurant](http://localhost:5173/restaurant)
- **Backend API Health Check**: [http://localhost:3001/api/health](http://localhost:3001/api/health)

### Running the Regression Test Suite

A single command runs every backend assertion across all stages (1, 2, 3, 4a, 4b, and Polish & Hardening pass) and outputs a consolidated pass/fail summary:

```bash
npm test
```

---

## 🔑 Demo Credentials

| Role | Email / Identifier | Password | Default Address |
| :--- | :--- | :--- | :--- |
| **Demo Customer** | `aniket@bitebox.com` | `password123` | Presidency University, Itgalpur, Rajanakunte, Bengaluru |

> Evaluator convenience: The login screen contains a **⚡ Auto-Fill** button inside the collapsible `🧪 Demo` panel that immediately inputs these credentials.

---

## 🎛️ Demo Switches & Controls

The application includes several controls designed specifically for walkthroughs, testing, and rehearsals:

1. **`DEMO_MODE=true` (Environment Switch)**:
   - Configured in `.env`.
   - Protects all simulation and test endpoints (`/api/demo/*`, `/api/orders/:id/decision`, `/api/orders/:id/advance-stage`, `/api/orders/restaurant/all`, `/api/auth/test-expired-token`).
   - When disabled or unset, these endpoints return `404 Not Found`.

2. **Reset Demo Data (`POST /api/demo/reset-database`)**:
   - Exposed as a red **🔄 Reset Demo Data** button inside the collapsible `🧪 Demo` panel (available on the Login card, the Restaurant Listing header, and the Order Tracking screen).
   - Re-seeds database stock, clears all customer orders and payment records, and preserves the seeded demo customer account between rehearsals.

3. **Force Payment Failure Toggle (Payment Screen)**:
   - Allows toggling payment failure simulation on UPI and Card payment methods.
   - Verifies that payment failures increment attempt counters while leaving menu item stock untouched until a successful retry.

4. **Force Restaurant Rejection Toggle (Order Tracking Screen)**:
   - When enabled during the *"Awaiting restaurant confirmation"* stage, the order is automatically rejected.
   - Verifies atomic stock restoration and full refund issuance for UPI/Card orders (or *"No charge made"* for Cash on Delivery).

5. **Trip Speed Multiplier & Auto-Run**:
   - On the Order Tracking screen, evaluators can fast-forward delivery states using **Simulate Next ▶** or trigger the 45-second animated **▶ Auto-Run** at 1x, 2x, or 5x speed along the road-aligned GPS route.

6. **Resume After Refresh**:
   - Active orders on the Payment and Order Tracking screens are stored in session storage (`bitebox_active_order`, `bitebox_active_screen`).
   - If an evaluator refreshes their browser during payment or tracking, the application resumes directly at that order's current live state instead of losing it.

---

## 📡 REST API Endpoint Reference

### Health & System
| Method | Endpoint | Auth / Gate | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Returns service status, timestamp, and `demoMode` boolean flag. |

### Authentication
| Method | Endpoint | Auth / Gate | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Validates sanitized input, hashes password (`bcryptjs`), creates customer, and returns JWT. |
| `POST` | `/api/auth/login` | Public | Verifies credentials; returns generic `"Invalid credentials."` on failure, or 24h JWT on success. |
| `GET` | `/api/auth/me` | JWT Bearer | Returns the authenticated customer's profile. |
| `PATCH` | `/api/auth/location` | JWT Bearer | Updates default delivery address in SQLite. |
| `POST` | `/api/auth/test-expired-token` | `DEMO_MODE=true` | Evaluator test route that generates an expired JWT (returns 404 if demo mode is off). |

### Catalog & Coupons
| Method | Endpoint | Auth / Gate | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/restaurants?area=` | Public | Returns restaurants filtered by delivery area coverage. |
| `GET` | `/api/restaurants/:id` | Public | Returns restaurant profile details and operating hours. |
| `GET` | `/api/restaurants/:id/menu` | Public | Returns menu items categorized into Starters, Mains, Breads, and Desserts with real stock numbers. |
| `POST` | `/api/coupons/validate` | Public | Validates coupon code, active status, expiration, and enforces minimum order threshold server-side. |
| `GET` | `/api/coupons` | Public | Lists all active promotional coupons. |

### Orders & Pricing
| Method | Endpoint | Auth / Gate | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/orders/quote` | Public | Server-side quote calculation from database prices: item total, 5% GST rounded, flat ₹40 delivery fee, coupon deduction, and stock check. |
| `POST` | `/api/orders` | JWT Bearer | Creates order in `PLACED` status. Ignores client prices and re-calculates all totals on server. Customer is derived from JWT. |
| `GET` | `/api/orders/:id` | JWT Bearer | Returns order details, items, payment status, status history, and assigned agent (ownership enforced: 403 for other customers). |
| `GET` | `/api/orders/restaurant/all` | `DEMO_MODE=true` | Returns incoming kitchen orders (shows only order number, items, totals, and payment type; omits customer names/phones). |
| `POST` | `/api/orders/:id/decision` | `DEMO_MODE=true` | Restaurant accepts (assigns delivery partner) or rejects (restores stock, refunds payment, or logs "no charge made" for COD). |
| `POST` | `/api/orders/:id/advance-stage` | `DEMO_MODE=true` | Advances order forward (`confirmed` → `preparing` → `picked_up` → `out_for_delivery` → `delivered`). Rejects stage jumping. |

### Payments
| Method | Endpoint | Auth / Gate | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/payments/process` | JWT Bearer | Atomically processes UPI, Card, or Cash on Delivery. On success, transitions order to `paid, awaiting restaurant decision` and deducts stock. |
| `GET` | `/api/payments/:orderId` | JWT Bearer | Returns payment status and attempt count for an order. |

### Demo & Rehearsal Utilities
| Method | Endpoint | Auth / Gate | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/demo/reset-database` | `DEMO_MODE=true` | Re-seeds database stock, clears all customer orders and payments, and preserves demo accounts. |
| `POST` | `/api/demo/toggle-item-stock` | `DEMO_MODE=true` | Allows manually toggling a menu item's stock between in-stock and out-of-stock. |

---

## 📐 Bill Arithmetic & Refund Formulas

All calculations are enforced strictly on the backend:

- **Item Total**: $\sum (\text{unit\_price} \times \text{quantity})$ based on SQLite `menu_items.price`.
- **Tax (GST)**: $\text{Math.round}(\text{Item Total} \times 0.05)$ rounded to nearest rupee.
- **Delivery Fee**: Flat ₹40.
- **Discount**: Evaluated server-side against coupon rules (cannot exceed item total).
- **Grand Total**: $\max(0, \text{Item Total} + \text{Delivery Fee} + \text{Tax} - \text{Discount})$.
- **Refund Policy**: On restaurant rejection, `refund_amount === payment.amount === order.total_amount` (100% full refund for UPI & Card; ₹0 refund with *"No charge made"* message for COD).

---

## ⚠️ Documented Limitations & Production Requirements

1. **Restaurant Portal & Role-Based Access Control (RBAC)**:
   - The `/restaurant` partner portal and the endpoints `GET /api/orders/restaurant/all`, `POST /api/orders/:id/decision`, and `POST /api/orders/:id/advance-stage` are evaluation and simulation aids gated strictly behind `DEMO_MODE=true`.
   - To respect customer privacy, the portal displays **only** the order number, itemized dishes, bill totals, and payment type; customer personal names and telephone numbers are not exposed.
   - **Production Requirement**: In a commercial deployment, this requires dedicated restaurant owner/staff authentication accounts, granular multi-tenant Role-Based Access Control (RBAC), tenant database isolation, and restaurant audit logging.

2. **Delivery Fleet Dispatch**:
   - The delivery partner assignment (`Ramesh Kumar`, Ather 450X) is simulated server-side upon restaurant acceptance.
   - **Production Requirement**: A production release requires integration with a dedicated delivery partner app, real-time geofenced driver matchmaking, and live GPS telemetry over WebSockets/MQTT.
