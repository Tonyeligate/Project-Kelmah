import React from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Typography,
  CardActionArea,
} from '@mui/material';
import {
  Bookmark as BookmarkFilledIcon,
  BookmarkBorder,
  FlashOn as FlashOnIcon,
  LocalFireDepartment as FireIcon,
  LocationOn,
  MonetizationOn,
  Share,
  Star,
  Verified,
  Visibility,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import {
  resolveJobVisualUrl,
  resolveMediaAssetUrl,
  resolveMediaAssetUrls,
  resolveProfileImageUrl,
} from '../../common/utils/mediaAssets';

const getJobHeroImage = (job = {}) => resolveJobVisualUrl(job);

const getJobVisuals = (job = {}) =>
  resolveMediaAssetUrls(
    job?.coverImage,
    job?.coverImageMetadata,
    job?.images,
    job?.attachments,
    job?.media,
    job?.gallery,
  );

const getEmployerAvatar = (job = {}) =>
  resolveMediaAssetUrl([
    job?.employer?.logo,
    job?.employer?.avatar,
    job?.employer?.image,
    resolveProfileImageUrl(job?.hirer || {}),
  ]);

function JobsCardsGrid({
  uniqueJobs,
  isSmallMobile,
  motionProps,
  navigate,
  handlePrimaryJobAction,
  isHirerUser,
  handleToggleBookmark,
  savedJobIds,
  theme,
  getCategoryIcon,
}) {
  return (
    <Grid container spacing={{ xs: 1.25, sm: 3 }}>
      {uniqueJobs.map((job, index) => {
        const jobHeroImage = getJobHeroImage(job);
        const jobVisuals = getJobVisuals(job);
        const employerAvatar = getEmployerAvatar(job);
        const jobId = job._id || job.id;
        const isSaved = savedJobIds.has(job.id || job._id);
        const isUrgentJob = Boolean(job.urgent || job.proposalCount > 10);

        return (
          <Grid
            item
            xs={12}
            sm={6}
            md={6}
            lg={4}
            xl={3}
            key={job.id || job._id}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index < 8 ? index * 0.1 : 0 }}
              whileHover={{ scale: isSmallMobile ? 1 : 1.02 }}
              {...motionProps}
            >
              <Card
                component={CardActionArea}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: 'var(--k-bg-surface)',
                  border: '1px solid var(--k-accent-border)',
                  borderRadius: { xs: 2.5, sm: 2 },
                  minHeight: { xs: 'auto', sm: '320px' },
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  mx: 0,
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background:
                      'linear-gradient(90deg, var(--k-gold-dark), var(--k-gold))',
                    transform: 'scaleX(0)',
                    transformOrigin: 'left',
                    transition: 'transform 0.3s ease',
                  },
                  '&:hover': {
                    border: '1px solid var(--k-gold)',
                    boxShadow: '0 12px 40px rgba(212,175,55,0.4)',
                    transform: { xs: 'none', sm: 'translateY(-4px)' },
                    '&::before': {
                      transform: 'scaleX(1)',
                    },
                  },
                  '&:active': {
                    transform: {
                      xs: 'scale(0.98)',
                      sm: 'translateY(-4px)',
                    },
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onClick={() => navigate(`/jobs/${jobId}`)}
                aria-label={`Job posting: ${job.title}`}
              >
                <Box
                  sx={{
                    position: 'relative',
                    height: { xs: 122, sm: 148 },
                    background: jobHeroImage
                      ? `linear-gradient(180deg, rgba(15,23,42,0.18) 0%, rgba(15,23,42,0.72) 100%), url(${jobHeroImage})`
                      : 'linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(15,118,110,0.35) 100%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'flex-end',
                    p: { xs: 1.2, sm: 2 },
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: { xs: 8, sm: 12 },
                      left: { xs: 8, sm: 12 },
                      right: { xs: 8, sm: 12 },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                    }}
                  >
                    <Chip
                      label={job.category || 'Trade job'}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.92)',
                        color: '#111827',
                        fontWeight: 700,
                        border: '1px solid rgba(15,23,42,0.08)',
                        boxShadow: '0 6px 16px rgba(15,23,42,0.16)',
                        height: { xs: 22, sm: 24 },
                        '& .MuiChip-label': {
                          px: 0.9,
                          fontSize: { xs: '0.64rem', sm: '0.72rem' },
                          color: '#111827',
                          fontWeight: 800,
                        },
                      }}
                    />
                    {jobVisuals.length > 1 && (
                      <Chip
                        label={`${jobVisuals.length} visuals`}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(15,23,42,0.74)',
                          color: 'white',
                          fontWeight: 700,
                        }}
                      />
                    )}
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      bgcolor: 'rgba(15,23,42,0.64)',
                      color: 'white',
                      px: { xs: 0.9, sm: 1.25 },
                      py: { xs: 0.45, sm: 0.75 },
                      borderRadius: 2,
                      maxWidth: '100%',
                    }}
                  >
                    {React.createElement(getCategoryIcon(job.category), {
                      sx: { color: 'var(--k-gold)', fontSize: 18 },
                    })}
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        letterSpacing: 0.15,
                        fontSize: { xs: '0.64rem', sm: '0.74rem' },
                      }}
                    >
                      {jobHeroImage
                        ? 'Image-backed job brief ready for quick review'
                        : 'Clear trade context helps workers decide faster'}
                    </Typography>
                  </Box>
                </Box>
                <CardContent sx={{ flexGrow: 1, p: { xs: 1.5, sm: 3 } }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: { xs: 1.2, sm: 2 },
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: { xs: 0.75, sm: 0 },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flex: 1,
                      }}
                    >
                      {React.createElement(getCategoryIcon(job.category), {
                        sx: {
                          mr: 1,
                          color: 'var(--k-gold)',
                          fontSize: { xs: 20, sm: 24 },
                        },
                      })}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="h6"
                          component="h2"
                          sx={{
                            color: 'text.primary',
                            fontWeight: 'bold',
                            fontSize: {
                              xs: '1rem',
                              sm: '1.1rem',
                              md: '1.25rem',
                            },
                            lineHeight: { xs: 1.3, sm: 1.4 },
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: { xs: 2, sm: 1 },
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {job.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            fontSize: { xs: '0.875rem', sm: '0.875rem' },
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          {employerAvatar && (
                            <Avatar
                              src={employerAvatar}
                              alt={job.employer.name}
                              sx={{
                                width: 16,
                                height: 16,
                                mr: 0.5,
                              }}
                            />
                          )}
                          {job.employer?.name || 'Employer Name Pending'}
                          {job.employer?.verified && (
                            <Verified
                              sx={{
                                fontSize: 12,
                                color: 'success.main',
                                ml: 0.5,
                              }}
                            />
                          )}
                        </Typography>
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'end',
                        gap: 0.5,
                      }}
                    >
                      {isUrgentJob && (
                        <Tooltip
                          title={
                            job.urgent
                              ? 'This job needs immediate attention'
                              : 'High competition - many applicants'
                          }
                          arrow
                          placement="left"
                        >
                          <Chip
                            label={job.urgent ? 'URGENT' : 'HOT'}
                            size="small"
                            icon={
                              job.urgent ? (
                                <FlashOnIcon sx={{ fontSize: 16 }} />
                              ) : (
                                <FireIcon sx={{ fontSize: 16 }} />
                              )
                            }
                            sx={{
                              bgcolor: job.urgent ? '#ff4444' : 'warning.main',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.7rem',
                              animation: 'pulse 2s infinite',
                              '@keyframes pulse': {
                                '0%, 100%': { opacity: 1 },
                                '50%': { opacity: 0.7 },
                              },
                              '@media (prefers-reduced-motion: reduce)': {
                                animation: 'none',
                              },
                              cursor: 'help',
                            }}
                          />
                        </Tooltip>
                      )}
                      {job.verified && (
                        <Tooltip
                          title="This employer has been verified by Kelmah"
                          arrow
                          placement="left"
                        >
                          <Chip
                            icon={<Verified sx={{ fontSize: 14 }} />}
                            label="Verified"
                            size="small"
                            sx={{
                              bgcolor: 'rgba(76,175,80,0.2)',
                              color: 'success.main',
                              border: `1px solid ${theme.palette.success.main}`,
                              fontSize: '0.7rem',
                              cursor: 'help',
                            }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: { xs: 'grid', sm: 'none' },
                      gridTemplateColumns: '1fr',
                      gap: 0.75,
                      mb: 1.5,
                      pl: 0.25,
                      borderLeft: '2px solid var(--k-gold)',
                    }}
                  >
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
                    >
                      <MonetizationOn
                        fontSize="small"
                        sx={{ color: 'var(--k-gold)', width: 18, height: 18 }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'var(--k-gold)',
                          fontWeight: 800,
                          fontSize: '0.92rem',
                        }}
                      >
                        {job?.budget
                          ? typeof job?.budget === 'object'
                            ? job.budget.min === job.budget.max ||
                              !job.budget.max
                              ? `GHc ${(job.budget.amount || job.budget.min)?.toLocaleString()}`
                              : `GHc ${job.budget.min?.toLocaleString()} - ${job.budget.max?.toLocaleString()}`
                            : `GHc ${job?.budget?.toLocaleString()}`
                          : 'Negotiable pay'}
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
                    >
                      <LocationOn
                        fontSize="small"
                        sx={{ color: 'text.secondary', width: 18, height: 18 }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ color: 'text.primary', fontSize: '0.84rem' }}
                      >
                        {job.location?.city
                          ? `${job.location.city}${job.location.country ? ', ' + job.location.country : ''}`
                          : typeof job.location === 'string'
                            ? job.location
                            : 'Remote/Flexible'}
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
                    >
                      <FireIcon
                        fontSize="small"
                        sx={{
                          color: isUrgentJob ? '#ff6b6b' : 'text.disabled',
                          width: 18,
                          height: 18,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: isUrgentJob ? '#ff6b6b' : 'text.secondary',
                          fontSize: '0.82rem',
                          fontWeight: isUrgentJob ? 700 : 500,
                        }}
                      >
                        {isUrgentJob
                          ? 'Urgency: High demand now'
                          : 'Urgency: Standard timeline'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2, display: { xs: 'none', sm: 'block' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationOn
                        fontSize="small"
                        sx={{ mr: 1, color: 'var(--k-gold)' }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.primary',
                          fontSize: { xs: '0.8rem', sm: '0.875rem' },
                        }}
                      >
                        {job.location?.city
                          ? `${job.location.city}${job.location.country ? ', ' + job.location.country : ''}`
                          : typeof job.location === 'string'
                            ? job.location
                            : 'Remote/Flexible'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <MonetizationOn
                        fontSize="small"
                        sx={{ mr: 1, color: 'var(--k-gold)' }}
                      />
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        sx={{
                          color: 'var(--k-gold)',
                          fontSize: { xs: '0.875rem', sm: '0.95rem' },
                        }}
                      >
                        {job?.budget
                          ? typeof job?.budget === 'object'
                            ? job.budget.min === job.budget.max ||
                              !job.budget.max
                              ? `GHc ${(job.budget.amount || job.budget.min)?.toLocaleString()}`
                              : `GHc ${job.budget.min?.toLocaleString()} - ${job.budget.max?.toLocaleString()}`
                            : `GHc ${job?.budget?.toLocaleString()}`
                          : 'Negotiable'}
                      </Typography>
                      <Chip
                        label={job.paymentType || 'Fixed'}
                        size="small"
                        sx={{
                          ml: 1,
                          bgcolor: 'var(--k-accent-soft-strong)',
                          color: 'var(--k-gold)',
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Star
                        fontSize="small"
                        sx={{ mr: 1, color: 'var(--k-gold)' }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ color: 'text.primary' }}
                      >
                        {job.rating ? `${job.rating} Rating` : 'New Listing'} .{' '}
                        {job.proposalCount || 0} Applicants
                      </Typography>
                    </Box>
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      mb: 2,
                      color: 'text.secondary',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.5,
                      fontSize: { xs: '0.85rem', sm: '0.875rem' },
                    }}
                  >
                    {job.description}
                  </Typography>

                  {Array.isArray(job.skills) && job.skills.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 1,
                          color: 'var(--k-gold)',
                          fontWeight: 'bold',
                        }}
                      >
                        Required Skills:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(job.skills || []).slice(0, 3).map((skill) => (
                          <Chip
                            key={skill}
                            label={skill}
                            size="small"
                            sx={{
                              bgcolor: 'action.hover',
                              color: 'text.primary',
                              fontSize: { xs: '0.8rem', sm: '0.75rem' },
                            }}
                          />
                        ))}
                        {job.skills.length > 3 && (
                          <Chip
                            label={`+${job.skills.length - 3} more`}
                            size="small"
                            sx={{
                              bgcolor: 'var(--k-accent-soft-strong)',
                              color: 'var(--k-gold)',
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      size="small"
                      label={
                        job.postedDate
                          ? (() => {
                              try {
                                return `Posted ${formatDistanceToNow(new Date(job.postedDate), { addSuffix: true })}`;
                              } catch {
                                return 'Recently posted';
                              }
                            })()
                          : 'Recently posted'
                      }
                      sx={{ bgcolor: 'action.hover', color: 'text.secondary' }}
                    />
                    <Chip
                      size="small"
                      label={
                        job.deadline
                          ? (() => {
                              try {
                                return `Apply by ${format(new Date(job.deadline), 'MMM dd')}`;
                              } catch {
                                return 'Applications open';
                              }
                            })()
                          : 'Applications open'
                      }
                      sx={{
                        bgcolor: 'rgba(244,67,54,0.08)',
                        color: 'var(--k-danger-text)',
                      }}
                    />
                  </Box>
                </CardContent>

                <CardActions
                  sx={{
                    p: { xs: 2, sm: 3 },
                    pt: 0,
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: 1,
                  }}
                >
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrimaryJobAction(jobId);
                    }}
                    sx={{
                      bgcolor: 'var(--k-gold)',
                      color: 'var(--k-text-on-accent)',
                      fontWeight: 'bold',
                      fontSize: { xs: '1rem', sm: '0.875rem' },
                      padding: { xs: '10px 16px', sm: '8px 16px' },
                      minHeight: { xs: '44px', sm: '40px' },
                      '&:hover': {
                        bgcolor: 'var(--k-gold-dark)',
                      },
                      '&:active': {
                        transform: 'scale(0.98)',
                      },
                    }}
                  >
                    {isHirerUser ? 'Find Talent' : 'Apply Now'}
                  </Button>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: { xs: 1.5, md: 1 },
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: { xs: 'wrap', md: 'nowrap' },
                    }}
                  >
                    <Button
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/jobs/${jobId}`);
                      }}
                      startIcon={<Visibility />}
                      aria-label={`View details for ${job.title || 'job'}`}
                      sx={{
                        flex: 1,
                        minHeight: 44,
                        minWidth: { xs: '100%', md: 0 },
                      }}
                    >
                      Details
                    </Button>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleBookmark(job.id || job._id);
                      }}
                      aria-label={isSaved ? 'Remove saved job' : 'Save job'}
                      sx={{
                        color: isSaved ? 'secondary.main' : 'secondary.dark',
                        minWidth: 44,
                        minHeight: 44,
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:focus-visible': {
                          outline: '3px solid var(--k-gold)',
                          outlineOffset: '2px',
                        },
                      }}
                    >
                      {isSaved ? <BookmarkFilledIcon /> : <BookmarkBorder />}
                    </IconButton>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        if (navigator.share) {
                          navigator
                            .share({
                              title: job.title,
                              text: `Check out this job opportunity: ${job.title} at ${job.employer?.name || 'Kelmah'}`,
                              url: window.location.origin + `/jobs/${jobId}`,
                            })
                            .catch(() => {});
                        } else {
                          navigator.clipboard
                            .writeText(
                              `${window.location.origin}/jobs/${jobId}`,
                            )
                            .catch(() => {});
                        }
                      }}
                      aria-label="Share job"
                      sx={{
                        color: 'var(--k-gold)',
                        minWidth: 44,
                        minHeight: 44,
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:focus-visible': {
                          outline: '3px solid var(--k-gold)',
                          outlineOffset: '2px',
                        },
                      }}
                    >
                      <Share />
                    </IconButton>
                  </Box>
                </CardActions>
              </Card>
            </motion.div>
          </Grid>
        );
      })}
    </Grid>
  );
}

export default JobsCardsGrid;
