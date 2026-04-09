"use client";
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
 
const MapWrapper = dynamic(() => import('@/components/MapWrapper'), { ssr: false });
 
export default function Home() {
  const [suppliers, setSuppliers]     = useState<any[]>([]);
  const [logs, setLogs]               = useState<any[]>([]);
  const [hq, setHq]                   = useState({ lat: 37.33, lng: 126.58 });
  const [activeNode, setActiveNode]   = useState("");
  const [hierarchy, setHierarchy]     = useState<any>(null);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [disruptions, setDisruptions] = useState<any[]>([]);
  const [orchTab, setOrchTab]         = useState<'visual'|'stream'>('visual');
  const logScrollRef = useRef<HTMLDivElement>(null);
 
  useEffect(() => {
    const fetchData = async () => {
      try {
        const stateRes  = await fetch('http://localhost:5000/api/state');
        const stateData = await stateRes.json();
        setSuppliers(stateData.suppliers || []);
        if (stateData.hq) setHq(stateData.hq);
        setActiveNode(stateData.active_node || "");
        setHierarchy(stateData.hierarchy || null);
        setCurrentPath(stateData.current_path || []);
        setDisruptions(stateData.disruption_history || []);
        const logsRes = await fetch('http://localhost:5000/api/logs');
        setLogs(await logsRes.json());
      } catch (err) { console.log("Syncing..."); }
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);
 
  useEffect(() => {
    if (logScrollRef.current && orchTab === 'stream') {
      logScrollRef.current.scrollLeft = logScrollRef.current.scrollWidth;
    }
  }, [logs, orchTab]);
 
  const activeSup    = suppliers.find(s => s.id === activeNode || s.name.toLowerCase() === activeNode?.toLowerCase());
  const primarySup   = suppliers.find(s => s.id === hierarchy?.primary);
  const secondarySup = suppliers.find(s => s.id === hierarchy?.secondary);
  const tertiarySup  = suppliers.find(s => s.id === hierarchy?.tertiary);
 
  const isCritical = (st?: string) => !!(st?.includes('VIOLATION') || st?.includes('RISK') || st?.includes('BLOCKED'));
  const isWarning  = (st?: string) => !!(st?.includes('GOUGING')   || st?.includes('WARNING'));
 
  const tierDotColor = (tier: string) =>
    tier === 'primary' ? '#10b981' : tier === 'secondary' ? '#f59e0b' : '#f97316';
 
  // ── Orchestration visual board metrics ──
  const totalAlerts     = logs.length;
  const highCount       = logs.filter(l => l.riskLevel === 'HIGH').length;
  const medCount        = logs.filter(l => l.riskLevel === 'MEDIUM').length;
  const lowCount        = Math.max(0, totalAlerts - highCount - medCount);
  const highPct         = totalAlerts ? Math.round(highCount / totalAlerts * 100) : 0;
  const medPct          = totalAlerts ? Math.round(medCount  / totalAlerts * 100) : 0;
  const lowPct          = totalAlerts ? Math.round(lowCount  / totalAlerts * 100) : 100;
  const suppWithAlerts  = suppliers.filter(s => isCritical(s.status) || isWarning(s.status)).length;
  const impactMap       = logs.reduce<Record<string,number>>((acc, l) => { acc[l.supplierName] = (acc[l.supplierName]||0)+1; return acc; }, {});
  const mostImpacted    = Object.keys(impactMap).sort((a,b)=>impactMap[b]-impactMap[a])[0] || 'N/A';
  const systemState     = isCritical(activeSup?.status) ? 'Critical — action required' : isWarning(activeSup?.status) ? 'Warning — monitor closely' : 'System is stable';
  const stateColor      = isCritical(activeSup?.status) ? '#ef4444' : isWarning(activeSup?.status) ? '#f59e0b' : '#10b981';
  const latestLog       = logs[logs.length - 1];
 
  // SVG donut
  const R    = 38;
  const CIRC = 2 * Math.PI * R;
 
  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', overflow:'hidden', background:'#060b15', fontFamily:"'Inter',-apple-system,sans-serif", color:'#c8dff5' }}>
 
      {/* ══ HEADER ══ */}
      <header style={{ background:'#0c1522', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'0 22px', height:'52px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
          <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#06b6d4', boxShadow:'0 0 8px rgba(6,182,212,0.9)', animation:'valuepulse 2s infinite' }} />
          <span style={{ fontSize:'14px', fontWeight:700, letterSpacing:'0.14em', color:'#f0f6ff', textTransform:'uppercase' }}>Valor</span>
          <span style={{ fontSize:'11px', color:'#1e3050', marginLeft:'2px', letterSpacing:'0.06em' }}>/ Supply Chain OS</span>
        </div>
 
        <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
          {/* Active vector pill */}
          <div style={{ display:'flex', alignItems:'center', gap:'7px', padding:'4px 13px', background: isCritical(activeSup?.status) ? 'rgba(239,68,68,0.08)' : 'rgba(6,182,212,0.08)', border:`1px solid ${isCritical(activeSup?.status) ? 'rgba(239,68,68,0.28)' : 'rgba(6,182,212,0.28)'}`, borderRadius:'20px' }}>
            <div style={{ width:'6px', height:'6px', borderRadius:'50%', background: isCritical(activeSup?.status)?'#ef4444':'#06b6d4', boxShadow:`0 0 6px ${isCritical(activeSup?.status)?'rgba(239,68,68,0.8)':'rgba(6,182,212,0.8)'}` }} />
            <span style={{ fontSize:'11px', fontWeight:600, color: isCritical(activeSup?.status)?'#f87171':'#67e8f9' }}>{activeSup?.name || 'Initializing'}</span>
            <span style={{ fontSize:'9px', color:'#253550' }}>Active Vector</span>
          </div>
          {/* Compliance */}
          <div style={{ padding:'4px 12px', background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.22)', borderRadius:'20px' }}>
            <span style={{ fontSize:'11px', fontWeight:700, color:'#a78bfa' }}>{activeSup?.compliance_score ?? '—'}%</span>
            <span style={{ fontSize:'9px', color:'#253550', marginLeft:'5px' }}>Compliance</span>
          </div>
          {disruptions.length > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:'5px', padding:'4px 11px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.22)', borderRadius:'20px' }}>
              <AlertTriangle size={11} style={{ color:'#f87171' }} />
              <span style={{ fontSize:'10px', color:'#f87171', fontWeight:600 }}>{disruptions.length} Disruption{disruptions.length>1?'s':''}</span>
            </div>
          )}
        </div>
 
        <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
          <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#10b981', animation:'valuepulse 1.5s infinite' }} />
          <span style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.1em', color:'#34d399', textTransform:'uppercase' }}>Live</span>
        </div>
      </header>
 
      {/* ══ MAP + SIDEBAR ══ */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0 }}>
 
        {/* Map */}
        <div style={{ flex:1, position:'relative', background:'#060b15', overflow:'hidden' }}>
          <MapWrapper suppliers={suppliers} hq={hq} activeNode={activeNode} hierarchy={hierarchy} />
 
          {/* Hierarchy legend */}
          <div style={{ position:'absolute', bottom:'16px', left:'16px', zIndex:1000, background:'rgba(6,11,21,0.94)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'14px', padding:'12px 14px', backdropFilter:'blur(14px)', minWidth:'190px' }}>
            <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.13em', color:'#253550', textTransform:'uppercase', marginBottom:'9px' }}>Supply Chain Hierarchy</p>
            {[
              { tier:'primary',   sup:primarySup,   label:'Primary'   },
              { tier:'secondary', sup:secondarySup, label:'Secondary' },
              { tier:'tertiary',  sup:tertiarySup,  label:'Tertiary'  },
            ].filter(t => t.sup).map(({ tier, sup, label }) => {
              const isAct = activeNode === hierarchy?.[tier];
              const tc    = tierDotColor(tier);
              return (
                <div key={tier} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'6px 8px', marginBottom:'4px', borderRadius:'8px', background: isAct ? 'rgba(6,182,212,0.07)' : 'rgba(255,255,255,0.02)', border:`1px solid ${isAct ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.04)'}`, transition:'all 0.3s' }}>
                  <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:tc, flexShrink:0, boxShadow:`0 0 6px ${tc}88` }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontSize:'9px', fontWeight:700, color:'#2d4060', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</span>
                      {sup?.status && (
                        <span style={{ fontSize:'8px', fontWeight:700, padding:'1px 5px', borderRadius:'3px', background: isCritical(sup.status)?'rgba(239,68,68,0.13)':'rgba(16,185,129,0.1)', color: isCritical(sup.status)?'#f87171':'#34d399' }}>{sup.status}</span>
                      )}
                    </div>
                    <span style={{ fontSize:'11px', color:'#c8dff5', fontWeight:600 }}>{sup?.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
 
          {/* Disruptions */}
          {disruptions.length > 0 && (
            <div style={{ position:'absolute', top:'14px', right:'14px', zIndex:1000, background:'rgba(6,11,21,0.94)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'12px', padding:'10px 13px', backdropFilter:'blur(12px)', maxWidth:'210px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'7px' }}>
                <AlertTriangle size={11} style={{ color:'#f87171' }} />
                <span style={{ fontSize:'9px', fontWeight:700, color:'#f87171', textTransform:'uppercase', letterSpacing:'0.1em' }}>Disruptions</span>
              </div>
              {disruptions.slice(0,3).map((d,i) => (
                <div key={i} style={{ marginBottom:'5px' }}>
                  <div style={{ fontSize:'11px', fontWeight:600, color:'#f87171' }}>{d.supplierName}</div>
                  <div style={{ fontSize:'9px', color:'#2d4060' }}>{d.previousActive} → {d.newActive}</div>
                </div>
              ))}
            </div>
          )}
        </div>
 
        {/* Sidebar */}
        <div style={{ width:'282px', background:'#0c1522', borderLeft:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', overflow:'hidden', flexShrink:0 }}>
          <div style={{ padding:'11px 15px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:'7px' }}>
            <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#06b6d4' }} />
            <span style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.1em', color:'#2d4060', textTransform:'uppercase' }}>Node Cluster Status</span>
            <span style={{ marginLeft:'auto', fontSize:'10px', fontWeight:700, background:'rgba(6,182,212,0.1)', color:'#67e8f9', padding:'2px 7px', borderRadius:'8px', border:'1px solid rgba(6,182,212,0.2)' }}>{suppliers.length}</span>
          </div>
 
          <div style={{ flex:1, overflowY:'auto', padding:'7px' }} className="scrollbar-hide">
            {suppliers.length === 0 && (
              <p style={{ padding:'22px 14px', textAlign:'center', fontSize:'11px', color:'#1e3050', fontStyle:'italic' }}>Awaiting supplier data…</p>
            )}
            {suppliers.map(s => {
              const isActive = !!(activeNode && (s.name.toLowerCase() === activeNode.toLowerCase() || s.id === activeNode));
              const bad  = isCritical(s.status);
              const warn = isWarning(s.status);
              const dot  = bad ? '#ef4444' : warn ? '#f59e0b' : '#10b981';
              return (
                <motion.div key={s.id} initial={{ opacity:0.5 }} animate={{ opacity: isActive ? 1 : 0.6 }}
                  style={{ marginBottom:'5px', padding:'9px 11px', borderRadius:'10px', border:`1px solid ${isActive ? 'rgba(6,182,212,0.26)' : 'rgba(255,255,255,0.04)'}`, background: isActive ? 'rgba(6,182,212,0.05)' : 'rgba(255,255,255,0.02)', transition:'all 0.4s' }}
                >
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'5px' }}>
                    <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:dot, boxShadow:`0 0 5px ${dot}`, flexShrink:0 }} />
                    <span style={{ fontSize:'12px', fontWeight:600, color:'#c8dff5', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</span>
                    <span style={{ fontSize:'8px', fontWeight:700, padding:'2px 5px', borderRadius:'4px', textTransform:'uppercase', letterSpacing:'0.04em', background: bad?'rgba(239,68,68,0.11)':warn?'rgba(245,158,11,0.11)':'rgba(16,185,129,0.09)', color: bad?'#f87171':warn?'#fbbf24':'#34d399', flexShrink:0 }}>
                      {s.status === 'OPERATIONAL' ? 'Nominal' : (s.status||'').replace(/_/g,' ')}
                    </span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                    <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:tierDotColor(s.tier||''), flexShrink:0 }} />
                    <span style={{ fontSize:'9px', color:'#2d4060', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600 }}>{s.tier||'unknown'}</span>
                    <span style={{ fontSize:'9px', color:'#1e3050', marginLeft:'auto' }}>Compliance: <span style={{ color:'#67e8f9', fontWeight:600 }}>{s.compliance_score??'N/A'}%</span></span>
                  </div>
                  <div style={{ marginTop:'5px', height:'2px', background:'rgba(255,255,255,0.05)', borderRadius:'2px', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${s.compliance_score||0}%`, background:(s.compliance_score||0)>70?'#06b6d4':(s.compliance_score||0)>40?'#f59e0b':'#ef4444', borderRadius:'2px', transition:'width 0.5s' }} />
                  </div>
                  {s.internet_news && !s.internet_news.includes('Normal') && (
                    <p style={{ marginTop:'5px', fontSize:'9px', color:'#2d4060', lineHeight:1.5, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as any }}>{s.internet_news}</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
 
      {/* ══ ORCHESTRATION LAYER ══ */}
      <div style={{ height:'234px', background:'#090f1c', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', flexShrink:0, overflow:'hidden' }}>
 
        {/* Panel header */}
        <div style={{ padding:'7px 18px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#10b981', animation:'valuepulse 1.5s infinite' }} />
            <span style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.12em', color:'#2d4060', textTransform:'uppercase' }}>Orchestration Log</span>
            <span style={{ fontSize:'10px', color:'#1a2a40' }}>/ Decision Stream</span>
          </div>
 
          {/* Tab switcher */}
          <div style={{ display:'flex', gap:'3px', background:'rgba(255,255,255,0.03)', padding:'3px', borderRadius:'9px', border:'1px solid rgba(255,255,255,0.05)' }}>
            {(['visual','stream'] as const).map(tab => (
              <button key={tab} onClick={()=>setOrchTab(tab)} style={{ padding:'4px 11px', borderRadius:'6px', fontSize:'9px', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer', border:'none', background: orchTab===tab ? 'rgba(6,182,212,0.14)' : 'transparent', color: orchTab===tab ? '#67e8f9' : '#253550', transition:'all 0.2s' }}>
                {tab === 'visual' ? 'Visual Board' : 'Decision Stream'}
              </button>
            ))}
          </div>
 
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={{ fontSize:'9px', color:'#1a2a40' }}>Total Events: {logs.length}</span>
            <div style={{ padding:'2px 8px', background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.18)', borderRadius:'7px', fontSize:'9px', fontWeight:700, color:'#34d399', letterSpacing:'0.06em' }}>Live</div>
          </div>
        </div>
 
        {/* ── Visual Board Tab ── */}
        {orchTab === 'visual' && (
          <div style={{ flex:1, display:'flex', gap:'10px', padding:'10px 16px', overflow:'hidden' }}>
 
            {/* Donut + risk bars */}
            <div style={{ width:'175px', flexShrink:0, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'12px', padding:'11px 13px', display:'flex', flexDirection:'column' }}>
              <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.1em', color:'#1a2a40', textTransform:'uppercase', marginBottom:'6px' }}>Total Alerts</p>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:'8px' }}>
                <svg width="92" height="92" viewBox="0 0 92 92">
                  {/* track */}
                  <circle cx="46" cy="46" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9" />
                  {/* green (low) — full ring base */}
                  <circle cx="46" cy="46" r={R} fill="none" stroke="#10b981" strokeWidth="9"
                    strokeDasharray={`${CIRC * lowPct / 100} ${CIRC}`}
                    strokeDashoffset={0}
                    transform="rotate(-90 46 46)"
                    strokeLinecap="butt"
                    style={{ transition:'stroke-dasharray 0.6s' }}
                  />
                  {/* amber (medium) — on top */}
                  <circle cx="46" cy="46" r={R} fill="none" stroke="#f59e0b" strokeWidth="9"
                    strokeDasharray={`${CIRC * (highPct + medPct) / 100} ${CIRC}`}
                    strokeDashoffset={0}
                    transform="rotate(-90 46 46)"
                    strokeLinecap="butt"
                    style={{ transition:'stroke-dasharray 0.6s' }}
                  />
                  {/* red (high) — topmost */}
                  <circle cx="46" cy="46" r={R} fill="none" stroke="#ef4444" strokeWidth="9"
                    strokeDasharray={`${CIRC * highPct / 100} ${CIRC}`}
                    strokeDashoffset={0}
                    transform="rotate(-90 46 46)"
                    strokeLinecap="butt"
                    style={{ transition:'stroke-dasharray 0.6s' }}
                  />
                  <text x="46" y="42" textAnchor="middle" fill="#f0f6ff" fontSize="18" fontWeight="700" fontFamily="Inter,-apple-system,sans-serif">{totalAlerts}</text>
                  <text x="46" y="54" textAnchor="middle" fill="#253550" fontSize="7" fontFamily="Inter,-apple-system,sans-serif" letterSpacing="1">ALERTS</text>
                </svg>
              </div>
              {[
                { label:'High risk',   count:highCount, pct:highPct, color:'#ef4444' },
                { label:'Medium risk', count:medCount,  pct:medPct,  color:'#f59e0b' },
                { label:'Low risk',    count:lowCount,  pct:lowPct,  color:'#10b981' },
              ].map(row => (
                <div key={row.label} style={{ marginBottom:'5px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'2px' }}>
                    <span style={{ fontSize:'9px', color:row.color }}>{row.label}</span>
                    <span style={{ fontSize:'9px', color:'#2d4060' }}>{row.count} ({row.pct}%)</span>
                  </div>
                  <div style={{ height:'2px', background:'rgba(255,255,255,0.05)', borderRadius:'2px', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${row.pct}%`, background:row.color, borderRadius:'2px', transition:'width 0.5s' }} />
                  </div>
                </div>
              ))}
            </div>
 
            {/* Middle col: state + alerts count + most impacted */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'7px', minWidth:0 }}>
              <div style={{ display:'flex', gap:'7px', flex:'0 0 auto' }}>
                {/* Current state */}
                <div style={{ flex:2, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'11px', padding:'10px 13px', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                  <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.1em', color:'#1a2a40', textTransform:'uppercase', marginBottom:'5px' }}>Current State</p>
                  <div>
                    <p style={{ fontSize:'15px', fontWeight:700, color:stateColor, marginBottom:'2px', lineHeight:1.2 }}>{systemState}</p>
                    <p style={{ fontSize:'9px', color:'#1a2a40' }}>Updated at {activeSup ? new Date().toLocaleTimeString() : 'N/A'}</p>
                  </div>
                </div>
                {/* Suppliers with alerts */}
                <div style={{ flex:1, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'11px', padding:'10px 13px', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                  <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.1em', color:'#1a2a40', textTransform:'uppercase', marginBottom:'5px' }}>Suppliers with Alerts</p>
                  <p style={{ fontSize:'20px', fontWeight:700, color: suppWithAlerts > 0 ? '#f59e0b' : '#c8dff5', lineHeight:1 }}>
                    {suppWithAlerts}
                    <span style={{ fontSize:'11px', color:'#2d4060', fontWeight:400, marginLeft:'4px' }}>supplier{suppWithAlerts !== 1 ? 's' : ''}</span>
                  </p>
                </div>
              </div>
 
              {/* Most impacted */}
              <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'11px', padding:'9px 13px', flex:'0 0 auto' }}>
                <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.1em', color:'#1a2a40', textTransform:'uppercase', marginBottom:'3px' }}>Most Impacted Supplier</p>
                <p style={{ fontSize:'13px', fontWeight:600, color:'#c8dff5' }}>{mostImpacted}</p>
              </div>
            </div>
 
            {/* Summary snapshot */}
            <div style={{ width:'270px', flexShrink:0, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'12px', padding:'11px 13px', display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'9px' }}>
                <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.1em', color:'#1a2a40', textTransform:'uppercase' }}>Summary Snapshot</p>
                <span style={{ fontSize:'9px', color:'#1a2a40', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', padding:'2px 7px', borderRadius:'5px' }}>Quick read for new users</span>
              </div>
              <div style={{ flex:1, overflowY:'auto' }} className="scrollbar-hide">
                {[
                  { dot:'#06b6d4', text:`Current state: ${systemState}.` },
                  { dot:'#ef4444', text:`High-risk alerts: ${highCount} out of ${totalAlerts} total alerts.` },
                  { dot:'#f59e0b', text:`Most impacted supplier: ${mostImpacted}.` },
                  { dot:'#10b981', text: latestLog ? `Latest decision: ${latestLog.reasoning?.slice(0,80)}…` : 'Latest decision:  No decision events yet.' },
                ].map((item, i) => (
                  <div key={i} style={{ display:'flex', gap:'8px', marginBottom:'8px', alignItems:'flex-start' }}>
                    <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:item.dot, flexShrink:0, marginTop:'3px' }} />
                    <p style={{ fontSize:'11px', color:'#3a5070', lineHeight:1.55 }}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
 
        {/* ── Decision Stream Tab ── */}
        {orchTab === 'stream' && (
          <div ref={logScrollRef} style={{ flex:1, overflowX:'auto', overflowY:'hidden', display:'flex', alignItems:'stretch', gap:'8px', padding:'10px 16px' }} className="scrollbar-hide">
            {logs.length === 0 && (
              <div style={{ display:'flex', alignItems:'center', paddingLeft:'8px' }}>
                <span style={{ fontSize:'11px', color:'#1a2a40', fontStyle:'italic', letterSpacing:'0.05em' }}>Initializing MCP agentic protocols…</span>
              </div>
            )}
            {logs.map((log, i) => {
              const isHigh = log.riskLevel === 'HIGH';
              const isMed  = log.riskLevel === 'MEDIUM';
              return (
                <motion.div key={i} initial={{ x:20, opacity:0 }} animate={{ x:0, opacity:1 }}
                  style={{ minWidth:'308px', maxWidth:'308px', border:`1px solid ${isHigh?'rgba(239,68,68,0.2)':isMed?'rgba(245,158,11,0.2)':'rgba(6,182,212,0.14)'}`, borderRadius:'11px', padding:'11px 13px', background: isHigh?'rgba(239,68,68,0.05)':isMed?'rgba(245,158,11,0.04)':'rgba(6,182,212,0.03)', display:'flex', flexDirection:'column', justifyContent:'space-between', flexShrink:0 }}
                >
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'6px' }}>
                    <span style={{ fontSize:'11px', fontWeight:700, color:'#c8dff5' }}>{log.supplierName}</span>
                    <div style={{ display:'flex', gap:'3px' }}>
                      {['News','Finance','Compliance'].map(tag => (
                        <span key={tag} style={{ fontSize:'8px', fontWeight:700, padding:'1px 5px', borderRadius:'3px', textTransform:'uppercase', background: tag==='News'?'rgba(59,130,246,0.11)':tag==='Finance'?'rgba(139,92,246,0.11)':'rgba(16,185,129,0.09)', color: tag==='News'?'#60a5fa':tag==='Finance'?'#a78bfa':'#34d399', border:`1px solid ${tag==='News'?'rgba(59,130,246,0.18)':tag==='Finance'?'rgba(139,92,246,0.18)':'rgba(16,185,129,0.18)'}` }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize:'10px', color:'#3a5070', lineHeight:1.6, flex:1, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as any, marginBottom:'7px' }}>{log.reasoning}</p>
                  <div style={{ display:'flex', alignItems:'center', gap:'7px', paddingTop:'6px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                    {log.votes?.map((v:any, j:number) => (
                      <div key={j} style={{ display:'flex', alignItems:'center', gap:'3px' }}>
                        <div style={{ width:'5px', height:'5px', borderRadius:'50%', background: v.vote==='BLOCK'?'#ef4444':v.vote==='SHIFT'?'#f59e0b':'#10b981' }} />
                        <span style={{ fontSize:'8px', color:'#2d4060', fontWeight:600 }}>{v.agent}</span>
                        <span style={{ fontSize:'8px', color:'#1a2a40' }}>({v.vote})</span>
                      </div>
                    ))}
                    <span style={{ marginLeft:'auto', fontSize:'8px', fontWeight:700, padding:'2px 6px', borderRadius:'4px', background: isHigh?'rgba(239,68,68,0.11)':isMed?'rgba(245,158,11,0.11)':'rgba(6,182,212,0.09)', color: isHigh?'#f87171':isMed?'#fbbf24':'#67e8f9' }}>
                      {log.complianceScore || log.riskLevel}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
 
      <style jsx global>{`
        @keyframes valuepulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .scrollbar-hide::-webkit-scrollbar{display:none}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>
    </div>
  );
}