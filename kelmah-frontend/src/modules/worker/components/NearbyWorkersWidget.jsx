import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, List, ListItem, ListItemText, Button } from '@mui/material';
import workerService from '../../worker/services/workerService';

const NearbyWorkersWidget = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      // Basic geolocation; fallback to Accra coords
      const fallback = { latitude: 5.6037, longitude: -0.1870 };
      let coords = fallback;
      if (navigator.geolocation) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => { coords = pos.coords; resolve(); },
            () => resolve(),
            { timeout: 2000 }
          );
        });
      }
      const res = await workerService.getNearbyWorkers({ latitude: coords.latitude, longitude: coords.longitude, radiusKm: 25, limit: 10 });
      const list = res?.data?.data?.workers || res?.data?.workers || [];
      setWorkers(list);
    } catch (_) {
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">Nearby Workers</Typography>
        <Button size="small" onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</Button>
        <List dense>
          {workers.map((w) => (
            <ListItem key={`${w.source}-${w.id}`}>
              <ListItemText primary={w.name || w.id} secondary={Array.isArray(w.coordinates) ? w.coordinates.join(', ') : ''} />
            </ListItem>
          ))}
          {!workers.length && <Typography variant="body2">No nearby workers</Typography>}
        </List>
      </CardContent>
    </Card>
  );
};

export default NearbyWorkersWidget;


