// src/ui/Legend.jsx
import React from 'react';
import { AQI_BANDS } from '../lib/aqi';

export default function Legend() {
    return (
        <div style={{
            background: 'white',
            padding: '15px',
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            marginBottom: '20px'
        }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#555' }}>AQI Legend</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {AQI_BANDS.map((band, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                        <span style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: band.color,
                            marginRight: '10px',
                            flexShrink: 0
                        }}></span>
                        <span style={{ flex: 1, color: '#333' }}>{band.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
