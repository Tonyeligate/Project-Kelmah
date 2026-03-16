/**
 * getCurrentPageInfo — maps the current pathname to page metadata
 * used by the Header for mobile page titles and back-button logic.
 */
import {
  Dashboard as DashboardIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Message as MessageIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Wallet as WalletIcon,
  Settings as SettingsIcon,
  Engineering as EngineeringIcon,
} from '@mui/icons-material';

const PAGE_MAP = [
  { match: '/dashboard', name: 'Dashboard', icon: DashboardIcon, back: false },
  { match: '/jobs', name: 'Jobs', icon: WorkIcon, back: true },
  { match: '/contracts', name: 'Contracts', icon: BusinessIcon, back: true },
  { match: '/messages', name: 'Messages', icon: MessageIcon, back: true },
  { match: '/chat', name: 'Messages', icon: MessageIcon, back: true },
  { match: '/notifications', name: 'Notifications', icon: NotificationsIcon, back: true },
  { match: '/profile', name: 'Profile', icon: PersonIcon, back: true },
  { match: '/wallet', name: 'Wallet', icon: WalletIcon, back: true },
  { match: '/settings', name: 'Settings', icon: SettingsIcon, back: true },
  { match: '/login', name: 'Sign In', icon: PersonIcon, back: false },
  { match: '/register', name: 'Get Started', icon: PersonIcon, back: false },
];

const FALLBACK = { name: 'Kelmah', icon: EngineeringIcon, showBackButton: false };

export default function getCurrentPageInfo(pathname) {
  const entry = PAGE_MAP.find((p) => pathname.includes(p.match));
  if (!entry) return FALLBACK;
  return { name: entry.name, icon: entry.icon, showBackButton: entry.back };
}
