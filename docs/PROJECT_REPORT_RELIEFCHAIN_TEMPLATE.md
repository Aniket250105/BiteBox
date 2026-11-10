# BITEBOX
## A Hyperlocal Food Delivery & Real-Time Tracking Web Platform with Multi-Tier OSM Discovery, Atomic Inventory Controls, and Real-Time Telemetry

---

## PROJECT REPORT
*Submitted in partial fulfillment of the requirements for the degree of*  
**BACHELOR OF TECHNOLOGY IN COMPUTER SCIENCE AND ENGINEERING**  
**Subject:** Mini Project / Advanced Web Application Development (CSE2271)

### Submitted by:
| Team member | Roll number |
| :--- | :--- |
| **Sinchana** | 20241CSE0923 |
| **Yashwanth** | 20241CSE0924 |
| **Mahesh** | 20241CSE0925 |
| **Jayashri** | 20241CSE0926 |
| **Aniket N** | 20241CSE0927 |

**PRESIDENCY UNIVERSITY, BENGALURU**  
*Academic Year 2026–2027*

---

<!-- PAGE 2 -->
## [PAGE 2] CERTIFICATE

This is to certify that the project report entitled **"BiteBox: A Hyperlocal Food Delivery & Real-Time Tracking Web Platform"** is submitted by the following students of the Department of Computer Science and Engineering in partial fulfillment of the requirements for the Bachelor of Technology in Computer Science and Engineering degree:

| Name | Roll Number |
| :--- | :--- |
| Sinchana | 20241CSE0923 |
| Yashwanth | 20241CSE0924 |
| Mahesh | 20241CSE0925 |
| Jayashri | 20241CSE0926 |
| Aniket N | 20241CSE0927 |

The work presented in this report describes the design, engineering, and empirical prototype verification of a progressive hyperlocal food delivery web platform combining lightweight single-page application principles, live spatial discovery via OpenStreetMap Overpass queries, zero-trust server-side bill quoting, concurrency-safe inventory controls, and synchronized real-time courier telemetry. The report distinguishes prototype behaviour from proposed or future enterprise enhancements.

To the best of our knowledge, this report is an authentic account of the work undertaken by the team under the guidance of the project supervisor, subject to the institution's review and verification of the stated implementation and testing evidence.

---

<!-- PAGE 3 -->
## [PAGE 3] DECLARATION

We hereby declare that the project report entitled **"BiteBox: A Hyperlocal Food Delivery & Real-Time Tracking Web Platform"** has been prepared by our team as part of the academic project coursework.

The report describes the problem context, proposed architecture, prototype workflows, and implementation status as understood at the time of preparation. Features identified as planned, partial, or architecture-level proposals are not represented as production-ready functionality. Any implementation claims and test results must be supported by the source repository, demonstrable application behavior, or test output submitted with the project.

We acknowledge the use of official technical documentation for understanding modern web engineering, client-side caching, spatial querying via OpenStreetMap Overpass QL, SQLite Write-Ahead Logging (WAL) concurrency, Leaflet geographic mapping, JWT authentication, and automated regression testing. External material is identified in the references section.

| Name | Roll Number | Signature |
| :--- | :--- | :--- |
| Sinchana | 20241CSE0923 | ____________________ |
| Yashwanth | 20241CSE0924 | ____________________ |
| Mahesh | 20241CSE0925 | ____________________ |
| Jayashri | 20241CSE0926 | ____________________ |
| Aniket N | 20241CSE0927 | ____________________ |

**Date:** 10/11/2026  
**Place:** Bengaluru

---

<!-- PAGE 4 -->
## [PAGE 4] ACKNOWLEDGEMENT

We express our sincere gratitude to our project guide and faculty mentors of the Department of Computer Science and Engineering for their constant guidance, constructive feedback, and academic support throughout the conception, architectural development, and empirical testing of BiteBox.

We thank our institution, **Presidency University, Bengaluru**, for providing an academically stimulating environment, laboratory computing infrastructure, and encouragement to pursue practical, production-focused engineering solutions. Building a full-stack, low-latency web application demands not only theoretical algorithms but also rigorous attention to real-world software constraints: zero-trust transactional integrity, API rate limiting, concurrent database access, and accessibility.

We also formally acknowledge the maintainers of the open-source technologies and documentation that formed the technical foundation of this work: React 19, Vite, Express 5, Better-SQLite3, Leaflet, and the global OpenStreetMap and Overpass API developer community. Their open-data infrastructure and principled documentation made live geospatial integration possible without commercial API paywalls.

**The BiteBox Team**  
*Sinchana, Yashwanth, Mahesh, Jayashri, Aniket N*

---

<!-- PAGE 5 -->
## [PAGE 5] ABSTRACT

Commercial hyperlocal food delivery platforms have increasingly evolved into bloated mobile applications often exceeding 15 MB in initial bundle payload, burdened by promotional carousels, algorithmic ad tracking, and client-heavy pricing calculations. In resource-constrained network conditions, such bloat induces high page latency, battery drain, and checkout drop-offs. Concurrently, issues such as cart cross-contamination across multiple merchants, client-side price tampering, and inventory overselling during peak operational hours continue to impact operational reliability.

**BiteBox** is a lightweight, responsive progressive web platform engineered to deliver rapid hyperlocal food discovery and transparent order execution. BiteBox implements a three-tier architecture that cleanly decouples single-page presentation from transactional persistence and open geospatial discovery. The presentation tier (React 19, Vite, Leaflet) achieves a compressed production footprint of under 170 kB gzipped, rendering the live discovery feed in 104 ms. The API tier (Express 5, Node.js) enforces a zero-trust pricing engine where client-submitted prices and delivery fees are rejected; all line items, 5% GST rounding, coupon discounts, and delivery fees are strictly recomputed from the authoritative database.

