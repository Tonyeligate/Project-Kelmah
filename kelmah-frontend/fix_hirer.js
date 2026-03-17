const fs = require('fs');
const file = './src/modules/hirer/pages/HirerDashboardPage.jsx';
let content = fs.readFileSync(file, 'utf8');

const targetOpen = '<Grow in timeout={500}>\n      <Box>';
const targetClose = '      </Box>\n    </Grow>\n    </PullToRefresh>\n  );\n};\n\nexport default HirerDashboardPage;';

let finalRender = content;

// Ensure isMobile exists
if (!finalRender.includes('const isMobile = useMediaQuery(')) {
  finalRender = finalRender.replace(
    'return (',
    \const isMobile = useMediaQuery(theme.breakpoints.down('md'));\n  return (\
  );
}

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
                  {user?.firstName || 'Hirer'}
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
                <RefreshIcon sx={{ color: 'text.primary', animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              </IconButton>
            </Box>

            {/* Futuristic Hero Card */}
            <Paper
              elevation={0}
              sx={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 4,
                p: 3,
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(135deg, rgba(250,204,21,0.1) 0%, rgba(20,20,20,1) 100%)'
                  : 'linear-gradient(135deg, rgba(250,204,21,0.15) 0%, rgba(255,255,255,1) 100%)',
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark' ? 'rgba(250,204,21,0.2)' : 'rgba(250,204,21,0.4)',
                boxShadow: theme.palette.mode === 'dark' ? '0 12px 24px rgba(0,0,0,0.4)' : '0 12px 24px rgba(250,204,21,0.15)',
              }}
            >
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1 }}>
                Total Spent
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: -1, mb: 2, color: 'text.primary' }}>
                GH?{(summaryData.totalSpent || 0).toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>Active Apps</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{summaryData.pendingProposals}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>Active Jobs</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{summaryData.activeJobs}</Typography>
                </Box>
              </Box>
              {/* Decorative element */}
              <Box sx={{ 
                position: 'absolute', right: -20, top: -20, width: 120, height: 120, 
                borderRadius: '50%', background: theme.palette.mode === 'dark' ? 'rgba(250,204,21,0.15)' : 'rgba(250,204,21,0.2)',
                filter: 'blur(20px)', pointerEvents: 'none'
              }} />
            </Paper>

            {/* Quick Actions Scroll */}
            <Box sx={{ mx: -2, px: 2, overflowX: 'auto', display: 'flex', gap: 1.5, pb: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
              <Button
                variant="contained"
                onClick={() => navigate('/hirer/jobs/create')}
                sx={{ borderRadius: 3, px: 3, py: 1.5, minWidth: 'max-content', fontWeight: 700, boxShadow: '0 8px 16px rgba(250,204,21,0.2)' }}
              >
                Post Job
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/hirer/talents')}
                sx={{ borderRadius: 3, px: 3, py: 1.5, minWidth: 'max-content', fontWeight: 700, bgcolor: 'background.paper' }}
              >
                Find Talent
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
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.warning.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.warning.main, 0.15), height: '100%' }} elevation={0}>
                    <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5, color: theme.palette.warning.main }}>
                      <WorkIcon fontSize="small" />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>{summaryData.activeJobs}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Active Jobs</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.info.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.info.main, 0.15), height: '100%' }} elevation={0}>
                    <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5, color: theme.palette.info.main }}>
                      <AssignmentTurnedInIcon fontSize="small" />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>{summaryData.pendingProposals}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Applications</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.15), height: '100%' }} elevation={0}>
                    <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5, color: theme.palette.success.main }}>
                      <CheckCircleIcon fontSize="small" />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>{summaryData.completedJobs}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Completed</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.15), height: '100%' }} elevation={0}>
                    <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5, color: theme.palette.primary.main }}>
                      <AttachMoneyIcon fontSize="small" />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>GH?{(summaryData.totalSpent || 0).toLocaleString()}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Total Spent</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
            
            {/* Active Jobs List Concept */}
            {activeJobs && activeJobs.length > 0 && (
               <Box sx={{ mt: 1 }}>
                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                   <Typography variant="h6" sx={{ fontWeight: 800 }}>Manage Jobs</Typography>
                   <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }} onClick={() => navigate('/hirer/jobs')}>See All</Typography>
                 </Box>
                 <Stack spacing={1.5}>
                   {activeJobs.slice(0, 3).map((job) => (
                     <Paper
                       key={job.id}
                       elevation={0}
                       onClick={() => navigate(\/hirer/jobs/\\)}
                       sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', gap: 1 }}
                     >
                       <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                         <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{job.title}</Typography>
                         <Chip size="small" label="Active" color="warning" sx={{ height: 20, fontSize: '0.65rem' }} />
                       </Box>
                       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                         <Typography variant="caption" color="text.secondary">{job.proposals?.length || 0} Proposals</Typography>
                         <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                           {job.currency || 'GHS'} {typeof job.budget === 'object' ? \\-\\ : job.budget}
                         </Typography>
                       </Box>
                     </Paper>
                   ))}
                 </Stack>
               </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ display: 'block' }}>
\;

finalRender = finalRender.replace(
  targetOpen,
  targetOpen + '\n' + mobileUI
);

// Close the ternary that we introduced just before the final </Box>
const replaceEnd = '          </Box>\n        )}';
finalRender = finalRender.replace(
  targetClose,
  replaceEnd + '\n' + targetClose
);

fs.writeFileSync(file, finalRender);
console.log('Hirer updated');
