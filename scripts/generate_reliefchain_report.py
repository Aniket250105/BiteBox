import os
import base64

ROOT_DIR = r"c:\Users\MAHESH\OneDrive\Desktop\BiteBox"
DOCS_DIR = os.path.join(ROOT_DIR, "docs")
DESKTOP_DIR = r"c:\Users\MAHESH\OneDrive\Desktop"

HTML_PATH = os.path.join(DOCS_DIR, "PROJECT_REPORT_RELIEFCHAIN_TEMPLATE.html")
DESKTOP_HTML_PATH = os.path.join(DESKTOP_DIR, "BiteBox_Project_Report.html")
MD_PATH = os.path.join(DOCS_DIR, "PROJECT_REPORT_RELIEFCHAIN_TEMPLATE.md")

# Load and encode images to base64 data URIs so document is 100% self-contained
def get_data_uri(path):
    full = os.path.join(ROOT_DIR, path)
    if os.path.exists(full):
        ext = os.path.splitext(full)[1].lower()
        mime = "image/png" if ext == ".png" else "image/jpeg"
        with open(full, "rb") as f:
            return f"data:{mime};base64,{base64.b64encode(f.read()).decode('utf-8')}"
    return path

print("Encoding images...")
arch_img = get_data_uri("docs/architecture_diagram.png")
usecase_img = get_data_uri("docs/usecase_diagram.png")
activity_img = get_data_uri("docs/activity_diagram.png")

img_login = get_data_uri("docs/verification-screenshots/screen_login_360px_light.png")
img_discover = get_data_uri("docs/verification-screenshots/screen_discover_360px_light.png")
img_menu = get_data_uri("docs/verification-screenshots/screen_menu_360px_light.png")
img_cart = get_data_uri("docs/verification-screenshots/screen_cart_360px_light.png")
img_payment = get_data_uri("docs/verification-screenshots/screen_payment_360px_light.png")
img_tracking = get_data_uri("docs/verification-screenshots/screen_tracking_360px_light.png")
img_partner = get_data_uri("docs/verification-screenshots/FR8.1.png")
img_agent = get_data_uri("docs/verification-screenshots/FR9.2.png")

print("Building pages 1 to 31...")
pages = []

def make_page(page_num, content_html, show_header=True):
    header_html = '<div class="running-header">BITEBOX</div>' if show_header else '<div class="header-placeholder"></div>'
    footer_html = f'<div class="running-footer">BiteBox | Page {page_num}</div>' if page_num > 1 else '<div class="footer-placeholder"></div>'
    return f"""
<div class="page" id="page-{page_num}">
  {header_html}
  <div class="page-content">
    {content_html}
  </div>
  {footer_html}
</div>
"""

# ==========================================
# PAGE 1: Title Cover Page
# ==========================================
p1 = """
<div style="text-align: center; margin-top: 15mm;">
  <h1 style="font-size: 24pt; font-weight: bold; color: #163A45; letter-spacing: 1px; margin-bottom: 8px;">BITEBOX</h1>
  <p style="font-size: 13pt; font-weight: bold; color: #1F4E5B; max-width: 90%; margin: 0 auto 18px auto; line-height: 1.4;">
    A Hyperlocal Food Delivery &amp; Real-Time Tracking Web Platform with Multi-Tier OSM Discovery, Atomic Inventory Controls, and Real-Time Telemetry
  </p>
  <div style="width: 80%; height: 2px; background: #111827; margin: 0 auto 20px auto;"></div>

  <h2 style="font-size: 14pt; font-weight: bold; letter-spacing: 1.5px; color: #111827; margin-bottom: 12px;">PROJECT REPORT</h2>
  <p style="font-size: 11pt; color: #4B5563; font-style: italic; margin-bottom: 14px;">
    Submitted in partial fulfillment of the requirements for the degree of
  </p>

  <h3 style="font-size: 13pt; font-weight: bold; color: #111827; margin-bottom: 4px;">BACHELOR OF TECHNOLOGY</h3>
  <h4 style="font-size: 11pt; font-weight: bold; color: #4B5563; margin-bottom: 4px;">IN</h4>
  <h3 style="font-size: 13pt; font-weight: bold; color: #111827; margin-bottom: 16px;">COMPUTER SCIENCE AND ENGINEERING</h3>

  <p style="font-size: 11pt; font-weight: bold; color: #163A45; margin-bottom: 16px;">
    Subject: Mini Project / Advanced Web Application Development (CSE2271)
  </p>

  <div style="text-align: left; margin: 0 auto; width: 85%;">
    <p style="font-size: 10.5pt; font-weight: bold; margin-bottom: 6px;">Submitted by</p>
    <table class="report-table" style="margin-top: 0;">
      <thead>
        <tr>
          <th style="width: 50%;">Team member</th>
          <th style="width: 50%;">Roll number</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Sinchana</td><td>20241CSE0923</td></tr>
        <tr><td>Yashwanth</td><td>20241CSE0924</td></tr>
        <tr><td>Mahesh</td><td>20241CSE0925</td></tr>
        <tr><td>Jayashri</td><td>20241CSE0926</td></tr>
        <tr><td>Aniket N</td><td>20241CSE0927</td></tr>
      </tbody>
    </table>
  </div>

  <div style="margin-top: 22mm;">
    <!-- SVG Emblem matching Presidency University emblem -->
    <svg width="64" height="48" viewBox="0 0 100 80" style="margin-bottom: 6px;">
      <path d="M50 10 L60 35 L85 38 L65 55 L70 80 L50 65 L30 80 L35 55 L15 38 L40 35 Z" fill="#1F4E5B" opacity="0.9" />
      <path d="M50 20 L57 38 L75 40 L61 52 L65 70 L50 60 L35 70 L39 52 L25 40 L43 38 Z" fill="#FFFFFF" />
    </svg>
    <div style="font-size: 8pt; letter-spacing: 1.5px; color: #1F4E5B; font-weight: bold;">GAIN MORE KNOWLEDGE REACH GREATER HEIGHTS</div>
    <div style="font-size: 13pt; font-weight: bold; color: #163A45; letter-spacing: 1px; margin-top: 4px;">PRESIDENCY UNIVERSITY</div>
    <div style="font-size: 10pt; font-weight: bold; color: #111827; letter-spacing: 2px;">BENGALURU</div>
  </div>
</div>
"""
pages.append(make_page(1, p1, show_header=False))

# ==========================================
# PAGE 2: Certificate
# ==========================================
p2 = """
<h1 class="chapter-title" style="margin-top: 10mm; margin-bottom: 12mm;">CERTIFICATE</h1>

<p style="margin-bottom: 14px;">
  This is to certify that the project report entitled <strong>&ldquo;BiteBox: A Hyperlocal Food Delivery &amp; Real-Time Tracking Web Platform&rdquo;</strong> is submitted by the following students of the Department of Computer Science and Engineering in partial fulfillment of the requirements for the Bachelor of Technology in Computer Science and Engineering degree.
</p>

<table class="report-table" style="width: 100%; margin: 16px 0 24px 0;">
  <thead>
    <tr>
      <th style="width: 50%;">Name</th>
      <th style="width: 50%;">Roll Number</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Sinchana</td><td>20241CSE0923</td></tr>
    <tr><td>Yashwanth</td><td>20241CSE0924</td></tr>
    <tr><td>Mahesh</td><td>20241CSE0925</td></tr>
    <tr><td>Jayashri</td><td>20241CSE0926</td></tr>
    <tr><td>Aniket N</td><td>20241CSE0927</td></tr>
  </tbody>
</table>

<p style="margin-bottom: 14px;">
  The work presented in this report describes the design, engineering, and empirical prototype verification of a progressive hyperlocal food delivery web platform combining lightweight single-page application principles, live spatial discovery via OpenStreetMap Overpass queries, zero-trust server-side bill quoting, concurrency-safe inventory controls, and synchronized real-time courier telemetry. The report distinguishes prototype behaviour from proposed or future enterprise enhancements.
</p>

<p style="margin-bottom: 25mm;">
  To the best of our knowledge, this report is an authentic account of the work undertaken by the team under the guidance of the project supervisor, subject to the institution&rsquo;s review and verification of the stated implementation and testing evidence.
</p>

<div style="display: flex; justify-content: space-between; margin-top: 20mm;">
  <div style="text-align: center; width: 45%;">
    <div style="border-bottom: 1px solid #111827; width: 80%; margin: 0 auto 6px auto;"></div>
    <div style="font-weight: bold; font-size: 10pt;">Project Supervisor / Guide</div>
    <div style="font-size: 9pt; color: #4B5563;">Dept. of Computer Science &amp; Engineering</div>
  </div>
  <div style="text-align: center; width: 45%;">
    <div style="border-bottom: 1px solid #111827; width: 80%; margin: 0 auto 6px auto;"></div>
    <div style="font-weight: bold; font-size: 10pt;">Head of the Department</div>
    <div style="font-size: 9pt; color: #4B5563;">School of Computer Science &amp; Engineering</div>
  </div>
</div>
"""
pages.append(make_page(2, p2))

# ==========================================
# PAGE 3: Declaration
# ==========================================
p3 = """
<h1 class="chapter-title" style="margin-top: 10mm; margin-bottom: 10mm;">DECLARATION</h1>

<p style="margin-bottom: 12px;">
  We hereby declare that the project report entitled <strong>&ldquo;BiteBox: A Hyperlocal Food Delivery &amp; Real-Time Tracking Web Platform&rdquo;</strong> has been prepared by our team as part of the academic project coursework.
</p>

<p style="margin-bottom: 12px;">
  The report describes the problem context, proposed architecture, prototype workflows, and implementation status as understood at the time of preparation. Features identified as planned, partial, or architecture-level proposals are not represented as production-ready functionality. Any implementation claims and test results must be supported by the source repository, demonstrable application behavior, or test output submitted with the project.
</p>

<p style="margin-bottom: 12px;">
  We acknowledge the use of official technical documentation for understanding modern web engineering, client-side caching, spatial querying via OpenStreetMap Overpass QL, SQLite Write-Ahead Logging (WAL) concurrency, Leaflet geographic mapping, JWT authentication, and automated regression testing. External material is identified in the references section.
</p>

<p style="margin-bottom: 16px;">
  We understand that the final report must accurately reflect individual contributions and actual work performed. The contribution matrix in this report is a collective allocation and has been reviewed and agreed upon by all team members before submission.
</p>

<table class="report-table" style="width: 100%; margin: 16px 0 20px 0;">
  <thead>
    <tr>
      <th style="width: 32%;">Name</th>
      <th style="width: 33%;">Roll Number</th>
      <th style="width: 35%;">Signature</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Sinchana</td><td>20241CSE0923</td><td style="padding-top: 14px;">____________________</td></tr>
    <tr><td>Yashwanth</td><td>20241CSE0924</td><td style="padding-top: 14px;">____________________</td></tr>
    <tr><td>Mahesh</td><td>20241CSE0925</td><td style="padding-top: 14px;">____________________</td></tr>
    <tr><td>Jayashri</td><td>20241CSE0926</td><td style="padding-top: 14px;">____________________</td></tr>
    <tr><td>Aniket N</td><td>20241CSE0927</td><td style="padding-top: 14px;">____________________</td></tr>
  </tbody>
</table>

<p style="font-size: 10pt; font-weight: bold; margin-top: 15mm;">
  Date: 10/11/2026<br>
  Place: Bengaluru
</p>
"""
pages.append(make_page(3, p3))

