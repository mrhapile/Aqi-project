-- Create stations table
CREATE TABLE IF NOT EXISTS stations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    lat FLOAT NOT NULL,
    lon FLOAT NOT NULL,
    source TEXT
);

-- Create readings table
CREATE TABLE IF NOT EXISTS readings (
    id SERIAL PRIMARY KEY,
    station_id INTEGER REFERENCES stations(id),
    pm25 FLOAT,
    pm10 FLOAT,
    no2 FLOAT,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Insert sample stations (Delhi)
INSERT INTO stations (name, lat, lon, source) VALUES
    ('ITO', 28.6285, 77.2410, 'CPCB'),
    ('RK Puram', 28.5639, 77.1744, 'DPCC'),
    ('Mandir Marg', 28.6365, 77.1987, 'DPCC')
ON CONFLICT DO NOTHING;
