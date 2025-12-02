import axios from "axios";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function findRecentStation() {
    const headers = process.env.OPENAQ_API_KEY ? { "X-API-Key": process.env.OPENAQ_API_KEY } : {};

    try {
        // Try to find locations updated recently
        // v3 supports order_by=datetimeLast
        console.log("Searching for locations updated in 2025...");
        const url = `https://api.openaq.org/v3/locations?countries_id=9&order_by=datetimeLast&sort=desc&limit=10`;

        const resp = await axios.get(url, { headers });
        const locations = resp.data.results;

        for (const loc of locations) {
            console.log(`\nChecking Location: ${loc.id} (${loc.name}) - Last Updated: ${loc.datetimeLast}`);

            // Check if last updated is recent
            const lastUpdate = new Date(loc.datetimeLast);
            const now = new Date();
            const diffHours = (now - lastUpdate) / (1000 * 60 * 60);

            if (diffHours < 48) {
                console.log("✅ RECENT UPDATE FOUND!");
                const latestUrl = `https://api.openaq.org/v3/locations/${loc.id}/latest`;
                const latestResp = await axios.get(latestUrl, { headers });
                console.log("Data:", JSON.stringify(latestResp.data.results, null, 2));
                return;
            } else {
                console.log(`❌ Stale data (${Math.round(diffHours / 24)} days old)`);
            }
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
}

findRecentStation();
