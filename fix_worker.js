const fs = require('fs');
const file = './kelmah-frontend/src/modules/worker/pages/WorkerDashboardPage.jsx';
let content = fs.readFileSync(file, 'utf8');

const renderStart = content.indexOf('return (');
if (renderStart === -1) process.exit(1);

const preamble = content.substring(0, renderStart);

const mobileUI = \
      {isMobile ? (
        <Box sx={{ pb: 8, pt: 2, px: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Mobile Futuristic Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                {getGreeting()}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5, letterSpacing: -0.5 }}>
                {user?.firstName || 'Worker'}
              </Typography>
            </Box>
            <IconButton 
              onClick={handleRefresh}
              sx={{ 
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                '&:active': { transform: 'scale(0.95)' },
                transition: 'all 0.2s'
              }}
            >
              <RefreshIcon sx={{ color: 'text.primary', animation: isLoading ? 'spin 1s linear infinite' : 'none', ...spinKeyframes }} />
            </IconButton>
          </Box>

          {/* Futuristic Balance/Hero Card */}
          <Paper
            elevation={0}
            sx={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 4,
              p: 3,
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(135deg, rgba(250,204,21,0.1) 0%, rgba(20,20,20,1) 100%)'
                : 'linear-gradient(135deg, rgba(14,165,233,0.15) 0%, rgba(255,255,255,1) 100%)',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(250,204,21,0.2)' : 'rgba(14,165,233,0.3)',
              boxShadow: theme.palette.mode === 'dark' ? '0 12px 24px rgba(0,0,0,0.4)' : '0 12px 24px rgba(14,165,233,0.15)',
            }}
          >
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1 }}>
              Total Earnings
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: -1, mb: 2, color: 'text.primary' }}>
              GH?{(Number.isFinite(stats.earnings) ? stats.earnings : 0).toLocaleString()}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>Active Apps</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{stats.applications}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>Completed</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{stats.completedJobs}</Typography>
              </Box>
            </Box>
            {/* Decorative element */}
            <Box sx={{ 
              position: 'absolute', right: -20, top: -20, width: 120, height: 120, 
              borderRadius: '50%', background: theme.palette.mode === 'dark' ? 'rgba(250,204,21,0.15)' : 'rgba(14,165,233,0.15)',
              filter: 'blur(20px)', pointerEvents: 'none'
            }} />
          </Paper>

          {/* Quick Actions Scroll */}
          <Box sx={{ mx: -2, px: 2, overflowX: 'auto', display: 'flex', gap: 1.5, pb: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
            <Button
              variant="contained"
              onClick={() => navigate('/worker/find-work')}
              sx={{ borderRadius: 3, px: 3, py: 1.5, minWidth: 'max-content', fontWeight: 700, boxShadow: '0 8px 16px rgba(250,204,21,0.2)' }}
            >
              Find Work
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/worker/applications')}
              sx={{ borderRadius: 3, px: 3, py: 1.5, minWidth: 'max-content', fontWeight: 700, bgcolor: 'background.paper' }}
            >
              Applications
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/messages')}
              sx={{ borderRadius: 3, px: 3, py: 1.5, minWidth: 'max-content', fontWeight: 700, bgcolor: 'background.paper' }}
            >
              Messages
            </Button>
          </Box>

          {/* 2x2 Grid Stats */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Overview</Typography>
            <Grid container spacing={1.5}>
              {insightCards.map((item, i) => (
                <Grid item xs={6} key={item.title}>
                  <Fade in timeout={400 + (i * 100)}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        bgcolor: alpha(item.tone, 0.05),
                        border: '1px solid',
                        borderColor: alpha(item.tone, 0.15),
                        height: '100%'
                      }}
                    >
                      <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: alpha(item.tone, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5, color: item.tone }}>
                        {i === 0 && <AttachMoneyIcon fontSize="small" />}
                        {i === 1 && <AssignmentTurnedInIcon fontSize="small" />}
                        {i === 2 && <CheckCircleIcon fontSize="small" />}
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>{item.value}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, lineHeight: 1.2, display: 'block' }}>{item.title}</Typography>
                    </Paper>
                  </Fade>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Job Recommendations List Component */}
          {recommendations.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>For You</Typography>
                <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }} onClick={() => navigate('/jobs')}>See All</Typography>
              </Box>
              <Stack spacing={1.5}>
                {recommendations.slice(0, 3).map((job) => (
                  <Paper
                    key={job.id}
                    elevation={0}
                    onClick={() => navigate(\/jobs/\\)}
                    sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', gap: 1 }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{job.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{job.employer?.name || 'Employer'} • {job.location || 'Remote'}</Typography>
                    {job.budget && (
                      <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.5 }}>
                        {job.currency || 'GHS'} {typeof job.budget === 'object' ? \\-\\ : job.budget}
                      </Typography>
                    )}
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      ) : (\

const desktopContentStr = content.substring(renderStart);
// Replace the old render wrapper with our isMobile branch approach
// We need to inject our mobileUI right inside the main <Box> of the component

let finalRender = desktopContentStr.replace(
  /<Grow in timeout=\{500\}>\s*<Box>/,
  "<Grow in timeout={500}>\n<Box>\n" + mobileUI
);

// We need to close the ternary at the end of the file.
finalRender = finalRender.replace(
  /<\/Box>\s*<\/PullToRefresh>\s*\);\s*}\s*;\s*export default WorkerDashboardPage;/,
  "}\n</Box>\n</PullToRefresh>\n);\n};\nexport default WorkerDashboardPage;"
);

// Now we need to hide the top desktop part if it's mobile.
// Wait, the desktop part starts with {/* Minimal Top Bar */} 
// So we wrap the rest inside the  : ( 
const targetTop = '{/* Minimal Top Bar - Only shows last updated time */}';
finalRender = finalRender.replace(targetTop, '\n {/* DESKTOP VIEW STARTS HERE */}\n<Box sx={{ display: \'block\' }}>\n' + targetTop);

// Close the Box we just opened before the ternary closure
finalRender = finalRender.replace(
  /}\n<\/Box>\n<\/PullToRefresh>\n\);\n};\nexport default WorkerDashboardPage;/,
  "</Box>\n}\n</Box>\n</PullToRefresh>\n);\n};\nexport default WorkerDashboardPage;"
);

fs.writeFileSync(file, preamble + finalRender);
console.log('Worker updated');
