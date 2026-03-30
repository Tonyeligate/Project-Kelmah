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
  Skeleton,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  IconButton,
  Badge,
  Tooltip,
  Pagination,
  FormControl,
  Select,
  MenuItem,
  alpha,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Message,
  ArrowBack,
  NavigateBefore,
  NavigateNext,
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
import { useNavigate, useSearchParams } from 'react-router-dom';
import { messagingService } from '../../messaging/services/messagingService';
import { useSnackbar } from 'notistack';
import {
  devError as logDevError,
  devInfo as logDevInfo,
  devWarn as logDevWarn,
} from '@/modules/common/utils/devLogger';
import {
  APPLICATIONS_PAGE_SIZE,
  APPLICATIONS_PAGE_SIZE_OPTIONS,
  APPLICATION_SORT_OPTIONS,
  APPLICATION_STATUS_TABS,
  DEFAULT_APPLICATION_COUNTS,
  STATUS_COLORS,
  formatStatusLabel,
  isBiddingJob,
  normalizeApplication,
  normalizeApplicationsPage,
  normalizeApplicationsPageSize,
  normalizeApplicationsSort,
  normalizeApplicationsTab,
} from '../utils/applicationManagementUtils';
import {
  ApplicationCard,
  JobListItem,
} from '../components/ApplicationManagementCards';
import { useBreakpointDown } from '../../../hooks/useResponsive';
import {
  HEADER_HEIGHT_MOBILE,
  TOUCH_TARGET_MIN,
  Z_INDEX,
} from '../../../constants/layout';
import PageCanvas from '@/modules/common/components/PageCanvas';
import {
  withBottomNavSafeArea,
  withSafeAreaBottom,
  withSafeAreaTop,
} from '@/utils/safeArea';

/* ─── helpers ─────────────────────────────────────────────────────── */

/* ═══════════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════════ */

const formatGhanaCurrencyLabel = (value) => {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(Number.isFinite(amount) ? amount : 0);
};

const QUICK_REJECT_FEEDBACK_TEMPLATE =
  'Thank you for your application. We are moving forward with another applicant whose proposal better matches this job budget and timeline.';

const QUICK_ACCEPT_FEEDBACK_TEMPLATE =
  'Application accepted via quick mobile action. Please proceed to chat for next steps.';

const buildQuickRejectFeedbackTemplate = (application) => {
  const workerName = String(application?.workerName || '').trim();
  const firstName = workerName.split(' ')[0] || 'there';
  const jobTitle = String(application?.jobTitle || '').trim();

  if (jobTitle) {
    return `Thank you ${firstName} for your application to "${jobTitle}". We are moving forward with another applicant whose proposal better matches this job budget and timeline.`;
  }

  return QUICK_REJECT_FEEDBACK_TEMPLATE;
};

