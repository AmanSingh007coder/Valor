"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const node_process_1 = __importDefault(require("node:process"));
const app = (0, express_1.default)();
const PORT = 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const STATE_PATH = node_path_1.default.join(node_process_1.default.cwd(), "src", "data", "world_state.json");
const LOG_PATH = node_path_1.default.join(node_process_1.default.cwd(), "src", "data", "logs.json");
// 1. Endpoint for the Map (Suppliers & Status)
app.get("/api/state", async (req, res) => {
    try {
        const data = await promises_1.default.readFile(STATE_PATH, "utf-8");
        res.json(JSON.parse(data));
    }
    catch (err) {
        res.status(500).json({ error: "Failed to read state" });
    }
});
// 2. Endpoint for the scrolling Agent LogsS
app.get("/api/logs", async (req, res) => {
    try {
        const data = await promises_1.default.readFile(LOG_PATH, "utf-8");
        res.json(JSON.parse(data));
    }
    catch (err) {
        res.status(500).json({ error: "Failed to read logs" });
    }
});
// 3. (Optional) Manual Disaster Trigger for the Frontend "Fire" button
app.post("/api/trigger-disaster", async (req, res) => {
    const { supplierId, news } = req.body;
    const data = JSON.parse(await promises_1.default.readFile(STATE_PATH, "utf-8"));
    const supplier = data.suppliers.find((s) => s.id === supplierId);
    if (supplier) {
        supplier.internet_news = news || "CRITICAL: Physical anomaly detected!";
        supplier.status = "DISRUPTED";
        await promises_1.default.writeFile(STATE_PATH, JSON.stringify(data, null, 2));
        res.json({ message: "Disaster injected successfully." });
    }
    else {
        res.status(404).json({ error: "Supplier not found" });
    }
});
app.listen(PORT, () => {
    console.log(`🚀 Valor API live at http://localhost:${PORT}`);
});
