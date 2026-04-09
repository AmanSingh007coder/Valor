"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, ShieldCheck, MapPin, ArrowRight, FileText } from 'lucide-react';
import Papa from 'papaparse';

export default function Onboarding() {
  const router = useRouter();
  const [rules, setRules] = useState("");
  const [hqLocation, setHqLocation] = useState({ lat: 37.7749, lng: -122.4194 }); // Default SF
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const handleCSV = (e: any) => {
    const file = e.target.files[0];
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => setSuppliers(results.data),
    });
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-12 flex flex-col items-center">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-cyan-400 mb-2">Initialize Valor</h1>
          <p className="text-zinc-500">Onboard your supply chain and define your compliance laws.</p>
        </div>

        <div className="grid gap-6">
          {/* Step 1: CSV Upload */}
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl hover:border-cyan-500/30 transition-all">
            <h3 className="flex items-center gap-2 font-bold mb-4 text-cyan-300"><Upload size={18}/> 1. Upload Suppliers (CSV)</h3>
            <input type="file" accept=".csv" onChange={handleCSV} className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20" />
            <p className="text-[10px] text-zinc-600 mt-2">Format: name, id, base_price, current_price, lat, lng</p>
          </div>

          {/* Step 2: HQ Location */}
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
             <h3 className="flex items-center gap-2 font-bold mb-4 text-cyan-300"><MapPin size={18}/> 2. Set HQ Coordinates</h3>
             <div className="flex gap-4">
                <input type="number" placeholder="Latitude" value={hqLocation.lat} onChange={(e)=>setHqLocation({...hqLocation, lat: parseFloat(e.target.value)})} className="bg-black border border-zinc-800 p-2 rounded w-full" />
                <input type="number" placeholder="Longitude" value={hqLocation.lng} onChange={(e)=>setHqLocation({...hqLocation, lng: parseFloat(e.target.value)})} className="bg-black border border-zinc-800 p-2 rounded w-full" />
             </div>
          </div>

          {/* Step 3: Rule Builder */}
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
            <h3 className="flex items-center gap-2 font-bold mb-4 text-cyan-300"><ShieldCheck size={18}/> 3. Define Compliance Laws</h3>
            <textarea 
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="e.g. Block anyone with child labor reports. Alert me if price jumps > 20%..."
              className="w-full h-32 bg-black border border-zinc-800 rounded p-4 text-sm focus:border-cyan-500 outline-none"
            />
          </div>
        </div>

        <button 
          onClick={submitOnboarding}
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
        >
          Initialize Dashboard <ArrowRight size={20}/>
        </button>
      </div>
    </div>
  );
}