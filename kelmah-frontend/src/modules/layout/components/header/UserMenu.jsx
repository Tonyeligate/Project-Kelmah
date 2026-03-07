import React from 'react';
import {
  Menu,
  Box,
  Stack,
  Typography,
  Chip,
  Divider,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
} from '@mui/material';
import { ExitToApp as LogoutIcon } from '@mui/icons-material';
import { UserAvatar, StatusIndicator } from './HeaderStyles';
import NavMenuSection from './NavMenuSection';
import { BRAND_COLORS } from '../../../../theme';

/**
 * UserMenu — the dropdown menu that appears when clicking the user avatar.
 * Extracted from Header.jsx for maintainability.
 *
 * Props:
 *   anchorEl       — Menu anchor element (null when closed)
 *   onClose        — close handler
 *   user           — current user object
 *   menuSections   — array of { title, items } for NavMenuSection
 *   currentPage    — { name } for the "On <Page>" chip
 *   isUserOnline   — boolean
 *   onLogout       — logout handler
 *   onNavigate     — navigation handler (path) => void
 */
const UserMenu = ({
  anchorEl,
  onClose,
  returnFocusRef,
  user,
  menuSections,
  currentPage,
  isUserOnline,
  onLogout,
  onNavigate,
}) => {
  const theme = useTheme();

  const blurInteractiveTarget = (event) => {
    const target = event?.currentTarget;
    if (typeof target?.blur === 'function') {
      target.blur();
    }

    const activeElement = document.activeElement;
    if (activeElement && typeof activeElement.blur === 'function') {
      activeElement.blur();
    }
  };

  const requestClose = (event, { restoreFocus = true, afterClose } = {}) => {
    blurInteractiveTarget(event);

    if (restoreFocus) {
      const focusTarget = returnFocusRef?.current;
      if (typeof focusTarget?.focus === 'function') {
        focusTarget.focus({ preventScroll: true });
      }
    }

    const runClose = () => {
      onClose();
      afterClose?.();
    };

    if (
      typeof window !== 'undefined' &&
      typeof window.requestAnimationFrame === 'function'
    ) {
      window.requestAnimationFrame(runClose);
      return;
    }

    runClose();
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return (
      `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() ||
      user.email?.charAt(0).toUpperCase() ||
      'U'
    );
  };

  const getUserRole = () => (user?.role || 'user');

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={(event) => requestClose(event)}
      disableAutoFocus
      disableEnforceFocus
      disableRestoreFocus
      PaperProps={{
        elevation: 12,
        sx: {
          overflow: 'visible',
          filter: 'drop-shadow(0px 4px 16px rgba(0,0,0,0.2))',
          mt: 1.5,
          borderRadius: 3,
          minWidth: 'min(280px, calc(100vw - 32px))',
          border:
            theme.palette.mode === 'dark'
              ? `1px solid rgba(255, 215, 0, 0.3)`
              : `1px solid rgba(0, 0, 0, 0.2)`,
          backgroundColor:
            theme.palette.mode === 'dark'
              ? BRAND_COLORS.blackMedium
              : BRAND_COLORS.gold,
          '&:before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: 0,
            right: 14,
            width: 10,
            height: 10,
            bgcolor:
              theme.palette.mode === 'dark'
                ? BRAND_COLORS.blackMedium
                : BRAND_COLORS.gold,
            transform: 'translateY(-50%) rotate(45deg)',
            zIndex: 0,
            border:
              theme.palette.mode === 'dark'
                ? `1px solid rgba(255, 215, 0, 0.3)`
                : `1px solid rgba(0, 0, 0, 0.2)`,
            borderBottom: 'none',
            borderRight: 'none',
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      MenuListProps={{
        'aria-label': 'Account menu options',
      }}
    >
      {/* User Info Header */}
      <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ position: 'relative' }}>
            <UserAvatar>{getUserInitials()}</UserAvatar>
            <StatusIndicator online={isUserOnline} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.name || user?.email || 'User'}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {user?.email}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
              <Chip
                label={getUserRole().charAt(0).toUpperCase() + getUserRole().slice(1)}
                size="small"
                sx={{
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 215, 0, 0.15)'
                      : 'rgba(0, 0, 0, 0.1)',
                  color:
                    theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                }}
              />
              <Chip
                label={`On ${currentPage?.name || 'Page'}`}
                size="small"
                variant="outlined"
                sx={{
                  borderColor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 215, 0, 0.3)'
                      : 'rgba(0, 0, 0, 0.3)',
                  color:
                    theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
                  fontSize: '0.65rem',
                  fontWeight: 500,
                }}
              />
              <Chip
                label={isUserOnline ? 'Online' : 'Offline'}
                size="small"
                sx={{
                  backgroundColor: isUserOnline
                    ? 'rgba(76, 175, 80, 0.1)'
                    : 'rgba(244, 67, 54, 0.1)',
                  color: isUserOnline ? '#4caf50' : '#f44336',
                  fontSize: '0.65rem',
                  fontWeight: 500,
                }}
              />
            </Box>
          </Box>
        </Stack>
      </Box>

      {/* Menu Items */}
      {menuSections.map((section) => (
        <NavMenuSection
          key={section.title}
          title={section.title}
          items={section.items}
          onNavigate={(path, event) => {
            requestClose(event, {
              restoreFocus: false,
              afterClose: () =>
                onNavigate(path === '/support' ? '/support/help-center' : path),
            });
          }}
        />
      ))}

      <Divider sx={{ my: 1 }} />

      <MenuItem
        onClick={(event) => {
          requestClose(event, {
            restoreFocus: false,
            afterClose: onLogout,
          });
        }}
        sx={{ py: 1.5, color: 'error.main' }}
      >
        <ListItemIcon>
          <LogoutIcon color="error" />
        </ListItemIcon>
        <ListItemText
          primary="Sign Out"
          primaryTypographyProps={{ fontWeight: 500, color: 'error.main' }}
        />
      </MenuItem>
    </Menu>
  );
};

export default UserMenu;
