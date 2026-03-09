import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActionArea,
  Button,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Rating,
  Divider,
  useTheme,
  useMediaQuery,
  Skeleton,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Badge,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Message,
  InboxOutlined,
  TipsAndUpdates,
  ArrowForward,
  Badge as BadgeIcon,
  Work,
  OpenInNew,
  AttachMoney,
  Schedule,
  FilterList,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import { hirerService } from '../services/hirerService';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { messagingService } from '../../messaging/services/messagingService';
import { fetchHirerJobs } from '../services/hirerSlice';
import { useSnackbar } from 'notistack';

/* ─── helpers ─────────────────────────────────────────────────────── */

const normalizeApplication = (raw, jobIdFallback, jobTitleFallback) => {
  const worker = raw?.worker || {};
  const workerName =
    raw?.workerName ||
    worker?.name ||
    [worker?.firstName, worker?.lastName].filter(Boolean).join(' ').trim() ||
    'Worker';

  return {
    ...raw,
    id: raw?.id || raw?._id,
    jobId:
      raw?.jobId ||
      raw?.job?._id ||
      raw?.job?.id ||
      (typeof raw?.job === 'string' ? raw?.job : undefined) ||
      jobIdFallback,
    jobTitle: raw?.jobTitle || raw?.job?.title || jobTitleFallback || 'Unknown Job',
    workerId: raw?.workerId || worker?.id || worker?._id,
    workerName,
    workerAvatar: raw?.workerAvatar || worker?.avatar || worker?.profileImage,
    workerRating:
      raw?.workerRating != null || worker?.rating != null
        ? Number(raw?.workerRating ?? worker?.rating)
        : null,
    coverLetter: raw?.coverLetter || raw?.coverLetterPreview || '',
    proposedRate: raw?.proposedRate ?? raw?.bidAmount ?? null,
    estimatedDuration: raw?.estimatedDuration ?? null,
  };
};

const STATUS_COLORS = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'error',
};

const isBiddingJob = (job) => Boolean(job?.bidding?.bidStatus);

/* ─── ApplicationCard ─────────────────────────────────────────────── */

