// src/ui/Legend.jsx
import React from 'react';
import { AQI_BANDS } from '../lib/aqi';

export default function Legend() {
    return (
        <div className="card">
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--muted)' }}>AQI Legend</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {AQI_BANDS.map((band, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                        <span style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: band.color,
                            marginRight: '10px',
                            flexShrink: 0,
                            boxShadow: `0 0 5px ${band.color}60`
                        }}></span>
                        <span style={{ flex: 1, color: 'var(--text)' }}>{band.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
