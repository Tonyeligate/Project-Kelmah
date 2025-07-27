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
  Alert,
  Chip,
  Avatar,
  Rating,
  Button,
  useTheme
} from '@mui/material';
import {
  MyLocation as MyLocationIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Layers as LayersIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  WorkOutline as JobIcon,
  Person as WorkerIcon,
  Star as StarIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Build as BuildIcon,
  AttachMoney as MoneyIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import mapService from '../../services/mapService';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Professional vocational marker icons with theme colors
const createVocationalIcon = (type, category = '', isOnline = false, isVerified = false) => {
  const getIconColor = () => {
    if (type === 'job') return '#FFD700'; // Gold for jobs
    if (type === 'worker') return isOnline ? '#4CAF50' : '#1a1a1a'; // Green if online, black if offline
    return '#FFD700'; // Default gold
  };

  const getIconSymbol = () => {
    if (type === 'job') return '💼';
    if (type === 'worker') {
      const categoryIcons = {
        'Carpentry': '🔨',
        'Masonry': '🧱',
        'Plumbing': '🔧',
        'Electrical': '⚡',
        'Painting': '🎨',
        'Welding': '🔥',
        'HVAC': '❄️',
        'Security': '🛡️',
        'Cleaning': '🧽',
        'Landscaping': '🌱'
      };
      return categoryIcons[category] || '👷';
    }
    return '📍';
  };

  const color = getIconColor();
  const symbol = getIconSymbol();
  const size = type === 'user' ? 32 : 28;
  
  const iconHtml = `
    <div style="
      position: relative;
      background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: 3px solid #ffffff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 0 0 2px ${color}33;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${type === 'job' ? '#000000' : '#ffffff'};
      font-weight: bold;
      font-size: ${type === 'user' ? '16px' : '14px'};
      transform: scale(1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      animation: ${type === 'user' ? 'pulse 2s infinite' : 'none'};
    ">
      ${symbol}
      ${isVerified ? '<div style="position: absolute; top: -2px; right: -2px; background: #4CAF50; border-radius: 50%; width: 12px; height: 12px; border: 2px solid white;">✓</div>' : ''}
      ${isOnline && type === 'worker' ? '<div style="position: absolute; bottom: -2px; right: -2px; background: #4CAF50; border-radius: 50%; width: 10px; height: 10px; border: 2px solid white;"></div>' : ''}
    </div>
    <style>
      @keyframes pulse {
        0% { box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 0 0 2px ${color}33, 0 0 0 0px ${color}44; }
        50% { box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 0 0 2px ${color}33, 0 0 0 8px ${color}22; }
        100% { box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 0 0 2px ${color}33, 0 0 0 0px ${color}44; }
      }
    </style>
  `;
  
  return L.divIcon({
    html: iconHtml,
    className: 'vocational-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
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
          map.flyTo([location.latitude, location.longitude], 15, {
            duration: 2,
            easeLinearity: 0.25
          });
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

// Professional marker popup component
const VocationalMarkerPopup = ({ marker, onViewDetails, onContact }) => {
  const theme = useTheme();
  
  if (marker.type === 'job') {
    return (
      <Box sx={{ 
        minWidth: 280, 
        maxWidth: 320,
        p: 2,
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary
      }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar sx={{ 
            bgcolor: theme.palette.secondary.main, 
            color: theme.palette.secondary.contrastText,
            mr: 2,
            width: 48,
            height: 48
          }}>
            <JobIcon />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 'bold', 
              color: theme.palette.secondary.main,
              mb: 0.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {marker.title}
            </Typography>
            <Chip 
              label={marker.category} 
              size="small" 
              sx={{ 
                bgcolor: theme.palette.secondary.main, 
                color: theme.palette.secondary.contrastText,
                mb: 1
              }} 
            />
          </Box>
          {marker.verified && (
            <Tooltip title="Verified Hirer">
              <VerifiedIcon sx={{ color: '#4CAF50', ml: 1 }} />
            </Tooltip>
          )}
        </Box>
        
        <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
          {marker.description?.substring(0, 120)}...
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MoneyIcon fontSize="small" sx={{ color: theme.palette.secondary.main }} />
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              GHS {marker.budget?.toLocaleString()}
            </Typography>
          </Box>
          
          {marker.distance && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LocationIcon fontSize="small" color="action" />
              <Typography variant="caption">
                {mapService.formatDistance(marker.distance)}
              </Typography>
            </Box>
          )}
          
          {marker.urgent && (
            <Chip 
              label="URGENT" 
              size="small" 
              sx={{ 
                bgcolor: '#FF5722', 
                color: 'white',
                fontSize: '0.7rem',
                animation: 'pulse 1.5s infinite'
              }} 
            />
          )}
        </Box>
        
        {marker.skills && (
          <Box sx={{ mb: 2 }}>
            {marker.skills.slice(0, 3).map((skill, index) => (
              <Chip 
                key={index}
                label={skill}
                size="small"
                variant="outlined"
                sx={{ 
                  mr: 0.5, 
                  mb: 0.5,
                  borderColor: theme.palette.secondary.main,
                  color: theme.palette.secondary.main
                }}
              />
            ))}
            {marker.skills.length > 3 && (
              <Chip 
                label={`+${marker.skills.length - 3} more`}
                size="small"
                variant="outlined"
                sx={{ 
                  mr: 0.5, 
                  mb: 0.5,
                  borderColor: theme.palette.secondary.main,
                  color: theme.palette.secondary.main
                }}
              />
            )}
          </Box>
        )}
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="contained" 
            size="small" 
            onClick={() => onViewDetails(marker)}
            sx={{ flex: 1 }}
          >
            View Details
          </Button>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={() => onContact(marker)}
            sx={{ 
              flex: 1,
              borderColor: theme.palette.secondary.main,
              color: theme.palette.secondary.main
            }}
          >
            Contact
          </Button>
        </Box>
      </Box>
    );
  }

  // Worker popup
  return (
    <Box sx={{ 
      minWidth: 280, 
      maxWidth: 320,
      p: 2,
      bgcolor: theme.palette.background.paper,
      color: theme.palette.text.primary
    }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
        <Avatar 
          src={marker.profileImage}
          sx={{ 
            bgcolor: theme.palette.primary.main,
            mr: 2,
            width: 48,
            height: 48,
            border: `2px solid ${theme.palette.secondary.main}`
          }}
        >
          <WorkerIcon />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 'bold', 
            color: theme.palette.secondary.main,
            mb: 0.5
          }}>
            {marker.name}
          </Typography>
          <Typography variant="body2" sx={{ 
            color: theme.palette.text.secondary,
            mb: 1
          }}>
            {marker.title}
          </Typography>
          <Chip 
            label={marker.category} 
            size="small" 
            sx={{ 
              bgcolor: theme.palette.primary.main, 
              color: theme.palette.primary.contrastText
            }} 
          />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {marker.verified && (
            <Tooltip title="Verified Worker">
              <VerifiedIcon sx={{ color: '#4CAF50', mb: 0.5 }} />
            </Tooltip>
          )}
          {marker.online && (
            <Tooltip title="Online Now">
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                bgcolor: '#4CAF50',
                animation: 'pulse 2s infinite'
              }} />
            </Tooltip>
          )}
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        {marker.rating > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Rating value={marker.rating} readOnly size="small" />
            <Typography variant="caption">
              ({marker.reviewCount})
            </Typography>
          </Box>
        )}
        
        {marker.hourlyRate && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MoneyIcon fontSize="small" sx={{ color: theme.palette.secondary.main }} />
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              GHS {marker.hourlyRate}/hr
            </Typography>
          </Box>
        )}
        
        {marker.distance && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LocationIcon fontSize="small" color="action" />
            <Typography variant="caption">
              {mapService.formatDistance(marker.distance)}
            </Typography>
          </Box>
        )}
      </Box>
      
      {marker.bio && (
        <Typography variant="body2" sx={{ 
          mb: 2, 
          color: theme.palette.text.secondary,
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {marker.bio.substring(0, 100)}...
        </Typography>
      )}
      
      {marker.skills && (
        <Box sx={{ mb: 2 }}>
          {marker.skills.slice(0, 3).map((skill, index) => (
            <Chip 
              key={index}
              label={skill}
              size="small"
              variant="outlined"
              sx={{ 
                mr: 0.5, 
                mb: 0.5,
                borderColor: theme.palette.secondary.main,
                color: theme.palette.secondary.main
              }}
            />
          ))}
        </Box>
      )}
      
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button 
          variant="contained" 
          size="small" 
          onClick={() => onViewDetails(marker)}
          sx={{ flex: 1 }}
        >
          View Profile
        </Button>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => onContact(marker)}
          sx={{ 
            flex: 1,
            borderColor: theme.palette.secondary.main,
            color: theme.palette.secondary.main
          }}
        >
          Message
        </Button>
      </Box>
    </Box>
  );
};

