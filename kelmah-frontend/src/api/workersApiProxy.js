/**
 * Workaround for the require is not defined error
 * This file exports the workers API without using require
 */

import mockWorkersApi from './services/mockWorkersApi';
import workersApi from './services/workersApi';

// Export the appropriate API based on mock mode
const USE_MOCK_MODE = true;
export default USE_MOCK_MODE ? mockWorkersApi : workersApi;
