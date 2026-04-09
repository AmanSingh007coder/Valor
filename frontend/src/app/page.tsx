"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Activity, Cpu, Globe, CheckCircle2, TrendingUp, Search, Zap, ShieldAlert, Server, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MapWrapper = dynamic(() => import('@/components/MapWrapper'), { ssr: false });

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'CHILD_LABOR_RISK':
      return "border-red-500/50 bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]";
    case 'PRICE_GOUGING':
      return "border-yellow-500/50 bg-yellow-500/10 text-yellow-400";
    case 'WEATHER_STRIKE':
      return "border-blue-500/50 bg-blue-500/10 text-blue-400";
    case 'UNDER_AUDIT':
      return "border-cyan-500/50 bg-cyan-500/10 text-cyan-400 animate-pulse";
    default:
      return "border-emerald-500/20 bg-emerald-500/5 text-emerald-500";
  }
}

export default function Home() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [hq, setHq] = useState({ lat: 37.7749, lng: -122.4194 });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stateRes = await fetch('http://localhost:5000/api/state');
        const stateData = await stateRes.json();
        setSuppliers(stateData.suppliers || []);
        if (stateData.hq) setHq(stateData.hq);

        const logsRes = await fetch('http://localhost:5000/api/logs');
        const logsData = await logsRes.json();
        setLogs(logsData);
        if (logsData[0]?.riskLevel === "HIGH" && isProcessing) setIsProcessing(false);
      } catch (err) { console.log("Syncing..."); }
    };
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [isProcessing]);

  const simulateDisaster = async (id: string) => {
    setIsProcessing(true);
    const scenarios = [
      { news: "CRITICAL: Reports of illegal child labor detected.", type: "LABOR" },
      { news: "WARNING: Minor logistics delay due to port congestion.", type: "LOGISTICS" },
      { news: "INFO: Sudden market volatility causing a 15% price spike.", type: "FINANCE" }
    ];
    const picked = scenarios[Math.floor(Math.random() * scenarios.length)];
    await fetch('http://localhost:5000/api/trigger-disaster', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplierId: id, news: picked.news })
    });
  };

  return (
    <div className="h-screen bg-[#05060a] text-zinc-100 flex flex-col p-4 gap-4 overflow-hidden font-mono">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500 p-1.5 rounded-sm"><Box className="text-black h-5 w-5" /></div>
          <div>
            <h1 className="text-lg font-black tracking-tighter">VALOR // CORE_STRAT</h1>
            <p className="text-[10px] text-zinc-500">Autonomous Supply Intelligence v1.0.4</p>
          </div>
        </div>
        <div className="flex gap-4">
            <div className="text-right">
                <p className="text-[9px] text-zinc-500 uppercase">System Integrity</p>
                <p className="text-xs font-bold text-emerald-500">NOMINAL_READY</p>
            </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Top Row: Map & Directory */}
        <div className="h-[65%] flex gap-4">
          <div className="flex-[2] rounded-2xl border border-white/5 bg-zinc-950/50 overflow-hidden relative shadow-2xl">
            <MapWrapper suppliers={suppliers} hq={hq} />
            <div className="absolute top-4 right-4 z-[1000] bg-black/80 border border-white/10 p-3 rounded-lg backdrop-blur-md">
                <div className="text-[10px] text-zinc-500 mb-2 uppercase tracking-widest">Global Status</div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Operational: {suppliers.filter(s => s.status === 'OPERATIONAL').length}</div>
                    <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-red-500"></span> High Risk: {suppliers.filter(s => s.status !== 'OPERATIONAL').length}</div>
                </div>
            </div>
          </div>

          <div className="flex-1 border border-white/5 bg-zinc-950/50 rounded-2xl p-4 flex flex-col overflow-hidden">
            <h3 className="text-[11px] font-bold text-cyan-500 mb-4 flex items-center gap-2 uppercase"><Server size={14}/> Node Selection</h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
{suppliers.map((s) => (
  <button 
    key={s.id} 
    onClick={() => simulateDisaster(s.id)}
    disabled={isProcessing}
    className={`w-full group text-left p-4 rounded-2xl border transition-all duration-500 hover:scale-[1.02] ${getStatusStyles(s.status)}`}
  >
    <div className="flex justify-between items-start mb-2">
      <span className="text-[10px] opacity-50 font-black tracking-tighter">{s.id}</span>
      <div className="flex flex-col items-end">
        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-black/40">
          {s.status.replace('_', ' ')}
        </span>
      </div>
    </div>
    
    <div className="text-sm font-bold tracking-tight mb-1">{s.name}</div>
    
    {/* Dynamic Mini-Reasoning on the card */}
    <p className="text-[10px] opacity-70 line-clamp-1 mb-3">
      {s.status === 'OPERATIONAL' ? "All systems nominal" : s.internet_news}
    </p>

    <div className="flex items-center justify-between pt-2 border-t border-white/5">
      <div className="flex gap-2">
        <div className={`h-1.5 w-1.5 rounded-full ${s.status === 'OPERATIONAL' ? 'bg-emerald-500' : 'bg-red-500 animate-ping'}`} />
        <span className="text-[8px] font-bold uppercase opacity-40">Live Telemetry</span>
      </div>
      <span className="text-[9px] font-black group-hover:translate-x-1 transition-transform">RUN_AUDIT →</span>
    </div>
  </button>
))}
            </div>
          </div>
        </div>

        {/* Bottom Row: Orchestration Log (Horizontal) */}
        <div className="h-[35%] border border-white/5 bg-zinc-950/50 rounded-2xl p-4 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                <h3 className="text-[11px] font-bold text-cyan-500 flex items-center gap-2 uppercase"><Cpu size={14}/> Live Orchestration Stream</h3>
                <span className="text-[10px] animate-pulse text-emerald-500">RECEIVING_TELEMETRY...</span>
            </div>
            <div className="flex-1 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {logs.length === 0 && <div className="text-zinc-700 italic text-sm">Waiting for agent activation...</div>}
                {logs.map((log, i) => (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        key={i} 
                        className="min-w-[400px] h-full bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between"
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] text-cyan-400 font-black">{log.supplierId}</span>
                            <span className="text-[9px] text-zinc-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed mb-3 italic">"{log.reasoning}"</p>
                        <div className="flex gap-3 pt-2 border-t border-white/5">
                            <div className="flex items-center gap-1 text-[9px] text-yellow-500"><TrendingUp size={10}/> Finance: {log.details?.finance?.status}</div>
                            <div className="flex items-center gap-1 text-[9px] text-red-500"><ShieldAlert size={10}/> Compliance: {log.details?.compliance?.status}</div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}