Spatial discovery uses the OpenStreetMap (OSM) Overpass API across an extended 5.0 km delivery envelope, backed by a resilient four-tier fallback cascade: fresh SQLite cache (24h TTL), live Overpass spatial bounding-box query, stale cache, and hub snapshots. A deterministic rating engine (3.8★ to 4.8★) and cuisine-based pricing tier are computed algorithmically for discovered venues. Inventory management utilizes SQLite Write-Ahead Logging (WAL) with atomic `BEGIN IMMEDIATE` transactions to eliminate race conditions, preventing overselling even under 100 concurrent checkout attempts.

Empirical stress testing with 50 virtual users sustained 742.8 requests per second with a 0.00% error rate and 6.4 ms p95 response time. The full codebase satisfies 177 / 177 automated regression assertions, certifying functional correctness, atomic refund parity, and WCAG AA accessibility.

**Keywords:** Hyperlocal food delivery, OpenStreetMap, Overpass QL, Write-Ahead Logging, Zero-trust pricing, Concurrency control, Slide-to-pay, Leaflet telemetry.

---

<!-- PAGE 6 -->
## [PAGE 6] TABLE OF CONTENTS

| Section | Page |
| :--- | :---: |
| Certificate | 2 |
| Declaration | 3 |
| Acknowledgement | 4 |
| Abstract | 5 |
| List of Figures, Tables and Abbreviations | 7 |
| **Chapter 1: Introduction** | **8** |
| 1.1 Background and Motivation | 8 |
| 1.2 Problem Statement and Objectives | 8 |
| 1.3 Scope, Stakeholders and Assumptions | 9 |
| **Chapter 2: Existing System and Proposed Solution** | **10** |
| 2.1 Existing System and Limitations | 10 |
| 2.2 Proposed BiteBox Approach and Comparison (Table 2.1) | 11 |
| **Chapter 3: Requirements Analysis** | **12** |
| 3.1 Functional Requirements & Business Rules | 12 |
| 3.2 User Roles, Non-Functional Requirements and Feasibility | 13–14 |
| **Chapter 4: System Design** | **15** |
| 4.1 Architecture and Data Flow | 15–17 |
| 4.2 Functional Modules | 18 |
| 4.3 Database Design and Entity Relationships | 19–20 |
| 4.4 Spatial Discovery and Menu Generation | 21 |
| 4.5 Zero-Trust Pricing, Deterministic Ratings & Telemetry | 22 |
| **Chapter 5: Prototype Implementation, Testing and Results** | **23** |
| 5.1 Technology Stack and Status | 23–24 |
| 5.2 Testing Strategy and Scenarios | 24–25 |
| 5.3 Demonstration and Observations | 26–28 |
| **Chapter 6: Conclusion, Limitations and Future Work** | **29** |
| 6.1 Conclusion & Current Limitations | 29 |
| 6.2 Future Enhancements and Production Roadmap | 30 |
| **References** | **31** |

---

<!-- PAGE 7 -->
## [PAGE 7] LIST OF FIGURES, TABLES AND ABBREVIATIONS

### List of Figures
- **Figure 4.1:** BiteBox three-tier system architecture and data boundary (Page 15)
- **Figure 4.2:** Zero-trust checkout quoting and payment synchronization workflow (Page 16)
- **Figure 4.3:** Simplified relational entity-relationship data model (Page 19)
- **Figure 5.1:** Client authentication and live 5.0 km spatial discovery screen (Page 26)
- **Figure 5.2:** Dynamic menu browsing with garlic bread and cart quote validation (Page 27)
- **Figure 5.3:** Slide-to-Pay checkout, live courier telemetry, and partner kitchen portal (Page 28)

### List of Tables
- **Table 2.1:** Comparative matrix: Commercial aggregators vs. BiteBox architecture (Page 11)
- **Table 3.1:** Functional requirements matrix and module priorities (Page 12)
- **Table 3.2:** System user roles and operational responsibilities (Page 13)
- **Table 3.3:** Non-functional requirements and target performance thresholds (Page 14)
- **Table 4.1:** Main functional modules and system boundary definitions (Page 18)
- **Table 4.2:** Core database relational entities and schema attributes (Page 20)
- **Table 5.1:** Technology stack and subsystem roles (Page 23)
- **Table 5.2:** Prototype verification status matrix (Page 24)
- **Table 5.3:** Representative test execution scenarios (TC-01 to TC-12) (Page 25)

### Abbreviations
| Abbreviation | Definition |
| :--- | :--- |
| **API** | Application Programming Interface |
| **CSS** | Cascading Style Sheets |
| **ETA** | Estimated Time of Arrival |
| **GPS** | Global Positioning System |
| **GST** | Goods and Services Tax |
| **JWT** | JSON Web Token (RFC 7519) |
| **OSM** | OpenStreetMap Open Spatial Database |
| **PII** | Personally Identifiable Information |
| **RBAC** | Role-Based Access Control |
| **REST** | Representational State Transfer |
| **SRS** | Software Requirements Specification |
| **TTL** | Time to Live (Cache expiration interval) |
| **UI / UX** | User Interface / User Experience |
| **WAL** | Write-Ahead Logging (Database Concurrency Protocol) |

---

<!-- PAGE 8 -->
## [PAGE 8] CHAPTER 1: INTRODUCTION

### 1.1 Background and Motivation
Urban food delivery ecosystems have become an indispensable component of everyday urban life in India. In dense metropolitan clusters like Bengaluru, consumers expect seamless discovery of nearby restaurants, rapid order execution, transparent billing, and live delivery status updates. However, commercial aggregator applications (such as Swiggy and Zomato) have grown into heavy, monolithic applications exceeding 15 to 25 MB in bundle size. These applications are saturated with gamification popups, ad monetization banners, cross-selling widgets, and proprietary tracking scripts that cause high memory consumption, battery depletion, and sluggish page loads on budget mobile devices.

