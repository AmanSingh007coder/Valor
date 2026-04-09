"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, ShieldCheck, MapPin, ArrowRight, FileText, Sparkles, Database, Target } from 'lucide-react';

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((value) => value.trim());
    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? '';
      return row;
    }, {} as Record<string, string>);
  });
}

export default function Onboarding() {
  const router = useRouter();
  const [rules, setRules] = useState("");
  const [hqLocation, setHqLocation] = useState({ lat: 37.7749, lng: -122.4194 }); // Default SF
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const handleCSV = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const parsed = parseCsv(text);
      setSuppliers(parsed);
    };
    reader.onerror = () => {
      console.error('Failed to read CSV file');
    };
    reader.readAsText(file);
  };

  const submitOnboarding = async () => {
    const response = await fetch('http://localhost:5000/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suppliers, rules, hqLocation })
    });

    if (response.ok) router.push('/'); // Redirect to main dashboard
  };

  return (
    <div className="h-screen relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.15),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(139,92,246,0.12),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.1),_transparent_45%),linear-gradient(135deg,#020617,#0f172a,#1e293b)] text-zinc-100 flex items-center justify-center px-4 py-4">
      {/* Animated background elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl animate-pulse" style={{ animation: 'float 6s ease-in-out infinite' }} />
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-purple-500/6 rounded-full blur-3xl animate-pulse delay-1000" style={{ animation: 'float 8s ease-in-out infinite reverse' }} />
        <div className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-2000" style={{ animation: 'float 7s ease-in-out infinite' }} />
        <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-blue-500/7 rounded-full blur-3xl animate-pulse delay-3000" style={{ animation: 'float 9s ease-in-out infinite reverse' }} />

        {/* Subtle particle effects */}
        <div className="absolute top-1/3 left-1/3 w-2 h-2 bg-cyan-400/40 rounded-full animate-ping" style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <div className="absolute top-2/3 right-1/3 w-1.5 h-1.5 bg-purple-400/30 rounded-full animate-ping" style={{ animationDelay: '1s', animationDuration: '4s' }} />
        <div className="absolute bottom-1/3 left-2/3 w-1 h-1 bg-emerald-400/50 rounded-full animate-ping" style={{ animationDelay: '2s', animationDuration: '3.5s' }} />
        <div className="absolute top-1/2 right-1/4 w-2.5 h-2.5 bg-blue-400/35 rounded-full animate-ping" style={{ animationDelay: '0.5s', animationDuration: '4.5s' }} />
      </div>

      <main className="relative w-full max-w-2xl max-h-[calc(100vh-1rem)] rounded-[32px] border border-white/10 bg-slate-950/95 p-4 shadow-[0_50px_150px_rgba(0,0,0,0.4),0_0_0_1px_rgba(56,189,248,0.1)] ring-1 ring-sky-500/20 backdrop-blur-2xl overflow-hidden hover:shadow-[0_60px_180px_rgba(0,0,0,0.5),0_0_0_1px_rgba(56,189,248,0.15)] transition-all duration-700" style={{ animation: 'glow 4s ease-in-out infinite' }}>
        {/* Enhanced glow effect */}
        <div className="pointer-events-none absolute inset-x-0 -top-20 h-40 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.3),_transparent_60%)] blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 -bottom-20 h-40 bg-[radial-gradient(circle_at_bottom,_rgba(139,92,246,0.2),_transparent_60%)] blur-3xl" />

        <div className="relative space-y-2 text-center mb-4">
          <div className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-gradient-to-r from-sky-500/20 to-cyan-500/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200/90 shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] transition-all duration-500">
            <Sparkles className="h-3 w-3 text-cyan-400 animate-pulse" />
            VALOR
          </div>
          <h1 className="text-2xl font-bold text-white bg-gradient-to-r from-white via-cyan-100 to-sky-200 bg-clip-text text-transparent animate-pulse">
            Initialize Supply Chain
          </h1>
          <p className="mx-auto max-w-md text-xs text-slate-300 leading-relaxed">
            Upload CSV, set parameters, let VALOR orchestrate your resilience.
          </p>
        </div>

        <div className="grid gap-2 grid-cols-1 lg:grid-cols-2">
          {/* CSV Upload Section */}
          <section className="group relative rounded-[24px] border border-sky-500/20 bg-gradient-to-br from-slate-950/90 to-slate-900/80 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(56,189,248,0.1)] hover:shadow-[0_25px_80px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(56,189,248,0.2)] transition-all duration-500 hover:border-sky-400/30 overflow-hidden">
            <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-sky-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 rounded-[24px] border border-sky-400/0 group-hover:border-sky-400/50 transition-all duration-500" style={{ background: 'linear-gradient(45deg, transparent, rgba(56,189,248,0.1), transparent)', backgroundSize: '200% 200%', animation: 'shimmer 3s ease-in-out infinite' }} />
            <div className="relative flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-gradient-to-br from-sky-500/20 to-cyan-500/20 p-1.5 shadow-[0_0_15px_rgba(56,189,248,0.3)]">
                  <Database className="h-4 w-4 text-sky-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-sky-200">Data Import</p>
                  <p className="text-xs text-slate-400">Upload CSV</p>
                </div>
              </div>
              <span className="rounded-full bg-gradient-to-r from-sky-500/20 to-cyan-500/20 px-2 py-0.5 text-xs font-semibold text-sky-200 border border-sky-500/20 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
                1
              </span>
            </div>
            <div className="relative">
              <div className="rounded-[24px] border border-slate-700/50 bg-slate-950/60 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSV}
                  className="w-full text-sm text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-sky-500/20 file:to-cyan-500/20 file:text-sky-300 file:font-medium file:shadow-[0_0_10px_rgba(56,189,248,0.3)] hover:file:from-sky-500/30 hover:file:to-cyan-500/30 file:transition-all file:duration-300"
                />
              </div>
              <p className="mt-3 text-xs text-sky-300/70 leading-relaxed group-hover:text-sky-300/90 transition-colors duration-300">
                Expected format: supplier, id, status, base_price, current_price, latitude, longitude
              </p>
            </div>
          </section>

          {/* HQ Location Section */}
          <section className="group relative rounded-[24px] border border-purple-500/20 bg-gradient-to-br from-slate-950/90 to-slate-900/80 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(139,92,246,0.1)] hover:shadow-[0_25px_80px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(139,92,246,0.2)] transition-all duration-500 hover:border-purple-400/30 overflow-hidden">
            <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-purple-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 rounded-[24px] border border-purple-400/0 group-hover:border-purple-400/50 transition-all duration-500" style={{ background: 'linear-gradient(45deg, transparent, rgba(139,92,246,0.1), transparent)', backgroundSize: '200% 200%', animation: 'shimmer 3s ease-in-out infinite' }} />
            <div className="relative flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-gradient-to-br from-purple-500/20 to-violet-500/20 p-1.5 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                  <Target className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-purple-200">HQ Location</p>
                  <p className="text-xs text-slate-400">Set coordinates</p>
                </div>
              </div>
              <span className="rounded-full bg-gradient-to-r from-purple-500/20 to-violet-500/20 px-2 py-0.5 text-xs font-semibold text-purple-200 border border-purple-500/20 shadow-[0_0_10px_rgba(139,92,246,0.2)]">
                2
              </span>
            </div>
            <div className="grid gap-3 grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-purple-300/80">Latitude</label>
                <input
                  type="number"
                  placeholder="37.7749"
                  value={hqLocation.lat}
                  onChange={(e) => setHqLocation({ ...hqLocation, lat: parseFloat(e.target.value) })}
                  className="w-full rounded-xl border border-slate-700/50 bg-slate-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-purple-300/80">Longitude</label>
                <input
                  type="number"
                  placeholder="-122.4194"
                  value={hqLocation.lng}
                  onChange={(e) => setHqLocation({ ...hqLocation, lng: parseFloat(e.target.value) })}
                  className="w-full rounded-xl border border-slate-700/50 bg-slate-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300"
                />
              </div>
            </div>
          </section>

          {/* Compliance Rules Section */}
          <section className="group relative lg:col-span-2 rounded-[24px] border border-emerald-500/20 bg-gradient-to-br from-slate-950/90 to-slate-900/80 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(16,185,129,0.1)] hover:shadow-[0_25px_80px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(16,185,129,0.2)] transition-all duration-500 hover:border-emerald-400/30 overflow-hidden">
            <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 rounded-[24px] border border-emerald-400/0 group-hover:border-emerald-400/50 transition-all duration-500" style={{ background: 'linear-gradient(45deg, transparent, rgba(16,185,129,0.1), transparent)', backgroundSize: '200% 200%', animation: 'shimmer 3s ease-in-out infinite' }} />
            <div className="relative flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 p-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-200">Compliance Rules</p>
                  <p className="text-xs text-slate-400">Define risk parameters</p>
                </div>
              </div>
              <span className="rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-200 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                3
              </span>
            </div>
            <div className="relative">
              <textarea
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                placeholder="e.g. Block suppliers with child labor reports. Alert if price increases exceed 20%. Flag any environmental violations..."
                className="w-full min-h-[3rem] rounded-xl border border-slate-700/50 bg-slate-950/60 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] resize-none transition-all duration-300 placeholder:text-slate-500"
              />
              <p className="mt-2 text-xs text-emerald-300/70 group-hover:text-emerald-300/90 transition-colors duration-300">
                VALOR will use these rules to monitor and respond to supply chain risks automatically.
              </p>
            </div>
          </section>
        </div>

        {/* Enhanced Submit Section */}
        <section className="mt-4 relative rounded-[24px] border border-slate-700/50 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-slate-950/90 p-3 shadow-[0_25px_80px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="absolute inset-0 rounded-[24px] bg-gradient-to-r from-sky-500/5 via-transparent to-purple-500/5" />
          <div className="relative text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-slate-800/80 to-slate-900/80 px-3 py-1 mb-2 border border-slate-700/50">
              <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 animate-pulse" />
              <span className="text-xs font-medium text-slate-300">Ready to initialize</span>
            </div>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              VALOR will configure intelligent monitoring and automated risk assessment.
            </p>
            <button
              onClick={submitOnboarding}
              className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500 px-6 py-2.5 text-sm font-bold text-white shadow-[0_20px_60px_rgba(56,189,248,0.4),0_0_0_1px_rgba(56,189,248,0.2)] transition-all duration-500 hover:shadow-[0_30px_90px_rgba(56,189,248,0.6),0_0_0_1px_rgba(56,189,248,0.4)] hover:scale-105 hover:from-sky-400 hover:via-cyan-400 hover:to-blue-400 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
              <span className="relative z-10 group-hover:animate-pulse">Initialize VALOR</span>
              <ArrowRight className="h-4 w-4 relative z-10 group-hover:translate-x-1 group-hover:scale-110 transition-all duration-300" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-sky-400/20 via-cyan-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500" />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}