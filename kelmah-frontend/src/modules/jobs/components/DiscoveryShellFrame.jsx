import { Box, Grid, Typography } from '@mui/material';
import PropTypes from 'prop-types';

const DiscoveryShellFrame = ({
  heading,
  subheading,
  isMobile,
  children,
  quickPicks,
}) => {
  return (
    <>
      <Box
        sx={{
          mb: { xs: 2, md: 3 },
          mt: { xs: 1, md: 0 },
          px: { xs: 1, sm: 0 },
        }}
      >
        {isMobile && (
          <Box sx={{ mb: 1.5, px: 0.25 }}>
            <Typography
              component="h1"
              variant="h5"
              sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}
            >
              {heading}
            </Typography>
            {subheading && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {subheading}
              </Typography>
            )}
          </Box>
        )}

        <Grid container spacing={{ xs: 1.25, md: 3 }} alignItems="center">
          <Grid item xs={12}>
            {!isMobile && (
              <Box sx={{ mb: 1.5 }}>
                <Typography
                  component="h1"
                  variant="h4"
                  sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}
                >
                  {heading}
                </Typography>
                {subheading && (
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    {subheading}
                  </Typography>
                )}
              </Box>
            )}

            {children}
          </Grid>
        </Grid>
      </Box>

      {quickPicks || null}
    </>
  );
};

DiscoveryShellFrame.propTypes = {
  heading: PropTypes.string.isRequired,
  subheading: PropTypes.string,
  isMobile: PropTypes.bool,
  children: PropTypes.node,
  quickPicks: PropTypes.node,
};

export default DiscoveryShellFrame;