Furthermore, commercial platforms operate as closed data silos. Merchant listings, user review scores, and spatial routing are tightly guarded behind proprietary walls. Independent eateries and campus-area establishments face steep onboarding hurdles and commission rates reaching 25–30%.

**BiteBox** was conceptualized to demonstrate that a high-performance, responsive food delivery experience can be engineered using lean, open-standard technologies. By leveraging open spatial geographic data from OpenStreetMap (OSM), deterministic menu synthesis, atomic database write-ahead logging, and zero-trust backend price validation, BiteBox provides an authentic, bloat-free ordering platform that operates reliably across varied network conditions.

### 1.2 Problem Statement
Modern web food ordering systems suffer from three pervasive engineering failure modes:
1. **Client-Side Vulnerabilities & Price Tampering:** Many web prototypes perform price, tax, and discount arithmetic inside the browser JavaScript layer, exposing the checkout flow to client-side payload manipulation where malicious actors alter totals before submission.
2. **Inventory Race Conditions (Overselling):** Under high-concurrency ordering scenarios, standard read-then-write database patterns allow multiple customers to purchase the final unit of a dish simultaneously, causing order cancellation cascades and customer dissatisfaction.
3. **Spatial Fragility and External Dependency:** Applications relying solely on third-party paid map APIs fail abruptly when rate limits are exhausted or network access is throttled, leaving customers stranded without restaurant listings or tracking updates.

### 1.3 Objectives
- Deliver a high-speed Single Page Application with initial bundle payload under 200 kB gzipped.
- Implement an authoritative zero-trust pricing engine that recomputes every bill server-side.
- Integrate OpenStreetMap Overpass spatial queries across a 5.0 km radius with a resilient 4-tier fallback cascade.
- Guarantee absolute stock isolation with zero overselling using atomic SQLite write-ahead logging.
- Provide responsive real-time courier telemetry with simulated scooter movement and 3-second polling.

---

<!-- PAGE 9 -->
## [PAGE 9] 1.4 Scope, Stakeholders and Assumptions

### In-Scope Capabilities
- User registration, Bcrypt password hashing (cost factor 10), and stateless JWT session management.
- Delivery location resolver supporting HTML5 GPS coordinates and 4 preset Bangalore hubs (Presidency University, Indiranagar, Koramangala, MG Road).
- Geospatial discovery of live restaurants within a 5.0 km radius via OpenStreetMap Overpass API.
- Algorithmic deterministic rating engine (3.8★ to 4.8★) and cuisine-based pricing tiers.
- Categorized menu navigation (Starters, Mains, Breads, Desserts, Beverages) with pure-veg filtering.
- Zero-trust server-side bill quoting with exact 5% GST rounding and coupon discount validation.
- Accessible Slide-to-Pay checkout supporting Mock UPI, Mock Card, and Cash on Delivery (COD).
- Atomic stock decrement on payment and exact 1:1 stock restoration upon kitchen rejection.
- Restaurant Partner Portal for one-click kitchen acceptance, preparation advancing, and order rejection.
- Live telemetry tracking screen featuring animated Leaflet route rendering, scooter heading calculation, and 3-second status polling.

### Out of Scope for the Current Demonstration
- Production banking gateway settlement (Razorpay / PayU live credentials requiring commercial merchant KYC).
- Hardware GPS tracking units mounted on actual courier vehicles (telemetry is simulated along coordinate polylines).
- Native Android/iOS application packages (the platform is built strictly as a Progressive Web App).
- SMS gateway integration (orders and status updates rely on authenticated in-app notification state).

### Stakeholders
The primary actors comprise **Customers** (ordering food and tracking deliveries), **Restaurant Partners** (reviewing incoming orders, managing stock, and updating kitchen progress), **Delivery Couriers** (assigned to pick up and deliver orders), and **System Administrators** (monitoring database health and audit logs).

> **Important boundary:** BiteBox is designed to demonstrate robust full-stack software architecture, spatial discovery, and concurrency control. It simulates payment gateway success/failure callbacks and courier vehicle progress while maintaining full transactional consistency across the database.

---

<!-- PAGE 10 -->
## [PAGE 10] CHAPTER 2: EXISTING SYSTEM AND PROPOSED SOLUTION

### 2.1 Existing System Overview
Commercial food delivery platforms in the Indian market rely heavily on distributed microservice architectures. While capable of scaling to millions of concurrent users, these platforms have accumulated massive frontend and network bloat. A standard mobile web session on commercial aggregators downloads between 12 MB and 25 MB of assets across dozens of third-party domains.

### 2.2 Architectural Limitations
- **Resource Overhead:** Heavy client-side JavaScript bundles lead to First Contentful Paint (FCP) latencies exceeding 3.5 seconds on 3G and 4G mobile connections.
- **Proprietary Map Lock-In:** Commercial platforms rely on Google Maps Platform APIs incurring substantial costs per query, which is unfeasible for independent campus-area networks.
- **Client-Side Price Exposure:** Prototypes frequently trust client-submitted cart calculations, allowing parameter tampering via HTTP interceptors.
- **Fragile Network Recovery:** When mobile connectivity drops momentarily, tracking screens frequently crash or display stale states requiring manual reloads.

