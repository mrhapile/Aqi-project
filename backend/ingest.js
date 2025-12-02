import axios from "axios";
import pool from "./db.js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const OPENAQ_API_KEY = process.env.OPENAQ_API_KEY;

// Helper to extract PM2.5, PM10, NO2 from OpenAQ latest response
function extractReadings(measurements, sensorMap) {
    let pm25 = null;
    let pm10 = null;
    let no2 = null;
    let timestamp = null;

    if (Array.isArray(measurements)) {
        measurements.forEach(m => {
            const param = sensorMap[m.sensorsId];
            const val = m.value;
            const time = m.datetime?.utc;

            if (time && (!timestamp || new Date(time) > new Date(timestamp))) {
                timestamp = time;
            }

            if (val !== null && val !== undefined) {
                if (param === 'pm25') pm25 = val;
                if (param === 'pm10') pm10 = val;
                if (param === 'no2') no2 = val;
            }
        });
    }
    return { pm25, pm10, no2, timestamp };
}

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function ingestIndia() {
    console.log("Starting India-wide ingestion...");

    try {
        const result = await pool.query("SELECT * FROM stations WHERE source LIKE 'OpenAQ:%'");
        const stations = result.rows;
        console.log(`Found ${stations.length} stations to update.`);

        let insertedCount = 0;
        let skippedCount = 0;
        let errorsCount = 0;

        const BATCH_SIZE = 5;
        for (let i = 0; i < stations.length; i += BATCH_SIZE) {
            const batch = stations.slice(i, i + BATCH_SIZE);

            await Promise.all(batch.map(async (station) => {
                try {
                    const openaqId = station.source.split(":")[1];
                    if (!openaqId) return;

                    const headers = OPENAQ_API_KEY ? { "X-API-Key": OPENAQ_API_KEY } : {};

                    // Step 1: Fetch Location Details
                    const locUrl = `https://api.openaq.org/v3/locations/${openaqId}`;
                    const locResp = await axios.get(locUrl, { headers, timeout: 15000 });

                    if (!locResp.data.results || locResp.data.results.length === 0) {
                        throw new Error("Location not found");
                    }

                    const sensorsList = locResp.data.results[0].sensors;
                    const sensorMap = {};
                    sensorsList.forEach(s => {
                        sensorMap[s.id] = s.parameter.name;
                    });

                    // Step 2: Fetch Latest Measurements
                    const latestUrl = `https://api.openaq.org/v3/locations/${openaqId}/latest`;
                    const latestResp = await axios.get(latestUrl, { headers, timeout: 15000 });
                    const measurements = latestResp.data.results;

                    const { pm25, pm10, no2, timestamp } = extractReadings(measurements, sensorMap);

                    if (pm25 !== null || pm10 !== null || no2 !== null) {
                        await pool.query(
                            "INSERT INTO readings (station_id, pm25, pm10, no2, timestamp) VALUES ($1, $2, $3, $4, $5)",
                            [station.id, pm25, pm10, no2, timestamp]
                        );
                        insertedCount++;
                    } else {
                        skippedCount++;
                    }
                } catch (err) {
                    errorsCount++;
                    // Log the first few errors to diagnose
                    if (errorsCount <= 5) {
                        console.error(`Error updating ${station.name} (ID: ${station.source}): ${err.message}`);
                        if (err.response) {
                            console.error(`Status: ${err.response.status}`);
                        }
                    }
                }
            }));

            // Add delay between batches to avoid rate limits
            await sleep(1000);

            if (i % 20 === 0) {
                console.log(`Processed ${i} / ${stations.length}...`);
            }
        }

        console.log("\nIngestion Complete.");
        console.log(`Stations Matched: ${stations.length}`);
        console.log(`Readings Inserted: ${insertedCount}`);
        console.log(`Skipped (No Data): ${skippedCount}`);
        console.log(`Errors: ${errorsCount}`);

    } catch (err) {
        console.error("Ingestion Fatal Error:", err);
    } finally {
        process.exit();
    }
}

ingestIndia();
