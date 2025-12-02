// src/ui/HistoryModal.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function HistoryModal({ station, onClose }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (station) {
            setLoading(true);
            axios.get(`http://localhost:3000/stations/${station.station_id}/history?hours=24`)
                .then(res => {
                    // Format timestamp for chart
                    const formattedData = res.data.map(d => ({
                        ...d,
                        time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }));
                    setData(formattedData);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Failed to fetch history", err);
                    setLoading(false);
                });
        }
    }, [station]);

    if (!station) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <div style={{
                background: 'white',
                padding: '25px',
                borderRadius: '16px',
                width: '90%',
                maxWidth: '800px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                position: 'relative'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        border: 'none',
                        background: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: '#888'
                    }}
                >
                    &times;
                </button>

                <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
                    24h History: {station.name}
                </h2>

                {loading ? (
                    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        Loading...
                    </div>
                ) : (
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                <XAxis dataKey="time" stroke="#888" fontSize={12} tick={{ dy: 10 }} />
                                <YAxis stroke="#888" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                                />
                                <Legend verticalAlign="top" height={36} />
                                <Line type="monotone" dataKey="pm25" name="PM2.5" stroke="#8884d8" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="pm10" name="PM10" stroke="#82ca9d" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
}
