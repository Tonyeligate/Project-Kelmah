import PropTypes from 'prop-types';
import { Paper, Typography, alpha } from '@mui/material';

const StatTile = ({
  value,
  label,
  isDark = false,
  darkOpacity = 0.06,
  lightOpacity = 0.9,
  accentColor = '#FFD166',
}) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      borderRadius: 3,
      bgcolor: isDark
        ? alpha('#FFFFFF', darkOpacity)
        : alpha('#FFFFFF', lightOpacity),
      border: `1px solid ${isDark ? alpha('#FFFFFF', 0.08) : alpha('#0F172A', 0.08)}`,
      textAlign: 'center',
      height: '100%',
    }}
  >
    <Typography
      variant="h5"
      fontWeight={900}
      sx={{ color: accentColor, lineHeight: 1 }}
    >
      {value}
    </Typography>
    <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
      {label}
    </Typography>
  </Paper>
);

StatTile.propTypes = {
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  isDark: PropTypes.bool,
  darkOpacity: PropTypes.number,
  lightOpacity: PropTypes.number,
  accentColor: PropTypes.string,
};

export default StatTile;
