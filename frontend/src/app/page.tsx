"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Activity, Cpu, CheckCircle2, TrendingUp, ShieldAlert, Server, Box } from 'lucide-react';
import { motion } from 'framer-motion';

const MapWrapper = dynamic(() => import('@/components/MapWrapper'), { ssr: false });

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'BLOCKED':
      return "border-red-500/50 bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]";
    case 'DISRUPTED':
      return "border-amber-500/50 bg-amber-500/10 text-amber-400";
    case 'OPERATIONAL':
      return "border-emerald-500/20 bg-emerald-500/5 text-emerald-500";
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

  const getDecisionReason = (supplier: any) => {
    const latestSupplierLog = logs.find((log) => log.supplierId === supplier.id);

    if (latestSupplierLog?.reasoning) {
      return latestSupplierLog.reasoning;
    }

    if (supplier.internet_news) {
      return supplier.internet_news;
    }

    if (supplier.status === 'OPERATIONAL') {
      return 'No active threats detected. Supplier remains operational under current risk thresholds.';
    }

    return `Supplier marked as ${String(supplier.status || 'UNDER_REVIEW').replace('_', ' ')} based on latest risk evaluation.`;
  };

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

  const operationalCount = suppliers.filter((s) => s.status === 'OPERATIONAL').length;
  const riskCount = suppliers.filter((s) => s.status !== 'OPERATIONAL').length;
  const statusLabel = isProcessing ? 'AGENTS PROCESSING' : riskCount > 0 ? 'CRITICAL' : 'NOMINAL';

  return (
    <div className="min-h-screen relative overflow-y-auto bg-[#05070f] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/25">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.18),transparent_35%)]" />
      <div className="pointer-events-none absolute right-20 top-28 h-72 w-72 rounded-full bg-violet-500/12 blur-3xl" />
      <div className="pointer-events-none absolute left-12 top-56 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

      <header className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl sticky top-4 z-50 mx-6 mb-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-300" />
              <span className="font-display text-base font-black uppercase tracking-[0.42em] text-cyan-100 drop-shadow-[0_0_16px_rgba(34,211,238,0.45)] sm:text-lg">
                VALOR
              </span>
            </div>
            <div className="max-w-2xl space-y-3">
              <h1 className="bg-gradient-to-r from-cyan-100 via-white to-cyan-200 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">Supply chain resilience redesigned for operators.</h1>
              <p className="text-sm leading-6 text-zinc-400">Monitor threat vectors, reroute impacted capacity, and keep all teams aligned from a single polished command center.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-cyan-500/15 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-300 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
              <div className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-200">Operational Nodes</div>
              <div className="mt-2 text-2xl font-semibold text-white">{operationalCount}/{suppliers.length || 1}</div>
            </div>
            <div className={`rounded-2xl border px-4 py-3 text-sm shadow-[0_20px_50px_rgba(0,0,0,0.2)] ${statusLabel === 'CRITICAL' ? 'border-red-500/20 bg-red-500/10 text-red-300' : 'border-cyan-500/20 bg-cyan-500/10 text-cyan-200'}`}>
              <div className="text-xs font-bold uppercase tracking-[0.28em]">{statusLabel}</div>
              <div className="mt-2 text-2xl font-semibold">{riskCount} Active</div>
            </div>
            <button
              type="button"
              onClick={() => {
                const target = suppliers.find((s) => s.status === 'OPERATIONAL');
                if (target) simulateDisaster(target.id);
              }}
              disabled={isProcessing || operationalCount === 0}
              className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_20px_50px_rgba(6,182,212,0.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isProcessing ? 'Processing...' : 'Simulate Disaster'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 grid gap-6 p-4 px-6">
        <div className="grid gap-6 xl:grid-cols-[2.3fr_1fr]">
          <div className="rounded-[1.6rem] border border-cyan-300/25 ring-1 ring-inset ring-cyan-200/10 bg-slate-950/75 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.35),0_0_100px_rgba(6,182,212,0.30),0_0_140px_rgba(59,130,246,0.20)] overflow-hidden">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-200">Live network map</p>
                <h2 className="mt-2 bg-gradient-to-r from-cyan-100 to-white bg-clip-text text-2xl font-extrabold text-transparent">Operational footprint</h2>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs uppercase tracking-[0.28em] text-cyan-200 shadow-sm">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" /> {statusLabel}
              </span>
            </div>

            <div className="relative h-[520px] overflow-hidden rounded-[1.35rem] border border-cyan-900/50 ring-1 ring-inset ring-cyan-200/10 bg-[#02050b] shadow-inner">
              <MapWrapper suppliers={suppliers} hq={hq} />
              <div className="absolute left-5 top-5 rounded-2xl border border-white/10 bg-black/60 px-3 py-3 text-xs text-zinc-300 backdrop-blur-md shadow-lg">
                <div className="font-bold uppercase tracking-[0.24em] text-cyan-200">Legend</div>
                <div className="mt-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-cyan-400" /> HQ</div>
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Operational</div>
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /> Disrupted</div>
                </div>
              </div>
            </div>
          </div>

          <aside>
            <div className="rounded-[1.6rem] border border-cyan-300/30 ring-1 ring-inset ring-cyan-200/10 bg-[linear-gradient(160deg,rgba(8,25,38,0.96),rgba(6,14,28,0.9)_45%,rgba(35,18,53,0.75))] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.35),0_0_100px_rgba(6,182,212,0.32),0_0_150px_rgba(168,85,247,0.24)]">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.3em] text-fuchsia-200">Supplier directory</p>
                  <h2 className="mt-2 bg-gradient-to-r from-fuchsia-100 via-white to-cyan-100 bg-clip-text text-xl font-extrabold text-transparent">Select a target</h2>
                </div>
                <span className="rounded-full border border-fuchsia-300/30 bg-fuchsia-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.28em] text-fuchsia-100">Interactive</span>
              </div>

              <div className="max-h-[520px] space-y-3 overflow-y-auto pr-2">
                {suppliers.length ? (
                  suppliers.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => simulateDisaster(s.id)}
                      disabled={isProcessing}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition duration-200 hover:scale-[1.01] hover:shadow-[0_0_24px_rgba(34,211,238,0.18)] ${getStatusStyles(s.status)}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-100/90">{s.id}</p>
                          <p className="mt-1 text-sm font-semibold text-white">{s.name}</p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${s.status === 'OPERATIONAL' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
                          {s.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-zinc-400 sm:grid-cols-2">
                        <div>Price: ${s.current_price ?? 'N/A'}</div>
                        <div>Location: {s.lat}, {s.lng}</div>
                      </div>
                      <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200">Decision reason</p>
                        <p className="mt-1 text-xs leading-5 text-zinc-200">{getDecisionReason(s)}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-center text-sm text-zinc-500">Waiting for supplier telemetry…</div>
                )}
              </div>
            </div>
          </aside>
        </div>

        <div className="rounded-[1.6rem] border border-cyan-300/25 ring-1 ring-inset ring-cyan-200/10 bg-slate-950/75 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.35),0_0_100px_rgba(6,182,212,0.30),0_0_140px_rgba(59,130,246,0.20)]">
          <div className="mb-5 flex items-center justify-between">
              <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-200">Orchestration log</p>
              <h2 className="mt-2 bg-gradient-to-r from-cyan-100 to-white bg-clip-text text-xl font-extrabold text-transparent">Decision stream</h2>
            </div>
            <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-cyan-200">Live</span>
          </div>

          <div aria-live="polite" aria-atomic="true" className="max-h-[380px] overflow-y-auto rounded-[1.35rem] border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">
            {logs.length ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {logs.map((log, i) => (
                  <motion.article
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-inner"
                  >
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-cyan-300/80">
                      <span>{log.supplierId || 'UNKNOWN'}</span>
                      <span>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}</span>
                    </div>
                    <p className="mt-2 text-sm text-zinc-100">{log.reasoning}</p>
                    {log.details && (
                      <div className="mt-3 grid gap-2 text-[11px] text-zinc-400 sm:grid-cols-2">
                        {log.details.finance && <div className="rounded-2xl bg-white/5 p-2">Finance: {log.details.finance.status ?? log.details.finance.alert ?? 'N/A'}</div>}
                        {log.details.compliance?.status && <div className="rounded-2xl bg-white/5 p-2">Compliance: {log.details.compliance.status}</div>}
                      </div>
                    )}
                  </motion.article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-center text-sm text-zinc-500">Awaiting orchestration activity…</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}