// Import Mapbox and D3 as ES modules
import mapboxgl from 'https://cdn.jsdelivr.net/npm/mapbox-gl@2.15.0/+esm';

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

console.log('Mapbox GL JS Loaded:', mapboxgl);
