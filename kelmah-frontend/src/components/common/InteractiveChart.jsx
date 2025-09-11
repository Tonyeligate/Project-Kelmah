import React from 'react';
import {
  LineChart,
  BarChart,
  AreaChart,
  PieChart,
  Line,
  Bar,
  Area,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { Paper, Typography, useTheme } from '@mui/material';

const chartComponents = {
  line: LineChart,
  bar: BarChart,
  area: AreaChart,
  pie: PieChart,
};

const seriesComponents = {
  line: Line,
  bar: Bar,
  area: Area,
  pie: Pie,
};

const InteractiveChart = ({
  data,
  type = 'line',
  series,
  title,
  height = 400,
}) => {
  const theme = useTheme();
  const ChartComponent = chartComponents[type] || LineChart;
  const SeriesComponent = seriesComponents[type] || Line;

  const chartVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const seriesVariants = {
    hidden: { opacity: 0, pathLength: 0 },
    visible: { opacity: 1, pathLength: 1, transition: { duration: 1.5 } },
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        borderRadius: 3,
        background: `rgba(0, 0, 0, 0.2)`,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 215, 0, 0.1)',
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.contrastText }}>
        {title}
      </Typography>
      <motion.div initial="hidden" animate="visible" variants={chartVariants}>
        <ResponsiveContainer width="100%" height={height}>
          <ChartComponent data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
            <YAxis stroke={theme.palette.text.secondary} />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                borderColor: theme.palette.primary.main,
                color: theme.palette.text.primary,
              }}
            />
            <Legend wrapperStyle={{ color: theme.palette.text.primary }} />
            {series.map((s, index) => (
              <SeriesComponent
                key={s.dataKey}
                {...s}
                stroke={s.color || theme.palette.secondary.main}
                fill={s.color || theme.palette.secondary.main}
                component={motion.path}
                variants={seriesVariants}
              />
            ))}
          </ChartComponent>
        </ResponsiveContainer>
      </motion.div>
    </Paper>
  );
};

export default InteractiveChart;
