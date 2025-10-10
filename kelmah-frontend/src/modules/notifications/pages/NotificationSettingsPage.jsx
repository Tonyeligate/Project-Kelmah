import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  FormGroup,
  FormControlLabel,
  Switch,
  Button,
  Divider,
  Grid,
} from '@mui/material';
import notificationService from '../services/notificationService';

const NotificationSettingsPage = () => {
  const [prefs, setPrefs] = useState({
    channels: { inApp: true, email: false, sms: false },
    types: {
      message_received: true,
      payment_received: true,
      job_application: true,
      job_offer: true,
      contract_update: true,
      system_alert: true,
      review_received: true,
    },
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    notificationService
      .getPreferences()
      .then((data) => {
        if (mounted && data) setPrefs((prev) => ({ ...prev, ...data }));
      })
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const save = async () => {
    setLoading(true);
    try {
      await notificationService.updatePreferences(prefs);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>
        Notification Preferences
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">Channels</Typography>
            <Divider sx={{ my: 1 }} />
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(prefs.channels?.inApp)}
                    onChange={(e) =>
                      setPrefs((prev) => ({
                        ...prev,
                        channels: { ...prev.channels, inApp: e.target.checked },
                      }))
                    }
                  />
                }
                label="In-app"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(prefs.channels?.email)}
                    onChange={(e) =>
                      setPrefs((prev) => ({
                        ...prev,
                        channels: { ...prev.channels, email: e.target.checked },
                      }))
                    }
                  />
                }
                label="Email"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(prefs.channels?.sms)}
                    onChange={(e) =>
                      setPrefs((prev) => ({
                        ...prev,
                        channels: { ...prev.channels, sms: e.target.checked },
                      }))
                    }
                  />
                }
                label="SMS"
              />
            </FormGroup>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">Types</Typography>
            <Divider sx={{ my: 1 }} />
            <FormGroup>
              {Object.keys(prefs.types).map((key) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Switch
                      checked={Boolean(prefs.types[key])}
                      onChange={(e) =>
                        setPrefs((prev) => ({
                          ...prev,
                          types: { ...prev.types, [key]: e.target.checked },
                        }))
                      }
                    />
                  }
                  label={key.replace(/_/g, ' ')}
                />
              ))}
            </FormGroup>
          </Grid>
        </Grid>
        <Button
          sx={{ mt: 2 }}
          variant="contained"
          disabled={loading}
          onClick={save}
        >
          Save
        </Button>
      </Paper>
    </Container>
  );
};

export default NotificationSettingsPage;