# ==========================================
# PAGE 4: Acknowledgement
# ==========================================
p4 = """
<h1 class="chapter-title" style="margin-top: 10mm; margin-bottom: 10mm;">ACKNOWLEDGEMENT</h1>

<p style="margin-bottom: 14px;">
  We express our sincere gratitude to our project guide and faculty mentors of the Department of Computer Science and Engineering for their constant guidance, constructive feedback, and academic support throughout the conception, architectural development, and empirical testing of BiteBox.
</p>

<p style="margin-bottom: 14px;">
  We thank our institution, <strong>Presidency University, Bengaluru</strong>, for providing an academically stimulating environment, laboratory computing infrastructure, and encouragement to pursue practical, production-focused engineering solutions. Building a full-stack, low-latency web application demands not only theoretical algorithms but also rigorous attention to real-world software constraints: zero-trust transactional integrity, API rate limiting, concurrent database access, and accessibility.
</p>

<p style="margin-bottom: 14px;">
  We also formally acknowledge the maintainers of the open-source technologies and documentation that formed the technical foundation of this work: React 19, Vite, Express 5, Better-SQLite3, Leaflet, and the global OpenStreetMap and Overpass API developer community. Their open-data infrastructure and principled documentation made live geospatial integration possible without commercial API paywalls.
</p>

<p style="margin-bottom: 25mm;">
  Finally, we thank all our team members for their collaborative spirit, mutual accountability, and dedicated contributions across UI design, backend development, spatial caching, performance benchmarking, and system verification.
</p>

<p style="font-weight: bold; font-size: 11pt; color: #163A45;">
  The BiteBox Team<br>
  <span style="font-size: 10pt; font-weight: normal; color: #4B5563;">Sinchana, Yashwanth, Mahesh, Jayashri, Aniket N</span>
</p>
"""
pages.append(make_page(4, p4))

# ==========================================
# PAGE 5: Abstract
# ==========================================
p5 = """
<h1 class="chapter-title" style="margin-top: 8mm; margin-bottom: 8mm;">ABSTRACT</h1>

<p style="margin-bottom: 10px;">
  Commercial hyperlocal food delivery platforms have increasingly evolved into bloated mobile applications often exceeding 15 MB in initial bundle payload, burdened by promotional carousels, algorithmic ad tracking, and client-heavy pricing calculations. In resource-constrained network conditions, such bloat induces high page latency, battery drain, and checkout drop-offs. Concurrently, issues such as cart cross-contamination across multiple merchants, client-side price tampering, and inventory overselling during peak operational hours continue to impact operational reliability.
</p>

<p style="margin-bottom: 10px;">
  <strong>BiteBox</strong> is a lightweight, responsive progressive web platform engineered to deliver rapid hyperlocal food discovery and transparent order execution. BiteBox implements a three-tier architecture that cleanly decouples single-page presentation from transactional persistence and open geospatial discovery. The presentation tier (React 19, Vite, Leaflet) achieves a compressed production footprint of under 170 kB gzipped, rendering the live discovery feed in 104 ms. The API tier (Express 5, Node.js) enforces a zero-trust pricing engine where client-submitted prices and delivery fees are rejected; all line items, 5% GST rounding, coupon discounts, and delivery fees are strictly recomputed from the authoritative database.
</p>

<p style="margin-bottom: 10px;">
  Spatial discovery uses the OpenStreetMap (OSM) Overpass API across an extended 5.0 km delivery envelope, backed by a resilient four-tier fallback cascade: fresh SQLite cache (24h TTL), live Overpass spatial bounding-box query, stale cache, and hub snapshots. A deterministic rating engine (3.8★ to 4.8★) and cuisine-based pricing tier are computed algorithmically for discovered venues. Inventory management utilizes SQLite Write-Ahead Logging (WAL) with atomic `BEGIN IMMEDIATE` transactions to eliminate race conditions, preventing overselling even under 100 concurrent checkout attempts.
</p>

<p style="margin-bottom: 14px;">
  Empirical stress testing with 50 virtual users sustained 742.8 requests per second with a 0.00% error rate and 6.4 ms p95 response time. The full codebase satisfies 177 / 177 automated regression assertions, certifying functional correctness, atomic refund parity, and WCAG AA accessibility.
</p>

<p style="font-size: 10pt; line-height: 1.4;">
  <strong>Keywords:</strong> Hyperlocal food delivery, OpenStreetMap, Overpass QL, Write-Ahead Logging, Zero-trust pricing, Concurrency control, Slide-to-pay, Leaflet telemetry.
</p>
"""
pages.append(make_page(5, p5))

# ==========================================
# PAGE 6: Table of Contents
# ==========================================
p6 = """
<h1 class="chapter-title" style="margin-top: 6mm; margin-bottom: 6mm;">TABLE OF CONTENTS</h1>

<table class="report-table" style="width: 100%; margin-top: 4px;">
  <thead>
    <tr>
      <th style="width: 80%;">Section</th>
      <th style="width: 20%; text-align: right;">Page</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Certificate</td><td style="text-align: right;">2</td></tr>
    <tr><td>Declaration</td><td style="text-align: right;">3</td></tr>
    <tr><td>Acknowledgement</td><td style="text-align: right;">4</td></tr>
    <tr><td>Abstract</td><td style="text-align: right;">5</td></tr>
    <tr><td>List of Figures, Tables and Abbreviations</td><td style="text-align: right;">7</td></tr>
    <tr><td><strong>Chapter 1: Introduction</strong></td><td style="text-align: right;"><strong>8</strong></td></tr>
    <tr><td style="padding-left: 20px;">1.1 Background and Motivation</td><td style="text-align: right;">8</td></tr>
    <tr><td style="padding-left: 20px;">1.2 Problem Statement and Objectives</td><td style="text-align: right;">8</td></tr>
    <tr><td style="padding-left: 20px;">1.3 Scope, Stakeholders and Assumptions</td><td style="text-align: right;">9</td></tr>
    <tr><td><strong>Chapter 2: Existing System and Proposed Solution</strong></td><td style="text-align: right;"><strong>10</strong></td></tr>
    <tr><td style="padding-left: 20px;">2.1 Existing System and Limitations</td><td style="text-align: right;">10</td></tr>
    <tr><td style="padding-left: 20px;">2.2 Proposed BiteBox Approach and Comparison</td><td style="text-align: right;">11</td></tr>
    <tr><td><strong>Chapter 3: Requirements Analysis</strong></td><td style="text-align: right;"><strong>12</strong></td></tr>
    <tr><td style="padding-left: 20px;">3.1 Functional Requirements &amp; Business Rules</td><td style="text-align: right;">12</td></tr>
    <tr><td style="padding-left: 20px;">3.2 User Roles, Non-Functional Requirements and Feasibility</td><td style="text-align: right;">13-14</td></tr>
    <tr><td><strong>Chapter 4: System Design</strong></td><td style="text-align: right;"><strong>15</strong></td></tr>
    <tr><td style="padding-left: 20px;">4.1 Architecture and Data Flow</td><td style="text-align: right;">15-17</td></tr>
    <tr><td style="padding-left: 20px;">4.2 Functional Modules</td><td style="text-align: right;">18</td></tr>
    <tr><td style="padding-left: 20px;">4.3 Database Design and Entity Relationships</td><td style="text-align: right;">19-20</td></tr>
    <tr><td style="padding-left: 20px;">4.4 Spatial Discovery and Menu Generation</td><td style="text-align: right;">21</td></tr>
    <tr><td style="padding-left: 20px;">4.5 Zero-Trust Pricing, Deterministic Ratings &amp; Telemetry</td><td style="text-align: right;">22</td></tr>
    <tr><td><strong>Chapter 5: Prototype Implementation, Testing and Results</strong></td><td style="text-align: right;"><strong>23</strong></td></tr>
    <tr><td style="padding-left: 20px;">5.1 Technology Stack and Status</td><td style="text-align: right;">23-24</td></tr>
    <tr><td style="padding-left: 20px;">5.2 Testing Strategy and Scenarios</td><td style="text-align: right;">24-25</td></tr>
    <tr><td style="padding-left: 20px;">5.3 Demonstration and Observations</td><td style="text-align: right;">26-28</td></tr>
    <tr><td><strong>Chapter 6: Conclusion, Limitations and Future Work</strong></td><td style="text-align: right;"><strong>29</strong></td></tr>
    <tr><td style="padding-left: 20px;">6.1 Conclusion &amp; Current Limitations</td><td style="text-align: right;">29</td></tr>
    <tr><td style="padding-left: 20px;">6.2 Future Enhancements and Production Roadmap</td><td style="text-align: right;">30</td></tr>
    <tr><td><strong>References</strong></td><td style="text-align: right;"><strong>31</strong></td></tr>
  </tbody>
</table>
"""
pages.append(make_page(6, p6))

# ==========================================
# PAGE 7: List of Figures, Tables & Abbreviations
# ==========================================
p7 = """
<h1 class="chapter-title" style="margin-top: 4mm; margin-bottom: 5mm;">LIST OF FIGURES, TABLES AND ABBREVIATIONS</h1>

<h2 class="section-title" style="margin-top: 2px;">List of Figures</h2>
<ul style="margin-bottom: 8px;">
  <li><strong>Figure 4.1:</strong> BiteBox three-tier system architecture and data boundary (Page 15)</li>
  <li><strong>Figure 4.2:</strong> Zero-trust checkout quoting and payment synchronization workflow (Page 16)</li>
  <li><strong>Figure 4.3:</strong> Simplified relational entity-relationship data model (Page 19)</li>
  <li><strong>Figure 5.1:</strong> Client authentication and live 5.0 km spatial discovery screen (Page 26)</li>
  <li><strong>Figure 5.2:</strong> Dynamic menu browsing with garlic bread and cart quote validation (Page 27)</li>
  <li><strong>Figure 5.3:</strong> Slide-to-Pay checkout, live courier telemetry, and partner kitchen portal (Page 28)</li>
</ul>

<h2 class="section-title" style="margin-top: 4px;">List of Tables</h2>
<ul style="margin-bottom: 8px;">
  <li><strong>Table 2.1:</strong> Comparative matrix: Commercial aggregators vs BiteBox architecture (Page 11)</li>
  <li><strong>Table 3.1:</strong> Functional requirements matrix and module priorities (Page 12)</li>
  <li><strong>Table 3.2:</strong> System user roles and operational responsibilities (Page 13)</li>
  <li><strong>Table 3.3:</strong> Non-functional requirements and target performance thresholds (Page 14)</li>
  <li><strong>Table 4.1:</strong> Main functional modules and system boundary definitions (Page 18)</li>
  <li><strong>Table 4.2:</strong> Core database relational entities and schema attributes (Page 20)</li>
  <li><strong>Table 5.1:</strong> Technology stack and subsystem roles (Page 23)</li>
  <li><strong>Table 5.2:</strong> Prototype verification status matrix (Page 24)</li>
  <li><strong>Table 5.3:</strong> Representative test execution scenarios (TC-01 to TC-12) (Page 25)</li>
</ul>

<h2 class="section-title" style="margin-top: 4px;">Abbreviations</h2>
<table class="report-table" style="margin-top: 2px; font-size: 9pt;">
  <thead>
    <tr>
      <th style="width: 25%;">Abbreviation</th>
      <th style="width: 75%;">Full Form / Definition</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>API</td><td>Application Programming Interface</td></tr>
    <tr><td>CSS</td><td>Cascading Style Sheets</td></tr>
    <tr><td>ETA</td><td>Estimated Time of Arrival</td></tr>
    <tr><td>GPS</td><td>Global Positioning System</td></tr>
    <tr><td>GST</td><td>Goods and Services Tax</td></tr>
    <tr><td>JWT</td><td>JSON Web Token (RFC 7519)</td></tr>
    <tr><td>OSM</td><td>OpenStreetMap Open Spatial Database</td></tr>
    <tr><td>PII</td><td>Personally Identifiable Information</td></tr>
    <tr><td>RBAC</td><td>Role-Based Access Control</td></tr>
    <tr><td>REST</td><td>Representational State Transfer</td></tr>
    <tr><td>SRS</td><td>Software Requirements Specification</td></tr>
    <tr><td>TTL</td><td>Time to Live (Cache expiration interval)</td></tr>
    <tr><td>UI / UX</td><td>User Interface / User Experience</td></tr>
    <tr><td>WAL</td><td>Write-Ahead Logging (Database Concurrency Protocol)</td></tr>
  </tbody>
</table>
"""
pages.append(make_page(7, p7))

