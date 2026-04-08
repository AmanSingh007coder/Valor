"use client";
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map Supplier IDs to Coordinates (since your JSON doesn't have them yet)
const POSITIONS: Record<string, [number, number]> = {
  "HQ": [37.7749, -122.4194],
  "SUPPLIER_A": [34.0522, -118.2437], // LA
  "SUPPLIER_B": [47.6062, -122.3321], // Seattle
};

const getIcon = (status: string) => {
  const url = status === "BLOCKED" || status === "DISRUPTED" 
    ? 'marker-icon-2x-red.png' 
    : status === "UNDER_REVIEW" ? 'marker-icon-2x-yellow.png' : 'marker-icon-2x-green.png';
  
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/${url}`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
  });
};

export default function ActualMap({ suppliers = [] }: { suppliers: any[] }) {
  const hqPos = POSITIONS["HQ"];

  return (
    <MapContainer center={[39.8283, -98.5795]} zoom={4} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      
      <Marker position={hqPos} icon={new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', iconSize: [25, 41] })}>
        <Popup>Valor HQ (Command Center)</Popup>
      </Marker>

      {suppliers.map((s) => {
        const pos = POSITIONS[s.id] || [0,0];
        const isBroken = s.status === "BLOCKED" || s.status === "DISRUPTED";
        
        return (
          <React.Fragment key={s.id}>
            <Marker position={pos} icon={getIcon(s.status)}>
              <Popup>
                <strong>{s.name}</strong> <br/> 
                Status: {s.status} <br/>
                Price: ${s.current_price}
              </Popup>
            </Marker>
            <Polyline 
              positions={[hqPos, pos]} 
              pathOptions={{ 
                color: isBroken ? '#ef4444' : '#06b6d4', 
                dashArray: isBroken ? '10, 10' : '5, 5',
                weight: isBroken ? 3 : 2
              }} 
            />
          </React.Fragment>
        );
      })}
    </MapContainer>
  );
}