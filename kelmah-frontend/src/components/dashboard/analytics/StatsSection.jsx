import React from 'react';
import { Grid } from '@mui/material';
import StatsCard from '../StatsCard';
import {
    AttachMoney,
    Work,
    Star,
    TrendingUp
} from '@mui/icons-material';

function StatsSection({ role, stats }) {
    if (role === 'worker') {
        return (
            <>
                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard
                        title="Total Earnings"
                        value={`$${stats.total_earned}`}
                        icon={<AttachMoney />}
                        color="#0088FE"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard
                        title="Completed Jobs"
                        value={stats.completed_jobs}
                        icon={<Work />}
                        color="#00C49F"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard
                        title="Success Rate"
                        value={`${stats.success_rate}%`}
                        icon={<TrendingUp />}
                        color="#FFBB28"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard
                        title="Rating"
                        value={`${stats.rating}/5.0`}
                        icon={<Star />}
                        color="#FF8042"
                    />
                </Grid>
            </>
        );
    }

    return null; // Add hirer stats if needed
}

export default StatsSection; 