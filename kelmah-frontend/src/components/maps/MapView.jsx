import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Paper, Typography } from '@mui/material';

const MapView = ({ center = { lat: 0, lng: 0 }, markers = [], zoom = 12 }) => {
    return (
        <Paper elevation={3} sx={{ p: 2 }}>
            <MapContainer 
                center={[center.lat, center.lng]} 
                zoom={zoom} 
                style={{ height: '400px', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {markers.map((marker, idx) => (
                    <Marker key={idx} position={[marker.position.lat, marker.position.lng]}>
                        <Popup>{marker.title}</Popup>
                    </Marker>
                ))}
            </MapContainer>
        </Paper>
    );
};

export default MapView; 