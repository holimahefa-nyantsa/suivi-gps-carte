
const map = L.map('map').setView(
  [-18.8792, 47.5079], 13
);

L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
    attribution: '&copy; OpenStreetMap'
  }
).addTo(map);

// Variables GPS
let marker = null;
let circle = null;
let route = null;
let watchId = null;

let lastPosition = null;
let totalDistance = 0;
let routePoints = [];

let follow = true;

const status = document.getElementById('status');

// Calcul de distance entre deux coordonnées
function calculateDistance(a, b) {

  const R = 6371000;

  const rad = value => value * Math.PI / 180;

  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) *
    Math.cos(rad(b.lat)) *
    Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(
    Math.sqrt(x),
    Math.sqrt(1 - x)
  );
}

// Affichage distance
function displayDistance() {

  document.getElementById('distance').textContent =
    totalDistance >= 1000
      ? (totalDistance / 1000).toFixed(2) + ' km'
      : totalDistance.toFixed(1) + ' m';
}

// Démarrage GPS
document.getElementById('start').onclick = () => {

  if (!navigator.geolocation) {
    status.textContent = 'GPS non disponible';
    return;
  }

  if (watchId !== null) return;

  status.textContent = 'Recherche GPS...';

  watchId = navigator.geolocation.watchPosition(

    position => {

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      const current = {
        lat,
        lon,
        time: position.timestamp
      };

      // Coordonnées
      document.getElementById('lat').textContent =
        lat.toFixed(6);

      document.getElementById('lon').textContent =
        lon.toFixed(6);

      document.getElementById('accuracy').textContent =
        accuracy.toFixed(1) + ' m';

      const location = [lat, lon];

      // Marqueur GPS
      if (!marker) {
        marker = L.marker(location).addTo(map);
        marker.bindPopup('Position actuelle');
      } else {
        marker.setLatLng(location);
      }

      // Cercle de précision
      if (circle) map.removeLayer(circle);

      circle = L.circle(location, {
        radius: accuracy,
        color: '#1769aa',
        fillOpacity: 0.12
      }).addTo(map);

      // Carte
      if (follow) {
        if (routePoints.length === 0) {
          map.setView(location, 17);
        } else {
          map.panTo(location);
        }
      }

      // Qualité GPS
      if (accuracy > 50) {
        status.textContent =
          'Signal GPS imprécis : ' +
          accuracy.toFixed(0) + ' m';

        return;
      }

      status.textContent = 'GPS connecté - Bonne précision';

      // Premier point
      if (!lastPosition) {
        lastPosition = current;
        routePoints.push(location);

        route = L.polyline(routePoints, {
          color: '#1769aa',
          weight: 5
        }).addTo(map);

        return;
      }

      const distance = calculateDistance(
        lastPosition,
        current
      );

      const elapsed =
        (current.time - lastPosition.time) / 1000;

      // Eviter les sauts GPS aberrants
      if (distance > 500 || elapsed <= 0) {
        return;
      }

      // Calcul vitesse GPS
      let speed;

      if (position.coords.speed !== null &&
          position.coords.speed >= 0) {

        speed = position.coords.speed * 3.6;

      } else if (elapsed <= 120) {

        speed = distance / elapsed * 3.6;

      } else {

        speed = 0;
      }

      document.getElementById('speed').textContent =
        speed.toFixed(1) + ' km/h';

      // Distance
      if (distance >= 3) {

        totalDistance += distance;

        lastPosition = current;

        routePoints.push(location);

        route.addLatLng(location);

        displayDistance();

      } else {
        lastPosition = current;
      }

    },

    error => {

      status.textContent =
        'Erreur GPS : ' + error.message;

    },

    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 20000
    }
  );
};

// Arrêt GPS
document.getElementById('stop').onclick = () => {

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  status.textContent = 'GPS arrêté';
};

// Recentrage carte
document.getElementById('center').onclick = () => {

  if (marker) {
    follow = true;
    map.setView(marker.getLatLng(), 17);
  }
};