### 2.3 Proposed BiteBox Approach
BiteBox replaces monolithic complexity with a clean, decoupled three-tier architecture:
1. **Lean Client Presentation:** Built using React 19 and Vite with zero advertising or tracking libraries, achieving an initial bundle size under 170 kB gzipped.
2. **Open Spatial Discovery:** Direct integration with the OpenStreetMap Overpass API querying live geographic nodes within 5.0 km, backed by persistent SQLite spatial caching.
3. **Zero-Trust Authoritative Pricing:** All cart items, taxes (5% GST), delivery charges (flat ₹40), and coupon discounts are computed exclusively by the server database.
4. **Atomic Concurrency Control:** SQLite Write-Ahead Logging (WAL) mode guarantees immediate stock deduction on payment and exact refund restoration upon kitchen rejection.

---

<!-- PAGE 11 -->
## [PAGE 11] Table 2.1 Comparative Matrix: Commercial Aggregators vs. BiteBox

| Architectural Concern | Typical Commercial Aggregators | BiteBox Approach |
| :--- | :--- | :--- |
| **Frontend Bundle Size** | Monolithic bundles > 15 MB with marketing & trackers. | Optimized React 19 SPA < 170 kB gzipped with zero trackers. |
| **Initial Render Latency** | 2.5 s to 4.5 s First Contentful Paint on mobile 4G. | Sub-110 ms First Contentful Paint (104 ms verified). |
| **Geospatial Data Source** | Proprietary Google Maps Platform with high API fees. | OpenStreetMap Overpass API with open-data coordinates. |
| **Discovery Radius** | Algorithmic dynamic radius often restricted to sponsored stores. | Transparent, user-configurable 5.0 km spherical Haversine envelope. |
| **Pricing Validation** | Distributed pricing microservices with periodic client sync. | Strict zero-trust backend quoting; client prices rejected. |
| **Inventory Concurrency** | Eventual consistency with post-payment order cancellations. | Immediate ACID write-ahead logging; atomic stock decrement on payment. |
| **Rejection Refund Parity** | Multi-day payment gateway refund processing (3–7 days). | Instant atomic payment status update to `REFUNDED` (100% parity). |
| **Telemetry & Tracking** | Heavy WebSocket streaming requiring continuous connection. | Resilient 3-second polling with linear spline courier interpolation. |
| **Offline & Fallback** | Generic error screens when geocoding endpoints fail. | Resilient 4-tier cascade: Fresh Cache -> Overpass -> Stale -> Snapshot. |

---

<!-- PAGE 12 -->
## [PAGE 12] CHAPTER 3: REQUIREMENTS ANALYSIS

### 3.1 Functional Requirements Matrix

| Module ID | Requirement Summary & Behavior Specification | Priority |
| :--- | :--- | :---: |
| **FR-AUTH** | User registration, login, Bcrypt hashing (`$2a$` prefix), and stateless JWT issuance. Identical generic errors for unknown user and incorrect password. | Critical |
| **FR-GEO** | Delivery location resolver supporting HTML5 GPS coordinates and 4 preset Bangalore hubs. Strict coordinate validation (-90<=lat<=90, -180<=lng<=180). | High |
| **FR-REST** | Retrieve restaurants within 5.0 km sorted by Haversine distance. Enforce 30 req/min rate limit per IP. Multi-tier fallback cascade upon network failure. | High |
| **FR-MENU** | Dynamic menu generation categorized into Starters, Mains, Breads, Desserts, and Beverages. Pure-veg tagging and out-of-stock indicators. | High |
| **FR-CART** | Cart state persistence across navigation. Strict single-restaurant enforcement (cart clears on merchant switch). Quantity validation (positive integers <=99). | Critical |
| **FR-QUOTE** | Server-side price quoting. Grand total = Item Total + round(5% GST) + ₹40 Delivery Fee - Discount. Client price tampering strictly ignored. | Critical |
| **FR-PAY** | Slide-to-Pay checkout with UPI, Card, and COD support. Atomic stock decrement on payment. Parallel double-submit protection. | Critical |
| **FR-PARTNER** | Restaurant Partner Portal for order decisioning. Accept transitions order to `confirmed` and assigns courier; Reject marks `rejected` with reason. | High |
| **FR-TELEMETRY**| Real-time order tracking screen with animated Leaflet route rendering, scooter heading rotation, delivery stages stepper, and 3-second polling. | High |
| **FR-REFUND** | Atomic refund processing for rejected UPI/Card orders. Refund amount strictly equals charged amount. Immediate restoration of inventory stock. | Critical |

---

<!-- PAGE 13 -->
## [PAGE 13] Core Business Rules & User Roles

### Core Business Rules
- **Single-Restaurant Cart Rule:** A customer cart can hold dishes from exactly one restaurant at a time. Adding a dish from a new restaurant triggers a confirmation dialog to clear previous items.
- **Zero-Trust Pricing Rule:** The client application never calculates prices. The server recomputes item totals, tax rounding, and delivery fees directly from database rows.
- **Atomic Stock Rule:** When an online payment succeeds, inventory stock is decremented immediately within an exclusive database transaction (`BEGIN IMMEDIATE`). If stock is insufficient, payment is rejected.
- **Refund Parity Rule:** If an order is rejected by the kitchen, online payments are marked `REFUNDED` with the exact charged amount, and stock is atomically restored. COD orders incur no refund.
- **Delivery Boundary Rule:** Orders are accepted only from restaurants located within 5.0 km of the customer's active delivery coordinates. Distant orders are rejected by the quote engine.

### Table 3.2 User Roles and Responsibilities
| User Role | Main Responsibilities & Operational Permissions |
| :--- | :--- |
| **Customer** | Selects delivery location, searches nearby restaurants within 5 km, browses menus, applies coupons, reviews server-calculated quotes, executes Slide-to-Pay, and tracks delivery telemetry. |
| **Restaurant Partner** | Accesses kitchen portal (`/restaurant`), reviews incoming paid orders, accepts or rejects orders, advances preparation stages (`confirmed` -> `preparing` -> `picked_up`), and manages dish availability. |
| **Delivery Courier** | Assigned automatically upon kitchen acceptance. Represents delivery progress (`out_for_delivery` -> `delivered`) and simulates physical movement along route polylines. |
| **System Administrator** | Monitors API gateway health, inspects SQLite database transactions, resets test fixtures via demo endpoints, and evaluates rate-limiting telemetry. |
| **Public / Guest** | Views promotional landing page and hub previews; prompted to register or authenticate before placing orders. |

