"use client";
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

function RecenterMap({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(coords, map.getZoom()); }, [coords, map]);
  return null;
}

const createLabelIcon = (name: string, status: string) => {
  const shortName = name.split(' ')[0]; // Get "Hitachi" from "Hitachi Industrial Supply"
  let colorClass = 'bg-emerald-500';
  if (status.includes('Labor') || status === 'BLOCKED') colorClass = 'bg-red-500';
  if (status.includes('Price') || status.includes('Weather')) colorClass = 'bg-yellow-500';

  return L.divIcon({
    className: 'custom-label',
    html: `
      <div class="flex flex-col items-center">
        <div class="px-2 py-0.5 rounded text-[9px] font-bold text-black ${colorClass} shadow-lg whitespace-nowrap uppercase tracking-tighter">
          ${shortName}
        </div>
        <div class="w-2 h-2 rounded-full ${colorClass} border border-white mt-1 animate-pulse"></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

export default function ActualMap({ suppliers = [], hq = { lat: 37.7749, lng: -122.4194 } }: { suppliers: any[], hq?: any }) {
  const hqPos: [number, number] = [hq.lat, hq.lng];

  return (
    <MapContainer center={hqPos} zoom={3} style={{ height: '100%', width: '100%' }} zoomControl={false}>
      <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      <RecenterMap coords={hqPos} />

      {/* HQ Marker */}
      <Marker position={hqPos} icon={L.divIcon({ 
        className: 'hq-label', 
        html: `<div class="bg-cyan-500 p-1 rounded-sm text-[8px] font-black text-black">VALOR_HQ</div>`, 
        iconSize: [40, 20] 
      })}>
        <Popup><b className="text-black">Corporate HQ</b></Popup>
      </Marker>

      {suppliers.map((s, idx) => {
        const lat = Number(s.lat);
        const lng = Number(s.lng);
        if (isNaN(lat) || isNaN(lng)) return null;
        
        const pos: [number, number] = [lat, lng];
        const isBroken = s.status !== "OPERATIONAL";
        
        return (
          <React.Fragment key={s.id || idx}>
            <Marker position={pos} icon={createLabelIcon(s.name, s.status)} />
            <Polyline 
              positions={[hqPos, pos]} 
              pathOptions={{ 
                color: isBroken ? '#f43f5e' : '#06b6d4', 
                dashArray: '5, 10', 
                weight: 1, 
                opacity: 0.2 
              }} 
            />
          </React.Fragment>
        );
      })}
    </MapContainer>
  );
}