/**
 * Theme validation utility for ensuring consistent design across the job system
 */

// Color validation
export const validateColors = (element, expectedColors) => {
  const errors = [];

  if (element.color && !expectedColors.includes(element.color)) {
    errors.push(
      `Invalid color: ${element.color}. Expected one of: ${expectedColors.join(', ')}`,
    );
  }

  if (element.bgcolor && !expectedColors.includes(element.bgcolor)) {
    errors.push(
      `Invalid background color: ${element.bgcolor}. Expected one of: ${expectedColors.join(', ')}`,
    );
  }

  return errors;
};

// Typography validation
export const validateTypography = (element, expectedVariants) => {
  const errors = [];

  if (element.variant && !expectedVariants.includes(element.variant)) {
    errors.push(
      `Invalid typography variant: ${element.variant}. Expected one of: ${expectedVariants.join(', ')}`,
    );
  }

  if (
    element.fontSize &&
    typeof element.fontSize === 'string' &&
    !element.fontSize.includes('rem')
  ) {
    errors.push(`Font size should be in rem units: ${element.fontSize}`);
  }

  return errors;
};

// Spacing validation
export const validateSpacing = (element, expectedSpacing) => {
  const errors = [];

  Object.keys(element).forEach((key) => {
    if (
      key.includes('padding') ||
      key.includes('margin') ||
      key.includes('gap')
    ) {
      const value = element[key];
      if (typeof value === 'number' && !expectedSpacing.includes(value)) {
        errors.push(
          `Invalid spacing value: ${key}=${value}. Expected one of: ${expectedSpacing.join(', ')}`,
        );
      }
    }
  });

  return errors;
};

// Breakpoint validation
export const validateBreakpoints = (element) => {
  const errors = [];
  const validBreakpoints = ['xs', 'sm', 'md', 'lg', 'xl'];

  Object.keys(element).forEach((key) => {
    if (validBreakpoints.includes(key)) {
      // Valid breakpoint
    } else if (
      key.includes('xs') ||
      key.includes('sm') ||
      key.includes('md') ||
      key.includes('lg') ||
      key.includes('xl')
    ) {
      // Check if it's a valid responsive property
      const breakpoint = key.match(/(xs|sm|md|lg|xl)/)?.[0];
      if (breakpoint && !validBreakpoints.includes(breakpoint)) {
        errors.push(`Invalid breakpoint: ${key}`);
      }
    }
  });

  return errors;
};

// Component-specific validation
export const validateJobCard = (props) => {
  const errors = [];

  // Validate required props
  if (!props.job) {
    errors.push('JobCard requires a job prop');
  }

  // Validate job structure
  if (props.job) {
    const requiredFields = ['id', 'title', 'description'];
    requiredFields.forEach((field) => {
      if (!props.job[field]) {
        errors.push(`JobCard job prop missing required field: ${field}`);
      }
    });
  }

  return errors;
};

export const validateJobPage = (props) => {
  const errors = [];

  // Validate responsive design
  if (props.sx) {
    const spacingErrors = validateSpacing(props.sx, [0.5, 1, 1.5, 2, 3, 4, 6]);
    errors.push(...spacingErrors);

    const breakpointErrors = validateBreakpoints(props.sx);
    errors.push(...breakpointErrors);
  }

  return errors;
};

// Theme consistency checker
export const checkThemeConsistency = (components) => {
  const allErrors = [];

  components.forEach((component, index) => {
    const componentErrors = [];

    // Check colors
    const colorErrors = validateColors(component, [
      '#D4AF37',
      '#FFD700',
      '#B8941F', // Gold variations
      '#1a1a1a',
      '#2d2d2d',
      '#0a0a0a', // Black variations
      '#ffffff',
      'rgba(255,255,255,0.7)',
      'rgba(255,255,255,0.5)', // White variations
      '#4CAF50',
      '#FF9800',
      '#F44336',
      '#2196F3', // Status colors
    ]);
    componentErrors.push(...colorErrors);

    // Check typography
    const typographyErrors = validateTypography(component, [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'body1',
      'body2',
      'caption',
      'button',
    ]);
    componentErrors.push(...typographyErrors);

    // Check spacing
    const spacingErrors = validateSpacing(component, [0.5, 1, 1.5, 2, 3, 4, 6]);
    componentErrors.push(...spacingErrors);

    if (componentErrors.length > 0) {
      allErrors.push({
        component: `Component ${index}`,
        errors: componentErrors,
      });
    }
  });

  return allErrors;
};

// Auto-fix common theme issues
export const autoFixThemeIssues = (component) => {
  const fixes = [];

  // Fix common color issues
  if (component.color === '#gold') {
    component.color = '#D4AF37';
    fixes.push('Fixed gold color reference');
  }

  if (component.bgcolor === '#black') {
    component.bgcolor = '#1a1a1a';
    fixes.push('Fixed black background color reference');
  }

  // Fix common spacing issues
  if (component.padding === 16) {
    component.padding = 2;
    fixes.push('Fixed padding value to use theme spacing');
  }

  if (component.margin === 24) {
    component.margin = 3;
    fixes.push('Fixed margin value to use theme spacing');
  }

  // Fix common typography issues
  if (component.fontSize === '16px') {
    component.fontSize = '1rem';
    fixes.push('Fixed font size to use rem units');
  }

  return fixes;
};

// Theme compliance report
export const generateThemeReport = (components) => {
  const errors = checkThemeConsistency(components);
  const totalComponents = components.length;
  const componentsWithErrors = errors.length;
  const complianceRate =
    ((totalComponents - componentsWithErrors) / totalComponents) * 100;

  return {
    totalComponents,
    componentsWithErrors,
    complianceRate: Math.round(complianceRate * 100) / 100,
    errors,
    recommendations: [
      'Use theme colors consistently across all components',
      'Implement responsive design with proper breakpoints',
      'Use theme spacing values instead of hardcoded pixels',
      'Ensure typography follows the established scale',
      'Test components on different screen sizes',
    ],
  };
};

export default {
  validateColors,
  validateTypography,
  validateSpacing,
  validateBreakpoints,
  validateJobCard,
  validateJobPage,
  checkThemeConsistency,
  autoFixThemeIssues,
  generateThemeReport,
};