---

<!-- PAGE 14 -->
## [PAGE 14] Non-Functional Requirements & Feasibility

### Table 3.3 Non-Functional Requirements
| Quality Attribute | Requirement / Design Target Specification |
| :--- | :--- |
| **Performance** | Discovery feed First Contentful Paint < 150 ms; quote API latency < 30 ms; cached nearby spatial queries < 5 ms. Sustained load > 500 req/s. |
| **Scalability** | Stateless Express API architecture; SQLite Write-Ahead Logging (WAL) supporting concurrent readers without blocking writers. |
| **Security** | Bcrypt password hashing (cost factor 10); stateless JWT auth tokens; sanitization of input strings against XSS; zero storage of CVV or raw card data. |
| **Reliability** | Idempotent payment submissions; atomic stock transactions; 4-tier fallback cascade preventing discovery failure when Overpass is unreachable. |
| **Privacy** | Customer passwords and raw coordinates are never exposed in plaintext logs; public views redact personal phone numbers and delivery details. |
| **Accessibility** | Compliance with WCAG 2.1 AA standards: minimum 4.5:1 color contrast, visible focus rings, ARIA labels on interactive pins, and keyboard navigation. |
| **Auditability** | Append-only order status history logging exact timestamps, status transitions, assigned couriers, and payment refund references. |

### Feasibility Analysis
- **Technical Feasibility:** The technology stack (React 19, Express 5, Better-SQLite3, Leaflet, OpenStreetMap) comprises mature, production-proven open-source tools with active global developer communities.
- **Operational Feasibility:** The user interface follows standard Indian food delivery interaction patterns (horizontal cuisine pills, slide-to-pay confirmation, delivery stage stepper), ensuring zero learning curve.
- **Economic Feasibility:** By substituting commercial mapping APIs with OpenStreetMap Overpass QL and utilizing embedded SQLite WAL, the application eliminates recurring monthly API fees.

---

<!-- PAGE 15 -->
## [PAGE 15] CHAPTER 4: SYSTEM DESIGN

### 4.1 System Architecture
BiteBox is architected as a decoupled three-tier system comprising a Presentation Tier (Client SPA), an Application & API Gateway Tier, and a Persistence & Spatial Tier.

```
+-------------------------------------------------------------------+
|               LAYER 1: PRESENTATION TIER (CLIENT SPA)             |
|   React 19  |  Vite Bundler  |  Leaflet GIS  |  Tailwind CSS      |
+-------------------------------------------------------------------+
                                  |
                                  |  REST / JSON (JWT Authenticated)
                                  v
+-------------------------------------------------------------------+
|               LAYER 2: APPLICATION & API GATEWAY TIER              |
|   Express 5  |  Rate Limiter  |  Zero-Trust Quoting  |  FSM State |
+-------------------------------------------------------------------+
                                  |
                                  |  IPC / In-Memory WAL Driver
                                  v
+-------------------------------------------------------------------+
|               LAYER 3: PERSISTENCE & SPATIAL ENGINE               |
|   SQLite WAL (better-sqlite3)  |  OSM Overpass API (4 Mirrors)    |
+-------------------------------------------------------------------+
```

---

<!-- PAGE 16 -->
## [PAGE 16] Data Flow & Main Workflows

### Order Placement Workflow
1. Customer selects a restaurant and adds dishes to the cart.
2. Client requests `POST /api/orders/quote` passing item IDs, quantities, and delivery coordinates.
3. Backend recomputes item totals from database rows, applies flat ₹40 delivery fee, adds rounded 5% GST, verifies coupon discount, and returns authoritative quote.
4. Customer performs Slide-to-Pay; client sends payment confirmation to `POST /api/payments`.
5. Backend executes `BEGIN IMMEDIATE` transaction, verifies stock availability, decrements inventory, creates payment record, and marks order `paid`.

---

<!-- PAGE 17 -->
## [PAGE 17] Telemetry, Dispatch & Finite State Machine

### Telemetry and Dispatch Workflow
Following successful payment, the order enters the kitchen decisioning lifecycle. The Restaurant Partner Portal receives the order in real time. Upon kitchen acceptance:
1. The order status transitions from `paid` to `confirmed`.
2. A delivery courier (e.g., Ramesh Kumar) is assigned from the available pool.
3. An immutable status change log is appended to `order_status_history`.
4. The customer tracking screen polls `GET /api/orders/:id` every 3 seconds, detecting the confirmation and rendering the courier card.
5. As the restaurant advances the order through `preparing`, `picked_up`, and `out_for_delivery`, the client updates the delivery stage stepper.
6. During the `out_for_delivery` phase, a simulated linear spline algorithm moves the scooter icon smoothly along the polyline connecting the restaurant and customer coordinates.
7. Upon courier arrival, the order transitions to `delivered`. For COD orders, payment status is simultaneously transitioned to `SUCCESS`.

> **Consistency rule:** Order total, payment status, inventory stock, courier assignment, and tracking stepper must be derived strictly from authoritative database rows. A frontend-only state mutation is never treated as a substitute for a persisted backend database transaction.

---

<!-- PAGE 18 -->
## [PAGE 18] Table 4.1 Functional Modules & System Boundaries

