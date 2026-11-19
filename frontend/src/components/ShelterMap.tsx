import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { SHELTER_SITES } from "../shelterSites";

export function ShelterMap() {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const map = L.map(el.current!, { scrollWheelZoom: false });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    // Circle markers: Leaflet's default pin images break under bundlers.
    const markers = SHELTER_SITES.map((s) =>
      L.circleMarker([s.lat, s.lng], { radius: 9, color: "#234d3b", weight: 2, fillColor: "#2c5f48", fillOpacity: 0.85 })
        .bindPopup(`<strong>${s.name}</strong><br>${s.crisis}<br>${s.persons} Personen untergebracht`)
        .addTo(map),
    );
    map.fitBounds(L.featureGroup(markers).getBounds().pad(0.2));
    return () => { map.remove(); };
  }, []);

  return <div ref={el} className="map" role="region" aria-label="Karte der Notunterkünfte" />;
}
