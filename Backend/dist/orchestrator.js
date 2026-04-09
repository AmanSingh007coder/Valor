"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/client/stdio.js");
const generative_ai_1 = require("@google/generative-ai");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const node_path_1 = __importDefault(require("node:path"));
const node_process_1 = __importDefault(require("node:process"));
const promises_1 = __importDefault(require("node:fs/promises")); // Import fs
dotenv_1.default.config();
const LOG_PATH = node_path_1.default.join(node_process_1.default.cwd(), "src", "data", "logs.json");
const genAI = new generative_ai_1.GoogleGenerativeAI(node_process_1.default.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
// --- NEW: LOGGING HELPER ---
async function addLog(entry) {
    const data = JSON.parse(await promises_1.default.readFile(LOG_PATH, "utf-8"));
    data.unshift({ ...entry, timestamp: new Date().toISOString() }); // Add to top
    await promises_1.default.writeFile(LOG_PATH, JSON.stringify(data.slice(0, 50), null, 2)); // Keep last 50
}
async function runValorOrchestrator(supplierId) {
    const transport = new stdio_js_1.StdioClientTransport({
        command: "node",
        args: [node_path_1.default.join(node_process_1.default.cwd(), "dist", "index.js")],
    });
    const client = new index_js_1.Client({ name: "Valor-Orchestrator", version: "1.0.0" }, {});
    await client.connect(transport);
    console.log(`[ORCHESTRATOR]: Analyzing ${supplierId}...`);
    const intelResponse = await client.callTool({ name: "get_triangulated_intel", arguments: { supplierId } }, types_js_1.CallToolResultSchema);
    const intelData = intelResponse.content[0].text;
    const prompt = `
    You are the 'Valor' AI Auditor. Analyze this supplier data:
    Data: ${intelData}
    Respond ONLY in JSON format: { "riskLevel": "HIGH" | "MEDIUM" | "LOW", "reasoning": "string" }
  `;
    const result = await model.generateContent(prompt);
    const rawText = result.response.text().replace(/```json|```/g, "").trim();
    const response = JSON.parse(rawText);
    // Execute Action
    const auditAction = await client.callTool({ name: "execute_audit_action", arguments: { riskLevel: response.riskLevel, supplierId } }, types_js_1.CallToolResultSchema);
    const actionText = auditAction.content[0].text;
    // --- SAVE TO LOGS.JSON ---
    await addLog({
        supplierId,
        riskLevel: response.riskLevel,
        reasoning: response.reasoning,
        action: actionText
    });
    console.log(`[LOGGED]: ${response.riskLevel} action for ${supplierId}`);
}
runValorOrchestrator("SUPPLIER_A").catch(console.error);
