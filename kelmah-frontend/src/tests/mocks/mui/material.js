import React from 'react';

// Stub MUI components
export const Box = ({ children, ...props }) =>
  React.createElement('div', props, children);
export const Button = ({ children, ...props }) =>
  React.createElement('button', props, children);
export const TextField = ({ label, ...props }) =>
  React.createElement('input', { 'aria-label': label, ...props });
export const Typography = ({ children, ...props }) =>
  React.createElement('span', props, children);
export const Paper = ({ children, ...props }) =>
  React.createElement('div', props, children);
export const Grid = ({ children, ...props }) =>
  React.createElement('div', props, children);
export const Link = ({ children, ...props }) =>
  React.createElement('a', props, children);
export const Divider = (props) => React.createElement('hr', props);
export const FormControlLabel = ({ label, control, ...props }) =>
  React.createElement('label', props, [label, control]);
export const Checkbox = (props) =>
  React.createElement('input', { type: 'checkbox', ...props });
export const InputAdornment = ({ children, ...props }) =>
  React.createElement('div', props, children);
export const IconButton = ({ children, ...props }) =>
  React.createElement('button', props, children);
export const Alert = ({ children, ...props }) =>
  React.createElement('div', props, children);
export const CircularProgress = (props) => React.createElement('div', props);

// Stub MUI icons
const Icon = (props) => React.createElement('span', props);
export const Visibility = Icon;
export const VisibilityOff = Icon;
export const LockOutlined = Icon;
export const EmailOutlined = Icon;
export const Google = Icon;
export const LinkedIn = Icon;

// Leave Modal to be mocked explicitly in tests
