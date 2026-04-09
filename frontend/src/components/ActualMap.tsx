"use client";
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap, SVGOverlay } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
 
function RecenterMap({ coords }: { coords: [number, number] }) {
  const map = useMap();
  const hasInitialized = React.useRef(false);

  useEffect(() => {
    // Only set view once on initial load, don't recenter on data updates
    if (!hasInitialized.current) {
      map.setView(coords, map.getZoom());
      hasInitialized.current = true;
    }
  }, []); // Empty dependency array - only run once

  return null;
}
 
/* ─────────────────────────────────────────────────────────────────
   Supplier node icon:
   - Supplier name label above the dot
   - Glowing gradient dot (gold/amber shimmer for active, muted for inactive)
   - Ripple ring when active
───────────────────────────────────────────────────────────────── */
const createSupplierIcon = (
  name: string,
  status: string,
  isActive: boolean,
  tier?: string
) => {
  const hasProblem =
    status?.includes('RISK') ||
    status?.includes('VIOLATION') ||
    status?.includes('GOUGING') ||
    status?.includes('BLOCKED');
 
  // Color palette per tier / state
  let gradStop1: string;
  let gradStop2: string;
  let glowColor: string;
 
  if (hasProblem) {
    gradStop1 = '#ff6b6b';
    gradStop2 = '#c0392b';
    glowColor = 'rgba(239,68,68,0.65)';
  } else if (isActive) {
    // Golden shimmer for the active supplier
    gradStop1 = '#ffe066';
    gradStop2 = '#f59e0b';
    glowColor = 'rgba(245,158,11,0.7)';
  } else if (tier === 'primary') {
    gradStop1 = '#6ee7b7';
    gradStop2 = '#10b981';
    glowColor = 'rgba(16,185,129,0.45)';
  } else if (tier === 'secondary') {
    gradStop1 = '#fde68a';
    gradStop2 = '#f59e0b';
    glowColor = 'rgba(245,158,11,0.4)';
  } else if (tier === 'tertiary') {
    gradStop1 = '#fed7aa';
    gradStop2 = '#f97316';
    glowColor = 'rgba(249,115,22,0.4)';
  } else {
    gradStop1 = '#94a3b8';
    gradStop2 = '#475569';
    glowColor = 'rgba(148,163,184,0.2)';
  }
 
  const dotSize  = isActive ? 15 : 10;
  const ringSize = isActive ? 30 : 20;
  const uid      = `vg_${Math.random().toString(36).slice(2,7)}`;
  const shortName = name.length > 15 ? name.slice(0, 14) + '…' : name;
 
  const ripple = isActive
    ? `@keyframes vrip_${uid}{0%{transform:scale(1);opacity:0.55}100%{transform:scale(2.6);opacity:0}}`
    : '';
  const shimmer = isActive
    ? `@keyframes vshine_${uid}{0%,100%{opacity:1}50%{opacity:0.7}}`
    : '';
 
  const html = `
    <style>
      ${ripple}
      ${shimmer}
      .vn_${uid}{display:flex;flex-direction:column;align-items:center;gap:4px}
      .vl_${uid}{
        background:rgba(6,11,21,0.85);
        border:1px solid rgba(255,255,255,${isActive?'0.16':'0.07'});
        border-radius:5px;
        padding:2px 7px;
        font-size:10px;
        font-weight:700;
        font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;
        color:${isActive?'#ffe066':'#c8dff5'};
        letter-spacing:0.03em;
        white-space:nowrap;
        backdrop-filter:blur(8px);
        ${isActive?'box-shadow:0 0 8px rgba(245,158,11,0.3);':''}
      }
      .vw_${uid}{position:relative;display:flex;align-items:center;justify-content:center}
      .vr_${uid}{
        position:absolute;
        width:${ringSize}px;height:${ringSize}px;
        border-radius:50%;
        background:${glowColor};
        ${isActive?`animation:vrip_${uid} 1.9s ease-out infinite;`:''}
      }
      .vd_${uid}{
        width:${dotSize}px;height:${dotSize}px;
        border-radius:50%;
        background:radial-gradient(circle at 32% 30%, ${gradStop1} 0%, ${gradStop2} 65%, rgba(0,0,0,0.4) 100%);
        box-shadow:0 0 ${isActive?'16px':'7px'} ${glowColor},0 0 ${isActive?'32px':'13px'} ${glowColor.replace(/[\d.]+\)$/,'0.25)')};
        position:relative;z-index:1;
        border:1.5px solid rgba(255,255,255,0.22);
        ${isActive?`animation:vshine_${uid} 2.2s ease-in-out infinite;`:''}
      }
    </style>
    <div class="vn_${uid}">
      <div class="vl_${uid}">${shortName}</div>
      <div class="vw_${uid}">
        <div class="vr_${uid}"></div>
        <div class="vd_${uid}"></div>
      </div>
    </div>
  `;
 
  return L.divIcon({
    className: '',
    html,
    iconSize:   [100, 54],
    iconAnchor: [50, 54],
    popupAnchor:[0, -54],
  });
};
 
