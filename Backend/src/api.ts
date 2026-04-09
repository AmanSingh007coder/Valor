import express from "express";
import cors from "cors";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { runValorGraph } from "./langgraph_orchestrator";
import { ComplianceRulesEngine } from "./compliance";
import { monitor } from "./monitor";
import type { WorldState, Supplier, SupplierHierarchy, ComplianceRule } from "./types";

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
  const { suppliers, hqLocation, hierarchy, rules, complianceRules } = req.body;

  console.log(`[API] Onboarding new supply chain with ${suppliers.length} suppliers...`);
  console.log(`[API] Hierarchy - Primary: ${hierarchy.primaryName}, Secondary: ${hierarchy.secondaryName}, Tertiary: ${hierarchy.tertiaryName}`);

  try {
    // Validate hierarchy
    if (!hierarchy.primary) {
      return res.status(400).json({ error: "Primary supplier is required" });
    }

    // Create world state with proper structure
    const newState: WorldState = {
      company_rules: rules,
      compliance_rules: complianceRules || {
        raw: rules,
        priceThreshold: 20,
        blockedTerms: ["child labor", "illegal", "violation", "sanction"],
        requiresCertification: false,
      },
      hq: hqLocation || { lat: 37.33, lng: 126.58 },
      hierarchy: {
        primary: hierarchy.primary,
        primaryName: hierarchy.primaryName,
        secondary: hierarchy.secondary,
        secondaryName: hierarchy.secondaryName,
        tertiary: hierarchy.tertiary,
        tertiaryName: hierarchy.tertiaryName,
      },
      active_node: hierarchy.primary,
      current_path: [hierarchy.primary],
      disruption_history: [],
      suppliers: suppliers.map((s: any, idx: number) => ({
        id: s.id || `SUPP_${String(idx + 1).padStart(3, '0')}`,
        name: s.name,
        base_price: parseFloat(s.base_price || 0),
        current_price: parseFloat(s.current_price || 0),
        lat: parseFloat(s.lat),
        lng: parseFloat(s.lng),
        status: "OPERATIONAL" as const,
        tier: s.id === hierarchy.primary ? "primary" : s.id === hierarchy.secondary ? "secondary" : s.id === hierarchy.tertiary ? "tertiary" : undefined,
        internet_news: "Normal production",
        gps_status: "MOVING",
        satellite_view: "CLEAR",
        compliance_score: 100,
        risk_level: "LOW" as const,
      })),
    };

    await fs.writeFile(STATE_PATH, JSON.stringify(newState, null, 2));
    await fs.writeFile(LOG_PATH, JSON.stringify([], null, 2));

    // Start continuous monitoring
    monitor.start();

    res.json({
      success: true,
      message: "Supply chain initialized successfully. Monitoring started.",
      data: {
        suppliers_count: suppliers.length,
        hierarchy: hierarchy,
        hq: hqLocation,
      },
    });
  } catch (err) {
    console.error("Onboarding Error:", err);
    res.status(500).json({ error: "Onboarding failed", details: String(err) });
  }
});

// 4. POST Trigger (Start AI Brain) - Enhanced with Hierarchy Routing
app.post("/api/trigger-disaster", async (req, res) => {
    const { supplierId, news } = req.body;
    try {
        const fileData = await fs.readFile(STATE_PATH, "utf-8");
        const data: WorldState = JSON.parse(fileData);
        const supplier = data.suppliers.find((s: any) => s.id === supplierId);
        
        if (supplier) {
            supplier.internet_news = news;
            supplier.status = "DISRUPTED";
            await fs.writeFile(STATE_PATH, JSON.stringify(data, null, 2));
            
            // Run the MCP orchestration process
            runValorGraph(supplierId, data).catch(err => console.error("Graph Error:", err));
            res.json({ message: "Disruption detected. AI Brain activated." });
        } else {
            res.status(404).json({ error: "Supplier not found" });
        }
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// 5. NEW: POST Verify Compliance Check
app.post("/api/check-supplier-compliance", async (req, res) => {
    const { supplierId } = req.body;
    try {
        const fileData = await fs.readFile(STATE_PATH, "utf-8");
        const data: WorldState = JSON.parse(fileData);
        const supplier = data.suppliers.find((s: any) => s.id === supplierId);
        
        if (!supplier) {
            return res.status(404).json({ error: "Supplier not found" });
        }

        const engine = new ComplianceRulesEngine(data.compliance_rules);
        const compliance = engine.checkCompliance(supplier, supplier.internet_news);
        const action = engine.determineAction(supplier, compliance.score, { web_news: supplier.internet_news }, {});

        // Update supplier compliance score
        supplier.compliance_score = compliance.score;
        supplier.risk_level = compliance.score < 30 ? "HIGH" : compliance.score < 60 ? "MEDIUM" : "LOW";

        // If action is BLOCK or SHIFT, trigger rerouting
        if (action !== "KEEP" && data.active_node === supplierId) {
            const nextSupplier = engine.getNextInHierarchy(
                supplierId,
                data.hierarchy.primary,
                data.hierarchy.secondary,
                data.hierarchy.tertiary
            );

            if (nextSupplier) {
                const oldActive = data.active_node;
                data.active_node = nextSupplier;
                data.current_path = data.current_path || [];
                data.current_path.push(nextSupplier);

                // Record disruption event
                if (!data.disruption_history) data.disruption_history = [];
                data.disruption_history.push({
                    timestamp: new Date().toISOString(),
                    supplierId: supplierId,
                    supplierName: supplier.name,
                    reason: compliance.violations[0] || "Compliance check failed",
                    previousActive: oldActive || "UNKNOWN",
                    newActive: nextSupplier,
                    riskLevel: supplier.risk_level,
                });

                console.log(
                    `⚠️ REROUTING: ${supplier.name} → Using ${nextSupplier} (${action} decision)`
                );
            }
        }

        await fs.writeFile(STATE_PATH, JSON.stringify(data, null, 2));

        res.json({
            supplierId,
            supplierName: supplier.name,
            compliant: compliance.isCompliant,
            score: compliance.score,
            violations: compliance.violations,
            action,
            rerouted: data.active_node !== supplierId && supplier.status !== "OPERATIONAL",
            current_active: data.active_node,
        });
    } catch (err) {
        console.error("Compliance check error:", err);
        res.status(500).json({ error: "Compliance check failed" });
    }
});

// 6. GET Monitor Status
app.get("/api/monitor-status", (req, res) => {
    res.json({
        running: monitor.isRunning(),
        status: monitor.isRunning() ? "Active - Monitoring all suppliers" : "Inactive"
    });
});

app.listen(PORT, async () => {
  console.log(`🚀 Valor API live at http://localhost:${PORT}`);
  
  // Check if supply chain already exists and start monitoring
  try {
    const data = await fs.readFile(STATE_PATH, "utf-8");
    const state: WorldState = JSON.parse(data);
    if (state.suppliers && state.suppliers.length > 0) {
      monitor.start();
      console.log(`📡 Resumed monitoring for ${state.suppliers.length} suppliers`);
    }
  } catch (err) {
    // No existing state, monitoring will start after onboarding
  }
});