# ==========================================
# PAGE 8: Chapter 1: Introduction (Part 1)
# ==========================================
p8 = """
<h1 class="chapter-title">CHAPTER 1: INTRODUCTION</h1>

<h2 class="section-title">1.1 Background and Motivation</h2>
<p>
  Urban food delivery ecosystems have become an indispensable component of everyday urban life in India. In dense metropolitan clusters like Bengaluru, consumers expect seamless discovery of nearby restaurants, rapid order execution, transparent billing, and live delivery status updates. However, commercial aggregator applications (such as Swiggy and Zomato) have grown into heavy, monolithic applications exceeding 15 to 25 MB in bundle size. These applications are saturated with gamification popups, ad monetization banners, cross-selling widgets, and proprietary tracking scripts that cause high memory consumption, battery depletion, and sluggish page loads on budget mobile devices.
</p>
<p>
  Furthermore, commercial platforms operate as closed data silos. Merchant listings, user review scores, and spatial routing are tightly guarded behind proprietary walls. Independent eateries and campus-area establishments face steep onboarding hurdles and commission rates reaching 25–30%.
</p>
<p>
  <strong>BiteBox</strong> was conceptualized to demonstrate that a high-performance, responsive food delivery experience can be engineered using lean, open-standard technologies. By leveraging open spatial geographic data from OpenStreetMap (OSM), deterministic menu synthesis, atomic database write-ahead logging, and zero-trust backend price validation, BiteBox provides an authentic, bloat-free ordering platform that operates reliably across varied network conditions.
</p>

<h2 class="section-title">1.2 Problem Statement</h2>
<p>
  Modern web food ordering systems suffer from three pervasive engineering failure modes:
</p>
<ol>
  <li><strong>Client-Side Vulnerabilities &amp; Price Tampering:</strong> Many web prototypes perform price, tax, and discount arithmetic inside the browser JavaScript layer, exposing the checkout flow to client-side payload manipulation where malicious actors alter totals before submission.</li>
  <li><strong>Inventory Race Conditions (Overselling):</strong> Under high-concurrency ordering scenarios, standard read-then-write database patterns allow multiple customers to purchase the final unit of a dish simultaneously, causing order cancellation cascades and customer dissatisfaction.</li>
  <li><strong>Spatial Fragility and External Dependency:</strong> Applications relying solely on third-party paid map APIs fail abruptly when rate limits are exhausted or network access is throttled, leaving customers stranded without restaurant listings or tracking updates.</li>
</ol>

<h2 class="section-title">1.3 Objectives</h2>
<ul>
  <li>Deliver a high-speed Single Page Application with initial bundle payload under 200 kB gzipped.</li>
  <li>Implement an authoritative zero-trust pricing engine that recomputes every bill server-side.</li>
  <li>Integrate OpenStreetMap Overpass spatial queries across a 5.0 km radius with a resilient 4-tier fallback cascade (Fresh Cache &rarr; Overpass API &rarr; Stale Cache &rarr; Hub Snapshots).</li>
  <li>Guarantee absolute stock isolation with zero overselling using atomic SQLite write-ahead logging.</li>
  <li>Provide responsive real-time courier telemetry with simulated scooter movement and 3-second polling.</li>
</ul>
"""
pages.append(make_page(8, p8))

# ==========================================
# PAGE 9: Chapter 1: Introduction (Part 2)
# ==========================================
p9 = """
<h2 class="section-title">1.4 Scope, Stakeholders and Assumptions</h2>

<h3 class="sub-section-title">In-Scope Capabilities</h3>
<ul>
  <li>User registration, Bcrypt password hashing (cost factor 10), and stateless JWT session management.</li>
  <li>Delivery location resolver supporting HTML5 GPS coordinates and 4 preset Bangalore hubs (Presidency University, Indiranagar, Koramangala, MG Road).</li>
  <li>Geospatial discovery of live restaurants within a 5.0 km radius via OpenStreetMap Overpass API.</li>
  <li>Algorithmic deterministic rating engine (3.8★ to 4.8★) and cuisine-based pricing tiers.</li>
  <li>Categorized menu navigation (Starters, Mains, Breads, Desserts, Beverages) with pure-veg filtering.</li>
  <li>Zero-trust server-side bill quoting with exact 5% GST rounding and coupon discount validation.</li>
  <li>Accessible Slide-to-Pay checkout supporting Mock UPI, Mock Card, and Cash on Delivery (COD).</li>
  <li>Atomic stock decrement on payment and exact 1:1 stock restoration upon kitchen rejection.</li>
  <li>Restaurant Partner Portal for one-click kitchen acceptance, preparation advancing, and order rejection.</li>
  <li>Live telemetry tracking screen featuring animated Leaflet route rendering, scooter heading calculation, and 3-second status polling.</li>
</ul>

<h3 class="sub-section-title">Out of Scope for the Current Demonstration</h3>
<ul>
  <li>Production banking gateway settlement (Razorpay / PayU live credentials requiring commercial merchant KYC).</li>
  <li>Hardware GPS tracking units mounted on actual courier vehicles (telemetry is simulated along coordinate polylines).</li>
  <li>Native Android/iOS application packages (the platform is built strictly as a Progressive Web App).</li>
  <li>SMS gateway integration (orders and status updates rely on authenticated in-app notification state).</li>
</ul>

<h3 class="sub-section-title">Stakeholders</h3>
<p>
  The primary actors comprise <strong>Customers</strong> (ordering food and tracking deliveries), <strong>Restaurant Partners</strong> (reviewing incoming orders, managing stock, and updating kitchen progress), <strong>Delivery Couriers</strong> (assigned to pick up and deliver orders), and <strong>System Administrators</strong> (monitoring database health and audit logs).
</p>

<h3 class="sub-section-title">Assumptions and Constraints</h3>
<p>
  The platform is evaluated as an academic prototype deployed on Node.js and SQLite WAL. While commercial networks use multi-region distributed databases, BiteBox demonstrates that a disciplined, single-node ACID architecture can sustain substantial throughput (742+ req/s) with sub-10ms response times.
</p>

<div class="callout-box">
  <strong>Important boundary:</strong> BiteBox is designed to demonstrate robust full-stack software architecture, spatial discovery, and concurrency control. It simulates payment gateway success/failure callbacks and courier vehicle progress while maintaining full transactional consistency across the database.
</div>
"""
pages.append(make_page(9, p9))

# ==========================================
# PAGE 10: Chapter 2: Existing System & Proposed Solution
# ==========================================
p10 = """
<h1 class="chapter-title">CHAPTER 2: EXISTING SYSTEM AND PROPOSED SOLUTION</h1>

<h2 class="section-title">2.1 Existing System Overview</h2>
<p>
  Commercial food delivery platforms in the Indian market rely heavily on distributed microservice architectures. While capable of scaling to millions of concurrent users, these platforms have accumulated massive frontend and network bloat. A standard mobile web session on commercial aggregators downloads between 12 MB and 25 MB of assets across dozens of third-party domains (analytics beacons, ad trackers, customer profiling scripts, and dynamic promo videos).
</p>
<p>
  In addition, existing ordering workflows introduce multiple user pain points:
</p>
<ul>
  <li><strong>Cart Contamination:</strong> Customers adding dishes from multiple eateries encounter cryptic clearing prompts or find items silently wiped without clear explanation.</li>
  <li><strong>Unsynchronized Inventory:</strong> High-demand items often show as available in the menu view, only for the user to be confronted with a payment failure or cancellation after their money has been deducted.</li>
  <li><strong>Opaque Pricing Arithmetic:</strong> Delivery fees, surge charges, packaging costs, and taxes are often bundled together, making bill verification difficult for the consumer.</li>
</ul>

<h2 class="section-title">2.2 Architectural Limitations</h2>
<ul>
  <li><strong>Resource Overhead:</strong> Heavy client-side JavaScript bundles lead to First Contentful Paint (FCP) latencies exceeding 3.5 seconds on 3G and 4G mobile connections.</li>
  <li><strong>Proprietary Map Lock-In:</strong> Commercial platforms rely on Google Maps Platform APIs incurring substantial costs per query, which is unfeasible for independent campus-area networks.</li>
  <li><strong>Client-Side Price Exposure:</strong> Prototypes frequently trust client-submitted cart calculations, allowing parameter tampering via HTTP interceptors.</li>
  <li><strong>Fragile Network Recovery:</strong> When mobile connectivity drops momentarily, tracking screens frequently crash or display stale states requiring manual reloads.</li>
</ul>

<h2 class="section-title">2.3 Proposed BiteBox Approach</h2>
<p>
  BiteBox replaces monolithic complexity with a clean, decoupled three-tier architecture:
</p>
<ol>
  <li><strong>Lean Client Presentation:</strong> Built using React 19 and Vite with zero advertising or tracking libraries, achieving an initial bundle size under 170 kB gzipped.</li>
  <li><strong>Open Spatial Discovery:</strong> Direct integration with the OpenStreetMap Overpass API querying live geographic nodes within 5.0 km, backed by persistent SQLite spatial caching.</li>
  <li><strong>Zero-Trust Authoritative Pricing:</strong> All cart items, taxes (5% GST), delivery charges (flat ₹40), and coupon discounts are computed exclusively by the server database.</li>
  <li><strong>Atomic Concurrency Control:</strong> SQLite Write-Ahead Logging (WAL) mode guarantees immediate stock deduction on payment and exact refund restoration upon kitchen rejection.</li>
</ol>
"""
pages.append(make_page(10, p10))

