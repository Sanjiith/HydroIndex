import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
    
    // Clear existing markers
    layerGroup.clearLayers();
    
    (markers || []).forEach((m) => {
      // Create custom colored icon based on HMPI value
      const getColor = (hmpi) => {
        if (hmpi >= 200) return 'red';
        if (hmpi >= 100) return 'orange';
        return 'green';
      };
      
      const markerColor = m.color || getColor(m.HMPI || m.HPI || 0);
      
      // Create custom icon with color
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          background-color: ${markerColor};
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      
      const marker = L.marker([m.lat, m.lng], { icon: customIcon }).addTo(layerGroup);
      
      // Use HMPI if available, otherwise fallback to HPI
      const hmpiValue = m.HMPI || m.HPI || 0;
      const status = hmpiValue >= 200 ? 'Critical' : hmpiValue >= 100 ? 'Moderate' : 'Safe';
      
      marker.bindPopup(`
        <div style="min-width: 200px;">
          <strong>${m.name || 'Sample'}</strong><br/>
          HMPI: ${hmpiValue.toFixed(2)}<br/>
          Status: <span style="color: ${markerColor}; font-weight: bold;">${status}</span><br/>
          Coordinates: ${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}
        </div>
      `);
    });
    
    // Fit map to show all markers if there are any
    if (markers && markers.length > 0) {
      const group = new L.featureGroup(markers.map(m => L.marker([m.lat, m.lng])));
      map.fitBounds(group.getBounds().pad(0.1));
    }
    
    return () => { 
      map.removeLayer(layerGroup); 
    };
  }, [markers]);

  return h('div', { 
    ref: mapRef, 
    style: { 
      height: '400px', 
      borderRadius: '12px', 
      overflow: 'hidden',
      background: '#f8f9fa'
    } 
  });
}