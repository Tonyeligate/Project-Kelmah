import React, { useEffect } from 'react';
import { Box, Container, Typography, Alert, Button, useTheme, useMediaQuery } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../../auth/services/authSlice';
import WorkerSearch from '../components/WorkerSearch';
import { Helmet } from 'react-helmet-async';
import WorkerDirectoryExperience from '../../search/components/WorkerDirectoryExperience';

const WorkerSearchPage = () => {
  return (
    <WorkerDirectoryExperience
      variant="hirer"
      basePath="/hirer/find-talent"
      seoTitle="Find Talent | Kelmah"
      seoDescription="Search, compare, and shortlist skilled workers for your next job on Kelmah."
      showHero={false}
    />
  );
};

export default WorkerSearchPage;
