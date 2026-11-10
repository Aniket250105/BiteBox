import urllib.request
import json

# 1. Login to get token (using identifier)
login_data = json.dumps({'identifier': 'aniket@bitebox.com', 'password': 'password123'}).encode('utf-8')
req = urllib.request.Request('http://localhost:3001/api/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as resp:
    token = json.loads(resp.read().decode('utf-8'))['token']

# 2. Query nearby with radiusKm=5 at Presidency University (13.1693, 77.5348)
nearby_req = urllib.request.Request('http://localhost:3001/api/restaurants/nearby?lat=13.1693&lng=77.5348&radiusKm=5', headers={'Authorization': f'Bearer {token}'})
with urllib.request.urlopen(nearby_req) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    print(f"Total nearby restaurants returned (5km): {len(data.get('restaurants', []))}")
    print(f"Source: {data.get('source')}")
    print(f"Notice: {data.get('notice')}")
    for r in data.get('restaurants', []):
        print(f" * {r.get('name')} | {r.get('distanceText')} | {r.get('cuisine')} | Rating: {r.get('rating')} | Open: {r.get('isOpen')}")
