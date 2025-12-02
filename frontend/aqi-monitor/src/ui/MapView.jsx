// src/ui/MapView.jsx
import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { pm25ToAQI } from '../lib/aqi';

// Helper to center map on stations
function MapCenter({ stations }) {
    const map = useMap();
    React.useEffect(() => {
        if (stations.length > 0) {
            const bounds = stations.map(s => [s.lat, s.lon]);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [stations, map]);
    return null;
}

export default function MapView({ stations, onSelectStation, onViewHistory }) {
    const defaultCenter = [28.6139, 77.2090]; // Delhi

    return (
        <MapContainer
            center={defaultCenter}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />

            <MapCenter stations={stations} />

            {stations.map(station => {
                const { color, aqi } = pm25ToAQI(station.pm25);

                return (
                    <CircleMarker
                        key={station.station_id}
                        center={[station.lat, station.lon]}
                        pathOptions={{
                            color: 'white',
                            fillColor: color,
                            fillOpacity: 0.8,
                            weight: 2
                        }}
                        radius={12}
                        eventHandlers={{
                            click: () => onSelectStation(station)
                        }}
                    >
                        <Popup>
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{station.name}</h3>
                                <div style={{ marginBottom: '10px', fontSize: '14px' }}>
                                    <strong>AQI: {aqi}</strong>
                                    <br />
                                    <span style={{ color: '#666', fontSize: '12px' }}>
                                        PM2.5: {station.pm25 || '-'} | PM10: {station.pm10 || '-'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => onViewHistory(station)}
                                    style={{
                                        background: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        padding: '6px 12px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    View History
                                </button>
                            </div>
                        </Popup>
                    </CircleMarker>
                );
            })}
        </MapContainer>
    );
}