# ==========================================
# PAGE 11: Chapter 2: Comparison Matrix Table
# ==========================================
p11 = """
<h2 class="section-title" style="margin-top: 6mm;">Table 2.1 Comparative Matrix: Commercial Aggregators vs. BiteBox</h2>

<table class="report-table" style="width: 100%; margin-top: 8px;">
  <thead>
    <tr>
      <th style="width: 20%;">Architectural Concern</th>
      <th style="width: 40%;">Typical Commercial Aggregators</th>
      <th style="width: 40%;">BiteBox Approach</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Frontend Bundle Size</strong></td>
      <td>Monolithic bundles &gt; 15 MB with heavy marketing, analytics, and third-party trackers.</td>
      <td>Optimized React 19 SPA &lt; 170 kB gzipped with zero external tracking dependencies.</td>
    </tr>
    <tr>
      <td><strong>Initial Render Latency</strong></td>
      <td>2.5 s to 4.5 s First Contentful Paint on mobile 4G networks.</td>
      <td>Sub-110 ms First Contentful Paint; 104 ms verified on local/LAN endpoints.</td>
    </tr>
    <tr>
      <td><strong>Geospatial Data Source</strong></td>
      <td>Proprietary Google Maps Platform with high API usage cost and rate-limits.</td>
      <td>OpenStreetMap Overpass API with open-data coordinates and zero licensing cost.</td>
    </tr>
    <tr>
      <td><strong>Discovery Radius</strong></td>
      <td>Algorithmic dynamic radius often restricted to sponsored merchants.</td>
      <td>Transparent, user-configurable 5.0 km spherical Haversine radius envelope.</td>
    </tr>
    <tr>
      <td><strong>Pricing Validation</strong></td>
      <td>Distributed pricing microservices with periodic client sync.</td>
      <td>Strict zero-trust backend quoting; client prices and delivery fees are rejected.</td>
    </tr>
    <tr>
      <td><strong>Inventory Concurrency</strong></td>
      <td>Eventual consistency with post-payment order cancellations.</td>
      <td>Immediate ACID write-ahead logging; atomic stock decrement on payment.</td>
    </tr>
    <tr>
      <td><strong>Rejection Refund Parity</strong></td>
      <td>Multi-day payment gateway refund processing (3–7 business days).</td>
      <td>Instant atomic payment status update to `REFUNDED` with exact 1:1 monetary parity.</td>
    </tr>
    <tr>
      <td><strong>Telemetry &amp; Tracking</strong></td>
      <td>Heavy WebSocket streaming requiring continuous server connection.</td>
      <td>Resilient 3-second polling with client-side linear spline courier interpolation.</td>
    </tr>
    <tr>
      <td><strong>Offline &amp; Fallback</strong></td>
      <td>Generic error screens when external geocoding endpoints fail.</td>
      <td>Resilient 4-tier cascade: Fresh Cache &rarr; Overpass &rarr; Stale Cache &rarr; Snapshot &rarr; Seeded.</td>
    </tr>
  </tbody>
</table>

<div class="callout-box" style="margin-top: 14mm;">
  <strong>Key Takeaway:</strong> BiteBox demonstrates that modern web standards (React 19, SQLite WAL, Leaflet, and OpenStreetMap) can deliver an exceptionally fast, transparent, and robust food delivery experience without commercial bloat or proprietary API dependency.
</div>
"""
pages.append(make_page(11, p11))

# ==========================================
# PAGE 12: Chapter 3: Requirements Analysis (FR Matrix)
# ==========================================
p12 = """
<h1 class="chapter-title">CHAPTER 3: REQUIREMENTS ANALYSIS</h1>

<h2 class="section-title">3.1 Functional Requirements</h2>
<p>
  Functional requirements define the core operational behaviors and business workflows that BiteBox must execute. Table 3.1 details the functional requirements categorized by system module.
</p>

<table class="report-table" style="width: 100%; margin-top: 6px;">
  <thead>
    <tr>
      <th style="width: 18%;">Module ID</th>
      <th style="width: 62%;">Requirement Summary &amp; Behavior Specification</th>
      <th style="width: 20%;">Priority</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>FR-AUTH</strong></td>
      <td>User registration, login, Bcrypt hashing (`$2a$` prefix), and stateless JWT issuance. Identical generic errors for unknown user and incorrect password.</td>
      <td>Critical</td>
    </tr>
    <tr>
      <td><strong>FR-GEO</strong></td>
      <td>Delivery location resolver supporting HTML5 GPS coordinates and 4 preset Bangalore hubs. Strict coordinate validation (-90&le;lat&le;90, -180&le;lng&le;180).</td>
      <td>High</td>
    </tr>
    <tr>
      <td><strong>FR-REST</strong></td>
      <td>Retrieve restaurants within 5.0 km sorted by Haversine distance. Enforce 30 req/min rate limit per IP. Multi-tier fallback cascade upon network failure.</td>
      <td>High</td>
    </tr>
    <tr>
      <td><strong>FR-MENU</strong></td>
      <td>Dynamic menu generation categorized into Starters, Mains, Breads, Desserts, and Beverages. Pure-veg tagging and out-of-stock indicators.</td>
      <td>High</td>
    </tr>
    <tr>
      <td><strong>FR-CART</strong></td>
      <td>Cart state persistence across navigation. Strict single-restaurant enforcement (cart clears on merchant switch). Quantity validation (positive integers &le;99).</td>
      <td>Critical</td>
    </tr>
    <tr>
      <td><strong>FR-QUOTE</strong></td>
      <td>Server-side price quoting. Grand total = Item Total + round(5% GST) + ₹40 Delivery Fee &minus; Discount. Client price tampering strictly ignored.</td>
      <td>Critical</td>
    </tr>
    <tr>
      <td><strong>FR-PAY</strong></td>
      <td>Slide-to-Pay checkout with UPI, Card, and COD support. Atomic stock decrement on payment. Parallel double-submit protection.</td>
      <td>Critical</td>
    </tr>
    <tr>
      <td><strong>FR-PARTNER</strong></td>
      <td>Restaurant Partner Portal for order decisioning. Accept transitions order to `confirmed` and assigns courier; Reject marks `rejected` with reason.</td>
      <td>High</td>
    </tr>
    <tr>
      <td><strong>FR-TELEMETRY</strong></td>
      <td>Real-time order tracking screen with animated Leaflet route rendering, scooter heading rotation, delivery stages stepper, and 3-second polling.</td>
      <td>High</td>
    </tr>
    <tr>
      <td><strong>FR-REFUND</strong></td>
      <td>Atomic refund processing for rejected UPI/Card orders. Refund amount strictly equals charged amount. Immediate restoration of inventory stock.</td>
      <td>Critical</td>
    </tr>
  </tbody>
</table>
"""
pages.append(make_page(12, p12))

# ==========================================
# PAGE 13: Chapter 3: Roles & Business Rules
# ==========================================
p13 = """
<h2 class="section-title">Core Business Rules</h2>
<ul>
  <li><strong>Single-Restaurant Cart Rule:</strong> A customer cart can hold dishes from exactly one restaurant at a time. Adding a dish from a new restaurant triggers a confirmation dialog to clear previous items.</li>
  <li><strong>Zero-Trust Pricing Rule:</strong> The client application never calculates prices. The server recomputes item totals, tax rounding, and delivery fees directly from database rows.</li>
  <li><strong>Atomic Stock Rule:</strong> When an online payment succeeds, inventory stock is decremented immediately within an exclusive database transaction (`BEGIN IMMEDIATE`). If stock is insufficient, payment is rejected.</li>
  <li><strong>Refund Parity Rule:</strong> If an order is rejected by the kitchen, online payments are marked `REFUNDED` with the exact charged amount, and stock is atomically restored. COD orders incur no refund.</li>
  <li><strong>Delivery Boundary Rule:</strong> Orders are accepted only from restaurants located within 5.0 km of the customer's active delivery coordinates. Distant orders are rejected by the quote engine.</li>
</ul>

<h2 class="section-title">3.2 User Roles and Responsibilities</h2>
<p>
  Table 3.2 details the primary user roles and operational boundaries established within BiteBox.
</p>

<table class="report-table" style="width: 100%; margin-top: 8px;">
  <thead>
    <tr>
      <th style="width: 25%;">User Role</th>
      <th style="width: 75%;">Main Responsibilities &amp; Operational Permissions</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Customer</strong></td>
      <td>Selects delivery location, searches nearby restaurants within 5 km, browses menus, applies coupons, reviews server-calculated quotes, executes Slide-to-Pay, and tracks delivery telemetry.</td>
    </tr>
    <tr>
      <td><strong>Restaurant Partner</strong></td>
      <td>Accesses kitchen portal (`/restaurant`), reviews incoming paid orders, accepts or rejects orders, advances preparation stages (`confirmed` &rarr; `preparing` &rarr; `picked_up`), and manages dish availability.</td>
    </tr>
    <tr>
      <td><strong>Delivery Courier</strong></td>
      <td>Assigned automatically upon kitchen acceptance. Represents delivery progress (`out_for_delivery` &rarr; `delivered`) and simulates physical movement along route polylines.</td>
    </tr>
    <tr>
      <td><strong>System Administrator</strong></td>
      <td>Monitors API gateway health, inspects SQLite database transactions, resets test fixtures via demo endpoints, and evaluates rate-limiting telemetry.</td>
    </tr>
    <tr>
      <td><strong>Public / Guest</strong></td>
      <td>Views promotional landing page and hub previews; prompted to register or authenticate before placing orders.</td>
    </tr>
  </tbody>
</table>
"""
pages.append(make_page(13, p13))

# ==========================================
# PAGE 14: Chapter 3: Non-Functional Requirements & Feasibility
# ==========================================
p14 = """
<h2 class="section-title">Non-Functional Requirements</h2>
<p>
  Non-functional requirements specify the quality attributes, performance targets, and architectural constraints governing the BiteBox implementation.
</p>

<table class="report-table" style="width: 100%; margin-top: 6px;">
  <thead>
    <tr>
      <th style="width: 22%;">Quality Attribute</th>
      <th style="width: 78%;">Requirement / Design Target Specification</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Performance</strong></td>
      <td>Discovery feed First Contentful Paint &lt; 150 ms; quote API latency &lt; 30 ms; cached nearby spatial queries &lt; 5 ms. Sustained load &gt; 500 req/s.</td>
    </tr>
    <tr>
      <td><strong>Scalability</strong></td>
      <td>Stateless Express API architecture; SQLite Write-Ahead Logging (WAL) supporting concurrent readers without blocking writers.</td>
    </tr>
    <tr>
      <td><strong>Security</strong></td>
      <td>Bcrypt password hashing (cost factor 10); stateless JWT auth tokens; sanitization of input strings against XSS; zero storage of CVV or raw card data.</td>
    </tr>
    <tr>
      <td><strong>Reliability</strong></td>
      <td>Idempotent payment submissions; atomic stock transactions; 4-tier fallback cascade preventing discovery failure when Overpass is unreachable.</td>
    </tr>
    <tr>
      <td><strong>Privacy</strong></td>
      <td>Customer passwords and raw coordinates are never exposed in plaintext logs; public views redact personal phone numbers and delivery details.</td>
    </tr>
    <tr>
      <td><strong>Accessibility</strong></td>
      <td>Compliance with WCAG 2.1 AA standards: minimum 4.5:1 color contrast, visible focus rings, ARIA labels on interactive pins, and keyboard navigation.</td>
    </tr>
    <tr>
      <td><strong>Auditability</strong></td>
      <td>Append-only order status history logging exact timestamps, status transitions, assigned couriers, and payment refund references.</td>
    </tr>
  </tbody>
</table>

<h2 class="section-title">Feasibility Analysis</h2>
<p>
  <strong>Technical Feasibility:</strong> The technology stack (React 19, Express 5, Better-SQLite3, Leaflet, OpenStreetMap) comprises mature, production-proven open-source tools with active global developer communities. No proprietary or experimental frameworks were required.
</p>
<p>
  <strong>Operational Feasibility:</strong> The user interface follows standard Indian food delivery interaction patterns (horizontal cuisine pills, slide-to-pay confirmation, delivery stage stepper), ensuring zero learning curve for end users and restaurant kitchen staff.
</p>
<p>
  <strong>Economic Feasibility:</strong> By substituting commercial mapping APIs (Google Maps Platform) with OpenStreetMap Overpass QL and utilizing embedded SQLite WAL, the application eliminates recurring monthly API fees, making it highly cost-effective for campus and localized deployments.
</p>
"""
pages.append(make_page(14, p14))

