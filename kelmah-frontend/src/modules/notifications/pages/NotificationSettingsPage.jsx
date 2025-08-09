import React, { useEffect, useState } from 'react';
import { Container, Paper, Typography, FormGroup, FormControlLabel, Switch, Button } from '@mui/material';
import axios from '../../common/services/axios';

const NotificationSettingsPage = () => {
  const [prefs, setPrefs] = useState({ email: true, push: true, sms: false, inApp: true, quietHours: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    axios.get('/api/settings/notifications')
      .then((res) => { if (mounted) setPrefs(res.data?.data || prefs); })
      .finally(() => setLoading(false));
    return () => { mounted = false; };
  }, []);

  const save = async () => {
    setLoading(true);
    try {
      await axios.put('/api/settings/notifications', prefs);
    } finally { setLoading(false); }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>Notification Preferences</Typography>
      <Paper sx={{ p: 2 }}>
        <FormGroup>
          <FormControlLabel control={<Switch checked={prefs.inApp} onChange={(e) => setPrefs({ ...prefs, inApp: e.target.checked })} />} label="In-app Notifications" />
          <FormControlLabel control={<Switch checked={prefs.push} onChange={(e) => setPrefs({ ...prefs, push: e.target.checked })} />} label="Push Notifications" />
          <FormControlLabel control={<Switch checked={prefs.email} onChange={(e) => setPrefs({ ...prefs, email: e.target.checked })} />} label="Email Notifications" />
          <FormControlLabel control={<Switch checked={prefs.sms} onChange={(e) => setPrefs({ ...prefs, sms: e.target.checked })} />} label="SMS Notifications" />
        </FormGroup>
        <Button sx={{ mt: 2 }} variant="contained" disabled={loading} onClick={save}>Save</Button>
      </Paper>
    </Container>
  );
};

export default NotificationSettingsPage;



