// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MapView from '../ui/MapView';
import Gauge from '../ui/Gauge';
import Legend from '../ui/Legend';
import HistoryModal from '../ui/HistoryModal';
import { pm25ToAQI } from '../lib/aqi';

export default function Dashboard() {
    const [stations, setStations] = useState([]);
    const [selectedStation, setSelectedStation] = useState(null);
    const [historyStation, setHistoryStation] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const fetchData = () => {
        axios.get('http://localhost:3000/stations/latest-all')
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
        <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>

            {/* Sidebar */}
            <div style={{
                width: '380px',
                height: '100%',
                background: '#f8f9fa',
                borderRight: '1px solid #ddd',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 1000,
                boxShadow: '2px 0 10px rgba(0,0,0,0.05)'
            }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #eee', background: 'white' }}>
                    <h1 style={{ margin: 0, fontSize: '24px', color: '#333' }}>AQI Monitor</h1>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                        Updated: {lastUpdated.toLocaleTimeString()}
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                    <Gauge stations={stations} />
                    <Legend />

                    <h4 style={{ margin: '0 0 15px 0', color: '#555' }}>Stations</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {stations.map(s => {
                            const { color, aqi, band } = pm25ToAQI(s.pm25);
                            const isSelected = selectedStation?.station_id === s.station_id;

                            return (
                                <div
                                    key={s.station_id}
                                    onClick={() => {
                                        setSelectedStation(s);
                                        setHistoryStation(s);
                                    }}
                                    style={{
                                        background: 'white',
                                        padding: '15px',
                                        borderRadius: '8px',
                                        border: isSelected ? '2px solid #007bff' : '1px solid #eee',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            backgroundColor: color
                                        }}></div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#333' }}>{s.name}</div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>{band}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>{aqi}</div>
                                        <div style={{ fontSize: '10px', color: '#888' }}>AQI</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Map Area */}
            <div style={{ flex: 1, position: 'relative' }}>
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
