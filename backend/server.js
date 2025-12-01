import express from "express";
import cors from "cors";
import pool from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/stations", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM stations");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get latest reading for a station
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

app.listen(3000, () => {
    console.log("Backend running on http://localhost:3000");
});
