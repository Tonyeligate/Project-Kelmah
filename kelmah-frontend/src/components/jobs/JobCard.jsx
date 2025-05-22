import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    Box,
    Chip,
    Divider,
    Avatar,
    LinearProgress
} from '@mui/material';
import {
    LocationOn,
    AttachMoney,
    Work,
    Schedule,
    Person,
    BusinessCenter,
    ArrowForward as ArrowForwardIcon,
    BookmarkBorder as BookmarkIcon,
    Verified as VerifiedIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

function JobCard({ job }) {
    const navigate = useNavigate();

    const handleViewDetails = () => {
        navigate(`/jobs/${job.id}`);
    };

    // Calculate progress for proposals if available
    const proposalProgress = job.proposals_count && job.proposals_limit 
        ? Math.min(100, (job.proposals_count / job.proposals_limit) * 100)
        : null;

    // Determine status color
    const getStatusColor = () => {
        if (job.status === 'open' || job.status === 'active') return 'success';
        if (job.status === 'pending') return 'warning';
        if (job.status === 'closed' || job.status === 'completed') return 'info';
        return 'default';
    };

    return (
        <Card 
            elevation={2}
            sx={{
                position: 'relative',
                overflow: 'visible',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: (theme) => theme.shadows[8]
                }
            }}
        >
            {/* Status badge */}
            {job.status && (
                <Chip 
                    label={job.status}
                    color={getStatusColor()}
                    size="small"
                    sx={{ 
                        position: 'absolute', 
                        top: 12, 
                        right: 12, 
                        textTransform: 'capitalize',
                        fontWeight: 600
                    }}
                />
            )}

            {/* Verified badge if job is from a verified hirer */}
            {job.hirer_verified && (
                <Box 
                    sx={{ 
                        position: 'absolute', 
                        top: -10, 
                        left: 16, 
                        bgcolor: 'primary.main', 
                        color: 'white',
                        borderRadius: '50%',
                        p: 0.5,
                        display: 'flex',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}
                >
                    <VerifiedIcon fontSize="small" />
                </Box>
            )}

            <CardContent sx={{ pt: 3 }}>
                {/* Hirer info */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                        src={job.hirer_avatar} 
                        alt={job.hirer_name}
                        sx={{ width: 36, height: 36, mr: 1.5 }}
                    >
                        {job.hirer_name?.charAt(0)}
                    </Avatar>
                    <Box>
                        <Typography variant="body2" fontWeight={500}>
                            {job.hirer_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {job.hirer_company || 'Independent'}
                        </Typography>
                    </Box>
                    <Box sx={{ ml: 'auto' }}>
                        <Chip 
                            label={job.job_type}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ textTransform: 'capitalize' }}
                        />
                    </Box>
                </Box>

                {/* Job title */}
                <Typography 
                    variant="h6" 
                    component="h2" 
                    color="text.primary" 
                    fontWeight={600}
                    sx={{ mb: 1.5 }}
                >
                    {job.title}
                </Typography>

                {/* Job description */}
                <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                        mb: 2.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.5
                    }}
                >
                    {job.description}
                </Typography>

                {/* Job Skills/Tags */}
                {job.skills && job.skills.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2.5 }}>
                        {job.skills.slice(0, 5).map((skill, index) => (
                            <Chip 
                                key={index}
                                label={skill}
                                size="small"
                                variant="outlined"
                                sx={{ 
                                    borderRadius: '4px', 
                                    height: 24, 
                                    fontSize: '0.7rem'
                                }}
                            />
                        ))}
                        {job.skills.length > 5 && (
                            <Chip 
                                label={`+${job.skills.length - 5}`}
                                size="small"
                                sx={{ 
                                    borderRadius: '4px', 
                                    height: 24, 
                                    fontSize: '0.7rem'
                                }}
                            />
                        )}
                    </Box>
                )}

                {/* Job details */}
                <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: 2,
                    mb: 2
                }}>
                    {job.location && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <LocationOn fontSize="small" color="action" sx={{ opacity: 0.8 }} />
                            <Typography variant="body2" color="text.secondary" noWrap>
                                {job.location}
                            </Typography>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <AttachMoney fontSize="small" color="action" sx={{ opacity: 0.8 }} />
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                            {typeof job.budget === 'number' 
                                ? `$${job.budget.toLocaleString()}`
                                : 'Budget not specified'
                            }
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Work fontSize="small" color="action" sx={{ opacity: 0.8 }} />
                        <Typography variant="body2" color="text.secondary" noWrap>
                            {job.profession}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <BusinessCenter fontSize="small" color="action" sx={{ opacity: 0.8 }} />
                        <Typography variant="body2" color="text.secondary" noWrap>
                            {job.experience_level || 'Any experience'}
                        </Typography>
                    </Box>
                </Box>

                {/* Proposal progress */}
                {proposalProgress !== null && (
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                                Proposals
                            </Typography>
                            <Typography variant="caption" fontWeight={500}>
                                {job.proposals_count} / {job.proposals_limit}
                            </Typography>
                        </Box>
                        <LinearProgress 
                            variant="determinate" 
                            value={proposalProgress} 
                            sx={{ height: 6, borderRadius: 3 }}
                            color={proposalProgress > 75 ? "error" : "primary"}
                        />
                    </Box>
                )}

                {/* Post date */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Schedule fontSize="small" color="action" sx={{ opacity: 0.8 }} />
                    <Typography variant="body2" color="text.secondary">
                        Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                    </Typography>
                </Box>
            </CardContent>

            <Divider />

            <CardActions sx={{ justifyContent: 'space-between', p: 1.5 }}>
                <Button
                    startIcon={<BookmarkIcon />}
                    size="small"
                    color="primary"
                    sx={{ 
                        borderRadius: 4,
                        minWidth: 0,
                        px: 1
                    }}
                >
                    Save
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleViewDetails}
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    sx={{ 
                        borderRadius: 4,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                >
                    View Details
                </Button>
            </CardActions>
        </Card>
    );
}

export default JobCard;