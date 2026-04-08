"use client";
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const customGreenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const customRedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const customBlueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface ActualMapProps {
  disasterActive?: boolean;
}

export default function ActualMap({ disasterActive = false }: ActualMapProps) {
  const hqPos: [number, number] = [37.7749, -122.4194]; // SF
  const supplier1Pos: [number, number] = [34.0522, -118.2437]; // LA
  const supplier2Pos: [number, number] = [47.6062, -122.3321]; // Seattle

  const polylineOptionsActive = { color: 'blue', weight: 3, dashArray: '5, 5' };
  const polylineOptionsBroken = { color: 'red', weight: 4, dashArray: '10, 10' };
  
  return (
    <MapContainer center={[39.8283, -98.5795]} zoom={4} style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      
      <Marker position={hqPos} icon={customBlueIcon}>
        <Popup>Nexus HQ</Popup>
      </Marker>
      
      <Marker position={supplier1Pos} icon={disasterActive ? customRedIcon : customGreenIcon}>
        <Popup>Primary Supplier A <br/> {disasterActive ? 'Status: FAILED' : 'Status: ACTIVE'}</Popup>
      </Marker>

      <Marker position={supplier2Pos} icon={disasterActive ? customGreenIcon : customGreenIcon}>
        <Popup>Backup Supplier B <br/> {disasterActive ? 'Status: ACTIVE' : 'Status: STANDBY'}</Popup>
      </Marker>
      
      <Polyline positions={[hqPos, supplier1Pos]} pathOptions={disasterActive ? polylineOptionsBroken : polylineOptionsActive} />
      {disasterActive && (
        <Polyline positions={[hqPos, supplier2Pos]} pathOptions={polylineOptionsActive} />
      )}
    </MapContainer>
  );
}
