"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Activity, Server, Cpu, ShieldAlert, Navigation, Zap, ArrowRight, PieChart, Globe, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MapWrapper = dynamic(() => import('@/components/MapWrapper'), { ssr: false });

export default function Home() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [showSupplierDeepDive, setShowSupplierDeepDive] = useState(false);
  const [showThreatModal, setShowThreatModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // 1. POLLING LOGIC: Fetch from Express API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const stateRes = await fetch('http://localhost:5000/api/state');
        const stateData = await stateRes.json();
        setSuppliers(stateData.suppliers);

        const logsRes = await fetch('http://localhost:5000/api/logs');
        const logsData = await logsRes.json();
        setLogs(logsData);
        
        // Trigger toast if a block is detected in logs
        if (logsData[0]?.action?.includes("BLOCK")) {
            setShowToast(true);
        }
      } catch (err) {
        console.error("Connection to Valor API failed...");
      }
    };

    const interval = setInterval(fetchData, 2000); // Poll every 2s
    return () => clearInterval(interval);
  }, []);

  // 2. DISASTER TRIGGER: Hits your Express Endpoint
  const simulateDisaster = async () => {
    await fetch('http://localhost:5000/api/trigger-disaster', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        supplierId: "SUPPLIER_A", 
        news: "CRITICAL: Illegal child labor detected by internet scraper." 
      })
    });
  };

  const isGlobalCritical = suppliers.some(s => s.status === "BLOCKED" || s.status === "DISRUPTED");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      {/* (Glow effects and Header remain the same, just update the Global Risk indicator) */}
      <header className="border-b border-cyan-900/30 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
             <Activity className="text-cyan-400 h-6 w-6" />
             <h1 className="text-xl font-bold tracking-tight">VALOR</h1>
          </div>
          <div className="flex items-center text-sm gap-6">
             <div className={`px-4 py-1.5 rounded-full border font-bold ${isGlobalCritical ? 'text-red-400 border-red-500/50 bg-red-500/10' : 'text-cyan-400 border-cyan-500/30'}`}>
                Global Risk: {isGlobalCritical ? 'CRITICAL' : 'NOMINAL'}
             </div>
             <button onClick={simulateDisaster} className="bg-red-600 px-5 py-1.5 rounded text-sm font-bold">Simulate Disaster</button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex gap-4 p-4 px-6 overflow-hidden">
        {/* Left Panel: Map */}
        <section className="w-[60%] flex flex-col gap-4">
           <div className="flex-1 rounded-xl border border-cyan-900/30 bg-zinc-900/60 overflow-hidden relative">
               <MapWrapper suppliers={suppliers} />
           </div>
           {/* Threat Matrix (logic remains same, just uses isGlobalCritical) */}
        </section>

        {/* Right Panel: Intelligence */}
        <section className="w-[40%] flex flex-col gap-4">
           <div className="flex-1 rounded-xl border border-cyan-900/30 bg-black/60 p-4 flex flex-col overflow-hidden">
               <h3 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2 uppercase"><Cpu className="h-4 w-4"/> Agentic Orchestration Log</h3>
               <div className="flex-1 overflow-y-auto space-y-2 font-mono text-sm p-3 bg-[#08080a] rounded border border-zinc-800">
                  {logs.map((log, i) => (
                      <div key={i} className={`p-2 rounded border ${log.riskLevel === 'HIGH' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'border-transparent text-zinc-300'}`}>
                          <span className="text-cyan-500 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                          <strong>{log.riskLevel}:</strong> {log.reasoning}
                      </div>
                  ))}
               </div>
           </div>
           {/* Truth Engine Deep-Dive */}
        </section>
      </main>

      {/* Action Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ y: 50 }} animate={{ y: 0 }} exit={{ y: 20 }} className="fixed bottom-6 right-6 bg-red-600 p-4 rounded-lg flex items-center gap-4 z-50">
            <Zap className="h-6 w-6" />
            <div>
                <div className="font-bold uppercase text-xs">Autonomous Action</div>
                <div className="text-base">SUPPLIER A BLACKLISTED - REROUTING.</div>
            </div>
            <button onClick={() => setShowToast(false)} className="ml-4 opacity-50">×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}