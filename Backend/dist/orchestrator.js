"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/client/stdio.js");
const generative_ai_1 = require("@google/generative-ai");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js"); // IMPORT THIS
const dotenv_1 = __importDefault(require("dotenv"));
const node_path_1 = __importDefault(require("node:path"));
const node_process_1 = __importDefault(require("node:process"));
dotenv_1.default.config();
const genAI = new generative_ai_1.GoogleGenerativeAI(node_process_1.default.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
async function runValorOrchestrator(supplierId) {
    const transport = new stdio_js_1.StdioClientTransport({
        command: "node",
        args: [node_path_1.default.join(node_process_1.default.cwd(), "dist", "index.js")],
    });
    const client = new index_js_1.Client({ name: "Valor-Orchestrator", version: "1.0.0" }, {});
    await client.connect(transport);
    console.log(`[ORCHESTRATOR]: Analyzing ${supplierId}...`);
    // --- FIX 1: Correct CallTool Syntax & Type Casting ---
    const intelResponse = await client.callTool({ name: "get_triangulated_intel", arguments: { supplierId } }, types_js_1.CallToolResultSchema);
    // --- FIX 2: Content access (TypeScript now knows 'content' exists) ---
    const intelData = intelResponse.content[0].text;
    const prompt = `
    You are the 'Valor' AI Auditor. Analyze this supplier data:
    Data: ${intelData}
    
    Rules: 
    - If there is news of child labor or illegal acts: Risk = HIGH.
    - If there is a price spike > 20% with suspicious news: Risk = MEDIUM.
    - Otherwise: Risk = LOW.

    Respond ONLY in JSON format: { "riskLevel": "HIGH" | "MEDIUM" | "LOW", "reasoning": "string" }
  `;
    const result = await model.generateContent(prompt);
    // Clean potential markdown from Gemini response
    const rawText = result.response.text().replace(/```json|```/g, "").trim();
    const response = JSON.parse(rawText);
    console.log(`[GEMINI ANALYSIS]: ${response.riskLevel} - ${response.reasoning}`);
    // --- FIX 3: Correct CallTool for Audit Action ---
    const auditAction = await client.callTool({
        name: "execute_audit_action",
        arguments: {
            riskLevel: response.riskLevel,
            supplierId: supplierId
        }
    }, types_js_1.CallToolResultSchema);
    // --- FIX 4: Final Log Access ---
    const actionText = auditAction.content[0].text;
    console.log(`[ACTION RESULT]: ${actionText}`);
}
runValorOrchestrator("SUPPLIER_A").catch(console.error);
