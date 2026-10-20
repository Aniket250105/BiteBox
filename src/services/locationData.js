// Preset delivery locations and road-aligned waypoints for Bengaluru

export const PRESET_LOCATIONS = [
  {
    id: 'presidency',
    name: 'Presidency University',
    address: 'Presidency University, Itgalpur, Rajanakunte, Bengaluru',
    coords: [13.1693, 77.5348],
    restaurantCoords: [13.1585, 77.5385],
    waypoints: [
      [13.1585, 77.5385], // Restaurant (Doddaballapur Rd)
      [13.1615, 77.5375], // Doddaballapur Main Rd
      [13.1645, 77.5360], // Rajanakunte Junction
      [13.1670, 77.5352], // Campus approach road
      [13.1693, 77.5348]  // Presidency University Main Gate
    ]
  },
  {
    id: 'indiranagar',
    name: 'Indiranagar 100ft Rd',
    address: '12th Main, Defence Colony, Indiranagar, Bengaluru',
    coords: [12.9830, 77.6350],
    restaurantCoords: [12.9719, 77.6412],
    waypoints: [
      [12.9719, 77.6412], // 100 Feet Rd, near 12th Main (Restaurant)
      [12.9752, 77.6411], // 100 Feet Rd north
      [12.9782, 77.6409], // CMH Rd junction
      [12.9784, 77.6360], // CMH Road
      [12.9786, 77.6315], // 80 Feet Rd junction
      [12.9818, 77.6318], // 80 Feet Rd
      [12.9830, 77.6350]  // Defence Colony, Indiranagar
    ]
  },
  {
    id: 'koramangala',
    name: 'Koramangala 4th Block',
    address: '4th Block, 17th Main Rd, Koramangala, Bengaluru',
    coords: [12.9345, 77.6265],
    restaurantCoords: [12.9260, 77.6210],
    waypoints: [
      [12.9260, 77.6210], // 80 Feet Rd, 5th Block (Restaurant)
      [12.9290, 77.6235], // Sony World Junction
      [12.9320, 77.6250], // 100 Feet Rd Koramangala
      [12.9345, 77.6265]  // 4th Block Residence
    ]
  },
  {
    id: 'mgroad',
    name: 'MG Road / Church St',
    address: 'Church Street, near MG Road Metro, Bengaluru',
    coords: [12.9755, 77.6050],
    restaurantCoords: [12.9690, 77.6110],
    waypoints: [
      [12.9690, 77.6110], // Residency Rd (Restaurant)
      [12.9715, 77.6095], // Brigade Rd Junction
      [12.9740, 77.6075], // MG Road Metro
      [12.9755, 77.6050]  // Church Street Destination
    ]
  }
];

export function generateRouteWaypoints(destLat, destLng) {
  const restLat = destLat - 0.011;
  const restLng = destLng - 0.009;
  return [
    [restLat, restLng],
    [restLat + 0.003, restLng],
    [restLat + 0.006, restLng + 0.002],
    [restLat + 0.006, restLng + 0.006],
    [restLat + 0.009, restLng + 0.006],
    [destLat, destLng]
  ];
}