function ApplicationManagementPage() {
  const theme = useTheme();
  const isMobile = useBreakpointDown('md');
  const isCompactMobile = useBreakpointDown('sm');
  const isTablet = useBreakpointDown('lg');
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlJobId = searchParams.get('jobId');
  const urlActiveTab = normalizeApplicationsTab(searchParams.get('tab'));
  const urlCurrentPage = normalizeApplicationsPage(searchParams.get('page'));
  const urlPageSize = normalizeApplicationsPageSize(searchParams.get('limit'));
  const urlSortBy = normalizeApplicationsSort(searchParams.get('sort'));

  const [jobs, setJobs] = useState([]);

  // Flat deduplicated job list
  const dedupedJobs = useMemo(() => {
    const seen = new Set();
    return (Array.isArray(jobs) ? jobs : []).filter((j) => {
      const id = j?.id || j?._id;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [jobs]);

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
  const [activeTab, setActiveTab] = useState(urlActiveTab);
  const [applications, setApplications] = useState([]);
  const [summary, setSummary] = useState({
    totalJobs: 0,
    totalApplications: 0,
    countsByStatus: DEFAULT_APPLICATION_COUNTS,
  });
  const [pageSize, setPageSize] = useState(urlPageSize);
  const [sortBy, setSortBy] = useState(urlSortBy);
  const [currentPage, setCurrentPage] = useState(urlCurrentPage);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: APPLICATIONS_PAGE_SIZE,
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [updating, setUpdating] = useState(false);
  const [actionType, setActionType] = useState('');
  const [showJobList, setShowJobList] = useState(!isMobile);
  const [macroAction, setMacroAction] = useState('');
  const [lastMacroTelemetry, setLastMacroTelemetry] = useState(null);

  const publishMacroTelemetry = useCallback((snapshot) => {
    if (!snapshot || typeof snapshot !== 'object') {
      return;
    }

    setLastMacroTelemetry({
      ...snapshot,
      updatedAt: Date.now(),
    });
  }, []);

  const macroTelemetryBadgeMeta = useMemo(() => {
    if (!lastMacroTelemetry) {
      return null;
    }

    const attempts = Number(lastMacroTelemetry.attempts || 0);
    const retries = Number(lastMacroTelemetry.retries || 0);
    const fallbackMoves = Number(lastMacroTelemetry.fallbackMoves || 0);
    const phase = String(lastMacroTelemetry.phase || 'snapshot');
    const macroLabel =
      lastMacroTelemetry.macro === 'reject+template' ? 'R+T' : 'A+M';
    const statusColor =
      lastMacroTelemetry.status === 'error'
        ? 'error'
        : lastMacroTelemetry.status === 'warning'
          ? 'warning'
          : lastMacroTelemetry.status === 'success'
            ? 'success'
            : 'default';
    const timestamp = new Date(lastMacroTelemetry.updatedAt || Date.now());
    const savedLabel = Number.isNaN(timestamp.getTime())
      ? 'just now'
      : formatDistanceToNow(timestamp, { addSuffix: true });

    return {
      color: statusColor,
      label: `${macroLabel} ${phase} a${attempts} r${retries} f${fallbackMoves}`,
      tooltip: `Last macro ${macroLabel}: phase ${phase}, attempts ${attempts}, retries ${retries}, fallback moves ${fallbackMoves}, updated ${savedLabel}.`,
    };
  }, [lastMacroTelemetry]);

  const handleResetMacroTelemetry = useCallback(() => {
    setLastMacroTelemetry(null);
  }, []);

  // Sync URL-derived pane state and redirect bid-based jobs to the bid review screen.
  useEffect(() => {
    const nextJobId = urlJobId || null;

    const matchingJob = urlJobId
      ? dedupedJobs.find((job) => (job.id || job._id) === urlJobId)
      : null;
    if (matchingJob && isBiddingJob(matchingJob)) {
      navigate(`/hirer/jobs/${urlJobId}/bids`, { replace: true });
      return;
    }

    if (nextJobId !== selectedJobId) {
      setSelectedJobId(nextJobId);
    }

    if (urlActiveTab !== activeTab) {
      setActiveTab(urlActiveTab);
    }

    if (urlCurrentPage !== currentPage) {
      setCurrentPage(urlCurrentPage);
    }

    if (urlPageSize !== pageSize) {
      setPageSize(urlPageSize);
    }

    if (urlSortBy !== sortBy) {
      setSortBy(urlSortBy);
    }
  }, [
    activeTab,
    currentPage,
    dedupedJobs,
    navigate,
    pageSize,
    selectedJobId,
    sortBy,
    urlActiveTab,
    urlCurrentPage,
    urlJobId,
    urlPageSize,
    urlSortBy,
  ]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);

    if (selectedJobId) {
      nextParams.set('jobId', selectedJobId);
    } else {
      nextParams.delete('jobId');
    }

    if (activeTab !== 'pending') {
      nextParams.set('tab', activeTab);
    } else {
      nextParams.delete('tab');
    }

    if (currentPage > 1) {
      nextParams.set('page', String(currentPage));
    } else {
      nextParams.delete('page');
    }

    if (pageSize !== APPLICATIONS_PAGE_SIZE) {
      nextParams.set('limit', String(pageSize));
    } else {
      nextParams.delete('limit');
    }

    if (sortBy !== 'newest') {
      nextParams.set('sort', sortBy);
    } else {
      nextParams.delete('sort');
    }

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    activeTab,
    currentPage,
    pageSize,
    searchParams,
    selectedJobId,
    setSearchParams,
    sortBy,
  ]);

  const loadApplicationsView = useCallback(
    async ({ isCancelled = () => false } = {}) => {
      setApplicationsLoading(true);
      setError(null);

      try {
        const response = await hirerService.getApplicationsSummary({
          jobId: selectedJobId || undefined,
          status: activeTab,
          page: currentPage,
          limit: pageSize,
          sort: sortBy,
        });
        if (isCancelled()) return;

        const summaryJobs = Array.isArray(response?.jobs) ? response.jobs : [];
        const currentApplications = (
          Array.isArray(response?.applications) ? response.applications : []
        ).map((app) => normalizeApplication(app, app?.jobId, app?.jobTitle));
        const nextPagination = {
          currentPage: response?.pagination?.currentPage ?? 1,
          totalPages: response?.pagination?.totalPages ?? 1,
          totalItems: response?.pagination?.totalItems ?? 0,
          limit: response?.pagination?.limit ?? pageSize,
        };

        setJobs(summaryJobs);
        setSummary(
          response?.summary || {
            totalJobs: 0,
            totalApplications: 0,
            countsByStatus: DEFAULT_APPLICATION_COUNTS,
          },
        );
        setApplications(currentApplications);
        setPagination(nextPagination);

        if (nextPagination.limit !== pageSize) {
          setPageSize(nextPagination.limit);
        }

        if (response?.filters?.sort && response.filters.sort !== sortBy) {
          setSortBy(response.filters.sort);
        }

        if (nextPagination.currentPage !== currentPage) {
          setCurrentPage(nextPagination.currentPage);
        }

        // Keep view mode stable: do not auto-switch from "All Jobs" to a
        // single-job view unless the user explicitly selects a job or URL has jobId.
      } catch (loadError) {
        if (isCancelled()) return;
        setJobs([]);
        setSummary({
          totalJobs: 0,
          totalApplications: 0,
          countsByStatus: DEFAULT_APPLICATION_COUNTS,
        });
        setApplications([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          limit: pageSize,
        });
        setError(
          loadError?.response?.data?.message ||
            loadError.message ||
            'Failed to load applications',
        );
      } finally {
        if (!isCancelled()) {
          setInitialLoading(false);
          setApplicationsLoading(false);
        }
      }
    },
    [activeTab, currentPage, pageSize, selectedJobId, sortBy, urlJobId],
  );

  // ── Fetch jobs and their applications ──────────────────────────
  useEffect(() => {
    let cancelled = false;
    loadApplicationsView({ isCancelled: () => cancelled });
    return () => {
      cancelled = true;
    };
  }, [loadApplicationsView]);

  // ── Derived data ───────────────────────────────────────────────
  const selectedJob = useMemo(
    () => allJobs.find((j) => (j.id || j._id) === selectedJobId) || null,
    [allJobs, selectedJobId],
  );

  const filteredApps = useMemo(() => applications, [applications]);

  const tabCounts = useMemo(() => {
    const sourceCounts = selectedJobId
      ? selectedJob?.applicationCounts || DEFAULT_APPLICATION_COUNTS
      : summary?.countsByStatus || DEFAULT_APPLICATION_COUNTS;

    return {
      pending: sourceCounts.pending || 0,
      accepted: sourceCounts.accepted || 0,
      rejected: sourceCounts.rejected || 0,
    };
  }, [selectedJob, selectedJobId, summary]);

  const totalAppCounts = useMemo(() => {
    const counts = {};
    allJobs.forEach((job) => {
      const jobId = job.id || job._id;
      counts[jobId] = job?.applicationCounts?.total || 0;
    });
    return counts;
  }, [allJobs]);

  const activeTabCountsByJob = useMemo(() => {
    const counts = {};
    allJobs.forEach((job) => {
      const jobId = job.id || job._id;
      counts[jobId] = job?.applicationCounts?.[activeTab] || 0;
    });
    return counts;
  }, [activeTab, allJobs]);

  const visibleRange = useMemo(() => {
    if (!filteredApps.length) {
      return { start: 0, end: 0 };
    }

    const start =
      ((pagination.currentPage || 1) - 1) * (pagination.limit || pageSize) + 1;
    return {
      start,
      end: start + filteredApps.length - 1,
    };
  }, [filteredApps.length, pageSize, pagination.currentPage, pagination.limit]);

  const selectedScopeTotal = selectedJobId
    ? selectedJob?.applicationCounts?.total || 0
    : summary?.totalApplications || 0;

  const hasNoStandardJobs = !initialLoading && allJobs.length === 0;
  const mobileDetailMode = isMobile && Boolean(selectedApplication);

  const selectedApplicationIndex = useMemo(() => {
    if (!selectedApplication?.id) {
      return -1;
    }

    return filteredApps.findIndex((app) => app.id === selectedApplication.id);
  }, [filteredApps, selectedApplication?.id]);

  const canSelectPrevious = selectedApplicationIndex > 0;
  const canSelectNext =
    selectedApplicationIndex >= 0 &&
    selectedApplicationIndex < filteredApps.length - 1;

  const triageSummary = useMemo(() => {
    const withRate = filteredApps.filter((app) =>
      Number.isFinite(Number(app?.proposedRate)),
    );
    const avgRate = withRate.length
      ? Math.round(
          withRate.reduce((sum, app) => sum + Number(app.proposedRate), 0) /
            withRate.length,
        )
      : null;

    const ratedProfiles = filteredApps.filter(
      (app) => app?.workerRating !== null && app?.workerRating !== undefined,
    ).length;

    const recent48h = filteredApps.filter((app) => {
      if (!app?.createdAt) return false;
      const createdAtMs = new Date(app.createdAt).getTime();
      if (!Number.isFinite(createdAtMs)) return false;
      return Date.now() - createdAtMs <= 48 * 60 * 60 * 1000;
    }).length;

    return {
      avgRate,
      ratedProfiles,
      recent48h,
    };
  }, [filteredApps]);

  // Auto-select first filtered app when job or tab changes
  useEffect(() => {
    if (!initialLoading) {
      setSelectedApplication((current) => {
        if (!filteredApps.length) {
          return null;
        }

        if (isMobile && !current) {
          return null;
        }

        if (current) {
          const stillVisible = filteredApps.find(
            (app) => app.id === current.id,
          );
          if (stillVisible) {
            return stillVisible;
          }

          if (isMobile) {
            return null;
          }
        }

        return filteredApps[0];
      });
    }
  }, [filteredApps, initialLoading, isMobile]);

  // ── Handlers ───────────────────────────────────────────────────
  const handleSelectJob = (jobId) => {
    setSelectedJobId(jobId);
    setActiveTab('pending');
    setCurrentPage(1);
    setSelectedApplication(null);
    if (isMobile) setShowJobList(false);
  };

  const updateApplicationStatusAndRefresh = useCallback(
    async ({ application, status, feedbackText = '' }) => {
      if (!application?.id || !application?.jobId) {
        throw new Error('Application details are unavailable.');
      }

      await hirerService.updateApplicationStatus(
        application.jobId,
        application.id,
        status,
        feedbackText,
      );

      await loadApplicationsView();
    },
    [loadApplicationsView],
  );

  const handleStatusUpdate = useCallback(async () => {
    if (!selectedApplication) return;
    setUpdating(true);
    try {
      await updateApplicationStatusAndRefresh({
        application: selectedApplication,
        status: actionType,
        feedbackText: feedback,
      });
      setShowReviewDialog(false);
      setFeedback('');

      setError(null);
      enqueueSnackbar(
        `Application ${actionType === 'accepted' ? 'accepted' : 'rejected'} successfully`,
        { variant: 'success' },
      );
    } catch (err) {
      setError('Failed to update application status.');
      enqueueSnackbar('Failed to update application status', {
        variant: 'error',
      });
    } finally {
      setUpdating(false);
    }
  }, [
    actionType,
    enqueueSnackbar,
    feedback,
    selectedApplication,
    updateApplicationStatusAndRefresh,
  ]);

  const handleOpenReviewDialog = useCallback((type) => {
    setActionType(type);
    setFeedback('');
    setShowReviewDialog(true);
  }, []);

  const handleSortChange = (nextSort) => {
    setCurrentPage(1);
    setSelectedApplication(null);
    setSortBy(nextSort);
  };

  const handlePageSizeChange = (nextPageSize) => {
    setCurrentPage(1);
    setSelectedApplication(null);
    setPageSize(nextPageSize);
  };

  const handlePageChange = (page) => {
    if (page !== currentPage) {
      setCurrentPage(page);
      setSelectedApplication(null);
    }
  };

  const handleSelectApplication = useCallback(
    (application) => {
      setSelectedApplication(application);
      if (isMobile) {
        setShowJobList(false);
      }
    },
    [isMobile],
  );

  const handleStepApplication = useCallback(
    (step) => {
      if (selectedApplicationIndex < 0) return;

      const nextIndex = selectedApplicationIndex + step;
      if (nextIndex < 0 || nextIndex >= filteredApps.length) return;

      const targetApplication = filteredApps[nextIndex];
      if (targetApplication) {
        setSelectedApplication(targetApplication);
        if (isMobile) {
          setShowJobList(false);
        }
      }
    },
    [filteredApps, isMobile, selectedApplicationIndex],
  );

  const openReviewDialogForApplication = useCallback(
    (application, type) => {
      if (!application) return;
      setSelectedApplication(application);
      setActionType(type);
      setFeedback('');
      setShowReviewDialog(true);
      if (isMobile) {
        setShowJobList(false);
      }
    },
    [isMobile],
  );

  const startConversationForApplication = useCallback(
    async (application) => {
      if (!application?.workerId) {
        setError('Worker contact information is unavailable.');
        return false;
      }

      try {
        const conv = await messagingService.createDirectConversation(
          application.workerId,
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
          return true;
        }
        setError('Unable to start chat. Please try again later.');
        return false;
      } catch (err) {
        setError('Unable to start chat. Please try again later.');
        return false;
      }
    },
    [navigate],
  );

  const handleMessage = useCallback(async () => {
    await startConversationForApplication(selectedApplication);
  }, [selectedApplication, startConversationForApplication]);

  const handleAcceptAndMessageMacro = useCallback(async () => {
    if (!selectedApplication) return;

    setMacroAction('accept-message');
    const targetApplication = selectedApplication;
    const telemetry = {
      macro: 'accept+message',
      applicationId: targetApplication?.id,
      jobId: targetApplication?.jobId,
      attempts: 0,
      retries: 0,
      fallbackMoves: 0,
    };

    try {
      const nextForTriage =
        filteredApps[selectedApplicationIndex + 1] ||
        filteredApps[selectedApplicationIndex - 1] ||
        null;
      publishMacroTelemetry({
        ...telemetry,
        phase: 'starting',
        status: 'running',
      });

      if (targetApplication.status !== 'accepted') {
        await updateApplicationStatusAndRefresh({
          application: targetApplication,
          status: 'accepted',
          feedbackText: QUICK_ACCEPT_FEEDBACK_TEMPLATE,
        });
      }

      telemetry.attempts += 1;
      logDevInfo('[ApplicationManagementPage] accept+message open attempt', {
        ...telemetry,
        maxAttempts: 2,
      });

      const openedOnFirstAttempt =
        await startConversationForApplication(targetApplication);
      let opened = openedOnFirstAttempt;

      if (!opened) {
        telemetry.retries += 1;
        await new Promise((resolve) => {
          setTimeout(resolve, 220);
        });

        telemetry.attempts += 1;
        logDevInfo('[ApplicationManagementPage] accept+message retry attempt', {
          ...telemetry,
          maxAttempts: 2,
        });

        opened = await startConversationForApplication(targetApplication);
      }

      if (!opened) {
        if (nextForTriage?.id) {
          setSelectedApplication(nextForTriage);
          telemetry.fallbackMoves = 1;
        }

        publishMacroTelemetry({
          ...telemetry,
          phase: 'fallback',
          status: 'warning',
        });

        logDevWarn(
          '[ApplicationManagementPage] accept+message fallback after failed attempts',
          {
            ...telemetry,
            fallbackTargetApplicationId: nextForTriage?.id || null,
          },
        );

        enqueueSnackbar(
          nextForTriage?.id
            ? `Chat failed after ${telemetry.attempts}/2 attempts (retry ${telemetry.retries}/1). Fallback ${telemetry.fallbackMoves}/1: moved to next applicant.`
            : `Chat failed after ${telemetry.attempts}/2 attempts (retry ${telemetry.retries}/1). Fallback ${telemetry.fallbackMoves}/1: staying on current applicant.`,
          {
            variant: 'warning',
          },
        );
      } else if (!openedOnFirstAttempt) {
        logDevInfo(
          '[ApplicationManagementPage] accept+message opened on retry',
          {
            ...telemetry,
          },
        );

        publishMacroTelemetry({
          ...telemetry,
          phase: 'retry-opened',
          status: 'success',
        });

        enqueueSnackbar(
          `Chat opened on retry (${telemetry.attempts}/2 attempts, fallback ${telemetry.fallbackMoves}/1).`,
          {
            variant: 'success',
          },
        );
      } else if (targetApplication.status !== 'accepted') {
        logDevInfo(
          '[ApplicationManagementPage] accept+message accepted and opened',
          {
            ...telemetry,
          },
        );

        publishMacroTelemetry({
          ...telemetry,
          phase: 'accepted-opened',
          status: 'success',
        });

        enqueueSnackbar(
          `Application accepted and chat opened (${telemetry.attempts}/2 attempts, retry ${telemetry.retries}/1).`,
          {
            variant: 'success',
          },
        );
      } else {
        logDevInfo(
          '[ApplicationManagementPage] accept+message opened for accepted application',
          {
            ...telemetry,
          },
        );

        publishMacroTelemetry({
          ...telemetry,
          phase: 'opened',
          status: 'success',
        });

        enqueueSnackbar(
          `Chat opened (${telemetry.attempts}/2 attempts, retry ${telemetry.retries}/1).`,
          {
            variant: 'success',
          },
        );
      }
      setError(null);
    } catch (err) {
      logDevError('[ApplicationManagementPage] accept+message macro failed', {
        applicationId: selectedApplication?.id,
        jobId: selectedApplication?.jobId,
        error: err?.message || 'Unknown macro error',
      });

      publishMacroTelemetry({
        ...telemetry,
        phase: 'failed',
        status: 'error',
      });

      setError('Accept + message quick action failed.');
      enqueueSnackbar('Accept + message quick action failed', {
        variant: 'error',
      });
    } finally {
      setMacroAction('');
    }
  }, [
    enqueueSnackbar,
    filteredApps,
    publishMacroTelemetry,
    selectedApplication,
    selectedApplicationIndex,
    startConversationForApplication,
    updateApplicationStatusAndRefresh,
  ]);

  const handleRejectWithTemplateMacro = useCallback(async () => {
    if (!selectedApplication || selectedApplication.status === 'rejected') {
      return;
    }

    setMacroAction('reject-template');
    const targetApplication = selectedApplication;
    const telemetry = {
      macro: 'reject+template',
      applicationId: targetApplication?.id,
      jobId: targetApplication?.jobId,
      attempts: 1,
      retries: 0,
      fallbackMoves: 0,
    };

    try {
      const nextForTriage =
        filteredApps[selectedApplicationIndex + 1] ||
        filteredApps[selectedApplicationIndex - 1] ||
        null;
      publishMacroTelemetry({
        ...telemetry,
        phase: 'starting',
        status: 'running',
      });

      if (nextForTriage?.id) {
        setSelectedApplication(nextForTriage);
        telemetry.fallbackMoves = 1;
      }

      await updateApplicationStatusAndRefresh({
        application: targetApplication,
        status: 'rejected',
        feedbackText: buildQuickRejectFeedbackTemplate(targetApplication),
      });
      setError(null);
      logDevInfo(
        '[ApplicationManagementPage] reject+template macro completed',
        {
          ...telemetry,
        },
      );
      publishMacroTelemetry({
        ...telemetry,
        phase: 'completed',
        status: 'success',
      });
      enqueueSnackbar(
        `Application rejected with template feedback (fallback ${telemetry.fallbackMoves}/1).`,
        {
          variant: 'success',
        },
      );
    } catch (err) {
      logDevError('[ApplicationManagementPage] reject+template macro failed', {
        applicationId: selectedApplication?.id,
        jobId: selectedApplication?.jobId,
        error: err?.message || 'Unknown macro error',
      });

      publishMacroTelemetry({
        ...telemetry,
        phase: 'failed',
        status: 'error',
      });

      setError('Reject + template quick action failed.');
      enqueueSnackbar('Reject + template quick action failed', {
        variant: 'error',
      });
    } finally {
      setMacroAction('');
    }
  }, [
    enqueueSnackbar,
    filteredApps,
    publishMacroTelemetry,
    selectedApplication,
    selectedApplicationIndex,
    updateApplicationStatusAndRefresh,
  ]);

  const macroInProgress = macroAction !== '';

  useEffect(() => {
    if (!selectedApplication || showReviewDialog) {
      return undefined;
    }

    const handleKeydown = (event) => {
      const target = event.target;
      const tagName = String(target?.tagName || '').toLowerCase();
      const isEditable =
        target?.isContentEditable ||
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select';

      if (isEditable) {
        return;
      }

      const key = String(event.key || '').toLowerCase();

      if (
        (event.key === 'ArrowLeft' || event.key === 'ArrowUp') &&
        canSelectPrevious
      ) {
        event.preventDefault();
        handleStepApplication(-1);
        return;
      }

      if (
        (event.key === 'ArrowRight' || event.key === 'ArrowDown') &&
        canSelectNext
      ) {
        event.preventDefault();
        handleStepApplication(1);
        return;
      }

      if (key === 'a' && selectedApplication.status !== 'accepted') {
        event.preventDefault();
        handleOpenReviewDialog('accepted');
        return;
      }

      if (key === 'r' && selectedApplication.status !== 'rejected') {
        event.preventDefault();
        handleOpenReviewDialog('rejected');
        return;
      }

      if (key === 'm') {
        event.preventDefault();
        handleMessage();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [
    canSelectNext,
    canSelectPrevious,
    handleOpenReviewDialog,
    handleMessage,
    handleStepApplication,
    selectedApplication,
    showReviewDialog,
  ]);

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */

  return (
    <PageCanvas
      disableContainer
      sx={{
        pt: { xs: 1, md: 4 },
        pb: { xs: withBottomNavSafeArea(84), md: 6 },
        overflowX: 'clip',
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          mt: { xs: 1, md: 3 },
          mb: { xs: 2, md: 4 },
          px: { xs: 1, sm: 2 },
          pb: { xs: withSafeAreaBottom(12), md: 0 },
          width: '100%',
          minWidth: 0,
        }}
      >
        <Helmet>
          <title>Applications | Kelmah</title>
        </Helmet>

        {/* ── Header ────────────────────────────────────────────── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1.5,
            flexWrap: 'wrap',
            gap: 1,
            position: { xs: 'sticky', md: 'static' },
            top: { xs: withSafeAreaTop(HEADER_HEIGHT_MOBILE), md: 'auto' },
            zIndex: { xs: Z_INDEX.sticky, md: 'auto' },
            py: { xs: 0.5, md: 0 },
            backgroundColor: { xs: 'background.default', md: 'transparent' },
          }}
        >
          <Box>
            <Typography
              variant={isCompactMobile ? 'h5' : isMobile ? 'h5' : 'h4'}
              fontWeight={700}
              sx={{ lineHeight: 1.1 }}
            >
              Job Applications
            </Typography>
            {biddingJobsCount > 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Bid-based jobs are reviewed from the dedicated bids screen and
                are excluded here.
              </Typography>
            )}
            {selectedJob && (
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}
              >
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
                  {selectedScopeTotal} application
                  {selectedScopeTotal !== 1 ? 's' : ''}
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
              {showJobList
                ? 'Hide Jobs'
                : selectedJobId
                  ? 'Switch Job'
                  : 'Select Job'}
            </Button>
          )}
        </Box>

        {!isMobile && !hasNoStandardJobs && (
          <Paper
            variant="outlined"
            sx={{
              mb: 1.5,
              px: 1.5,
              py: 1,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              flexWrap: 'wrap',
              bgcolor: alpha(theme.palette.primary.main, 0.03),
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 700 }}
            >
              Applications Snapshot
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                flexWrap: 'wrap',
              }}
            >
              <Chip
                size="small"
                variant="outlined"
                label={`${selectedScopeTotal} in scope`}
              />
              {activeTab === 'pending' && (
                <Chip
                  size="small"
                  color="warning"
                  variant="outlined"
                  label={`${filteredApps.length} pending review`}
                />
              )}
              {triageSummary.avgRate !== null && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Avg offer ${formatGhanaCurrencyLabel(triageSummary.avgRate)}`}
                />
              )}
              <Chip
                size="small"
                variant="outlined"
                label={`${triageSummary.ratedProfiles} rated profiles`}
              />
              <Chip
                size="small"
                variant="outlined"
                label={`${triageSummary.recent48h} new in 48h`}
              />
              {macroTelemetryBadgeMeta && (
                <Tooltip title={macroTelemetryBadgeMeta.tooltip}>
                  <Chip
                    size="small"
                    variant="outlined"
                    color={macroTelemetryBadgeMeta.color}
                    label={macroTelemetryBadgeMeta.label}
                    onDelete={handleResetMacroTelemetry}
                  />
                </Tooltip>
              )}
            </Box>
          </Paper>
        )}

        {hasNoStandardJobs ? (
          <NoStandardJobsPanel
            hasBiddingJobs={biddingJobsCount > 0}
            onGoToJobs={() => navigate('/hirer/jobs')}
            onPostJob={() => navigate('/hirer/jobs/post')}
            onFindTalent={() => navigate('/hirer/find-talents')}
          />
        ) : (
          <Paper
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              minHeight: isMobile ? 'auto' : 560,
            }}
          >
            <JobSidebar
              isMobile={isMobile}
              showJobList={showJobList}
              isTablet={isTablet}
              allJobs={allJobs}
              selectedJobId={selectedJobId}
              totalApplications={summary?.totalApplications || 0}
              totalAppCounts={totalAppCounts}
              onSelectJob={handleSelectJob}
            />

            {/* ── Col 2: Applications list ────────────────────────── */}
            <Box
              sx={{
                width: isMobile ? '100%' : isTablet ? 300 : 360,
                minWidth: isMobile ? 'auto' : isTablet ? 300 : 360,
                borderRight: isMobile
                  ? 'none'
                  : `1px solid ${theme.palette.divider}`,
                display: mobileDetailMode ? 'none' : 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Status tabs */}
              <Tabs
                value={activeTab}
                onChange={(e, v) => {
                  setCurrentPage(1);
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
                variant={isMobile ? 'scrollable' : 'fullWidth'}
                scrollButtons={isMobile ? 'auto' : false}
                allowScrollButtonsMobile={isMobile}
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

              <ApplicationsListContent
                initialLoading={initialLoading}
                error={error}
                applicationsLoading={applicationsLoading}
                selectedJobId={selectedJobId}
                filteredApps={filteredApps}
                activeTab={activeTab}
                selectedJob={selectedJob}
                summary={summary}
                navigate={navigate}
                selectedApplicationId={selectedApplication?.id}
                activeTabCountsByJob={activeTabCountsByJob}
                onClearError={() => setError(null)}
                onSelectApplication={handleSelectApplication}
                onSelectJob={handleSelectJob}
                onQuickAccept={(application) =>
                  openReviewDialogForApplication(application, 'accepted')
                }
                onQuickReject={(application) =>
                  openReviewDialogForApplication(application, 'rejected')
                }
                onQuickMessage={startConversationForApplication}
              />

              <ApplicationsListFooter
                selectedScopeTotal={selectedScopeTotal}
                visibleRange={visibleRange}
                pagination={pagination}
                selectedJobId={selectedJobId}
                sortBy={sortBy}
                pageSize={pageSize}
                currentPage={currentPage}
                isMobile={isMobile}
                onSortChange={handleSortChange}
                onPageSizeChange={handlePageSizeChange}
                onPageChange={handlePageChange}
              />
            </Box>

            {/* ── Col 3: Application detail ───────────────────────── */}
            <Box
              sx={{
                flex: 1,
                width: isMobile ? '100%' : 'auto',
                p: { xs: 2, md: 3 },
                display: isMobile && !mobileDetailMode ? 'none' : 'flex',
                flexDirection: 'column',
              }}
            >
              {selectedApplication ? (
                <>
                  {isMobile && (
                    <Button
                      variant="text"
                      startIcon={<ArrowBack />}
                      onClick={() => setSelectedApplication(null)}
                      sx={{ alignSelf: 'flex-start', mb: 1, minHeight: 44 }}
                    >
                      Back To Applications
                    </Button>
                  )}
                  <ApplicationDetailPanel
                    app={selectedApplication}
                    onAccept={() => handleOpenReviewDialog('accepted')}
                    onReject={() => handleOpenReviewDialog('rejected')}
                    onMessage={handleMessage}
                    isMobile={isMobile}
                    selectedIndex={selectedApplicationIndex}
                    totalCount={filteredApps.length}
                    canSelectPrevious={canSelectPrevious}
                    canSelectNext={canSelectNext}
                    onSelectPrevious={() => handleStepApplication(-1)}
                    onSelectNext={() => handleStepApplication(1)}
                    onViewJob={() =>
                      navigate(`/jobs/${selectedApplication.jobId}`)
                    }
                    navigate={navigate}
                  />
                </>
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
                    Select an application to review
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    {selectedJobId
                      ? 'Choose an application from the middle list to view details and actions.'
                      : 'Pick a job first, then open an application to continue.'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        )}

        <Paper
          elevation={8}
          sx={(theme) => ({
            display: { xs: 'flex', md: 'none' },
            flexDirection: 'column',
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: withBottomNavSafeArea(0),
            zIndex: Z_INDEX.stickyCta,
            px: 1.25,
            pt: 0.75,
            pb: withSafeAreaBottom(8),
            gap: 0.75,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            boxShadow:
              theme.palette.mode === 'dark'
                ? '0 -8px 24px rgba(0, 0, 0, 0.4)'
                : '0 -6px 18px rgba(16, 17, 19, 0.12)',
          })}
        >
          {selectedApplication ? (
            <>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 0.5,
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => handleStepApplication(-1)}
                  disabled={!canSelectPrevious}
                  aria-label="Previous application"
                  sx={{ width: 36, height: 36 }}
                >
                  <NavigateBefore fontSize="small" />
                </IconButton>
                <Typography variant="caption" color="text.secondary">
                  {selectedApplicationIndex >= 0
                    ? `Application ${selectedApplicationIndex + 1} of ${filteredApps.length}`
                    : `Application list (${filteredApps.length})`}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleStepApplication(1)}
                  disabled={!canSelectNext}
                  aria-label="Next application"
                  sx={{ width: 36, height: 36 }}
                >
                  <NavigateNext fontSize="small" />
                </IconButton>
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ px: 0.5 }}
              >
                Quick decision for{' '}
                {selectedApplication.workerName || 'selected applicant'}
              </Typography>
              {macroTelemetryBadgeMeta && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 0.5,
                  }}
                >
                  <Tooltip title={macroTelemetryBadgeMeta.tooltip}>
                    <Chip
                      size="small"
                      variant="outlined"
                      color={macroTelemetryBadgeMeta.color}
                      label={macroTelemetryBadgeMeta.label}
                      sx={{
                        maxWidth: '100%',
                        '& .MuiChip-label': {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        },
                      }}
                    />
                  </Tooltip>
                  <Tooltip title="Reset macro telemetry snapshot">
                    <IconButton
                      size="small"
                      onClick={handleResetMacroTelemetry}
                      aria-label="Reset macro telemetry snapshot"
                      sx={{
                        width: 28,
                        height: 28,
                        color: 'text.secondary',
                      }}
                    >
                      <Cancel fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  sx={{ minHeight: TOUCH_TARGET_MIN }}
                  startIcon={<Message />}
                  onClick={handleMessage}
                  disabled={macroInProgress}
                >
                  Message
                </Button>
                <Button
                  fullWidth
                  color="success"
                  variant="contained"
                  sx={{ minHeight: TOUCH_TARGET_MIN }}
                  startIcon={<CheckCircle />}
                  onClick={handleAcceptAndMessageMacro}
                  disabled={macroInProgress}
                >
                  {macroAction === 'accept-message'
                    ? 'Processing...'
                    : selectedApplication.status === 'accepted'
                      ? 'Message Worker'
                      : 'Accept + Message'}
                </Button>
              </Box>
              <Button
                fullWidth
                color="error"
                variant="outlined"
                sx={{ minHeight: TOUCH_TARGET_MIN }}
                startIcon={<Cancel />}
                onClick={handleRejectWithTemplateMacro}
                disabled={
                  macroInProgress || selectedApplication.status === 'rejected'
                }
              >
                {macroAction === 'reject-template'
                  ? 'Processing...'
                  : selectedApplication.status === 'rejected'
                    ? 'Rejected'
                    : 'Reject + Template'}
              </Button>
              <Button
                fullWidth
                size="small"
                variant="text"
                sx={{ minHeight: 34 }}
                onClick={() => handleOpenReviewDialog('rejected')}
                disabled={
                  macroInProgress || selectedApplication.status === 'rejected'
                }
              >
                Add custom rejection note
              </Button>
            </>
          ) : (
            <>
              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                sx={{ minHeight: 42 }}
                startIcon={<Work />}
                onClick={() => setShowJobList((prev) => !prev)}
              >
                {showJobList
                  ? 'Hide Jobs'
                  : selectedJobId
                    ? 'Switch Job'
                    : 'Select Job'}
              </Button>
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                sx={{
                  minHeight: 42,
                  boxShadow: '0 2px 8px rgba(255,215,0,0.35)',
                }}
                startIcon={<ArrowForward />}
                onClick={() => navigate('/hirer/jobs/post')}
              >
                Post Job
              </Button>
            </>
          )}
        </Paper>

        <ApplicationReviewDialog
          open={showReviewDialog}
          updating={updating}
          isMobile={isMobile}
          actionType={actionType}
          workerName={selectedApplication?.workerName}
          feedback={feedback}
          onClose={() => setShowReviewDialog(false)}
          onFeedbackChange={setFeedback}
          onConfirm={handleStatusUpdate}
        />
      </Container>
    </PageCanvas>
  );
}

/* ═════════════════════════════════════════════════════════════════════
   Sub-components
   ═════════════════════════════════════════════════════════════════════ */

function ApplicationsListFooter({
  selectedScopeTotal,
  visibleRange,
  pagination,
  selectedJobId,
  sortBy,
  pageSize,
  currentPage,
  isMobile,
  onSortChange,
  onPageSizeChange,
  onPageChange,
}) {
  const theme = useTheme();
  const sortLabel =
    APPLICATION_SORT_OPTIONS.find((option) => option.value === sortBy)?.label ||
    'Newest First';

  return (
    <Box
      sx={{
        px: 1.5,
        py: 1.25,
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 1,
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        <Typography variant="caption" color="text.secondary" display="block">
          {selectedScopeTotal > 0
            ? `Showing ${visibleRange.start}-${visibleRange.end} of ${pagination.totalItems || selectedScopeTotal} ${selectedJobId ? 'applications' : 'applications in this view'}`
            : 'No applications to show'}
        </Typography>
        <Typography
          variant="caption"
          color="text.disabled"
          display="block"
          sx={{ mt: 0.25 }}
        >
          Sorted by {sortLabel} • {pageSize} per page
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={sortBy}
              onChange={(event) => onSortChange(event.target.value)}
              displayEmpty
              inputProps={{ 'aria-label': 'Sort applications' }}
            >
              {APPLICATION_SORT_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 92 }}>
            <Select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              inputProps={{ 'aria-label': 'Applications per page' }}
            >
              {APPLICATIONS_PAGE_SIZE_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option} / page
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>
      {pagination.totalPages > 1 && (
        <Pagination
          page={pagination.currentPage || currentPage}
          count={pagination.totalPages}
          size={isMobile ? 'small' : 'medium'}
          siblingCount={isMobile ? 0 : 1}
          boundaryCount={1}
          onChange={(_, page) => onPageChange(page)}
          sx={{ mt: 1, alignSelf: 'center' }}
        />
      )}
    </Box>
  );
}

function JobSidebar({
  isMobile,
  showJobList,
  isTablet,
  allJobs,
  selectedJobId,
  totalApplications,
  totalAppCounts,
  onSelectJob,
}) {
  const theme = useTheme();

  if (isMobile && !showJobList) {
    return null;
  }

  return (
    <Box
      sx={{
        width: isMobile ? '100%' : isTablet ? 220 : 260,
        minWidth: isMobile ? 'auto' : isTablet ? 220 : 260,
        borderRight: isMobile ? 'none' : `1px solid ${theme.palette.divider}`,
        borderBottom: isMobile ? `1px solid ${theme.palette.divider}` : 'none',
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
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ display: 'block', mt: 0.25 }}
        >
          Pick a job to narrow this list.
        </Typography>
      </Box>
      <Box sx={{ flex: 1, p: 1 }}>
        {/* "All Jobs" option */}
        <ListItemButton
          selected={!selectedJobId}
          onClick={() => onSelectJob(null)}
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
            <Badge badgeContent={totalApplications} color="primary" max={99}>
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
              onClick={() => onSelectJob(jid)}
              appCount={totalAppCounts[jid] || 0}
            />
          );
        })}
      </Box>
    </Box>
  );
}

