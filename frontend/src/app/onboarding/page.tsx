"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, ShieldCheck, MapPin, ArrowRight, Database, Layers, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import Papa from 'papaparse';
 
export default function Onboarding() {
  const router = useRouter();
 
  const [hqLocation, setHqLocation] = useState({ lat: 37.33, lng: 126.58 });
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [rules, setRules] = useState("Block any supplier with child labor reports. Alert if price > 20%. Ensure certifications are current.");
  const [backups, setBackups] = useState({ primary: "", secondary: "", tertiary: "" });
  const [step, setStep] = useState<"upload" | "hierarchy" | "compliance">("upload");
  const [selectedForTier, setSelectedForTier] = useState<{ [key: string]: string }>({
    primary: "", secondary: "", tertiary: ""
  });
  const [fileName, setFileName] = useState<string>("");
 
  const handleCSV = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        const parsed = results.data.map((row: any, idx: number) => ({
          ...row,
          id: row.id || `SUPP_${String(idx + 1).padStart(3, '0')}`,
          name: row.name || row.Name || `Supplier ${idx + 1}`,
          base_price: parseFloat(row.base_price || row['Base Price'] || 0),
          current_price: parseFloat(row.current_price || row['Current Price'] || 0),
          lat: parseFloat(row.lat || row.Lat || 0),
          lng: parseFloat(row.lng || row.Lng || 0),
        }));
        setSuppliers(parsed);
        setStep("hierarchy");
      },
    });
  };
 
  const assignSupplierToTier = (tier: string, supplierId: string) => {
    setSelectedForTier({ ...selectedForTier, [tier]: supplierId });
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      setBackups({ ...backups, [tier]: supplier.name });
    }
  };
 
  const submitOnboarding = async () => {
    try {
      if (!selectedForTier.primary || !suppliers.length) {
        alert("CRITICAL: Please upload a CSV and select a Primary supplier node.");
        return;
      }
      const primarySupplier = suppliers.find(s => s.id === selectedForTier.primary);
      const secondarySupplier = selectedForTier.secondary ? suppliers.find(s => s.id === selectedForTier.secondary) : null;
      const tertiarySupplier = selectedForTier.tertiary ? suppliers.find(s => s.id === selectedForTier.tertiary) : null;
 
      const response = await fetch('http://localhost:5000/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suppliers,
          hqLocation,
          hierarchy: {
            primary: primarySupplier.id,
            primaryName: primarySupplier.name,
            secondary: secondarySupplier?.id,
            secondaryName: secondarySupplier?.name,
            tertiary: tertiarySupplier?.id,
            tertiaryName: tertiarySupplier?.name,
          },
          rules,
          complianceRules: parseComplianceRules(rules)
        })
      });
 
      if (response.ok) {
        router.push('/');
      } else {
        const error = await response.json();
        alert(error.error || "Server responded with an error");
      }
    } catch (err) {
      console.error("Connection Refused:", err);
      alert("BACKEND OFFLINE: Ensure 'npx ts-node src/api.ts' is running on port 5000.");
    }
  };
 
  const parseComplianceRules = (rulesText: string) => ({
    raw: rulesText,
    priceThreshold: extractNumber(rulesText, 20),
    blockedTerms: ['child labor', 'illegal', 'violation', 'sanction'],
    requiresCertification: rulesText.toLowerCase().includes('cert'),
  });
 
  const extractNumber = (text: string, defaultVal: number) => {
    const match = text.match(/(\d+)%?/);
    return match ? parseInt(match[1]) : defaultVal;
  };
 
  const stepIndex = step === "upload" ? 0 : step === "hierarchy" ? 1 : 2;
 
  const stepConfig = [
    { label: "Data Import", key: "upload" },
    { label: "Hierarchy", key: "hierarchy" },
    { label: "Compliance", key: "compliance" },
  ];
 
  return (
    <div className="min-h-screen bg-[#060b15] text-white flex items-center justify-center p-6 relative overflow-hidden">
 
      {/* Background orbs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)', filter: 'blur(60px)', top: '-80px', left: '-120px' }} />
      <div className="absolute pointer-events-none"
        style={{ width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', filter: 'blur(60px)', bottom: '-60px', right: '-80px' }} />
 
      <div className="max-w-[680px] w-full relative z-10">
 
        {/* Header */}
        <div className="mb-7">
          <div className="inline-flex items-center gap-2 border border-cyan-500/30 rounded-full px-3.5 py-1.5 mb-5 bg-cyan-500/5">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
            <span className="text-[11px] font-semibold tracking-widest text-cyan-300 uppercase">Valor</span>
          </div>
          <h1 className="text-[30px] font-bold text-[#f0f6ff] tracking-tight leading-tight mb-2">Initialize Supply Chain</h1>
          <p className="text-sm text-[#4a6080] leading-relaxed">Upload CSV, set parameters, let VALOR orchestrate your resilience.</p>
        </div>
 
        {/* Step tracker */}
        <div className="flex items-center mb-6">
          {stepConfig.map((s, i) => (
            <React.Fragment key={s.key}>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0 ${
                  i < stepIndex
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : i === stepIndex
                    ? 'bg-cyan-500 text-black shadow-[0_0_0_3px_rgba(6,182,212,0.2)]'
                    : 'bg-white/4 text-[#3a4f6a] border border-white/7'
                }`}>
                  {i < stepIndex ? <CheckCircle2 size={13} /> : i + 1}
                </div>
                <span className={`text-xs font-semibold tracking-wide ${
                  i < stepIndex ? 'text-emerald-400' : i === stepIndex ? 'text-cyan-300' : 'text-[#2d4060]'
                }`}>
                  {s.label}
                </span>
              </div>
              {i < stepConfig.length - 1 && (
                <div className={`flex-1 h-px mx-3 transition-all ${i < stepIndex ? 'bg-emerald-500/30' : 'bg-white/6'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
 
        {/* ── STEP 1: Upload ── */}
        {step === "upload" && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3.5">
 
              {/* Data Import Card */}
              <div className="bg-[#0c1522] border border-white/7 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Database size={16} className="text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#c8dff5]">Data Import</p>
                    <p className="text-xs text-[#3a5070] mt-0.5">Upload CSV</p>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-cyan-500/12 border border-cyan-500/25 flex items-center justify-center text-[10px] font-bold text-cyan-300">1</div>
                </div>
                <div className="p-5">
                  <label className="block border-[1.5px] border-dashed border-cyan-500/20 rounded-xl p-5 text-center cursor-pointer hover:border-cyan-500/45 hover:bg-cyan-500/4 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-3">
                      <Upload size={18} className="text-cyan-400" />
                    </div>
                    <p className="text-sm font-semibold text-[#c8dff5] mb-1">Choose File</p>
                    <p className="text-xs text-[#3a5070]">{fileName || "No file chosen"}</p>
                    <input type="file" accept=".csv" onChange={handleCSV} className="hidden" />
                  </label>
 
                  <div className="flex items-center gap-1.5 mt-3 px-3 py-2 bg-white/2 border border-white/5 rounded-lg flex-wrap">
                    <span className="text-[11px] text-[#2d4060] font-medium mr-1">Expected:</span>
                    {["supplier", "id", "base_price", "lat", "lng"].map(tag => (
                      <span key={tag} className="text-[10px] font-mono text-[#3a6080] bg-cyan-500/6 border border-cyan-500/10 px-1.5 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
 
                  {suppliers.length > 0 && (
                    <div className="flex items-center gap-2 mt-3 px-3 py-2.5 bg-emerald-500/7 border border-emerald-500/20 rounded-xl">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                      <span className="text-xs text-emerald-400 font-semibold">Suppliers loaded successfully</span>
                      <span className="ml-auto text-[11px] font-bold text-emerald-400 bg-emerald-500/12 px-2 py-0.5 rounded-full">{suppliers.length}</span>
                    </div>
                  )}
                </div>
              </div>
 
              {/* HQ Location Card */}
              <div className="bg-[#0c1522] border border-white/7 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <MapPin size={16} className="text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#c8dff5]">HQ Location</p>
                    <p className="text-xs text-[#3a5070] mt-0.5">Set coordinates</p>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-violet-500/12 border border-violet-500/25 flex items-center justify-center text-[10px] font-bold text-violet-300">2</div>
                </div>
                <div className="p-5 space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#3a6080] uppercase tracking-widest mb-1.5">Latitude</label>
                    <input
                      type="number"
                      value={hqLocation.lat}
                      onChange={(e) => setHqLocation({ ...hqLocation, lat: parseFloat(e.target.value) })}
                      step="0.001"
                      className="w-full bg-white/3 border border-white/8 rounded-lg px-3 py-2.5 text-sm text-[#c8dff5] outline-none focus:border-cyan-500/40 focus:bg-cyan-500/3 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#3a6080] uppercase tracking-widest mb-1.5">Longitude</label>
                    <input
                      type="number"
                      value={hqLocation.lng}
                      onChange={(e) => setHqLocation({ ...hqLocation, lng: parseFloat(e.target.value) })}
                      step="0.001"
                      className="w-full bg-white/3 border border-white/8 rounded-lg px-3 py-2.5 text-sm text-[#c8dff5] outline-none focus:border-cyan-500/40 focus:bg-cyan-500/3 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
 
            {/* Compliance Rules Card */}
            <div className="bg-[#0c1522] border border-white/7 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={16} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#c8dff5]">Compliance Rules</p>
                  <p className="text-xs text-[#3a5070] mt-0.5">Define risk parameters</p>
                </div>
                <div className="w-5 h-5 rounded-full bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center text-[10px] font-bold text-emerald-300">3</div>
              </div>
              <div className="p-5">
                <textarea
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  placeholder="e.g. Block suppliers with child labor reports. Alert if price increases exceed 20%. Flag any environmental violations..."
                  className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-sm text-[#c8dff5] outline-none focus:border-cyan-500/40 focus:bg-cyan-500/3 transition-all resize-none h-20 placeholder:text-[#2d4060]"
                />
                <div className="flex items-start gap-2 mt-3 px-3 py-2.5 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                  <AlertCircle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 leading-relaxed">VALOR will use these rules to monitor and respond to supply chain risks automatically.</p>
                </div>
              </div>
            </div>
 
            {/* Ready + CTA */}
            <div>
              <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white/2 border border-white/5 rounded-xl mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-[#3a6080]">Ready to initialize</span>
              </div>
              <p className="text-xs text-[#2d4060] text-center mb-3">VALOR will configure intelligent monitoring and automated risk assessment.</p>
              <button
                onClick={() => setStep("hierarchy")}
                className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 active:scale-[0.99] py-3.5 rounded-xl font-bold text-white text-sm transition-all"
              >
                Initialize VALOR
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
 
        {/* ── STEP 2: Hierarchy ── */}
        {step === "hierarchy" && (
          <div className="space-y-3.5">
            <div className="bg-[#0c1522] border border-white/7 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <Layers size={16} className="text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#c8dff5]">Configure Response Hierarchy</p>
                  <p className="text-xs text-[#3a5070] mt-0.5">Assign supplier tiers and failovers</p>
                </div>
              </div>
              <div className="p-5 space-y-5">
                <p className="text-xs text-[#2d4060] leading-relaxed">Select suppliers for each tier. Primary is the main supplier; Secondary and Tertiary are automated failovers.</p>
 
                {([
                  { key: "primary", label: "Primary Supplier", color: "bg-emerald-500", badge: "Main" },
                  { key: "secondary", label: "Secondary Supplier", color: "bg-amber-500", badge: "Failover" },
                  { key: "tertiary", label: "Tertiary Supplier", color: "bg-orange-500", badge: "Failover" },
                ] as const).map((tier, idx) => (
                  <div key={tier.key}>
                    {idx > 0 && <div className="h-px bg-white/5 mb-5" />}
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${tier.color}`} />
                      <span className="text-[11px] font-bold text-[#4a6080] uppercase tracking-widest">{tier.label}</span>
                      {tier.badge === "Failover" && (
                        <span className="text-[10px] text-[#2d4060] font-normal normal-case tracking-normal ml-1">(failover)</span>
                      )}
                    </div>
                    <select
                      value={selectedForTier[tier.key] || ""}
                      onChange={(e) => assignSupplierToTier(tier.key, e.target.value)}
                      className="w-full bg-white/3 border border-white/8 hover:border-cyan-500/30 focus:border-cyan-500/40 focus:bg-cyan-500/3 rounded-lg px-3 py-2.5 text-sm text-[#c8dff5] outline-none transition-all appearance-none cursor-pointer"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%233a5070' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                    >
                      <option value="">— Select a supplier —</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name} (₩{s.current_price}k)</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
 
            <div className="flex gap-3">
              <button onClick={() => setStep("upload")} className="flex-1 py-3 rounded-xl font-bold text-sm text-[#4a6080] bg-white/4 border border-white/7 hover:bg-white/7 hover:text-[#7a9ac0] transition-all">
                ← Back
              </button>
              <button
                onClick={() => setStep("compliance")}
                disabled={!selectedForTier.primary}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white bg-cyan-700 hover:bg-cyan-600 disabled:bg-white/5 disabled:text-[#2d4060] disabled:cursor-not-allowed transition-all"
              >
                Configure Compliance
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
 
        {/* ── STEP 3: Compliance Review ── */}
        {step === "compliance" && (
          <div className="space-y-3.5">
            <div className="bg-[#0c1522] border border-white/7 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={16} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#c8dff5]">Compliance & Configuration Review</p>
                  <p className="text-xs text-[#3a5070] mt-0.5">Confirm rules before initializing</p>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#3a6080] uppercase tracking-widest mb-2">Blocking Criteria</label>
                  <textarea
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
                    className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-sm text-[#c8dff5] outline-none focus:border-cyan-500/40 focus:bg-cyan-500/3 transition-all resize-none h-20"
                  />
                </div>
 
                <div className="grid grid-cols-2 gap-3">
                  {/* HQ mini card */}
                  <div className="bg-white/2 border border-white/5 rounded-xl p-3.5">
                    <p className="text-[10px] font-bold text-[#2d4060] uppercase tracking-widest mb-2.5">HQ Coordinates</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[#3a5070]">Latitude</span>
                        <span className="text-[11px] font-semibold text-cyan-400">{hqLocation.lat.toFixed(4)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[#3a5070]">Longitude</span>
                        <span className="text-[11px] font-semibold text-cyan-400">{hqLocation.lng.toFixed(4)}</span>
                      </div>
                    </div>
                  </div>
 
                  {/* Hierarchy mini card */}
                  <div className="bg-white/2 border border-white/5 rounded-xl p-3.5">
                    <p className="text-[10px] font-bold text-[#2d4060] uppercase tracking-widest mb-2.5">Hierarchy</p>
                    <div className="space-y-1.5">
                      {[
                        { dot: "bg-emerald-500", label: "Primary", val: backups.primary },
                        { dot: "bg-amber-500", label: "Secondary", val: backups.secondary },
                        { dot: "bg-orange-500", label: "Tertiary", val: backups.tertiary },
                      ].map(row => (
                        <div key={row.label} className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${row.dot}`} />
                          <span className="text-[11px] text-[#3a5070]">{row.label}</span>
                          <span className="text-[11px] font-semibold text-cyan-400 ml-auto truncate max-w-[80px]">{row.val || "Not set"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
 
            <div className="flex gap-3">
              <button onClick={() => setStep("hierarchy")} className="flex-1 py-3 rounded-xl font-bold text-sm text-[#4a6080] bg-white/4 border border-white/7 hover:bg-white/7 hover:text-[#7a9ac0] transition-all">
                ← Back
              </button>
              <button
                onClick={submitOnboarding}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white bg-emerald-700 hover:bg-emerald-600 active:scale-[0.99] transition-all shadow-[0_1px_0_rgba(0,0,0,0.3)]"
              >
                <ShieldCheck size={16} />
                Initialize Strategic OS
              </button>
            </div>
          </div>
        )}
 
      </div>
    </div>
  );
}