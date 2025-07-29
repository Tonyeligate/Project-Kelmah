/**
 * Kelmah Design System - Component Exports
 * Central export point for all design system components
 */

// Layout Components
export { default as Container, PageContainer, ContentContainer, SectionContainer, CompactContainer, FluidContainer } from './Layout/Container';
export { default as Grid, GridItem, Flex, Stack, Inline, Center, Spacer, TwoColumnLayout, ThreeColumnLayout } from './Layout/Grid';
export { default as PageLayout, DashboardLayout, ContentLayout, AuthLayout, LandingLayout } from './Layout/PageLayout';

// UI Components (to be created)
export { default as Button } from './UI/Button';
export { default as Card } from './UI/Card';
export { default as Typography } from './UI/Typography';
export { default as Input } from './UI/Input';
export { default as Badge } from './UI/Badge';
export { default as Avatar } from './UI/Avatar';
export { default as Modal } from './UI/Modal';
export { default as Tooltip } from './UI/Tooltip';
export { default as Loader } from './UI/Loader';

// Navigation Components
export { default as Header } from './Navigation/Header';
export { default as Sidebar } from './Navigation/Sidebar';
export { default as Breadcrumb } from './Navigation/Breadcrumb';
export { default as Tabs } from './Navigation/Tabs';

// Form Components
export { default as FormField } from './Forms/FormField';
export { default as FormGroup } from './Forms/FormGroup';
export { default as FormSection } from './Forms/FormSection';

// Feedback Components
export { default as Alert } from './Feedback/Alert';
export { default as Toast } from './Feedback/Toast';
export { default as EmptyState } from './Feedback/EmptyState';

// Data Display Components
export { default as Table } from './DataDisplay/Table';
export { default as List } from './DataDisplay/List';
export { default as Stats } from './DataDisplay/Stats';

// Foundations
export * from '../foundations/colors';
export * from '../foundations/typography';
export * from '../foundations/spacing';

// Theme
export { darkTheme, lightTheme, getThemeColor, createCustomTheme } from '../theme'; 