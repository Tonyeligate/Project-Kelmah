import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Breadcrumbs,
  Link,
  Typography,
  Box,
  useMediaQuery,
} from '@mui/material';
import {
  Home as HomeIcon,
  Work as WorkIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';

const BreadcrumbNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery((muiTheme) => muiTheme.breakpoints.down('sm'));

  // Define breadcrumb mappings
  const getBreadcrumbItems = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const items = [];

    // Always start with home
    items.push({
      label: 'Home',
      path: '/',
      icon: <HomeIcon sx={{ fontSize: 16 }} />,
    });

    // Map path segments to breadcrumb items
    pathSegments.forEach((segment, index) => {
      const currentPath = '/' + pathSegments.slice(0, index + 1).join('/');
      const isLast = index === pathSegments.length - 1;

      switch (segment) {
        case 'jobs':
          items.push({
            label: 'Jobs',
            path: currentPath,
            icon: <WorkIcon sx={{ fontSize: 16 }} />,
            isLast,
          });
          break;
        case 'search':
          items.push({
            label: 'Search',
            path: currentPath,
            icon: <SearchIcon sx={{ fontSize: 16 }} />,
            isLast,
          });
          break;
        case 'worker':
          items.push({
            label: 'Worker Dashboard',
            path: currentPath,
            icon: <PersonIcon sx={{ fontSize: 16 }} />,
            isLast,
          });
          break;
        case 'hirer':
          items.push({
            label: 'Hirer Dashboard',
            path: currentPath,
            icon: <BusinessIcon sx={{ fontSize: 16 }} />,
            isLast,
          });
          break;
        case 'applications':
          items.push({
            label: 'My Applications',
            path: currentPath,
            isLast,
          });
          break;
        case 'dashboard':
          items.push({
            label: 'Dashboard',
            path: currentPath,
            isLast,
          });
          break;
        default:
          // For dynamic segments like job IDs, show a generic label
          if (segment.match(/^[0-9a-fA-F]{24}$/)) {
            items.push({
              label: 'Job Details',
              path: currentPath,
              isLast,
            });
          } else {
            items.push({
              label: segment.charAt(0).toUpperCase() + segment.slice(1),
              path: currentPath,
              isLast,
            });
          }
          break;
      }
    });

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  const visibleItems = isMobile && breadcrumbItems.length > 3
    ? [breadcrumbItems[0], breadcrumbItems[breadcrumbItems.length - 2], breadcrumbItems[breadcrumbItems.length - 1]]
    : breadcrumbItems;

  // Don't show breadcrumbs on home page or if only one item
  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <Box
      sx={{
        py: { xs: 1, sm: 2 },
        px: { xs: 2, sm: 3 },
        bgcolor: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(212,175,55,0.1)',
      }}
    >
      <Breadcrumbs
        separator="›"
        sx={{
          '& .MuiBreadcrumbs-separator': {
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.875rem',
          },
        }}
      >
        {visibleItems.map((item, index) => {
          const { isLast, icon, label, path } = item;

          if (isLast) {
            return (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                {icon}
                <Typography
                  variant="body2"
                  sx={{
                    color: '#D4AF37',
                    fontWeight: 'bold',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  {label}
                </Typography>
              </Box>
            );
          }

          return (
            <Link
              key={index}
              component="button"
              variant="body2"
              onClick={() => navigate(path)}
              aria-label={`Go to ${label}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: 'rgba(255,255,255,0.7)',
                textDecoration: 'none',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                '&:hover': {
                  color: '#D4AF37',
                  textDecoration: 'underline',
                },
                '&:focus': {
                  outline: '2px solid #D4AF37',
                  outlineOffset: '2px',
                  borderRadius: '4px',
                },
              }}
            >
              {icon}
              {label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
};

export default BreadcrumbNavigation;
