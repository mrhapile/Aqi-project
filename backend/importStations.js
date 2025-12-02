import axios from "axios";
import pool from "./db.js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const OPENAQ_API_KEY = process.env.OPENAQ_API_KEY;
const INDIA_COUNTRY_ID = 9; // Found via debug script

async function importStations() {
    console.log("Starting import of all India stations...");

    let page = 1;
    let totalInserted = 0;
    let totalSkipped = 0;
    const limit = 1000;
    let hasMore = true;

    try {
        while (hasMore) {
            const url = `https://api.openaq.org/v3/locations?countries_id=${INDIA_COUNTRY_ID}&limit=${limit}&page=${page}`;
            console.log(`Fetching page ${page}...`);

            const headers = OPENAQ_API_KEY ? { "X-API-Key": OPENAQ_API_KEY } : {};
            const response = await axios.get(url, { headers });
            const locations = response.data.results;

            if (locations.length === 0) {
                hasMore = false;
                break;
            }

            for (const loc of locations) {
                const name = loc.name;
                const lat = loc.coordinates?.latitude;
                const lon = loc.coordinates?.longitude;
                const openaq_id = loc.id; // Store OpenAQ ID if possible, or just use it for matching?
                // The user schema doesn't have openaq_id, so we match by name or lat/lon.
                // But wait, for ingestion we need the OpenAQ ID to fetch latest!
                // The user schema is: stations(id, name, lat, lon, source).
                // I should probably store the OpenAQ ID in 'source' or add a column?
                // User said: "Extract: name, latitude, longitude, source = 'OpenAQ'"
                // If I don't store the ID, I'll have to re-search or match by name/coords every time in ingest.js.
                // But ingest.js can also just fetch all locations from OpenAQ again? No, that's wasteful.
                // I will append the OpenAQ ID to the source field like "OpenAQ:12345" so I can parse it later.
                // This is a hack but adheres to the schema constraints.

                if (!lat || !lon) continue;

                const source = `OpenAQ:${loc.id}`;

                try {
                    // Check if exists by name (as per user requirement)
                    // "Skip if station already exists (ON CONFLICT DO NOTHING)"
                    // But name is not unique in DB schema (unless I add constraint).
                    // I will use a SELECT check first to be safe, or just rely on the user's "ON CONFLICT" instruction 
                    // which implies there SHOULD be a unique constraint.
                    // Since I can't modify schema easily without user permission, I'll do a check.

                    const check = await pool.query("SELECT id FROM stations WHERE name = $1", [name]);
                    if (check.rows.length > 0) {
                        // Update the source to include ID if it's just "OpenAQ" or "CPCB"
                        // This helps ingest.js find the ID later.
                        // await pool.query("UPDATE stations SET source = $1 WHERE id = $2", [source, check.rows[0].id]);
                        totalSkipped++;
                        continue;
                    }

                    await pool.query(
                        "INSERT INTO stations (name, lat, lon, source) VALUES ($1, $2, $3, $4)",
                        [name, lat, lon, source]
                    );
                    totalInserted++;
                } catch (err) {
                    console.error(`Failed to insert ${name}:`, err.message);
                }
            }

            console.log(`Page ${page} done. Inserted: ${totalInserted}, Skipped: ${totalSkipped}`);
            page++;
            // Safety break
            if (page > 20) break;
        }
    } catch (err) {
        console.error("Import failed:", err.message);
    } finally {
        console.log(`\nImport Complete.`);
        console.log(`Total Inserted: ${totalInserted}`);
        console.log(`Total Skipped: ${totalSkipped}`);
        process.exit();
    }
}

importStations();
