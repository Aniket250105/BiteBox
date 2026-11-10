"""
BiteBox PowerPoint Generator
Fills the Presidency University CA-3 Mini Project Template (CSE2271)
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

TEMPLATE_PATH = r"c:\Users\MAHESH\Downloads\CA-3  TEMPLATE_MINI PROJECT CSE2271 (1).pptx"
OUTPUT_DIR = r"c:\Users\MAHESH\OneDrive\Desktop\BiteBox\docs"
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "BiteBox_CA3_Mini_Project_CSE2271.pptx")
DESKTOP_PATH = r"c:\Users\MAHESH\OneDrive\Desktop\BiteBox_CA3_Mini_Project_CSE2271.pptx"

ROOT_DIR = r"c:\Users\MAHESH\OneDrive\Desktop\BiteBox"

prs = Presentation(TEMPLATE_PATH)

def clear_text_frame(tf):
    tf.text = ""

def add_header(slide, title_text):
    for shape in slide.shapes:
        if shape.has_text_frame and shape.top < Inches(1.0):
            shape.text_frame.text = title_text
            for p in shape.text_frame.paragraphs:
                p.font.bold = True
                p.font.size = Pt(22)
                p.font.color.rgb = RGBColor(0x1E, 0x1E, 0x1E)
            return shape
    return None

def get_content_shape(slide):
    for shape in slide.shapes:
        if shape.has_text_frame and shape.top >= Inches(1.0):
            return shape
    return None

# ==============================================================================
# SLIDE 1: Title Slide
# ==============================================================================
slide1 = prs.slides[0]
for shape in slide1.shapes:
    if shape.has_text_frame:
        text = shape.text_frame.text
        if "Mini Project (CSE2271)" in text:
            shape.text_frame.text = (
                "BITEBOX: HYPERLOCAL FOOD DELIVERY PLATFORM\n"
                "Mini Project (CSE2271) · Demo & Review\n"
                "November 2026"
            )
            for p in shape.text_frame.paragraphs:
                p.font.color.rgb = RGBColor(0xFF, 0x6B, 0x2C)
                p.font.bold = True
                p.alignment = PP_ALIGN.CENTER

# ==============================================================================
# SLIDE 2: Project Title & Team Details
# ==============================================================================
slide2 = prs.slides[1]
for shape in slide2.shapes:
    if shape.has_text_frame:
        txt = shape.text_frame.text
        if "PROJECT TITLE" in txt:
            shape.text_frame.text = "PROJECT TITLE: BiteBox - Hyperlocal Food Delivery & Live Tracking System"
            for p in shape.text_frame.paragraphs:
                p.font.bold = True
                p.font.size = Pt(18)
                p.font.color.rgb = RGBColor(0xFF, 0x6B, 0x2C)
        elif "TEAM NO" in txt:
            shape.text_frame.text = "TEAM NO.: 12 (CSE2271)"
            for p in shape.text_frame.paragraphs:
                p.font.bold = True
                p.font.size = Pt(14)
    elif shape.has_table:
        table = shape.table
        # Check if it's the student members table (columns == 3)
        if len(table.columns) == 3 and len(table.rows) >= 3:
            # Table 1: rows 1 to 3
            if table.cell(0, 0).text.strip() == "Sl.No":
                table.cell(1, 1).text = "Mahesh"
                table.cell(1, 2).text = "20231CSE0001"
                table.cell(2, 1).text = "Team Member 2"
                table.cell(2, 2).text = "20231CSE0002"
                table.cell(3, 1).text = "Team Member 3"
                table.cell(3, 2).text = "20231CSE0003"
                for r in table.rows:
                    for c in r.cells:
                        for p in c.text_frame.paragraphs:
                            p.font.size = Pt(12)
        elif len(table.columns) == 3 and len(table.rows) == 2:
            # Table 2: rows 4 and 5
            table.cell(0, 1).text = "Team Member 4"
            table.cell(0, 2).text = "20231CSE0004"
            table.cell(1, 1).text = "Team Member 5"
            table.cell(1, 2).text = "20231CSE0005"
            for r in table.rows:
                for c in r.cells:
                    for p in c.text_frame.paragraphs:
                        p.font.size = Pt(12)

# ==============================================================================
# SLIDE 3: Index Slide
# ==============================================================================
slide3 = prs.slides[2]
content3 = get_content_shape(slide3)
if content3:
    tf = content3.text_frame
    tf.text = ""
    index_items = [
        "1. Problem Statement & Motivation",
        "2. Four-Tier System Architecture Diagram",
        "3. Software & Hardware Specifications",
        "4. Functional Requirements (FR1 – FR10)",
        "5. Non-Functional Requirements (NFR1 – NFR7)",
        "6. System Use Case Diagram (Actors & Transactions)",
        "7. System Activity & Order Lifecycle Flowchart",
        "8. List of Core Application Modules",
        "9. User Interface Design & Screen Walkthrough (Modules 1 to 5)",
        "10. Live Demonstration & Verification Metrics (177/177 Tests Passing)"
    ]
    for item in index_items:
        p = tf.add_paragraph()
        p.text = item
        p.font.size = Pt(15)
        p.font.bold = True
        p.space_after = Pt(8)
        p.font.color.rgb = RGBColor(0x2C, 0x25, 0x23)

# ==============================================================================
# SLIDE 5: Problem Statement
# ==============================================================================
slide5 = prs.slides[4]
content5 = get_content_shape(slide5)
if content5:
    tf = content5.text_frame
    tf.text = ""
    points = [
        ("Bloatware & Heavy Resource Overhead: ", "Commercial food delivery applications feature bundle sizes exceeding 15MB, heavy CPU telemetry, battery drain, and aggressive user tracking."),
        ("Hyperlocal Campus Delivery Deficit: ", "University campuses (e.g. Presidency University, Rajanakunte) require reliable sub-3km delivery from authentic campus food stalls rather than distant warehouses."),
        ("Inventory Desynchronization & Overselling: ", "Traditional web carts allow ordering out-of-stock dishes without atomic locking, resulting in failed fulfillment and frustrating manual refunds."),
        ("Cross-Restaurant Cart Contamination: ", "Users inadvertently mixing items from disparate restaurants causes route conflicts and silent order placement failures."),
        ("Fragile Telemetry & Map Fallback Failures: ", "Most applications crash or fail completely when external tile servers or GPS APIs encounter temporary cellular packet loss."),
        ("The BiteBox Solution: ", "A high-performance progressive web app (<170kB gzipped) combining React 19 glassmorphism UI, OpenStreetMap Overpass spatial filtering (<=3km), atomic SQLite WAL transactions, and resilient multi-tier fallback.")
    ]
    for title, desc in points:
        p = tf.add_paragraph()
        run1 = p.add_run()
        run1.text = "• " + title
        run1.font.bold = True
        run1.font.size = Pt(14)
        run1.font.color.rgb = RGBColor(0xFF, 0x6B, 0x2C)
        
        run2 = p.add_run()
        run2.text = desc
        run2.font.size = Pt(13)
        run2.font.color.rgb = RGBColor(0x33, 0x33, 0x33)
        p.space_after = Pt(10)

# ==============================================================================
# SLIDE 6: Architecture Diagram
# ==============================================================================
slide6 = prs.slides[5]
content6 = get_content_shape(slide6)
if content6:
    content6.text_frame.text = "" # clear placeholder text
# Add diagram image
arch_img_path = os.path.join(ROOT_DIR, "docs", "architecture_diagram.png")
if os.path.exists(arch_img_path):
    slide6.shapes.add_picture(arch_img_path, Inches(0.89), Inches(1.15), width=Inches(11.55), height=Inches(5.6))

# ==============================================================================
# SLIDE 7: Software & Hardware Specifications
# ==============================================================================
slide7 = prs.slides[6]
content7 = get_content_shape(slide7)
if content7:
    tf = content7.text_frame
    tf.text = ""
    
    p = tf.add_paragraph()
    r = p.add_run()
    r.text = "💻 SOFTWARE SPECIFICATIONS:"
    r.font.bold = True
    r.font.size = Pt(16)
    r.font.color.rgb = RGBColor(0xFF, 0x6B, 0x2C)
    p.space_after = Pt(4)
    
    sw_specs = [
        "• Frontend Framework: React 19.2 + Vite 8.3 (High-performance ESM bundling, <170 kB gzip total)",
        "• Geospatial Engine: Leaflet 1.9 + OpenStreetMap Overpass API (Live spatial node queries)",
        "• Styling & Design System: Saffron & Ink Custom Glassmorphism UI, CSS custom properties, responsive 360px–1440px",
        "• Backend & API Gateway: Node.js v24.x + Express 5.x REST API with strict CORS origin locks",
        "• Database & Storage: SQLite 3 via better-sqlite3 with Write-Ahead Logging (WAL mode) and ACID transactions",
        "• Security & Authentication: JSON Web Tokens (JWT), Bcrypt.js password hashing (cost factor 10), input sanitization",
        "• Quality Assurance: Oxlint static analysis, automated regression test suite (177 tests), axe-core 4.8 a11y engine"
    ]
    for s in sw_specs:
        p = tf.add_paragraph()
        p.text = s
        p.font.size = Pt(13)
        p.font.color.rgb = RGBColor(0x33, 0x33, 0x33)
        p.space_after = Pt(2)
        
    p = tf.add_paragraph()
    r = p.add_run()
    r.text = "\n⚙️ HARDWARE & DEPLOYMENT SPECIFICATIONS:"
    r.font.bold = True
    r.font.size = Pt(16)
    r.font.color.rgb = RGBColor(0xFF, 0x6B, 0x2C)
    p.space_after = Pt(4)
    
    hw_specs = [
        "• Development Machine: Intel Core i3/i5/i7 or AMD Ryzen, 4GB+ RAM, 500MB free disk space",
        "• Client Testing Devices: Any modern mobile device (Android/iOS) or desktop browser (Edge, Chrome, Safari)",
        "• Public Tunnel & Network: Cloudflare Tunnel edge connectivity, supporting Wi-Fi, 4G, and 5G cellular networks"
    ]
    for h in hw_specs:
        p = tf.add_paragraph()
        p.text = h
        p.font.size = Pt(13)
        p.font.color.rgb = RGBColor(0x33, 0x33, 0x33)
        p.space_after = Pt(2)

# ==============================================================================
# SLIDE 8: 8–10 Functional Requirements
# ==============================================================================
slide8 = prs.slides[7]
content8 = get_content_shape(slide8)
if content8:
    tf = content8.text_frame
    tf.text = ""
    fr_list = [
        ("FR1 · User Authentication & Geolocation Hubs: ", "Secure registration/login with bcrypt; GPS detection or selection from 4 preset Bengaluru campus hubs."),
        ("FR2 · Hyperlocal Spatial Discovery: ", "Queries OpenStreetMap Overpass for places within exactly 3.0km (Haversine formula), sorted nearest first."),
        ("FR3 · Categorized Menu Browsing: ", "Dishes categorized into Starters, Mains, Breads, Desserts & Drinks with real-time stock and pure-veg tags."),
        ("FR4 · Cart Management & Stock Isolation: ", "Multi-item carts with quantity modification, single-restaurant enforcement, and sold-out item blocking."),
        ("FR5 · Server-Authoritative Price Quoting: ", "Strict server calculation (Item Total + 5% GST + ₹40 Delivery - Discount); zero client price tampering."),
        ("FR6 · Dynamic Coupon Engine: ", "Promo validation for WELCOME50, FESTIVE20, and BITE100 with minimum order thresholds and arithmetic capping."),
        ("FR7 · Multi-Modal Atomic Checkout: ", "Instant checkout via UPI, Card, or Cash on Delivery with atomic stock deduction and double-submit guards."),
        ("FR8 · Restaurant Decision Engine: ", "Dedicated partner portal for kitchens to Accept (confirmed) or Reject (auto-refunded with stock restore)."),
        ("FR9 · Delivery Partner Assignment: ", "Automated rider allocation (Ramesh Kumar, Ather 450X) with 5-stage progression timestamps."),
        ("FR10 · Real-Time Interactive Route Telemetry: ", "Animated scooter marker along actual road waypoints with dynamic heading rotation and ETA countdown.")
    ]
    for tag, desc in fr_list:
        p = tf.add_paragraph()
        r1 = p.add_run()
        r1.text = tag
        r1.font.bold = True
        r1.font.size = Pt(13)
        r1.font.color.rgb = RGBColor(0xFF, 0x6B, 0x2C)
        
        r2 = p.add_run()
        r2.text = desc
        r2.font.size = Pt(12)
        r2.font.color.rgb = RGBColor(0x33, 0x33, 0x33)
        p.space_after = Pt(4)

# ==============================================================================
# SLIDE 9: 5–7 Non-Functional Requirements
# ==============================================================================
slide9 = prs.slides[8]
content9 = get_content_shape(slide9)
if content9:
    tf = content9.text_frame
    tf.text = ""
    nfr_list = [
        ("NFR1 · Performance & Latency: ", "Sub-3ms SQLite query latency; cold live Overpass search in 1.48s (<=3s budget); first list rows render in 104ms; bundle size <170kB gzip."),
        ("NFR2 · Security & Data Protection: ", "Zero sensitive payment storage (no CVV/Card retention); JWT session tokens; bcrypt hashing (cost 10); parameterized SQL statements."),
        ("NFR3 · Usability & Accessibility: ", "Streamlined 5-screen, 5-tap order completion; WCAG 2.1 AA certified via axe-core 4.8 (~96% compliance); touch targets >= 44x44px; keyboard slide-to-pay."),
        ("NFR4 · ACID Transactional Concurrency: ", "Strict atomic stock deduction; verified with 10 concurrent requests on stock=3 resulting in exactly 3 successes and 0 overselling."),
        ("NFR5 · Scalability & Sustained Load: ", "Sustained 50 concurrent virtual users for 60 seconds processing 44,619 requests at 742.8 req/sec with 0.00% error rate."),
        ("NFR6 · Fault Tolerance & Network Resilience: ", "Multi-tier cache cascade (Cache → Snapshot → Seeded); client auto-recovers after 20s network outage without reload; map tile error fallback."),
        ("NFR7 · Maintainability & Code Quality: ", "177/177 passing automated unit and integration tests (100% pass rate); clean ESM modules; verified fresh clone bootstrap.")
    ]
    for tag, desc in nfr_list:
        p = tf.add_paragraph()
        r1 = p.add_run()
        r1.text = tag
        r1.font.bold = True
        r1.font.size = Pt(13)
        r1.font.color.rgb = RGBColor(0xFF, 0x6B, 0x2C)
        
        r2 = p.add_run()
        r2.text = desc
        r2.font.size = Pt(12)
        r2.font.color.rgb = RGBColor(0x33, 0x33, 0x33)
        p.space_after = Pt(6)

# ==============================================================================
# SLIDE 10: Usecase Diagram
# ==============================================================================
slide10 = prs.slides[9]
content10 = get_content_shape(slide10)
if content10:
    content10.text_frame.text = ""
usecase_img_path = os.path.join(ROOT_DIR, "docs", "usecase_diagram.png")
if os.path.exists(usecase_img_path):
    slide10.shapes.add_picture(usecase_img_path, Inches(0.89), Inches(1.15), width=Inches(11.55), height=Inches(5.6))

# ==============================================================================
# SLIDE 11: Activity Diagram
# ==============================================================================
slide11 = prs.slides[10]
content11 = get_content_shape(slide11)
if content11:
    content11.text_frame.text = ""
activity_img_path = os.path.join(ROOT_DIR, "docs", "activity_diagram.png")
if os.path.exists(activity_img_path):
    slide11.shapes.add_picture(activity_img_path, Inches(0.89), Inches(1.15), width=Inches(11.55), height=Inches(5.6))

# ==============================================================================
# SLIDE 12: List of Modules
# ==============================================================================
slide12 = prs.slides[11]
content12 = get_content_shape(slide12)
if content12:
    tf = content12.text_frame
    tf.text = ""
    modules = [
        ("Module 1 · Customer Authentication & Geolocation Hub Engine:", "Handles user registration, bcrypt credential encryption, JWT session issuance, and user delivery coordinates via GPS or preset campus hubs (Presidency University, Indiranagar, Koramangala, MG Road)."),
        ("Module 2 · Hyperlocal Restaurant Catalog & OSM Spatial Service:", "Integrates OpenStreetMap Overpass API with bounding-box queries, computing Haversine distances to enforce <=3.0km radius, with a 4-tier cache cascade ensuring 100% uptime."),
        ("Module 3 · Menu Browsing, Dietary Filtering & Inventory Control:", "Provides categorized dish browsing (Starters, Mains, Breads, Desserts, Beverages), pure-veg toggles, and live inventory validation preventing addition of sold-out items."),
        ("Module 4 · Server Quoting, Coupon Engine & Slide-to-Pay Checkout:", "Enforces zero-trust server bill calculation (Item Total + 5% GST + ₹40 Delivery - Discount), promo validation, and mobile slide-to-pay interaction supporting UPI, Card, and COD."),
        ("Module 5 · Real-Time Order Lifecycle & Live Interactive Map Telemetry:", "Features dual perspectives: live customer tracking with animated scooter markers along real waypoints + dedicated Kitchen Partner Portal for instant order acceptance/rejection.")
    ]
    for title, desc in modules:
        p = tf.add_paragraph()
        r1 = p.add_run()
        r1.text = title + " "
        r1.font.bold = True
        r1.font.size = Pt(13)
        r1.font.color.rgb = RGBColor(0xFF, 0x6B, 0x2C)
        
        r2 = p.add_run()
        r2.text = desc
        r2.font.size = Pt(12)
        r2.font.color.rgb = RGBColor(0x33, 0x33, 0x33)
        p.space_after = Pt(8)

# ==============================================================================
# SLIDES 13 to 17: UI Screens (Modules 1 to 5)
# ==============================================================================
screens_data = [
    {
        "slide_idx": 12, # Slide 13
        "title": "Design 4–5 UI Screens · Module 1: Auth & Geolocation Hub",
        "img": "screen_login_360px_light.png",
        "badge": "Module 1 Output Screenshot",
        "bullets": [
            "• Clean, instant demo login supporting customer & evaluator accounts.",
            "• Geolocation detection with fallback to 4 Bangalore campus hubs.",
            "• Persists delivery address in session and header badge.",
            "• Verified: Survives refresh and invalidates gracefully on token expiry."
        ]
    },
    {
        "slide_idx": 13, # Slide 14
        "title": "Design 4–5 UI Screens · Module 2: Hyperlocal Discovery",
        "img": "screen_discover_360px_light.png",
        "badge": "Module 2 Output Screenshot",
        "bullets": [
            "• Dynamic Leaflet OpenStreetMap with customer and restaurant pins.",
            "• Haversine distance badge (<3.0km radius) and delivery time estimates.",
            "• Quick filter chips: 'Open now', 'Pure veg', 'Under 30 min', 'Rating 4.0+'.",
            "• Verified: Cold live OSM queries average 1.48s; first rows render in 104ms."
        ]
    },
    {
        "slide_idx": 14, # Slide 15
        "title": "Design 4–5 UI Screens · Module 3: Menu & Inventory",
        "img": "screen_menu_360px_light.png",
        "badge": "Module 3 Output Screenshot",
        "bullets": [
            "• Categorized tab navigation (Starters, Mains, Breads, Desserts, Drinks).",
            "• Pure-veg dietary badges and authentic regional item descriptions.",
            "• Sold-out items disabled with non-clickable badge; cannot be added to cart.",
            "• Persistent floating cart pill syncing real-time item count and subtotal."
        ]
    },
    {
        "slide_idx": 15, # Slide 16
        "title": "Design 4–5 UI Screens · Module 4: Cart & Slide-to-Pay",
        "img": "screen_payment_360px_light.png",
        "badge": "Module 4 Output Screenshot",
        "bullets": [
            "• Detailed receipt breakdown: Item total + 5% GST + ₹40 Delivery - Discount.",
            "• Interactive coupon validation with inline error feedback (WELCOME50).",
            "• Saffron & ink glassmorphism payment card with UPI apps, Card, and COD tabs.",
            "• Accessible Slide-to-Pay interaction operable via touch or Space/Enter keys."
        ]
    },
    {
        "slide_idx": 16, # Slide 17
        "title": "Design 4–5 UI Screens · Module 5: Live Order Tracking",
        "img": "screen_tracking_360px_light.png",
        "badge": "Module 5 Output Screenshot",
        "bullets": [
            "• Live Leaflet map tracing planned route (dashed) and completed path (solid).",
            "• Dynamic scooter marker with bearing rotation following road geometry.",
            "• Assigned delivery partner card (Ramesh Kumar, Ather 450X, rating 4.9).",
            "• Automatic status stepper: Confirmed → Cooking → Picked up → En Route → Delivered."
        ]
    }
]

for sdata in screens_data:
    slide = prs.slides[sdata["slide_idx"]]
    add_header(slide, sdata["title"])
    content = get_content_shape(slide)
    if content:
        content.text_frame.text = "" # clear placeholder
        
    img_path = os.path.join(ROOT_DIR, "docs", "verification-screenshots", sdata["img"])
    if os.path.exists(img_path):
        # Add screenshot on left
        slide.shapes.add_picture(img_path, Inches(0.89), Inches(1.15), width=Inches(3.3), height=Inches(5.7))
        
    # Add text box on right
    tx_box = slide.shapes.add_textbox(Inches(4.6), Inches(1.4), Inches(7.8), Inches(5.2))
    tf = tx_box.text_frame
    tf.word_wrap = True
    
    p = tf.add_paragraph()
    r = p.add_run()
    r.text = "🎯 " + sdata["badge"] + "\n"
    r.font.bold = True
    r.font.size = Pt(16)
    r.font.color.rgb = RGBColor(0xFF, 0x6B, 0x2C)
    p.space_after = Pt(12)
    
    for bullet in sdata["bullets"]:
        p = tf.add_paragraph()
        p.text = bullet
        p.font.size = Pt(14)
        p.font.color.rgb = RGBColor(0x2C, 0x25, 0x23)
        p.space_after = Pt(10)

# ==============================================================================
# SLIDE 18: DEMO Slide
# ==============================================================================
slide18 = prs.slides[17]
add_header(slide18, "Live System Demonstration & Empirical Verification")
content18 = get_content_shape(slide18)
if content18:
    tf = content18.text_frame
    tf.text = ""
    
    demo_lines = [
        ("🔗 Live Public HTTPS Tunnel:", "https://powered-specialists-finals-reg.trycloudflare.com"),
        ("🍳 Restaurant Partner Portal:", "https://powered-specialists-finals-reg.trycloudflare.com/?view=restaurant"),
        ("⚡ High-Speed Local Dev:", "Frontend: http://localhost:5173  |  Backend API: http://localhost:3001"),
        ("\n📊 Empirical System Verification Summary:", ""),
        ("• Automated Regression Suite: ", "177 / 177 unit and integration tests passing (100% pass rate)."),
        ("• System Verification Matrix: ", "76 / 76 requirements verified (44 FR, 29 NFR, 3 Cross-checks)."),
        ("• Sustained Load Test: ", "44,619 requests at 742.8 req/sec under 50 concurrent virtual users with 0.00% error rate."),
        ("• Zero Overselling Guarantee: ", "ACID transactions with atomic stock deduction and double-submit guards."),
        ("• High-Resilience Telemetry: ", "4-tier fallback with 20s network outage recovery without manual page reload.")
    ]
    
    for tag, val in demo_lines:
        p = tf.add_paragraph()
        if val:
            r1 = p.add_run()
            r1.text = tag + " "
            r1.font.bold = True
            r1.font.size = Pt(14)
            r1.font.color.rgb = RGBColor(0xFF, 0x6B, 0x2C)
            
            r2 = p.add_run()
            r2.text = val
            r2.font.size = Pt(13)
            r2.font.color.rgb = RGBColor(0x02, 0x77, 0xBD) if "http" in val else RGBColor(0x33, 0x33, 0x33)
        else:
            r = p.add_run()
            r.text = tag
            r.font.bold = True
            r.font.size = Pt(15)
            r.font.color.rgb = RGBColor(0x2C, 0x25, 0x23)
        p.space_after = Pt(6)

# Save presentations
prs.save(OUTPUT_PATH)
prs.save(DESKTOP_PATH)
print(f"[SUCCESS] Created presentation at:\n  1. {OUTPUT_PATH}\n  2. {DESKTOP_PATH}")
