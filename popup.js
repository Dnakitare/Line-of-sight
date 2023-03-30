var map;
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 37.7749, lng: -122.4194 },
    zoom: 12,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

function getElevationData(path) {
  const elevator = new google.maps.ElevationService();
  elevator.getElevationAlongPath(
    {
      path: path,
      samples: 256
    },
    (results, status) => {
      if (status === "OK") {
        // Process the elevation data
      } else {
        console.log("Elevation service failed due to: " + status);
      }
    }
  );
}

function checkLineOfSight(start, end, elevationData) {
  const distance = calculateDistance(
    start.lat(),
    start.lng(),
    end.lat(),
    end.lng()
  );
  const maxElevationDifference = distance * Math.tan(1 / 60); // Assume a 1 arc-minute obstruction limit
  for (let i = 0; i < elevationData.length - 1; i++) {
    const elevation1 = elevationData[i].elevation;
    const elevation2 = elevationData[i + 1].elevation;
    const elevationDifference = Math.abs(elevation2 - elevation1);
    if (elevationDifference > maxElevationDifference) {
      return false;
    }
  }
  return true;
}

let markers = [];
google.maps.event.addListener(map, "click", event => {
  if (markers.length === 2) {
    markers[0].setMap(null);
    markers[1].setMap(null);
    markers = [];
  }
  const marker = new google.maps.Marker({
    position: event.latLng,
    map: map,
    draggable: true
  });
  markers.push(marker);
});

let polyline;
function updatePolyline() {
  if (polyline) {
    polyline.setMap(null);
  }
  if (markers.length === 2) {
    const path = [markers[0].getPosition(), markers[1].getPosition()];
    polyline = new google.maps.Polyline({
      path: path,
      strokeColor: "#FF0000",
      strokeOpacity: 1.0,
      strokeWeight: 2
    });
    polyline.setMap(map);
  }
}
google.maps.event.addListener(map, "click", event => {
  // Add marker code here...
  updatePolyline();
});

function updateLineOfSight() {
  if (markers.length === 2) {
    const start = markers[0].getPosition();
    const end = markers[1].getPosition();
    const path = [start, end];
    getElevationData(path);
    const result = checkLineOfSight(start, end, []);
    const output = document.getElementById("output");
    if (result) {
      output.innerText = "Clear line of sight";
    } else {
      output.innerText = "Obstruction in the line of sight";
    }
  }
}
markers.forEach(marker => {
  google.maps.event.addListener(marker, "click", () => {
    marker.setMap(null);
    markers.splice(markers.indexOf(marker), 1);
    updatePolyline();
    updateLineOfSight();
  });
  google.maps.event.addListener(marker, "dragend", () => {
    updatePolyline();
    updateLineOfSight();
  });
});
google.maps.event.addListener(map, "click", event => {
  if (markers.length < 2) {
    const marker = new google.maps.Marker({
      position: event.latLng,
      map: map,
      draggable: true
    });
    markers.push(marker);
    updatePolyline();
    updateLineOfSight();
  }
});
