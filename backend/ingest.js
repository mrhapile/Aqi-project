// backend/ingest.js
import axios from "axios";
import cron from "node-cron";
import pool from "./db.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load .env (backend/.env expected)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

/**
 * Config (from .env)
 * - OPENAQ_CITIES : comma-separated city names, e.g. "Delhi,Mumbai"
 * - OPENAQ_LIMIT : max stations per city to fetch (optional)
 */
const OPENAQ_CITIES = (process.env.OPENAQ_CITIES || "Delhi").split(",").map(s => s.trim());
const OPENAQ_LIMIT = process.env.OPENAQ_LIMIT ? Number(process.env.OPENAQ_LIMIT) : 100;

/* ---------- Utilities ---------- */

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
    const toRad = deg => (deg * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.asin(Math.sqrt(a));
}

/* ---------- DB helpers ---------- */

async function findStationByName(name) {
    // Try an exact or case-insensitive partial match
    const q = `
    SELECT * FROM stations
    WHERE LOWER(name) = LOWER($1)
    LIMIT 1
  `;
    const exact = await pool.query(q, [name]);
    if (exact.rows.length) return exact.rows[0];

    // partial match
    const partialQ = `
    SELECT * FROM stations
    WHERE LOWER(name) LIKE LOWER($1)
    LIMIT 1
  `;
    const like = await pool.query(partialQ, [`%${name}%`]);
    if (like.rows.length) return like.rows[0];

    return null;
}

async function findNearestStation(lat, lon, maxKm = 1.0) {
    // select all stations and compute distance in JS (small table)
    const res = await pool.query("SELECT * FROM stations");
    if (!res.rows.length) return null;

    let best = null;
    let bestD = Number.POSITIVE_INFINITY;
    for (const s of res.rows) {
        const d = haversineDistanceKm(lat, lon, s.lat, s.lon);
        console.log(`Distance to ${s.name} (${s.lat},${s.lon}) from (${lat},${lon}): ${d.toFixed(3)} km`);
        if (d < bestD) {
            bestD = d;
            best = s;
        }
    }
    if (bestD <= maxKm) return best;
    return null;
}

/* ---------- Insert reading ---------- */

async function insertReading(station_id, pm25, pm10, no2, timestamp) {
    try {
        await pool.query(
            `INSERT INTO readings (station_id, pm25, pm10, no2, timestamp)
       VALUES ($1, $2, $3, $4, $5)`,
            [station_id, pm25 ?? null, pm10 ?? null, no2 ?? null, timestamp ?? new Date()]
        );
        console.log(`Inserted reading for station_id=${station_id}`);
    } catch (err) {
        console.error("Insert reading error:", err);
    }
}

/* ---------- OpenAQ fetch + process ---------- */

const CITY_COORDINATES = {
    "Delhi": { lat: 28.6139, lon: 77.2090, radius: 25000 }
};

