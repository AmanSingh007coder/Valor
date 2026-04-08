import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 1. Initialize the Sentinel-X MCP Server
const server = new McpServer({
  name: "Sentinel-X",
  version: "1.0.0",
});

// 2. Define a placeholder tool (The "Contract" for the 4th guy)
server.tool(
  "fetch_news_alerts",
  { supplierId: z.string() },
  async ({ supplierId }) => {
    // For now, returning mock data so your teammate can work
    return {
      content: [{ type: "text", text: `Scanned news for ${supplierId}: Potential strike detected.` }]
    };
  }
);

// 3. Start the server using Stdio transport (Standard for MCP)
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Sentinel-X MCP Server running on stdio");