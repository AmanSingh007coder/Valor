import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import path from "node:path";
import process from "node:process";
import fs from "node:fs/promises"; // Import fs

dotenv.config();

const LOG_PATH = path.join(process.cwd(), "src", "data", "logs.json");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// --- NEW: LOGGING HELPER ---
async function addLog(entry: any) {
  const data = JSON.parse(await fs.readFile(LOG_PATH, "utf-8"));
  data.unshift({ ...entry, timestamp: new Date().toISOString() }); // Add to top
  await fs.writeFile(LOG_PATH, JSON.stringify(data.slice(0, 50), null, 2)); // Keep last 50
}

async function runValorOrchestrator(supplierId: string) {
  const transport = new StdioClientTransport({
    command: "node",
    args: [path.join(process.cwd(), "dist", "index.js")],
  });

  const client = new Client({ name: "Valor-Orchestrator", version: "1.0.0" }, {});
  await client.connect(transport);

  console.log(`[ORCHESTRATOR]: Analyzing ${supplierId}...`);

  const intelResponse = await client.callTool(
    { name: "get_triangulated_intel", arguments: { supplierId } },
    CallToolResultSchema
  );

  const intelData = (intelResponse as any).content[0].text;

  const prompt = `
    You are the 'Valor' AI Auditor. Analyze this supplier data:
    Data: ${intelData}
    Respond ONLY in JSON format: { "riskLevel": "HIGH" | "MEDIUM" | "LOW", "reasoning": "string" }
  `;

  const result = await model.generateContent(prompt);
  const rawText = result.response.text().replace(/```json|```/g, "").trim();
  const response = JSON.parse(rawText);

  // Execute Action
  const auditAction = await client.callTool(
    { name: "execute_audit_action", arguments: { riskLevel: response.riskLevel, supplierId } },
    CallToolResultSchema
  );

  const actionText = (auditAction as any).content[0].text;

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