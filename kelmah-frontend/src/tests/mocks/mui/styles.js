import React from 'react';

// Stub MUI styles
export const ThemeProvider = ({ children }) => React.createElement(React.Fragment, null, children);
export const createTheme = () => ({});
export const useTheme = () => ({});
export const styled = (component) => (props) => React.createElement(component, props);
export const alpha = (color, value) => color; 