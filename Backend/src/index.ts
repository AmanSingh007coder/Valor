import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

const server = new Server({
  name: "Valor-MCP-Server",
  version: "1.0.0",
});

const STATE_PATH = path.join(process.cwd(), "src", "data", "world_state.json");

async function getWorldState() {
  try {
    const data = await fs.readFile(STATE_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return { suppliers: [] };
  }
}

// Define available tools
const TOOLS = [
  {
    name: "get_triangulated_intel",
    description: "Fetch live news, weather, and GPS data for a supplier",
    inputSchema: {
      type: "object",
      properties: {
        supplierId: {
          type: "string",
          description: "The supplier ID",
        },
        lat: {
          type: "number",
          description: "Latitude",
        },
        lng: {
          type: "number",
          description: "Longitude",
        },
        name: {
          type: "string",
          description: "Supplier name",
        },
      },
      required: ["supplierId", "lat", "lng", "name"],
    },
  },
];

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

// Handle tool calls
server.setRequestHandler(
  { method: "tools/call" } as any,
  async (request: any) => {
    const { name, arguments: args } = request.params;

    if (name === "get_triangulated_intel") {
      const { supplierId, lat, lng, name: supplierName } = args;
      const state = await getWorldState();
      const s = state.suppliers.find((sup: any) => sup.id === supplierId);

      // Fetch live news
      let liveNews = s?.internet_news || "Normal production";
      try {
        const newsRes = await axios.post("https://api.tavily.com/search", {
          api_key: process.env.TAVILY_API_KEY,
          query: `${supplierName} corporate safety reputation environmental reports 2026`,
          search_depth: "basic",
        });
        if (s?.internet_news?.includes("Normal")) {
          liveNews = newsRes.data.results[0]?.content || liveNews;
        }
      } catch (e) {
        console.error("News API Error");
      }

      // Fetch weather
      let weatherReport = "CLEAR_VISIBILITY";
      try {
        const wRes = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${process.env.WEATHER_API_KEY}`
        );
        if (
          wRes.data.weather[0].main === "Thunderstorm" ||
          wRes.data.weather[0].main === "Rain"
        ) {
          weatherReport = "OBSCURED_BY_STORM";
        }
      } catch (e) {
        console.error("Weather API Error");
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              web_news: liveNews,
              satellite_view: weatherReport,
              gps_status:
                weatherReport === "CLEAR_VISIBILITY" ? "OPTIMAL" : "DEGRADED",
            }),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  }
);

// Start the server
const transport = new StdioServerTransport();
server.connect(transport);

