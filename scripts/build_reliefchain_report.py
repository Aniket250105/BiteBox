import os
import base64

ROOT_DIR = r"c:\Users\MAHESH\OneDrive\Desktop\BiteBox"
DOCS_DIR = os.path.join(ROOT_DIR, "docs")
DESKTOP_DIR = r"c:\Users\MAHESH\OneDrive\Desktop"

HTML_PATH = os.path.join(DOCS_DIR, "PROJECT_REPORT_RELIEFCHAIN_TEMPLATE.html")
DESKTOP_HTML_PATH = os.path.join(DESKTOP_DIR, "BiteBox_Project_Report.html")
MD_PATH = os.path.join(DOCS_DIR, "PROJECT_REPORT_RELIEFCHAIN_TEMPLATE.md")

# Helper to read image as base64 data URI so desktop file is 100% self-contained
def get_image_data_uri(rel_path):
    full_path = os.path.join(ROOT_DIR, rel_path)
    if os.path.exists(full_path):
        ext = os.path.splitext(full_path)[1].lower()
        mime = "image/png" if ext == ".png" else "image/jpeg"
        with open(full_path, "rb") as f:
            encoded = base64.b64encode(f.read()).decode("utf-8")
            return f"data:{mime};base64,{encoded}"
    return rel_path

print("Preparing embedded diagram and screenshot assets...")
arch_diag = get_image_data_uri("docs/architecture_diagram.png")
usecase_diag = get_image_data_uri("docs/usecase_diagram.png")
activity_diag = get_image_data_uri("docs/activity_diagram.png")

img_login = get_image_data_uri("docs/verification-screenshots/screen_login_360px_light.png")
img_discover = get_image_data_uri("docs/verification-screenshots/screen_discover_360px_light.png")
img_menu = get_image_data_uri("docs/verification-screenshots/screen_menu_360px_light.png")
img_cart = get_image_data_uri("docs/verification-screenshots/screen_cart_360px_light.png")
img_payment = get_image_data_uri("docs/verification-screenshots/screen_payment_360px_light.png")
img_tracking = get_image_data_uri("docs/verification-screenshots/screen_tracking_360px_light.png")
img_partner = get_image_data_uri("docs/verification-screenshots/FR8.1.png")

print("Assets ready. Compiling 31-page academic document matching ReliefChain template...")
