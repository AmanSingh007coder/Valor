import express from "express";
import cors from "cors";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { runValorGraph } from "./langgraph_orchestrator";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const STATE_PATH = path.join(process.cwd(), "src", "data", "world_state.json");
const LOG_PATH = path.join(process.cwd(), "src", "data", "logs.json");

// 1. GET State (For the Map)
app.get("/api/state", async (req, res) => {
  try {
    const data = await fs.readFile(STATE_PATH, "utf-8");
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: "Failed to read state" });
  }
});

// 2. GET Logs (For the Terminal)
app.get("/api/logs", async (req, res) => {
  try {
    const data = await fs.readFile(LOG_PATH, "utf-8");
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: "Failed to read logs" });
  }
});

// 3. POST Onboarding (THE MISSING LINK)
app.post("/api/onboarding", async (req, res) => {
  const { suppliers, rules, hqLocation } = req.body;
  console.log(`[API] Onboarding new supply chain with ${suppliers.length} suppliers...`);
  
  try {
    const newState = {
      company_rules: rules,
      hq: hqLocation,
      suppliers: suppliers.map((s: any) => ({
        id: s.id || `SUPP_${Math.random().toString(36).substr(2, 5)}`,
        name: s.name,
        base_price: parseFloat(s.base_price || 0),
        current_price: parseFloat(s.current_price || 0),
        lat: parseFloat(s.lat),
        lng: parseFloat(s.lng),
        status: "OPERATIONAL",
        internet_news: "Normal production",
        gps_status: "MOVING",
        satellite_view: "CLEAR"
      }))
    };

    await fs.writeFile(STATE_PATH, JSON.stringify(newState, null, 2));
    await fs.writeFile(LOG_PATH, JSON.stringify([], null, 2));

    res.json({ message: "Supply chain initialized successfully" });
  } catch (err) {
    console.error("Onboarding Error:", err);
    res.status(500).json({ error: "Onboarding failed" });
  }
});

// 4. POST Trigger (Start AI Brain)
app.post("/api/trigger-disaster", async (req, res) => {
    const { supplierId, news } = req.body;
    try {
        const fileData = await fs.readFile(STATE_PATH, "utf-8");
        const data = JSON.parse(fileData);
        const supplier = data.suppliers.find((s: any) => s.id === supplierId);
        
        if (supplier) {
            supplier.internet_news = news;
            supplier.status = "DISRUPTED";
            await fs.writeFile(STATE_PATH, JSON.stringify(data, null, 2));
            
            runValorGraph(supplierId).catch(err => console.error("Graph Error:", err));
            res.json({ message: "Disaster injected." });
        } else {
            res.status(404).json({ error: "Supplier not found" });
        }
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

app.listen(PORT, () => {
  console.log(`🚀 Valor API live at http://localhost:${PORT}`);
});