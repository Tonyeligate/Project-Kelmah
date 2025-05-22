import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PropTypes from 'prop-types';

/**
 * Chart component to display worker's recent earnings data
 */
const RecentEarningsChart = ({ earnings }) => {
  // Format data for the chart
  const formatChartData = () => {
    if (!earnings || !earnings.weeklyData || !Array.isArray(earnings.weeklyData)) {
      return [];
    }

    // Make sure we only use the last 4 weeks for the chart
    return earnings.weeklyData.slice(-4).map(week => ({
      name: week.weekLabel || 'Week',
      amount: parseFloat(week.amount || 0).toFixed(2)
    }));
  };

  const chartData = formatChartData();
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 1.5,
            border: '1px solid #ccc',
            borderRadius: 1,
            boxShadow: 1
          }}
        >
          <Typography variant="body2" color="text.primary">
            {`${payload[0].payload.name}: $${payload[0].value}`}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  if (!earnings) {
    return (
      <Typography variant="body2" color="text.secondary">
        No earnings data available.
      </Typography>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Last 4 Weeks
        </Typography>
        <Typography variant="subtitle1" fontWeight="bold">
          Total: ${parseFloat(earnings.currentMonthTotal || 0).toFixed(2)}
        </Typography>
      </Stack>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="85%">
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: 5,
              left: 5,
              bottom: 20
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="amount" 
              fill="#4caf50" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Box sx={{ height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Not enough data to display chart.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

RecentEarningsChart.propTypes = {
  /**
   * Object containing earnings data
   */
  earnings: PropTypes.shape({
    currentMonthTotal: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    previousMonthTotal: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    weeklyData: PropTypes.arrayOf(
      PropTypes.shape({
        weekLabel: PropTypes.string,
        amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      })
    )
  })
};

export default RecentEarningsChart; 