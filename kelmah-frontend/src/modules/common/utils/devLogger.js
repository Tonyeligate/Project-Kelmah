const isFeatureDebugEnabled = (flagName) =>
  import.meta.env.DEV && import.meta.env[flagName] === 'true';

const resolveConsoleMethod = (level) => {
  if (typeof console === 'undefined' || typeof console[level] !== 'function') {
    return null;
  }
  return console[level].bind(console);
};

export const createDevLogger = (enabled, level = 'log') => {
  const logMethod = resolveConsoleMethod(level);
  return (...args) => {
    if (enabled && logMethod) {
      logMethod(...args);
    }
  };
};

export const createFeatureLogger = ({
  flagName = 'VITE_DEBUG_FRONTEND',
  level = 'log',
} = {}) => createDevLogger(isFeatureDebugEnabled(flagName), level);

export const devLog = createFeatureLogger({ level: 'log' });
export const devInfo = createFeatureLogger({ level: 'info' });
export const devWarn = createFeatureLogger({ level: 'warn' });
export const devError = createFeatureLogger({ level: 'error' });
export const devDebug = createFeatureLogger({ level: 'debug' });
