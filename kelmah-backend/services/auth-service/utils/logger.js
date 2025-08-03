// Logger utility with consistent interface
const logger = {
  error: console.error.bind(console),
  warn: console.warn.bind(console),
  info: console.log.bind(console),
  debug: console.log.bind(console),
};

module.exports = logger;