/* HQ icon — pulsing cyan dot */
const hqIcon = L.divIcon({
  className: '',
  html: `
    <style>
      @keyframes hqp{0%,100%{box-shadow:0 0 0 0 rgba(6,182,212,0.5),0 0 14px rgba(6,182,212,0.7)}50%{box-shadow:0 0 0 7px rgba(6,182,212,0),0 0 22px rgba(6,182,212,0.4)}}
    </style>
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
      <div style="background:rgba(6,11,21,0.9);border:1px solid rgba(6,182,212,0.55);border-radius:6px;padding:3px 8px;font-size:10px;font-weight:800;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;color:#67e8f9;letter-spacing:0.08em;white-space:nowrap;backdrop-filter:blur(8px)">HQ</div>
      <div style="width:12px;height:12px;border-radius:50%;background:radial-gradient(circle at 35% 35%,rgba(255,255,255,0.55) 0%,#06b6d4 60%);animation:hqp 2s infinite;border:1.5px solid rgba(255,255,255,0.28)"></div>
    </div>
  `,
  iconSize:   [60, 44],
  iconAnchor: [30, 44],
  popupAnchor:[0, -44],
});
 
/* ─────────────────────────────────────────────────────────────────
   Curved path: generate intermediate control point to arc the line
   Uses a simple perpendicular offset for a nice arc feel.
───────────────────────────────────────────────────────────────── */
function curvedLatLngs(
  from: [number, number],
  to:   [number, number],
  segments = 24
): [number, number][] {
  const midLat = (from[0] + to[0]) / 2;
  const midLng = (from[1] + to[1]) / 2;
  // perpendicular offset scaled to distance
  const dlat = to[0] - from[0];
  const dlng = to[1] - from[1];
  const dist  = Math.sqrt(dlat * dlat + dlng * dlng);
  const curveStrength = dist * 0.18;
  // offset the midpoint perpendicular to the line
  const ctrlLat = midLat - dlng * curveStrength / dist;
  const ctrlLng = midLng + dlat * curveStrength / dist;
 
  const pts: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t  = i / segments;
    const mt = 1 - t;
    const lat = mt * mt * from[0] + 2 * mt * t * ctrlLat + t * t * to[0];
    const lng = mt * mt * from[1] + 2 * mt * t * ctrlLng + t * t * to[1];
    pts.push([lat, lng]);
  }
  return pts;
}
 
