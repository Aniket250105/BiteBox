import sqlite3

for db_name in ['bitebox.db', 'bitebox.test.db', 'bitebox.verify.db']:
    try:
        conn = sqlite3.connect(db_name)
        c = conn.cursor()
        c.execute("UPDATE menu_items SET image_url = '/dishes/garlic_bread.jpg' WHERE image_url LIKE '%1573140247632%'")
        conn.commit()
        print(f"{db_name}: successfully updated {c.rowcount} rows in menu_items")
        conn.close()
    except Exception as e:
        print(f"{db_name}: error {e}")
