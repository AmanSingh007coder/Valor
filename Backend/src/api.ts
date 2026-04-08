import express from "express";
import cors from "cors";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const STATE_PATH = path.join(process.cwd(), "src", "data", "world_state.json");
const LOG_PATH = path.join(process.cwd(), "src", "data", "logs.json");

// 1. Endpoint for the Map (Suppliers & Status)
app.get("/api/state", async (req, res) => {
  try {
    const data = await fs.readFile(STATE_PATH, "utf-8");
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: "Failed to read state" });
  }
});

// 2. Endpoint for the scrolling Agent LogsS
app.get("/api/logs", async (req, res) => {
  try {
    const data = await fs.readFile(LOG_PATH, "utf-8");
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: "Failed to read logs" });
  }
});

// 3. (Optional) Manual Disaster Trigger for the Frontend "Fire" button
app.post("/api/trigger-disaster", async (req, res) => {
    const { supplierId, news } = req.body;
    const data = JSON.parse(await fs.readFile(STATE_PATH, "utf-8"));
    const supplier = data.suppliers.find((s: any) => s.id === supplierId);
    
    if (supplier) {
        supplier.internet_news = news || "CRITICAL: Physical anomaly detected!";
        supplier.status = "DISRUPTED";
        await fs.writeFile(STATE_PATH, JSON.stringify(data, null, 2));
        res.json({ message: "Disaster injected successfully." });
    } else {
        res.status(404).json({ error: "Supplier not found" });
    }
});

app.listen(PORT, () => {
  console.log(`🚀 Valor API live at http://localhost:${PORT}`);
});