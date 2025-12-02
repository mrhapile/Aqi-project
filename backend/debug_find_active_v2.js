import axios from "axios";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function findActiveStation() {
    const headers = process.env.OPENAQ_API_KEY ? { "X-API-Key": process.env.OPENAQ_API_KEY } : {};

    try {
        // Just get a list without complex sorting first
        console.log("Fetching locations...");
        const url = `https://api.openaq.org/v3/locations?countries_id=9&limit=20`;

        const resp = await axios.get(url, { headers });
        const locations = resp.data.results;

        for (const loc of locations) {
            console.log(`\nChecking Location: ${loc.id} (${loc.name})`);

            const latestUrl = `https://api.openaq.org/v3/locations/${loc.id}/latest`;
            try {
                const latestResp = await axios.get(latestUrl, { headers });
                if (latestResp.data.results.length > 0) {
                    console.log("FOUND DATA:", JSON.stringify(latestResp.data.results, null, 2));
                    // Found one, we can stop
                    return;
                } else {
                    console.log("No latest data.");
                }
            } catch (e) {
                console.log("Error fetching latest:", e.message);
            }
        }
        console.log("No active stations found in the first 20.");

    } catch (err) {
        console.error("Error:", err.message);
    }
}

findActiveStation();
