import urllib.request, urllib.parse, json, math

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return 2 * R * math.asin(math.sqrt(a))

for name, lat, lng in [("Indiranagar", 12.9830, 77.6350), ("Koramangala", 12.9345, 77.6265)]:
    safeRadius = 5.0
    deltaLat = safeRadius / 111.0
    deltaLng = safeRadius / (111.0 * math.cos(math.radians(lat)))
    minLat = round(lat - deltaLat, 4)
    maxLat = round(lat + deltaLat, 4)
    minLng = round(lng - deltaLng, 4)
    maxLng = round(lng + deltaLng, 4)

    query = f'[out:json][timeout:10];(node["amenity"~"^(restaurant|fast_food|cafe)$"]({minLat},{minLng},{maxLat},{maxLng});way["amenity"~"^(restaurant|fast_food|cafe)$"]({minLat},{minLng},{maxLat},{maxLng}););out center tags;'
    req = urllib.request.Request(
        'https://overpass.openstreetmap.fr/api/interpreter', 
        data=f'data={urllib.parse.quote(query)}'.encode('utf-8'), 
        headers={'User-Agent': 'BiteBox/1.0 (prototype)'}
    )
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            elements = data.get('elements', [])
            valid = []
            for el in elements:
                tags = el.get('tags', {})
                n = tags.get('name', '').strip()
                if not n: continue
                elat = el.get('lat') or (el.get('center', {}).get('lat'))
                elng = el.get('lon') or (el.get('center', {}).get('lon'))
                if elat is None or elng is None: continue
                dist = haversine(lat, lng, elat, elng)
                if dist <= 5.0:
                    valid.append((n, round(dist, 2), tags.get('cuisine', tags.get('amenity', 'restaurant'))))
            print(f"[{name}] {len(valid)} restaurants within 5.0 km:")
            for v in valid[:6]:
                print(f"   * {v[0]} ({v[1]} km) - {v[2]}")
    except Exception as e:
        print(f"[{name}] Error: {e}")
