import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const h = React.createElement;

export default function LeafletMap(props) {
  const { markers } = props;
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([20.5937, 78.9629], 4.3);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(mapInstanceRef.current);
    }
    const map = mapInstanceRef.current;
    const layerGroup = L.layerGroup().addTo(map);
    (markers || []).forEach((m) => {
      const marker = L.marker([m.lat, m.lng]).addTo(layerGroup);
      marker.bindPopup(`<strong>${m.name || 'Sample'}</strong><br/>HPI: ${m.HPI}`);
    });
    return () => { map.removeLayer(layerGroup); };
  }, [markers]);

  return h('div', { ref: mapRef, style: { height: '320px', borderRadius: '12px', overflow: 'hidden' } });
}