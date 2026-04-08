import fs from "fs/promises";
import path from "path";
import process from "node:process";

const DATA_PATH = path.join(process.cwd(), "src", "data", "world_state.json");

async function simulateDisaster() {
    const data = JSON.parse(await fs.readFile(DATA_PATH, "utf-8"));
    
    // Simulate a High Risk event for Supplier A
    data.suppliers[0].internet_news = "BREAKING: Child labor allegations at Vietnam Li-Tech facility!";
    data.suppliers[0].satellite_view = "FIRE_DETECTED_SECTOR_7";
    data.suppliers[0].gps_status = "STATIONARY_OFF_ROUTE";
    data.suppliers[0].current_price = 180; // Massive price spike

    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
    console.log("⚠️ DISASTER SIMULATED: World State Updated.");
}

simulateDisaster();