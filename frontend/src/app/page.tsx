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
  const [selectedThreatDetail, setSelectedThreatDetail] = useState<'BLOCKED' | 'DISRUPTED' | 'OPERATIONAL' | null>(null);
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

  useEffect(() => {
    if (!showToast) return;
    const timer = window.setTimeout(() => setShowToast(false), 4500);
    return () => window.clearTimeout(timer);
  }, [showToast]);

  const simulateDisaster = async (targetId?: string) => {
    const id = targetId || suppliers.find((s) => s.status === 'OPERATIONAL')?.id;
    if (!id) return;

    setIsProcessing(true);
    await fetch('http://localhost:5000/api/trigger-disaster', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplierId: id,
        news: 'CRITICAL: Reports of unauthorized labor and price gouging.',
      }),
    });
  };

  const blockedSuppliers = suppliers.filter((s) => s.status === 'BLOCKED');
  const disruptedSuppliers = suppliers.filter((s) => s.status === 'DISRUPTED');
  const operationalSuppliers = suppliers.filter((s) => s.status === 'OPERATIONAL');
  const blockedCount = blockedSuppliers.length;
  const disruptedCount = disruptedSuppliers.length;
  const operationalCount = operationalSuppliers.length;
  const activeThreats = blockedCount + disruptedCount;
  const isGlobalCritical = activeThreats > 0;
  const statusLabel = isProcessing ? 'AGENTS PROCESSING' : isGlobalCritical ? 'CRITICAL' : 'NOMINAL';

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#05070f] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/25">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.18),transparent_35%)]" />
      <div className="pointer-events-none absolute right-20 top-28 h-72 w-72 rounded-full bg-violet-500/12 blur-3xl" />
      <div className="pointer-events-none absolute left-12 top-56 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

      <header className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl sticky top-4 z-50 mx-6 mb-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-cyan-300/80">
              <Activity className="h-4 w-4 text-cyan-400" />
              VALOR
            </div>
            <div className="max-w-2xl space-y-3">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">Supply chain resilience redesigned for operators.</h1>
              <p className="text-sm leading-6 text-zinc-400">Monitor threat vectors, reroute impacted capacity, and keep all teams aligned from a single polished command center.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-cyan-500/15 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-300 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
              <div className="text-xs uppercase tracking-[0.28em] text-zinc-500">Operational Nodes</div>
              <div className="mt-2 text-2xl font-semibold text-white">{suppliers.filter((s) => s.status === 'OPERATIONAL').length}/{suppliers.length || 1}</div>
            </div>
            <div className={`rounded-2xl border px-4 py-3 text-sm shadow-[0_20px_50px_rgba(0,0,0,0.2)] ${isGlobalCritical ? 'border-red-500/20 bg-red-500/10 text-red-300' : 'border-cyan-500/20 bg-cyan-500/10 text-cyan-200'}`}>
              <div className="text-xs uppercase tracking-[0.28em]">{isProcessing ? 'AGENTS PROCESSING' : isGlobalCritical ? 'CRITICAL' : 'NOMINAL'}</div>
              <div className="mt-2 text-2xl font-semibold">{blockedCount + disruptedCount} Active</div>
            </div>
            <button
              type="button"
              onClick={() => simulateDisaster()}
              disabled={isProcessing}
              className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_20px_50px_rgba(6,182,212,0.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isProcessing ? 'Processing...' : 'Simulate Disaster'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 grid gap-6 xl:grid-cols-[2.2fr_1fr] p-4 px-6 overflow-hidden">
        <div className="grid gap-6">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.35)] overflow-hidden">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Live network map</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Operational footprint</h2>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs uppercase tracking-[0.28em] text-cyan-200 shadow-sm">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" /> {isProcessing ? 'AGENTS PROCESSING' : isGlobalCritical ? 'CRITICAL' : 'NOMINAL'}
              </span>
            </div>

            <div className="relative h-[520px] overflow-hidden rounded-[1.75rem] border border-cyan-900/40 bg-[#02050b] shadow-inner">
              <MapWrapper suppliers={suppliers} hq={hq} />
              <div className="absolute left-5 top-5 rounded-2xl border border-white/10 bg-black/60 px-3 py-3 text-xs text-zinc-300 backdrop-blur-md shadow-lg">
                <div className="font-semibold uppercase tracking-[0.24em] text-cyan-300">Legend</div>
                <div className="mt-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-cyan-400" /> HQ</div>
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Operational</div>
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /> Disrupted</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Threat matrix</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Severity & response</h2>
              </div>
              <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">{suppliers.length} nodes monitored</div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setSelectedThreatDetail('BLOCKED')}
                className={`rounded-3xl border border-white/10 bg-black/30 p-4 text-left transition ${selectedThreatDetail === 'BLOCKED' ? 'border-red-400/40 bg-red-950/30 shadow-[0_0_25px_rgba(239,68,68,0.2)]' : 'hover:border-red-400/20 hover:bg-white/5'}`}
              >
                <div className="text-xs uppercase tracking-[0.3em] text-red-400/80">Blocked</div>
                <div className="mt-4 text-4xl font-semibold text-red-400">{blockedCount}</div>
                <p className="mt-2 text-sm text-zinc-500">Immediate escalation required.</p>
              </button>
              <button
                type="button"
                onClick={() => setSelectedThreatDetail('DISRUPTED')}
                className={`rounded-3xl border border-white/10 bg-black/30 p-4 text-left transition ${selectedThreatDetail === 'DISRUPTED' ? 'border-amber-400/40 bg-amber-950/20 shadow-[0_0_25px_rgba(234,179,8,0.2)]' : 'hover:border-amber-400/20 hover:bg-white/5'}`}
              >
                <div className="text-xs uppercase tracking-[0.3em] text-amber-400/80">Disrupted</div>
                <div className="mt-4 text-4xl font-semibold text-amber-300">{disruptedCount}</div>
                <p className="mt-2 text-sm text-zinc-500">Monitoring for automated reroute.</p>
              </button>
              <button
                type="button"
                onClick={() => setSelectedThreatDetail('OPERATIONAL')}
                className={`rounded-3xl border border-white/10 bg-black/30 p-4 text-left transition ${selectedThreatDetail === 'OPERATIONAL' ? 'border-emerald-400/40 bg-emerald-950/20 shadow-[0_0_25px_rgba(16,185,129,0.2)]' : 'hover:border-emerald-400/20 hover:bg-white/5'}`}
              >
                <div className="text-xs uppercase tracking-[0.3em] text-emerald-400/80">Operational</div>
                <div className="mt-4 text-4xl font-semibold text-emerald-300">{operationalCount}</div>
                <p className="mt-2 text-sm text-zinc-500">Stable nodes remaining.</p>
              </button>
            </div>
            {selectedThreatDetail ? (
              <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-200">
                {selectedThreatDetail === 'BLOCKED' && (
                  <div>
                    <div className="text-xs uppercase tracking-[0.32em] text-red-400/80">Blocked suppliers</div>
                    <p className="mt-3 text-base text-white">These suppliers are currently blocked and need immediate follow-up.</p>
                    <div className="mt-4 grid gap-3">
                      {blockedSuppliers.length ? blockedSuppliers.map((supplier) => (
                        <div key={supplier.id} className="rounded-2xl border border-red-500/20 bg-red-950/10 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-semibold text-white">{supplier.name}</div>
                              <div className="text-xs text-zinc-500">{supplier.id}</div>
                            </div>
                            <span className="rounded-full bg-red-500/10 px-2 py-1 text-[11px] text-red-300 uppercase">{supplier.status}</span>
                          </div>
                          <div className="mt-3 grid gap-2 text-xs text-zinc-400 sm:grid-cols-2">
                            <div>Price: ${supplier.current_price ?? 'N/A'}</div>
                            <div>Location: {supplier.lat}, {supplier.lng}</div>
                          </div>
                        </div>
                      )) : <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-zinc-500">No blocked suppliers are currently reported.</div>}
                    </div>
                  </div>
                )}
                {selectedThreatDetail === 'DISRUPTED' && (
                  <div>
                    <div className="text-xs uppercase tracking-[0.32em] text-amber-400/80">Disrupted suppliers</div>
                    <p className="mt-3 text-base text-white">These suppliers are disrupted but still available for partial routing and monitoring.</p>
                    <div className="mt-4 grid gap-3">
                      {disruptedSuppliers.length ? disruptedSuppliers.map((supplier) => (
                        <div key={supplier.id} className="rounded-2xl border border-amber-400/20 bg-amber-950/10 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-semibold text-white">{supplier.name}</div>
                              <div className="text-xs text-zinc-500">{supplier.id}</div>
                            </div>
                            <span className="rounded-full bg-amber-400/10 px-2 py-1 text-[11px] text-amber-300 uppercase">{supplier.status}</span>
                          </div>
                          <div className="mt-3 grid gap-2 text-xs text-zinc-400 sm:grid-cols-2">
                            <div>Price: ${supplier.current_price ?? 'N/A'}</div>
                            <div>Location: {supplier.lat}, {supplier.lng}</div>
                          </div>
                        </div>
                      )) : <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-zinc-500">No disrupted suppliers are currently reported.</div>}
                    </div>
                  </div>
                )}
                {selectedThreatDetail === 'OPERATIONAL' && (
                  <div>
                    <div className="text-xs uppercase tracking-[0.32em] text-emerald-400/80">Operational suppliers</div>
                    <p className="mt-3 text-base text-white">These suppliers are healthy and available to carry additional load if needed.</p>
                    <div className="mt-4 grid gap-3">
                      {operationalSuppliers.length ? operationalSuppliers.map((supplier) => (
                        <div key={supplier.id} className="rounded-2xl border border-emerald-400/20 bg-emerald-950/10 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-semibold text-white">{supplier.name}</div>
                              <div className="text-xs text-zinc-500">{supplier.id}</div>
                            </div>
                            <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[11px] text-emerald-300 uppercase">{supplier.status}</span>
                          </div>
                          <div className="mt-3 grid gap-2 text-xs text-zinc-400 sm:grid-cols-2">
                            <div>Price: ${supplier.current_price ?? 'N/A'}</div>
                            <div>Location: {supplier.lat}, {supplier.lng}</div>
                          </div>
                        </div>
                      )) : <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-zinc-500">No operational suppliers are currently reported.</div>}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-500">
                Click a category above to view supplier details for that status.
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Supplier directory</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Select a target</h2>
              </div>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.28em] text-zinc-400">Interactive</span>
            </div>

            <div className="max-h-[360px] space-y-3 overflow-y-auto pr-2">
              {suppliers.length ? (
                suppliers.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => simulateDisaster(s.id)}
                    className={`w-full rounded-3xl border px-4 py-3 text-left transition ${
                      s.status === 'BLOCKED'
                        ? 'border-red-900/40 bg-red-900/10 text-red-300'
                        : 'border-zinc-800/80 bg-white/5 text-zinc-200 hover:border-cyan-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">{s.id}</p>
                        <p className="mt-1 text-sm font-semibold text-white">{s.name}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${
                        s.status === 'OPERATIONAL'
                          ? 'bg-emerald-500/10 text-emerald-300'
                          : 'bg-red-500/10 text-red-300'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-3xl border border-white/10 bg-black/20 p-6 text-center text-sm text-zinc-500">Waiting for supplier telemetry…</div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Orchestration log</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Decision stream</h2>
              </div>
              <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-cyan-200">Live</span>
            </div>

            <div aria-live="polite" aria-atomic="true" className="max-h-[380px] overflow-y-auto space-y-3 rounded-3xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">
              {logs.length ? (
                logs.map((log, i) => (
                  <div key={i} className="rounded-3xl border border-white/10 bg-white/5 p-3 shadow-inner">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-cyan-300/80">
                      <span>{log.supplierId || 'UNKNOWN'}</span>
                      <span>{log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : ''}</span>
                    </div>
                    <p className="mt-2 text-sm text-zinc-100">{log.reasoning}</p>
                    {log.details && (
                      <div className="mt-3 grid gap-2 text-[11px] text-zinc-400 sm:grid-cols-2">
                        {log.details.finance?.alert && <div className="rounded-2xl bg-white/5 p-2">Finance: {log.details.finance.alert}</div>}
                        {log.details.compliance?.status && <div className="rounded-2xl bg-white/5 p-2">Compliance: {log.details.compliance.status}</div>}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-white/10 bg-black/20 p-6 text-center text-sm text-zinc-500">Awaiting orchestration activity…</div>
              )}
            </div>
          </div>
        </aside>
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