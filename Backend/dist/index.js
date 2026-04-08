"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const node_process_1 = __importDefault(require("node:process"));
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = require("zod");
const DATA_PATH = node_path_1.default.join(node_process_1.default.cwd(), "src", "data", "world_state.json");
async function getWorldState() {
    return JSON.parse(await promises_1.default.readFile(DATA_PATH, "utf-8"));
}
const server = new mcp_js_1.McpServer({ name: "Valor-Core", version: "1.0.0" });
// 1. SUPPLY AGENT: List available sources
server.tool("get_available_suppliers", {}, async () => {
    const state = await getWorldState();
    return { content: [{ type: "text", text: JSON.stringify(state.suppliers) }] };
});
// 2. COMPLIANCE AGENT: Check against company rules
server.tool("check_compliance", { supplierId: zod_1.z.string(), newsFeed: zod_1.z.string() }, async ({ supplierId, newsFeed }) => {
    const isIllegal = /child labor|illegal|unauthorized/i.test(newsFeed);
    return {
        content: [{ type: "text", text: JSON.stringify({
                    supplierId,
                    status: isIllegal ? "NON_COMPLIANT" : "COMPLIANT",
                    risk: isIllegal ? "HIGH" : "LOW",
                    reason: isIllegal ? "Detected Child Labor/Illegal Activity" : "Clear"
                }) }]
    };
});
// 3. FINANCE AGENT: Detect price spikes
server.tool("get_finance_alerts", { supplierId: zod_1.z.string() }, async ({ supplierId }) => {
    const state = await getWorldState();
    const s = state.suppliers.find((s) => s.id === supplierId);
    const increase = ((s.current_price - s.base_price) / s.base_price) * 100;
    return {
        content: [{ type: "text", text: JSON.stringify({
                    price_increase_percent: increase.toFixed(2),
                    alert: increase > 10 ? "PRICE_CRITICAL" : "STABLE"
                }) }]
    };
});
// 4. NEWS AGENT: Triangulated Intel (Internet + GPS + Satellite)
server.tool("get_triangulated_intel", { supplierId: zod_1.z.string() }, async ({ supplierId }) => {
    const state = await getWorldState();
    const s = state.suppliers.find((s) => s.id === supplierId);
    return {
        content: [{ type: "text", text: JSON.stringify({
                    web_news: s.internet_news,
                    gps_telemetry: s.gps_status, // Mocked GPS
                    satellite_imagery: s.satellite_view // Mocked Satellite
                }) }]
    };
});
// 5. AUDIT AGENT: The Multi-Action Decision Maker
server.tool("execute_audit_action", {
    riskLevel: zod_1.z.enum(["LOW", "MEDIUM", "HIGH"]),
    supplierId: zod_1.z.string()
}, async ({ riskLevel, supplierId }) => {
    const state = await getWorldState();
    const supplierIndex = state.suppliers.findIndex((s) => s.id === supplierId);
    let actionTaken = "";
    if (riskLevel === "HIGH") {
        actionTaken = `IMMEDIATE BLOCK: ${supplierId} blacklisted.`;
        // ACTUALLY UPDATE THE DATA
        if (supplierIndex !== -1)
            state.suppliers[supplierIndex].status = "BLOCKED";
    }
    else if (riskLevel === "MEDIUM") {
        actionTaken = `PENDING BLOCK: 24h Timer started for ${supplierId}.`;
        if (supplierIndex !== -1)
            state.suppliers[supplierIndex].status = "UNDER_REVIEW";
    }
    else {
        actionTaken = `ALERT: Risk logged for ${supplierId}.`;
    }
    // SAVE THE UPDATED WORLD STATE
    await promises_1.default.writeFile(DATA_PATH, JSON.stringify(state, null, 2));
    return {
        content: [{ type: "text", text: JSON.stringify({
                    action: actionTaken,
                    timestamp: new Date().toISOString(),
                    status: "EXECUTED"
                }) }]
    };
});
const transport = new stdio_js_1.StdioServerTransport();
async function runServer() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("Valor-Core MCP Server running on stdio");
}
runServer().catch((error) => {
    console.error("Fatal error running server:", error);
    node_process_1.default.exit(1);
});
