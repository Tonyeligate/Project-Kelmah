/**
 * Shared constants for Ghana-specific data
 * Used across job-service, user-service, and other microservices
 */

// All 16 regions of Ghana (as of 2019 administrative divisions)
const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Eastern',
  'Central',
  'Volta',
  'Northern',
  'Upper East',
  'Upper West',
  'Brong-Ahafo',
  'Oti',
  'Bono East',
  'North East',
  'Savannah',
  'Western North',
  'Ahafo'
];

// Standard skill categories for the platform
const PRIMARY_SKILLS = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Construction',
  'Painting',
  'Welding',
  'Masonry',
  'HVAC',
  'Roofing',
  'Flooring'
];

// Default currency
const DEFAULT_CURRENCY = 'GHS';

module.exports = {
  GHANA_REGIONS,
  PRIMARY_SKILLS,
  DEFAULT_CURRENCY
};
