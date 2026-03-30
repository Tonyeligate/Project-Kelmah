import {
  AppBar,
  Box,
  Typography,
  IconButton,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  Button,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { BRAND_COLORS, KELMAH_FOCUS_RING } from '../../../../theme';
import { Z_INDEX } from '../../../../constants/layout';

export const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background:
    theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(26, 26, 26, 0.95) 100%)`
      : `linear-gradient(135deg, rgba(255, 215, 0, 0.95) 0%, rgba(255, 193, 7, 0.95) 100%)`,
  backdropFilter: 'blur(20px)',
  borderBottom:
    theme.palette.mode === 'dark'
      ? `2px solid rgba(255, 215, 0, 0.5)`
      : `2px solid rgba(0, 0, 0, 0.3)`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 8px 32px rgba(0, 0, 0, 0.9)'
      : '0 6px 25px rgba(0, 0, 0, 0.25)',
  zIndex: Z_INDEX.header,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}));

export const BrandLogo = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:focus-visible': {
    outline: `3px solid ${theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black}`,
    outlineOffset: 3,
    borderRadius: 8,
  },
  '&:hover': {
    transform: 'scale(1.02)',
  },
}));

export const LogoIcon = styled(Box)(({ theme }) => ({
  width: 48,
  height: 48,
  borderRadius: '50%',
  background:
    theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${BRAND_COLORS.gold} 0%, ${BRAND_COLORS.goldLight} 100%)`
      : `linear-gradient(135deg, ${BRAND_COLORS.black} 0%, ${BRAND_COLORS.blackLight} 100%)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: theme.spacing(1.5),
  color: theme.palette.mode === 'dark' ? BRAND_COLORS.black : BRAND_COLORS.gold,
  fontWeight: 800,
  fontSize: '1.5rem',
  fontFamily: 'Montserrat, sans-serif',
  boxShadow:
    theme.palette.mode === 'dark'
      ? `0 4px 15px rgba(255, 215, 0, 0.4)`
      : `0 4px 15px rgba(0, 0, 0, 0.3)`,
  position: 'relative',
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    width: 36,
    height: 36,
    marginRight: theme.spacing(0.5),
    fontSize: '1.1rem',
  },
  '@media (max-width: 899px)': {
    width: 36,
    height: 36,
    marginRight: 4,
    fontSize: '1rem',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      theme.palette.mode === 'dark'
        ? `linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%)`
        : `linear-gradient(45deg, transparent 30%, rgba(255, 215, 0, 0.3) 50%, transparent 70%)`,
    transform: 'translateX(-100%)',
    transition: 'transform 0.6s ease',
  },
  '&:hover::before': {
    transform: 'translateX(100%)',
  },
}));

export const BrandText = styled(Typography)(({ theme }) => ({
  fontWeight: 800,
  fontFamily: 'Montserrat, sans-serif',
  fontSize: '1.75rem',
  background:
    theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${BRAND_COLORS.gold} 0%, ${BRAND_COLORS.goldLight} 100%)`
      : `linear-gradient(135deg, ${BRAND_COLORS.black} 0%, ${BRAND_COLORS.blackLight} 100%)`,
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  textShadow:
    theme.palette.mode === 'dark'
      ? '0 2px 10px rgba(255, 215, 0, 0.3)'
      : '0 2px 10px rgba(0, 0, 0, 0.2)',
  letterSpacing: '-0.02em',
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.4rem',
  },
  '@media (max-width: 899px)': {
    fontSize: '1.2rem',
    fontWeight: 700,
  },
  '@media (forced-colors: active)': {
    background: 'none',
    WebkitTextFillColor: 'CanvasText',
    color: 'CanvasText',
    textShadow: 'none',
  },
}));

export const TaglineText = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color:
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.8)'
      : 'rgba(0, 0, 0, 0.9)',
  fontWeight: 500,
  marginTop: '-2px',
  letterSpacing: '0.5px',
  [theme.breakpoints.down('md')]: {
    fontSize: '0.65rem',
  },
  [theme.breakpoints.down('sm')]: {
    display: 'none',
  },
}));