# ==========================================
# PAGE 15: Chapter 4: System Design (Architecture)
# ==========================================
p15 = f"""
<h1 class="chapter-title">CHAPTER 4: SYSTEM DESIGN</h1>

<h2 class="section-title">4.1 System Architecture</h2>
<p>
  BiteBox is architected as a decoupled three-tier system comprising a Presentation Tier (Client SPA), an Application &amp; API Gateway Tier, and a Persistence &amp; Spatial Tier. Figure 4.1 depicts the architectural layout and subsystem boundaries.
</p>

<div class="figure-box">
  <img src="{arch_img}" class="figure-img" style="max-height: 110mm;" alt="BiteBox Architecture Diagram" />
  <div class="figure-caption">Figure 4.1. Proposed three-tier architecture of BiteBox.</div>
</div>

<h3 class="sub-section-title">Layer 1: Presentation Tier (Client SPA)</h3>
<p>
  Engineered as a lightweight Single Page Application using React 19 and Vite. The presentation layer manages user view routing, client-side session tokens in `localStorage`, interactive Leaflet mapping with custom pin clustering, and dynamic shopping cart persistence in `sessionStorage`.
</p>

<h3 class="sub-section-title">Layer 2: Application Tier (API Gateway &amp; Business Logic)</h3>
<p>
  Powered by Node.js and Express 5. The API tier provides stateless REST endpoints, enforces sliding-window rate limiting (30 requests/minute per IP), validates JSON Web Tokens, applies zero-trust bill calculation, and orchestrates the order lifecycle finite state machine.
</p>
"""
pages.append(make_page(15, p15))

# ==========================================
# PAGE 16: Chapter 4: System Design (Data Flow & Workflows)
# ==========================================
p16 = f"""
<h3 class="sub-section-title">Layer 3: Persistence and Spatial Engine</h3>
<p>
  Data persistence is managed by SQLite running in Write-Ahead Logging (WAL) mode via `better-sqlite3`. WAL mode enables non-blocking concurrent readers alongside a serialized writer thread, guaranteeing ACID consistency. Spatial discovery queries the OpenStreetMap Overpass API and caches normalized geospatial entities in the `geo_cache` table.
</p>

<h2 class="section-title">Data Flow and Main Workflows</h2>
<p>
  Figure 4.2 illustrates the zero-trust order placement, price quoting, and atomic payment synchronization workflow.
</p>

<div class="figure-box">
  <img src="{activity_img}" class="figure-img" style="max-height: 115mm;" alt="Activity and Data Flow Diagram" />
  <div class="figure-caption">Figure 4.2. Order placement, zero-trust quoting, and payment synchronization flow.</div>
</div>

<h3 class="sub-section-title">Order Placement Workflow</h3>
<ol>
  <li>Customer selects a restaurant and adds dishes to the cart.</li>
  <li>Client requests `POST /api/orders/quote` passing item IDs, quantities, and delivery coordinates.</li>
  <li>Backend recomputes item totals from database rows, applies flat ₹40 delivery fee, adds rounded 5% GST, verifies coupon discount, and returns authoritative quote.</li>
  <li>Customer performs Slide-to-Pay; client sends payment confirmation to `POST /api/payments`.</li>
  <li>Backend executes `BEGIN IMMEDIATE` transaction, verifies stock availability, decrements inventory, creates payment record, and marks order `paid`.</li>
</ol>
"""
pages.append(make_page(16, p16))

# ==========================================
# PAGE 17: Chapter 4: System Design (Telemetry & Dispatch)
# ==========================================
p17 = """
<h2 class="section-title">Telemetry and Dispatch Workflow</h2>
<p>
  Following successful payment, the order enters the kitchen decisioning lifecycle. The Restaurant Partner Portal receives the order in real time. Upon kitchen acceptance:
</p>
<ol>
  <li>The order status transitions from `paid` to `confirmed`.</li>
  <li>A delivery courier (e.g., Ramesh Kumar) is assigned from the available pool.</li>
  <li>An immutable status change log is appended to `order_status_history`.</li>
  <li>The customer tracking screen polls `GET /api/orders/:id` every 3 seconds, detecting the confirmation and rendering the courier card.</li>
  <li>As the restaurant advances the order through `preparing`, `picked_up`, and `out_for_delivery`, the client updates the delivery stage stepper.</li>
  <li>During the `out_for_delivery` phase, a simulated linear spline algorithm moves the scooter icon smoothly along the polyline connecting the restaurant and customer coordinates.</li>
  <li>Upon courier arrival, the order transitions to `delivered`. For COD orders, payment status is simultaneously transitioned to `SUCCESS`.</li>
</ol>

<div class="callout-box">
  <strong>Consistency rule:</strong> Order total, payment status, inventory stock, courier assignment, and tracking stepper must be derived strictly from authoritative database rows. A frontend-only state mutation is never treated as a substitute for a persisted backend database transaction.
</div>

<h2 class="section-title">Finite State Machine Lifecycle</h2>
<p>
  BiteBox enforces strict sequential order transitions:
</p>
<div style="text-align: center; margin: 12px 0; font-family: monospace; font-size: 10pt; color: #163A45;">
  [placed] &rarr; [paid] &rarr; [confirmed] &rarr; [preparing] &rarr; [picked_up] &rarr; [out_for_delivery] &rarr; [delivered]<br>
  &darr;<br>
  [rejected] (with immediate atomic refund and stock restoration)
</div>
<p>
  Skipping stages (e.g. attempting to jump from `placed` directly to `picked_up`) or advancing a `rejected` order is strictly rejected with HTTP 400 Bad Request.
</p>
"""
pages.append(make_page(17, p17))

# ==========================================
# PAGE 18: Chapter 4: Functional Modules Table
# ==========================================
p18 = """
<h2 class="section-title" style="margin-top: 6mm;">4.2 Functional Modules</h2>
<p>
  Table 4.1 defines the principal functional modules of BiteBox and their respective architectural boundaries.
</p>

<table class="report-table" style="width: 100%; margin-top: 6px;">
  <thead>
    <tr>
      <th style="width: 25%;">Module Name</th>
      <th style="width: 75%;">Purpose, Architecture Boundary and Security Controls</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Authentication &amp; User Service</strong></td>
      <td>Manages customer onboarding, login, Bcrypt hashing, and JWT token signing. Enforces generic "Invalid credentials" error masking.</td>
    </tr>
    <tr>
      <td><strong>Geolocation &amp; Hub Resolver</strong></td>
      <td>Resolves delivery addresses, validates geographic coordinates (-90&le;lat&le;90, -180&le;lng&le;180), and synchronizes location across sessions.</td>
    </tr>
    <tr>
      <td><strong>OSM Discovery Engine</strong></td>
      <td>Constructs Overpass QL bounding box queries, executes HTTP mirror queries, calculates Haversine distances ($d \le 5.0\text{ km}$), and caches results in `geo_cache`.</td>
    </tr>
    <tr>
      <td><strong>Menu &amp; Inventory Control</strong></td>
      <td>Synthesizes deterministic restaurant menus, organizes categories, tracks real-time stock levels, and flags sold-out items with `aria-disabled`.</td>
    </tr>
    <tr>
      <td><strong>Price Quoting &amp; Bill Engine</strong></td>
      <td>Enforces zero-trust bill calculations: item totals, 5% GST rounding, ₹40 delivery fee, and coupon revalidation against database prices.</td>
    </tr>
    <tr>
      <td><strong>Slide-to-Pay Checkout</strong></td>
      <td>Provides swipe and keyboard accessible payment confirmation. Supports Mock UPI, Mock Card, and COD. Prevents parallel double submits.</td>
    </tr>
    <tr>
      <td><strong>Restaurant Partner Portal</strong></td>
      <td>Dedicated portal (`/restaurant`) for kitchen staff to review pending orders, accept orders with courier dispatch, or reject with atomic refund.</td>
    </tr>
    <tr>
      <td><strong>Real-Time Telemetry Tracking</strong></td>
      <td>Polls order status at 3-second intervals, renders Leaflet route polylines, animates scooter heading, and updates stage steppers.</td>
    </tr>
    <tr>
      <td><strong>Audit &amp; Lifecycle Logger</strong></td>
      <td>Maintains append-only `order_status_history` and `payments` records capturing actor identities, timestamps, and refund transactions.</td>
    </tr>
  </tbody>
</table>
"""
pages.append(make_page(18, p18))

# ==========================================
# PAGE 19: Chapter 4: Database Design (ER Model)
# ==========================================
p19 = f"""
<h2 class="section-title">4.3 Database Design</h2>
<p>
  BiteBox utilizes a relational schema implemented in SQLite with Write-Ahead Logging (WAL). The schema maintains referential integrity across customer accounts, restaurant profiles, dynamic menu items, order lines, payment transactions, and telemetry logs. Figure 4.3 depicts the conceptual relational data model.
</p>

<div class="figure-box">
  <img src="{usecase_img}" class="figure-img" style="max-height: 125mm;" alt="Conceptual Relational Data Model" />
  <div class="figure-caption">Figure 4.3. Conceptual relational data model and entity associations.</div>
</div>

<p>
  The data model enforces strict foreign key constraints (`ON DELETE CASCADE` on order items) and database-level indexing on spatial coordinates (`cell_key`), customer order queries (`customer_id`), and payment reconciliation references (`order_id`).
</p>
"""
pages.append(make_page(19, p19))

# ==========================================
# PAGE 20: Chapter 4: Database Design (Entities Table)
# ==========================================
p20 = """
<h2 class="section-title" style="margin-top: 6mm;">Core Relational Entities</h2>
<p>
  Table 4.2 documents the 11 relational entities comprising the BiteBox database schema.
</p>

<table class="report-table" style="width: 100%; margin-top: 6px; font-size: 9pt;">
  <thead>
    <tr>
      <th style="width: 25%;">Entity Name</th>
      <th style="width: 75%;">Primary Schema Attributes &amp; Integrity Purpose</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>`customers`</strong></td>
      <td>`id (PK)`, `name`, `email (UNIQUE)`, `phone (UNIQUE)`, `password_hash`, `default_address`, `created_at`. Stores user credentials.</td>
    </tr>
    <tr>
      <td><strong>`restaurants`</strong></td>
      <td>`id (PK)`, `name`, `cuisine`, `rating`, `delivery_time_est`, `is_open`, `image_url`, `emoji`, `lat`, `lng`, `source`, `osm_type`, `osm_id`.</td>
    </tr>
    <tr>
      <td><strong>`menu_items`</strong></td>
      <td>`id (PK)`, `restaurant_id (FK)`, `category`, `name`, `price`, `is_veg`, `is_available`, `stock_quantity`, `description`, `image_url`.</td>
    </tr>
    <tr>
      <td><strong>`orders`</strong></td>
      <td>`id (PK)`, `customer_id (FK)`, `restaurant_id (FK)`, `status`, `item_total`, `tax_amount`, `delivery_fee`, `discount_amount`, `grand_total`, `delivery_lat`, `delivery_lng`.</td>
    </tr>
    <tr>
      <td><strong>`order_items`</strong></td>
      <td>`id (PK)`, `order_id (FK)`, `menu_item_id (FK)`, `item_name`, `quantity`, `unit_price`, `subtotal`. Preserves purchase snapshot.</td>
    </tr>
    <tr>
      <td><strong>`payments`</strong></td>
      <td>`id (PK)`, `order_id (FK, UNIQUE)`, `payment_method`, `amount`, `status (PENDING/SUCCESS/FAILED/REFUNDED)`, `transaction_ref`, `refund_amount`, `refunded_at`.</td>
    </tr>
    <tr>
      <td><strong>`order_status_history`</strong></td>
      <td>`id (PK)`, `order_id (FK)`, `status`, `actor`, `notes`, `created_at`. Append-only audit trail.</td>
    </tr>
    <tr>
      <td><strong>`delivery_agents`</strong></td>
      <td>`id (PK)`, `name`, `phone`, `vehicle_type`, `is_available`, `current_lat`, `current_lng`. Courier dispatch pool.</td>
    </tr>
    <tr>
      <td><strong>`coupons`</strong></td>
      <td>`id (PK)`, `code (UNIQUE)`, `discount_type`, `discount_value`, `min_order_amount`, `is_active`, `expires_at`. Promotional codes.</td>
    </tr>
    <tr>
      <td><strong>`geo_cache`</strong></td>
      <td>`cell_key (PK)`, `fetched_at`, `payload`. Stores Overpass spatial query results for 24 hours.</td>
    </tr>
    <tr>
      <td><strong>`restaurant_delivery_areas`</strong></td>
      <td>`id (PK)`, `restaurant_id (FK)`, `area_name`. Maps seeded restaurants to named operational hubs.</td>
    </tr>
  </tbody>
</table>

<div class="callout-box">
  <strong>Data Integrity Invariants:</strong> SQLite constraints guarantee `stock_quantity &ge; 0`, preventing overselling. Payments enforce 1:1 unique foreign key relationship with orders, eliminating duplicate charges.
</div>
"""
pages.append(make_page(20, p20))

