import { Box, CircularProgress, Typography } from '@mui/material';

const RouteSkeleton = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '40vh',
      gap: 2,
      color: 'text.secondary',
    }}
  >
    <CircularProgress color="secondary" size={32} thickness={4} />
    <Typography variant="body2" component="p">
      Loading experience...
    </Typography>
  </Box>
);

export default RouteSkeleton;
