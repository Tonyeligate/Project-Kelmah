import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Skeleton,
} from '@mui/material';
import workerService from '../../worker/services/workerService';

const FALLBACK_COORDS = { latitude: 5.6037, longitude: -0.187 };
const SEARCH_RADIUS_KM = 25;
const RESULT_LIMIT = 10;

const getLocationLabel = (worker = {}) => {
  const location = worker.location;

  if (typeof location === 'string' && location.trim()) {
    return location;
  }

  if (location && typeof location === 'object') {
    return (
      location.city || location.address || location.name || location.label || ''
    );
  }

  if (typeof worker.city === 'string' && worker.city.trim()) {
    return worker.city;
  }

  return '';
};

const getDistanceLabel = (worker = {}) => {
  const candidates = [
    worker.distance,
    worker.distanceKm,
    worker.location?.distance,
    worker.location?.distanceKm,
  ];

  const value = candidates
    .map((entry) => Number(entry))
    .find((entry) => Number.isFinite(entry));

  if (!Number.isFinite(value)) {
    return '';
  }

  if (value < 1) {
    return `${Math.round(value * 1000)} m away`;
  }

  return `${value.toFixed(1)} km away`;
};

const getWorkerKey = (worker = {}, index) => {
  const stableId = worker.id || worker.userId || worker._id;
  if (stableId) {
    return String(stableId);
  }

  const fallbackKey = [
    worker.name,
    getLocationLabel(worker),
    getDistanceLabel(worker),
  ]
    .filter(Boolean)
    .join('-');

  if (fallbackKey) {
    return `${fallbackKey}-${index}`;
  }

  return `nearby-worker-${index}`;
};

const NearbyWorkersWidget = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState(
    'Uses your device location when available. Falls back to central Accra if location is unavailable.',
  );
  const [locationFallbackNote, setLocationFallbackNote] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setStatusText('Checking location and loading nearby workers...');

      let coords = FALLBACK_COORDS;
      let usedFallback = true;
      let fallbackReason =
        'Using central Accra because location could not be confirmed.';

      const hasGeolocation =
        typeof navigator !== 'undefined' &&
        navigator.geolocation &&
        typeof navigator.geolocation.getCurrentPosition === 'function';

      if (hasGeolocation) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const latitude = Number(pos?.coords?.latitude);
              const longitude = Number(pos?.coords?.longitude);
              if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
                coords = { latitude, longitude };
                usedFallback = false;
                fallbackReason = '';
              }
              resolve();
            },
            (error) => {
              if (error?.code === 1) {
                fallbackReason =
                  'Location permission was denied. Using central Accra as fallback.';
              } else if (error?.code === 2) {
                fallbackReason =
                  'Current location is unavailable. Using central Accra as fallback.';
              } else if (error?.code === 3) {
                fallbackReason =
                  'Location check timed out. Using central Accra as fallback.';
              }
              resolve();
            },
            { timeout: 2500 },
          );
        });
      } else {
        fallbackReason =
          'This device/browser does not support location access. Using central Accra as fallback.';
      }

      setLocationFallbackNote(usedFallback ? fallbackReason : '');

      const res = await workerService.getNearbyWorkers({
        latitude: coords.latitude,
        longitude: coords.longitude,
        radiusKm: SEARCH_RADIUS_KM,
        limit: RESULT_LIMIT,
      });
      const list = res?.data?.data?.workers || res?.data?.workers || [];
      setWorkers(list);

      if (list.length === 0) {
        setStatusText(
          usedFallback
            ? `No workers found within ${SEARCH_RADIUS_KM} km of central Accra.`
            : `No workers found within ${SEARCH_RADIUS_KM} km of your current location.`,
        );
      } else {
        setStatusText(
          usedFallback
            ? `Showing ${list.length} worker${list.length === 1 ? '' : 's'} within ${SEARCH_RADIUS_KM} km of central Accra.`
            : `Showing ${list.length} worker${list.length === 1 ? '' : 's'} within ${SEARCH_RADIUS_KM} km of your current location.`,
        );
      }
    } catch {
      setWorkers([]);
      setStatusText(
        'Nearby workers could not be loaded right now. Please try refresh.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">Nearby Workers</Typography>
        <Button size="small" onClick={load} disabled={loading} aria-label="Refresh nearby workers list">
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Uses your device location when available. If location is unavailable,
          results use central Accra. Search radius: {SEARCH_RADIUS_KM} km.
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 0.5 }}
          aria-live="polite"
        >
          {statusText}
        </Typography>
        {locationFallbackNote && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 0.5 }}
          >
            {locationFallbackNote}
          </Typography>
        )}
        <List dense>
          {loading &&
            Array.from({ length: 3 }).map((_, index) => (
              <ListItem key={`nearby-worker-loading-${index}`}>
                <ListItemText
                  primary={<Skeleton variant="text" width="55%" />}
                  secondary={<Skeleton variant="text" width="70%" />}
                />
              </ListItem>
            ))}

          {!loading &&
            workers.map((w, index) => {
              const rowDetails = [getLocationLabel(w), getDistanceLabel(w)]
                .filter(Boolean)
                .join(' • ');

              return (
                <ListItem key={getWorkerKey(w, index)}>
                  <ListItemText
                    primary={w.name || w.id || 'Skilled Worker'}
                    secondary={rowDetails || 'Location details not available'}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: 600,
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                      color: 'text.secondary',
                    }}
                  />
                </ListItem>
              );
            })}

          {!loading && !workers.length && (
            <Typography variant="body2" color="text.secondary">
              No nearby workers found yet. Try Refresh or check again shortly.
            </Typography>
          )}
        </List>
      </CardContent>
    </Card>
  );
};

export default NearbyWorkersWidget;