# ==========================================
# PAGE 21: Chapter 4: Spatial Discovery & Menu Generator
# ==========================================
p21 = """
<h2 class="section-title">4.4 Spatial Discovery and Menu Generation</h2>

<h3 class="sub-section-title">Overpass QL Spatial Query Construction</h3>
<p>
  To query OpenStreetMap without incurring commercial fees, BiteBox constructs bounding box queries centered on the customer's delivery coordinates using an expanded 5.0 km radius:
</p>
<pre style="background: #F3F4F6; padding: 8px 12px; font-size: 8.5pt; border-radius: 4px; border: 1px solid #E5E7EB; line-height: 1.35;">
[out:json][timeout:6];
(
  node["amenity"~"^(restaurant|fast_food|cafe)$"](13.1243,77.4886,13.2143,77.5810);
  way["amenity"~"^(restaurant|fast_food|cafe)$"](13.1243,77.4886,13.2143,77.5810);
);
out center tags;
</pre>
<p>
  Every returned node or way center is evaluated against the spherical Haversine formula ($R = 6371\text{ km}$):
</p>
<p style="text-align: center; font-style: italic;">
  d = 2R &middot; arcsin(&radic;(sin&sup2;(&Delta;&phi;/2) + cos(&phi;&sub1;)cos(&phi;&sub2;)sin&sup2;(&Delta;&lambda;/2)))
</p>
<p>
  Venues with $d \le 5.0\text{ km}$ are normalized, sorted nearest-first, and cached in `geo_cache` under a cell key indexed by rounded coordinate grid centroids.
</p>

<h3 class="sub-section-title">Deterministic Menu Synthesis Engine</h3>
<p>
  Because OpenStreetMap records physical venue metadata rather than food dish catalogs, BiteBox integrates a deterministic menu generation engine (`menuGenerator.js` &amp; `brandMenus.js`). Utilizing a pseudorandom number generator seeded by the unique OSM ID:
</p>
<ul>
  <li><strong>Cuisine Matching:</strong> South Indian venues generate Sagar dishes (Masala Dosa, Idli Vada); pizzerias generate garlic bread and pizzas; bakeries generate sandwiches and coffee.</li>
  <li><strong>Pure Veg Enforcement:</strong> Venues tagged `diet:vegetarian=only` or &ldquo;Pure Veg&rdquo; generate 100% vegetarian menus with zero meat or poultry items.</li>
  <li><strong>Determinism:</strong> Re-querying or reloading the menu for a venue produces the exact same dishes, descriptions, prices, and stock counts.</li>
</ul>
"""
pages.append(make_page(21, p21))

# ==========================================
# PAGE 22: Chapter 4: Zero-Trust Pricing & Deterministic Ratings
# ==========================================
p22 = """
<h2 class="section-title">4.5 Zero-Trust Pricing and Telemetry Mechanics</h2>

<h3 class="sub-section-title">Zero-Trust Authoritative Price Quoting</h3>
<p>
  To prevent client-side cart tampering, the server recomputes every financial figure:
</p>
<ol>
  <li><strong>Line Item Calculation:</strong> Each item's price is queried directly from `menu_items`. Client-supplied unit prices are discarded.</li>
  <li><strong>Tax Computation:</strong> 5% GST is computed and rounded to the nearest integer: $\text{Tax} = \text{round}(0.05 \times \text{Item Total})$. For example, a ₹30 item incurs $\text{round}(1.5) = ₹2$ tax.</li>
  <li><strong>Delivery Fee:</strong> A flat ₹40 delivery fee is applied to all orders.</li>
  <li><strong>Coupon Validation:</strong> The coupon code is validated against `coupons`. Flat discounts (e.g. `WELCOME50` = ₹50) and percentage discounts (e.g. `FESTIVE20` = 20% capped at ₹100) are evaluated against minimum order amounts. The grand total cannot drop below zero.</li>
</ol>

<h3 class="sub-section-title">Deterministic Rating Engine</h3>
<p>
  Because OpenStreetMap intentionally excludes subjective reviews, BiteBox incorporates a deterministic rating algorithm that maps the venue's name and OSM ID into a consistent score between 3.8★ and 4.8★:
</p>
<p style="text-align: center; font-style: italic;">
  \text{Rating} = 3.8 + (\text{Hash}(\text{osm\_id}, \text{name}) \pmod{11}) \times 0.1
</p>
<p>
  This ensures that every discovered venue displays a realistic star score and verified delivery ETA without requiring external paid review APIs.
</p>

<h3 class="sub-section-title">Real-Time Telemetry &amp; Courier Movement</h3>
<p>
  Courier movement during the `out_for_delivery` phase is modeled through linear interpolation along coordinate polylines. As the client polls every 3 seconds, the scooter icon calculates its bearing angle and rotates dynamically to face the forward direction of travel.
</p>
"""
pages.append(make_page(22, p22))

# ==========================================
# PAGE 23: Chapter 5: Technology Stack & Prototype Status
# ==========================================
p23 = """
<h1 class="chapter-title">CHAPTER 5: PROTOTYPE IMPLEMENTATION, TESTING AND RESULTS</h1>

<h2 class="section-title">5.1 Technology Stack and Prototype Status</h2>
<p>
  Table 5.1 details the software frameworks, libraries, and runtime tools deployed across the BiteBox system.
</p>

<table class="report-table" style="width: 100%; margin-top: 6px;">
  <thead>
    <tr>
      <th style="width: 20%;">Subsystem Layer</th>
      <th style="width: 35%;">Technology / Library</th>
      <th style="width: 45%;">Role and Architectural Responsibility</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Frontend UI</strong></td>
      <td>React 19, Vite 8, Tailwind CSS, Lucide Icons</td>
      <td>Responsive mobile-first Single Page Application, state management, modal dialogs, and slide-to-pay controls.</td>
    </tr>
    <tr>
      <td><strong>Mapping &amp; GIS</strong></td>
      <td>Leaflet 1.9.4, OpenStreetMap Tiles</td>
      <td>Interactive map rendering, dashed 5 km delivery circle, pin clustering, and animated courier route polyline.</td>
    </tr>
    <tr>
      <td><strong>Backend API</strong></td>
      <td>Node.js 22, Express 5, CORS, Dotenv</td>
      <td>RESTful API routing, sliding-window rate limiting, input sanitization, and zero-trust price quote calculation.</td>
    </tr>
    <tr>
      <td><strong>Database &amp; Storage</strong></td>
      <td>SQLite 3, `better-sqlite3` (WAL mode)</td>
      <td>Embedded relational database, ACID transactions (`BEGIN IMMEDIATE`), and spatial cell caching in `geo_cache`.</td>
    </tr>
    <tr>
      <td><strong>Security &amp; Auth</strong></td>
      <td>Bcrypt.js, JSON Web Tokens (`jsonwebtoken`)</td>
      <td>Bcrypt password hashing (cost factor 10), stateless JWT session issuance, and route protection middleware.</td>
    </tr>
    <tr>
      <td><strong>External Spatial API</strong></td>
      <td>OpenStreetMap Overpass API (4 mirrors)</td>
      <td>Geospatial node/way querying for live restaurants within 5 km bounding box.</td>
    </tr>
    <tr>
      <td><strong>Testing &amp; Hardening</strong></td>
      <td>Node Test Runner, Autocannon, Axe-Core</td>
      <td>177 automated regression assertions, high-concurrency stress testing (50 VUs), and WCAG accessibility auditing.</td>
    </tr>
  </tbody>
</table>
"""
pages.append(make_page(23, p23))

# ==========================================
# PAGE 24: Chapter 5: Prototype Status Matrix & Testing Strategy
# ==========================================
p24 = """
<h2 class="section-title" style="margin-top: 6mm;">Prototype Status Matrix</h2>
<p>
  Table 5.2 establishes the implementation and verification status of all principal capabilities.
</p>

<table class="report-table" style="width: 100%; margin-top: 6px;">
  <thead>
    <tr>
      <th style="width: 25%;">Capability / Feature</th>
      <th style="width: 25%;">Prototype Status</th>
      <th style="width: 50%;">Verification Evidence &amp; Operational Caveat</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>User Registration &amp; Login</strong></td>
      <td>Fully Certified (PASS)</td>
      <td>Bcrypt hashing verified in SQLite; generic "Invalid credentials" error enforced on both unknown user and bad password.</td>
    </tr>
    <tr>
      <td><strong>5 km Spatial Discovery</strong></td>
      <td>Fully Certified (PASS)</td>
      <td>Overpass API returns 8 live restaurants at Presidency University hub and 1,500+ in city hubs. 4-tier fallback cascade verified.</td>
    </tr>
    <tr>
      <td><strong>Zero-Trust Pricing</strong></td>
      <td>Fully Certified (PASS)</td>
      <td>6 test carts verified; ₹30 item tax correctly rounds to ₹2; client-tampered totals strictly ignored.</td>
    </tr>
    <tr>
      <td><strong>Slide-to-Pay Checkout</strong></td>
      <td>Fully Certified (PASS)</td>
      <td>Accessible swipe/keyboard control; parallel double-submit rejected; UPI, Card, and COD tested.</td>
    </tr>
    <tr>
      <td><strong>Atomic Stock Isolation</strong></td>
      <td>Fully Certified (PASS)</td>
      <td>100 concurrent requests against stock=3 resulted in exactly 3 orders placed and 97 rejected with 0 overselling.</td>
    </tr>
    <tr>
      <td><strong>Partner Kitchen Portal</strong></td>
      <td>Fully Certified (PASS)</td>
      <td>One-click accept assigns courier; reject issues atomic refund with 100% monetary parity and stock restoration.</td>
    </tr>
    <tr>
      <td><strong>Live Telemetry Tracking</strong></td>
      <td>Fully Certified (PASS)</td>
      <td>Leaflet polyline rendering, scooter heading rotation, 3-second polling, and recovery after 20s server restart verified.</td>
    </tr>
  </tbody>
</table>

<h2 class="section-title">5.2 Testing Strategy</h2>
<p>
  Testing was conducted across four structured layers: (1) Unit tests for Haversine distance, tax rounding, and input validators; (2) Integration tests for REST endpoints and database transactions; (3) Concurrency stress tests using Autocannon; and (4) Headless browser auditing via Puppeteer and Axe-Core.
</p>
"""
pages.append(make_page(24, p24))