async function fetchOpenAQForCity(city) {
    try {
        let url;
        const coords = CITY_COORDINATES[city];

        if (coords) {
            console.log(`Fetching OpenAQ v3 locations for ${city} (coords=${coords.lat},${coords.lon}, radius=${coords.radius})`);
            url = `https://api.openaq.org/v3/locations?coordinates=${coords.lat},${coords.lon}&radius=${coords.radius}&limit=${OPENAQ_LIMIT}`;
        } else {
            console.log(`Fetching OpenAQ v3 locations for city="${city}" (limit=${OPENAQ_LIMIT})`);
            url = `https://api.openaq.org/v3/locations?city=${encodeURIComponent(city)}&limit=${OPENAQ_LIMIT}`;
        }

        // Add API Key if you have one, otherwise it might be rate limited or restricted
        const headers = process.env.OPENAQ_API_KEY ? { "X-API-Key": process.env.OPENAQ_API_KEY } : {};

        const resp = await axios.get(url, { headers, timeout: 15000 });

        if (!resp.data || !Array.isArray(resp.data.results)) {
            console.warn("OpenAQ returned unexpected data", resp.data);
            return;
        }

        for (const loc of resp.data.results) {
            // v3 structure: loc.id, loc.name, loc.coordinates {latitude, longitude}, loc.sensors [...]
            const lat = loc.coordinates?.latitude;
            const lon = loc.coordinates?.longitude;
            const locName = loc.name;

            // match station by name -> else nearest
            let station = null;
            if (locName) station = await findStationByName(locName);

            if (!station && lat != null && lon != null) {
                station = await findNearestStation(lat, lon, 2.0); // 2.0 km threshold
            }

            if (!station) {
                console.log(`No matching station for OpenAQ location "${locName}" (${lat},${lon}) — skipping`);
                continue;
            }

            console.log(`MATCHED! OpenAQ "${locName}" -> DB "${station.name}" (ID: ${station.id})`);

            // Build a map of sensor ID -> parameter name from the locations response
            const sensorMap = {};
            if (Array.isArray(loc.sensors)) {
                for (const s of loc.sensors) {
                    if (s.id && s.parameter?.name) {
                        sensorMap[s.id] = s.parameter.name.toLowerCase();
                    }
                }
            }

            // Fetch latest measurements for this location
            const latestUrl = `https://api.openaq.org/v3/locations/${loc.id}/latest`;
            let latestResp;
            try {
                latestResp = await axios.get(latestUrl, { headers, timeout: 10000 });
            } catch (e) {
                console.error(`Failed to fetch latest for loc ${loc.id}:`, e.message);
                continue;
            }

            const measurements = {};
            let lastUpdated = new Date(0);

            if (latestResp.data && Array.isArray(latestResp.data.results)) {
                for (const m of latestResp.data.results) {
                    // m has value, sensorsId. Use sensorMap to get param name.
                    const param = sensorMap[m.sensorsId];
                    if (param && m.value !== undefined) {
                        measurements[param] = m.value;
                        const sTime = new Date(m.datetime.utc);
                        if (sTime > lastUpdated) lastUpdated = sTime;
                    }
                }
            }

            const pm25 = measurements["pm2.5"] ?? measurements["pm25"] ?? null;
            const pm10 = measurements["pm10"] ?? null;
            const no2 = measurements["no2"] ?? null;

            console.log(`  Readings: PM2.5=${pm25}, PM10=${pm10}, NO2=${no2}, Time=${lastUpdated.toISOString()}`);

            // If no valid timestamp found, default to now (though ideally we skip stale data)
            const ts = lastUpdated.getTime() > 0 ? lastUpdated : new Date();

            function sanitizeNum(v) {
                if (v == null) return null;
                const n = Number(v);
                if (Number.isNaN(n)) return null;
                if (n < 0 || n > 2000) return null;
                return n;
            }

            // Only insert if we have at least one reading
            if (pm25 !== null || pm10 !== null || no2 !== null) {
                await insertReading(station.id, sanitizeNum(pm25), sanitizeNum(pm10), sanitizeNum(no2), ts);
            } else {
                console.log("  No valid readings found to insert.");
            }
        }
    } catch (err) {
        console.error(`fetchOpenAQForCity error for ${city}:`, err?.message || err);
        if (err?.response) {
            console.error("Response status:", err.response.status);
            console.error("Response data:", err.response.data);
        }
    }
}

/* ---------- Orchestrator ---------- */

export async function runIngestOnce() {
    console.log("Starting ingestion (one-shot) at", new Date().toISOString());
    for (const city of OPENAQ_CITIES) {
        await fetchOpenAQForCity(city);
    }
    console.log("Ingestion run complete");
}

function scheduleIngest() {
    // run every 5 minutes
    cron.schedule("*/5 * * * *", async () => {
        console.log("Scheduled ingest triggered:", new Date().toISOString());
        await runIngestOnce();
    });

    console.log("Ingest scheduler started (every 5 minutes)");
}

/* ---------- CLI behavior ---------- */

// If run directly: do one run then schedule
if (process.argv[1] && process.argv[1].endsWith("ingest.js")) {
    (async () => {
        await runIngestOnce();
        scheduleIngest();
    })();
}
