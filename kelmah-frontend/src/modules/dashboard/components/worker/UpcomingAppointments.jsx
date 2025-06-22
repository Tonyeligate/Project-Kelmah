import React from 'react';
import { Card, CardContent, Typography, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider } from '@mui/material';
import { Event } from '@mui/icons-material';

const appointments = [
  { id: 1, title: 'Client Meeting: Johnson Residence', time: 'Tomorrow, 10:00 AM' },
  { id: 2, title: 'Project Start: Downtown Office Renovation', time: 'Wednesday, 9:00 AM' },
  { id: 3, title: 'Final Inspection: Miller Residence', time: 'Friday, 2:00 PM' },
];

const UpcomingAppointments = () => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Upcoming Appointments
        </Typography>
        <List>
          {appointments.map((appointment, index) => (
            <React.Fragment key={appointment.id}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar>
                    <Event />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={appointment.title} secondary={appointment.time} />
              </ListItem>
              {index < appointments.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default UpcomingAppointments; 