export const ActionButton = styled(IconButton)(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(255, 215, 0, 0.1)'
      : 'rgba(0, 0, 0, 0.1)',
  color: theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
  border:
    theme.palette.mode === 'dark'
      ? `1px solid rgba(255, 215, 0, 0.36)`
      : `1px solid rgba(0, 0, 0, 0.36)`,
  margin: theme.spacing(0, 0.5),
  minWidth: 44,
  minHeight: 44,
  width: 44,
  height: 44,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:focus-visible': {
    outline:
      theme.palette.mode === 'dark'
        ? KELMAH_FOCUS_RING.dark
        : KELMAH_FOCUS_RING.light,
    outlineOffset: '3px',
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 0 0 4px rgba(255, 215, 0, 0.18)'
        : '0 0 0 4px rgba(0, 0, 0, 0.12)',
  },
  [theme.breakpoints.down('sm')]: {
    margin: theme.spacing(0, 0.5),
    padding: theme.spacing(1),
    minWidth: 44,
    width: 44,
    height: 44,
    '& .MuiSvgIcon-root': {
      fontSize: '1.25rem',
    },
  },
  '&:hover': {
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(255, 215, 0, 0.2)'
        : 'rgba(0, 0, 0, 0.15)',
    transform: 'translateY(-1px) scale(1.05)',
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 4px 15px rgba(255, 215, 0, 0.3)'
        : '0 4px 15px rgba(0, 0, 0, 0.2)',
  },
  '&:active': {
    transform: 'translateY(0) scale(1)',
  },
  '@media (forced-colors: active)': {
    border: '1px solid ButtonText',
    color: 'ButtonText',
    backgroundColor: 'ButtonFace',
  },
}));

export const UserAvatar = styled(Avatar)(({ theme }) => ({
  width: 40,
  height: 40,
  backgroundColor:
    theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
  color: theme.palette.mode === 'dark' ? BRAND_COLORS.black : BRAND_COLORS.gold,
  fontWeight: 700,
  fontSize: '1rem',
  border:
    theme.palette.mode === 'dark'
      ? `2px solid rgba(255, 215, 0, 0.3)`
      : `2px solid rgba(0, 0, 0, 0.3)`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  [theme.breakpoints.down('sm')]: {
    width: 36,
    height: 36,
    fontSize: '0.9rem',
    border:
      theme.palette.mode === 'dark'
        ? `1.5px solid rgba(255, 215, 0, 0.3)`
        : `1.5px solid rgba(0, 0, 0, 0.3)`,
  },
  '&:hover': {
    transform: 'scale(1.1)',
    border:
      theme.palette.mode === 'dark'
        ? `2px solid ${BRAND_COLORS.gold}`
        : `2px solid ${BRAND_COLORS.black}`,
    boxShadow:
      theme.palette.mode === 'dark'
        ? `0 4px 15px rgba(255, 215, 0, 0.4)`
        : `0 4px 15px rgba(0, 0, 0, 0.3)`,
  },
  '&:focus-visible': {
    outline:
      theme.palette.mode === 'dark'
        ? KELMAH_FOCUS_RING.dark
        : KELMAH_FOCUS_RING.light,
    outlineOffset: 3,
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 0 0 4px rgba(255, 215, 0, 0.18)'
        : '0 0 0 4px rgba(0, 0, 0, 0.12)',
  },
}));

export const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: theme.palette.mode === 'dark' ? '#FACC15' : '#111111',
    color: theme.palette.mode === 'dark' ? '#101010' : '#FFFFFF',
    fontWeight: 600,
    fontSize: '0.72rem',
    minWidth: 20,
    height: 20,
    border: `2px solid ${theme.palette.background.paper}`,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
    letterSpacing: '0.01em',
  },
}));

