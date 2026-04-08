import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";


const DATA_PATH = path.join(process.cwd(), "src", "data", "world_state.json");
async function getWorldState() {
  return JSON.parse(await fs.readFile(DATA_PATH, "utf-8"));
}

const server = new McpServer({ name: "Valor-Core", version: "1.0.0" });

// 1. SUPPLY AGENT: List available sources
server.tool("get_available_suppliers", {}, async () => {
  const state = await getWorldState();
  return { content: [{ type: "text", text: JSON.stringify(state.suppliers) }] };
});

// 2. COMPLIANCE AGENT: Check against company rules
server.tool("check_compliance", { supplierId: z.string(), newsFeed: z.string() }, async ({ supplierId, newsFeed }) => {
  const isIllegal = /child labor|illegal|unauthorized/i.test(newsFeed);
  return {
    content: [{ type: "text", text: JSON.stringify({
      supplierId,
      status: isIllegal ? "NON_COMPLIANT" : "COMPLIANT",
      risk: isIllegal ? "HIGH" : "LOW",
      reason: isIllegal ? "Detected Child Labor/Illegal Activity" : "Clear"
    })}]
  };
});

// 3. FINANCE AGENT: Detect price spikes
server.tool("get_finance_alerts", { supplierId: z.string() }, async ({ supplierId }) => {
  const state = await getWorldState();
  const s = state.suppliers.find((s: any) => s.id === supplierId);
  const increase = ((s.current_price - s.base_price) / s.base_price) * 100;
  return {
    content: [{ type: "text", text: JSON.stringify({
      price_increase_percent: increase.toFixed(2),
      alert: increase > 10 ? "PRICE_CRITICAL" : "STABLE"
    })}]
  };
});

// 4. NEWS AGENT: Triangulated Intel (Internet + GPS + Satellite)
server.tool("get_triangulated_intel", { supplierId: z.string() }, async ({ supplierId }) => {
  const state = await getWorldState();
  const s = state.suppliers.find((s: any) => s.id === supplierId);
  return {
    content: [{ type: "text", text: JSON.stringify({
      web_news: s.internet_news,
      gps_telemetry: s.gps_status, // Mocked GPS
      satellite_imagery: s.satellite_view // Mocked Satellite
    })}]
  };
});

// 5. AUDIT AGENT: The Multi-Action Decision Maker
server.tool("execute_audit_action", { 
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]), 
  supplierId: z.string() 
}, async ({ riskLevel, supplierId }) => {
  const state = await getWorldState();
  const supplierIndex = state.suppliers.findIndex((s: any) => s.id === supplierId);
  
  let actionTaken = "";
  
  if (riskLevel === "HIGH") {
    actionTaken = `IMMEDIATE BLOCK: ${supplierId} blacklisted.`;
    // ACTUALLY UPDATE THE DATA
    if (supplierIndex !== -1) state.suppliers[supplierIndex].status = "BLOCKED";
  } else if (riskLevel === "MEDIUM") {
    actionTaken = `PENDING BLOCK: 24h Timer started for ${supplierId}.`;
    if (supplierIndex !== -1) state.suppliers[supplierIndex].status = "UNDER_REVIEW";
  } else {
    actionTaken = `ALERT: Risk logged for ${supplierId}.`;
  }

  // SAVE THE UPDATED WORLD STATE
  await fs.writeFile(DATA_PATH, JSON.stringify(state, null, 2));

  return {
    content: [{ type: "text", text: JSON.stringify({
      action: actionTaken,
      timestamp: new Date().toISOString(),
      status: "EXECUTED"
    })}]
  };
});

const transport = new StdioServerTransport();
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Valor-Core MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});