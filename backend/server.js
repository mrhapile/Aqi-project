import express from "express";
import cors from "cors";
import pool from "./db.js";
import dotenv from "dotenv";

// Load .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1. Get all stations (Basic info)
app.get("/stations", async (req, res) => {
    try {
        const result = await pool.query("SELECT id, name, lat, lon, source FROM stations");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 2. Get all stations WITH their latest reading (Optimized for map)
app.get("/stations/latest-all", async (req, res) => {
    try {
        // DISTINCT ON (s.id) gets the first row for each station based on the ORDER BY clause
        // Optimized query for large datasets
        const query = `
            SELECT DISTINCT ON (s.id)
                s.id AS station_id,
                s.name,
                s.lat,
                s.lon,
                r.pm25,
                r.pm10,
                r.no2,
                r.timestamp
            FROM stations s
            JOIN readings r ON s.id = r.station_id
            ORDER BY s.id, r.timestamp DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 3. Get latest reading for a specific station
app.get("/stations/:id/latest", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "SELECT * FROM readings WHERE station_id = $1 ORDER BY timestamp DESC LIMIT 1",
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No readings found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 4. Get history for charts (default 24 hours)
app.get("/stations/:id/history", async (req, res) => {
    const { id } = req.params;
    const hours = parseInt(req.query.hours) || 24;

    try {
        const result = await pool.query(
            `SELECT pm25, pm10, no2, timestamp 
             FROM readings 
             WHERE station_id = $1 
             AND timestamp >= NOW() - ($2 || ' hours')::INTERVAL 
             ORDER BY timestamp ASC`,
            [id, hours]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