const ApplicationCard = ({ application, isSelected, onSelect, showJobTitle }) => {
  const theme = useTheme();
  return (
    <Card
      elevation={isSelected ? 3 : 0}
      sx={{
        mb: 1.5,
        borderLeft: isSelected
          ? `4px solid ${theme.palette.primary.main}`
          : '4px solid transparent',
        backgroundColor: isSelected
          ? alpha(theme.palette.primary.main, 0.08)
          : theme.palette.background.paper,
        transition: 'all 0.15s ease',
        '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.04) },
      }}
    >
      <CardActionArea
        onClick={() => onSelect(application)}
        aria-label={`Application from ${application.workerName}`}
        sx={{
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
        }}
      >
        <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              src={application.workerAvatar}
              alt={application.workerName || 'Applicant'}
              sx={{ width: 40, height: 40 }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap fontWeight={600}>
                {application.workerName}
              </Typography>
              {application.workerRating !== null ? (
                <Rating value={application.workerRating} precision={0.5} readOnly size="small" />
              ) : (
                <Typography variant="caption" color="text.disabled">
                  No reviews yet
                </Typography>
              )}
            </Box>
            <Chip
              size="small"
              label={application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
              color={STATUS_COLORS[application.status] || 'default'}
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 22 }}
            />
          </Box>
          {showJobTitle && (
            <Typography
              variant="caption"
              color="primary.main"
              noWrap
              sx={{ display: 'block', mt: 0.5, fontWeight: 500 }}
            >
              {application.jobTitle}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.5 }}>
            {application.coverLetter}
          </Typography>
          {application.proposedRate != null && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.3 }}
            >
              <AttachMoney sx={{ fontSize: 14 }} /> GH₵{application.proposedRate}
              {application.estimatedDuration && (
                <>
                  {' '}&middot;{' '}
                  <Schedule sx={{ fontSize: 14, ml: 0.5 }} /> {application.estimatedDuration}
                </>
              )}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

/* ─── JobListItem ─────────────────────────────────────────────────── */

const JobListItem = ({ job, isSelected, onClick, appCount }) => {
  const theme = useTheme();
  return (
    <ListItemButton
      selected={isSelected}
      onClick={onClick}
      sx={{
        borderRadius: 1.5,
        mb: 0.5,
        py: 1,
        px: 1.5,
        borderLeft: isSelected
          ? `3px solid ${theme.palette.primary.main}`
          : '3px solid transparent',
        '&.Mui-selected': {
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 36 }}>
        <Badge badgeContent={appCount} color="primary" max={99} showZero>
          <Work
            fontSize="small"
            sx={{ color: isSelected ? 'primary.main' : 'text.secondary' }}
          />
        </Badge>
      </ListItemIcon>
      <ListItemText
        primary={job.title}
        primaryTypographyProps={{
          variant: 'body2',
          fontWeight: isSelected ? 600 : 400,
          noWrap: true,
        }}
        secondary={
          job.status
            ? `${job.status.charAt(0).toUpperCase() + job.status.slice(1)} • GH₵${job.budget || job.budgetRange?.min || '—'}`
            : undefined
        }
        secondaryTypographyProps={{ variant: 'caption', noWrap: true }}
      />
    </ListItemButton>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════════ */

function ApplicationManagementPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlJobId = searchParams.get('jobId');

  // Redux: hirer jobs
  const jobsByStatus = useSelector((state) => state.hirer?.jobs);

  useEffect(() => {
    if (!jobsByStatus || Object.keys(jobsByStatus).length === 0) {
      dispatch(fetchHirerJobs('all'));
    }
  }, [dispatch, jobsByStatus]);

  // Flat deduplicated job list
  const dedupedJobs = useMemo(() => {
    const all = Object.values(jobsByStatus || {}).flatMap((v) =>
      Array.isArray(v) ? v : [],
    );
    const seen = new Set();
    return all.filter((j) => {
      const id = j?.id || j?._id;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [jobsByStatus]);

  // This screen is for application-based jobs only.
  const allJobs = useMemo(
    () => dedupedJobs.filter((job) => !isBiddingJob(job)),
    [dedupedJobs],
  );

  const biddingJobsCount = useMemo(
    () => dedupedJobs.filter((job) => isBiddingJob(job)).length,
    [dedupedJobs],
  );

  // ── State ──────────────────────────────────────────────────────
  const [selectedJobId, setSelectedJobId] = useState(urlJobId || null);
  const [activeTab, setActiveTab] = useState('pending');
  const [applicationsByJob, setApplicationsByJob] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [updating, setUpdating] = useState(false);
  const [actionType, setActionType] = useState('');
  const [showJobList, setShowJobList] = useState(!isMobile);

  // Sync URL param and redirect bid-based jobs to the bid review screen.
  useEffect(() => {
    if (!urlJobId) return;

    const matchingJob = dedupedJobs.find((job) => (job.id || job._id) === urlJobId);
    if (matchingJob && isBiddingJob(matchingJob)) {
      navigate(`/hirer/jobs/${urlJobId}/bids`, { replace: true });
      return;
    }

    if (urlJobId !== selectedJobId) {
      setSelectedJobId(urlJobId);
    }
  }, [dedupedJobs, navigate, selectedJobId, urlJobId]);

  // ── Fetch all jobs' applications on mount ──────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setInitialLoading(true);
      if (allJobs.length === 0) {
        setInitialLoading(false);
        return;
      }

      const results = await Promise.allSettled(
        allJobs.map(async (job) => {
          const jobId = job.id || job._id;
          const list = await hirerService.getJobApplications(jobId);
          return {
            jobId,
            apps: (Array.isArray(list) ? list : []).map((app) =>
              normalizeApplication(app, jobId, job.title),
            ),
          };
        }),
      );

      if (cancelled) return;

      const newMap = {};
      results.forEach((r) => {
        if (r.status === 'fulfilled') {
          newMap[r.value.jobId] = r.value.apps;
        }
      });
      setApplicationsByJob(newMap);

      // Auto-select first job with applications if none specified in URL
      if (!urlJobId) {
        const firstWithApps = allJobs.find((j) => {
          const jid = j.id || j._id;
          return (newMap[jid] || []).length > 0;
        });
        if (firstWithApps) {
          const fid = firstWithApps.id || firstWithApps._id;
          setSelectedJobId(fid);
        }
      }
      setInitialLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [allJobs, urlJobId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived data ───────────────────────────────────────────────
  const selectedJob = useMemo(
    () => allJobs.find((j) => (j.id || j._id) === selectedJobId) || null,
    [allJobs, selectedJobId],
  );

  const currentJobApps = useMemo(
    () => (selectedJobId ? applicationsByJob[selectedJobId] || [] : []),
    [applicationsByJob, selectedJobId],
  );

  // In "All Jobs" mode we show every app across all jobs
  const allAppsFlat = useMemo(
    () =>
      !selectedJobId
        ? Object.values(applicationsByJob).flat()
        : [],
    [applicationsByJob, selectedJobId],
  );

  const appsToFilter = selectedJobId ? currentJobApps : allAppsFlat;

  const filteredApps = useMemo(
    () => appsToFilter.filter((app) => app.status === activeTab),
    [appsToFilter, activeTab],
  );

  const tabCounts = useMemo(
    () => ({
      pending: appsToFilter.filter((a) => a.status === 'pending').length,
      accepted: appsToFilter.filter((a) => a.status === 'accepted').length,
      rejected: appsToFilter.filter((a) => a.status === 'rejected').length,
    }),
    [appsToFilter],
  );

  const totalAppCounts = useMemo(() => {
    const counts = {};
    for (const [jobId, apps] of Object.entries(applicationsByJob)) {
      counts[jobId] = apps.length;
    }
    return counts;
  }, [applicationsByJob]);

  // Auto-select first filtered app when job or tab changes
  useEffect(() => {
    if (!initialLoading) {
      setSelectedApplication(filteredApps.length > 0 ? filteredApps[0] : null);
    }
  }, [filteredApps, initialLoading]);

  // ── Handlers ───────────────────────────────────────────────────
  const handleSelectJob = (jobId) => {
    setSelectedJobId(jobId);
    setActiveTab('pending');
    setSelectedApplication(null);
    if (jobId) {
      setSearchParams({ jobId });
    } else {
      setSearchParams({});
    }
    if (isMobile) setShowJobList(false);
  };

  const handleStatusUpdate = async () => {
    if (!selectedApplication) return;
    setUpdating(true);
    try {
      await hirerService.updateApplicationStatus(
        selectedApplication.jobId,
        selectedApplication.id,
        actionType,
        feedback,
      );
      setShowReviewDialog(false);
      setFeedback('');

      // Move app to new status in local state
      setApplicationsByJob((prev) => {
        const jobId = selectedApplication.jobId;
        const apps = (prev[jobId] || []).map((app) =>
          app.id === selectedApplication.id ? { ...app, status: actionType } : app,
        );
        return { ...prev, [jobId]: apps };
      });

      setError(null);
      enqueueSnackbar(
        `Application ${actionType === 'accepted' ? 'accepted' : 'rejected'} successfully`,
        { variant: 'success' },
      );
    } catch (err) {
      setError('Failed to update application status.');
      enqueueSnackbar('Failed to update application status', { variant: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenReviewDialog = (type) => {
    setActionType(type);
    setShowReviewDialog(true);
  };

  const handleMessage = async () => {
    if (!selectedApplication?.workerId) {
      setError('Worker contact information is unavailable.');
      return;
    }
    try {
      const conv = await messagingService.createDirectConversation(
        selectedApplication.workerId,
      );
      const conversationId =
        conv?.id ||
        conv?._id ||
        conv?.data?.id ||
        conv?.data?._id ||
        conv?.conversation?.id ||
        conv?.conversation?._id;
      if (conversationId) {
        navigate(`/messages?conversation=${conversationId}`);
        return;
      }
      setError('Unable to start chat. Please try again later.');
    } catch (err) {
      setError('Unable to start chat. Please try again later.');
    }
  };

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 3 }, mb: { xs: 2, md: 4 } }}>
      <Helmet>
        <title>Applications | Kelmah</title>
      </Helmet>

      {/* ── Header ────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box>
          <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={700}>
            Job Applications
          </Typography>
          {biddingJobsCount > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Bid-based jobs are reviewed from the dedicated bids screen and are excluded here.
            </Typography>
          )}
          {selectedJob && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip
                icon={<Work />}
                label={selectedJob.title}
                color="primary"
                variant="outlined"
                onClick={() => navigate(`/jobs/${selectedJobId}`)}
                onDelete={() => handleSelectJob(null)}
                deleteIcon={
                  <Tooltip title="View all jobs">
                    <FilterList />
                  </Tooltip>
                }
                sx={{ maxWidth: 400, cursor: 'pointer' }}
              />
              <Typography variant="body2" color="text.secondary">
                {currentJobApps.length} application
                {currentJobApps.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          )}
        </Box>
        {isMobile && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<Work />}
            onClick={() => setShowJobList(!showJobList)}
          >
            {showJobList ? 'Hide Jobs' : 'Select Job'}
          </Button>
        )}
      </Box>

      {/* ── 3-column layout ───────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          height: isMobile ? 'auto' : 'calc(100dvh - 220px)',
          minHeight: isMobile ? 'auto' : 500,
          overflow: 'hidden',
        }}
      >
        {allJobs.length === 0 && biddingJobsCount > 0 && (
          <Alert severity="info" sx={{ m: 2, mb: 0 }}>
            This view only shows standard applications. Use Review Bids from job management for bidding jobs.
          </Alert>
        )}

        {/* ── Col 1: Job list sidebar ─────────────────────────── */}
        {(!isMobile || showJobList) && (
          <Box
            sx={{
              width: isMobile ? '100%' : isTablet ? 220 : 260,
              minWidth: isMobile ? 'auto' : isTablet ? 220 : 260,
              borderRight: isMobile
                ? 'none'
                : `1px solid ${theme.palette.divider}`,
              borderBottom: isMobile
                ? `1px solid ${theme.palette.divider}`
                : 'none',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: alpha(theme.palette.background.default, 0.5),
            }}
          >
            <Box
              sx={{
                px: 1.5,
                py: 1.5,
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="overline" color="text.secondary" fontWeight={700}>
                Your Jobs ({allJobs.length})
              </Typography>
            </Box>
            <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
              {/* "All Jobs" option */}
              <ListItemButton
                selected={!selectedJobId}
                onClick={() => handleSelectJob(null)}
                sx={{
                  borderRadius: 1.5,
                  mb: 0.5,
                  py: 1,
                  px: 1.5,
                  borderLeft: !selectedJobId
                    ? `3px solid ${theme.palette.primary.main}`
                    : '3px solid transparent',
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Badge
                    badgeContent={Object.values(applicationsByJob).reduce(
                      (s, a) => s + a.length,
                      0,
                    )}
                    color="primary"
                    max={99}
                  >
                    <FilterList fontSize="small" />
                  </Badge>
                </ListItemIcon>
                <ListItemText
                  primary="All Jobs"
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: !selectedJobId ? 700 : 400,
                  }}
                />
              </ListItemButton>

              <Divider sx={{ my: 0.5 }} />

              {allJobs.map((job) => {
                const jid = job.id || job._id;
                return (
                  <JobListItem
                    key={jid}
                    job={job}
                    isSelected={selectedJobId === jid}
                    onClick={() => handleSelectJob(jid)}
                    appCount={totalAppCounts[jid] || 0}
                  />
                );
              })}
            </Box>
          </Box>
        )}

        {/* ── Col 2: Applications list ────────────────────────── */}
        <Box
          sx={{
            width: isMobile ? '100%' : isTablet ? 300 : 360,
            minWidth: isMobile ? 'auto' : isTablet ? 300 : 360,
            borderRight: isMobile
              ? 'none'
              : `1px solid ${theme.palette.divider}`,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Status tabs */}
          <Tabs
            value={activeTab}
            onChange={(e, v) => {
              setActiveTab(v);
              setSelectedApplication(null);
            }}
            sx={{
              borderBottom: `1px solid ${theme.palette.divider}`,
              minHeight: 44,
              '& .MuiTab-root': {
                minWidth: 80,
                minHeight: 44,
                px: 1.5,
                fontSize: '0.8rem',
              },
            }}
            variant="fullWidth"
          >
            <Tab
              label={
                tabCounts.pending
                  ? `Pending (${tabCounts.pending})`
                  : 'Pending'
              }
              value="pending"
            />
            <Tab
              label={
                tabCounts.accepted
                  ? `Accepted (${tabCounts.accepted})`
                  : 'Accepted'
              }
              value="accepted"
            />
            <Tab
              label={
                tabCounts.rejected
                  ? `Rejected (${tabCounts.rejected})`
                  : 'Rejected'
              }
              value="rejected"
            />
          </Tabs>

          {/* Application cards */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
            {initialLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rectangular"
                  height={72}
                  sx={{ mb: 1.5, borderRadius: 2 }}
                />
              ))}

            {error && (
              <Alert
                severity="error"
                sx={{ mb: 1.5 }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            {!initialLoading &&
              (() => {
                // Single job selected — flat list
                if (selectedJobId) {
                  if (filteredApps.length === 0) {
                    return (
                      <EmptyAppsPanel
                        tab={activeTab}
                        hasAnyApps={currentJobApps.length > 0}
                        navigate={navigate}
                      />
                    );
                  }
                  return filteredApps.map((app) => (
                    <ApplicationCard
                      key={app.id}
                      application={app}
                      isSelected={selectedApplication?.id === app.id}
                      onSelect={setSelectedApplication}
                      showJobTitle={false}
                    />
                  ));
                }

                // "All Jobs" mode — group applications by job
                if (filteredApps.length === 0) {
                  return (
                    <EmptyAppsPanel
                      tab={activeTab}
                      hasAnyApps={allAppsFlat.length > 0}
                      navigate={navigate}
                    />
                  );
                }

                const grouped = {};
                filteredApps.forEach((app) => {
                  const key = app.jobId || 'unknown';
                  if (!grouped[key])
                    grouped[key] = { title: app.jobTitle, apps: [] };
                  grouped[key].apps.push(app);
                });

                return Object.entries(grouped).map(([jobId, group]) => (
                  <Box key={jobId} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 1,
                        px: 0.5,
                        cursor: 'pointer',
                        borderRadius: 1,
                        py: 0.5,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.06),
                        },
                      }}
                      onClick={() => handleSelectJob(jobId)}
                    >
                      <Work sx={{ fontSize: 16, color: 'primary.main' }} />
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        color="primary.main"
                        noWrap
                        sx={{ flex: 1 }}
                      >
                        {group.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={group.apps.length}
                        sx={{ height: 18, fontSize: '0.65rem' }}
                      />
                    </Box>
                    {group.apps.map((app) => (
                      <ApplicationCard
                        key={app.id}
                        application={app}
                        isSelected={selectedApplication?.id === app.id}
                        onSelect={setSelectedApplication}
                        showJobTitle={false}
                      />
                    ))}
                  </Box>
                ));
              })()}
          </Box>
        </Box>

        {/* ── Col 3: Application detail ───────────────────────── */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: { xs: 2, md: 3 },
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {selectedApplication ? (
            <ApplicationDetailPanel
              app={selectedApplication}
              onAccept={() => handleOpenReviewDialog('accepted')}
              onReject={() => handleOpenReviewDialog('rejected')}
              onMessage={handleMessage}
              onViewJob={() =>
                navigate(`/jobs/${selectedApplication.jobId}`)
              }
              navigate={navigate}
            />
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                minHeight: 300,
                textAlign: 'center',
                p: 4,
              }}
            >
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  bgcolor: 'action.hover',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                }}
              >
                <BadgeIcon sx={{ fontSize: 36, color: 'text.disabled' }} />
              </Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No application selected
              </Typography>
              <Typography variant="body2" color="text.disabled">
                {selectedJobId
                  ? 'Choose an application from the list to review details.'
                  : 'Select a job from the sidebar, then choose an application.'}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* ── Confirm Dialog ────────────────────────────────────── */}
      <Dialog
        open={showReviewDialog}
        onClose={() => !updating && setShowReviewDialog(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
        aria-labelledby="confirm-action-dialog-title"
      >
        <DialogTitle id="confirm-action-dialog-title">
          Confirm {actionType === 'accepted' ? 'Accept' : 'Reject'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            You are about to{' '}
            <strong>
              {actionType === 'accepted' ? 'accept' : 'reject'}
            </strong>{' '}
            the application from{' '}
            <strong>{selectedApplication?.workerName}</strong>.
          </Typography>
          {actionType === 'rejected' && (
            <TextField
              label="Feedback (Optional)"
              multiline
              rows={4}
              fullWidth
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowReviewDialog(false)}
            sx={{ minHeight: 44 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStatusUpdate}
            color={actionType === 'accepted' ? 'success' : 'error'}
            variant="contained"
            disabled={updating}
            sx={{ minHeight: 44 }}
          >
            {updating ? (
              <CircularProgress size={24} />
            ) : (
              `Confirm ${actionType === 'accepted' ? 'Accept' : 'Reject'}`
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

/* ═════════════════════════════════════════════════════════════════════
   Sub-components
   ═════════════════════════════════════════════════════════════════════ */

function ApplicationDetailPanel({
  app,
  onAccept,
  onReject,
  onMessage,
  onViewJob,
  navigate,
}) {
  const theme = useTheme();
  return (
    <>
      {/* Job context banner — shows which job this application is for */}
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          mb: 2,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          cursor: 'pointer',
          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
        }}
        onClick={onViewJob}
      >
        <Work sx={{ color: 'primary.main', fontSize: 20 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            fontWeight={600}
            noWrap
            color="primary.main"
          >
            {app.jobTitle}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Click to view job details
          </Typography>
        </Box>
        <OpenInNew sx={{ color: 'text.disabled', fontSize: 18 }} />
      </Paper>

      {/* Applicant header */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mb: 2.5,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Avatar
          src={app.workerAvatar}
          alt={app.workerName || 'Applicant'}
          sx={{
            width: 64,
            height: 64,
            cursor: app.workerId ? 'pointer' : 'default',
          }}
          onClick={() => app.workerId && navigate(`/workers/${app.workerId}`)}
        />
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h5"
            fontWeight={600}
            sx={{
              cursor: app.workerId ? 'pointer' : 'default',
              '&:hover': app.workerId
                ? { textDecoration: 'underline' }
                : {},
            }}
            onClick={() =>
              app.workerId && navigate(`/workers/${app.workerId}`)
            }
          >
            {app.workerName}
          </Typography>
          {app.workerRating !== null ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Rating
                value={app.workerRating}
                readOnly
                size="small"
                aria-label={`${app.workerName} rating: ${app.workerRating} out of 5`}
              />
              <Typography variant="caption" color="text.secondary">
                ({app.workerRating?.toFixed(1)})
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.disabled">
              No reviews yet
            </Typography>
          )}
          <Chip
            size="small"
            label={
              app.status?.charAt(0).toUpperCase() + app.status?.slice(1)
            }
            color={STATUS_COLORS[app.status] || 'default'}
            variant="outlined"
            sx={{ mt: 0.5 }}
          />
        </Box>
      </Paper>

      {/* Proposal details */}
      {(app.proposedRate != null || app.estimatedDuration || app.createdAt) && (
        <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
          {app.proposedRate != null && (
            <Paper
              variant="outlined"
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: 2,
                flex: '1 1 140px',
              }}
            >
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ fontSize: '0.65rem' }}
              >
                Proposed Rate
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                GH₵{app.proposedRate.toLocaleString()}
              </Typography>
            </Paper>
          )}
          {app.estimatedDuration && (
            <Paper
              variant="outlined"
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: 2,
                flex: '1 1 140px',
              }}
            >
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ fontSize: '0.65rem' }}
              >
                Est. Duration
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {app.estimatedDuration}
              </Typography>
            </Paper>
          )}
          {app.createdAt && (
            <Paper
              variant="outlined"
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: 2,
                flex: '1 1 140px',
              }}
            >
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ fontSize: '0.65rem' }}
              >
                Applied
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {formatDistanceToNow(new Date(app.createdAt), {
                  addSuffix: true,
                })}
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* Cover letter */}
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Cover Letter
      </Typography>
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 2,
          bgcolor: 'action.hover',
          minHeight: 100,
        }}
      >
        <Typography
          variant="body1"
          sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}
        >
          {app.coverLetter || 'No cover letter provided.'}
        </Typography>
      </Paper>

      {/* Actions */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1.5,
          mt: 'auto',
        }}
      >
        <Button
          variant="outlined"
          startIcon={<Message />}
          onClick={onMessage}
          sx={{ minHeight: 44 }}
        >
          Message
        </Button>
        <Button
          color="success"
          variant="contained"
          startIcon={<CheckCircle />}
          onClick={onAccept}
          sx={{ minHeight: 44 }}
          disabled={app.status === 'accepted'}
        >
          {app.status === 'accepted' ? 'Accepted' : 'Accept'}
        </Button>
        <Button
          color="error"
          variant="outlined"
          startIcon={<Cancel />}
          onClick={onReject}
          sx={{ minHeight: 44 }}
          disabled={app.status === 'rejected'}
        >
          {app.status === 'rejected' ? 'Rejected' : 'Reject'}
        </Button>
      </Box>
    </>
  );
}

function EmptyAppsPanel({ tab, hasAnyApps, navigate }) {
  return (
    <Box sx={{ textAlign: 'center', mt: 4, py: 4, px: 2 }}>
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: (t) =>
            `linear-gradient(135deg, ${t.palette.primary.light}22, ${t.palette.primary.main}18)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2,
        }}
      >
        <InboxOutlined sx={{ fontSize: 36, color: 'primary.main' }} />
      </Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        {hasAnyApps ? `No ${tab} applications` : 'No applications yet'}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 3, maxWidth: 280, mx: 'auto' }}
      >
        {hasAnyApps
          ? 'Switch tabs to view your other applications.'
          : 'Once workers apply to your jobs, their proposals will appear here.'}
      </Typography>
      {!hasAnyApps && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              bgcolor: 'action.hover',
              borderRadius: 2,
              p: 2,
              mb: 2,
              textAlign: 'left',
              maxWidth: 300,
              mx: 'auto',
            }}
          >
            <Typography
              variant="caption"
              fontWeight={600}
              color="text.secondary"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                mb: 1,
              }}
            >
              <TipsAndUpdates sx={{ fontSize: 16 }} /> Quick tips
            </Typography>
            {[
              'Post a detailed job with clear requirements',
              'Set a competitive budget range',
              'Browse Find Talent to invite workers',
            ].map((tip) => (
              <Typography
                key={tip}
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 0.5, pl: 1 }}
              >
                • {tip}
              </Typography>
            ))}
          </Box>
          <Button
            variant="contained"
            color="primary"
            endIcon={<ArrowForward />}
            onClick={() => navigate('/hirer/jobs/post')}
            sx={{ minHeight: 44, minWidth: 180 }}
          >
            Post a Job
          </Button>
          <Button
            variant="text"
            size="small"
            onClick={() => navigate('/hirer/find-talent')}
            sx={{ minHeight: 36, textTransform: 'none' }}
          >
            Or browse available talent
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default ApplicationManagementPage;
