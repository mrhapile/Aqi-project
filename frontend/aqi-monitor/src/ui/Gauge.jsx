// src/ui/Gauge.jsx
import React from 'react';
import { pm25ToAQI } from '../lib/aqi';

export default function Gauge({ stations }) {
    // Find worst AQI
    let maxAQI = 0;
    let worstStation = null;

    stations.forEach(s => {
        if (s.pm25 != null) {
            const { aqi } = pm25ToAQI(s.pm25);
            if (aqi > maxAQI && aqi !== "-") {
                maxAQI = aqi;
                worstStation = s;
            }
        }
    });

    const { band, color } = pm25ToAQI(worstStation?.pm25);

    return (
        <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            marginBottom: '20px',
            textAlign: 'center'
        }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Worst Air Quality
            </h3>

            {worstStation ? (
                <>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        border: `8px solid ${color}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 10px auto',
                        color: color
                    }}>
                        <span style={{ fontSize: '32px', fontWeight: 'bold' }}>{maxAQI}</span>
                        <span style={{ fontSize: '12px', fontWeight: '500' }}>AQI</span>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                        {band}
                    </div>
                    <div style={{ fontSize: '14px', color: '#888', marginTop: '4px' }}>
                        at {worstStation.name}
                    </div>
                </>
            ) : (
                <div style={{ color: '#999', padding: '20px' }}>No Data Available</div>
            )}
        </div>
    );
}
