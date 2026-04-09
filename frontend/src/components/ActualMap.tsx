"use client";
import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
 
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
 
// Only recenter once when suppliers first load — not on every poll cycle
function RecenterOnce({ coords }: { coords: [number, number] }) {
  const map = useMap();
  const hasRecentered = useRef(false);
 
  useEffect(() => {
    if (!hasRecentered.current && coords[0] !== 0 && coords[1] !== 0) {
      map.setView(coords, 3);
      hasRecentered.current = true;
    }
  }, [coords, map]);
  return null;
}
 
const getColoredIcon = (color: string) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
 
const getSupplierIcon = (status: string) => {
  if (status === 'BLOCKED' || status === 'DISRUPTED') return getColoredIcon('red');
  if (status === 'UNDER_REVIEW') return getColoredIcon('gold');
  return getColoredIcon('green');
};
 
const hqIcon = getColoredIcon('blue');
 
interface Supplier {
  id: string;
  name: string;
  lat: number | string;
  lng: number | string;
  status: string;
  current_price: number;
}
 
interface Props {
  suppliers?: Supplier[];
  hq?: { lat: number; lng: number };
}
 
export default function ActualMap({ suppliers = [], hq = { lat: 37.7749, lng: -122.4194 } }: Props) {
  const hqPos: [number, number] = [Number(hq.lat), Number(hq.lng)];
 
  const validSuppliers = suppliers
    .map((s) => ({ ...s, lat: Number(s.lat), lng: Number(s.lng) }))
    .filter((s) => {
      if (isNaN(s.lat) || isNaN(s.lng)) {
        console.warn(`[ActualMap] Skipping supplier "${s.name}" — invalid coords:`, s.lat, s.lng);
        return false;
      }
      return true;
    });
 
  return (
    <MapContainer
      center={hqPos}
      zoom={3}
      style={{ height: '100%', width: '100%' }}
      // Prevents the map from being recreated when parent re-renders
      key="valor-map"
    >
      <TileLayer
        attribution="&copy; CARTO"
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
 
      <RecenterOnce coords={hqPos} />
 
      {/* HQ Marker */}
      <Marker position={hqPos} icon={hqIcon}>
        <Popup>
          <div className="text-zinc-900">
            <strong>Corporate HQ</strong>
          </div>
        </Popup>
      </Marker>
 
      {/* Supplier Markers — rendered from CSV lat/lng */}
      {validSuppliers.map((s, idx) => {
        const pos: [number, number] = [s.lat, s.lng];
        const isBroken = s.status === 'BLOCKED' || s.status === 'DISRUPTED';
 
        return (
          <React.Fragment key={s.id || idx}>
            <Marker position={pos} icon={getSupplierIcon(s.status)}>
              <Popup>
                <div className="text-zinc-900">
                  <strong className="text-base">{s.name}</strong>
                  <br />
                  <span className="text-xs text-zinc-500 uppercase font-bold">Status:</span>
                  <span className={`ml-1 font-medium ${isBroken ? 'text-red-600' : 'text-green-600'}`}>
                    {s.status}
                  </span>
                  <br />
                  <span className="text-xs text-zinc-500 uppercase font-bold">Price:</span>
                  <span className="ml-1">${s.current_price}</span>
                  <br />
                  <span className="text-xs text-zinc-400">
                    {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
                  </span>
                </div>
              </Popup>
            </Marker>
 
            <Polyline
              positions={[hqPos, pos]}
              pathOptions={{
                color: isBroken ? '#ef4444' : '#06b6d4',
                dashArray: isBroken ? '10, 10' : '5, 5',
                weight: isBroken ? 2 : 1,
                opacity: 0.35,
              }}
            />
          </React.Fragment>
        );
      })}
    </MapContainer>
  );
}