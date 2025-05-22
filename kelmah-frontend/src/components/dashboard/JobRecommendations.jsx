import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Chip,
    Button,
    Stack,
    IconButton,
    useTheme,
    alpha,
    Skeleton
} from '@mui/material';
import {
    Work,
    LocationOn,
    AttachMoney,
    Bookmark,
    BookmarkBorder,
    ArrowForward
} from '@mui/icons-material';

function JobRecommendations({ jobs = [], loading = false, onSaveJob, savedJobs = [] }) {
    const theme = useTheme();

    if (loading) {
        return (
            <Box>
                <Typography variant="h6" gutterBottom>
                    Recommended Jobs
                </Typography>
                {[1, 2, 3].map((i) => (
                    <Card key={i} sx={{ mb: 2 }}>
                        <CardContent>
                            <Skeleton variant="text" width="60%" height={28} />
                            <Skeleton variant="text" width="40%" height={20} />
                            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                <Skeleton variant="rectangular" width={80} height={24} />
                                <Skeleton variant="rectangular" width={80} height={24} />
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2
            }}>
                <Typography variant="h6">
                    Recommended Jobs
                </Typography>
                <Button
                    endIcon={<ArrowForward />}
                    sx={{ textTransform: 'none' }}
                >
                    View All
                </Button>
            </Box>

            <Stack spacing={2}>
                {jobs.map((job) => (
                    <Card 
                        key={job.id}
                        sx={{ 
                            '&:hover': { 
                                boxShadow: theme.shadows[4],
                                transform: 'translateY(-2px)',
                                transition: 'all 0.2s'
                            }
                        }}
                    >
                        <CardContent>
                            <Box sx={{ 
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start'
                            }}>
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        {job.title}
                                    </Typography>
                                    <Stack 
                                        direction="row" 
                                        spacing={2} 
                                        sx={{ mb: 2 }}
                                    >
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center',
                                            color: 'text.secondary'
                                        }}>
                                            <Work 
                                                fontSize="small" 
                                                sx={{ mr: 0.5 }}
                                            />
                                            {job.company}
                                        </Box>
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center',
                                            color: 'text.secondary'
                                        }}>
                                            <LocationOn 
                                                fontSize="small" 
                                                sx={{ mr: 0.5 }}
                                            />
                                            {job.location}
                                        </Box>
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center',
                                            color: 'success.main'
                                        }}>
                                            <AttachMoney 
                                                fontSize="small" 
                                                sx={{ mr: 0.5 }}
                                            />
                                            {job.budget}
                                        </Box>
                                    </Stack>
                                </Box>
                                <IconButton
                                    onClick={() => onSaveJob(job.id)}
                                    sx={{ 
                                        color: savedJobs.includes(job.id) 
                                            ? 'primary.main' 
                                            : 'text.secondary'
                                    }}
                                >
                                    {savedJobs.includes(job.id) ? (
                                        <Bookmark />
                                    ) : (
                                        <BookmarkBorder />
                                    )}
                                </IconButton>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography 
                                    variant="body2" 
                                    color="text.secondary"
                                    sx={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {job.description}
                                </Typography>
                            </Box>

                            <Box sx={{ 
                                display: 'flex',
                                gap: 1,
                                flexWrap: 'wrap'
                            }}>
                                {job.skills?.map((skill) => (
                                    <Chip
                                        key={skill}
                                        label={skill}
                                        size="small"
                                        sx={{
                                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                                            color: 'primary.main'
                                        }}
                                    />
                                ))}
                            </Box>

                            <Box sx={{ 
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mt: 2
                            }}>
                                <Typography 
                                    variant="caption" 
                                    color="text.secondary"
                                >
                                    Posted {job.timeAgo}
                                </Typography>
                                <Button
                                    variant="contained"
                                    size="small"
                                    sx={{ textTransform: 'none' }}
                                >
                                    Apply Now
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Stack>
        </Box>
    );
}

export default JobRecommendations;