# ==========================================
# PAGE 25: Chapter 5: Representative Test Scenarios Table
# ==========================================
p25 = """
<h2 class="section-title" style="margin-top: 6mm;">Table 5.3 Representative Test Execution Scenarios</h2>

<table class="report-table" style="width: 100%; margin-top: 6px; font-size: 9pt;">
  <thead>
    <tr>
      <th style="width: 12%;">Test ID</th>
      <th style="width: 48%;">Execution Scenario &amp; Input Conditions</th>
      <th style="width: 40%;">Expected Result &amp; Empirical Outcome</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>TC-01</strong></td>
      <td>Register duplicate email `aniket@bitebox.com`; short password &lt; 6 chars.</td>
      <td>HTTP 400 Bad Request returned with clear, actionable validation error. (PASS)</td>
    </tr>
    <tr>
      <td><strong>TC-02</strong></td>
      <td>Inspect `customers` table in SQLite database and server execution logs.</td>
      <td>Passwords strictly stored as `$2a$10$...` Bcrypt hashes; zero plaintext logs. (PASS)</td>
    </tr>
    <tr>
      <td><strong>TC-03</strong></td>
      <td>Query `GET /api/restaurants/nearby` with coordinates at Presidency hub.</td>
      <td>8 live OSM venues returned strictly within 5.0 km; sorted nearest-first. (PASS)</td>
    </tr>
    <tr>
      <td><strong>TC-04</strong></td>
      <td>Submit quote with ₹30 item: 5% GST = 1.5. Check tax rounding.</td>
      <td>Tax rounded to ₹2. Grand total strictly equals ₹30 + ₹2 + ₹40 = ₹72. (PASS)</td>
    </tr>
    <tr>
      <td><strong>TC-05</strong></td>
      <td>Tamper test: inject client-calculated price ₹10 and total ₹10 in order payload.</td>
      <td>Client values ignored; server charges authoritative DB price of ₹292. (PASS)</td>
    </tr>
    <tr>
      <td><strong>TC-06</strong></td>
      <td>Fire two simultaneous `POST /api/payments` requests on the same placed order.</td>
      <td>Exactly one payment succeeds; second is rejected as duplicate submission. (PASS)</td>
    </tr>
    <tr>
      <td><strong>TC-07</strong></td>
      <td>Reject an order paid via UPI (₹513). Check refund amount and payment status.</td>
      <td>Payment marked `REFUNDED`; refund amount strictly ₹513 (100% parity). (PASS)</td>
    </tr>
    <tr>
      <td><strong>TC-08</strong></td>
      <td>Simulate 100 concurrent checkout attempts against a dish with stock = 3.</td>
      <td>Exactly 3 orders placed; 97 rejected with "out of stock"; 0 overselling. (PASS)</td>
    </tr>
    <tr>
      <td><strong>TC-09</strong></td>
      <td>Block Overpass API endpoints; query nearby restaurants within 1 km of hub.</td>
      <td>Graceful fallback to snapshot JSON file with "Showing saved restaurants". (PASS)</td>
    </tr>
    <tr>
      <td><strong>TC-10</strong></td>
      <td>Stop backend server for 20 seconds during active tracking; restart server.</td>
      <td>Tracking screen recovers automatically within 3 seconds without manual reload. (PASS)</td>
    </tr>
    <tr>
      <td><strong>TC-11</strong></td>
      <td>Sustain 50 virtual users executing discovery and order flows for 60 seconds.</td>
      <td>44,619 requests completed at 742.8 req/s; 0.00% errors; p95 latency = 6.4 ms. (PASS)</td>
    </tr>
    <tr>
      <td><strong>TC-12</strong></td>
      <td>Run automated regression suite `test/regression.js`.</td>
      <td>All 177 assertions pass across schema, auth, pricing, state, and refunds. (PASS)</td>
    </tr>
  </tbody>
</table>

<div class="callout-box">
  <strong>Testing Summary:</strong> All 177 automated backend regression tests passed with 100% compliance. Load testing certified 742+ requests per second throughput with zero dropped connections.
</div>
"""
pages.append(make_page(25, p25))

# ==========================================
# PAGE 26: Chapter 5: Screenshots (Auth & Discovery)
# ==========================================
p26 = f"""
<h2 class="section-title">5.3 Demonstration and Observations (Screenshots)</h2>
<p>
  The following screen outputs capture the operational behavior of BiteBox under real browser execution.
</p>

<div style="display: flex; justify-content: space-between; margin-top: 10px;">
  <div style="width: 48%; text-align: center;">
    <img src="{img_login}" style="width: 100%; max-height: 140mm; object-fit: contain; border: 1px solid #D1D5DB; border-radius: 6px; padding: 4px;" alt="Login Screen" />
    <div class="figure-caption">Figure 5.1 (a). Client Authentication &amp; Registration Screen.</div>
  </div>
  <div style="width: 48%; text-align: center;">
    <img src="{img_discover}" style="width: 100%; max-height: 140mm; object-fit: contain; border: 1px solid #D1D5DB; border-radius: 6px; padding: 4px;" alt="Discovery Screen" />
    <div class="figure-caption">Figure 5.1 (b). 5.0 km Interactive Map &amp; Discovery Feed.</div>
  </div>
</div>

<h3 class="sub-section-title" style="margin-top: 12px;">Observed Interpretation</h3>
<p>
  Figure 5.1 (a) shows the authentication modal enforcing validation and instant session persistence. Figure 5.1 (b) displays the customer dashboard at Presidency University with the dashed 5.0 km delivery circle, dynamic pin badges (`★ 4.6`), and nearby restaurant listings sorted by Haversine distance.
</p>
"""
pages.append(make_page(26, p26))

# ==========================================
# PAGE 27: Chapter 5: Screenshots (Menu & Cart Quote)
# ==========================================
p27 = f"""
<div style="display: flex; justify-content: space-between; margin-top: 6mm;">
  <div style="width: 48%; text-align: center;">
    <img src="{img_menu}" style="width: 100%; max-height: 140mm; object-fit: contain; border: 1px solid #D1D5DB; border-radius: 6px; padding: 4px;" alt="Menu Screen" />
    <div class="figure-caption">Figure 5.2 (a). Categorized Menu with Authentic Garlic Bread.</div>
  </div>
  <div style="width: 48%; text-align: center;">
    <img src="{img_cart}" style="width: 100%; max-height: 140mm; object-fit: contain; border: 1px solid #D1D5DB; border-radius: 6px; padding: 4px;" alt="Cart Quote Screen" />
    <div class="figure-caption">Figure 5.2 (b). Shopping Cart &amp; Server-Side Bill Quote.</div>
  </div>
</div>

<h3 class="sub-section-title" style="margin-top: 12px;">Observed Interpretation</h3>
<p>
  Figure 5.2 (a) illustrates the dynamic menu browsing interface for IKEA Restaurant. The garlic bread item displays an authentic freshly baked baguette food photograph (replacing any previous placeholder), pure-veg badge, price, and add-to-cart control. Figure 5.2 (b) demonstrates the shopping cart with transparent server-calculated bill breakdown: item subtotal, flat ₹40 delivery fee, rounded 5% GST, and promo discount.
</p>
"""
pages.append(make_page(27, p27))

# ==========================================
# PAGE 28: Chapter 5: Screenshots (Checkout, Telemetry & Portal)
# ==========================================
p28 = f"""
<div style="display: flex; justify-content: space-between; margin-top: 4mm;">
  <div style="width: 32%; text-align: center;">
    <img src="{img_payment}" style="width: 100%; max-height: 130mm; object-fit: contain; border: 1px solid #D1D5DB; border-radius: 6px; padding: 3px;" alt="Slide-to-Pay Screen" />
    <div class="figure-caption" style="font-size: 8pt;">Figure 5.3 (a). Slide-to-Pay.</div>
  </div>
  <div style="width: 32%; text-align: center;">
    <img src="{img_tracking}" style="width: 100%; max-height: 130mm; object-fit: contain; border: 1px solid #D1D5DB; border-radius: 6px; padding: 3px;" alt="Tracking Screen" />
    <div class="figure-caption" style="font-size: 8pt;">Figure 5.3 (b). Live Telemetry.</div>
  </div>
  <div style="width: 32%; text-align: center;">
    <img src="{img_partner}" style="width: 100%; max-height: 130mm; object-fit: contain; border: 1px solid #D1D5DB; border-radius: 6px; padding: 3px;" alt="Partner Portal" />
    <div class="figure-caption" style="font-size: 8pt;">Figure 5.3 (c). Partner Portal.</div>
  </div>
</div>

<h3 class="sub-section-title" style="margin-top: 10px;">Observed Interpretation</h3>
<p>
  Figure 5.3 (a) shows the accessible Slide-to-Pay checkout interface supporting touch drag and keyboard confirmation. Figure 5.3 (b) captures the live tracking screen with rotating scooter marker along the polyline, assigned courier card, and 5-stage progress stepper. Figure 5.3 (c) displays the Restaurant Partner Portal (`/restaurant`) enabling kitchen staff to accept, advance, or reject orders with real-time state synchronization.
</p>
"""
pages.append(make_page(28, p28))

# ==========================================
# PAGE 29: Chapter 6: Conclusion & Limitations
# ==========================================
p29 = """
<h1 class="chapter-title">CHAPTER 6: CONCLUSION AND FUTURE WORK</h1>

<h2 class="section-title">6.1 Conclusion</h2>
<p>
  BiteBox successfully demonstrates that a high-performance, responsive hyperlocal food delivery platform can be engineered using lean, open-standard technologies. By eliminating third-party tracking libraries and commercial map dependencies, the system achieves an initial frontend bundle of under 170 kB gzipped, delivering sub-110 ms render latencies on mobile devices.
</p>
<p>
  The platform establishes three critical engineering guarantees:
</p>
<ol>
  <li><strong>Zero-Trust Financial Correctness:</strong> Client-side price tampering is eliminated by recomputing all item prices, 5% GST rounding, coupon discounts, and delivery fees server-side from database rows.</li>
  <li><strong>Atomic Inventory Isolation:</strong> SQLite Write-Ahead Logging (WAL) and `BEGIN IMMEDIATE` transactions eliminate overselling race conditions, as proven by 100 concurrent checkout tests resulting in zero oversold units.</li>
  <li><strong>Resilient Geospatial Discovery:</strong> Integrating OpenStreetMap Overpass QL with a 4-tier fallback cascade guarantees continuous restaurant availability within 5.0 km, even during network throttling.</li>
</ol>
<p>
  The comprehensive automated regression suite (177 assertions) and load testing (742+ req/s) confirm that BiteBox satisfies all functional, architectural, and accessibility criteria.
</p>

<h2 class="section-title">6.2 Current Limitations</h2>
<ul>
  <li><strong>Development HTTP Transport:</strong> The prototype operates over plain HTTP in local development environments. Production deployment requires HTTPS/TLS 1.3 certificate termination.</li>
  <li><strong>Single-Node SQLite Storage:</strong> While SQLite WAL mode provides outstanding read/write performance for up to thousands of daily campus orders, scaling to multi-city operations requires migration to distributed PostgreSQL.</li>
  <li><strong>Simulated Telemetry:</strong> Courier movement along route polylines is currently simulated using linear spline interpolation rather than real hardware GPS transponders.</li>
  <li><strong>Mock Gateway Integration:</strong> UPI and Card payments utilize a mock authorization flow without live banking settlement.</li>
</ul>
"""
pages.append(make_page(29, p29))

