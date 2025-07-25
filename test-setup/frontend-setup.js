// Mock console
console.error = jest.fn();
console.warn = jest.fn();
console.log = jest.fn();

// Mock browser objects
if (typeof window !== 'undefined') {
  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(),
  };
  
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  
  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Global test timeouts
jest.setTimeout(10000);

// Console error handling to catch React warnings and errors
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filter out specific React warning errors that might clutter test output
  if (
    /Warning: ReactDOM.render is no longer supported in React 18/.test(args[0]) ||
    /Warning: Failed prop type/.test(args[0])
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Mock MUI styles to avoid theming dependencies
jest.mock('@mui/material/styles', () => {
  const React = require('react');
  return {
    styled: (Component) => (props) => React.createElement('div', props, props.children),
    alpha: (color, amount) => color,
  };
});

// Mock MUI Material components to avoid theming dependencies
jest.mock('@mui/material', () => {
  const React = require('react');
  // Stub MUI components
  return {
    Box: ({ children, ...props }) => React.createElement('div', props, children),
    Typography: ({ children, ...props }) => React.createElement('div', props, children),
    Button: ({ children, ...props }) => React.createElement('button', props, children),
    TextField: ({ label, name, ...props }) => React.createElement('input', { 'aria-label': label, name, ...props }),
    Container: ({ children, ...props }) => React.createElement('div', props, children),
    Avatar: ({ alt, src, ...props }) => React.createElement('img', { alt, src, ...props }),
    Modal: ({ children, open, ...props }) => open ? React.createElement('div', props, children) : null,
    Pagination: ({ count, page, onChange, ...props }) => {
      const buttons = [];
      for (let i = 1; i <= count; i++) {
        buttons.push(
          React.createElement('button', { key: i, onClick: e => onChange(e, i) }, String(i))
        );
      }
      return React.createElement('div', props, buttons);
    },
    Rating: ({ value }) => React.createElement('span', null, `Rating: ${value}`),
    Stack: ({ children, ...props }) => React.createElement('div', props, children),
    Paper: ({ children, ...props }) => React.createElement('div', props, children),
    Divider: props => React.createElement('hr', props),
    Snackbar: ({ children, open }) => open ? React.createElement('div', null, children) : null,
    Alert: ({ children }) => React.createElement('div', null, children),
    LinearProgress: props => React.createElement('progress', props),
    IconButton: ({ children, ...props }) => React.createElement('button', props, children),
    CircularProgress: props => React.createElement('div', props, 'loading'),
    Tooltip: ({ children, ...props }) => React.createElement('div', props, children),
    Badge: ({ children, ...props }) => React.createElement('div', props, children),
    Dialog: ({ children, open, ...props }) => open ? React.createElement('div', props, children) : null,
    DialogTitle: ({ children, ...props }) => React.createElement('div', props, children),
    DialogContent: ({ children, ...props }) => React.createElement('div', props, children),
    DialogActions: ({ children, ...props }) => React.createElement('div', props, children),
    List: ({ children, ...props }) => React.createElement('ul', props, children),
    ListItem: ({ children, ...props }) => React.createElement('li', props, children),
    ListItemText: ({ primary, secondary, ...props }) => React.createElement('div', props, [primary, secondary]),
    ListItemIcon: ({ children, ...props }) => React.createElement('span', props, children),
    ListItemSecondaryAction: ({ children, ...props }) => React.createElement('div', props, children),
    AppBar: ({ children, ...props }) => React.createElement('nav', props, children),
    Toolbar: ({ children, ...props }) => React.createElement('div', props, children),
  };
});

// Stub MUI private-theming to avoid ThemeProvider dependency
jest.mock('@mui/private-theming', () => {
  const React = require('react');
  return {
    ThemeProvider: React.Fragment,
    useTheme: () => ({}),
  };
});

// Stub react-router-dom globally to avoid useNavigate and Router errors
jest.mock('react-router-dom', () => {
  const React = require('react');
  const original = jest.requireActual('react-router-dom');
  return {
    ...original,
    MemoryRouter: ({ children }) => React.createElement(React.Fragment, null, children),
    BrowserRouter: ({ children }) => React.createElement(React.Fragment, null, children),
    useNavigate: () => () => {},
    Link: ({ children, ...props }) => React.createElement('a', props, children),
    useLocation: () => ({ state: {} }),
  };
});

// Stub MUI icons to avoid icon import errors
jest.mock('@mui/icons-material', () => {
  const React = require('react');
  return {
    Visibility: () => React.createElement('span'),
    VisibilityOff: () => React.createElement('span'),
    LockOutlined: () => React.createElement('span'),
    EmailOutlined: () => React.createElement('span'),
    Google: () => React.createElement('span'),
    LinkedIn: () => React.createElement('span'),
    Star: () => React.createElement('span'),
    Send: () => React.createElement('span'),
    AttachFile: () => React.createElement('span'),
    Close: () => React.createElement('span'),
    Image: () => React.createElement('span'),
    InsertDriveFile: () => React.createElement('span'),
  };
});

// Mock subpath icon imports
['Close','Send','AttachFile','Image','InsertDriveFile'].forEach(name => {
  jest.mock(`@mui/icons-material/${name}`, () => {
    const React = require('react');
    return () => React.createElement('span');
  });
});

// Stub MUI subpath imports
jest.mock('@mui/material/Grid', () => require('@mui/material').Grid);
jest.mock('@mui/material/Skeleton', () => require('@mui/material').Skeleton);
jest.mock('@mui/material/CircularProgress', () => require('@mui/material').CircularProgress);

// Stub @mui/material/Pagination to use our stubbed Pagination
jest.mock('@mui/material/Pagination', () => {
  const { Pagination } = require('@mui/material');
  return { __esModule: true, default: Pagination };
}); 