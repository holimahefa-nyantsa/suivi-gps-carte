
const map = L.map('map').setView(
  [-18.8792, 47.5079], 13
);

L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
    attribution: '&copy; OpenStreetMap'
  }
).addTo(map);

let marker = null;
let accuracyCircle = null;
let watchId = null;

const status = document.getElementById('status');

document.getElementById('start').onclick = () => {

  if (!navigator.geolocation) {
    status.textContent = "GPS non disponible";
    return;
  }

  if (watchId !== null) return;

  status.textContent = "Recherche GPS...";

  watchId = navigator.geolocation.watchPosition(
    (position) => {

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      document.getElementById('lat').textContent =
        lat.toFixed(6);

      document.getElementById('lon').textContent =
        lon.toFixed(6);

      document.getElementById('accuracy').textContent =
        accuracy.toFixed(1) + " m";

      const location = [lat, lon];

      if (marker === null) {
        marker = L.marker(location).addTo(map);
        marker.bindPopup("Ma position actuelle");
      } else {
        marker.setLatLng(location);
      }

      if (accuracyCircle !== null) {
        map.removeLayer(accuracyCircle);
      }

      accuracyCircle = L.circle(location, {
        radius: accuracy
      }).addTo(map);

      map.setView(location, 17);

      status.textContent = "GPS connecté";
    },

    (error) => {
      status.textContent =
        "Erreur GPS : " + error.message;
    },

    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 20000
    }
  );
};

document.getElementById('stop').onclick = () => {

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  status.textContent = "GPS arrêté";
};
