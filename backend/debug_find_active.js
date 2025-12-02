import axios from "axios";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function findActiveStation() {
    const headers = process.env.OPENAQ_API_KEY ? { "X-API-Key": process.env.OPENAQ_API_KEY } : {};

    try {
        // Search for locations sorted by last updated
        console.log("Searching for recently updated locations...");
        const url = `https://api.openaq.org/v3/locations?countries_id=9&order_by=lastUpdated&sort=desc&limit=5`;

        const resp = await axios.get(url, { headers });
        const locations = resp.data.results;

        for (const loc of locations) {
            console.log(`\nChecking Location: ${loc.id} (${loc.name}) - Last Updated: ${loc.datetimeLast}`);

            // Check latest values
            const latestUrl = `https://api.openaq.org/v3/locations/${loc.id}/latest`;
            const latestResp = await axios.get(latestUrl, { headers });

            if (latestResp.data.results.length > 0) {
                console.log("FOUND DATA:", JSON.stringify(latestResp.data.results, null, 2));
                return;
            } else {
                console.log("No latest data found.");
            }
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
}

findActiveStation();