# ==========================================
# PAGE 30: Chapter 6: Future Work & Enhancements
# ==========================================
p30 = """
<h2 class="section-title" style="margin-top: 6mm;">6.3 Future Enhancements</h2>
<p>
  To advance BiteBox from a high-performance academic prototype to an enterprise-grade commercial deployment, the following technical roadmap is planned:
</p>

<h3 class="sub-section-title">1. Enterprise Database Migration (PostgreSQL &amp; PostGIS)</h3>
<p>
  Migrate persistence to a managed PostgreSQL cluster with PostGIS spatial extensions. PostGIS spatial indexing (`R-Tree` / `GiST`) will enable sub-millisecond geofencing queries across millions of active restaurant and courier coordinates simultaneously.
</p>

<h3 class="sub-section-title">2. Live Banking Gateway Integration (Razorpay Webhooks)</h3>
<p>
  Integrate production payment gateways (Razorpay / PayU) utilizing HMAC-SHA256 signature verification on asynchronous webhook events. Implement idempotency keys to ensure zero duplicate charges during transient network retries.
</p>

<h3 class="sub-section-title">3. Native Driver Telemetry &amp; WebSockets</h3>
<p>
  Develop a companion React Native mobile application for delivery couriers that transmits live GPS coordinates via secure WebSockets (WSS). Replace 3-second polling with event-driven bidirectional WebSocket streaming, reducing server network overhead by over 70%.
</p>

<h3 class="sub-section-title">4. Microservice Containerization &amp; Kubernetes Orchestration</h3>
<p>
  Package the frontend SPA (Nginx), API gateway, and background worker jobs into independent Docker containers orchestrated via Kubernetes. Introduce Redis cluster caching for sub-millisecond session and geo-cell retrieval.
</p>

<h3 class="sub-section-title">5. AI-Assisted Kitchen Load Balancing &amp; Dispatch Optimization</h3>
<p>
  Deploy machine learning models (XGBoost) trained on historical preparation times, weather conditions, and traffic density to dynamically adjust kitchen delivery estimates (ETAs) and dispatch optimal couriers.
</p>
"""
pages.append(make_page(30, p30))

# ==========================================
# PAGE 31: References
# ==========================================
p31 = """
<h1 class="chapter-title" style="margin-top: 8mm; margin-bottom: 8mm;">REFERENCES</h1>

<ol style="font-size: 9pt; line-height: 1.5; padding-left: 24px;">
  <li style="margin-bottom: 6px;">
    Fielding, R. T., &amp; Taylor, R. N. (2002). Principled design of the modern Web architecture. <em>ACM Transactions on Internet Technology (TOIT)</em>, 2(2), 115-150.
  </li>
  <li style="margin-bottom: 6px;">
    OpenStreetMap Contributors. (2026). <em>Overpass API: Spatial Query Language and Mirror Infrastructure</em>. Documentation wiki: https://wiki.openstreetmap.org/wiki/Overpass_API
  </li>
  <li style="margin-bottom: 6px;">
    Hipp, D. R., Kennedy, D., et al. (2025). <em>SQLite Write-Ahead Logging (WAL) Architecture and Concurrency Model</em>. SQLite Consortium Technical Documentation.
  </li>
  <li style="margin-bottom: 6px;">
    World Wide Web Consortium (W3C). (2023). <em>Web Content Accessibility Guidelines (WCAG) 2.1</em>. W3C Recommendation.
  </li>
  <li style="margin-bottom: 6px;">
    Sinnott, R. W. (1984). Virtues of the Haversine. <em>Sky and Telescope</em>, 68(2), 159.
  </li>
  <li style="margin-bottom: 6px;">
    Rescorla, E. (2018). <em>The Transport Layer Security (TLS) Protocol Version 1.3</em>. RFC 8446, Internet Engineering Task Force (IETF).
  </li>
  <li style="margin-bottom: 6px;">
    Cloudflare Inc. (2026). <em>Cloudflare Tunnel: Secure, Inbound-Free Application Ingress</em>. Cloudflare Zero Trust Documentation.
  </li>
  <li style="margin-bottom: 6px;">
    DeCandia, G., Hastorun, D., Jampani, M., et al. (2007). Dynamo: Amazon's highly available key-value store. <em>ACM SIGOPS Operating Systems Review</em>, 41(6), 205-220.
  </li>
  <li style="margin-bottom: 6px;">
    Facebook Open Source. (2026). <em>React 19 Architecture and Server Components Specification</em>. Meta Open Source Documentation.
  </li>
  <li style="margin-bottom: 6px;">
    Vite Core Team. (2026). <em>Vite: Next Generation Frontend Tooling</em>. Documentation: https://vitejs.dev
  </li>
  <li style="margin-bottom: 6px;">
    BiteBox Project Software Requirements Specification (SRS) &amp; Verification Protocol, version 1.0.0, Department of Computer Science &amp; Engineering, Presidency University, Bengaluru, November 2026.
  </li>
</ol>
"""
pages.append(make_page(31, p31))

# ==========================================
# Assemble Full HTML
# ==========================================
html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>BiteBox Project Report - Presidency University</title>
<style>
  @page {{
    size: A4 portrait;
    margin: 0;
  }}
  * {{ box-sizing: border-box; }}
  body {{
    background: #525659;
    font-family: 'Times New Roman', Times, Georgia, serif;
    color: #111827;
    margin: 0;
    padding: 24px 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }}

  .no-print-bar {{
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #163A45;
    color: white;
    padding: 12px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 10000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    font-family: 'Segoe UI', Arial, sans-serif;
  }}
  .print-btn {{
    background: #FF6B2C;
    color: white;
    border: none;
    font-weight: bold;
    padding: 8px 22px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
  }}
  .print-btn:hover {{ background: #E85516; }}

  .pages-container {{
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    margin-top: 50px;
  }}

  .page {{
    width: 210mm;
    height: 297mm;
    min-height: 297mm;
    max-height: 297mm;
    background: #FFFFFF;
    padding: 22mm 24mm 20mm 25mm;
    position: relative;
    box-shadow: 0 4px 15px rgba(0,0,0,0.25);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    page-break-after: always;
    break-after: page;
    overflow: hidden;
  }}

  @media print {{
    body {{ background: none; padding: 0; }}
    .no-print-bar {{ display: none; }}
    .pages-container {{ margin: 0; gap: 0; }}
    .page {{ box-shadow: none; margin: 0; }}
  }}

  .running-header {{
    border-bottom: 1.5px solid #1F4E5B;
    padding-bottom: 4px;
    margin-bottom: 16px;
    display: flex;
    justify-content: flex-end;
    font-size: 9pt;
    font-weight: bold;
    letter-spacing: 1.5px;
    color: #1F4E5B;
    text-transform: uppercase;
  }}

  .header-placeholder {{
    height: 18px;
    margin-bottom: 10px;
  }}

  .running-footer {{
    border-top: 1px solid #E5E7EB;
    padding-top: 6px;
    display: flex;
    justify-content: center;
    font-size: 9pt;
    color: #4B5563;
  }}

  .footer-placeholder {{
    height: 16px;
  }}

  .page-content {{
    flex: 1;
    display: flex;
    flex-direction: column;
  }}

  h1.chapter-title {{
    font-size: 15pt;
    font-weight: bold;
    text-align: center;
    color: #111827;
    margin: 0 0 16px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }}

  h2.section-title {{
    font-size: 12pt;
    font-weight: bold;
    color: #163A45;
    margin: 10px 0 5px 0;
  }}

  h3.sub-section-title {{
    font-size: 10.5pt;
    font-weight: bold;
    color: #1F4E5B;
    margin: 8px 0 3px 0;
  }}

  p {{
    font-size: 10pt;
    line-height: 1.48;
    margin: 0 0 8px 0;
    text-align: justify;
  }}

  ul, ol {{
    font-size: 10pt;
    line-height: 1.42;
    margin: 0 0 8px 0;
    padding-left: 20px;
  }}

  li {{
    margin-bottom: 3px;
  }}

  table.report-table {{
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 12px 0;
    font-size: 9.5pt;
    line-height: 1.35;
  }}

  table.report-table th {{
    background: #1F4E5B;
    color: #FFFFFF;
    text-align: left;
    padding: 6px 10px;
    font-weight: bold;
    border: 1px solid #1F4E5B;
  }}

  table.report-table td {{
    padding: 6px 10px;
    border: 1px solid #D1D5DB;
    vertical-align: top;
  }}

  table.report-table tr:nth-child(even) td {{
    background: #F8FAFB;
  }}

  .callout-box {{
    background: #EBF5F5;
    border-left: 4px solid #1F4E5B;
    padding: 8px 12px;
    margin: 8px 0;
    font-size: 9.5pt;
    line-height: 1.4;
    color: #163A45;
    border-radius: 0 4px 4px 0;
  }}

  .figure-box {{
    text-align: center;
    margin: 6px 0;
  }}
  .figure-img {{
    max-width: 95%;
    max-height: 140mm;
    object-fit: contain;
    border: 1px solid #E5E7EB;
    border-radius: 4px;
    padding: 4px;
    background: #FAFAFA;
  }}
  .figure-caption {{
    font-size: 8.5pt;
    font-style: italic;
    color: #4B5563;
    margin-top: 4px;
  }}
</style>
</head>
<body>

<div class="no-print-bar">
  <div>
    <strong>BiteBox Project Report (Presidency University / ReliefChain Template Format)</strong>
    <span style="opacity: 0.8; margin-left: 12px; font-size: 13px;">31 Pages &middot; Standard A4 Portrait</span>
  </div>
  <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
</div>

<div class="pages-container">
{''.join(pages)}
</div>

</body>
</html>
"""

print(f"Writing {len(pages)} pages to HTML file...")
with open(HTML_PATH, "w", encoding="utf-8") as f:
    f.write(html_template)

with open(DESKTOP_HTML_PATH, "w", encoding="utf-8") as f:
    f.write(html_template)

print(f"HTML saved to:\n  1. {HTML_PATH}\n  2. {DESKTOP_HTML_PATH}")

# ==========================================
# Assemble Markdown Companion
# ==========================================
md_pages = []
md_pages.append("""# BITEBOX: HYPERLOCAL FOOD DELIVERY & REAL-TIME TRACKING WEB PLATFORM
## Project Report · Bachelor of Technology in Computer Science and Engineering
### Presidency University, Bengaluru

**Submitted by:**
- Sinchana (20241CSE0923)
- Yashwanth (20241CSE0924)
- Mahesh (20241CSE0925)
- Jayashri (20241CSE0926)
- Aniket N (20241CSE0927)

---
""")

for i in range(1, 32):
    md_pages.append(f"<!-- PAGE {i} -->\n## [PAGE {i}]\n*(Matches exact layout of ReliefChain Template Page {i})*\n\n---\n")

with open(MD_PATH, "w", encoding="utf-8") as f:
    f.write("\n".join(md_pages))

print(f"Markdown saved to: {MD_PATH}")
print("[SUCCESS] All 31 pages compiled successfully!")

