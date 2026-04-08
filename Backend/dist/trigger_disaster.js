"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const node_process_1 = __importDefault(require("node:process"));
const DATA_PATH = path_1.default.join(node_process_1.default.cwd(), "src", "data", "world_state.json");
async function simulateDisaster() {
    const data = JSON.parse(await promises_1.default.readFile(DATA_PATH, "utf-8"));
    // Simulate a High Risk event for Supplier A
    data.suppliers[0].internet_news = "BREAKING: Child labor allegations at Vietnam Li-Tech facility!";
    data.suppliers[0].satellite_view = "FIRE_DETECTED_SECTOR_7";
    data.suppliers[0].gps_status = "STATIONARY_OFF_ROUTE";
    data.suppliers[0].current_price = 180; // Massive price spike
    await promises_1.default.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
    console.log("⚠️ DISASTER SIMULATED: World State Updated.");
}
simulateDisaster();
