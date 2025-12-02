// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MapView from '../ui/MapView';
import Gauge from '../ui/Gauge';
import Legend from '../ui/Legend';
import HistoryModal from '../ui/HistoryModal';
import { pm25ToAQI } from '../lib/aqi';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Dashboard() {
    const [stations, setStations] = useState([]);
    const [selectedStation, setSelectedStation] = useState(null);
    const [historyStation, setHistoryStation] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const fetchData = () => {
        axios.get(`${API_BASE}/stations/latest-all`)
            .then(res => {
                setStations(res.data);
                setLastUpdated(new Date());
            })
            .catch(err => console.error("Failed to fetch stations", err));
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // 30s refresh
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="dashboard-container">

            {/* Sidebar */}
            <div className="sidebar">
                <div className="sidebar-header">
                    <h1 style={{ margin: 0, fontSize: '24px', color: 'var(--text)' }}>AQI Monitor</h1>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '5px' }}>
                        Updated: {lastUpdated.toLocaleTimeString()}
                    </div>
                </div>

                <div className="sidebar-content">
                    <Gauge stations={stations} />
                    <Legend />

                    <h4 style={{ margin: '0 0 15px 0', color: 'var(--muted)' }}>Stations</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {stations.map(s => {
                            const { color, aqi, band } = pm25ToAQI(s.pm25);
                            const isSelected = selectedStation?.station_id === s.station_id;

                            return (
                                <div
                                    key={s.station_id}
                                    className={`station-item ${isSelected ? 'selected' : ''}`}
                                    onClick={() => {
                                        setSelectedStation(s);
                                        setHistoryStation(s);
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            backgroundColor: color,
                                            boxShadow: `0 0 5px ${color}60`
                                        }}></div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: 'var(--text)' }}>{s.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{band}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text)' }}>{aqi}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--muted)' }}>AQI</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Map Area */}
            <div className="map-area">
                <MapView
                    stations={stations}
                    onSelectStation={setSelectedStation}
                    onViewHistory={setHistoryStation}
                />
            </div>

            {/* History Modal */}
            {historyStation && (
                <HistoryModal
                    station={historyStation}
                    onClose={() => setHistoryStation(null)}
                />
            )}
        </div>
    );
}
