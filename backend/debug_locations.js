import axios from "axios";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function checkLocations() {
    // Fetch a few locations for India
    const url = `https://api.openaq.org/v3/locations?countries_id=9&limit=3`;
    const headers = process.env.OPENAQ_API_KEY ? { "X-API-Key": process.env.OPENAQ_API_KEY } : {};

    try {
        console.log(`Fetching ${url}...`);
        const resp = await axios.get(url, { headers });
        const locs = resp.data.results;

        if (locs.length > 0) {
            console.log("First location sensors:", JSON.stringify(locs[0].sensors, null, 2));
        } else {
            console.log("No locations found.");
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkLocations();