function ApplicationsListContent({
  initialLoading,
  error,
  applicationsLoading,
  selectedJobId,
  filteredApps,
  activeTab,
  selectedJob,
  summary,
  navigate,
  selectedApplicationId,
  activeTabCountsByJob,
  onClearError,
  onSelectApplication,
  onSelectJob,
  onQuickAccept,
  onQuickReject,
  onQuickMessage,
}) {
  const theme = useTheme();

  return (
    <Box sx={{ flex: 1, p: 1.5 }}>
      {initialLoading &&
        Array.from({ length: 4 }).map((_, i) => (
          <Skeleton
            key={`application-skeleton-${i}`}
            variant="rectangular"
            height={72}
            sx={{ mb: 1.5, borderRadius: 2 }}
          />
        ))}

      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }} onClose={onClearError}>
          {error}
        </Alert>
      )}

      {applicationsLoading && !initialLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
          <CircularProgress size={20} />
        </Box>
      )}

      {!initialLoading &&
        (() => {
          // Single job selected — flat list
          if (selectedJobId) {
            if (filteredApps.length === 0) {
              return (
                <EmptyAppsPanel
                  tab={activeTab}
                  hasAnyApps={(selectedJob?.applicationCounts?.total || 0) > 0}
                  navigate={navigate}
                />
              );
            }
            return filteredApps.map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                isSelected={selectedApplicationId === app.id}
                onSelect={onSelectApplication}
                showJobTitle={false}
                statusColors={STATUS_COLORS}
                showQuickActions
                onAccept={onQuickAccept}
                onReject={onQuickReject}
                onMessage={onQuickMessage}
              />
            ));
          }

          // "All Jobs" mode — group applications by job
          if (filteredApps.length === 0) {
            return (
              <EmptyAppsPanel
                tab={activeTab}
                hasAnyApps={(summary?.totalApplications || 0) > 0}
                navigate={navigate}
              />
            );
          }

          const grouped = {};
          filteredApps.forEach((app) => {
            const key = app.jobId || 'unknown';
            if (!grouped[key]) grouped[key] = { title: app.jobTitle, apps: [] };
            grouped[key].apps.push(app);
          });

          const groupedEntries = Object.entries(grouped).sort(
            ([, leftGroup], [, rightGroup]) => {
              if (rightGroup.apps.length !== leftGroup.apps.length) {
                return rightGroup.apps.length - leftGroup.apps.length;
              }

              return String(leftGroup.title || '').localeCompare(
                String(rightGroup.title || ''),
              );
            },
          );

          return groupedEntries.map(([jobId, group]) => (
            <Box key={jobId} sx={{ mb: 2 }}>
              <ListItemButton
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 1.25,
                  mb: 1,
                  py: 0.5,
                  px: 0.75,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                  },
                }}
                aria-label={`Show only ${group.title} applications`}
                onClick={() => onSelectJob(jobId)}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <Work sx={{ fontSize: 16, color: 'primary.main' }} />
                </ListItemIcon>
                <ListItemText
                  primary={group.title}
                  secondary="Show only this job"
                  primaryTypographyProps={{
                    variant: 'caption',
                    fontWeight: 700,
                    color: 'primary.main',
                    noWrap: true,
                  }}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    color: 'text.disabled',
                    noWrap: true,
                  }}
                  sx={{ my: 0 }}
                ></ListItemText>
                <Chip
                  size="small"
                  label={activeTabCountsByJob[jobId] || group.apps.length}
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
              </ListItemButton>
              {group.apps.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  isSelected={selectedApplicationId === app.id}
                  onSelect={onSelectApplication}
                  showJobTitle={false}
                  statusColors={STATUS_COLORS}
                  showQuickActions
                  onAccept={onQuickAccept}
                  onReject={onQuickReject}
                  onMessage={onQuickMessage}
                />
              ))}
            </Box>
          ));
        })()}
    </Box>
  );
}

