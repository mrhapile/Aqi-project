import axios from "axios";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function checkSensorsList() {
    const url = `https://api.openaq.org/v3/sensors?countries_id=9&limit=5`;
    const headers = process.env.OPENAQ_API_KEY ? { "X-API-Key": process.env.OPENAQ_API_KEY } : {};

    try {
        console.log(`Fetching ${url}...`);
        const resp = await axios.get(url, { headers });
        console.log("First sensor:", JSON.stringify(resp.data.results[0], null, 2));
    } catch (err) {
        console.error("Error:", err.message);
    }
}

checkSensorsList();
