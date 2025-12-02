import axios from "axios";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function debugIngest() {
    // Pick a random ID from the import log or just a known one if possible.
    // The user's import log didn't show IDs.
    // I'll try to fetch one location first to get a valid ID.

    const headers = process.env.OPENAQ_API_KEY ? { "X-API-Key": process.env.OPENAQ_API_KEY } : {};

    try {
        // 1. Get a valid location ID for India
        console.log("Fetching a valid location ID...");
        const locResp = await axios.get(`https://api.openaq.org/v3/locations?countries_id=9&limit=1`, { headers });
        const loc = locResp.data.results[0];

        if (!loc) {
            console.log("No locations found for India!");
            return;
        }

        console.log(`Testing with Location ID: ${loc.id} (${loc.name})`);

        // 2. Test the latest endpoint
        const url = `https://api.openaq.org/v3/locations/${loc.id}/latest`;
        console.log(`Fetching ${url}...`);

        const resp = await axios.get(url, { headers });
        console.log("Response Status:", resp.status);
        console.log("Response Data:", JSON.stringify(resp.data, null, 2));

    } catch (err) {
        console.error("Error:", err.message);
        if (err.response) {
            console.error("Response Data:", err.response.data);
        }
    }
}

debugIngest();
