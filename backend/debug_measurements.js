import axios from "axios";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function checkMeasurements() {
    // Fetch recent measurements for India
    const url = `https://api.openaq.org/v3/measurements?countries_id=9&limit=5`;
    const headers = process.env.OPENAQ_API_KEY ? { "X-API-Key": process.env.OPENAQ_API_KEY } : {};

    try {
        console.log(`Fetching ${url}...`);
        const resp = await axios.get(url, { headers });
        const measurements = resp.data.results;

        if (measurements.length > 0) {
            console.log("First measurement:", JSON.stringify(measurements[0], null, 2));
        } else {
            console.log("No measurements found.");
        }

    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkMeasurements();