| Module Name | Purpose, Architecture Boundary and Security Controls |
| :--- | :--- |
| **Authentication & User Service** | Manages customer onboarding, login, Bcrypt hashing, and JWT token signing. Enforces generic "Invalid credentials" error masking. |
| **Geolocation & Hub Resolver** | Resolves delivery addresses, validates geographic coordinates (-90<=lat<=90, -180<=lng<=180), and synchronizes location across sessions. |
| **OSM Discovery Engine** | Constructs Overpass QL bounding box queries, executes HTTP mirror queries, calculates Haversine distances (d <= 5.0 km), and caches results in `geo_cache`. |
| **Menu & Inventory Control** | Synthesizes deterministic restaurant menus, organizes categories, tracks real-time stock levels, and flags sold-out items with `aria-disabled`. |
| **Price Quoting & Bill Engine** | Enforces zero-trust bill calculations: item totals, 5% GST rounding, ₹40 delivery fee, and coupon revalidation against database prices. |
| **Slide-to-Pay Checkout** | Provides swipe and keyboard accessible payment confirmation. Supports Mock UPI, Mock Card, and COD. Prevents parallel double submits. |
| **Restaurant Partner Portal** | Dedicated portal (`/restaurant`) for kitchen staff to review pending orders, accept orders with courier dispatch, or reject with atomic refund. |
| **Real-Time Telemetry Tracking** | Polls order status at 3-second intervals, renders Leaflet route polylines, animates scooter heading, and updates stage steppers. |
| **Audit & Lifecycle Logger** | Maintains append-only `order_status_history` and `payments` records capturing actor identities, timestamps, and refund transactions. |

---

<!-- PAGE 19 -->
## [PAGE 19] 4.3 Database Design

PostgreSQL / SQLite conceptual data model linking customers, restaurants, menu items, orders, order items, payments, status history, and delivery couriers.

```
[Customers] 1 ----- * [Orders] 1 ----- * [Order Items] * ----- 1 [Menu Items]
                           |                                          |
                           1                                          *
                           |                                          |
                       [Payments]                               [Restaurants]
                           |
                           1
                           |
                     [Status History]
```

---

<!-- PAGE 20 -->
## [PAGE 20] Table 4.2 Core Database Entities

| Entity Name | Primary Schema Attributes & Integrity Purpose |
| :--- | :--- |
| **`customers`** | `id (PK)`, `name`, `email (UNIQUE)`, `phone (UNIQUE)`, `password_hash`, `default_address`, `created_at`. Stores user credentials. |
| **`restaurants`** | `id (PK)`, `name`, `cuisine`, `rating`, `delivery_time_est`, `is_open`, `image_url`, `emoji`, `lat`, `lng`, `source`, `osm_type`, `osm_id`. |
| **`menu_items`** | `id (PK)`, `restaurant_id (FK)`, `category`, `name`, `price`, `is_veg`, `is_available`, `stock_quantity`, `description`, `image_url`. |
| **`orders`** | `id (PK)`, `customer_id (FK)`, `restaurant_id (FK)`, `status`, `item_total`, `tax_amount`, `delivery_fee`, `discount_amount`, `grand_total`, `delivery_lat`, `delivery_lng`. |
| **`order_items`** | `id (PK)`, `order_id (FK)`, `menu_item_id (FK)`, `item_name`, `quantity`, `unit_price`, `subtotal`. Preserves purchase snapshot. |
| **`payments`** | `id (PK)`, `order_id (FK, UNIQUE)`, `payment_method`, `amount`, `status (PENDING/SUCCESS/FAILED/REFUNDED)`, `transaction_ref`, `refund_amount`, `refunded_at`. |
| **`order_status_history`**| `id (PK)`, `order_id (FK)`, `status`, `actor`, `notes`, `created_at`. Append-only audit trail. |
| **`delivery_agents`** | `id (PK)`, `name`, `phone`, `vehicle_type`, `is_available`, `current_lat`, `current_lng`. Courier dispatch pool. |
| **`coupons`** | `id (PK)`, `code (UNIQUE)`, `discount_type`, `discount_value`, `min_order_amount`, `is_active`, `expires_at`. Promotional codes. |
| **`geo_cache`** | `cell_key (PK)`, `fetched_at`, `payload`. Stores Overpass spatial query results for 24 hours. |
| **`restaurant_delivery_areas`** | `id (PK)`, `restaurant_id (FK)`, `area_name`. Maps seeded restaurants to named operational hubs. |

---

<!-- PAGE 21 -->
## [PAGE 21] 4.4 Spatial Discovery & Menu Generation

### Overpass QL Spatial Query Construction
To query OpenStreetMap without incurring commercial fees, BiteBox constructs bounding box queries centered on the customer's delivery coordinates using an expanded 5.0 km radius:

```
[out:json][timeout:6];
(
  node["amenity"~"^(restaurant|fast_food|cafe)$"](13.1243,77.4886,13.2143,77.5810);
  way["amenity"~"^(restaurant|fast_food|cafe)$"](13.1243,77.4886,13.2143,77.5810);
);
out center tags;
```

Every returned node or way center is evaluated against the spherical Haversine formula ($R = 6371	ext{ km}$):
$$d = 2R rcsin\left(\sqrt{\sin^2(\Delta\phi/2) + \cos(\phi_1)\cos(\phi_2)\sin^2(\Delta\lambda/2)}ight)$$

Venues with $d \le 5.0	ext{ km}$ are normalized, sorted nearest-first, and cached in `geo_cache`.

### Deterministic Menu Synthesis Engine
- **Cuisine Matching:** South Indian venues generate Sagar dishes; pizzerias generate garlic bread and pizzas; bakeries generate sandwiches and coffee.
- **Pure Veg Enforcement:** Venues tagged `diet:vegetarian=only` generate 100% vegetarian menus with zero meat or poultry items.
- **Determinism:** Re-querying or reloading the menu for a venue produces the exact same dishes, descriptions, prices, and stock counts.

