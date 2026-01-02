"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class EditorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render shows the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error("❌ [ErrorBoundary] Caught error:", error);
    console.error("❌ [ErrorBoundary] Error info:", errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send to error reporting service (Sentry, etc.)
    // reportError(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
            {/* Error Icon */}
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            {/* Error Title */}
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">
              Something Went Wrong
            </h1>

            {/* Error Description */}
            <p className="text-gray-600 text-center mb-8">
              The editor encountered an unexpected error. Don't worry - your data is safe.
              Try reloading the editor or going back to the homepage.
            </p>

            {/* Error Details (Collapsible) */}
            {this.state.error && (
              <details className="mb-8 bg-gray-50 rounded-lg p-4">
                <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                  Technical Details
                </summary>
                <div className="mt-4 space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Error Message:</p>
                    <p className="text-sm text-red-600 font-mono bg-red-50 p-2 rounded">
                      {this.state.error.message}
                    </p>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Stack Trace:</p>
                      <pre className="text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                <RefreshCw className="w-5 h-5" />
                Reload Editor
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
              >
                <Home className="w-5 h-5" />
                Go to Homepage
              </button>
              <button
                onClick={this.handleReset}
                className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors font-semibold"
              >
                Try Again
              </button>
            </div>

            {/* Help Text */}
            <p className="text-sm text-gray-500 text-center mt-8">
              If this problem persists, please contact support with the error details above.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