const InteractiveMap = ({
  center = [5.6037, -0.1870], // Accra, Ghana
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
  const theme = useTheme();
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(zoom);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [centerOnUser, setCenterOnUser] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tileLayer, setTileLayer] = useState('osm');
  const mapRef = useRef();

  // Professional tile layers with dark theme support
  const tileLayers = {
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors'
    },
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '© CARTO'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri'
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

  // Handle control actions
  const handleLocationClick = useCallback(() => {
    setCenterOnUser(true);
  }, []);

  const handleZoomIn = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapRef.current.getZoom() + 1);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapRef.current.getZoom() - 1);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const cycleTileLayer = useCallback(() => {
    const layers = Object.keys(tileLayers);
    const currentIndex = layers.indexOf(tileLayer);
    const nextIndex = (currentIndex + 1) % layers.length;
    setTileLayer(layers[nextIndex]);
  }, [tileLayer, tileLayers]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Box 
        sx={{ 
          position: 'relative',
          height,
          width: '100%',
          borderRadius: 2,
          overflow: 'hidden',
          border: `2px solid ${theme.palette.secondary.main}33`,
          boxShadow: `0 8px 32px rgba(255, 215, 0, 0.1)`,
          ...(isFullscreen && {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            height: '100vh',
            borderRadius: 0,
            border: 'none'
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
                icon={createVocationalIcon('user')}
              >
                <Popup>
                  <VocationalMarkerPopup 
                    marker={{
                      title: 'Your Location',
                      type: 'user'
                    }}
                  />
                </Popup>
              </Marker>
              
              {/* Search radius circle */}
              {showSearchRadius && (
                <Circle
                  center={[userLocation.latitude, userLocation.longitude]}
                  radius={searchRadius * 1000}
                  pathOptions={{
                    color: theme.palette.secondary.main,
                    fillColor: theme.palette.secondary.main,
                    fillOpacity: 0.1,
                    weight: 2,
                    dashArray: '5, 5'
                  }}
                />
              )}
            </>
          )}

          {/* Vocational markers */}
          {markers.map((marker, index) => (
            <Marker
              key={marker.id || index}
              position={[marker.coordinates.latitude, marker.coordinates.longitude]}
              icon={createVocationalIcon(
                marker.type, 
                marker.category, 
                marker.online, 
                marker.verified
              )}
              eventHandlers={{
                click: () => onMarkerClick(marker)
              }}
            >
              <Popup>
                <VocationalMarkerPopup 
                  marker={marker}
                  onViewDetails={onMarkerClick}
                  onContact={(marker) => console.log('Contact:', marker)}
                />
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Professional map controls */}
        <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}>
          <AnimatePresence>
            {controls.location && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Tooltip title="Find my location">
                  <Fab
                    size="small"
                    onClick={handleLocationClick}
                    disabled={isLocating}
                    sx={{ 
                      mb: 1, 
                      display: 'block',
                      bgcolor: theme.palette.secondary.main,
                      color: theme.palette.secondary.contrastText,
                      '&:hover': {
                        bgcolor: theme.palette.secondary.dark,
                        transform: 'scale(1.1)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {isLocating ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <MyLocationIcon />
                    )}
                  </Fab>
                </Tooltip>
              </motion.div>
            )}

            {controls.zoom && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Paper sx={{ 
                  mb: 1,
                  bgcolor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.secondary.main}33`
                }}>
                  <Tooltip title="Zoom in">
                    <IconButton 
                      onClick={handleZoomIn} 
                      size="small"
                      sx={{ 
                        color: theme.palette.secondary.main,
                        '&:hover': { bgcolor: theme.palette.secondary.main + '11' }
                      }}
                    >
                      <ZoomInIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Zoom out">
                    <IconButton 
                      onClick={handleZoomOut} 
                      size="small"
                      sx={{ 
                        color: theme.palette.secondary.main,
                        '&:hover': { bgcolor: theme.palette.secondary.main + '11' }
                      }}
                    >
                      <ZoomOutIcon />
                    </IconButton>
                  </Tooltip>
                </Paper>
              </motion.div>
            )}

            {controls.layers && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Tooltip title="Change map style">
                  <Fab
                    size="small"
                    onClick={cycleTileLayer}
                    sx={{ 
                      mb: 1, 
                      display: 'block',
                      bgcolor: theme.palette.background.paper,
                      color: theme.palette.secondary.main,
                      border: `1px solid ${theme.palette.secondary.main}33`,
                      '&:hover': {
                        bgcolor: theme.palette.secondary.main + '11',
                        transform: 'scale(1.1)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <LayersIcon />
                  </Fab>
                </Tooltip>
              </motion.div>
            )}

            {controls.fullscreen && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Tooltip title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
                  <Fab
                    size="small"
                    onClick={toggleFullscreen}
                    sx={{ 
                      bgcolor: theme.palette.background.paper,
                      color: theme.palette.secondary.main,
                      border: `1px solid ${theme.palette.secondary.main}33`,
                      '&:hover': {
                        bgcolor: theme.palette.secondary.main + '11',
                        transform: 'scale(1.1)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                  </Fab>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        {/* Status indicators */}
        <AnimatePresence>
          {isLocating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <Alert 
                severity="info" 
                sx={{ 
                  position: 'absolute', 
                  bottom: 16, 
                  left: 16, 
                  right: 16, 
                  zIndex: 1000,
                  bgcolor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.secondary.main}33`
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  Getting your location...
                </Box>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </motion.div>
  );
};

export default InteractiveMap; 