---

<!-- PAGE 22 -->
## [PAGE 22] 4.5 Zero-Trust Pricing, Deterministic Ratings & Telemetry

### Zero-Trust Authoritative Price Quoting
1. **Line Item Calculation:** Each item's price is queried directly from `menu_items`. Client-supplied unit prices are discarded.
2. **Tax Computation:** 5% GST is computed and rounded to the nearest integer: $	ext{Tax} = 	ext{round}(0.05 	imes 	ext{Item Total})$.
3. **Delivery Fee:** A flat ₹40 delivery fee is applied to all orders.
4. **Coupon Validation:** Flat and percentage discounts are evaluated against minimum order amounts.

### Deterministic Rating Engine
Because OpenStreetMap intentionally excludes subjective reviews, BiteBox incorporates a deterministic rating algorithm that maps the venue's name and OSM ID into a consistent score between 3.8★ and 4.8★:
$$	ext{Rating} = 3.8 + (	ext{Hash}(	ext{osm\_id}, 	ext{name}) \pmod{11}) 	imes 0.1$$

---

<!-- PAGE 23 -->
## [PAGE 23] CHAPTER 5: PROTOTYPE IMPLEMENTATION, TESTING AND RESULTS

### Table 5.1 Technology Stack & Prototype Roles
| Subsystem Layer | Technology / Library | Role and Architectural Responsibility |
| :--- | :--- | :--- |
| **Frontend UI** | React 19, Vite 8, Tailwind CSS, Lucide Icons | Responsive mobile-first SPA, state management, modal dialogs, and slide-to-pay controls. |
| **Mapping & GIS** | Leaflet 1.9.4, OpenStreetMap Tiles | Interactive map rendering, dashed 5 km delivery circle, pin clustering, and courier route polyline. |
| **Backend API** | Node.js 22, Express 5, CORS, Dotenv | RESTful API routing, sliding-window rate limiting, input sanitization, and zero-trust price quote calculation. |
| **Database & Storage** | SQLite 3, `better-sqlite3` (WAL mode) | Embedded relational database, ACID transactions (`BEGIN IMMEDIATE`), and spatial cell caching in `geo_cache`. |
| **Security & Auth** | Bcrypt.js, JSON Web Tokens (`jsonwebtoken`) | Bcrypt password hashing (cost factor 10), stateless JWT session issuance, and route protection middleware. |
| **External Spatial API**| OpenStreetMap Overpass API (4 mirrors) | Geospatial node/way querying for live restaurants within 5 km bounding box. |
| **Testing & Hardening**| Node Test Runner, Autocannon, Axe-Core | 177 automated regression assertions, high-concurrency stress testing (50 VUs), and WCAG accessibility auditing. |

---

<!-- PAGE 24 -->
## [PAGE 24] Table 5.2 Prototype Verification Status Matrix

| Capability / Feature | Prototype Status | Verification Evidence & Operational Caveat |
| :--- | :---: | :--- |
| **User Registration & Login** | Fully Certified (PASS) | Bcrypt hashing verified in SQLite; generic "Invalid credentials" error enforced on bad credentials. |
| **5 km Spatial Discovery** | Fully Certified (PASS) | Overpass API returns 8 live restaurants at Presidency hub and 1,500+ in city hubs. 4-tier fallback cascade verified. |
| **Zero-Trust Pricing** | Fully Certified (PASS) | 6 test carts verified; ₹30 item tax correctly rounds to ₹2; client-tampered totals strictly ignored. |
| **Slide-to-Pay Checkout** | Fully Certified (PASS) | Accessible swipe/keyboard control; parallel double-submit rejected; UPI, Card, and COD tested. |
| **Atomic Stock Isolation** | Fully Certified (PASS) | 100 concurrent requests against stock=3 resulted in exactly 3 orders placed and 97 rejected with 0 overselling. |
| **Partner Kitchen Portal** | Fully Certified (PASS) | One-click accept assigns courier; reject issues atomic refund with 100% monetary parity and stock restoration. |
| **Live Telemetry Tracking** | Fully Certified (PASS) | Leaflet polyline rendering, scooter heading rotation, 3-second polling, and recovery after 20s server restart verified. |

---

<!-- PAGE 25 -->
## [PAGE 25] Table 5.3 Representative Test Scenarios (TC-01 to TC-12)

| Test ID | Execution Scenario & Input Conditions | Expected Result & Empirical Outcome |
| :--- | :--- | :--- |
| **TC-01** | Register duplicate email `aniket@bitebox.com`; short password < 6 chars. | HTTP 400 Bad Request returned with clear validation error. (PASS) |
| **TC-02** | Inspect `customers` table in SQLite database and server execution logs. | Passwords strictly stored as `$2a$10$...` Bcrypt hashes; zero plaintext. (PASS) |
| **TC-03** | Query `GET /api/restaurants/nearby` with coordinates at Presidency hub. | 8 live OSM venues returned strictly within 5.0 km; sorted nearest-first. (PASS) |
| **TC-04** | Submit quote with ₹30 item: 5% GST = 1.5. Check tax rounding. | Tax rounded to ₹2. Grand total strictly equals ₹30 + ₹2 + ₹40 = ₹72. (PASS) |
| **TC-05** | Tamper test: inject client-calculated price ₹10 and total ₹10 in order payload. | Client values ignored; server charges authoritative DB price of ₹292. (PASS) |
| **TC-06** | Fire two simultaneous `POST /api/payments` requests on the same placed order. | Exactly one payment succeeds; second is rejected as duplicate submission. (PASS) |
| **TC-07** | Reject an order paid via UPI (₹513). Check refund amount and payment status. | Payment marked `REFUNDED`; refund amount strictly ₹513 (100% parity). (PASS) |
| **TC-08** | Simulate 100 concurrent checkout attempts against a dish with stock = 3. | Exactly 3 orders placed; 97 rejected with "out of stock"; 0 overselling. (PASS) |
| **TC-09** | Block Overpass API endpoints; query nearby restaurants within 1 km of hub. | Graceful fallback to snapshot JSON file with "Showing saved restaurants". (PASS) |
| **TC-10** | Stop backend server for 20 seconds during active tracking; restart server. | Tracking screen recovers automatically within 3 seconds without reload. (PASS) |
| **TC-11** | Sustain 50 virtual users executing discovery and order flows for 60 seconds. | 44,619 requests completed at 742.8 req/s; 0.00% errors; p95 = 6.4 ms. (PASS) |
| **TC-12** | Run automated regression suite `test/regression.js`. | All 177 assertions pass across schema, auth, pricing, state, and refunds. (PASS) |

