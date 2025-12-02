import axios from "axios";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function debugFailure() {
    const openaqId = 10725; // From DB query
    const headers = process.env.OPENAQ_API_KEY ? { "X-API-Key": process.env.OPENAQ_API_KEY } : {};

    console.log(`Debugging Station ID: ${openaqId}`);

    try {
        // Step 1: Fetch Location Details
        console.log("Step 1: Fetching Location Details...");
        const locUrl = `https://api.openaq.org/v3/locations/${openaqId}`;
        const locResp = await axios.get(locUrl, { headers });
        console.log("Location Found:", locResp.data.results[0].name);

        const sensorsList = locResp.data.results[0].sensors;
        console.log(`Sensors: ${sensorsList.length}`);

        // Step 2: Fetch Latest Measurements
        console.log("Step 2: Fetching Latest Measurements...");
        const latestUrl = `https://api.openaq.org/v3/locations/${openaqId}/latest`;
        const latestResp = await axios.get(latestUrl, { headers });
        console.log("Latest Data:", JSON.stringify(latestResp.data, null, 2));

    } catch (err) {
        console.error("ERROR:", err.message);
        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Data:", JSON.stringify(err.response.data, null, 2));
        }
    }
}

debugFailure();
