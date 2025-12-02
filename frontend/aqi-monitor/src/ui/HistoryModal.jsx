// src/ui/HistoryModal.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function HistoryModal({ station, onClose }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (station) {
            setLoading(true);
            axios.get(`${API_BASE}/stations/${station.station_id}/history?hours=24`)
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
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>&times;</button>

                <h2 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--text)' }}>
                    24h History: {station.name}
                </h2>

                {loading ? (
                    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                        Loading...
                    </div>
                ) : (
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="time" stroke="var(--muted)" fontSize={12} tick={{ dy: 10 }} />
                                <YAxis stroke="var(--muted)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--panel)',
                                        borderColor: 'var(--border)',
                                        color: 'var(--text)',
                                        borderRadius: '8px'
                                    }}
                                    itemStyle={{ color: 'var(--text)' }}
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
