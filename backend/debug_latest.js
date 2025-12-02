import axios from "axios";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function checkLatest() {
    // Try /v3/latest
    const url = `https://api.openaq.org/v3/latest?countries_id=9&limit=5`;
    const headers = process.env.OPENAQ_API_KEY ? { "X-API-Key": process.env.OPENAQ_API_KEY } : {};

    try {
        console.log(`Fetching ${url}...`);
        const resp = await axios.get(url, { headers });
        console.log("Success /v3/latest!");
        console.log(JSON.stringify(resp.data.results[0], null, 2));
    } catch (err) {
        console.error("/v3/latest Error:", err.message);
    }
}

checkLatest();
