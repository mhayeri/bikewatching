// Import Mapbox and D3 as ES modules
import mapboxgl from 'https://cdn.jsdelivr.net/npm/mapbox-gl@2.15.0/+esm';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Public Mapbox token (pk.*): safe to ship in client code
mapboxgl.accessToken = 'pk.eyJ1IjoibXVoYXllcmkiLCJhIjoiY213YmVqMzUzMDBzczJ4cG53bTdhcG9udSJ9.d6rxsqoNMbiEWKAwerPgtA';

// Initialize the map
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-71.09415, 42.36027], // [longitude, latitude], near MIT
  zoom: 12,
  minZoom: 5,
  maxZoom: 18,
});

const TRIPS_URL =
  'https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv';
const STATIONS_URL =
  'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';

const BOSTON_LANES_URL =
  'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson';
const CAMBRIDGE_LANES_URL =
  'https://raw.githubusercontent.com/cambridgegis/cambridgegis_data/main/Recreation/Bike_Facilities/RECREATION_BikeFacilities.geojson';

// One shared style for both bike-lane layers (Mapbox does not accept oklch())
const bikeLaneStyle = {
  'line-color': '#32D400',
  'line-width': 3,
  'line-opacity': 0.5,
};

function computeStationTraffic(stations, trips) {
  const departures = d3.rollup(
    trips,
    (v) => v.length,
    (d) => d.start_station_id,
  );
  const arrivals = d3.rollup(
    trips,
    (v) => v.length,
    (d) => d.end_station_id,
  );
  return stations.map((station) => {
    const id = station.short_name;
    const a = arrivals.get(id) ?? 0;
    const dep = departures.get(id) ?? 0;
    return { ...station, arrivals: a, departures: dep, totalTraffic: a + dep };
  });
}

// Convert a station's lon/lat to pixel coordinates on the current map view
function getCoords(station) {
  const point = new mapboxgl.LngLat(+station.lon, +station.lat);
  const { x, y } = map.project(point);
  return { cx: x, cy: y };
}

map.on('load', async () => {
  // Step 2: bike lanes
  map.addSource('boston_route', { type: 'geojson', data: BOSTON_LANES_URL });
  map.addLayer({
    id: 'boston-bike-lanes',
    type: 'line',
    source: 'boston_route',
    paint: bikeLaneStyle,
  });

  map.addSource('cambridge_route', {
    type: 'geojson',
    data: CAMBRIDGE_LANES_URL,
  });
  map.addLayer({
    id: 'cambridge-bike-lanes',
    type: 'line',
    source: 'cambridge_route',
    paint: bikeLaneStyle,
  });

  // Step 3: stations as SVG circles on top of the map
  let jsonData;
  try {
    jsonData = await d3.json(STATIONS_URL);
    console.log('Loaded JSON Data:', jsonData);
  } catch (error) {
    console.error('Error loading JSON:', error);
    return;
  }
  const trips = await d3.csv(TRIPS_URL);
  console.log('Loaded trips:', trips.length);

  const stations = computeStationTraffic(jsonData.data.stations, trips);
  console.log('Stations with traffic:', stations);

  // Square root scale: circle AREA, not radius, encodes traffic
  const radiusScale = d3
    .scaleSqrt()
    .domain([0, d3.max(stations, (d) => d.totalTraffic)])
    .range([0, 25]);

  const svg = d3.select('#map').select('svg');

  const circles = svg
    .selectAll('circle')
    .data(stations, (d) => d.short_name)
    .join('circle')
    .attr('r', (d) => radiusScale(d.totalTraffic))
    .each(function (d) {
      d3.select(this)
        .append('title')
        .text(
          `${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`,
        );
    });

  function updatePositions() {
    circles
      .attr('cx', (d) => getCoords(d).cx)
      .attr('cy', (d) => getCoords(d).cy);
  }

  updatePositions();
  map.on('move', updatePositions);
  map.on('zoom', updatePositions);
  map.on('resize', updatePositions);
  map.on('moveend', updatePositions);
});
