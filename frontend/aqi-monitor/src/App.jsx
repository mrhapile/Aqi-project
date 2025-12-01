import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import axios from "axios";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from 'leaflet';

// Fix for default marker icon in Leaflet with Vite/Webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function App() {
  const [stations, setStations] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:3000/stations")
      .then(res => setStations(res.data))
      .catch(err => console.error("Error fetching stations:", err));
  }, []);

  return (
    <MapContainer center={[28.6, 77.2]} zoom={10} style={{ height: "100vh", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {stations.map(s => (
        <Marker key={s.id} position={[s.lat, s.lon]}>
          <Popup>
            <strong>{s.name}</strong><br />
            Lat: {s.lat}<br />
            Lon: {s.lon}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default App;
