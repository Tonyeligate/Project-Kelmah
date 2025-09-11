// 🔍 Console Error Investigation Tool for Kelmah Platform
// Run this in your browser console to collect and analyze errors

(function() {
  console.clear();
  console.log('🔍 Kelmah Error Investigation Tool Started');
  
  const errors = [];
  const warnings = [];
  const networkErrors = [];
  
  // Capture all JavaScript errors
  window.addEventListener('error', (e) => {
    const error = {
      type: 'JavaScript Error',
      message: e.message,
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
      error: e.error,
      stack: e.error?.stack,
      timestamp: new Date().toISOString()
    };
    errors.push(error);
    console.error('🚨 ERROR CAPTURED:', error);
  });
  
  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (e) => {
    const error = {
      type: 'Unhandled Promise Rejection',
      message: e.reason?.message || e.reason,
      stack: e.reason?.stack,
      timestamp: new Date().toISOString()
    };
    errors.push(error);
    console.error('🚨 PROMISE REJECTION CAPTURED:', error);
  });
  
  // Capture console warnings
  const originalWarn = console.warn;
  console.warn = function(...args) {
    warnings.push({
      type: 'Console Warning',
      message: args.join(' '),
      timestamp: new Date().toISOString()
    });
    originalWarn.apply(console, args);
  };
  
  // Capture network errors by intercepting fetch
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    return originalFetch.apply(this, args)
      .then(response => {
        if (!response.ok) {
          const error = {
            type: 'Network Error',
            url: args[0],
            status: response.status,
            statusText: response.statusText,
            timestamp: new Date().toISOString()
          };
          networkErrors.push(error);
          console.error('🚨 NETWORK ERROR CAPTURED:', error);
        }
        return response;
      })
      .catch(error => {
        const networkError = {
          type: 'Network Error',
          url: args[0],
          message: error.message,
          timestamp: new Date().toISOString()
        };
        networkErrors.push(networkError);
        console.error('🚨 NETWORK ERROR CAPTURED:', networkError);
        throw error;
      });
  };
  
  // Function to analyze and categorize errors
  window.analyzeErrors = function() {
    console.log('\n📊 ERROR ANALYSIS REPORT');
    console.log('========================');
    
    console.log(`\n🔴 Total Errors: ${errors.length}`);
    console.log(`⚠️  Total Warnings: ${warnings.length}`);
    console.log(`🌐 Total Network Errors: ${networkErrors.length}`);
    
    // Categorize JavaScript errors
    const jsErrors = errors.filter(e => e.type === 'JavaScript Error');
    const promiseErrors = errors.filter(e => e.type === 'Unhandled Promise Rejection');
    
    console.log('\n📋 JAVASCRIPT ERRORS:');
    jsErrors.forEach((error, index) => {
      console.log(`\n${index + 1}. ${error.message}`);
      console.log(`   File: ${error.filename}`);
      console.log(`   Line: ${error.lineno}, Column: ${error.colno}`);
      console.log(`   Time: ${error.timestamp}`);
    });
    
    console.log('\n📋 PROMISE REJECTIONS:');
    promiseErrors.forEach((error, index) => {
      console.log(`\n${index + 1}. ${error.message}`);
      console.log(`   Time: ${error.timestamp}`);
    });
    
    console.log('\n📋 NETWORK ERRORS:');
    networkErrors.forEach((error, index) => {
      console.log(`\n${index + 1}. ${error.url}`);
      console.log(`   Status: ${error.status} ${error.statusText}`);
      console.log(`   Time: ${error.timestamp}`);
    });
    
    // Generate investigation recommendations
    console.log('\n🔍 INVESTIGATION RECOMMENDATIONS:');
    
    if (jsErrors.length > 0) {
      console.log('\n1. JAVASCRIPT ERRORS - Check these files:');
      jsErrors.forEach(error => {
        console.log(`   - ${error.filename} (Line ${error.lineno})`);
      });
    }
    
    if (networkErrors.length > 0) {
      console.log('\n2. NETWORK ERRORS - Check these endpoints:');
      networkErrors.forEach(error => {
        console.log(`   - ${error.url} (Status: ${error.status})`);
      });
    }
    
    if (promiseErrors.length > 0) {
      console.log('\n3. PROMISE REJECTIONS - Check async operations:');
      promiseErrors.forEach(error => {
        console.log(`   - ${error.message}`);
      });
    }
    
    // Return structured data for further analysis
    return {
      errors: errors,
      warnings: warnings,
      networkErrors: networkErrors,
      summary: {
        totalErrors: errors.length,
        totalWarnings: warnings.length,
        totalNetworkErrors: networkErrors.length
      }
    };
  };
  
  // Function to generate spec-kit investigation template
  window.generateInvestigationTemplate = function() {
    const analysis = window.analyzeErrors();
    
    console.log('\n📝 SPEC-KIT INVESTIGATION TEMPLATE:');
    console.log('=====================================');
    
    analysis.errors.forEach((error, index) => {
      console.log(`\n## Error Investigation: ${error.type} #${index + 1}`);
      console.log('\n### Error Details');
      console.log(`- **Message**: ${error.message}`);
      console.log(`- **File**: ${error.filename || 'N/A'}`);
      console.log(`- **Line**: ${error.lineno || 'N/A'}`);
      console.log(`- **Time**: ${error.timestamp}`);
      
      console.log('\n### Files to Investigate');
      if (error.filename) {
        console.log(`1. ${error.filename} (Primary error source)`);
        console.log('2. Check related component files');
        console.log('3. Check service files that use this component');
        console.log('4. Check API endpoints if network related');
        console.log('5. Check Redux store and actions');
      }
      
      console.log('\n### Investigation Steps');
      console.log('1. **Read all files**: Examine the error source and related files');
      console.log('2. **Cross-reference**: Check imports and dependencies');
      console.log('3. **Process flow**: Trace the complete data flow');
      console.log('4. **Root cause**: Identify the underlying issue');
      console.log('5. **Solution**: Implement fix following Kelmah patterns');
      
      console.log('\n### Suggested Fixes');
      if (error.message.includes('undefined')) {
        console.log('- Add null checks and default values');
        console.log('- Implement safe defaults pattern');
      }
      if (error.message.includes('Cannot read property')) {
        console.log('- Add property validation');
        console.log('- Implement graceful degradation');
      }
      if (error.message.includes('Network')) {
        console.log('- Check API Gateway routing');
        console.log('- Verify service health endpoints');
        console.log('- Check authentication tokens');
      }
    });
  };
  
  // Function to check service health
  window.checkServiceHealth = async function() {
    console.log('\n🏥 CHECKING SERVICE HEALTH...');
    
    const services = [
      '/api/health',
      '/api/auth/health',
      '/api/users/health',
      '/api/jobs/health',
      '/api/messages/health',
      '/api/payments/health',
      '/api/reviews/health'
    ];
    
    for (const service of services) {
      try {
        const response = await fetch(service);
        const status = response.ok ? '✅' : '❌';
        console.log(`${status} ${service}: ${response.status} ${response.statusText}`);
      } catch (error) {
        console.log(`❌ ${service}: ${error.message}`);
      }
    }
  };
  
  // Function to check authentication status
  window.checkAuthStatus = function() {
    console.log('\n🔐 CHECKING AUTHENTICATION STATUS...');
    
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log(`Token exists: ${token ? '✅' : '❌'}`);
    console.log(`User data exists: ${user ? '✅' : '❌'}`);
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        console.log(`Token expired: ${isExpired ? '❌' : '✅'}`);
        console.log(`Token expires: ${new Date(payload.exp * 1000).toISOString()}`);
      } catch (error) {
        console.log(`Token invalid: ❌ ${error.message}`);
      }
    }
  };
  
  console.log('\n🛠️  Available Commands:');
  console.log('- analyzeErrors() - Analyze all captured errors');
  console.log('- generateInvestigationTemplate() - Generate spec-kit template');
  console.log('- checkServiceHealth() - Check all service health endpoints');
  console.log('- checkAuthStatus() - Check authentication status');
  console.log('\n💡 Start by running: analyzeErrors()');
  
})();