---

<!-- PAGES 26-28 -->
## [PAGES 26–28] Demonstration Screen Outputs

- **Figure 5.1:** Client Authentication Modal & Live 5.0 km Interactive Discovery Map.
- **Figure 5.2:** Dynamic Menu View with Authentic Garlic Bread Baguette & Shopping Cart with Server-Side Bill Quote.
- **Figure 5.3:** Accessible Slide-to-Pay Confirmation, Real-Time Courier Telemetry Stepper, and Restaurant Partner Kitchen Portal.

---

<!-- PAGE 29 -->
## [PAGE 29] CHAPTER 6: CONCLUSION AND FUTURE WORK

### 6.1 Conclusion
BiteBox successfully demonstrates that a high-performance, responsive hyperlocal food delivery platform can be engineered using lean, open-standard technologies. By eliminating third-party tracking libraries and commercial map dependencies, the system achieves an initial frontend bundle of under 170 kB gzipped, delivering sub-110 ms render latencies on mobile devices.

The platform establishes three critical engineering guarantees:
1. **Zero-Trust Financial Correctness:** Client-side price tampering is eliminated by recomputing all item prices, 5% GST rounding, coupon discounts, and delivery fees server-side from database rows.
2. **Atomic Inventory Isolation:** SQLite Write-Ahead Logging (WAL) and `BEGIN IMMEDIATE` transactions eliminate overselling race conditions.
3. **Resilient Geospatial Discovery:** Integrating OpenStreetMap Overpass QL with a 4-tier fallback cascade guarantees continuous restaurant availability within 5.0 km.

### 6.2 Current Limitations
- **Development HTTP Transport:** The prototype operates over plain HTTP in local development environments.
- **Single-Node SQLite Storage:** Scaling to multi-city operations requires migration to distributed PostgreSQL.
- **Simulated Telemetry:** Courier movement along route polylines is currently simulated using linear spline interpolation rather than hardware GPS transponders.
- **Mock Gateway Integration:** UPI and Card payments utilize a mock authorization flow without live banking settlement.

---

<!-- PAGE 30 -->
## [PAGE 30] 6.3 Future Enhancements

1. **Enterprise Database Migration (PostgreSQL & PostGIS):** Enable sub-millisecond geofencing queries across millions of active coordinates.
2. **Live Banking Gateway Integration (Razorpay Webhooks):** HMAC-SHA256 signature verification on asynchronous webhook events.
3. **Native Driver Telemetry & WebSockets:** Real-time bidirectional WebSocket streaming replacing 3-second polling.
4. **Microservice Containerization & Kubernetes Orchestration:** Dockerized microservices orchestrated via Kubernetes with Redis clustering.
5. **AI-Assisted Kitchen Load Balancing & Dispatch Optimization:** Machine learning models (XGBoost) for predictive kitchen preparation times and courier routing.

---

<!-- PAGE 31 -->
## [PAGE 31] REFERENCES

1. Fielding, R. T., & Taylor, R. N. (2002). Principled design of the modern Web architecture. *ACM Transactions on Internet Technology (TOIT)*, 2(2), 115-150.
2. OpenStreetMap Contributors. (2026). *Overpass API: Spatial Query Language and Mirror Infrastructure*. Documentation wiki: https://wiki.openstreetmap.org/wiki/Overpass_API
3. Hipp, D. R., Kennedy, D., et al. (2025). *SQLite Write-Ahead Logging (WAL) Architecture and Concurrency Model*. SQLite Consortium Technical Documentation.
4. World Wide Web Consortium (W3C). (2023). *Web Content Accessibility Guidelines (WCAG) 2.1*. W3C Recommendation.
5. Sinnott, R. W. (1984). Virtues of the Haversine. *Sky and Telescope*, 68(2), 159.
6. Rescorla, E. (2018). *The Transport Layer Security (TLS) Protocol Version 1.3*. RFC 8446, Internet Engineering Task Force (IETF).
7. Cloudflare Inc. (2026). *Cloudflare Tunnel: Secure, Inbound-Free Application Ingress*. Cloudflare Zero Trust Documentation.
8. DeCandia, G., Hastorun, D., Jampani, M., et al. (2007). Dynamo: Amazon's highly available key-value store. *ACM SIGOPS Operating Systems Review*, 41(6), 205-220.
9. Facebook Open Source. (2026). *React 19 Architecture and Server Components Specification*. Meta Open Source Documentation.
10. Vite Core Team. (2026). *Vite: Next Generation Frontend Tooling*. Documentation: https://vitejs.dev
11. BiteBox Project Software Requirements Specification (SRS) & Verification Protocol, version 1.0.0, Department of Computer Science & Engineering, Presidency University, Bengaluru, November 2026.
