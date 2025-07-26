import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  Fab, 
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  MyLocation as MyLocationIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Layers as LayersIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import mapService from '../../services/mapService';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (type, color = '#2196f3') => {
  const iconHtml = `
    <div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 12px;
    ">
      ${type === 'job' ? 'J' : type === 'worker' ? 'W' : 'U'}
    </div>
  `;
  
  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

// Component to handle map events and controls
const MapController = ({ 
  onLocationUpdate, 
  onZoomChange, 
  centerOnUser, 
  setCenterOnUser,
  isLocating,
  setIsLocating 
}) => {
  const map = useMap();

  useEffect(() => {
    map.on('moveend', () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      onLocationUpdate({
        latitude: center.lat,
        longitude: center.lng
      });
      onZoomChange(zoom);
    });

    map.on('zoomend', () => {
      onZoomChange(map.getZoom());
    });

    return () => {
      map.off('moveend');
      map.off('zoomend');
    };
  }, [map, onLocationUpdate, onZoomChange]);

  useEffect(() => {
    if (centerOnUser) {
      setIsLocating(true);
      mapService.getCurrentLocation()
        .then(location => {
          map.setView([location.latitude, location.longitude], 15);
          setCenterOnUser(false);
        })
        .catch(error => {
          console.error('Location error:', error);
        })
        .finally(() => {
          setIsLocating(false);
        });
    }
  }, [centerOnUser, map, setCenterOnUser, setIsLocating]);

  return null;
};

const InteractiveMap = ({
  center = [37.7749, -122.4194],
  zoom = 12,
  markers = [],
  onMarkerClick = () => {},
  onMapClick = () => {},
  showUserLocation = true,
  showSearchRadius = false,
  searchRadius = 5,
  height = '400px',
  className = '',
  controls = {
    location: true,
    zoom: true,
    layers: true,
    fullscreen: true
  }
}) => {
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(zoom);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [centerOnUser, setCenterOnUser] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tileLayer, setTileLayer] = useState('osm');
  const mapRef = useRef();

  // Available tile layers
  const tileLayers = {
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri'
    },
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '© CARTO'
    }
  };

  // Get user location on mount
  useEffect(() => {
    if (showUserLocation) {
      mapService.getCurrentLocation()
        .then(location => {
          setUserLocation(location);
        })
        .catch(error => {
          console.warn('Could not get user location:', error.message);
        });
    }
  }, [showUserLocation]);

  // Handle location button click
  const handleLocationClick = useCallback(() => {
    setCenterOnUser(true);
  }, []);

  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    if (mapRef.current) {
      const map = mapRef.current;
      map.setZoom(map.getZoom() + 1);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapRef.current) {
      const map = mapRef.current;
      map.setZoom(map.getZoom() - 1);
    }
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Cycle through tile layers
  const cycleTileLayer = useCallback(() => {
    const layers = Object.keys(tileLayers);
    const currentIndex = layers.indexOf(tileLayer);
    const nextIndex = (currentIndex + 1) % layers.length;
    setTileLayer(layers[nextIndex]);
  }, [tileLayer, tileLayers]);

  return (
    <Box 
      sx={{ 
        position: 'relative',
        height,
        width: '100%',
        ...(isFullscreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          height: '100vh'
        })
      }}
      className={className}
    >
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        touchZoom={true}
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance;
        }}
      >
        <TileLayer
          url={tileLayers[tileLayer].url}
          attribution={tileLayers[tileLayer].attribution}
        />
        
        <MapController
          onLocationUpdate={setMapCenter}
          onZoomChange={setMapZoom}
          centerOnUser={centerOnUser}
          setCenterOnUser={setCenterOnUser}
          isLocating={isLocating}
          setIsLocating={setIsLocating}
        />

        {/* User location marker */}
        {userLocation && showUserLocation && (
          <>
            <Marker 
              position={[userLocation.latitude, userLocation.longitude]}
              icon={createCustomIcon('user', '#4caf50')}
            >
              <Popup>
                <Typography variant="body2">Your Location</Typography>
              </Popup>
            </Marker>
            
            {/* Search radius circle */}
            {showSearchRadius && (
              <Circle
                center={[userLocation.latitude, userLocation.longitude]}
                radius={searchRadius * 1000} // Convert km to meters
                pathOptions={{
                  color: '#2196f3',
                  fillColor: '#2196f3',
                  fillOpacity: 0.1,
                  weight: 2
                }}
              />
            )}
          </>
        )}

        {/* Custom markers */}
        {markers.map((marker, index) => (
          <Marker
            key={marker.id || index}
            position={[marker.coordinates.latitude, marker.coordinates.longitude]}
            icon={createCustomIcon(marker.type || 'default', marker.color)}
            eventHandlers={{
              click: () => onMarkerClick(marker)
            }}
          >
            <Popup>
              <Box sx={{ minWidth: 200 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {marker.title}
                </Typography>
                {marker.description && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {marker.description}
                  </Typography>
                )}
                {marker.distance && (
                  <Typography variant="caption" color="text.secondary">
                    {mapService.formatDistance(marker.distance)} away
                  </Typography>
                )}
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Controls */}
      <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}>
        {/* Location button */}
        {controls.location && (
          <Tooltip title="Find my location">
            <Fab
              size="small"
              color="primary"
              onClick={handleLocationClick}
              disabled={isLocating}
              sx={{ mb: 1, display: 'block' }}
            >
              {isLocating ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <MyLocationIcon />
              )}
            </Fab>
          </Tooltip>
        )}

        {/* Zoom controls */}
        {controls.zoom && (
          <Paper sx={{ mb: 1 }}>
            <Tooltip title="Zoom in">
              <IconButton onClick={handleZoomIn} size="small">
                <ZoomInIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom out">
              <IconButton onClick={handleZoomOut} size="small">
                <ZoomOutIcon />
              </IconButton>
            </Tooltip>
          </Paper>
        )}

        {/* Layer switcher */}
        {controls.layers && (
          <Tooltip title="Switch map layer">
            <Fab
              size="small"
              onClick={cycleTileLayer}
              sx={{ mb: 1, display: 'block', bgcolor: 'white', color: 'text.primary' }}
            >
              <LayersIcon />
            </Fab>
          </Tooltip>
        )}

        {/* Fullscreen toggle */}
        {controls.fullscreen && (
          <Tooltip title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
            <Fab
              size="small"
              onClick={toggleFullscreen}
              sx={{ bgcolor: 'white', color: 'text.primary' }}
            >
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </Fab>
          </Tooltip>
        )}
      </Box>

      {/* Status indicators */}
      {isLocating && (
        <Alert 
          severity="info" 
          sx={{ 
            position: 'absolute', 
            bottom: 16, 
            left: 16, 
            right: 16, 
            zIndex: 1000 
          }}
        >
          Getting your location...
        </Alert>
      )}
    </Box>
  );
};

export default InteractiveMap; 