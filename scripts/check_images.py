import sqlite3

conn = sqlite3.connect('bitebox.db')
c = conn.cursor()
c.execute("SELECT name, image_url FROM menu_items WHERE name LIKE '%Garlic Bread%' OR name LIKE '%Baguette%' LIMIT 6")
for row in c.fetchall():
    print(f"Dish: {row[0]} -> Image: {row[1]}")
conn.close()
