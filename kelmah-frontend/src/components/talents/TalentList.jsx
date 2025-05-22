import React from 'react';
import { Grid, Box, Typography } from '@mui/material';

function TalentList({ talents }) {
    return (
        <Box>
            <Grid container spacing={3}>
                {talents.map(talent => (
                    <Grid item xs={12} sm={6} md={4} key={talent.id}>
                        {/* Talent card component here */}
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}

export default TalentList; 