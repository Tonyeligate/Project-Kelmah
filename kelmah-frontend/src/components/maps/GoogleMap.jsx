import React from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { Box, CircularProgress } from '@mui/material';

const MapComponent = ({ center = { lat: 0, lng: 0 }, markers = [], zoom = 12 }) => {
    const mapStyles = {
        height: "400px",
        width: "100%"
    };

    const defaultCenter = {
        lat: center.lat || 0,
        lng: center.lng || 0
    };

    // Check if Google Maps API key exists
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        console.error('Google Maps API key is missing');
        return (
            <Box sx={{ 
                height: mapStyles.height, 
                width: mapStyles.width,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                bgcolor: 'grey.200'
            }}>
                Map configuration error
            </Box>
        );
    }

    return (
        <LoadScript 
            googleMapsApiKey={apiKey}
            loadingElement={
                <Box sx={{ 
                    height: mapStyles.height, 
                    width: mapStyles.width,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <CircularProgress />
                </Box>
            }
        >
            <GoogleMap
                mapContainerStyle={mapStyles}
                zoom={zoom}
                center={defaultCenter}
                options={{
                    zoomControl: true,
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false
                }}
            >
                {Array.isArray(markers) && markers.map((marker, index) => (
                    <Marker
                        key={index}
                        position={marker.position}
                        title={marker.title}
                    />
                ))}
            </GoogleMap>
        </LoadScript>
    );
};

export default React.memo(MapComponent); 