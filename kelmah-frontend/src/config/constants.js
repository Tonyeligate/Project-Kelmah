// API Configuration
export const API_BASE_URL = 'http://localhost:8080/api';

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'kelmah_token',
  USER: 'kelmah_user',
  THEME: 'kelmah_theme',
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  FIND_TALENTS: '/find-talents',
  WORKER_PROFILE: '/worker-profile/:id',
  REVIEWS: '/reviews/:id',
  MESSAGES: '/messages',
  POST_JOB: '/post-job',
  JOBS: '/jobs',
  JOB_DETAILS: '/jobs/:id',
};

// Form validation
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  MAX_ATTACHMENT_COUNT: 5,
};

// User roles
export const USER_ROLES = {
  HIRER: 'hirer',
  WORKER: 'worker',
  ADMIN: 'admin',
};

// Job types
export const JOB_TYPES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'Landscaping',
  'Cleaning',
  'Moving',
  'Repairs',
  'Roofing',
  'HVAC',
  'Tiling',
  'Flooring',
  'Other',
];

// Worker strengths
export const WORKER_STRENGTHS = [
  'Reliable',
  'Punctual',
  'Quality Work',
  'Fair Pricing',
  'Good Communication',
  'Fast Service',
  'Clean Work Area',
  'Problem Solver',
  'Knowledgeable',
  'Attention to Detail',
];

// Message types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  ATTACHMENT: 'attachment',
  SYSTEM: 'system',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,
};

// Timeouts
export const TIMEOUTS = {
  API_REQUEST: 30000, // 30 seconds
  DEBOUNCE: 300, // 300ms
  TOAST: 5000, // 5 seconds
};

// Theme colors
export const COLORS = {
  PRIMARY: '#000000',
  SECONDARY: '#FFD700',
  ACCENT: '#FFDB58',
  BACKGROUND: '#FFFFFF',
  ERROR: '#FF5252',
  WARNING: '#FFC107',
  SUCCESS: '#4CAF50',
  TEXT_PRIMARY: '#000000',
  TEXT_SECONDARY: '#757575',
  TEXT_DISABLED: '#9E9E9E',
};

// Pagination
export const ITEMS_PER_PAGE = 10;

// File upload limits
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// Message attachment limits
export const MAX_ATTACHMENTS = 5;

// Worker categories
export const WORKER_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'Landscaping',
  'Cleaning',
  'Moving',
  'HVAC',
  'Roofing',
  'Flooring',
  'General Contracting',
  'Masonry',
  'Welding',
  'Automotive',
  'Computer Repair',
  'Appliance Repair',
  'Handyman',
];

// Job statuses
export const JOB_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed',
};

// Review strengths
export const REVIEW_STRENGTHS = [
  'Quality Work',
  'Timeliness',
  'Communication',
  'Value',
  'Professionalism',
  'Expertise',
  'Reliability',
  'Cleanliness',
  'Attention to Detail',
  'Problem Solving',
]; 