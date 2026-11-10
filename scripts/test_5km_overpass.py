import urllib.request
import urllib.parse
import json
import math

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return 2 * R * math.asin(math.sqrt(a))

endpoints = [
    'https://overpass.openstreetmap.fr/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
]

# Test Presidency University (13.1693, 77.5348)
lat, lng = 13.1693, 77.5348
safeRadius = 5.0
deltaLat = safeRadius / 111.0
deltaLng = safeRadius / (111.0 * math.cos(math.radians(lat)))
minLat = round(lat - deltaLat, 4)
maxLat = round(lat + deltaLat, 4)
minLng = round(lng - deltaLng, 4)
maxLng = round(lng + deltaLng, 4)

query = f'[out:json][timeout:10];(node["amenity"~"^(restaurant|fast_food|cafe)$"]({minLat},{minLng},{maxLat},{maxLng});way["amenity"~"^(restaurant|fast_food|cafe)$"]({minLat},{minLng},{maxLat},{maxLng}););out center tags;'

success = False
for ep in endpoints:
    print(f"Trying endpoint: {ep}")
    try:
        req = urllib.request.Request(
            ep, 
            data=f'data={urllib.parse.quote(query)}'.encode('utf-8'), 
            headers={'User-Agent': 'BiteBox/1.0 (prototype)'}
        )
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            elements = data.get('elements', [])
            print(f"Success! Elements received: {len(elements)}")
            valid = []
            for el in elements:
                tags = el.get('tags', {})
                name = tags.get('name', '').strip()
                if not name: continue
                elat = el.get('lat') or (el.get('center', {}).get('lat'))
                elng = el.get('lon') or (el.get('center', {}).get('lon'))
                if elat is None or elng is None: continue
                dist = haversine(lat, lng, elat, elng)
                if dist <= 5.0:
                    valid.append((name, round(dist, 2), tags.get('cuisine', tags.get('amenity', 'restaurant'))))
            print(f"Valid named restaurants strictly within 5.0 km: {len(valid)}")
            for v in valid[:10]:
                print(f"   * {v[0]} ({v[1]} km) - {v[2]}")
            success = True
            break
    except Exception as e:
        print(f"Failed with {ep}: {e}")
