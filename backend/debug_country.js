import axios from "axios";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function getIndiaId() {
    const url = `https://api.openaq.org/v3/countries?limit=200`;
    const headers = process.env.OPENAQ_API_KEY ? { "X-API-Key": process.env.OPENAQ_API_KEY } : {};

    try {
        console.log(`Fetching ${url}...`);
        const resp = await axios.get(url, { headers });
        const india = resp.data.results.find(c => c.name === "India" || c.iso === "IN");
        console.log("India:", india);
    } catch (err) {
        console.error("Error:", err.message);
    }
}

getIndiaId();
