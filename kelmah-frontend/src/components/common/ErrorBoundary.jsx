import React from 'react';
import { Button, Card } from './DesignSystem';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ 
      error, 
      errorInfo 
    });
    
    // Log the error to an error reporting service
    console.error('Uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100 p-4">
          <Card className="max-w-md w-full text-center space-y-4">
            <div className="text-kelmah-accent text-6xl mb-4">🚨</div>
            <h2 className="text-2xl font-bold text-gray-800">Something Went Wrong</h2>
            <p className="text-gray-600 mb-4">
              We apologize for the inconvenience. Please try again or contact support.
            </p>
            
            {this.state.error && (
              <details 
                className="text-left bg-gray-50 p-3 rounded-md max-h-48 overflow-auto text-sm"
              >
                <summary>Error Details</summary>
                <pre className="text-kelmah-accent whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                </pre>
                <pre className="text-gray-600 whitespace-pre-wrap break-words">
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex justify-center space-x-4">
              <Button 
                variant="primary" 
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
              <Button 
                variant="secondary" 
                onClick={this.handleReset}
              >
                Reset
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;