export const ThemeMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: 12,
    marginTop: theme.spacing(1.5),
    minWidth: 220,
    border:
      theme.palette.mode === 'dark'
        ? `1px solid rgba(255,215,0,0.3)`
        : `1px solid rgba(0,0,0,0.15)`,
    backgroundColor:
      theme.palette.mode === 'dark'
        ? BRAND_COLORS.blackMedium
        : theme.palette.background.paper,
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 12px 32px rgba(0,0,0,0.7)'
        : '0 10px 30px rgba(0,0,0,0.18)',
  },
}));

export const ThemeOption = styled(MenuItem)(({ theme, active }) => ({
  borderRadius: 10,
  margin: theme.spacing(0.5, 1),
  padding: theme.spacing(1.2, 1.5),
  border:
    active &&
    (theme.palette.mode === 'dark'
      ? `1px solid rgba(255,215,0,0.5)`
      : `1px solid rgba(0,0,0,0.25)`),
  backgroundColor:
    active &&
    (theme.palette.mode === 'dark'
      ? 'rgba(255,215,0,0.12)'
      : 'rgba(0,0,0,0.05)'),
  '&:hover': {
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(255,215,0,0.18)'
        : 'rgba(0,0,0,0.08)',
  },
}));

export const AuthButton = styled(Button)(({ theme, variant }) => ({
  borderRadius: 8,
  textTransform: 'none',
  fontWeight: 600,
  padding: '8px 20px',
  minHeight: 44,
  fontSize: '0.9rem',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:focus-visible': {
    outline: `3px solid ${theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black}`,
    outlineOffset: 3,
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 0 0 4px rgba(255, 215, 0, 0.18)'
        : '0 0 0 4px rgba(0, 0, 0, 0.12)',
  },
  [theme.breakpoints.down('sm')]: {
    padding: '6px 12px',
    fontSize: '0.8rem',
    minWidth: 'auto',
    minHeight: 44,
  },
  ...(variant === 'outlined' && {
    borderColor:
      theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
    color:
      theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
    borderWidth: '2px',
    '&:hover': {
      borderColor:
        theme.palette.mode === 'dark'
          ? BRAND_COLORS.goldLight
          : BRAND_COLORS.blackLight,
      backgroundColor:
        theme.palette.mode === 'dark'
          ? 'rgba(255, 215, 0, 0.1)'
          : 'rgba(0, 0, 0, 0.08)',
      transform: 'translateY(-1px)',
      borderWidth: '2px',
    },
  }),
  ...(variant === 'contained' && {
    background:
      theme.palette.mode === 'dark'
        ? `linear-gradient(135deg, ${BRAND_COLORS.gold} 0%, ${BRAND_COLORS.goldLight} 100%)`
        : `linear-gradient(135deg, ${BRAND_COLORS.black} 0%, ${BRAND_COLORS.blackLight} 100%)`,
    color:
      theme.palette.mode === 'dark' ? BRAND_COLORS.black : BRAND_COLORS.gold,
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 4px 15px rgba(255, 215, 0, 0.3)'
        : '0 4px 15px rgba(0, 0, 0, 0.3)',
    '&:hover': {
      background:
        theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, ${BRAND_COLORS.goldLight} 0%, ${BRAND_COLORS.gold} 100%)`
          : `linear-gradient(135deg, ${BRAND_COLORS.blackLight} 0%, ${BRAND_COLORS.black} 100%)`,
      boxShadow:
        theme.palette.mode === 'dark'
          ? '0 6px 20px rgba(255, 215, 0, 0.4)'
          : '0 6px 20px rgba(0, 0, 0, 0.4)',
      transform: 'translateY(-2px)',
    },
  }),
}));

export const StatusIndicator = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'online',
})(({ theme, online }) => ({
  position: 'absolute',
  bottom: 2,
  right: 2,
  width: 10,
  height: 10,
  borderRadius: '50%',
  backgroundColor: online ? '#4caf50' : '#f44336',
  border: `2px solid ${theme.palette.background.paper}`,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
}));