/* ─────────────────────────────────────────────────────────────────
   Main map component
───────────────────────────────────────────────────────────────── */
export default function ActualMap({
  suppliers = [],
  hq = { lat: 37.33, lng: 126.58 },
  activeNode = "",
  hierarchy = null,
}: {
  suppliers: any[];
  hq?: any;
  activeNode: string;
  hierarchy?: any;
}) {
  const hqPos: [number, number] = [hq.lat, hq.lng];
  const [pathColor, setPathColor]         = useState('#06b6d4');
  const [activeSupplier, setActiveSupplier] = useState<any>(null);
 
  useEffect(() => {
    let active: any = null;
    if (activeNode) {
      active = suppliers.find(
        s => s.id === activeNode || s.name.toLowerCase() === activeNode.toLowerCase()
      );
    }
    if (!active && hierarchy?.primary) {
      active = suppliers.find(s => s.id === hierarchy.primary);
    }
    if (!active && suppliers.length > 0) active = suppliers[0];
    setActiveSupplier(active);
 
    if (active) {
      const st = active.status || 'OPERATIONAL';
      if (['BLOCKED','CHILD_LABOR_RISK','WEATHER_RISK','CRITICAL_RISK','COMPLIANCE_VIOLATION','UNRECOVERABLE'].includes(st)) {
        setPathColor('#ef4444');
      } else if (['PRICE_GOUGING','WARNING_ISSUED'].includes(st)) {
        setPathColor('#f59e0b');
      } else {
        setPathColor('#06b6d4');
      }
    }
  }, [activeNode, suppliers, hierarchy]);
 
  return (
    <MapContainer
      center={hqPos}
      zoom={3}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      <RecenterMap coords={hqPos} />
 
      {/* HQ */}
      <Marker position={hqPos} icon={hqIcon}>
        <Popup>
          <div style={{ fontFamily:'monospace', fontSize:'11px', color:'#c8dff5', background:'#0c1522', padding:'4px' }}>
            <div style={{ fontWeight:700, color:'#67e8f9' }}>Headquarters</div>
            <div>Lat: {hq.lat} / Lng: {hq.lng}</div>
          </div>
        </Popup>
      </Marker>
 
      {/* Suppliers */}
      {suppliers.map(s => {
        const pos: [number, number] = [Number(s.lat), Number(s.lng)];
        if (isNaN(pos[0]) || isNaN(pos[1])) return null;
 
        const isActive  = activeSupplier?.id === s.id;
        const tier      = s.tier || 'unknown';
        const hasProblem = !!(
          s.status?.includes('RISK') ||
          s.status?.includes('VIOLATION') ||
          s.status?.includes('GOUGING')
        );
 
        const curve = curvedLatLngs(hqPos, pos);
 
        return (
          <React.Fragment key={s.id}>
            {/* Marker */}
            <Marker
              position={pos}
              icon={createSupplierIcon(s.name, s.status, isActive, tier)}
            >
              <Popup>
                <div style={{ fontFamily:'-apple-system,BlinkMacSystemFont,Inter,sans-serif', fontSize:'12px', color:'#c8dff5', minWidth:'155px', background:'#0c1522', padding:'4px' }}>
                  <div style={{ fontWeight:700, color:'#67e8f9', marginBottom:'5px', fontSize:'13px' }}>{s.name}</div>
                  <div style={{ color:'#4a6080', marginBottom:'2px' }}>Tier: <span style={{ color:'#c8dff5' }}>{tier.toUpperCase()}</span></div>
                  <div style={{ color:'#4a6080', marginBottom:'2px' }}>Status: <span style={{ color: hasProblem?'#f87171':'#34d399' }}>{s.status}</span></div>
                  <div style={{ color:'#4a6080', marginBottom:'2px' }}>Price: <span style={{ color:'#c8dff5' }}>₩{s.current_price}k</span></div>
                  <div style={{ color:'#4a6080' }}>Compliance: <span style={{ color:'#67e8f9' }}>{s.compliance_score ?? 'N/A'}%</span></div>
                </div>
              </Popup>
            </Marker>
 
            {/* Active path — thick glowing curved arc */}
            {isActive && (
              <>
                {/* glow layer */}
                <Polyline
                  positions={curve}
                  pathOptions={{
                    color: pathColor,
                    weight: 14,
                    opacity: 0.08,
                    dashArray: '',
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                />
                {/* main line */}
                <Polyline
                  positions={curve}
                  pathOptions={{
                    color: pathColor,
                    weight: 3.5,
                    opacity: 0.95,
                    dashArray: '',
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                />
              </>
            )}
 
            {/* Secondary — dashed amber arc */}
            {tier === 'secondary' && !isActive && (
              <Polyline
                positions={curve}
                pathOptions={{
                  color: '#f59e0b',
                  weight: 1.5,
                  opacity: 0.22,
                  dashArray: '5 9',
                  lineCap: 'round',
                }}
              />
            )}
 
            {/* Tertiary — faint arc */}
            {tier === 'tertiary' && !isActive && (
              <Polyline
                positions={curve}
                pathOptions={{
                  color: '#f97316',
                  weight: 1,
                  opacity: 0.15,
                  dashArray: '3 6',
                  lineCap: 'round',
                }}
              />
            )}
 
            {/* Problem supplier dim arc */}
            {hasProblem && !isActive && (
              <Polyline
                positions={curve}
                pathOptions={{
                  color: '#ef4444',
                  weight: 1,
                  opacity: 0.1,
                  dashArray: '2 5',
                  lineCap: 'round',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </MapContainer>
  );
}