function ApplicationReviewDialog({
  open,
  updating,
  isMobile,
  actionType,
  workerName,
  feedback,
  onClose,
  onFeedbackChange,
  onConfirm,
}) {
  const quickRejectReasons = [
    'Budget does not match project scope',
    'Timeline is not a fit',
    'Skills do not fully match requirements',
    'Proposal details are incomplete',
  ];

  return (
    <Dialog
      open={open}
      onClose={() => !updating && onClose()}
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
          <strong>{actionType === 'accepted' ? 'accept' : 'reject'}</strong> the
          application from <strong>{workerName}</strong>.
        </Typography>
        {actionType === 'rejected' && (
          <>
            <TextField
              label="Feedback (Optional)"
              multiline
              rows={4}
              fullWidth
              value={feedback}
              onChange={(e) => onFeedbackChange(e.target.value)}
              sx={{ mt: 2 }}
            />
            <Box
              sx={{ mt: 1.25, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}
            >
              {quickRejectReasons.map((reason) => (
                <Chip
                  key={reason}
                  size="small"
                  label={reason}
                  onClick={() => {
                    if (!feedback.trim()) {
                      onFeedbackChange(reason);
                      return;
                    }

                    if (!feedback.includes(reason)) {
                      onFeedbackChange(`${feedback.trim()}\n- ${reason}`);
                    }
                  }}
                  variant="outlined"
                />
              ))}
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ minHeight: 44 }}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
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
  );
}

function ApplicationDetailPanel({
  app,
  onAccept,
  onReject,
  onMessage,
  isMobile,
  selectedIndex,
  totalCount,
  canSelectPrevious,
  canSelectNext,
  onSelectPrevious,
  onSelectNext,
  onViewJob,
  navigate,
}) {
  const theme = useTheme();
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {selectedIndex >= 0
            ? `Application ${selectedIndex + 1} of ${totalCount}`
            : `Application list (${totalCount})`}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Previous application">
            <span>
              <IconButton
                size="small"
                onClick={onSelectPrevious}
                disabled={!canSelectPrevious}
                aria-label="Previous application"
              >
                <NavigateBefore fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Next application">
            <span>
              <IconButton
                size="small"
                onClick={onSelectNext}
                disabled={!canSelectNext}
                aria-label="Next application"
              >
                <NavigateNext fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {!isMobile && (
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ display: 'block', mb: 1.5 }}
        >
          Shortcuts: Left/Right to switch, A to accept, R to reject, M to
          message.
        </Typography>
      )}

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
              '&:hover': app.workerId ? { textDecoration: 'underline' } : {},
            }}
            onClick={() => app.workerId && navigate(`/workers/${app.workerId}`)}
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
            label={formatStatusLabel(app.status)}
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
                {formatGhanaCurrencyLabel(app.proposedRate)}
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
          {app.createdAt &&
            Number.isFinite(new Date(app.createdAt).getTime()) && (
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
          display: { xs: 'none', sm: 'flex' },
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

function NoStandardJobsPanel({
  hasBiddingJobs,
  onGoToJobs,
  onPostJob,
  onFindTalent,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: (t) => `1px solid ${t.palette.divider}`,
        borderRadius: 2,
        p: { xs: 2.5, md: 4 },
        textAlign: 'center',
      }}
    >
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
      <Typography variant="h6" fontWeight={700} gutterBottom>
        {hasBiddingJobs
          ? 'No standard applications to review yet'
          : 'No applications yet'}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ maxWidth: 520, mx: 'auto', mb: 3 }}
      >
        {hasBiddingJobs
          ? 'You currently have bid-based jobs. Review those from job management, or post a standard job to receive direct applications in this view.'
          : 'Workers will appear here after they apply to your posted jobs. Start by posting a clear job or inviting talent.'}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <Button variant="contained" onClick={onGoToJobs} sx={{ minHeight: 44 }}>
          Go to Job Management
        </Button>
        <Button variant="outlined" onClick={onPostJob} sx={{ minHeight: 44 }}>
          Post a Job
        </Button>
        <Button
          variant="text"
          onClick={onFindTalent}
          sx={{ minHeight: 44, textTransform: 'none' }}
        >
          Browse Talent
        </Button>
      </Box>
    </Paper>
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
            onClick={() => navigate('/hirer/find-talents')}
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
