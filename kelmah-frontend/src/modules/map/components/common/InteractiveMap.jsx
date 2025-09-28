import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Circle,
  Polyline,
  LayersControl,
  FeatureGroup,
} from 'react-leaflet';
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
  useTheme,
  Badge,
  Card,
  CardContent,
  Zoom,
  Slide,
  Grow,
  LinearProgress,
  Stack,
  Divider,
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
  Verified as VerifiedIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Visibility as VisibilityIcon,
  Navigation as NavigationIcon,
  Map as MapIcon,
  Satellite as SatelliteIcon,
  Terrain as TerrainIcon,
  RadioButtonChecked as PulseIcon,
  FlashOn as FlashIcon,
  PhotoCamera as PhotoIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import mapService from '../../services/mapService';
import { EXTERNAL_SERVICES } from '../../../../config/services';

// Enhanced marker icons with sophisticated styling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: EXTERNAL_SERVICES.LEAFLET.MARKER_ICON_RETINA,
  iconUrl: EXTERNAL_SERVICES.LEAFLET.MARKER_ICON,
  shadowUrl: EXTERNAL_SERVICES.LEAFLET.MARKER_SHADOW,
});

// Professional 3D-style markers with advanced animations
const createAdvancedVocationalIcon = (type, category = '', isOnline = false, isVerified = false, isUrgent = false) => {
  const getIconColor = () => {
    if (type === 'job') return isUrgent ? '#FF5722' : '#FFD700';
    if (type === 'worker') return isOnline ? '#4CAF50' : '#1a1a1a';
    return '#FFD700';
  };

  const getIconSymbol = () => {
    if (type === 'job') return isUrgent ? '🚨' : '💼';
    if (type === 'worker') {
      const categoryIcons = {
        Carpentry: '🔨', Masonry: '🧱', Plumbing: '🔧', Electrical: '⚡',
        Painting: '🎨', Welding: '🔥', HVAC: '❄️', Security: '🛡️',
        Cleaning: '🧽', Landscaping: '🌱', Roofing: '🏠', Tiling: '⬜'
      };
      return categoryIcons[category] || '👷';
    }
    return '📍';
  };

  const color = getIconColor();
  const symbol = getIconSymbol();
  const size = type === 'user' ? 36 : 32;
  
  const iconHtml = `
    <div style="
      position: relative;
      background: radial-gradient(circle at 30% 30%, ${color}ff 0%, ${color}dd 50%, ${color}aa 100%);
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: 3px solid #ffffff;
      box-shadow: 
        0 0 0 3px ${color}44,
        0 6px 20px rgba(0,0,0,0.3),
        0 0 30px ${color}66,
        inset 0 1px 3px rgba(255,255,255,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${type === 'job' && !isUrgent ? '#000000' : '#ffffff'};
      font-weight: bold;
      font-size: ${type === 'user' ? '18px' : '16px'};
      cursor: pointer;
      transform: scale(1);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      animation: ${type === 'user' ? 'userPulse 3s infinite' : isUrgent ? 'urgentBounce 1s infinite' : 'none'};
      background-image: linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%),
                        linear-gradient(-45deg, rgba(255,255,255,0.2) 25%, transparent 25%);
      background-size: 6px 6px;
    ">
      <div style="
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));
        transform: scale(0.9);
      ">${symbol}</div>
      ${isVerified ? `
        <div style="
          position: absolute; 
          top: -4px; 
          right: -4px; 
          background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
          border-radius: 50%; 
          width: 16px; 
          height: 16px; 
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          color: white;
          box-shadow: 0 2px 8px rgba(76, 175, 80, 0.4);
        ">✓</div>
      ` : ''}
      ${isOnline && type === 'worker' ? `
        <div style="
          position: absolute; 
          bottom: -2px; 
          right: -2px; 
          background: radial-gradient(circle, #4CAF50 0%, #2E7D32 100%);
          border-radius: 50%; 
          width: 12px; 
          height: 12px; 
          border: 2px solid white;
          animation: onlinePulse 2s infinite;
          box-shadow: 0 0 10px rgba(76, 175, 80, 0.6);
        "></div>
      ` : ''}
      ${isUrgent ? `
        <div style="
          position: absolute;
          top: -8px;
          left: -8px;
          right: -8px;
          bottom: -8px;
          border: 2px solid #FF5722;
          border-radius: 50%;
          animation: urgentRing 1.5s infinite;
        "></div>
      ` : ''}
    </div>
    <style>
      @keyframes userPulse {
        0%, 100% { 
          box-shadow: 0 0 0 3px ${color}44, 0 6px 20px rgba(0,0,0,0.3), 0 0 30px ${color}66;
          transform: scale(1);
        }
        50% { 
          box-shadow: 0 0 0 8px ${color}22, 0 6px 20px rgba(0,0,0,0.3), 0 0 40px ${color}88;
          transform: scale(1.05);
        }
      }
      @keyframes urgentBounce {
        0%, 100% { transform: scale(1) translateY(0); }
        50% { transform: scale(1.1) translateY(-3px); }
      }
      @keyframes urgentRing {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(1.5); opacity: 0; }
      }
      @keyframes onlinePulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.2); }
      }
    </style>
  `;
  
  return L.divIcon({
    html: iconHtml,
    className: 'advanced-vocational-marker',
    iconSize: [size + 8, size + 8],
    iconAnchor: [(size + 8) / 2, (size + 8) / 2],
    popupAnchor: [0, -(size + 8) / 2]
  });
};

// Advanced map controller with professional features
const AdvancedMapController = ({ 
  onLocationUpdate, 
  onZoomChange, 
  centerOnUser, 
  setCenterOnUser,
  isLocating,
  setIsLocating,
  showHeatmap,
  setShowHeatmap
}) => {
  const map = useMap();

  useEffect(() => {
    const handleMoveEnd = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      onLocationUpdate({
        latitude: center.lat,
        longitude: center.lng
      });
      onZoomChange(zoom);
    };

    const handleZoomEnd = () => {
      onZoomChange(map.getZoom());
    };

    map.on('moveend', handleMoveEnd);
    map.on('zoomend', handleZoomEnd);

    return () => {
      map.off('moveend', handleMoveEnd);
      map.off('zoomend', handleZoomEnd);
    };
  }, [map, onLocationUpdate, onZoomChange]);

  useEffect(() => {
    if (centerOnUser) {
      setIsLocating(true);
      mapService.getCurrentLocation()
        .then(location => {
          map.flyTo([location.latitude, location.longitude], 15, {
            duration: 3,
            easeLinearity: 0.1
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

// Stunning professional popup with rich information
const SpectacularMarkerPopup = ({ marker, onViewDetails, onContact, onNavigate }) => {
  const theme = useTheme();
  
  if (marker.type === 'job') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Card sx={{ 
          minWidth: 320, 
          maxWidth: 380,
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.secondary.main}08 100%)`,
          border: `2px solid ${theme.palette.secondary.main}33`,
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${theme.palette.secondary.main} 0%, ${marker.urgent ? '#FF5722' : theme.palette.secondary.dark} 100%)`,
          }
        }}>
          <CardContent sx={{ p: 0 }}>
            {/* Header Section */}
            <Box sx={{ 
              p: 2.5, 
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.secondary.main}05 100%)` 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: marker.urgent ? '#FF572222' : theme.palette.secondary.main + '22',
                    color: marker.urgent ? '#FF5722' : theme.palette.secondary.main,
                    width: 56,
                    height: 56,
                    mr: 2,
                    boxShadow: `0 4px 16px ${marker.urgent ? '#FF572244' : theme.palette.secondary.main + '44'}`,
                  }}
                >
                  {marker.urgent ? <FlashIcon /> : <JobIcon />}
                </Avatar>
                
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 'bold', 
                    color: theme.palette.secondary.main,
                    mb: 0.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.2,
                  }}>
                    {marker.title}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip 
                      label={marker.category} 
                      size="small" 
                      sx={{ 
                        bgcolor: theme.palette.secondary.main, 
                        color: theme.palette.secondary.contrastText,
                        fontWeight: 'bold',
                      }} 
                    />
                    {marker.verified && (
                      <Tooltip title="Verified Hirer">
                        <VerifiedIcon sx={{ color: '#4CAF50', fontSize: 20 }} />
                      </Tooltip>
                    )}
                    {marker.urgent && (
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <Chip 
                          label="URGENT" 
                          size="small" 
                          sx={{ 
                            bgcolor: '#FF5722', 
                            color: 'white',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            animation: 'pulse 1.5s infinite'
                          }} 
                        />
                      </motion.div>
                    )}
                  </Box>
                </Box>
              </Box>
              
              <Typography variant="body2" sx={{ 
                color: theme.palette.text.secondary,
                lineHeight: 1.5,
                mb: 2,
              }}>
                {marker.description?.substring(0, 150)}...
              </Typography>
            </Box>

            {/* Stats Section */}
            <Box sx={{ px: 2.5, py: 2, bgcolor: theme.palette.background.default + '33' }}>
              <Stack direction="row" spacing={3} divider={<Divider orientation="vertical" flexItem />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MoneyIcon fontSize="small" sx={{ color: theme.palette.secondary.main }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                      GHS {marker.budget?.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {marker.paymentType || 'Budget'}
                    </Typography>
                  </Box>
                </Box>
                
                {marker.distance && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon fontSize="small" color="action" />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', lineHeight: 1 }}>
                        {mapService.formatDistance(marker.distance)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        away
                      </Typography>
                    </Box>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon fontSize="small" color="action" />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'medium', lineHeight: 1 }}>
                      {new Date(marker.createdAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      posted
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Box>

            {/* Skills Section */}
            {marker.skills && marker.skills.length > 0 && (
              <Box sx={{ px: 2.5, py: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold', color: theme.palette.text.primary }}>
                  Required Skills
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {marker.skills.slice(0, 4).map((skill, index) => (
                    <Chip 
                      key={index}
                      label={skill}
                      size="small"
                      variant="outlined"
                      sx={{ 
                        borderColor: theme.palette.secondary.main + '66',
                        color: theme.palette.secondary.main,
                        fontSize: '0.75rem',
                        '&:hover': {
                          bgcolor: theme.palette.secondary.main + '11',
                        }
                      }}
                    />
                  ))}
                  {marker.skills.length > 4 && (
                    <Chip 
                      label={`+${marker.skills.length - 4} more`}
                      size="small"
                      variant="outlined"
                      sx={{ 
                        borderColor: theme.palette.secondary.main + '66',
                        color: theme.palette.secondary.main,
                        fontSize: '0.75rem',
                      }}
                    />
                  )}
                </Box>
              </Box>
            )}
            
            {/* Action Buttons */}
            <Box sx={{ p: 2.5, pt: 1 }}>
              <Stack direction="row" spacing={1}>
                <Button 
                  variant="contained" 
                  size="small" 
                  onClick={() => onViewDetails(marker)}
                  startIcon={<VisibilityIcon />}
                  sx={{ 
                    flex: 1,
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                    boxShadow: `0 4px 16px ${theme.palette.secondary.main}44`,
                  }}
                >
                  View Details
                </Button>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => onContact(marker)}
                  startIcon={<WorkerIcon />}
                  sx={{ 
                    flex: 1,
                    borderColor: theme.palette.secondary.main,
                    color: theme.palette.secondary.main,
                    '&:hover': {
                      bgcolor: theme.palette.secondary.main + '11',
                    }
                  }}
                >
                  Apply Now
                </Button>
                <IconButton
                  onClick={() => onNavigate(marker)}
                  sx={{
                    bgcolor: theme.palette.primary.main + '22',
                    color: theme.palette.primary.main,
                    '&:hover': {
                      bgcolor: theme.palette.primary.main + '33',
                    }
                  }}
                >
                  <NavigationIcon />
                </IconButton>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Worker popup (similar structure but adapted for workers)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card sx={{ 
        minWidth: 320, 
        maxWidth: 380,
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.primary.main}08 100%)`,
        border: `2px solid ${theme.palette.primary.main}33`,
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${marker.online ? '#4CAF50' : theme.palette.primary.dark} 100%)`,
        }
      }}>
        <CardContent sx={{ p: 0 }}>
          {/* Header Section */}
          <Box sx={{ 
            p: 2.5, 
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.primary.main}05 100%)` 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  marker.online ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Box sx={{ 
                        width: 16, 
                        height: 16, 
                        borderRadius: '50%', 
                        bgcolor: '#4CAF50',
                        border: '2px solid white',
                        boxShadow: '0 0 10px rgba(76, 175, 80, 0.6)'
                      }} />
                    </motion.div>
                  ) : null
                }
              >
                <Avatar 
                  src={marker.profileImage}
                  sx={{ 
                    width: 56,
                    height: 56,
                    mr: 2,
                    border: `3px solid ${marker.online ? '#4CAF50' : theme.palette.primary.main}33`,
                    boxShadow: `0 4px 16px ${marker.online ? '#4CAF5044' : theme.palette.primary.main + '44'}`,
                  }}
                >
                  <WorkerIcon />
                </Avatar>
              </Badge>
              
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold', 
                  color: theme.palette.primary.main,
                  mb: 0.5,
                  lineHeight: 1.2,
                }}>
                  {marker.name}
                </Typography>
                
                <Typography variant="body2" sx={{ 
                  color: theme.palette.text.secondary,
                  mb: 1,
                  fontStyle: 'italic'
                }}>
                  {marker.title}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip 
                    label={marker.category} 
                    size="small" 
                    sx={{ 
                      bgcolor: theme.palette.primary.main + '22', 
                      color: theme.palette.primary.main,
                      fontWeight: 'bold',
                    }} 
                  />
                  {marker.verified && (
                    <Tooltip title="Verified Professional">
                      <VerifiedIcon sx={{ color: '#4CAF50', fontSize: 20 }} />
                    </Tooltip>
                  )}
                  {marker.online && (
                    <Chip 
                      label="ONLINE" 
                      size="small" 
                      sx={{ 
                        bgcolor: '#4CAF5022', 
                        color: '#4CAF50',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                      }} 
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Stats Section */}
          <Box sx={{ px: 2.5, py: 2, bgcolor: theme.palette.background.default + '33' }}>
            <Stack direction="row" spacing={2} divider={<Divider orientation="vertical" flexItem />}>
              {marker.rating > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StarIcon fontSize="small" sx={{ color: '#FF9800' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                      {marker.rating.toFixed(1)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({marker.reviewCount || 0} reviews)
                    </Typography>
                  </Box>
                </Box>
              )}
              
              {marker.hourlyRate && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MoneyIcon fontSize="small" sx={{ color: theme.palette.secondary.main }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                      GHS {marker.hourlyRate}/hr
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      hourly rate
                    </Typography>
                  </Box>
                </Box>
              )}
              
              {marker.distance && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationIcon fontSize="small" color="action" />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'medium', lineHeight: 1 }}>
                      {mapService.formatDistance(marker.distance)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      away
                    </Typography>
                  </Box>
                </Box>
              )}
            </Stack>
          </Box>

          {/* Bio Section */}
          {marker.bio && (
            <Box sx={{ px: 2.5, py: 2 }}>
              <Typography variant="body2" sx={{ 
                color: theme.palette.text.secondary,
                lineHeight: 1.5,
                fontStyle: 'italic',
              }}>
                "{marker.bio.substring(0, 120)}..."
              </Typography>
            </Box>
          )}

          {/* Skills Section */}
          {marker.skills && marker.skills.length > 0 && (
            <Box sx={{ px: 2.5, py: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold', color: theme.palette.text.primary }}>
                Specializations
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {marker.skills.slice(0, 4).map((skill, index) => (
                  <Chip 
                    key={index}
                    label={skill}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      borderColor: theme.palette.primary.main + '66',
                      color: theme.palette.primary.main,
                      fontSize: '0.75rem',
                      '&:hover': {
                        bgcolor: theme.palette.primary.main + '11',
                      }
                    }}
                  />
                ))}
                {marker.skills.length > 4 && (
                  <Chip 
                    label={`+${marker.skills.length - 4} more`}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      borderColor: theme.palette.primary.main + '66',
                      color: theme.palette.primary.main,
                      fontSize: '0.75rem',
                    }}
                  />
                )}
              </Box>
            </Box>
          )}
          
          {/* Action Buttons */}
          <Box sx={{ p: 2.5, pt: 1 }}>
            <Stack direction="row" spacing={1}>
              <Button 
                variant="contained" 
                size="small" 
                onClick={() => onViewDetails(marker)}
                startIcon={<VisibilityIcon />}
                sx={{ 
                  flex: 1,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  boxShadow: `0 4px 16px ${theme.palette.primary.main}44`,
                }}
              >
                View Profile
              </Button>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => onContact(marker)}
                startIcon={<JobIcon />}
                sx={{ 
                  flex: 1,
                  borderColor: theme.palette.secondary.main,
                  color: theme.palette.secondary.main,
                  '&:hover': {
                    bgcolor: theme.palette.secondary.main + '11',
                  }
                }}
              >
                Hire Now
              </Button>
              <IconButton
                onClick={() => onNavigate(marker)}
                sx={{
                  bgcolor: theme.palette.secondary.main + '22',
                  color: theme.palette.secondary.main,
                  '&:hover': {
                    bgcolor: theme.palette.secondary.main + '33',
                  }
                }}
              >
                <NavigationIcon />
              </IconButton>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const InteractiveMap = ({
  center = [5.6037, -0.187],
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
    fullscreen: true,
  },
}) => {
  const theme = useTheme();
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(zoom);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [centerOnUser, setCenterOnUser] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tileLayer, setTileLayer] = useState('osm');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  const [mapStyle, setMapStyle] = useState('standard');
  const mapRef = useRef();

  // Professional tile layers with enhanced options
  const tileLayers = {
    osm: {
      url: EXTERNAL_SERVICES.OPENSTREETMAP.TILES,
      attribution: '© OpenStreetMap contributors',
      name: 'Standard'
    },
    dark: {
      url: EXTERNAL_SERVICES.CARTODB.DARK_ALL,
      attribution: '© CARTO',
      name: 'Dark Mode'
    },
    satellite: {
      url: EXTERNAL_SERVICES.ARCGIS.WORLD_IMAGERY,
      attribution: '© Esri',
      name: 'Satellite'
    },
    terrain: {
      url: EXTERNAL_SERVICES.OPENTOPOMAP.TILES,
      attribution: '© OpenTopoMap',
      name: 'Terrain'
    },
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

  // Control handlers
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
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <Box 
        sx={{ 
          position: 'relative',
          height,
          width: '100%',
          borderRadius: isFullscreen ? 0 : 2,
          overflow: 'hidden',
          border: isFullscreen ? 'none' : `2px solid ${theme.palette.secondary.main}33`,
          boxShadow: isFullscreen ? 'none' : `0 8px 32px rgba(255, 215, 0, 0.15)`,
          ...(isFullscreen && {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            height: '100vh',
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
          zoomControl={false}
          attributionControl={false}
          whenCreated={(mapInstance) => {
            mapRef.current = mapInstance;
          }}
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked={tileLayer === 'osm'} name="Standard">
              <TileLayer
                url={tileLayers.osm.url}
                attribution={tileLayers.osm.attribution}
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer checked={tileLayer === 'dark'} name="Dark Mode">
              <TileLayer
                url={tileLayers.dark.url}
                attribution={tileLayers.dark.attribution}
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer checked={tileLayer === 'satellite'} name="Satellite">
              <TileLayer
                url={tileLayers.satellite.url}
                attribution={tileLayers.satellite.attribution}
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer checked={tileLayer === 'terrain'} name="Terrain">
              <TileLayer
                url={tileLayers.terrain.url}
                attribution={tileLayers.terrain.attribution}
              />
            </LayersControl.BaseLayer>
          </LayersControl>
          
          <AdvancedMapController
            onLocationUpdate={setMapCenter}
            onZoomChange={setMapZoom}
            centerOnUser={centerOnUser}
            setCenterOnUser={setCenterOnUser}
            isLocating={isLocating}
            setIsLocating={setIsLocating}
            showHeatmap={showHeatmap}
            setShowHeatmap={setShowHeatmap}
          />

          {/* Enhanced user location marker */}
          {userLocation && showUserLocation && (
            <FeatureGroup>
              <Marker 
                position={[userLocation.latitude, userLocation.longitude]}
                icon={createAdvancedVocationalIcon('user')}
              >
                <Popup>
                  <SpectacularMarkerPopup 
                    marker={{
                      title: 'Your Location',
                      type: 'user',
                      description: 'You are here',
                    }}
                    onViewDetails={() => {}}
                    onContact={() => {}}
                    onNavigate={() => {}}
                  />
                </Popup>
              </Marker>
              
              {/* Professional search radius circle */}
              {showSearchRadius && (
                <Circle
                  center={[userLocation.latitude, userLocation.longitude]}
                  radius={searchRadius * 1000}
                  pathOptions={{
                    color: theme.palette.secondary.main,
                    fillColor: theme.palette.secondary.main,
                    fillOpacity: 0.1,
                    weight: 3,
                    dashArray: '10, 10',
                    opacity: 0.8,
                  }}
                />
              )}
            </FeatureGroup>
          )}

          {/* Advanced vocational markers */}
          {markers.map((marker, index) => (
            <Marker
              key={marker.id || index}
              position={[marker.coordinates.latitude, marker.coordinates.longitude]}
              icon={createAdvancedVocationalIcon(
                marker.type, 
                marker.category, 
                marker.online, 
                marker.verified,
                marker.urgent
              )}
              eventHandlers={{
                click: () => onMarkerClick(marker)
              }}
            >
              <Popup>
                <SpectacularMarkerPopup 
                  marker={marker}
                  onViewDetails={onMarkerClick}
                  onContact={(marker) => console.log('Contact:', marker)}
                  onNavigate={(marker) => console.log('Navigate to:', marker)}
                />
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Advanced Professional Controls */}
        <Box sx={{ position: 'absolute', top: 20, right: 20, zIndex: 1000 }}>
          <Stack spacing={1}>
            {/* Location Control */}
            {controls.location && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Tooltip title="Find My Location">
                  <Fab
                    size="medium"
                    onClick={handleLocationClick}
                    disabled={isLocating}
                    sx={{ 
                      background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                      color: theme.palette.secondary.contrastText,
                      boxShadow: `0 4px 20px ${theme.palette.secondary.main}44`,
                      '&:hover': {
                        boxShadow: `0 6px 24px ${theme.palette.secondary.main}66`,
                      },
                      '&:disabled': {
                        background: theme.palette.action.disabled,
                      },
                    }}
                  >
                    {isLocating ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      <MyLocationIcon />
                    )}
                  </Fab>
                </Tooltip>
              </motion.div>
            )}

            {/* Zoom Controls */}
            {controls.zoom && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Paper sx={{ 
                  bgcolor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.secondary.main}33`,
                  borderRadius: 2,
                  overflow: 'hidden',
                  backdropFilter: 'blur(10px)',
                  background: `linear-gradient(135deg, ${theme.palette.background.paper}ee 0%, ${theme.palette.background.paper}cc 100%)`,
                }}>
                  <Stack>
                    <Tooltip title="Zoom In">
                      <IconButton 
                        onClick={handleZoomIn} 
                        size="medium"
                        sx={{ 
                          color: theme.palette.secondary.main,
                          borderRadius: 0,
                          '&:hover': { 
                            bgcolor: theme.palette.secondary.main + '11',
                            transform: 'scale(1.1)',
                          },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <ZoomInIcon />
                      </IconButton>
                    </Tooltip>
                    <Divider />
                    <Tooltip title="Zoom Out">
                      <IconButton 
                        onClick={handleZoomOut} 
                        size="medium"
                        sx={{ 
                          color: theme.palette.secondary.main,
                          borderRadius: 0,
                          '&:hover': { 
                            bgcolor: theme.palette.secondary.main + '11',
                            transform: 'scale(1.1)',
                          },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <ZoomOutIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Paper>
              </motion.div>
            )}

            {/* Advanced Map Style Control */}
            {controls.layers && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Tooltip title={`Map Style: ${tileLayers[tileLayer]?.name}`}>
                  <Fab
                    size="medium"
                    onClick={cycleTileLayer}
                    sx={{ 
                      bgcolor: theme.palette.background.paper,
                      color: theme.palette.primary.main,
                      border: `2px solid ${theme.palette.primary.main}33`,
                      boxShadow: `0 4px 20px ${theme.palette.primary.main}33`,
                      '&:hover': {
                        bgcolor: theme.palette.primary.main + '11',
                        boxShadow: `0 6px 24px ${theme.palette.primary.main}44`,
                      },
                    }}
                  >
                    {tileLayer === 'satellite' ? <SatelliteIcon /> : 
                     tileLayer === 'terrain' ? <TerrainIcon /> : 
                     <MapIcon />}
                  </Fab>
                </Tooltip>
              </motion.div>
            )}

            {/* Fullscreen Control */}
            {controls.fullscreen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                  <Fab
                    size="medium"
                    onClick={toggleFullscreen}
                    sx={{ 
                      bgcolor: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                      border: `2px solid ${theme.palette.divider}`,
                      boxShadow: `0 4px 20px rgba(0,0,0,0.2)`,
                      '&:hover': {
                        bgcolor: theme.palette.action.hover,
                        boxShadow: `0 6px 24px rgba(0,0,0,0.3)`,
                      },
                    }}
                  >
                    {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                  </Fab>
                </Tooltip>
              </motion.div>
            )}
          </Stack>
        </Box>

        {/* Professional Map Info Panel */}
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.5 }}
          >
            <Paper
              sx={{
                position: 'absolute',
                bottom: 20,
                left: 20,
                zIndex: 1000,
                p: 2,
                minWidth: 280,
                background: `linear-gradient(135deg, ${theme.palette.background.paper}ee 0%, ${theme.palette.background.paper}cc 100%)`,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${theme.palette.secondary.main}33`,
                borderRadius: 3,
                boxShadow: `0 8px 32px rgba(255, 215, 0, 0.2)`,
              }}
            >
              <Typography variant="subtitle2" sx={{ 
                mb: 1.5, 
                fontWeight: 'bold', 
                color: theme.palette.secondary.main,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}>
                <InfoIcon fontSize="small" />
                Map Information
              </Typography>
              
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Zoom Level:</Typography>
                  <Chip label={`${mapZoom}x`} size="small" color="secondary" variant="outlined" />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Map Style:</Typography>
                  <Chip label={tileLayers[tileLayer]?.name} size="small" color="primary" variant="outlined" />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Total Markers:</Typography>
                  <Chip 
                    label={markers.length} 
                    size="small" 
                    sx={{ 
                      bgcolor: '#4CAF5022',
                      color: '#4CAF50',
                      fontWeight: 'bold',
                    }} 
                  />
                </Box>
                
                {userLocation && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Your Location:</Typography>
                    <Typography variant="caption" sx={{ 
                      fontFamily: 'monospace',
                      bgcolor: theme.palette.action.hover,
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                    }}>
                      {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Paper>
          </motion.div>
        </AnimatePresence>

        {/* Status indicators */}
        <AnimatePresence>
          {isLocating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1100,
              }}
            >
              <Paper
                elevation={12}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  background: `linear-gradient(135deg, ${theme.palette.background.paper}ee 0%, ${theme.palette.background.paper}cc 100%)`,
                  backdropFilter: 'blur(20px)',
                  border: `2px solid ${theme.palette.secondary.main}33`,
                  borderRadius: 3,
                  minWidth: 250,
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <CircularProgress 
                    sx={{ color: theme.palette.secondary.main, mb: 2 }} 
                    size={50}
                    thickness={3}
                  />
                </motion.div>
                <Typography variant="h6" sx={{ 
                  color: theme.palette.secondary.main,
                  fontWeight: 'bold',
                  mb: 1,
                }}>
                  Finding Your Location
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Using high-accuracy GPS positioning...
                </Typography>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </motion.div>
  );
};

export default InteractiveMap;
