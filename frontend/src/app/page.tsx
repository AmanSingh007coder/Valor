"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Activity, Cpu, Globe, CheckCircle2, TrendingUp, Search, Zap, ShieldAlert, Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MapWrapper = dynamic(() => import('@/components/MapWrapper'), { ssr: false });

export default function Home() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [hq, setHq] = useState({ lat: 37.7749, lng: -122.4194 }); // Added HQ state
  const [showSupplierDeepDive, setShowSupplierDeepDive] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. POLLING LOGIC: Fetch everything from Express API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const stateRes = await fetch('http://localhost:5000/api/state');
        if (!stateRes.ok) throw new Error("API down");
        
        const stateData = await stateRes.json();
        
        // Extract data from the new onboarding structure
        setSuppliers(stateData.suppliers || []);
        if (stateData.hq) {
            setHq(stateData.hq);
        }

        const logsRes = await fetch('http://localhost:5000/api/logs');
        if (!logsRes.ok) throw new Error("Logs down");
        const logsData = await logsRes.json();
        setLogs(logsData);
        
        if (logsData[0]?.riskLevel === "HIGH" && isProcessing) {
            setShowToast(true);
            setIsProcessing(false);
        }
      } catch (err) {
        console.log("Syncing with Valor API...");
      }
    };

    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [isProcessing]);

const simulateDisaster = async (targetId?: string) => {
    // If no ID passed (from the header button), pick the first operational one
    const id = targetId || suppliers.find(s => s.status === "OPERATIONAL")?.id;
    if (!id) return;

    setIsProcessing(true); 
    await fetch('http://localhost:5000/api/trigger-disaster', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        supplierId: id, 
        news: "CRITICAL: Reports of unauthorized labor and price gouging." 
      })
    });
};

  const isGlobalCritical = suppliers.some(s => s.status === "BLOCKED" || s.status === "DISRUPTED");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans overflow-hidden selection:bg-cyan-500/30">
      
      {/* Header */}
      <header className="border-b border-cyan-900/30 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
             <Activity className="text-cyan-400 h-6 w-6" />
             <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-zinc-100 to-cyan-500 bg-clip-text text-transparent">VALOR</h1>
          </div>
          <div className="flex items-center text-sm gap-6">
             <div className={`px-4 py-1.5 rounded-full border font-bold ${isGlobalCritical ? 'border-red-500/50 text-red-400 bg-red-500/10' : 'border-cyan-500/30 text-cyan-400'}`}>
                Status: {isProcessing ? 'AGENTS PROCESSING...' : isGlobalCritical ? 'CRITICAL' : 'NOMINAL'}
             </div>
             <button onClick={simulateDisaster} disabled={isProcessing} className="bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 px-5 py-1.5 rounded text-sm font-bold transition-all">
                {isProcessing ? 'Thinking...' : 'Simulate Disaster'}
             </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex gap-4 p-4 px-6 overflow-hidden">
        {/* Left: Map */}
        <section className="w-[60%] flex flex-col gap-4">
           <div className="flex-1 rounded-xl border border-cyan-900/30 bg-zinc-900/60 overflow-hidden relative shadow-2xl">
               {/* CORRECTED: Passing hq state here */}
               <MapWrapper suppliers={suppliers} hq={hq} />
           </div>
           <div className="h-24 rounded-xl border border-cyan-900/30 bg-zinc-900/60 p-4">
              <h3 className="text-[10px] font-bold text-cyan-500 mb-2 uppercase tracking-widest flex items-center gap-2"><ShieldAlert size={12}/> Threat Matrix</h3>
              <div className="grid grid-cols-6 gap-2">
                 {suppliers.slice(0, 12).map((s, i) => (
                   <div key={i} className={`h-2 rounded ${s.status === 'BLOCKED' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-cyan-950 border border-cyan-900'}`}></div>
                 ))}
              </div>
           </div>
        </section>

        {/* Right: Intel */}
<section className="w-[40%] flex flex-col gap-4">
    {/* 1. Supplier Directory (Select a Target) */}
    <div className="h-[40%] rounded-xl border border-cyan-900/30 bg-black/60 p-4 flex flex-col overflow-hidden">
        <h3 className="text-[10px] font-bold text-cyan-400 mb-3 flex items-center gap-2 uppercase tracking-widest">
            <Server className="h-4 w-4"/> Global Supplier Directory
        </h3>
        <div className="flex-1 overflow-y-auto space-y-1 pr-2">
            {suppliers.map((s) => (
                <button 
                    key={s.id}
                    onClick={() => {
                        // Click to simulate specifically for THIS supplier
                        simulateDisaster(s.id);
                    }}
                    className={`w-full flex justify-between items-center p-2 rounded text-[11px] border transition-all ${
                        s.status === 'BLOCKED' ? 'border-red-900/30 bg-red-900/10 text-red-400' : 'border-zinc-800/50 bg-zinc-900/40 text-zinc-400 hover:border-cyan-500/30'
                    }`}
                >
                    <span className="font-mono">{s.id}</span>
                    <span className="font-bold">{s.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] ${s.status === 'OPERATIONAL' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {s.status}
                    </span>
                </button>
            ))}
        </div>
    </div>

    {/* 2. Orchestration Log (The Brain) */}
    <div className="h-[60%] rounded-xl border border-cyan-900/30 bg-black/60 p-4 flex flex-col overflow-hidden">
        <h3 className="text-[10px] font-bold text-cyan-400 mb-3 flex items-center gap-2 uppercase tracking-widest">
            <Cpu className="h-4 w-4"/> Live Orchestration
        </h3>
        <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[10px] p-2 bg-black/60 rounded border border-zinc-800/50">
            {logs.map((log, i) => (
                <div key={i} className="border-l-2 border-cyan-800 pl-3 py-1 mb-2">
                    <div className="text-cyan-600 mb-1">» {log.supplierId} LOGGED</div>
                    <div className="text-zinc-300 italic">"{log.reasoning}"</div>
                    {log.details && (
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[9px] opacity-60">
                            <div className="text-yellow-500">Finance: {log.details.finance?.alert}</div>
                            <div className="text-red-500">Compliance: {log.details.compliance?.status}</div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    </div>
</section>
      </main>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ y: 50 }} animate={{ y: 0 }} exit={{ y: 20 }} className="fixed bottom-8 right-8 bg-red-600 p-4 rounded-lg shadow-2xl flex items-center gap-4 z-50">
            <Zap className="h-6 w-6" />
            <div className="font-bold text-sm uppercase">Supplier Blacklisted - Rerouting Initiated</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}