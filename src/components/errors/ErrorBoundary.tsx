import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Raakky App Boundary caught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-raakky-cream flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-100 text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-red-50 text-raakky-red flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle size={32} strokeWidth={2.2} />
            </div>

            <div>
              <h2 className="text-xl font-black text-neutral-900 font-sans tracking-tight">
                Something went wrong
              </h2>
              <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                An unexpected error occurred while loading this page. Your cart items and order records are safely preserved.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl bg-raakky-red hover:bg-raakky-red-dark text-white text-xs font-bold flex items-center justify-center gap-2 shadow-spicy transition-all"
              >
                <RefreshCw size={15} />
                <span>Try Again</span>
              </button>
              <button
                onClick={this.handleHome}
                className="flex-1 py-3 px-4 rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Home size={15} />
                <span>Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
