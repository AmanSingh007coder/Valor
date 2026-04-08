"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AlertCircle, CheckCircle2, Server, Globe, Activity, ShieldAlert, Cpu, Navigation, Zap, ArrowRight, PieChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Dynamically import MapWrapper built on top of react-leaflet
const MapWrapper = dynamic(() => import('@/components/MapWrapper'), { ssr: false });

export default function Home() {
  const [disasterActive, setDisasterActive] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [showSupplierDeepDive, setShowSupplierDeepDive] = useState(false);
  const [showThreatModal, setShowThreatModal] = useState(false);

  const simulateDisaster = () => {
    setDisasterActive(true);
    addLog("[News Agent] -> [Auditor Agent]: Found Strike Alert at Supplier A (92% Conf)");
    setTimeout(() => {
        addLog("[Auditor Agent] -> [Tool]: execute_payment_freeze(Contract_A_882)");
    }, 1500);
    setTimeout(() => {
        addLog("⚠️ AUTONOMOUS ACTION: REROUTING TO BACKUP B.");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
    }, 3000);
  };

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, msg].slice(-10)); // Keep last 10 logs
  };

  const [showToast, setShowToast] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      
      {/* Background ambient glow effect */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Nav: Command Center Header */}
      <header className="border-b border-cyan-900/30 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-50 shadow-[0_4px_30px_rgba(6,182,212,0.1)]">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
             <Activity className="text-cyan-400 h-6 w-6 filter drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
             <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-zinc-100 via-cyan-100 to-cyan-500 bg-clip-text text-transparent">
             VALOR
             </h1>
          </div>
          <div className="flex items-center text-sm gap-6 font-medium">
             <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800">
               <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
               <span className="text-zinc-300">System Online</span>
             </div>
             <div className="flex items-center gap-2 text-zinc-300 bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800">
               <Server className="h-4 w-4 text-cyan-500"/>
               <span>Agents: <span className="text-cyan-400 font-bold">5/5 Active</span></span>
             </div>
             <div className={`px-4 py-1.5 rounded-full border font-bold transition-all duration-500 ${disasterActive ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]'}`}>
                Global Risk: {disasterActive ? 'CRITICAL' : 'NOMINAL'}
             </div>
             <button 
                onClick={simulateDisaster}
                className="ml-4 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white px-5 py-1.5 rounded text-sm font-bold transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:shadow-[0_0_25px_rgba(220,38,38,0.6)] hover:-translate-y-0.5"
             >
                 Simulate Disaster
             </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex gap-4 p-4 overflow-hidden relative z-10 w-full px-6">
        
        {/* Left Panel: Hero Map View (60%) */}
        <section className="w-[60%] flex flex-col gap-4">
           {/* Map Container */}
           <div className="flex-1 rounded-xl border border-cyan-900/30 bg-zinc-900/60 overflow-hidden relative shadow-[0_0_20px_rgba(6,182,212,0.07)] backdrop-blur-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:border-cyan-700/50">
               <MapWrapper disasterActive={disasterActive} />
               <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
           </div>

           {/* Bottom Dock: Threat Matrix */}
           <div className="h-48 rounded-xl border border-cyan-900/30 bg-zinc-900/60 p-4 flex flex-col shadow-[0_0_20px_rgba(6,182,212,0.07)] backdrop-blur-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:border-cyan-700/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
              <h3 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2 uppercase tracking-wide"><ShieldAlert className="h-4 w-4"/> Threat Matrix</h3>
               <div className="flex-1 grid grid-cols-5 grid-rows-1 gap-4">
                  <div className="col-span-2 bg-black/40 rounded flex flex-col justify-end p-2 border border-zinc-800 relative overflow-hidden transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                      {disasterActive && (
                           <motion.div onClick={() => setShowThreatModal(true)} initial={{scale:0}} animate={{scale:1}} className="cursor-pointer absolute inset-0 bg-red-900/40 hover:bg-red-800/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center text-sm font-bold text-red-200 border border-red-500/50 rounded z-10 shadow-[inset_0_0_20px_rgba(239,68,68,0.3)] transition-colors">
                              Supplier A Strike (High Impact)
                              <span className="text-[10px] uppercase font-normal opacity-80 mt-1 tracking-widest text-white/70 block flex items-center gap-1"><PieChart className="w-3 h-3"/> Click for Analysis</span>
                           </motion.div>
                      )}
                      <span className="text-zinc-500 text-xs font-mono uppercase">High Impact</span>
                  </div>
                  <div className="bg-black/40 rounded flex items-end p-2 border border-zinc-800 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"><span className="text-zinc-500 text-xs font-mono uppercase">Med</span></div>
                  <div className="bg-black/40 rounded flex items-end p-2 border border-zinc-800 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"><span className="text-zinc-500 text-xs font-mono uppercase">Low</span></div>
                  <div className="bg-black/40 rounded flex flex-col justify-end p-2 border border-zinc-800 relative overflow-hidden transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                     <span className="text-zinc-500 text-xs font-mono uppercase">Low Impact</span>
                  </div>
               </div>
           </div>
        </section>

        {/* Right Panel: Intelligence & Logic (40%) */}
        <section className="w-[40%] flex flex-col gap-4">
           
           {/* Agent Activity Terminal */}
           <div className="flex-1 rounded-xl border border-cyan-900/30 bg-black/60 backdrop-blur-md p-4 flex flex-col shadow-[0_0_20px_rgba(6,182,212,0.07)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:border-cyan-700/50 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
               <h3 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2 uppercase tracking-wide"><Cpu className="h-4 w-4"/> Agentic Orchestration Log</h3>
               <div className="flex-1 overflow-y-auto space-y-2 font-mono text-sm leading-relaxed p-3 bg-[#08080a] rounded border border-zinc-800/80 shadow-inner">
                  {logs.length === 0 && <span className="text-zinc-600 animate-pulse">Awaiting intelligence packets...</span>}
                  {logs.map((log, i) => (
                      <motion.div initial={{opacity:0, x: 20}} animate={{opacity:1, x:0}} key={i} className={`p-2 rounded transition-all duration-300 hover:shadow-[0_0_10px_rgba(6,182,212,0.15)] hover:border-cyan-500/30 ${log.includes('AUTONOMOUS') ? 'bg-red-500/10 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)] hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:border-red-500/60' : 'text-zinc-300 border border-transparent hover:bg-zinc-800/30'}`}>
                          <span className="text-cyan-500 mr-2 font-bold opacity-80">[{new Date().toLocaleTimeString()}]</span>
                          {log}
                      </motion.div>
                  ))}
               </div>
           </div>
           
           {/* Truth Engine Deep-Dive (Supplier View) - Triggered visually in demo */}
           <div className="h-72 rounded-xl border border-cyan-900/30 bg-zinc-900/60 p-4 flex flex-col relative overflow-hidden group hover:border-cyan-700/50 transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.07)] hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-sm">
               <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
               <div className="absolute top-4 right-4 flex space-x-2 z-20">
                    <button onClick={()=>setShowSupplierDeepDive(!showSupplierDeepDive)} className="text-xs bg-cyan-900/30 hover:bg-cyan-800/60 border border-cyan-700/50 px-3 py-1.5 rounded text-cyan-100 transition-colors shadow-[0_0_10px_rgba(6,182,212,0.2)]">Toggle Truth Engine</button>
               </div>
               <h3 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2 uppercase tracking-wide"><Globe className="h-4 w-4"/> Truth Engine Deep-Dive</h3>
               
               <AnimatePresence>
                   {showSupplierDeepDive && (
                     <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="absolute inset-0 bg-zinc-950/95 backdrop-blur-xl z-10 p-6 flex flex-col border-t border-cyan-900/50 shadow-[inset_0_0_50px_rgba(6,182,212,0.05)]">
                         <div className="flex justify-between items-center mb-6 mt-6">
                             <h4 className="font-bold text-cyan-400 flex items-center gap-2 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]"><CheckCircle2 className="w-5 h-5"/> Triangulated Risk Consensus</h4>
                             <button onClick={()=>setShowSupplierDeepDive(false)} className="text-zinc-500 hover:text-white transition-colors">&times;</button>
                         </div>
                         <div className="grid grid-cols-3 gap-4 mb-6">
                             <div className="bg-black/60 p-4 rounded-lg border border-zinc-800 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] shadow-inner">
                                 <div className="text-xs text-zinc-500 mb-2 font-mono uppercase tracking-wider">Source 1: News</div>
                                 <div className="text-sm font-medium text-red-400">"Strike confirmed at Port LA"</div>
                             </div>
                             <div className="bg-black/60 p-4 rounded-lg border border-zinc-800 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] shadow-inner">
                                 <div className="text-xs text-zinc-500 mb-2 font-mono uppercase tracking-wider">Source 2: Satellite</div>
                                 <div className="text-sm font-medium text-yellow-500">Heatmap Anomaly Detected</div>
                             </div>
                             <div className="bg-black/60 p-4 rounded-lg border border-zinc-800 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] shadow-inner">
                                 <div className="text-xs text-zinc-500 mb-2 font-mono uppercase tracking-wider">Source 3: IoT</div>
                                 <div className="text-sm font-medium text-red-400">Truck Vel. DROP 98%</div>
                             </div>
                         </div>
                         <div className="mt-auto bg-cyan-950/20 p-4 rounded-lg border border-cyan-900/30 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent"></div>
                            <span className="text-cyan-500/70 text-xs font-bold uppercase tracking-widest mb-2">Risk Score Formula</span>
                            <span className="font-mono text-cyan-300 text-lg drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">Risk = 3 / ((W1·News) + (W2·Sat) + (W3·IoT))</span>
                         </div>
                     </motion.div>
                   )}
               </AnimatePresence>

               {/* Default view when Truth Engine is closed */}
               {!showSupplierDeepDive && (
                    <div className="flex-1 flex items-center justify-center flex-col text-zinc-500 gap-3 group-hover:text-cyan-500/50 transition-colors">
                        <Navigation className="h-10 w-10 opacity-30 group-hover:opacity-50 transition-opacity drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]"/>
                        <p className="text-sm font-mono tracking-wide">Select node or toggle to inspect vectors.</p>
                    </div>
               )}
           </div>

        </section>

      </main>

      {/* Autonomous Action Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 bg-red-600/90 backdrop-blur-md text-white px-6 py-4 rounded-lg shadow-[0_10px_40px_rgba(220,38,38,0.5)] border border-red-500 flex items-center gap-4 z-50 overflow-hidden"
          >
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
             <Zap className="h-6 w-6 animate-pulse" />
             <div>
                <div className="font-bold text-sm tracking-widest text-red-100 uppercase mb-1">Autonomous Action Executed</div>
                <div className="text-base font-medium">REROUTING TO BACKUP B.</div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Threat Analysis Modal */}
      <AnimatePresence>
         {showThreatModal && (
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
             >
                 <motion.div
                   initial={{ scale: 0.9, y: 20 }}
                   animate={{ scale: 1, y: 0 }}
                   exit={{ scale: 0.9, y: 20 }}
                   className="bg-zinc-950/90 border border-cyan-500/30 w-full max-w-4xl p-6 rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col relative overflow-hidden"
                 >
                     <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                     {/* Header */}
                     <div className="flex justify-between items-center mb-6">
                         <div className="flex items-center gap-3">
                             <ShieldAlert className="text-red-500 h-6 w-6 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                             <h2 className="text-xl font-bold bg-gradient-to-r from-red-100 to-red-400 bg-clip-text text-transparent uppercase tracking-wider">Automated Threat Resolution Report</h2>
                         </div>
                         <button onClick={() => setShowThreatModal(false)} className="text-zinc-500 hover:text-white transition-colors bg-zinc-900 border border-zinc-800 px-3 py-1 rounded text-sm font-mono hover:border-cyan-500/50">Close [ESC]</button>
                     </div>

                     {/* Body */}
                     <div className="grid grid-cols-2 gap-6 relative z-10">
                         {/* Left: Pie Chart Risk Composition */}
                         <div className="bg-black/60 p-5 rounded-lg border border-zinc-800 flex flex-col hover:border-cyan-900/50 transition-colors shadow-inner">
                             <h3 className="text-sm font-bold text-cyan-400 mb-4 uppercase tracking-widest border-b border-zinc-800 pb-2 inline-flex items-center gap-2"><PieChart className="w-4 h-4"/> Risk Composition</h3>
                             <div className="flex items-center gap-6 mt-4">
                                 {/* CSS Conic Gradient Pie Chart */}
                                 <div 
                                    className="w-32 h-32 rounded-full border border-zinc-700 shadow-[0_0_20px_rgba(239,68,68,0.2)] shrink-0" 
                                    style={{ backgroundImage: 'conic-gradient(#ef4444 0% 60%, #eab308 60% 85%, #06b6d4 85% 100%)' }}
                                 ></div>
                                 
                                 <div className="flex flex-col gap-3 flex-1 text-sm font-mono w-full">
                                    <div className="flex justify-between w-full border-b border-zinc-800/50 pb-1">
                                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div><span className="text-zinc-300">Logistics Failure</span></div>
                                        <span className="text-red-400 font-bold">60%</span>
                                    </div>
                                    <div className="flex justify-between w-full border-b border-zinc-800/50 pb-1">
                                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.8)]"></div><span className="text-zinc-300">Labor Strike Risk</span></div>
                                        <span className="text-yellow-500 font-bold">25%</span>
                                    </div>
                                    <div className="flex justify-between w-full border-b border-zinc-800/50 pb-1">
                                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-cyan-500 shadow-[0_0_5px_rgba(6,182,212,0.8)]"></div><span className="text-zinc-300">Infrastructure</span></div>
                                        <span className="text-cyan-500 font-bold">15%</span>
                                    </div>
                                 </div>
                             </div>
                         </div>

                         {/* Right: Supplier Transition */}
                         <div className="bg-black/60 p-5 rounded-lg border border-zinc-800 flex flex-col hover:border-cyan-900/50 transition-colors shadow-inner h-full justify-between">
                             <div className="p-4 border border-red-500/30 bg-red-950/20 rounded relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 bg-red-500 h-full"></div>
                                <h3 className="text-red-400 font-bold mb-1 uppercase tracking-wider text-sm">Action: Terminated Node</h3>
                                <p className="text-zinc-300 text-lg font-medium">Supplier A (Port LA)</p>
                                <p className="text-xs text-zinc-500 mt-2 font-mono">Risk threshold exceeded. Satellite and IoT data confirm halt in ops. Dealership suspended.</p>
                             </div>

                             <div className="flex justify-center items-center py-2">
                                <ArrowRight className="w-6 h-6 text-cyan-500 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                                <ArrowRight className="w-6 h-6 text-cyan-500 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] -ml-2 opacity-50" />
                                <ArrowRight className="w-6 h-6 text-cyan-500 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] -ml-2 opacity-20" />
                             </div>

                             <div className="p-4 border border-green-500/30 bg-green-950/20 rounded relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/5 to-transparent"></div>
                                <div className="absolute top-0 left-0 w-1 bg-green-500 h-full shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                                <h3 className="text-green-400 font-bold mb-1 uppercase tracking-wider text-sm flex items-center gap-2">Action: New Connection Secured <CheckCircle2 className="w-4 h-4"/></h3>
                                <p className="text-zinc-100 text-lg border-b border-green-900 pb-2 mb-2 font-medium">Backup Supplier B (Seattle Hub)</p>
                                <p className="text-xs text-zinc-400 font-mono">MCP successfully routed contracts to Backup B. Operations nominal. Estimated ETA +2 hours.</p>
                             </div>
                         </div>
                     </div>
                 </motion.div>
             </motion.div>
         )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
            100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}
