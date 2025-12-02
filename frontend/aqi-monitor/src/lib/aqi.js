// src/lib/aqi.js

export const AQI_BANDS = [
    { min: 0, max: 50, label: "Good", color: "#55a84f" },
    { min: 51, max: 100, label: "Moderate", color: "#ffd23f" },
    { min: 101, max: 150, label: "Unhealthy for Sensitive Groups", color: "#ff9933" },
    { min: 151, max: 200, label: "Unhealthy", color: "#ff5a5f" },
    { min: 201, max: 300, label: "Very Unhealthy", color: "#7e0023" },
    { min: 301, max: 9999, label: "Hazardous", color: "#7e0023" },
];

/**
 * Calculate AQI from PM2.5 concentration (µg/m³)
 * Using simplified EPA breakpoints.
 */
export function pm25ToAQI(pm25) {
    if (pm25 == null) return { aqi: "-", band: "No Data", color: "#333333" };

    // PM2.5 Breakpoints (C_low, C_high, I_low, I_high)
    const breakpoints = [
        { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
        { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
        { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
        { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
        { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
        { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
        { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
    ];

    let calculatedAQI = 0;
    const c = parseFloat(pm25);

    const bp = breakpoints.find(b => c >= b.cLow && c <= b.cHigh);

    if (bp) {
        calculatedAQI = ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (c - bp.cLow) + bp.iLow;
    } else if (c > 500.4) {
        calculatedAQI = 500; // Cap at 500+
    } else {
        calculatedAQI = c; // Fallback
    }

    calculatedAQI = Math.round(calculatedAQI);

    // Find band
    const band = AQI_BANDS.find(b => calculatedAQI >= b.min && calculatedAQI <= b.max) || AQI_BANDS[AQI_BANDS.length - 1];

    return {
        aqi: calculatedAQI,
        band: band.label,
        color: band.color
    };
}

export function aqiColorFromPm25(pm25) {
    return pm25ToAQI(pm25).color;
}
