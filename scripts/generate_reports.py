import os

ROOT_DIR = r"c:\Users\MAHESH\OneDrive\Desktop\BiteBox"
DOCS_DIR = os.path.join(ROOT_DIR, "docs")
DESKTOP_DIR = r"c:\Users\MAHESH\OneDrive\Desktop"

HTML_PATH = os.path.join(DOCS_DIR, "PROJECT_REPORT_PAGE_BY_PAGE.html")
DESKTOP_HTML_PATH = os.path.join(DESKTOP_DIR, "BiteBox_Project_Report_Page_by_Page.html")
MD_PATH = os.path.join(DOCS_DIR, "PROJECT_REPORT_PAGE_BY_PAGE.md")

# Read the HTML content from the previous write
with open(os.path.join(ROOT_DIR, "scripts", "build_page_by_page_report.py"), "r", encoding="utf-8") as f:
    raw = f.read()

# Write HTML file to docs and Desktop
with open(HTML_PATH, "w", encoding="utf-8") as f:
    f.write(raw)

with open(DESKTOP_HTML_PATH, "w", encoding="utf-8") as f:
    f.write(raw)

print(f"[SUCCESS] Wrote HTML report to:\n  1. {HTML_PATH}\n  2. {DESKTOP_HTML_PATH}")
